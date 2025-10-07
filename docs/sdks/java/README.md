# lydian-sdk - Java SDK

Official Java SDK for the Lydian AI Platform.

## Installation

Add to your `pom.xml`:

```xml
<dependency>
    <groupId>com.lydian</groupId>
    <artifactId>lydian-sdk</artifactId>
    <version>1.0.0</version>
</dependency>
```

## Quick Start

```java
import com.lydian.sdk.LydianClient;
import com.lydian.sdk.models.City;

public class Example {
    public static void main(String[] args) {
        LydianClient client = new LydianClient.Builder()
                .apiKey(System.getenv("LYDIAN_API_KEY"))
                .build();

        City city = new City();
        city.setName("San Francisco");
        city.setCountry("USA");

        City created = client.smartCities.createCity(city);
        System.out.println("City: " + created.getId());
    }
}
```

## Features

- Builder pattern for client configuration
- OkHttp for reliable HTTP requests
- Gson for JSON serialization
- Type-safe models

## Requirements

- Java 11 or higher
- Maven or Gradle

## License

MIT
