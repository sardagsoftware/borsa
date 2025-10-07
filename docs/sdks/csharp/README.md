# Lydian.SDK - C# SDK

Official C# SDK for the Lydian AI Platform.

## Installation

```bash
dotnet add package Lydian.SDK
```

## Quick Start

```csharp
using Lydian.SDK;
using Lydian.SDK.Models;

var client = new LydianClient(new LydianConfig
{
    ApiKey = Environment.GetEnvironmentVariable("LYDIAN_API_KEY")
});

// Create a city
var city = await client.SmartCities.CreateCityAsync(new City
{
    Name = "San Francisco",
    Country = "USA",
    Population = 873965
});

Console.WriteLine($"City created: {city.Id}");
```

## Features

- Async/await support
- HttpClient with automatic retries
- System.Text.Json for serialization
- Nullable reference types

## Requirements

- .NET 6.0 or higher

## License

MIT
