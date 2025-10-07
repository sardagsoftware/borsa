package lydian

import (
	"context"
	"encoding/json"
	"fmt"
)

// InsanIQClient handles İnsan IQ API operations
type InsanIQClient struct {
	client *Client
}

// Persona represents an AI persona
type Persona struct {
	ID           string                 `json:"id"`
	Name         string                 `json:"name"`
	Type         string                 `json:"type"`
	Description  string                 `json:"description,omitempty"`
	Capabilities []string               `json:"capabilities,omitempty"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt    string                 `json:"created_at,omitempty"`
	UpdatedAt    string                 `json:"updated_at,omitempty"`
}

// Skill represents a persona skill
type Skill struct {
	ID               string                 `json:"id"`
	PersonaID        string                 `json:"persona_id"`
	Name             string                 `json:"name"`
	Category         string                 `json:"category"`
	ProficiencyLevel int                    `json:"proficiency_level"`
	Description      string                 `json:"description,omitempty"`
	Metadata         map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt        string                 `json:"created_at,omitempty"`
}

// ChatSession represents a chat session
type ChatSession struct {
	ID            string  `json:"id"`
	PersonaID     string  `json:"persona_id"`
	UserID        *string `json:"user_id,omitempty"`
	Title         *string `json:"title,omitempty"`
	Status        string  `json:"status"`
	MessageCount  int     `json:"message_count"`
	CreatedAt     string  `json:"created_at,omitempty"`
	LastMessageAt *string `json:"last_message_at,omitempty"`
}

// ChatMessage represents a chat message
type ChatMessage struct {
	ID        string                 `json:"id"`
	SessionID string                 `json:"session_id"`
	Role      string                 `json:"role"`
	Content   string                 `json:"content"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt string                 `json:"created_at,omitempty"`
}

// CreatePersona creates a new persona
func (ic *InsanIQClient) CreatePersona(ctx context.Context, persona Persona) (*Persona, error) {
	data, err := ic.client.Request(ctx, "POST", "/insan-iq/personas", persona, nil)
	if err != nil {
		return nil, err
	}

	var result Persona
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// PublishSkill publishes a skill to a persona
func (ic *InsanIQClient) PublishSkill(ctx context.Context, skill Skill) (*Skill, error) {
	data, err := ic.client.Request(ctx, "POST", "/insan-iq/skills", skill, nil)
	if err != nil {
		return nil, err
	}

	var result Skill
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// CreateSession creates a chat session
func (ic *InsanIQClient) CreateSession(ctx context.Context, session ChatSession) (*ChatSession, error) {
	data, err := ic.client.Request(ctx, "POST", "/insan-iq/sessions", session, nil)
	if err != nil {
		return nil, err
	}

	var result ChatSession
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// SendMessage sends a message in a session
func (ic *InsanIQClient) SendMessage(ctx context.Context, sessionID, content string) (*ChatMessage, error) {
	body := map[string]interface{}{
		"content": content,
	}

	data, err := ic.client.Request(ctx, "POST", fmt.Sprintf("/insan-iq/sessions/%s/messages", sessionID), body, nil)
	if err != nil {
		return nil, err
	}

	var result ChatMessage
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}
