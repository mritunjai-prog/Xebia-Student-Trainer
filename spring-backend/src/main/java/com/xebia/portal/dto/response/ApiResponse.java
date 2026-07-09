package com.xebia.portal.dto.response;

import java.util.List;

public record ApiResponse(
        boolean success,
        String message,
        Object data,
        List<String> errors
) {
    public static ApiResponse success(String message, Object data) {
        return new ApiResponse(true, message, data, List.of());
    }

    public static ApiResponse success(String message) {
        return success(message, null);
    }

    public static ApiResponse failure(String message, List<String> errors) {
        return new ApiResponse(false, message, null, errors == null ? List.of() : errors);
    }
}
