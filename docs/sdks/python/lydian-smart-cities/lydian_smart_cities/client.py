"""
Smart Cities API Client
"""

import hashlib
import hmac
import time
from typing import Optional, Dict, Any, List
from urllib.parse import urlencode

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .models import (
    City,
    CityCreate,
    Asset,
    AssetCreate,
    CityMetrics,
    Event,
    EventCreate,
    Alert,
    AlertCreate,
    PaginatedResponse,
)
from .exceptions import (
    LydianError,
    AuthenticationError,
    ValidationError,
    NotFoundError,
    RateLimitError,
    ServerError,
)


class SmartCitiesClient:
    """
    Client for the LyDian Smart Cities API.

    Args:
        api_key: API key for authentication (recommended)
        access_token: OAuth2 access token for authentication
        hmac_secret: HMAC secret for signature authentication
        base_url: Base URL for the API (default: https://api.lydian.com/v1/smart-cities)
        timeout: Request timeout in seconds (default: 30)
        max_retries: Maximum number of retries on rate limit (default: 3)

    Example:
        >>> client = SmartCitiesClient(api_key="your-api-key")
        >>> city = client.create_city(name="İstanbul", latitude=41.0082, longitude=28.9784)
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        access_token: Optional[str] = None,
        hmac_secret: Optional[str] = None,
        base_url: str = "https://api.lydian.com/v1/smart-cities",
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
            "User-Agent": "lydian-smart-cities-python/1.0.0",
        }

        # Add idempotency key if provided
        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key

        # Add authentication
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
        """Handle API response and raise appropriate exceptions."""
        if response.status_code == 200 or response.status_code == 201:
            return response.json()

        # Try to parse error response
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

        # Raise appropriate exception
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

    # ==================== Cities ====================

    def create_city(
        self,
        name: str,
        latitude: float,
        longitude: float,
        population: int,
        timezone: str,
        idempotency_key: Optional[str] = None,
    ) -> City:
        """
        Create a new smart city.

        Args:
            name: City name
            latitude: Latitude coordinate (-90 to 90)
            longitude: Longitude coordinate (-180 to 180)
            population: City population
            timezone: Timezone (e.g., "Europe/Istanbul")
            idempotency_key: Optional UUID for idempotent requests

        Returns:
            Created City object

        Example:
            >>> city = client.create_city(
            ...     name="İstanbul",
            ...     latitude=41.0082,
            ...     longitude=28.9784,
            ...     population=15840900,
            ...     timezone="Europe/Istanbul"
            ... )
        """
        data = CityCreate(
            name=name,
            coordinates={"latitude": latitude, "longitude": longitude},
            population=population,
            timezone=timezone,
        )
        result = self._request("POST", "/cities", json=data.to_dict(), idempotency_key=idempotency_key)
        return City.from_dict(result)

    def list_cities(
        self,
        cursor: Optional[str] = None,
        limit: int = 50,
    ) -> PaginatedResponse[City]:
        """
        List cities with cursor-based pagination.

        Args:
            cursor: Pagination cursor for next page
            limit: Number of items per page (1-100, default: 50)

        Returns:
            PaginatedResponse with list of cities

        Example:
            >>> response = client.list_cities(limit=10)
            >>> for city in response.data:
            ...     print(city.name)
            >>> if response.has_more:
            ...     next_page = client.list_cities(cursor=response.next_cursor)
        """
        params = {"limit": limit}
        if cursor:
            params["cursor"] = cursor

        result = self._request("GET", "/cities", params=params)

        # Parse Link header for cursor
        # Note: requests library doesn't expose response headers in _request,
        # so we'll need to extract from result or make this method special
        return PaginatedResponse(
            data=[City.from_dict(item) for item in result.get("data", [])],
            next_cursor=None,  # TODO: Parse from Link header
            has_more=False,  # TODO: Parse from Link header
        )

    def get_city(self, city_id: str) -> City:
        """
        Get city by ID.

        Args:
            city_id: City ID

        Returns:
            City object

        Example:
            >>> city = client.get_city("city_01HJ5K3M2N5P6Q7R8S9T0V1W2X")
        """
        result = self._request("GET", f"/cities/{city_id}")
        return City.from_dict(result)

    # ==================== Assets ====================

    def register_asset(
        self,
        city_id: str,
        asset_type: str,
        name: str,
        latitude: float,
        longitude: float,
        metadata: Optional[Dict[str, Any]] = None,
        idempotency_key: Optional[str] = None,
    ) -> Asset:
        """
        Register a new IoT asset in a city.

        Args:
            city_id: City ID
            asset_type: Type of asset (e.g., "traffic-sensor", "camera")
            name: Asset name
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            metadata: Optional metadata dictionary
            idempotency_key: Optional UUID for idempotent requests

        Returns:
            Created Asset object
        """
        data = AssetCreate(
            assetType=asset_type,
            name=name,
            location={"latitude": latitude, "longitude": longitude},
            metadata=metadata or {},
        )
        result = self._request(
            "POST",
            f"/cities/{city_id}/assets",
            json=data.to_dict(),
            idempotency_key=idempotency_key,
        )
        return Asset.from_dict(result)

    def list_assets(
        self,
        city_id: str,
        cursor: Optional[str] = None,
        limit: int = 50,
        asset_type: Optional[str] = None,
    ) -> PaginatedResponse[Asset]:
        """
        List assets in a city with cursor-based pagination.

        Args:
            city_id: City ID
            cursor: Pagination cursor for next page
            limit: Number of items per page (1-100, default: 50)
            asset_type: Optional filter by asset type

        Returns:
            PaginatedResponse with list of assets
        """
        params = {"limit": limit}
        if cursor:
            params["cursor"] = cursor
        if asset_type:
            params["assetType"] = asset_type

        result = self._request("GET", f"/cities/{city_id}/assets", params=params)

        return PaginatedResponse(
            data=[Asset.from_dict(item) for item in result.get("data", [])],
            next_cursor=None,  # TODO: Parse from Link header
            has_more=False,  # TODO: Parse from Link header
        )

    # ==================== Metrics ====================

    def get_city_metrics(self, city_id: str) -> CityMetrics:
        """
        Get real-time metrics for a city.

        Args:
            city_id: City ID

        Returns:
            CityMetrics object with traffic, energy, air, and water metrics

        Example:
            >>> metrics = client.get_city_metrics("city_01HJ5K3M2N5P6Q7R8S9T0V1W2X")
            >>> print(f"AQI: {metrics.air['aqi']}")
            >>> print(f"Traffic: {metrics.traffic['congestionLevel']}")
        """
        result = self._request("GET", f"/cities/{city_id}/metrics")
        return CityMetrics.from_dict(result)

    # ==================== Events ====================

    def report_event(
        self,
        city_id: str,
        event_type: str,
        severity: str,
        description: str,
        location: Optional[Dict[str, float]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        idempotency_key: Optional[str] = None,
    ) -> Event:
        """
        Report a city event.

        Args:
            city_id: City ID
            event_type: Event type (e.g., "security", "disaster")
            severity: Severity level ("low", "medium", "high", "critical")
            description: Event description
            location: Optional location dict with latitude/longitude
            metadata: Optional metadata dictionary
            idempotency_key: Optional UUID for idempotent requests

        Returns:
            Created Event object
        """
        data = EventCreate(
            cityId=city_id,
            eventType=event_type,
            severity=severity,
            description=description,
            location=location,
            metadata=metadata or {},
        )
        result = self._request("POST", "/events", json=data.to_dict(), idempotency_key=idempotency_key)
        return Event.from_dict(result)

    def list_events(
        self,
        cursor: Optional[str] = None,
        limit: int = 50,
        city_id: Optional[str] = None,
        event_type: Optional[str] = None,
    ) -> PaginatedResponse[Event]:
        """
        List events with cursor-based pagination.

        Args:
            cursor: Pagination cursor for next page
            limit: Number of items per page (1-100, default: 50)
            city_id: Optional filter by city ID
            event_type: Optional filter by event type

        Returns:
            PaginatedResponse with list of events
        """
        params = {"limit": limit}
        if cursor:
            params["cursor"] = cursor
        if city_id:
            params["cityId"] = city_id
        if event_type:
            params["eventType"] = event_type

        result = self._request("GET", "/events", params=params)

        return PaginatedResponse(
            data=[Event.from_dict(item) for item in result.get("data", [])],
            next_cursor=None,
            has_more=False,
        )

    # ==================== Alerts ====================

    def create_alert(
        self,
        city_id: str,
        alert_type: str,
        severity: str,
        message: str,
        idempotency_key: Optional[str] = None,
    ) -> Alert:
        """
        Create an alert.

        Args:
            city_id: City ID
            alert_type: Alert type
            severity: Severity level ("low", "medium", "high", "critical")
            message: Alert message
            idempotency_key: Optional UUID for idempotent requests

        Returns:
            Created Alert object
        """
        data = AlertCreate(
            cityId=city_id,
            alertType=alert_type,
            severity=severity,
            message=message,
        )
        result = self._request("POST", "/alerts", json=data.to_dict(), idempotency_key=idempotency_key)
        return Alert.from_dict(result)

    def list_alerts(
        self,
        cursor: Optional[str] = None,
        limit: int = 50,
        city_id: Optional[str] = None,
        severity: Optional[str] = None,
    ) -> PaginatedResponse[Alert]:
        """
        List alerts with cursor-based pagination.

        Args:
            cursor: Pagination cursor for next page
            limit: Number of items per page (1-100, default: 50)
            city_id: Optional filter by city ID
            severity: Optional filter by severity ("low", "medium", "high", "critical")

        Returns:
            PaginatedResponse with list of alerts
        """
        params = {"limit": limit}
        if cursor:
            params["cursor"] = cursor
        if city_id:
            params["cityId"] = city_id
        if severity:
            params["severity"] = severity

        result = self._request("GET", "/alerts", params=params)

        return PaginatedResponse(
            data=[Alert.from_dict(item) for item in result.get("data", [])],
            next_cursor=None,
            has_more=False,
        )
