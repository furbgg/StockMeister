
package com.stockmeister.backend.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<Map<String, Object>> handleInsufficientStockException(
            InsufficientStockException ex,
            WebRequest request) {
        String message = ex.getMessage();
        String path = extractPath(request);

        log.warn("Insufficient stock: {} - Path: {}", message, path);

        Map<String, Object> errorResponse = new LinkedHashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        errorResponse.put("status", HttpStatus.BAD_REQUEST.value());
        errorResponse.put("error", "Insufficient Stock");
        errorResponse.put("message", message);
        errorResponse.put("path", path);

        // Include detailed shortage information if available
        if (ex.getShortages() != null && !ex.getShortages().isEmpty()) {
            List<Map<String, Object>> shortageDetails = ex.getShortages().stream()
                    .map(s -> {
                        Map<String, Object> detail = new LinkedHashMap<>();
                        detail.put("ingredientId", s.getIngredientId());
                        detail.put("ingredientName", s.getIngredientName());
                        detail.put("unit", s.getUnit());
                        detail.put("required", s.getRequired());
                        detail.put("available", s.getAvailable());
                        detail.put("shortfall", s.getShortfall());
                        return detail;
                    })
                    .collect(Collectors.toList());
            errorResponse.put("shortages", shortageDetails);
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(
            RuntimeException ex,
            WebRequest request) {
        String message = ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred";
        String path = extractPath(request);

        HttpStatus status;
        String error;

        if (message.toLowerCase().contains("not found")) {
            status = HttpStatus.NOT_FOUND;
            error = "Not Found";
            log.warn("Resource not found: {} - Path: {}", message, path);

        } else if (message.toLowerCase().contains("already exists")) {
            status = HttpStatus.CONFLICT;
            error = "Conflict";
            log.warn("Duplicate resource: {} - Path: {}", message, path);

        } else if (message.toLowerCase().contains("insufficient stock")) {
            status = HttpStatus.BAD_REQUEST;
            error = "Bad Request";
            log.warn("Insufficient stock: {} - Path: {}", message, path);

        } else if (message.toLowerCase().contains("required") ||
                message.toLowerCase().contains("must") ||
                message.toLowerCase().contains("invalid")) {
            status = HttpStatus.BAD_REQUEST;
            error = "Bad Request";
            log.warn("Validation error: {} - Path: {}", message, path);

        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            error = "Internal Server Error";
            log.error("Unexpected error: {} - Path: {}", message, path, ex);
        }

        Map<String, Object> errorResponse = new LinkedHashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        errorResponse.put("status", status.value());
        errorResponse.put("error", error);
        errorResponse.put("message", message);
        errorResponse.put("path", path);

        return ResponseEntity.status(status).body(errorResponse);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(
            Exception ex,
            WebRequest request) {
        String message = ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred";
        String path = extractPath(request);

        log.error("Unhandled exception: {} - Path: {}", message, path, ex);

        Map<String, Object> errorResponse = new LinkedHashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        errorResponse.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        errorResponse.put("error", "Internal Server Error");
        errorResponse.put("message", message);
        errorResponse.put("path", path);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    private String extractPath(WebRequest request) {
        String description = request.getDescription(false);
        if (description.startsWith("uri=")) {
            return description.substring(4);
        }
        return description;
    }
}