"""
Smart Cities SDK - Quickstart Example

This example shows how to:
1. Create a client with API key authentication
2. Create a new city
3. Get real-time city metrics
"""

import os
from lydian_smart_cities import SmartCitiesClient

# Create client with API key authentication
client = SmartCitiesClient(api_key=os.getenv("LYDIAN_API_KEY"))

# Create a new smart city
city = client.create_city(
    name="İstanbul Smart City",
    latitude=41.0082,
    longitude=28.9784,
    population=15_840_900,
    timezone="Europe/Istanbul"
)

print(f"City created: {city.cityId}")

# Get real-time city metrics
metrics = client.get_city_metrics(city.cityId)
print(f"Traffic congestion: {metrics.traffic['congestionLevel']}")
print(f"Energy consumption: {metrics.energy['totalConsumption']} kWh")
print(f"Air quality index: {metrics.air['aqi']}")
