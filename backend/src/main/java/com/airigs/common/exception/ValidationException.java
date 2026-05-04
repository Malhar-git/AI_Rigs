package com.airigs.common.exception;

import java.util.HashMap;
import java.util.Map;

public class ValidationException extends RuntimeException {
    // field → error message pairs, shown to the frontend per-field
    private final Map<String, String> errors = new HashMap<String, String>();

    public ValidationException(String message) {
        super(message);
    }

    public ValidationException addError(String field, String message) {
        this.errors.put(field, message);
        return this;  // fluent — chain multiple addError() calls
    }

    public Map<String, String> getErrors() {
        return errors;
    }

    public boolean hasFieldError() {
        return !errors.isEmpty();
    }
}
/**
 * Thrown when business-level validation fails — distinct from
 * Spring's @Valid bean validation which throws MethodArgumentNotValidException.
 *
 * Use this for domain rules that can't be expressed as annotations:
 *   - VRAM floor exceeds budget capacity
 *   - Selected model incompatible with chosen precision
 *   - Build total exceeds declared budget
 *
 * Maps to HTTP 400 via GlobalExceptionHandler.
 *
 * Usage:
 *   throw new ValidationException("Budget too low for selected model VRAM requirement");
 *
 *   throw new ValidationException("Wizard answers invalid")
 *       .addError("budget", "Essentials tier cannot support Llama 70B (needs ≥40GB VRAM)")
 *       .addError("model",  "Select a smaller model or increase your budget");
 */
