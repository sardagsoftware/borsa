# LyDian CLI - Complete Command Reference

This manual provides detailed documentation for all LyDian CLI commands.

---

## Table of Contents

- [Authentication Commands](#authentication-commands)
- [Configuration Commands](#configuration-commands)
- [API Key Commands](#api-key-commands)
- [Smart Cities Commands](#smart-cities-commands)
- [Personas Commands](#personas-commands)
- [Signals Commands](#signals-commands)
- [Modules Commands](#modules-commands)
- [Global Options](#global-options)

---

## Authentication Commands

### `lydian auth login`

Authenticate with LyDian platform using OAuth2 device flow.

**Usage:**
```bash
lydian auth login [options]
```

**Options:**
- Global options (see [Global Options](#global-options))

**Example:**
```bash
$ lydian auth login

To authenticate, please visit:
  https://auth.lydian.com/device

And enter the code:
  ABCD-1234

Waiting for authentication...
✓ Successfully authenticated!

User Information:
ID: user_123abc
Name: John Smith
Email: john@example.com
Organization: Acme Corp
Roles: admin, developer
```

**Exit Codes:**
- 0: Success
- 3: Authentication failed

---

### `lydian auth logout`

Sign out and clear all credentials.

**Usage:**
```bash
lydian auth logout [options]
```

**Example:**
```bash
$ lydian auth logout
✓ Successfully signed out
```

---

### `lydian auth whoami`

Display current user information.

**Usage:**
```bash
lydian auth whoami [options]
```

**Options:**
- `--json` - Output as JSON
- `--yaml` - Output as YAML

**Example:**
```bash
$ lydian auth whoami
{
  "id": "user_123abc",
  "name": "John Smith",
  "email": "john@example.com",
  "organization": "Acme Corp",
  "roles": ["admin", "developer"],
  "scopes": ["cities:*", "personas:*", "signals:*"]
}
```

---

### `lydian auth refresh`

Refresh the authentication token.

**Usage:**
```bash
lydian auth refresh [options]
```

**Example:**
```bash
$ lydian auth refresh
✓ Token refreshed successfully
```

---

## Configuration Commands

### `lydian config init`

Initialize configuration with default values.

**Usage:**
```bash
lydian config init [options]
```

**Options:**
- `--force` - Overwrite existing configuration

**Example:**
```bash
$ lydian config init
✓ Configuration initialized
ℹ Config location: /Users/john/.lydian/config.yaml
```

---

### `lydian config set <key> <value>`

Set a configuration value.

**Usage:**
```bash
lydian config set <key> <value> [options]
```

**Arguments:**
- `<key>` - Configuration key
- `<value>` - Configuration value

**Options:**
- `-p, --profile <profile>` - Profile to update

**Examples:**
```bash
# Set endpoint
$ lydian config set endpoint https://api.lydian.com
✓ Set endpoint = https://api.lydian.com

# Set timeout
$ lydian config set settings.timeout 60000
✓ Set settings.timeout = 60000

# Set for specific profile
$ lydian config set apikey dev_key123 --profile development
✓ Set apikey = dev_key123
```

---

### `lydian config get <key>`

Get a configuration value.

**Usage:**
```bash
lydian config get <key> [options]
```

**Arguments:**
- `<key>` - Configuration key

**Options:**
- `-p, --profile <profile>` - Profile to query

**Examples:**
```bash
$ lydian config get endpoint
https://api.lydian.com

$ lydian config get settings.timeout
30000
```

---

### `lydian config list`

List all configuration.

**Usage:**
```bash
lydian config list [options]
```

**Example:**
```bash
$ lydian config list --yaml
current_profile: production
profiles:
  development:
    endpoint: https://dev.api.lydian.com
    auth_method: apikey
  production:
    endpoint: https://api.lydian.com
    auth_method: oauth2
settings:
  timeout: 30000
  retry: 3
  output_format: table
  color: true
```

---

### `lydian config profile <name>`

Switch to a different profile.

**Usage:**
```bash
lydian config profile <name>
```

**Example:**
```bash
$ lydian config profile staging
✓ Switched to profile: staging
```

---

### `lydian config path`

Show configuration file path.

**Usage:**
```bash
lydian config path
```

**Example:**
```bash
$ lydian config path
/Users/john/.lydian/config.yaml
```

---

## API Key Commands

### `lydian apikey create`

Create a new API key.

**Usage:**
```bash
lydian apikey create [options]
```

**Options:**
- `-n, --name <name>` - API key name (required)
- `-s, --scopes <scopes>` - Comma-separated list of scopes (required)
- `-e, --expires-in <days>` - Expiration in days (default: 365)

**Example:**
```bash
$ lydian apikey create \
  --name "Production Key" \
  --scopes "cities:read,cities:write,personas:read" \
  --expires-in 90

✓ API key created successfully
⚠ Save this API key now. You won't be able to see it again!

API Key Details:
ID: key_abc123
Name: Production Key
API Key: lyd_sk_live_abc123def456...
Scopes: cities:read, cities:write, personas:read
Expires: 2025-04-15T10:30:00Z
```

---

### `lydian apikey list`

List all API keys.

**Usage:**
```bash
lydian apikey list [options]
```

**Options:**
- `-l, --limit <number>` - Limit number of results (default: 20)

**Example:**
```bash
$ lydian apikey list
┌────────────┬─────────────────┬────────────┬───────────────────────┬────────┬─────────────────────┬───────────┐
│ ID         │ Name            │ Prefix     │ Scopes                │ Status │ Created             │ Last Used │
├────────────┼─────────────────┼────────────┼───────────────────────┼────────┼─────────────────────┼───────────┤
│ key_abc123 │ Production Key  │ lyd_sk_abc │ cities:read,cities:wr │ active │ 2025-01-15T10:30:00Z│ 2 hours ago│
│ key_def456 │ Development Key │ lyd_sk_def │ *:*                   │ active │ 2025-01-10T08:15:00Z│ Never      │
└────────────┴─────────────────┴────────────┴───────────────────────┴────────┴─────────────────────┴───────────┘
```

---

### `lydian apikey revoke <key-id>`

Revoke an API key.

**Usage:**
```bash
lydian apikey revoke <key-id>
```

**Example:**
```bash
$ lydian apikey revoke key_abc123
✓ API key key_abc123 revoked successfully
```

---

### `lydian apikey info <key-id>`

Get API key information.

**Usage:**
```bash
lydian apikey info <key-id>
```

**Example:**
```bash
$ lydian apikey info key_abc123 --json
{
  "id": "key_abc123",
  "name": "Production Key",
  "key_prefix": "lyd_sk_abc",
  "scopes": ["cities:read", "cities:write"],
  "created_at": "2025-01-15T10:30:00Z",
  "last_used_at": "2025-01-20T14:22:00Z",
  "expires_at": "2025-04-15T10:30:00Z",
  "status": "active"
}
```

---

## Smart Cities Commands

### `lydian cities create`

Create a new city.

**Usage:**
```bash
lydian cities create [options]
```

**Options:**
- `-n, --name <name>` - City name (required)
- `-c, --country <country>` - Country (required)
- `-p, --population <number>` - Population (required)
- `-r, --region <region>` - Region/State
- `-a, --area <km2>` - Area in square kilometers
- `-t, --timezone <timezone>` - Timezone (default: UTC)
- `--lat <latitude>` - Latitude
- `--lon <longitude>` - Longitude

**Example:**
```bash
$ lydian cities create \
  --name "Istanbul" \
  --country "Turkey" \
  --region "Marmara" \
  --population 15462452 \
  --area 5461 \
  --timezone "Europe/Istanbul" \
  --lat 41.0082 \
  --lon 28.9784

✓ City created successfully
{
  "id": "city_ist001",
  "name": "Istanbul",
  "country": "Turkey",
  "region": "Marmara",
  "population": 15462452,
  "area_km2": 5461,
  "timezone": "Europe/Istanbul",
  "coordinates": {
    "latitude": 41.0082,
    "longitude": 28.9784
  },
  "created_at": "2025-01-20T10:30:00Z"
}
```

---

### `lydian cities list`

List all cities.

**Usage:**
```bash
lydian cities list [options]
```

**Options:**
- `-l, --limit <number>` - Limit number of results (default: 20)
- `-f, --filter <filter>` - Filter by name or country

**Example:**
```bash
$ lydian cities list --limit 5 --filter Turkey
┌─────────────┬──────────┬─────────┬────────────┬─────────────────┬─────────────────────┐
│ ID          │ Name     │ Country │ Population │ Timezone        │ Created             │
├─────────────┼──────────┼─────────┼────────────┼─────────────────┼─────────────────────┤
│ city_ist001 │ Istanbul │ Turkey  │ 15,462,452 │ Europe/Istanbul │ 2025-01-20T10:30:00Z│
│ city_ank001 │ Ankara   │ Turkey  │ 5,663,322  │ Europe/Istanbul │ 2025-01-18T09:15:00Z│
└─────────────┴──────────┴─────────┴────────────┴─────────────────┴─────────────────────┘
```

---

### `lydian cities get <city-id>`

Get city details.

**Usage:**
```bash
lydian cities get <city-id> [options]
```

**Example:**
```bash
$ lydian cities get city_ist001
{
  "id": "city_ist001",
  "name": "Istanbul",
  "country": "Turkey",
  "region": "Marmara",
  "population": 15462452,
  "area_km2": 5461,
  "timezone": "Europe/Istanbul",
  "coordinates": {
    "latitude": 41.0082,
    "longitude": 28.9784
  },
  "metadata": {
    "mayor": "Ekrem İmamoğlu",
    "founded": "660 BC"
  },
  "created_at": "2025-01-20T10:30:00Z",
  "updated_at": "2025-01-20T10:30:00Z"
}
```

---

### `lydian cities assets <city-id>`

List city assets (sensors, cameras, etc.).

**Usage:**
```bash
lydian cities assets <city-id> [options]
```

**Options:**
- `-t, --type <type>` - Filter by asset type
- `-l, --limit <number>` - Limit number of results (default: 50)

**Asset Types:**
- `sensor` - IoT sensors
- `camera` - Smart cameras
- `traffic_light` - Traffic lights
- `meter` - Utility meters
- `other` - Other assets

**Example:**
```bash
$ lydian cities assets city_ist001 --type sensor --limit 10
┌──────────────┬────────────────────┬────────┬────────┬──────────────────┬─────────────────────┐
│ ID           │ Name               │ Type   │ Status │ Location         │ Created             │
├──────────────┼────────────────────┼────────┼────────┼──────────────────┼─────────────────────┤
│ asset_001    │ Traffic Sensor A01 │ sensor │ active │ 41.0082, 28.9784 │ 2025-01-15T08:00:00Z│
│ asset_002    │ Air Quality Mon 02 │ sensor │ active │ 41.0150, 28.9800 │ 2025-01-15T08:05:00Z│
└──────────────┴────────────────────┴────────┴────────┴──────────────────┴─────────────────────┘
```

---

### `lydian cities metrics <city-id>`

Get city metrics.

**Usage:**
```bash
lydian cities metrics <city-id> [options]
```

**Options:**
- `-k, --kind <kind>` - Metric kind (required)
- `-f, --from <date>` - Start date (ISO format)
- `-t, --to <date>` - End date (ISO format)
- `-l, --limit <number>` - Limit number of results (default: 100)

**Metric Kinds:**
- `traffic` - Traffic flow data
- `air_quality` - Air quality index
- `energy` - Energy consumption
- `water` - Water usage
- `waste` - Waste management

**Example:**
```bash
$ lydian cities metrics city_ist001 \
  --kind traffic \
  --from 2025-01-20T00:00:00Z \
  --to 2025-01-20T23:59:59Z \
  --limit 24

┌─────────┬───────┬──────────────┬─────────────────────┐
│ Kind    │ Value │ Unit         │ Timestamp           │
├─────────┼───────┼──────────────┼─────────────────────┤
│ traffic │ 85.2  │ vehicles/min │ 2025-01-20T00:00:00Z│
│ traffic │ 92.1  │ vehicles/min │ 2025-01-20T01:00:00Z│
│ traffic │ 78.5  │ vehicles/min │ 2025-01-20T02:00:00Z│
└─────────┴───────┴──────────────┴─────────────────────┘
```

---

### `lydian cities alerts <city-id>`

Get city alerts.

**Usage:**
```bash
lydian cities alerts <city-id> [options]
```

**Options:**
- `-s, --severity <severity>` - Filter by severity (info, warning, critical)
- `-l, --limit <number>` - Limit number of results (default: 50)

**Example:**
```bash
$ lydian cities alerts city_ist001 --severity warning
┌───────────┬──────────┬───────────────────┬──────────────────────────────┬─────────────────────┬──────────┐
│ ID        │ Severity │ Type              │ Message                      │ Created             │ Resolved │
├───────────┼──────────┼───────────────────┼──────────────────────────────┼─────────────────────┼──────────┤
│ alert_001 │ warning  │ traffic_congestion│ Heavy traffic on D-100       │ 2025-01-20T08:30:00Z│ Active   │
│ alert_002 │ warning  │ air_quality       │ AQI exceeds threshold in zone│ 2025-01-20T09:15:00Z│ Active   │
└───────────┴──────────┴───────────────────┴──────────────────────────────┴─────────────────────┴──────────┘
```

---

## Personas Commands

### `lydian personas create`

Create a new persona.

**Usage:**
```bash
lydian personas create [options]
```

**Options:**
- `-n, --name <name>` - Persona name (required)
- `-t, --type <type>` - Persona type: customer, employee, citizen, agent (required)
- `-e, --email <email>` - Email address
- `-p, --phone <phone>` - Phone number
- `-a, --attributes <json>` - Additional attributes as JSON
- `-s, --skills <skills>` - Comma-separated list of skills

**Example:**
```bash
$ lydian personas create \
  --name "Sarah Johnson" \
  --type employee \
  --email "sarah@lydian.com" \
  --phone "+1-555-0199" \
  --attributes '{"department": "Engineering", "level": "Senior"}' \
  --skills "Python,Machine Learning,TensorFlow"

✓ Persona created successfully
{
  "id": "persona_abc123",
  "name": "Sarah Johnson",
  "type": "employee",
  "email": "sarah@lydian.com",
  "phone": "+1-555-0199",
  "attributes": {
    "department": "Engineering",
    "level": "Senior"
  },
  "skills": ["Python", "Machine Learning", "TensorFlow"],
  "created_at": "2025-01-20T10:45:00Z"
}
```

---

### `lydian personas list`

List all personas.

**Usage:**
```bash
lydian personas list [options]
```

**Options:**
- `-t, --type <type>` - Filter by type
- `-l, --limit <number>` - Limit number of results (default: 20)

**Example:**
```bash
$ lydian personas list --type employee --limit 5
┌──────────────┬──────────────┬──────────┬───────────────────────┬────────┬─────────────────────┐
│ ID           │ Name         │ Type     │ Email                 │ Skills │ Created             │
├──────────────┼──────────────┼──────────┼───────────────────────┼────────┼─────────────────────┤
│ persona_001  │ Sarah Johnson│ employee │ sarah@lydian.com      │ 3      │ 2025-01-20T10:45:00Z│
│ persona_002  │ Mike Chen    │ employee │ mike.chen@lydian.com  │ 5      │ 2025-01-19T14:20:00Z│
└──────────────┴──────────────┴──────────┴───────────────────────┴────────┴─────────────────────┘
```

---

### `lydian personas get <persona-id>`

Get persona details.

**Usage:**
```bash
lydian personas get <persona-id> [options]
```

**Example:**
```bash
$ lydian personas get persona_abc123
{
  "id": "persona_abc123",
  "name": "Sarah Johnson",
  "type": "employee",
  "email": "sarah@lydian.com",
  "phone": "+1-555-0199",
  "attributes": {
    "department": "Engineering",
    "level": "Senior",
    "team": "AI Research"
  },
  "skills": ["Python", "Machine Learning", "TensorFlow"],
  "preferences": {
    "notification_channel": "email",
    "language": "en"
  },
  "created_at": "2025-01-20T10:45:00Z",
  "updated_at": "2025-01-20T15:30:00Z"
}
```

---

### `lydian personas skills <persona-id>`

Manage persona skills.

**Usage:**
```bash
lydian personas skills <persona-id> [options]
```

**Options:**
- `-l, --list` - List all skills (default if no other option)
- `--add <skill>` - Add a new skill
- `--remove <skill-id>` - Remove a skill
- `--publish <skill-id>` - Publish a skill

**Examples:**
```bash
# List skills
$ lydian personas skills persona_abc123 --list
┌──────────────┬──────────────────┬──────────────┬────────────┬──────────┬─────────────────────┐
│ ID           │ Name             │ Category     │ Proficiency│ Verified │ Created             │
├──────────────┼──────────────────┼──────────────┼────────────┼──────────┼─────────────────────┤
│ skill_001    │ Python           │ Programming  │ 0.95       │ true     │ 2025-01-20T10:45:00Z│
│ skill_002    │ Machine Learning │ AI/ML        │ 0.88       │ true     │ 2025-01-20T10:45:00Z│
│ skill_003    │ TensorFlow       │ Frameworks   │ 0.82       │ false    │ 2025-01-20T10:45:00Z│
└──────────────┴──────────────────┴──────────────┴────────────┴──────────┴─────────────────────┘

# Add skill
$ lydian personas skills persona_abc123 --add "PyTorch"
✓ Skill added successfully

# Publish skill
$ lydian personas skills persona_abc123 --publish skill_003
✓ Skill published successfully
```

---

## Signals Commands

### `lydian signals send`

Send a new signal.

**Usage:**
```bash
lydian signals send [options]
```

**Options:**
- `-t, --type <type>` - Signal type: metric, event, alert, insight (required)
- `-d, --data <json>` - Signal data as JSON (required)
- `-s, --source <source>` - Signal source
- `-m, --metadata <json>` - Additional metadata as JSON

**Example:**
```bash
$ lydian signals send \
  --type metric \
  --source "temperature-sensor-01" \
  --data '{"temperature": 25.5, "unit": "celsius", "location": "zone-a"}' \
  --metadata '{"sensor_model": "TH-100", "firmware": "v2.1"}'

✓ Signal sent successfully
{
  "id": "signal_xyz789",
  "type": "metric",
  "source": "temperature-sensor-01",
  "timestamp": "2025-01-20T11:00:00Z",
  "data": {
    "temperature": 25.5,
    "unit": "celsius",
    "location": "zone-a"
  },
  "metadata": {
    "sensor_model": "TH-100",
    "firmware": "v2.1"
  },
  "processed": false,
  "created_at": "2025-01-20T11:00:00Z"
}
```

---

### `lydian signals list`

List all signals.

**Usage:**
```bash
lydian signals list [options]
```

**Options:**
- `-t, --type <type>` - Filter by type
- `-s, --source <source>` - Filter by source
- `-l, --limit <number>` - Limit number of results (default: 50)

**Example:**
```bash
$ lydian signals list --type metric --limit 5
┌──────────────┬────────┬──────────────────────┬─────────────────────┬───────────┬─────────────────────┐
│ ID           │ Type   │ Source               │ Timestamp           │ Processed │ Created             │
├──────────────┼────────┼──────────────────────┼─────────────────────┼───────────┼─────────────────────┤
│ signal_001   │ metric │ temperature-sensor-01│ 2025-01-20T11:00:00Z│ true      │ 2025-01-20T11:00:00Z│
│ signal_002   │ metric │ temperature-sensor-02│ 2025-01-20T11:05:00Z│ true      │ 2025-01-20T11:05:00Z│
└──────────────┴────────┴──────────────────────┴─────────────────────┴───────────┴─────────────────────┘
```

---

### `lydian signals insights <signal-id>`

Get insights for a signal.

**Usage:**
```bash
lydian signals insights <signal-id> [options]
```

**Example:**
```bash
$ lydian signals insights signal_xyz789
┌──────────────┬─────────────────────┬──────────────────────────────────┬────────────┬─────────────────────┐
│ ID           │ Type                │ Content                          │ Confidence │ Created             │
├──────────────┼─────────────────────┼──────────────────────────────────┼────────────┼─────────────────────┤
│ insight_001  │ anomaly_detection   │ Temperature spike detected       │ 92.5%      │ 2025-01-20T11:01:00Z│
│ insight_002  │ trend_analysis      │ Increasing trend over 24h        │ 87.3%      │ 2025-01-20T11:01:05Z│
│ insight_003  │ correlation         │ Correlated with humidity changes │ 78.9%      │ 2025-01-20T11:01:10Z│
└──────────────┴─────────────────────┴──────────────────────────────────┴────────────┴─────────────────────┘
```

---

### `lydian signals kg`

Query knowledge graph.

**Usage:**
```bash
lydian signals kg [options]
```

**Options:**
- `-q, --query <query>` - Graph query
- `-n, --node <node-id>` - Get specific node
- `-d, --depth <depth>` - Traversal depth (default: 2)

**Example:**
```bash
$ lydian signals kg --query "temperature > 30" --depth 3

Knowledge Graph:
Nodes: 15
Edges: 23

─────────────────────────────────────────────────

Nodes:
┌──────────────┬─────────┬──────────────────────┐
│ ID           │ Type    │ Label                │
├──────────────┼─────────┼──────────────────────┤
│ node_001     │ sensor  │ Temperature Sensor 01│
│ node_002     │ zone    │ Zone A               │
│ node_003     │ alert   │ High Temp Alert      │
└──────────────┴─────────┴──────────────────────┘

─────────────────────────────────────────────────

Relationships:
┌──────────────┬──────────────┬──────────────┐
│ Source       │ Relationship │ Target       │
├──────────────┼──────────────┼──────────────┤
│ node_001     │ located_in   │ node_002     │
│ node_001     │ triggered    │ node_003     │
│ node_002     │ contains     │ node_001     │
└──────────────┴──────────────┴──────────────┘
```

---

## Modules Commands

### `lydian modules list`

List all available modules.

**Usage:**
```bash
lydian modules list [options]
```

**Options:**
- `--status <status>` - Filter by status (active, inactive, deprecated)

**Example:**
```bash
$ lydian modules list
┌──────────────┬────────────────┬─────────┬────────┬──────────────┬───────────────────────────────┐
│ ID           │ Name           │ Version │ Status │ Capabilities │ Description                   │
├──────────────┼────────────────┼─────────┼────────┼──────────────┼───────────────────────────────┤
│ mod_cities   │ Smart Cities   │ 2.1.0   │ active │ 12           │ IoT and urban management      │
│ mod_personas │ Insan-IQ       │ 1.8.0   │ active │ 8            │ Persona and skill management  │
│ mod_signals  │ LyDian-IQ      │ 3.0.0   │ active │ 15           │ Signals and knowledge graph   │
└──────────────┴────────────────┴─────────┴────────┴──────────────┴───────────────────────────────┘
```

---

### `lydian modules info <module-id>`

Get detailed module information.

**Usage:**
```bash
lydian modules info <module-id> [options]
```

**Example:**
```bash
$ lydian modules info mod_cities

Module Information:
ID: mod_cities
Name: Smart Cities
Version: 2.1.0
Status: active
Description: Complete IoT and urban management platform

─────────────────────────────────────────────────

Capabilities:
  • City management
  • Asset tracking
  • Real-time metrics
  • Alert system
  • Traffic monitoring
  • Air quality monitoring
  • Energy management
  • Water management
  • Waste management
  • Public transport
  • Emergency services
  • Citizen engagement

─────────────────────────────────────────────────

Endpoints:
cities: /api/cities
assets: /api/cities/{id}/assets
metrics: /api/cities/{id}/metrics
alerts: /api/cities/{id}/alerts

─────────────────────────────────────────────────

Documentation: https://lydian.com/docs/modules/smart-cities
```

---

## Global Options

All commands support these global options:

### `--verbose`

Enable verbose output with detailed logging.

**Example:**
```bash
$ lydian cities list --verbose
→ Loading configuration from /Users/john/.lydian/config.yaml
→ Using profile: production
→ Endpoint: https://api.lydian.com
→ Making request: GET /api/cities?limit=20
→ Request completed in 234ms
[... results ...]
```

---

### `--json`

Output results as JSON.

**Example:**
```bash
$ lydian cities list --json
[
  {
    "id": "city_ist001",
    "name": "Istanbul",
    "country": "Turkey"
  }
]
```

---

### `--yaml`

Output results as YAML.

**Example:**
```bash
$ lydian cities list --yaml
- id: city_ist001
  name: Istanbul
  country: Turkey
```

---

### `--silent`

Suppress all output (useful for scripts).

**Example:**
```bash
$ lydian auth login --silent
$ echo $?
0
```

---

### `--timeout <ms>`

Set request timeout in milliseconds.

**Example:**
```bash
$ lydian cities list --timeout 60000
```

---

### `--retry <count>`

Set number of retry attempts for failed requests.

**Example:**
```bash
$ lydian cities list --retry 5
```

---

### `--profile <name>`

Use a specific configuration profile for the command.

**Example:**
```bash
$ lydian cities list --profile staging
```

---

### `--help`

Display help for any command.

**Example:**
```bash
$ lydian cities create --help
```

---

### `--version`

Display CLI version.

**Example:**
```bash
$ lydian --version
1.0.0
```

---

## Exit Codes

The CLI uses these exit codes:

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | General error |
| 2 | Usage error (invalid arguments) |
| 3 | Authentication error |
| 4 | Resource not found |
| 5 | Network error |
| 6 | Configuration error |

---

## Environment Variables

The CLI respects these environment variables:

- `LYDIAN_CONFIG_PATH` - Custom config file location
- `LYDIAN_PROFILE` - Default profile to use
- `LYDIAN_API_KEY` - API key for authentication
- `LYDIAN_ENDPOINT` - API endpoint URL
- `NO_COLOR` - Disable colored output

**Example:**
```bash
export LYDIAN_PROFILE=staging
export NO_COLOR=1
lydian cities list
```

---

## Tips and Tricks

### Using jq for JSON processing

```bash
# Get only city names
lydian cities list --json | jq '.[].name'

# Filter cities by population
lydian cities list --json | jq '.[] | select(.population > 10000000)'
```

### Piping output

```bash
# Export to file
lydian cities list --json > cities.json

# Count results
lydian cities list --json | jq '. | length'
```

### Scripting

```bash
#!/bin/bash
# Create multiple cities from CSV
while IFS=, read -r name country population; do
  lydian cities create \
    --name "$name" \
    --country "$country" \
    --population "$population" \
    --silent
done < cities.csv
```

---

For more information, visit https://lydian.com/docs/cli
