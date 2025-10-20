"""Quickstart example for Lydian SDK"""

import os
from lydian import Lydian

# Initialize client with API key
lydian = Lydian(api_key=os.environ.get("LYDIAN_API_KEY"))

# Create a new city
city = lydian.smart_cities.create_city(
    name="San Francisco",
    country="USA",
    population=873965
)

print(f"City created: {city.id}")
