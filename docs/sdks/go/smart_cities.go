package lydian

import (
	"context"
	"encoding/json"
	"fmt"
)

// SmartCitiesClient handles Smart Cities API operations
type SmartCitiesClient struct {
	client *Client
}

// City represents a city entity
type City struct {
	ID         string                 `json:"id"`
	Name       string                 `json:"name"`
	Country    string                 `json:"country"`
	Population *int                   `json:"population,omitempty"`
	Timezone   string                 `json:"timezone,omitempty"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt  string                 `json:"created_at,omitempty"`
	UpdatedAt  string                 `json:"updated_at,omitempty"`
}

// CityAsset represents a city asset
type CityAsset struct {
	ID        string                 `json:"id"`
	CityID    string                 `json:"city_id"`
	Type      string                 `json:"type"`
	Name      string                 `json:"name"`
	Location  Location               `json:"location"`
	Status    string                 `json:"status"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt string                 `json:"created_at,omitempty"`
	UpdatedAt string                 `json:"updated_at,omitempty"`
}

// Location represents geographic coordinates
type Location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Address   string  `json:"address,omitempty"`
}

// Alert represents a city alert
type Alert struct {
	ID          string    `json:"id"`
	CityID      string    `json:"city_id"`
	Type        string    `json:"type"`
	Severity    string    `json:"severity"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Location    *Location `json:"location,omitempty"`
	Status      string    `json:"status"`
	CreatedAt   string    `json:"created_at,omitempty"`
	ResolvedAt  *string   `json:"resolved_at,omitempty"`
}

// CreateCity creates a new city
func (sc *SmartCitiesClient) CreateCity(ctx context.Context, city City) (*City, error) {
	data, err := sc.client.Request(ctx, "POST", "/smart-cities/cities", city, nil)
	if err != nil {
		return nil, err
	}

	var result City
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// GetCity retrieves a city by ID
func (sc *SmartCitiesClient) GetCity(ctx context.Context, cityID string) (*City, error) {
	data, err := sc.client.Request(ctx, "GET", fmt.Sprintf("/smart-cities/cities/%s", cityID), nil, nil)
	if err != nil {
		return nil, err
	}

	var city City
	if err := json.Unmarshal(data, &city); err != nil {
		return nil, err
	}

	return &city, nil
}

// ListCities lists all cities
func (sc *SmartCitiesClient) ListCities(ctx context.Context, params PaginationParams) (*PaginatedResponse, error) {
	query := make(map[string]string)
	if params.Page > 0 {
		query["page"] = fmt.Sprintf("%d", params.Page)
	}
	if params.Limit > 0 {
		query["limit"] = fmt.Sprintf("%d", params.Limit)
	}
	if params.Cursor != "" {
		query["cursor"] = params.Cursor
	}

	data, err := sc.client.Request(ctx, "GET", "/smart-cities/cities", nil, query)
	if err != nil {
		return nil, err
	}

	var result PaginatedResponse
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// CreateAsset creates a city asset
func (sc *SmartCitiesClient) CreateAsset(ctx context.Context, asset CityAsset) (*CityAsset, error) {
	data, err := sc.client.Request(ctx, "POST", "/smart-cities/assets", asset, nil)
	if err != nil {
		return nil, err
	}

	var result CityAsset
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// CreateAlert creates a city alert
func (sc *SmartCitiesClient) CreateAlert(ctx context.Context, alert Alert) (*Alert, error) {
	data, err := sc.client.Request(ctx, "POST", "/smart-cities/alerts", alert, nil)
	if err != nil {
		return nil, err
	}

	var result Alert
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}
