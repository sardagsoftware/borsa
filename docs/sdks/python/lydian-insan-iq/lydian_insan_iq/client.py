"""
İnsan IQ API Client
"""

import hashlib
import hmac
import time
from typing import Optional, Dict, Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .exceptions import (
    LydianError,
    AuthenticationError,
    ValidationError,
    NotFoundError,
    RateLimitError,
    ServerError,
)


class InsanIQClient:
    """
    Client for the LyDian İnsan IQ API.

    Args:
        api_key: API key for authentication (recommended)
        access_token: OAuth2 access token for authentication
        hmac_secret: HMAC secret for signature authentication
        base_url: Base URL for the API
        timeout: Request timeout in seconds (default: 30)
        max_retries: Maximum number of retries on rate limit (default: 3)

    Example:
        >>> client = InsanIQClient(api_key="your-api-key")
        >>> persona = client.create_persona(
        ...     name="Support Agent",
        ...     personality="friendly, helpful",
        ...     expertise=["customer-service"],
        ...     language="tr"
        ... )
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        access_token: Optional[str] = None,
        hmac_secret: Optional[str] = None,
        base_url: str = "https://api.lydian.com/v1/insan-iq",
        timeout: int = 30,
        max_retries: int = 3,
    ):
        self.api_key = api_key
        self.access_token = access_token
        self.hmac_secret = hmac_secret
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

        # Create session with retry strategy
        self.session = requests.Session()
        retry_strategy = Retry(
            total=max_retries,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "PUT", "DELETE", "OPTIONS", "TRACE", "POST"],
            backoff_factor=1,
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

    def _get_headers(
        self,
        method: str,
        path: str,
        body: Optional[Dict[str, Any]] = None,
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, str]:
        """Generate headers for the request."""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "lydian-insan-iq-python/1.0.0",
        }

        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key

        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        elif self.api_key:
            headers["X-API-Key"] = self.api_key
        elif self.hmac_secret:
            timestamp = str(int(time.time()))
            body_hash = hashlib.sha256(
                (body if isinstance(body, bytes) else str(body or "").encode())
            ).hexdigest()
            canonical = f"{method}\n{path}\n{timestamp}\n{body_hash}"
            signature = hmac.new(
                self.hmac_secret.encode(),
                canonical.encode(),
                hashlib.sha256,
            ).hexdigest()
            headers["X-HMAC-Signature"] = f"sha256={signature}"
            headers["X-HMAC-Timestamp"] = timestamp
            headers["X-HMAC-Algorithm"] = "HMAC-SHA256"

        return headers

    def _handle_response(self, response: requests.Response) -> Any:
        """Handle API response."""
        if response.status_code in (200, 201):
            return response.json()

        try:
            error_data = response.json()
            error_info = error_data.get("error", {})
            code = error_info.get("code", "UNKNOWN_ERROR")
            message = error_info.get("message", "An error occurred")
            correlation_id = error_info.get("correlationId")
            details = error_info.get("details")
        except:
            code = "HTTP_ERROR"
            message = f"HTTP {response.status_code}"
            correlation_id = None
            details = None

        if response.status_code == 401:
            raise AuthenticationError(message, code, correlation_id, details)
        elif response.status_code == 400:
            raise ValidationError(message, code, correlation_id, details)
        elif response.status_code == 404:
            raise NotFoundError(message, code, correlation_id, details)
        elif response.status_code == 429:
            raise RateLimitError(message, code, correlation_id, details)
        elif response.status_code >= 500:
            raise ServerError(message, code, correlation_id, details)
        else:
            raise LydianError(message, code, correlation_id, details)

    def _request(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
        idempotency_key: Optional[str] = None,
    ) -> Any:
        """Make a request to the API."""
        url = f"{self.base_url}{path}"
        headers = self._get_headers(method, path, json, idempotency_key)

        response = self.session.request(
            method=method,
            url=url,
            params=params,
            json=json,
            headers=headers,
            timeout=self.timeout,
        )

        return self._handle_response(response)

    # API methods: create_persona, list_personas, get_persona,
    # publish_skill, list_skills, create_assistant, list_assistants,
    # get_assistant, create_session, list_sessions, get_assistant_state
    # ... (following same pattern as Smart Cities SDK)
