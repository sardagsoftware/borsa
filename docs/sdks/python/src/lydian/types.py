"""Type definitions for Lydian SDK"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Literal
from datetime import datetime


@dataclass
class PaginationParams:
    page: Optional[int] = None
    limit: Optional[int] = None
    cursor: Optional[str] = None


@dataclass
class Pagination:
    page: int
    limit: int
    total: int
    has_more: bool
    cursor: Optional[str] = None


@dataclass
class PaginatedResponse:
    data: List[Any]
    pagination: Pagination


# Smart Cities Types

@dataclass
class City:
    id: str
    name: str
    country: str
    population: Optional[int] = None
    timezone: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


@dataclass
class Location:
    latitude: float
    longitude: float
    address: Optional[str] = None


@dataclass
class CityAsset:
    id: str
    city_id: str
    type: Literal['sensor', 'camera', 'traffic-light', 'parking', 'building', 'vehicle', 'other']
    name: str
    location: Location
    status: Literal['active', 'inactive', 'maintenance']
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


@dataclass
class TrafficMetrics:
    congestion_level: float
    average_speed: float
    incidents: int


@dataclass
class EnvironmentMetrics:
    air_quality: float
    temperature: float
    humidity: float


@dataclass
class SafetyMetrics:
    crime_rate: float
    emergency_responses: int


@dataclass
class InfrastructureMetrics:
    active_assets: int
    maintenance_alerts: int


@dataclass
class CityMetrics:
    city_id: str
    timestamp: str
    traffic: TrafficMetrics
    environment: EnvironmentMetrics
    safety: SafetyMetrics
    infrastructure: InfrastructureMetrics


@dataclass
class Alert:
    id: str
    city_id: str
    type: Literal['traffic', 'environment', 'safety', 'infrastructure', 'emergency']
    severity: Literal['low', 'medium', 'high', 'critical']
    title: str
    description: str
    location: Optional[Location] = None
    status: Literal['open', 'acknowledged', 'resolved'] = 'open'
    created_at: Optional[str] = None
    resolved_at: Optional[str] = None


# İnsan IQ Types

@dataclass
class Persona:
    id: str
    name: str
    type: Literal['doctor', 'engineer', 'teacher', 'researcher', 'custom']
    description: Optional[str] = None
    capabilities: List[str] = field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


@dataclass
class Skill:
    id: str
    persona_id: str
    name: str
    category: str
    proficiency_level: int
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None


@dataclass
class ChatSession:
    id: str
    persona_id: str
    user_id: Optional[str] = None
    title: Optional[str] = None
    status: Literal['active', 'paused', 'completed'] = 'active'
    message_count: int = 0
    created_at: Optional[str] = None
    last_message_at: Optional[str] = None


@dataclass
class ChatMessage:
    id: str
    session_id: str
    role: Literal['user', 'assistant', 'system']
    content: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None


# LyDian IQ Types

@dataclass
class Signal:
    id: str
    type: Literal['text', 'image', 'audio', 'video', 'sensor', 'structured']
    source: str
    content: Any
    timestamp: str
    metadata: Optional[Dict[str, Any]] = None
    processed: bool = False
    processed_at: Optional[str] = None


@dataclass
class Relationship:
    type: str
    target_id: str
    properties: Optional[Dict[str, Any]] = None


@dataclass
class KnowledgeEntity:
    id: str
    type: str
    name: str
    properties: Dict[str, Any]
    relationships: List[Relationship] = field(default_factory=list)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


@dataclass
class KnowledgeQuery:
    query: str
    entity_types: Optional[List[str]] = None
    filters: Optional[Dict[str, Any]] = None
    limit: Optional[int] = None


@dataclass
class Evidence:
    type: str
    data: Any


@dataclass
class Insight:
    id: str
    type: Literal['pattern', 'anomaly', 'prediction', 'recommendation', 'trend']
    title: str
    description: str
    confidence: float
    evidence: List[Evidence] = field(default_factory=list)
    actionable: bool = False
    actions: Optional[List[str]] = None
    created_at: Optional[str] = None
