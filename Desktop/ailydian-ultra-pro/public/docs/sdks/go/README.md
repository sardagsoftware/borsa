# lydian-go-sdk - Go SDK

Official Go SDK for the Lydian AI Platform. Build intelligent applications with Smart Cities, İnsan IQ, and LyDian IQ APIs.

## Features

- **Type Safe** - Strongly typed structs for all API entities
- **Context Support** - Full context.Context support for cancellation
- **No Dependencies** - Uses only Go standard library
- **Automatic Retries** - Built-in retry logic with exponential backoff
- **OAuth2 & API Key** - Multiple authentication methods

## Installation

```bash
go get github.com/lydian/go-sdk
```

## Quick Start

```go
package main

import (
    "context"
    "fmt"
    "log"
    "os"

    "github.com/lydian/go-sdk"
)

func main() {
    // Initialize client
    client := lydian.NewClient(lydian.Config{
        APIKey: os.Getenv("LYDIAN_API_KEY"),
    })

    ctx := context.Background()

    // Create a city
    city, err := client.SmartCities.CreateCity(ctx, lydian.City{
        Name:       "San Francisco",
        Country:    "USA",
        Population: intPtr(873965),
    })
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("City created: %s\n", city.ID)
}

func intPtr(i int) *int {
    return &i
}
```

## Authentication

### API Key

```go
client := lydian.NewClient(lydian.Config{
    APIKey: "your-api-key",
})
```

### OAuth2

```go
client := lydian.NewClient(lydian.Config{
    BaseURL: "https://api.lydian.ai/v1",
})

err := client.AuthenticateOAuth2(ctx, "client-id", "client-secret")
if err != nil {
    log.Fatal(err)
}
```

## Examples

See the [examples](./examples) directory for complete working examples.

## Requirements

- Go 1.21 or higher

## License

MIT

## Support

- Documentation: https://docs.lydian.ai
- Issues: https://github.com/lydian/go-sdk/issues
- Email: support@lydian.ai
