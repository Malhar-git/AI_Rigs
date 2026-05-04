package com.airigs.common.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Stateless parsing helpers shared across scraper jobs and service layer.
 *
 * All methods are null-safe. They return null (or a default) instead of
 * throwing on bad input so a single malformed field never aborts a full sync.
 *
 * Usage:
 *   BigDecimal tps  = ParseUtil.decimalBeforeMarker(text, "tokens/s generation");
 *   Integer    score = ParseUtil.intBeforeMarker(text, "LocalScore");
 *   String     cpu  = ParseUtil.textBetween(text, "SYSTEM CPU ", " RAM ");
 */
public final class ParseUtil {

    private static final Logger log = LoggerFactory.getLogger(ParseUtil.class);

    private ParseUtil() {
    }

    // -- Numeric extraction --------------------------------------------------

    /**
     * Finds the last numeric token in the 40 chars immediately before a marker.
     *
     * "69.6 tokens/s generation" with marker "tokens/s generation" -> 69.6
     */
    public static BigDecimal decimalBeforeMarker(String text, String marker) {
        if (text == null || marker == null) return null;
        int idx = text.indexOf(marker);
        if (idx < 0) return null;

        String before = text.substring(Math.max(0, idx - 40), idx).trim();
        String[] tokens = before.split("\\s+");

        for (int i = tokens.length - 1; i >= 0; i--) {
            try {
                String clean = tokens[i].replaceAll("[^0-9.]", "");
                if (!clean.isEmpty()) return new BigDecimal(clean);
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }

    /**
     * Same as decimalBeforeMarker but returns Integer.
     */
    public static Integer intBeforeMarker(String text, String marker) {
        BigDecimal val = decimalBeforeMarker(text, marker);
        return val != null ? val.intValue() : null;
    }

    /**
     * Safely parses a raw string to BigDecimal, stripping non-numeric chars.
     * Returns null on failure and never throws.
     *
     * "125.6GB" -> 125.6
     * "3,552"   -> 3552
     */
    public static BigDecimal parseBigDecimal(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            String clean = raw.replaceAll("[^0-9.]", "").trim();
            return clean.isEmpty() ? null : new BigDecimal(clean);
        } catch (NumberFormatException e) {
            log.debug("Could not parse BigDecimal from: '{}'", raw);
            return null;
        }
    }

    /**
     * Safely parses a raw string to Integer, stripping non-numeric chars.
     * Returns null on failure.
     *
     * "3,552 votes" -> 3552
     */
    public static Integer parseInteger(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            String clean = raw.replaceAll("[^0-9]", "").trim();
            return clean.isEmpty() ? null : Integer.parseInt(clean);
        } catch (NumberFormatException e) {
            log.debug("Could not parse Integer from: '{}'", raw);
            return null;
        }
    }

    // -- VRAM / GB extraction -----------------------------------------------

    /**
     * Finds the first "NN GB" or "NN.N GB" pattern after a given anchor string.
     *
     * "NVIDIA GeForce RTX 4090 GPU 24 GB Qwen..." with anchor "RTX 4090"
     *   -> looks 80 chars after anchor -> returns 24.0
     */
    public static BigDecimal extractGbAfterAnchor(String text, String anchor) {
        if (text == null || anchor == null) return null;
        int idx = text.indexOf(anchor);
        if (idx < 0) return null;

        int searchStart = idx + anchor.length();
        int searchEnd = Math.min(searchStart + 80, text.length());
        String window = text.substring(searchStart, searchEnd);

        Matcher m = Pattern.compile("(\\d+\\.?\\d*)\\s+GB").matcher(window);
        if (m.find()) {
            return parseBigDecimal(m.group(1));
        }
        return null;
    }

    // -- TTFT normalisation -------------------------------------------------

    /**
     * Extracts time-to-first-token and always returns milliseconds.
     *
     * Handles two formats found in localscore.ai:
     *   "317 ms time to first token"   -> 317.0
     *   "5.79 sec time to first token" -> 5790.0
     */
    public static BigDecimal extractTtftMs(String text) {
        if (text == null) return null;
        int idx = text.indexOf("time to first token");
        if (idx < 0) return null;

        String before = text.substring(Math.max(0, idx - 30), idx).trim();
        String[] tokens = before.split("\\s+");

        BigDecimal value = null;
        String unit = "ms";

        for (int i = tokens.length - 1; i >= 0; i--) {
            String t = tokens[i].toLowerCase();
            if (t.equals("ms") || t.equals("sec")) {
                unit = t;
            } else {
                try {
                    value = new BigDecimal(t.replaceAll("[^0-9.]", ""));
                    break;
                } catch (NumberFormatException ignored) {
                }
            }
        }

        if (value == null) return null;
        return "sec".equals(unit)
                ? value.multiply(BigDecimal.valueOf(1000))
                : value;
    }

    // -- String extraction ---------------------------------------------------

    /**
     * Extracts text strictly between a start label and an end label.
     *
     * textBetween(text, "SYSTEM CPU ", " RAM ")
     *   -> "AMD Ryzen Threadripper 3990X 64-Core Processor (znver2)"
     *
     * Returns null if either label is not found.
     * Returns up to 200 chars after startLabel if endLabel is absent.
     */
    public static String textBetween(String text, String startLabel, String endLabel) {
        if (text == null || startLabel == null) return null;

        int start = text.indexOf(startLabel);
        if (start < 0) return null;
        start += startLabel.length();

        if (endLabel == null) {
            return text.substring(start, Math.min(start + 200, text.length())).trim();
        }

        int end = text.indexOf(endLabel, start);
        if (end < 0) {
            return text.substring(start, Math.min(start + 200, text.length())).trim();
        }

        return text.substring(start, end).trim();
    }

