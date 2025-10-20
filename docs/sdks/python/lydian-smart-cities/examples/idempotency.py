"""
Smart Cities SDK - Idempotency Example

This example shows how to use idempotency keys to prevent duplicate operations
"""

import os
import uuid
from lydian_smart_cities import SmartCitiesClient

client = SmartCitiesClient(api_key=os.getenv("LYDIAN_API_KEY"))

# Use idempotency key to prevent duplicate city creation
idempotency_key = str(uuid.uuid4())

# First call creates the city
city1 = client.create_city(
    name="Ankara Smart City",
    latitude=39.9334,
    longitude=32.8597,
    population=5_639_076,
    timezone="Europe/Istanbul",
    idempotency_key=idempotency_key
)

# Second call with same idempotency key returns the existing city
city2 = client.create_city(
    name="Ankara Smart City",
    latitude=39.9334,
    longitude=32.8597,
    population=5_639_076,
    timezone="Europe/Istanbul",
    idempotency_key=idempotency_key
)

print(f"Same city ID: {city1.cityId == city2.cityId}")  # True
