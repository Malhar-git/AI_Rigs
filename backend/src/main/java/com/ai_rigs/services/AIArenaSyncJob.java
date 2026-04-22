package com.ai_rigs.services;

import com.ai_rigs.model_benchmarks.ModelBenchmarkRepository;
import com.ai_rigs.sync_log.SyncLogRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;

@Service
public class AIArenaSyncJob {
    private static final String SOURCE = "arena.ai";
    private static final String CATEGORY = "coding";

    private final ModelBenchmarkRepository modelBenchmarkRepo;
    private final SyncLogRepository syncLogRepo;

    public AIArenaSyncJob(ModelBenchmarkRepository modelBenchmarkRepo, SyncLogRepository syncLogRepo) {
        this.modelBenchmarkRepo = modelBenchmarkRepo;
        this.syncLogRepo = syncLogRepo;
    }

    @Scheduled(cron = "0 0 12 * * *")
    public void sync() {
        int upserted = 0;
        String status = "success";

        try {
            Document doc = Jsoup.connect("https://arena.ai/leaderboard/text/coding")
                    .userAgent("Mozilla")
                    .timeout(15000)
                    .get();

            Elements rows = doc.select("table tbody tr");

            for (Element row : rows) {
                Elements cols = row.select("td");
                if (cols.size() < 6) {
                    continue;
                }

                String rankText = cols.get(0).text().trim();
                String modelText = cols.get(2).text().trim(); //Model Column
                String scoreText = cols.get(3).text().trim(); //Score
                String votesText = cols.get(4).text().trim(); //Votes
                String priceText = cols.get(5).text().trim(); //Prices $/M
                String contextText = cols.size() > 6 ? cols.get(6).text().trim() : null;

                // Parse score — "1521±15" → split on "±"
                String[] scoreParts = scoreText.split("±");
                int score = 0;
                int confidence = 0;
                try {
                    score = Integer.parseInt(scoreParts[0].trim());
                    confidence = scoreParts.length > 1 ? Integer.parseInt(scoreParts[1].trim()) : 0;
                } catch (NumberFormatException ignored) {
                }

                // Extract model name and provider from the cell
                // The cell contains provider name + model name concatenated
                // e.g. "Anthropic claude-opus-4" → split on first space
                Element modelLink = cols.get(2).selectFirst("a");
                String modelName = modelLink != null ? modelLink.text().trim() : modelText;

                // Extract license from the cell text after the model link
                // Format: "Provider · LicenseType"
                String cellFull = cols.get(2).text().trim();
                String license = extractLicense(cellFull);
                int rank = 0;
                try {
                    rank = Integer.parseInt(rankText);
                } catch (NumberFormatException ignored) {
                }

                modelBenchmarkRepo.upsertByModelNameAndCategory(
                        modelName,
                        rank,
                        score,
                        confidence,
                        parseVotes(votesText),
                        license,
                        priceText,
                        contextText,
                        CATEGORY,
                        SOURCE,
                        LocalDateTime.now()
                );
                upserted++;
            }
        } catch (IOException e) {
            status = buildFailureStatus(e);
        }

        syncLogRepo.insertLogEntry(SOURCE, status, upserted, LocalDateTime.now());
    }

    private String extractLicense(String cellText) {
        // Cell text looks like: "Anthropic claude-opus-4-6 Anthropic · Proprietary"
        if (cellText.contains("MIT"))         return "MIT";
        if (cellText.contains("Apache"))      return "Apache 2.0";
        if (cellText.contains("Proprietary")) return "Proprietary";
        if (cellText.contains("Modified"))    return "Modified MIT";
        return "unknown";
    }

    private int parseVotes(String text) {
        // "3,552" → remove commas → parse
        try { return Integer.parseInt(text.replace(",", "").trim()); }
        catch (NumberFormatException e) { return 0; }
    }

    private String buildFailureStatus(IOException e) {
        String message = e.getMessage() == null ? "unknown_error" : e.getMessage();
        String full = "failed: " + message;
        return full.length() > 255 ? full.substring(0, 255) : full;
    }
}
