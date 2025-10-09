"""
LyDian Smart Cities SDK
Python SDK for the LyDian Smart Cities API

Example:
    >>> from lydian_smart_cities import SmartCitiesClient
    >>> client = SmartCitiesClient(api_key="your-api-key")
    >>> city = client.create_city(name="İstanbul", latitude=41.0082, longitude=28.9784)
    >>> print(city.city_id)
"""

from .client import SmartCitiesClient
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

__version__ = "1.0.0"
__all__ = [
    "SmartCitiesClient",
    "City",
    "CityCreate",
    "Asset",
    "AssetCreate",
    "CityMetrics",
    "Event",
    "EventCreate",
    "Alert",
    "AlertCreate",
    "PaginatedResponse",
    "LydianError",
    "AuthenticationError",
    "ValidationError",
    "NotFoundError",
    "RateLimitError",
    "ServerError",
]
