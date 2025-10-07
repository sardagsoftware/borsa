"""İnsan IQ API client"""

from typing import Dict, List, Optional, Any
from .types import Persona, Skill, ChatSession, ChatMessage, PaginatedResponse, PaginationParams


class InsanIQClient:
    """Client for İnsan IQ API"""

    def __init__(self, client):
        self._client = client

    def create_persona(
        self,
        name: str,
        persona_type: str,
        description: Optional[str] = None,
        capabilities: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Persona:
        """Create a new persona"""
        data = {
            "name": name,
            "type": persona_type,
            "description": description,
            "capabilities": capabilities or [],
            "metadata": metadata,
        }
        response = self._client.request("POST", "/insan-iq/personas", body=data)
        return Persona(**response)

    def get_persona(self, persona_id: str) -> Persona:
        """Get persona by ID"""
        response = self._client.request("GET", f"/insan-iq/personas/{persona_id}")
        return Persona(**response)

    def list_personas(self, params: Optional[PaginationParams] = None) -> PaginatedResponse:
        """List personas"""
        query = {}
        if params:
            if params.page:
                query["page"] = params.page
            if params.limit:
                query["limit"] = params.limit
            if params.cursor:
                query["cursor"] = params.cursor

        response = self._client.request("GET", "/insan-iq/personas", query=query)
        return PaginatedResponse(**response)

    def update_persona(self, persona_id: str, **kwargs) -> Persona:
        """Update persona"""
        response = self._client.request(
            "PATCH", f"/insan-iq/personas/{persona_id}", body=kwargs
        )
        return Persona(**response)

    def delete_persona(self, persona_id: str) -> None:
        """Delete persona"""
        self._client.request("DELETE", f"/insan-iq/personas/{persona_id}")

    def publish_skill(
        self,
        persona_id: str,
        name: str,
        category: str,
        proficiency_level: int,
        description: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Skill:
        """Publish skill to persona"""
        data = {
            "personaId": persona_id,
            "name": name,
            "category": category,
            "proficiencyLevel": proficiency_level,
            "description": description,
            "metadata": metadata,
        }
        response = self._client.request("POST", "/insan-iq/skills", body=data)
        return Skill(**response)

    def list_skills(
        self, persona_id: str, params: Optional[PaginationParams] = None
    ) -> PaginatedResponse:
        """List persona skills"""
        query = {}
        if params:
            if params.page:
                query["page"] = params.page
            if params.limit:
                query["limit"] = params.limit
            if params.cursor:
                query["cursor"] = params.cursor

        response = self._client.request(
            "GET", f"/insan-iq/personas/{persona_id}/skills", query=query
        )
        return PaginatedResponse(**response)

    def create_session(
        self,
        persona_id: str,
        user_id: Optional[str] = None,
        title: Optional[str] = None,
    ) -> ChatSession:
        """Create chat session"""
        data = {
            "personaId": persona_id,
            "userId": user_id,
            "title": title,
        }
        response = self._client.request("POST", "/insan-iq/sessions", body=data)
        return ChatSession(**response)

    def send_message(
        self, session_id: str, content: str, metadata: Optional[Dict[str, Any]] = None
    ) -> ChatMessage:
        """Send message in session"""
        data = {"content": content, "metadata": metadata}
        response = self._client.request(
            "POST", f"/insan-iq/sessions/{session_id}/messages", body=data
        )
        return ChatMessage(**response)

    def get_session_history(
        self, session_id: str, params: Optional[PaginationParams] = None
    ) -> PaginatedResponse:
        """Get session history"""
        query = {}
        if params:
            if params.page:
                query["page"] = params.page
            if params.limit:
                query["limit"] = params.limit
            if params.cursor:
                query["cursor"] = params.cursor

        response = self._client.request(
            "GET", f"/insan-iq/sessions/{session_id}/messages", query=query
        )
        return PaginatedResponse(**response)
