package com.ai_rigs.gpu_benchmarks;

import com.ai_rigs.gpu_benchmarks.domain.GpuBenchmarkDetails;
import com.ai_rigs.gpu_benchmarks.domain.GpuBenchmarkResult;
import com.ai_rigs.sync_log.SyncLogRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class LocalScoreSyncJob {
    private static final Logger log = LoggerFactory.getLogger(LocalScoreSyncJob.class);
    private static final String SOURCE = "localscore.ai";

    private final GpuBenchmarkResultRepository resultRepo;
    private final SyncLogRepository syncLogRepo;

    private static final String BASE = "https://www.localscore.ai";
    private static final int PAGE_SIZE = 10;

    private final long requestDelayMs;
    private final int requestMaxRetries;
    private final AtomicBoolean backfillInProgress = new AtomicBoolean(false);

    public LocalScoreSyncJob(
            GpuBenchmarkResultRepository resultRepo,
            SyncLogRepository syncLogRepo,
            @Value("${app.sync.localscore.request-delay-ms:1200}") long requestDelayMs,
            @Value("${app.sync.localscore.request-max-retries:3}") int requestMaxRetries) {
        this.resultRepo = resultRepo;
        this.syncLogRepo = syncLogRepo;
        this.requestDelayMs = requestDelayMs;
        this.requestMaxRetries = Math.max(requestMaxRetries, 1);
    }

    //Daily incremental sync - only fetches new results
    @Scheduled(cron = "0 0 4 * * *")
    public void syncIncremental(){
        if (backfillInProgress.get()) {
            log.info("Skipping incremental LocalScore sync because a backfill is already running");
            return;
        }
        int maxKnown = resultRepo.findMaxTestId().orElse(0);
        sync(maxKnown, false);
    }

    //Run once manually to backfill all historical results
    @SuppressWarnings("unused")
    public void backfillAll(){
        if (!backfillInProgress.compareAndSet(false, true)) {
            log.warn("LocalScore backfill is already running; ignoring duplicate trigger");
            return;
        }
        try {
            sync(0, true);
        } finally {
            backfillInProgress.set(false);
        }
    }

    public void sync(int stopAtTestId, boolean isBackfill){
        int upserted = 0;
        int offset = 0;
        String status = "success";

        try{
            while(true){
                String url = BASE + "/latest?offset=" + offset;
                Document doc = fetchDocument(url);

                List<Element> cards = doc.select("a[href^=/result/]").stream()
                        .filter(a -> a.attr("href").matches("/result/\\d+"))
                        .toList();

                if(cards.isEmpty()) break; // no more pages

                boolean hitKnown = false;
                List<GpuBenchmarkResult> pageResults = new ArrayList<>();

                for(Element card : cards){
                    int testId = parseTestId(card.attr("href"));

                    // incremental: stop when we reach IDs we already have
                    if(!isBackfill && testId <= stopAtTestId){
                        hitKnown = true;
                        break;
                    }

                    if(resultRepo.existsByLocalscoreTestId(testId)) {
                        continue;
                    }

                    // fetch the detail page for full data
                    GpuBenchmarkResult result = scrapeResultPage(testId);
                    if(result != null){
                        pageResults.add(result);
                    }

                    sleepRespectingInterrupt(requestDelayMs);
                }

                if (!pageResults.isEmpty()) {
                    resultRepo.saveAllAndFlush(pageResults);
                    upserted += pageResults.size();
                    log.info("LocalScore sync progress: upserted={} offset={}", upserted, offset);
                }

                if (hitKnown) {
                    break;
                }
                offset += PAGE_SIZE;
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            status = buildFailureStatus(e);
        } catch(Exception e){
            status = buildFailureStatus(e);
        }

        syncLogRepo.insertLogEntry(SOURCE, status, upserted, LocalDateTime.now());
        log.info("LocalScore sync finished: mode={} status={} upserted={}", isBackfill ? "backfill" : "incremental", status, upserted);
    }

    private GpuBenchmarkResult scrapeResultPage(int testId){
        try{
            Document doc = fetchDocument(BASE + "/result/" + testId);

            // Parse against a single normalized text block to avoid newline-dependent nulls.
            String text = doc.text();

            // --- Date ---
            LocalDateTime testedAt = parseDate(text);

            // ---Accelerator--
            Element accelLink = doc.selectFirst("a[href^=/accelerator/]");
            String acceleratorName = accelLink != null
                    ? accelLink.text().replace("\n", " ").trim() : "Unknown";

            int accelId = accelLink != null ? parseTrailingId(accelLink.attr("href")) : 0;

            String accelType = extractAccelType(text, acceleratorName);

            BigDecimal vramGb = extractVramGb(text, acceleratorName);

            // --- Model ---
            Element modelLink = doc.selectFirst("a[href^=/model/]");
            String modelName = "";
            String modelQuant = null;

            if (modelLink != null) {
                // .text() captures descendant text and works on pages where wholeOwnText() is sparse.
                String fullText = modelLink.text().trim();
                String wholeText = modelLink.wholeOwnText().trim();
                String source = wholeText.contains("\n") ? wholeText : fullText;

                if (source.contains("\n")) {
                    String[] parts = source.split("\\n", 2);
                    modelName = parts[0].trim();
                    modelQuant = parts.length > 1 ? parts[1].trim() : null;
                } else {
                    Matcher qm = Pattern.compile("^(.*?)\\s+(Q\\d.*)$").matcher(source);
                    if (qm.matches()) {
                        modelName = qm.group(1).trim();
                        modelQuant = qm.group(2).trim();
                    } else {
                        modelName = source;
                    }
                }
            }
            if (modelQuant == null || modelQuant.isBlank()) {
                modelQuant = extractQuantFromText(text, modelName);
            }

            // params — "14.8Bparams" → 14.8
            BigDecimal paramsB = extractBeforeMarker(text, "Bparams");

            // --- Summary metrics ---
            BigDecimal genTps    = extractBeforeMarker(text, "tokens/s generation");
            BigDecimal ttftMs    = extractTtft(text);
            BigDecimal promptTps = extractBeforeMarker(text, "tokens/s prompt");
            Integer    score     = extractLocalscore(text);

            // --- System ---
            String cpuName  = extractAfterLabel(text, "SYSTEM CPU ", " RAM ");
            String ramRaw   = extractAfterLabel(text, " RAM ", " OS ");
            BigDecimal ramGb = parseRamGb(ramRaw);
            String osName   = extractAfterLabel(text, " OS ", " Kernel Release ");

            // --- Runtime ---
            String runtimeName = extractAfterLabel(text, "RUNTIME Name ", " Version ");
            String runtimeVersion = null;
            if (runtimeName != null && !runtimeName.isBlank()) {
                runtimeVersion = extractAfterLabel(
                        text,
                        "RUNTIME Name " + runtimeName + " Version ",
                        " Commit Hash ");
            }
            if (runtimeVersion == null || runtimeVersion.isBlank()) {
                runtimeVersion = extractAfterLabel(text, " Version ", " Commit Hash ");
            }

            // --- Build detail rows ---
            List<GpuBenchmarkDetails> details = scrapeDetails(doc);

            GpuBenchmarkResult result = GpuBenchmarkResult.builder()
                    .localscoreTestId(testId)
                    .testedAt(testedAt)
                    .acceleratorName(acceleratorName)
                    .acceleratorType(accelType)
                    .acceleratorVramGb(vramGb)
                    .localscoreAccelId(accelId)
                    .modelName(modelName)
                    .modelQuantization(modelQuant)
                    .modelParamsB(paramsB)
                    .generationTps(genTps)
                    .promptTps(promptTps)
                    .ttftMs(ttftMs)
                    .localscore(score)
                    .cpuName(cpuName)
                    .systemRamGb(ramGb)
                    .osName(osName)
                    .runtimeName(runtimeName)
                    .runtimeVersion(runtimeVersion)
                    .syncedAt(LocalDateTime.now())
                    .build();

            details.forEach(d -> d.setBenchmarkResult(result));
            result.setDetails(details);

            return result;
        } catch (Exception e) {
            System.err.println("Failed to scrape results: " + testId + e.getMessage());
            return null;
        }
    }

    private List<GpuBenchmarkDetails> scrapeDetails(Document doc){
        List<GpuBenchmarkDetails> details = new ArrayList<>();

        String text = doc.text();
        int start = text.indexOf("DETAILED RESULTS");
        if (start < 0) {
            return details;
        }

        int headerEnd = text.indexOf("TTFT", start);
        if (headerEnd < 0) {
            return details;
        }

        String block = text.substring(headerEnd + 4).trim();

        Pattern pattern = Pattern.compile(
                "(pp\\d+\\+tg\\d+)\\s+([\\d.]+)\\s+tokens/s\\s+([\\d.]+)\\s+tokens/s\\s+([\\d.]+)\\s+(ms|sec)",
                Pattern.CASE_INSENSITIVE);

        Matcher matcher = pattern.matcher(block);
        while (matcher.find()) {
            BigDecimal ttft = new BigDecimal(matcher.group(4));
            if ("sec".equalsIgnoreCase(matcher.group(5))) {
                ttft = ttft.multiply(BigDecimal.valueOf(1000));
            }

            details.add(GpuBenchmarkDetails.builder()
                    .testName(matcher.group(1))
                    .promptTps(new BigDecimal(matcher.group(2)))
                    .generationTps(new BigDecimal(matcher.group(3)))
                    .ttftMs(ttft)
                    .build());
        }
        return details;
    }

    // ── Parsing helpers ──────────────────────────────────────────────────────

    private int parseTestId(String href) {
        return Integer.parseInt(href.replace("/result/", "").trim());
    }

    private BigDecimal extractBeforeMarker(String text, String marker) {
        int idx = text.indexOf(marker);
        if (idx < 0) return null;
        String before = text.substring(Math.max(0, idx - 40), idx).trim();
        String[] tokens = before.split("\\s+");
        for (int i = tokens.length - 1; i >= 0; i--) {
            try {
                String clean = tokens[i].replaceAll("[^0-9.]", "");
                if (!clean.isEmpty()) {
                    return new BigDecimal(clean);
                }
            }
            catch (Exception ignored) {}
        }
        return null;
    }

    private BigDecimal extractTtft(String text) {
        // TTFT can be "317 ms" or "5.79 sec" — normalise to ms
        int idx = text.indexOf("time to first token");
        if (idx < 0) return null;
        String nearby = text.substring(Math.max(0, idx - 30), idx).trim();
        String[] tokens = nearby.split("\\s+");

        BigDecimal value = null;
        String unit = null;
        for (int i = tokens.length - 1; i >= 0; i--) {
            if ("ms".equalsIgnoreCase(tokens[i]) || "sec".equalsIgnoreCase(tokens[i])) {
                unit = tokens[i].toLowerCase(Locale.ENGLISH);
                continue;
            }
            try {
                String clean = tokens[i].replaceAll("[^0-9.]", "");
                if (!clean.isEmpty()) {
                    value = new BigDecimal(clean);
                    break;
                }
            } catch (NumberFormatException ignored) {
                // keep scanning to the left
            }
        }
        if (value == null) {
            return null;
        }
        if ("sec".equals(unit)) {
            return value.multiply(BigDecimal.valueOf(1000));
        }
        return value;
    }

    private String extractAfterLabel(String text, String startLabel, String endLabel) {
        int start = text.indexOf(startLabel);
        if (start < 0) {
            return null;
        }
        start += startLabel.length();
        int end = text.indexOf(endLabel, start);
        if (end < 0) {
            return text.substring(start, Math.min(start + 100, text.length())).trim();
        }
        return text.substring(start, end).trim();
    }

    private String extractAccelType(String text, String acceleratorName) {
        int idx = text.indexOf(acceleratorName);
        if (idx < 0) return "GPU";

        int afterIdx = idx + acceleratorName.length();
        String window = text.substring(afterIdx, Math.min(afterIdx + 15, text.length())).trim();

        if (window.startsWith("GPU")) return "GPU";
        if (window.startsWith("CPU")) return "CPU";

        if (acceleratorName.contains("Apple")
                || acceleratorName.contains("GPU")
                || acceleratorName.contains("GeForce")
                || acceleratorName.contains("Radeon")
                || acceleratorName.contains("Arc")) {
            return "GPU";
        }

        return "CPU";
    }

    private String extractMetricsBlock(String text) {
        int start = text.indexOf("Bparams");
        int end = text.indexOf("HOW YOU STACK UP");
        if (start < 0 || end < 0 || start >= end) {
            return text;
        }
        return text.substring(start, end);
    }

    private Integer extractLocalscore(String text) {
        String block = extractMetricsBlock(text);
        int idx = block.indexOf("LocalScore");
        if (idx < 0) {
            return null;
        }
        String before = block.substring(Math.max(0, idx - 20), idx).trim();
        String[] tokens = before.split("\\s+");
        for (int i = tokens.length - 1; i >= 0; i--) {
            try {
                String cleaned = tokens[i].replaceAll("[^0-9]", "");
                if (!cleaned.isEmpty()) {
                    return Integer.parseInt(cleaned);
                }
            } catch (NumberFormatException ignored) {
                // keep scanning left
            }
        }
        return null;
    }

    private BigDecimal extractVramGb(String text, String acceleratorName) {
        int idx = text.indexOf(acceleratorName);
        if (idx < 0) {
            return null;
        }
        int start = idx + acceleratorName.length();
        String after = text.substring(start, Math.min(start + 80, text.length()));
        Matcher matcher = Pattern.compile("(\\d+\\.?\\d*)\\s+GB").matcher(after);
        if (matcher.find()) {
            try {
                return new BigDecimal(matcher.group(1));
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private String extractQuantFromText(String text, String modelName) {
        int idx = text.indexOf(modelName);
        if (idx < 0) {
            return null;
        }
        int start = idx + modelName.length();
        String after = text.substring(start, Math.min(start + 60, text.length())).trim();
        Matcher matcher = Pattern.compile("(Q\\d[^\\s]*(\\s+-\\s+\\w+)?)").matcher(after);
        return matcher.find() ? matcher.group(1) : null;
    }

    private BigDecimal parseRamGb(String raw) {
        if (raw == null) {
            return null;
        }
        try {
            return new BigDecimal(raw.replaceAll("[^0-9.]", "").trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String buildFailureStatus(Exception e) {
        String message = e.getMessage() == null ? "unknown_error" : e.getMessage();
        String full = "failed: " + message;
        return full.length() > 255 ? full.substring(0, 255) : full;
    }

    private LocalDateTime parseDate(String text) {
        Matcher matcher = Pattern
                .compile("(\\d{2}/\\d{2}/\\d{4} - \\d{1,2}:\\d{2} (?:AM|PM))")
                .matcher(text);
        if (!matcher.find()) {
            return LocalDateTime.now();
        }
        try {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MM/dd/yyyy - h:mm a", Locale.ENGLISH);
            return LocalDateTime.parse(matcher.group(1), fmt);
        } catch (Exception e) {
            return LocalDateTime.now();
        }
    }

    private int parseTrailingId(String href) {
        try {
            String[] parts = href.split("/");
            return Integer.parseInt(parts[parts.length - 1]);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private Document fetchDocument(String url) throws Exception {
        Exception lastException = null;
        for (int attempt = 1; attempt <= requestMaxRetries; attempt++) {
            try {
                return Jsoup.connect(url)
                        .userAgent("Mozilla/5.0 (compatible; AIRigsBot/1.0)")
                        .timeout(15_000)
                        .get();
            } catch (Exception e) {
                lastException = e;
                if (attempt < requestMaxRetries) {
                    log.warn("Retrying LocalScore request (attempt {}/{}): {}", attempt + 1, requestMaxRetries, url);
                    sleepRespectingInterrupt(Math.min(requestDelayMs, 2_000));
                }
            }
        }
        if (lastException != null) {
            throw lastException;
        }
        throw new IllegalStateException("Request failed without a captured exception: " + url);
    }

    private void sleepRespectingInterrupt(long delayMs) throws InterruptedException {
        if (delayMs <= 0) {
            return;
        }
        Thread.sleep(delayMs);
    }
}
