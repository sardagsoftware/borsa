"""
Smart Cities SDK - Pagination Example

This example shows how to paginate through large result sets
"""

import os
from lydian_smart_cities import SmartCitiesClient

client = SmartCitiesClient(api_key=os.getenv("LYDIAN_API_KEY"))

# Paginate through all cities
all_cities = []
cursor = None

while True:
    response = client.list_cities(cursor=cursor, limit=50)
    all_cities.extend(response.data)

    if not response.has_more:
        break

    cursor = response.next_cursor

print(f"Total cities: {len(all_cities)}")
