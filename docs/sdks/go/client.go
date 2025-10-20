package lydian

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"time"
)

// Config holds the configuration for the Lydian client
type Config struct {
	APIKey        string
	BaseURL       string
	Timeout       time.Duration
	RetryAttempts int
	RetryDelay    time.Duration
}

// Client is the main Lydian API client
type Client struct {
	config      Config
	httpClient  *http.Client
	accessToken string

	SmartCities *SmartCitiesClient
	InsanIQ     *InsanIQClient
	LydianIQ    *LydianIQClient
}

// LydianError represents an API error
type LydianError struct {
	Message    string                 `json:"message"`
	StatusCode int                    `json:"status_code"`
	Code       string                 `json:"code"`
	Details    map[string]interface{} `json:"details,omitempty"`
}

func (e *LydianError) Error() string {
	return fmt.Sprintf("Lydian API Error: %s (Status: %d, Code: %s)", e.Message, e.StatusCode, e.Code)
}

// NewClient creates a new Lydian client
func NewClient(config Config) *Client {
	if config.APIKey == "" {
		config.APIKey = os.Getenv("LYDIAN_API_KEY")
	}
	if config.BaseURL == "" {
		config.BaseURL = getEnvOrDefault("LYDIAN_BASE_URL", "https://api.lydian.ai/v1")
	}
	if config.Timeout == 0 {
		config.Timeout = 30 * time.Second
	}
	if config.RetryAttempts == 0 {
		config.RetryAttempts = 3
	}
	if config.RetryDelay == 0 {
		config.RetryDelay = 1 * time.Second
	}

	client := &Client{
		config: config,
		httpClient: &http.Client{
			Timeout: config.Timeout,
		},
	}

	client.SmartCities = &SmartCitiesClient{client: client}
	client.InsanIQ = &InsanIQClient{client: client}
	client.LydianIQ = &LydianIQClient{client: client}

	return client
}

// AuthenticateOAuth2 authenticates using OAuth2 client credentials
func (c *Client) AuthenticateOAuth2(ctx context.Context, clientID, clientSecret string) error {
	tokenURL := c.config.BaseURL + "/oauth/token"

	data := url.Values{}
	data.Set("grant_type", "client_credentials")
	data.Set("client_id", clientID)
	data.Set("client_secret", clientSecret)

	req, err := http.NewRequestWithContext(ctx, "POST", tokenURL, bytes.NewBufferString(data.Encode()))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("OAuth2 authentication failed: %s", resp.Status)
	}

	var result struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return err
	}

	c.accessToken = result.AccessToken
	return nil
}

// Request makes an HTTP request with retry logic
func (c *Client) Request(ctx context.Context, method, path string, body interface{}, query map[string]string) ([]byte, error) {
	fullURL := c.config.BaseURL + path
	if len(query) > 0 {
		values := url.Values{}
		for k, v := range query {
			if v != "" {
				values.Set(k, v)
			}
		}
		fullURL += "?" + values.Encode()
	}

	var bodyReader io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		bodyReader = bytes.NewBuffer(jsonBody)
	}

	var lastErr error
	for attempt := 0; attempt < c.config.RetryAttempts; attempt++ {
		req, err := http.NewRequestWithContext(ctx, method, fullURL, bodyReader)
		if err != nil {
			return nil, err
		}

		c.setHeaders(req)

		resp, err := c.httpClient.Do(req)
		if err != nil {
			lastErr = err
			time.Sleep(c.config.RetryDelay * time.Duration(1<<attempt))
			continue
		}
		defer resp.Body.Close()

		responseBody, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			return responseBody, nil
		}

		// Parse error
		var apiErr struct {
			Error *LydianError `json:"error"`
		}
		json.Unmarshal(responseBody, &apiErr)

		if apiErr.Error != nil {
			apiErr.Error.StatusCode = resp.StatusCode
			return nil, apiErr.Error
		}

		lastErr = &LydianError{
			Message:    fmt.Sprintf("HTTP %d", resp.StatusCode),
			StatusCode: resp.StatusCode,
		}

		// Don't retry client errors
		if resp.StatusCode >= 400 && resp.StatusCode < 500 {
			return nil, lastErr
		}

		time.Sleep(c.config.RetryDelay * time.Duration(1<<attempt))
	}

	return nil, lastErr
}

func (c *Client) setHeaders(req *http.Request) {
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "lydian-go-sdk/1.0.0")

	if c.accessToken != "" {
		req.Header.Set("Authorization", "Bearer "+c.accessToken)
	} else if c.config.APIKey != "" {
		req.Header.Set("X-API-Key", c.config.APIKey)
	}
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// Pagination types
type PaginationParams struct {
	Page   int    `json:"page,omitempty"`
	Limit  int    `json:"limit,omitempty"`
	Cursor string `json:"cursor,omitempty"`
}

type Pagination struct {
	Page    int    `json:"page"`
	Limit   int    `json:"limit"`
	Total   int    `json:"total"`
	HasMore bool   `json:"has_more"`
	Cursor  string `json:"cursor,omitempty"`
}

type PaginatedResponse struct {
	Data       []interface{} `json:"data"`
	Pagination Pagination    `json:"pagination"`
}
