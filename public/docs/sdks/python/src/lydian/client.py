"""Core HTTP client for Lydian SDK"""

import os
import time
from typing import Any, Dict, Optional
from urllib.parse import urljoin

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


class LydianError(Exception):
    """Base exception for Lydian SDK errors"""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details

    def __str__(self):
        parts = [self.message]
        if self.status_code:
            parts.append(f"Status: {self.status_code}")
        if self.code:
            parts.append(f"Code: {self.code}")
        return " | ".join(parts)


class LydianClient:
    """Base HTTP client with retry logic and authentication"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: int = 30,
        retry_attempts: int = 3,
        retry_delay: int = 1,
    ):
        self.api_key = api_key or os.environ.get("LYDIAN_API_KEY")
        self.base_url = base_url or os.environ.get(
            "LYDIAN_BASE_URL", "https://api.lydian.ai/v1"
        )
        self.timeout = timeout
        self.retry_attempts = retry_attempts
        self.retry_delay = retry_delay
        self.access_token: Optional[str] = None

        # Configure session with retry logic
        self.session = requests.Session()
        retry_strategy = Retry(
            total=retry_attempts,
            backoff_factor=retry_delay,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

    def authenticate_oauth2(
        self, client_id: str, client_secret: str, token_url: Optional[str] = None
    ) -> None:
        """Authenticate with OAuth2 client credentials"""
        url = token_url or urljoin(self.base_url, "/oauth/token")

        response = requests.post(
            url,
            data={
                "grant_type": "client_credentials",
                "client_id": client_id,
                "client_secret": client_secret,
            },
            timeout=self.timeout,
        )

        if not response.ok:
            raise LydianError("OAuth2 authentication failed", response.status_code)

        data = response.json()
        self.access_token = data["access_token"]

    def request(
        self,
        method: str,
        path: str,
        body: Optional[Dict[str, Any]] = None,
        query: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        idempotency_key: Optional[str] = None,
    ) -> Any:
        """Make HTTP request with retry logic"""
        url = urljoin(self.base_url, path)
        request_headers = self._build_headers(headers, idempotency_key)

        # Filter out None values from query params
        if query:
            query = {k: v for k, v in query.items() if v is not None}

        try:
            response = self.session.request(
                method=method,
                url=url,
                json=body,
                params=query,
                headers=request_headers,
                timeout=self.timeout,
            )

            if not response.ok:
                error_data = response.json() if response.content else {}
                error = error_data.get("error", {})
                raise LydianError(
                    message=error.get("message", f"HTTP {response.status_code}"),
                    status_code=response.status_code,
                    code=error.get("code"),
                    details=error.get("details"),
                )

            # Return None for 204 No Content
            if response.status_code == 204:
                return None

            return response.json()

        except requests.exceptions.Timeout:
            raise LydianError(f"Request timed out after {self.timeout} seconds")
        except requests.exceptions.ConnectionError as e:
            raise LydianError(f"Connection error: {str(e)}")
        except requests.exceptions.RequestException as e:
            raise LydianError(f"Request failed: {str(e)}")

    def _build_headers(
        self, custom_headers: Optional[Dict[str, str]], idempotency_key: Optional[str]
    ) -> Dict[str, str]:
        """Build request headers with authentication"""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "lydian-sdk-python/1.0.0",
        }

        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        elif self.api_key:
            headers["X-API-Key"] = self.api_key

        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key

        if custom_headers:
            headers.update(custom_headers)

        return headers


class Lydian:
    """Main SDK class providing access to all API modules"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: int = 30,
        retry_attempts: int = 3,
        retry_delay: int = 1,
    ):
        from .smart_cities import SmartCitiesClient
        from .insan_iq import InsanIQClient
        from .lydian_iq import LydianIQClient

        self._client = LydianClient(
            api_key=api_key,
            base_url=base_url,
            timeout=timeout,
            retry_attempts=retry_attempts,
            retry_delay=retry_delay,
        )

        self.smart_cities = SmartCitiesClient(self._client)
        self.insan_iq = InsanIQClient(self._client)
        self.lydian_iq = LydianIQClient(self._client)

    def authenticate_oauth2(
        self, client_id: str, client_secret: str, token_url: Optional[str] = None
    ) -> None:
        """Authenticate with OAuth2"""
        self._client.authenticate_oauth2(client_id, client_secret, token_url)
