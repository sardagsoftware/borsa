"""
Data models for Smart Cities API
"""

from dataclasses import dataclass, field, asdict
from typing import Dict, Any, List, Optional, Generic, TypeVar


T = TypeVar("T")


@dataclass
class CityCreate:
    """City creation request."""

    name: str
    coordinates: Dict[str, float]
    population: int
    timezone: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class City:
    """Smart city object."""

    cityId: str
    name: str
    coordinates: Dict[str, float]
    population: int
    timezone: str
    createdAt: str
    updatedAt: str

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "City":
        return cls(**data)


@dataclass
class AssetCreate:
    """Asset creation request."""

    assetType: str
    name: str
    location: Dict[str, float]
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Asset:
    """IoT asset object."""

    assetId: str
    cityId: str
    assetType: str
    name: str
    location: Dict[str, float]
    status: str
    metadata: Dict[str, Any]
    createdAt: str
    updatedAt: str

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Asset":
        return cls(**data)


@dataclass
class CityMetrics:
    """Real-time city metrics."""

    cityId: str
    timestamp: str
    traffic: Dict[str, Any]
    energy: Dict[str, Any]
    air: Dict[str, Any]
    water: Dict[str, Any]

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "CityMetrics":
        return cls(**data)


@dataclass
class EventCreate:
    """Event creation request."""

    cityId: str
    eventType: str
    severity: str
    description: str
    location: Optional[Dict[str, float]] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Event:
    """City event object."""

    eventId: str
    cityId: str
    eventType: str
    severity: str
    description: str
    location: Optional[Dict[str, float]]
    metadata: Dict[str, Any]
    timestamp: str
    createdAt: str

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Event":
        return cls(**data)


@dataclass
class AlertCreate:
    """Alert creation request."""

    cityId: str
    alertType: str
    severity: str
    message: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Alert:
    """Alert object."""

    alertId: str
    cityId: str
    alertType: str
    severity: str
    message: str
    status: str
    createdAt: str
    updatedAt: str

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Alert":
        return cls(**data)


@dataclass
class PaginatedResponse(Generic[T]):
    """Paginated response with cursor."""

    data: List[T]
    next_cursor: Optional[str] = None
    has_more: bool = False
