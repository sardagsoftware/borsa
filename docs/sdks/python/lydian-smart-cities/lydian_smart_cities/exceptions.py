"""
Exceptions for Smart Cities API
"""

from typing import Optional, List, Dict, Any


class LydianError(Exception):
    """Base exception for all LyDian API errors."""

    def __init__(
        self,
        message: str,
        code: str = "UNKNOWN_ERROR",
        correlation_id: Optional[str] = None,
        details: Optional[List[Dict[str, Any]]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.correlation_id = correlation_id
        self.details = details or []

    def __str__(self) -> str:
        parts = [f"{self.code}: {self.message}"]
        if self.correlation_id:
            parts.append(f"(correlationId: {self.correlation_id})")
        if self.details:
            parts.append(f"Details: {self.details}")
        return " ".join(parts)


class AuthenticationError(LydianError):
    """Authentication failed (401)."""

    pass


class ValidationError(LydianError):
    """Request validation failed (400)."""

    pass


class NotFoundError(LydianError):
    """Resource not found (404)."""

    pass


class RateLimitError(LydianError):
    """Rate limit exceeded (429)."""

    pass


class ServerError(LydianError):
    """Server error (500+)."""

    pass
