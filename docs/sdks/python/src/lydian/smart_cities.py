"""Smart Cities API client"""

from typing import Dict, List, Optional, Any
from .types import City, CityAsset, CityMetrics, Alert, PaginatedResponse, PaginationParams


class SmartCitiesClient:
    """Client for Smart Cities API"""

    def __init__(self, client):
        self._client = client

    def create_city(
        self,
        name: str,
        country: str,
        population: Optional[int] = None,
        timezone: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> City:
        """Create a new city"""
        data = {
            "name": name,
            "country": country,
            "population": population,
            "timezone": timezone,
            "metadata": metadata,
        }
        response = self._client.request("POST", "/smart-cities/cities", body=data)
        return City(**response)

    def get_city(self, city_id: str) -> City:
        """Get city by ID"""
        response = self._client.request("GET", f"/smart-cities/cities/{city_id}")
        return City(**response)

    def list_cities(self, params: Optional[PaginationParams] = None) -> PaginatedResponse:
        """List all cities with pagination"""
        query = {}
        if params:
            if params.page:
                query["page"] = params.page
            if params.limit:
                query["limit"] = params.limit
            if params.cursor:
                query["cursor"] = params.cursor

        response = self._client.request("GET", "/smart-cities/cities", query=query)
        return PaginatedResponse(**response)

    def update_city(self, city_id: str, **kwargs) -> City:
        """Update city"""
        response = self._client.request(
            "PATCH", f"/smart-cities/cities/{city_id}", body=kwargs
        )
        return City(**response)

    def delete_city(self, city_id: str) -> None:
        """Delete city"""
        self._client.request("DELETE", f"/smart-cities/cities/{city_id}")

    def create_asset(
        self,
        city_id: str,
        asset_type: str,
        name: str,
        location: Dict[str, Any],
        status: str = "active",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> CityAsset:
        """Create city asset"""
        data = {
            "cityId": city_id,
            "type": asset_type,
            "name": name,
            "location": location,
            "status": status,
            "metadata": metadata,
        }
        response = self._client.request("POST", "/smart-cities/assets", body=data)
        return CityAsset(**response)

    def list_assets(
        self, city_id: str, params: Optional[PaginationParams] = None
    ) -> PaginatedResponse:
        """List city assets"""
        query = {}
        if params:
            if params.page:
                query["page"] = params.page
            if params.limit:
                query["limit"] = params.limit
            if params.cursor:
                query["cursor"] = params.cursor

        response = self._client.request(
            "GET", f"/smart-cities/cities/{city_id}/assets", query=query
        )
        return PaginatedResponse(**response)

    def get_metrics(
        self, city_id: str, start_date: Optional[str] = None, end_date: Optional[str] = None
    ) -> List[CityMetrics]:
        """Get city metrics"""
        query = {}
        if start_date:
            query["startDate"] = start_date
        if end_date:
            query["endDate"] = end_date

        response = self._client.request(
            "GET", f"/smart-cities/cities/{city_id}/metrics", query=query
        )
        return [CityMetrics(**m) for m in response]

    def create_alert(
        self,
        city_id: str,
        alert_type: str,
        severity: str,
        title: str,
        description: str,
        location: Optional[Dict[str, Any]] = None,
        status: str = "open",
    ) -> Alert:
        """Create alert"""
        data = {
            "cityId": city_id,
            "type": alert_type,
            "severity": severity,
            "title": title,
            "description": description,
            "location": location,
            "status": status,
        }
        response = self._client.request("POST", "/smart-cities/alerts", body=data)
        return Alert(**response)

    def list_alerts(
        self,
        city_id: str,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        params: Optional[PaginationParams] = None,
    ) -> PaginatedResponse:
        """List alerts"""
        query = {}
        if status:
            query["status"] = status
        if severity:
            query["severity"] = severity
        if params:
            if params.page:
                query["page"] = params.page
            if params.limit:
                query["limit"] = params.limit
            if params.cursor:
                query["cursor"] = params.cursor

        response = self._client.request(
            "GET", f"/smart-cities/cities/{city_id}/alerts", query=query
        )
        return PaginatedResponse(**response)

    def update_alert(self, alert_id: str, status: str) -> Alert:
        """Update alert status"""
        response = self._client.request(
            "PATCH", f"/smart-cities/alerts/{alert_id}", body={"status": status}
        )
        return Alert(**response)
