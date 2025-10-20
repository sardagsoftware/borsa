#!/bin/bash
# LyDian CLI - Smart Cities Workflow Example
# Demonstrates complete smart cities management workflow

set -e

echo "=== Smart Cities Workflow ==="
echo ""

# 1. Create a new city
echo "1. Creating city: Istanbul..."
CITY_RESPONSE=$(lydian cities create \
  --name "Istanbul" \
  --country "Turkey" \
  --region "Marmara" \
  --population 15462452 \
  --area 5461 \
  --timezone "Europe/Istanbul" \
  --lat 41.0082 \
  --lon 28.9784 \
  --json)

CITY_ID=$(echo $CITY_RESPONSE | jq -r '.id')
echo "City created with ID: $CITY_ID"
echo ""

# 2. List all cities
echo "2. Listing all cities..."
lydian cities list --limit 10
echo ""

# 3. Get city details
echo "3. Getting city details..."
lydian cities get $CITY_ID --json
echo ""

# 4. Add city assets (sensors, cameras, etc.)
echo "4. Adding city assets..."
# Note: This would be done via API, showing conceptual workflow
echo "  - Traffic sensors: 150 units"
echo "  - Air quality monitors: 45 units"
echo "  - Smart cameras: 200 units"
echo ""

# 5. Query city metrics
echo "5. Querying traffic metrics..."
lydian cities metrics $CITY_ID \
  --kind traffic \
  --from $(date -u -v-7d +%Y-%m-%dT%H:%M:%SZ) \
  --to $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --limit 50
echo ""

# 6. Check city alerts
echo "6. Checking city alerts..."
lydian cities alerts $CITY_ID \
  --severity warning \
  --limit 20
echo ""

# 7. Export city data
echo "7. Exporting city data to JSON..."
lydian cities get $CITY_ID --json > istanbul_data.json
echo "Data exported to: istanbul_data.json"
echo ""

# 8. List city assets
echo "8. Listing city assets..."
lydian cities assets $CITY_ID \
  --type sensor \
  --limit 25
echo ""

echo "=== Cities Workflow Complete ==="
echo ""
echo "City ID: $CITY_ID"
echo "Data file: istanbul_data.json"
echo ""
echo "Next steps:"
echo "  - Add more metrics: lydian cities metrics --help"
echo "  - Configure alerts: lydian cities alerts --help"
echo "  - Manage assets: lydian cities assets --help"
