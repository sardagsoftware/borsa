"""LyDian IQ API examples"""

import os
from lydian import Lydian
from lydian.types import KnowledgeQuery

lydian = Lydian(api_key=os.environ.get("LYDIAN_API_KEY"))

# 1. Ingest signal
signal = lydian.lydian_iq.ingest_signal(
    signal_type="sensor",
    source="temperature-sensor-001",
    content={"temperature": 72.5, "unit": "fahrenheit", "location": "Building A, Floor 3"},
    metadata={"sensor_model": "TempPro-200", "battery_level": 87}
)
print(f"Signal ingested: {signal.id}")

# 2. Batch ingest signals
signals = lydian.lydian_iq.batch_ingest_signals([
    {
        "type": "sensor",
        "source": "humidity-sensor-001",
        "content": {"humidity": 45, "unit": "percent"}
    },
    {
        "type": "sensor",
        "source": "air-quality-sensor-001",
        "content": {"pm25": 12.3, "aqi": 48}
    }
])
print(f"Batch ingested {len(signals)} signals")

# 3. Create knowledge entity
entity = lydian.lydian_iq.create_entity(
    entity_type="Building",
    name="Smart Office Tower A",
    properties={
        "address": "123 Main St",
        "floors": 20,
        "occupancy": 850,
        "energy_efficiency_rating": "A+"
    },
    relationships=[
        {"type": "contains", "target_id": "floor-3", "properties": {"floor_number": 3}}
    ]
)
print(f"Entity created: {entity.id}")

# 4. Query knowledge graph
query_result = lydian.lydian_iq.query_knowledge(
    KnowledgeQuery(
        query="Find all buildings with temperature sensors showing anomalies",
        entity_types=["Building", "Sensor"],
        filters={"Sensor.type": "temperature"},
        limit=50
    )
)
print(f"Found {len(query_result.get('entities', []))} entities")
print(f"Found {len(query_result.get('relationships', []))} relationships")

# 5. Generate insights
insights = lydian.lydian_iq.generate_insights(
    query="Analyze building energy consumption patterns",
    context={"time_range": "7d", "buildings": [entity.id]}
)
print(f"Generated {len(insights)} insights")

for insight in insights:
    print(f"\n[{insight.type}] {insight.title}")
    print(f"Confidence: {insight.confidence}%")
    print(f"Description: {insight.description}")
    if insight.actionable and insight.actions:
        print("Recommended actions:")
        for action in insight.actions:
            print(f"  - {action}")
