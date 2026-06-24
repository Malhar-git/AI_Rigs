package com.airigs.modules.build.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

/**
 * HTTP client for the Google Gemini API (generateContent endpoint).
 *
 * API reference:
 *   POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 *   Header: x-goog-api-key: YOUR_KEY
 *
 * Request body shape:
 * {
 *   "system_instruction": { "parts": [{ "text": "..." }] },
 *   "contents": [
 *     { "role": "user", "parts": [{ "text": "..." }] }
 *   ],
 *   "generationConfig": {
 *     "temperature": 0.2,
 *     "maxOutputTokens": 2048,
 *     "responseMimeType": "application/json"
 *   }
 * }
 *
 * Response body shape:
 * {
 *   "candidates": [
 *     {
 *       "content": {
 *         "parts": [{ "text": "...JSON string..." }]
 *       }
 *     }
 *   ]
 * }
 *
 * Config in application-dev.yml:
 *   app.gemini.api-key:    ${GEMINI_API_KEY}
 *   app.gemini.model:      gemini-2.5-flash
 *   app.gemini.max-tokens: 2048
 */

@Component
public class GeminiClient {
    private static final Logger log =  LoggerFactory.getLogger(GeminiClient.class);

    private final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";

    @Value("${app.gemini.api-key}")
    private String apiKey;

    @Value("${app.gemini.model:gemini-2.5-flash}")
    private String model;

    @Value("${app.gemini.max-token:2048}")
    private Integer maxTokens;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiClient(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Sends a system instruction + user prompt to Gemini.
     *
     * @param systemPrompt  Role instructions, rules, and output schema
     * @param userPrompt    User requirements + filtered product catalog
     * @return              Raw text response from Gemini (should be JSON)
     */
    public String generate(String systemPrompt, String userPrompt){
        String url = String.format(BASE_URL, model);

        log.info("Calling Gemini API [model={}] - prompt length: {} chars", model,  userPrompt.length() );

        try{
            HttpHeaders header = new HttpHeaders();
            header.setContentType(MediaType.APPLICATION_JSON);
            header.set("x-goog-api-key", apiKey);

            String body = buildRequestBody(systemPrompt, userPrompt);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(body, header), String.class);
            if(response.getStatusCode() != HttpStatus.OK || response.getBody() == null){
                throw new GeminiApiException(
                        "Gemini API returned status: " + response.getStatusCode()
                );
            }

            String content = extractContent(response.getBody());
            log.info("Gemini API returned content: {}", content.length());
            return content;
        }catch(HttpClientErrorException e){
            log.error("Gemini API client error [{}]: {}", e.getMessage(), e.getResponseBodyAsString());

            throw new GeminiApiException(
                    "Gemini API error" + e.getStatusCode() + ": " + e.getMessage()
            );
        }catch (GeminiApiException e){
            throw e;
        } catch (Exception e) {
            log.error("Gemini API client error [{}]: {}", e.getMessage(), e.getStackTrace());
            throw new GeminiApiException("Gemini API call failed" + e.getMessage());
        }
    }

//    Request Builder
    private String buildRequestBody(String systemPrompt, String userPrompt){
        try{
            ObjectNode root = new ObjectMapper().createObjectNode();

            // System Instruction
            ObjectNode systemInstruction = objectMapper.createObjectNode();
            ArrayNode sysParts          = objectMapper.createArrayNode();
            ObjectNode sysPart           = objectMapper.createObjectNode();
            sysPart.put("text", systemPrompt);
            sysParts.add(sysPart);
            systemInstruction.set("parts", sysParts);
            root.set("system_instruction", systemInstruction);

            // User message
            ArrayNode  contents  = objectMapper.createArrayNode();
            ObjectNode userMsg   = objectMapper.createObjectNode();
            userMsg.put("role", "user");
            ArrayNode  userParts = objectMapper.createArrayNode();
            ObjectNode userPart  = objectMapper.createObjectNode();
            userPart.put("text", userPrompt);
            userParts.add(userPart);
            userMsg.set("parts", userParts);
            contents.add(userMsg);
            root.set("contents", contents);

            // Generation config
            // responseMimeType = application/json tells Gemini to return
            // valid JSON — equivalent to Claude's "respond only with JSON" instruction
            ObjectNode genConfig = objectMapper.createObjectNode();
            genConfig.put("temperature",       0.2);     // low temp for deterministic builds
            genConfig.put("maxOutputTokens",   maxTokens);
            genConfig.put("responseMimeType",  "application/json");
            root.set("generationConfig", genConfig);

            return objectMapper.writeValueAsString(root);
        }catch(Exception e){
            throw new GeminiApiException("Failed to build Gemini request: " + e.getMessage());
        }
    }

//    Response Extractor
    /**
     * Extracts text from:
     * response.candidates[0].content.parts[0].text
     */
    private String extractContent(String responseBody){
        try{
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");

            if(!candidates.isArray() || candidates.isEmpty()){
                log.error("Gemini response has no candidates: {}", responseBody);
                throw new GeminiApiException("Gemini response has no candidates");
            }
            JsonNode firstCandidate = candidates.get(0);

            String finishReason = firstCandidate.path("finishReason").asText("");
            if("SAFETY".equals(finishReason)){
                log.warn("Gemini has blocked response due to safety filters");
                throw new GeminiApiException(
                        "Gemini blocked the response due to safety filters. " +
                                "Try rephrasing the system prompt."
                );
            }

            JsonNode part = firstCandidate.path("content").path("parts");
            if(!part.isArray() || part.isEmpty()){
                throw new GeminiApiException("Gemini response has no content parts");
            }

            String text = part.get(0).path("text").asText("").trim();
            if (text.isEmpty()) {
                throw new GeminiApiException("Gemini response text is empty");
            }

            return text;
        } catch(GeminiApiException e){
            throw e;
        } catch (Exception e) {
            throw new GeminiApiException("Failed to parse Gemini response: " + e.getMessage());
        }
    }
    // ─── Exception ────────────────────────────────────────────────────────────

    public static class GeminiApiException extends RuntimeException {
        public GeminiApiException(String message) { super(message); }
    }
}
