package lydian

import (
	"context"
	"encoding/json"
)

// LydianIQClient handles LyDian IQ API operations
type LydianIQClient struct {
	client *Client
}

// Signal represents a signal
type Signal struct {
	ID          string                 `json:"id"`
	Type        string                 `json:"type"`
	Source      string                 `json:"source"`
	Content     interface{}            `json:"content"`
	Timestamp   string                 `json:"timestamp"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	Processed   bool                   `json:"processed"`
	ProcessedAt *string                `json:"processed_at,omitempty"`
}

// KnowledgeEntity represents a knowledge entity
type KnowledgeEntity struct {
	ID            string                   `json:"id"`
	Type          string                   `json:"type"`
	Name          string                   `json:"name"`
	Properties    map[string]interface{}   `json:"properties"`
	Relationships []map[string]interface{} `json:"relationships,omitempty"`
	CreatedAt     string                   `json:"created_at,omitempty"`
	UpdatedAt     string                   `json:"updated_at,omitempty"`
}

// Insight represents an insight
type Insight struct {
	ID          string                   `json:"id"`
	Type        string                   `json:"type"`
	Title       string                   `json:"title"`
	Description string                   `json:"description"`
	Confidence  float64                  `json:"confidence"`
	Evidence    []map[string]interface{} `json:"evidence,omitempty"`
	Actionable  bool                     `json:"actionable"`
	Actions     []string                 `json:"actions,omitempty"`
	CreatedAt   string                   `json:"created_at,omitempty"`
}

// IngestSignal ingests a signal
func (lc *LydianIQClient) IngestSignal(ctx context.Context, signal Signal) (*Signal, error) {
	data, err := lc.client.Request(ctx, "POST", "/lydian-iq/signals", signal, nil)
	if err != nil {
		return nil, err
	}

	var result Signal
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// CreateEntity creates a knowledge entity
func (lc *LydianIQClient) CreateEntity(ctx context.Context, entity KnowledgeEntity) (*KnowledgeEntity, error) {
	data, err := lc.client.Request(ctx, "POST", "/lydian-iq/knowledge/entities", entity, nil)
	if err != nil {
		return nil, err
	}

	var result KnowledgeEntity
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// GenerateInsights generates insights from a query
func (lc *LydianIQClient) GenerateInsights(ctx context.Context, query string, context map[string]interface{}) ([]Insight, error) {
	body := map[string]interface{}{
		"query":   query,
		"context": context,
	}

	data, err := lc.client.Request(ctx, "POST", "/lydian-iq/insights/generate", body, nil)
	if err != nil {
		return nil, err
	}

	var results []Insight
	if err := json.Unmarshal(data, &results); err != nil {
		return nil, err
	}

	return results, nil
}
