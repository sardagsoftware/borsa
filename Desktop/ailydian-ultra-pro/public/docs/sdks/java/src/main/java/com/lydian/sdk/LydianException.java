package com.lydian.sdk;

/**
 * Exception for Lydian API errors
 */
public class LydianException extends RuntimeException {
    private final int statusCode;

    public LydianException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
