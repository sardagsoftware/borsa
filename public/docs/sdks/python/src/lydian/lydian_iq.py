"""LyDian IQ API client"""

from typing import Dict, List, Optional, Any
from .types import Signal, KnowledgeEntity, KnowledgeQuery, Insight, PaginatedResponse, PaginationParams


class LydianIQClient:
    """Client for LyDian IQ API"""

    def __init__(self, client):
        self._client = client

    def ingest_signal(
        self,
        signal_type: str,
        source: str,
        content: Any,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Signal:
        """Ingest signal into knowledge graph"""
        data = {
            "type": signal_type,
            "source": source,
            "content": content,
            "metadata": metadata,
        }
        response = self._client.request("POST", "/lydian-iq/signals", body=data)
        return Signal(**response)

    def batch_ingest_signals(self, signals: List[Dict[str, Any]]) -> List[Signal]:
        """Batch ingest signals"""
        data = {"signals": signals}
        response = self._client.request("POST", "/lydian-iq/signals/batch", body=data)
        return [Signal(**s) for s in response]

    def get_signal(self, signal_id: str) -> Signal:
        """Get signal by ID"""
        response = self._client.request("GET", f"/lydian-iq/signals/{signal_id}")
        return Signal(**response)

    def query_knowledge(self, query: KnowledgeQuery) -> Dict[str, Any]:
        """Query knowledge graph"""
        data = {
            "query": query.query,
            "entityTypes": query.entity_types,
            "filters": query.filters,
            "limit": query.limit,
        }
        response = self._client.request("POST", "/lydian-iq/knowledge/query", body=data)
        return response

    def create_entity(
        self,
        entity_type: str,
        name: str,
        properties: Dict[str, Any],
        relationships: Optional[List[Dict[str, Any]]] = None,
    ) -> KnowledgeEntity:
        """Create knowledge entity"""
        data = {
            "type": entity_type,
            "name": name,
            "properties": properties,
            "relationships": relationships or [],
        }
        response = self._client.request("POST", "/lydian-iq/knowledge/entities", body=data)
        return KnowledgeEntity(**response)

    def get_entity(self, entity_id: str) -> KnowledgeEntity:
        """Get entity by ID"""
        response = self._client.request(
            "GET", f"/lydian-iq/knowledge/entities/{entity_id}"
        )
        return KnowledgeEntity(**response)

    def update_entity(self, entity_id: str, **kwargs) -> KnowledgeEntity:
        """Update entity"""
        response = self._client.request(
            "PATCH", f"/lydian-iq/knowledge/entities/{entity_id}", body=kwargs
        )
        return KnowledgeEntity(**response)

    def get_insights(
        self,
        insight_type: Optional[str] = None,
        min_confidence: Optional[float] = None,
        params: Optional[PaginationParams] = None,
    ) -> PaginatedResponse:
        """Get insights"""
        query = {}
        if insight_type:
            query["type"] = insight_type
        if min_confidence:
            query["minConfidence"] = min_confidence
        if params:
            if params.page:
                query["page"] = params.page
            if params.limit:
                query["limit"] = params.limit
            if params.cursor:
                query["cursor"] = params.cursor

        response = self._client.request("GET", "/lydian-iq/insights", query=query)
        return PaginatedResponse(**response)

    def get_insight(self, insight_id: str) -> Insight:
        """Get insight by ID"""
        response = self._client.request("GET", f"/lydian-iq/insights/{insight_id}")
        return Insight(**response)

    def generate_insights(
        self, query: str, context: Optional[Dict[str, Any]] = None
    ) -> List[Insight]:
        """Generate insights from query"""
        data = {"query": query, "context": context}
        response = self._client.request("POST", "/lydian-iq/insights/generate", body=data)
        return [Insight(**i) for i in response]
