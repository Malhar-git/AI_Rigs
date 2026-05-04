package com.airigs.common.exception;

import com.airigs.common.response.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.HashMap;
import java.util.Map;

/**
 * Central error handler — every exception thrown anywhere in the application
 * lands here and gets converted into a consistent ApiResponse JSON shape.
 *
 * Frontend always receives:
 * {
 *   "success": false,
 *   "message": "human-readable error",
 *   "data": null          // or field-error map for validation errors
 * }
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ── 404 Not Found ─────────────────────────────────────────────────────────
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(
            ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }

    // ── 400 Business validation ───────────────────────────────────────────────
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiResponse<?>> handleValidation(
            ValidationException ex) {
        log.warn("Validation failed: {}", ex.getMessage());

        if (ex.hasFieldErrors()) {
            // return per-field errors so the frontend can highlight specific fields
            return ResponseEntity
                    .badRequest()
                    .body(ApiResponse.validationError(ex.getMessage(), ex.getErrors()));
        }

        return ResponseEntity
                .badRequest()
                .body(ApiResponse.error(ex.getMessage()));
    }

    // ── 400 @Valid / @Validated bean validation ───────────────────────────────
    // Triggered by @RequestBody validation failures on DTOs
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleBeanValidation(
            MethodArgumentNotValidException ex) {

        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fe.getField(), fe.getDefaultMessage());
        }

        log.warn("Bean validation failed: {}", fieldErrors);

        return ResponseEntity
                .badRequest()
                .body(ApiResponse.validationError("Request validation failed", fieldErrors));
    }

    // ── 400 Missing required query param ──────────────────────────────────────
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingParam(
            MissingServletRequestParameterException ex) {
        String message = String.format("Required parameter '%s' is missing",
                ex.getParameterName());
        log.warn(message);
        return ResponseEntity
                .badRequest()
                .body(ApiResponse.error(message));
    }

    // ── 400 Wrong type for query param (e.g. string passed for int) ───────────
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex) {
        String message = String.format(
                "Parameter '%s' should be of type %s",
                ex.getName(),
                ex.getRequiredType() != null
                        ? ex.getRequiredType().getSimpleName()
                        : "unknown");
        log.warn(message);
        return ResponseEntity
                .badRequest()
                .body(ApiResponse.error(message));
    }

    // ── 500 Catch-all ─────────────────────────────────────────────────────────
    // Never expose internal details to the client — log the full stack trace
    // server-side but return a generic message
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleAll(Exception ex) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(
                        "An unexpected error occurred. Please try again later."));
    }
}