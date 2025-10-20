"""Smart Cities API examples"""

import os
from lydian import Lydian
from lydian.types import PaginationParams

lydian = Lydian(api_key=os.environ.get("LYDIAN_API_KEY"))

# 1. Create city
city = lydian.smart_cities.create_city(
    name="Tokyo",
    country="Japan",
    population=13960000,
    timezone="Asia/Tokyo",
    metadata={"mayor": "Yuriko Koike", "area_km2": 2194}
)
print(f"City created: {city.id}")

# 2. Create sensor asset
sensor = lydian.smart_cities.create_asset(
    city_id=city.id,
    asset_type="sensor",
    name="Air Quality Sensor #1",
    location={"latitude": 35.6762, "longitude": 139.6503, "address": "Shibuya, Tokyo"},
    status="active",
    metadata={"model": "AQM-2000"}
)
print(f"Sensor created: {sensor.id}")

# 3. List assets
assets = lydian.smart_cities.list_assets(
    city.id,
    params=PaginationParams(page=1, limit=20)
)
print(f"Found {len(assets.data)} assets")

# 4. Get metrics
metrics = lydian.smart_cities.get_metrics(
    city.id,
    start_date="2024-01-01",
    end_date="2024-01-31"
)
print(f"Retrieved {len(metrics)} metric records")

# 5. Create alert
alert = lydian.smart_cities.create_alert(
    city_id=city.id,
    alert_type="environment",
    severity="high",
    title="High Air Pollution Detected",
    description="PM2.5 levels exceeded safe threshold",
    location={"latitude": 35.6762, "longitude": 139.6503},
    status="open"
)
print(f"Alert created: {alert.id}")

# 6. Update alert
updated_alert = lydian.smart_cities.update_alert(alert.id, status="acknowledged")
print(f"Alert status: {updated_alert.status}")