    /**
     * Extracts text after a label up to the next whitespace block.
     * Useful for single-word values like OS name, runtime name.
     *
     * extractWord(text, "OS ") -> "Linux"
     */
    public static String extractWord(String text, String label) {
        if (text == null || label == null) return null;
        int idx = text.indexOf(label);
        if (idx < 0) return null;

        String after = text.substring(idx + label.length()).trim();
        String[] parts = after.split("\\s+", 2);
        return parts.length > 0 ? parts[0].trim() : null;
    }

    // -- Accelerator type ----------------------------------------------------

    /**
     * Determines GPU or CPU from the 15-char window immediately after the
     * accelerator name. Avoids false positives from "CPU" appearing later
     * in the SYSTEM section.
     *
     * "NVIDIA GeForce RTX 4090 GPU 24 GB"   -> "GPU"
     * "Intel Core Ultra X7 358H CPU 31.3 GB" -> "CPU"
     */
    public static String extractAcceleratorType(String text, String acceleratorName) {
        if (text == null || acceleratorName == null) return "GPU";

        int idx = text.indexOf(acceleratorName);
        if (idx < 0) return "GPU";

        int afterIdx = idx + acceleratorName.length();
        String window = text.substring(afterIdx,
                Math.min(afterIdx + 15, text.length())).trim();

        if (window.startsWith("GPU")) return "GPU";
        if (window.startsWith("CPU")) return "CPU";

        String lower = acceleratorName.toLowerCase();
        if (lower.contains("geforce") || lower.contains("radeon") ||
                lower.contains("arc") || lower.contains("apple m") ||
                lower.contains("rtx") || lower.contains("gtx")) {
            return "GPU";
        }

        return "CPU";
    }

    // -- Quantization extraction ---------------------------------------------

    /**
     * Extracts a quantization string from text following the model name.
     * Matches patterns like: Q4_K - Medium, Q8_0, Q5_K_M, F16
     *
     * "Qwen2.5 14B Instruct Q4_K - Medium 14.8Bparams"
     *   with modelName "Qwen2.5 14B Instruct" -> "Q4_K - Medium"
     */
    public static String extractQuantization(String text, String modelName) {
        if (text == null || modelName == null) return null;

        int idx = text.indexOf(modelName);
        if (idx < 0) return null;

        int afterIdx = idx + modelName.length();
        String after = text.substring(afterIdx,
                Math.min(afterIdx + 60, text.length())).trim();

        Matcher m = Pattern.compile("(Q\\d[\\w]*(\\s+-\\s+\\w+)?|F16|F32|BF16)")
                .matcher(after);
        return m.find() ? m.group(0).trim() : null;
    }

    // -- LocalScore metrics block -------------------------------------------

    /**
     * Extracts the narrow metrics block between "Bparams" and "HOW YOU STACK UP".
     * All metric parsing (gen TPS, prompt TPS, TTFT, LocalScore) should operate
     * on this block to avoid false matches in the nav, footer, and chart sections.
     *
     * Returns the full text unchanged if boundary markers are not found.
     */
    public static String extractMetricsBlock(String text) {
        if (text == null) return null;
        int start = text.indexOf("Bparams");
        int end = text.indexOf("HOW YOU STACK UP");
        if (start < 0 || end < 0 || start >= end) return text;
        return text.substring(start, end);
    }

    /**
     * Extracts LocalScore integer from the metrics block only.
     * Avoids the false "LocalScore" matches in nav links and footer.
     */
    public static Integer extractLocalscore(String text) {
        String block = extractMetricsBlock(text);
        if (block == null) return null;
        return intBeforeMarker(block, "LocalScore");
    }

    // -- Date parsing --------------------------------------------------------

    private static final DateTimeFormatter LOCALSCORE_DATE_FMT =
            DateTimeFormatter.ofPattern("MM/dd/yyyy - h:mm a", Locale.ENGLISH);

    /**
     * Parses localscore.ai date format: "04/02/2026 - 4:07 PM"
     * Returns LocalDateTime.now() as fallback if pattern not found.
     */
    public static LocalDateTime parseLocalScoreDate(String text) {
        if (text == null) return LocalDateTime.now();

        Matcher m = Pattern.compile(
                "(\\d{2}/\\d{2}/\\d{4} - \\d{1,2}:\\d{2} (?:AM|PM))")
                .matcher(text);
        if (!m.find()) return LocalDateTime.now();

        try {
            return LocalDateTime.parse(m.group(1), LOCALSCORE_DATE_FMT);
        } catch (Exception e) {
            log.warn("Could not parse date '{}': {}", m.group(1), e.getMessage());
            return LocalDateTime.now();
        }
    }

    // -- Trailing ID from URL path ------------------------------------------

    /**
     * Extracts trailing integer ID from a URL path segment.
     *
     * "/accelerator/77" -> 77
     * "/result/3224"    -> 3224
     *
     * Returns 0 on failure.
     */
    public static int trailingId(String href) {
        if (href == null) return 0;
        try {
            String[] parts = href.split("/");
            return Integer.parseInt(parts[parts.length - 1].trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
