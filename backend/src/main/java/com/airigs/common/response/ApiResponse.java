package com.airigs.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

import java.util.Map;

/**
 * Standard API response envelope for every endpoint.
 *
 * Every response from the AI Rigs API has this shape:
 * {
 *   "success": true,
 *   "message": null,
 *   "data": { ... }
 * }
 *
 * On error:
 * {
 *   "success": false,
 *   "message": "Resource not found: GPU result 999",
 *   "data": null
 * }
 *
 * On validation error:
 * {
 *   "success": false,
 *   "message": "Request validation failed",
 *   "data": {
 *     "budget": "Essentials tier cannot support Llama 70B",
 *     "model":  "Select a smaller model or increase your budget"
 *   }
 * }
 *
 * JsonInclude.NON_NULL suppresses null fields so responses stay clean.
 */
@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean success;
    private final String  message;
    private final T       data;

    private ApiResponse(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data    = data;
    }

    // ── Success factories ─────────────────────────────────────────────────────

    /** 200 with a data payload */
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, null, data);
    }

    /** 200 with data + an informational message */
    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(true, message, data);
    }

    /** 201 / 204 — success with no body (delete, trigger sync, etc.) */
    public static ApiResponse<Void> ok() {
        return new ApiResponse<>(true, null, null);
    }

    // ── Error factories ───────────────────────────────────────────────────────

    /** 400 / 404 / 500 — simple error message */
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }

    /**
     * 400 validation error with per-field breakdown.
     * Cast to ApiResponse<Map<String,String>> at call site.
     */
    public static ApiResponse<Map<String, String>> validationError(
            String message, Map<String, String> fieldErrors) {
        return new ApiResponse<>(false, message, fieldErrors);
    }
}