# LyDian CLI

<p align="center">
  <img src="https://lydian.com/assets/logo.svg" alt="LyDian Logo" width="200"/>
</p>

<p align="center">
  <strong>Official Command-Line Interface for LyDian Enterprise Platform</strong>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#commands">Commands</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#support">Support</a>
</p>

---

## Overview

The LyDian CLI is a powerful command-line tool for managing LyDian Enterprise Platform services including Smart Cities, Insan-IQ (Personas), and LyDian-IQ (Signals & Knowledge Graph).

### Features

- **Authentication**: OAuth2 device flow & API key management
- **Smart Cities**: Manage cities, assets, metrics, and alerts
- **Insan-IQ**: Create and manage personas with skills
- **LyDian-IQ**: Send signals, get insights, query knowledge graph
- **Multiple Output Formats**: JSON, YAML, and formatted tables
- **Shell Completions**: Bash, Zsh, Fish, PowerShell
- **Configuration Profiles**: Manage multiple environments
- **Comprehensive Error Handling**: Clear error messages and exit codes

---

## Installation

### Prerequisites

- Node.js 16.0.0 or higher
- npm 8.0.0 or higher

### Install from npm

```bash
npm install -g @lydian/cli
```

### Install from source

```bash
git clone https://github.com/lydian/cli.git
cd cli
npm install
npm run build
npm link
```

### Verify installation

```bash
lydian --version
```

---

## Quick Start

### 1. Initialize Configuration

```bash
lydian config init
```

This creates `~/.lydian/config.yaml` with default settings.

### 2. Authenticate

```bash
lydian auth login
```

Follow the OAuth2 device flow instructions to authenticate.

### 3. Check Authentication

```bash
lydian auth whoami
```

### 4. Create an API Key

```bash
lydian apikey create \
  --name "My API Key" \
  --scopes "cities:read,cities:write,personas:read,signals:write"
```

### 5. Start Using Commands

```bash
# List available modules
lydian modules list

# Create a city
lydian cities create --name "Istanbul" --country "Turkey" --population 15462452

# Create a persona
lydian personas create --name "John Doe" --type customer

# Send a signal
lydian signals send --type metric --data '{"temperature": 25.5}'
```

---

## Commands

### Authentication

| Command | Description |
|---------|-------------|
| `lydian auth login` | Authenticate with OAuth2 device flow |
| `lydian auth logout` | Sign out and clear credentials |
| `lydian auth whoami` | Display current user information |
| `lydian auth refresh` | Refresh authentication token |

### Configuration

| Command | Description |
|---------|-------------|
| `lydian config init` | Initialize configuration |
| `lydian config set <key> <value>` | Set a configuration value |
| `lydian config get <key>` | Get a configuration value |
| `lydian config list` | List all configuration |
| `lydian config profile <name>` | Switch to a different profile |
| `lydian config path` | Show configuration file path |

### API Keys

| Command | Description |
|---------|-------------|
| `lydian apikey create` | Create a new API key |
| `lydian apikey list` | List all API keys |
| `lydian apikey revoke <key-id>` | Revoke an API key |
| `lydian apikey info <key-id>` | Get API key information |

### Smart Cities

| Command | Description |
|---------|-------------|
| `lydian cities create` | Create a new city |
| `lydian cities list` | List all cities |
| `lydian cities get <city-id>` | Get city details |
| `lydian cities assets <city-id>` | List city assets |
| `lydian cities metrics <city-id>` | Get city metrics |
| `lydian cities alerts <city-id>` | Get city alerts |

### Personas (Insan-IQ)

| Command | Description |
|---------|-------------|
| `lydian personas create` | Create a new persona |
| `lydian personas list` | List all personas |
| `lydian personas get <persona-id>` | Get persona details |
| `lydian personas skills <persona-id>` | Manage persona skills |

### Signals (LyDian-IQ)

| Command | Description |
|---------|-------------|
| `lydian signals send` | Send a new signal |
| `lydian signals list` | List all signals |
| `lydian signals insights <signal-id>` | Get insights for a signal |
| `lydian signals kg` | Query knowledge graph |

### Modules

| Command | Description |
|---------|-------------|
| `lydian modules list` | List all available modules |
| `lydian modules info <module-id>` | Get detailed module information |

---

## Global Flags

All commands support these global flags:

| Flag | Description |
|------|-------------|
| `--verbose` | Enable verbose output |
| `--json` | Output as JSON |
| `--yaml` | Output as YAML |
| `--silent` | Suppress all output |
| `--timeout <ms>` | Request timeout in milliseconds |
| `--retry <count>` | Number of retry attempts |
| `--profile <name>` | Use specific configuration profile |
| `--help` | Show help |
| `--version` | Show version |

---

## Shell Completions

### Bash

```bash
lydian completion bash > /etc/bash_completion.d/lydian
# Or add to ~/.bashrc:
source <(lydian completion bash)
```

### Zsh

```bash
lydian completion zsh > ~/.zsh/completions/_lydian
# Or add to ~/.zshrc:
source <(lydian completion zsh)
```

### Fish

```bash
lydian completion fish > ~/.config/fish/completions/lydian.fish
```

### PowerShell

```powershell
lydian completion powershell | Out-String | Invoke-Expression
# Or add to profile:
lydian completion powershell >> $PROFILE
```

---

## Configuration

Configuration is stored in `~/.lydian/config.yaml`:

```yaml
current_profile: production

profiles:
  development:
    endpoint: https://dev.api.lydian.com
    auth_method: apikey
    apikey: dev_xxxxx

  production:
    endpoint: https://api.lydian.com
    auth_method: oauth2
    access_token: eyJhbGc...
    refresh_token: eyJhbGc...

settings:
  timeout: 30000
  retry: 3
  output_format: table
  color: true
```

### Multiple Profiles

```bash
# Switch to staging profile
lydian config profile staging

# Use specific profile for a command
lydian cities list --profile production
```

---

## Examples

### Create a Smart City

```bash
lydian cities create \
  --name "Istanbul" \
  --country "Turkey" \
  --region "Marmara" \
  --population 15462452 \
  --area 5461 \
  --timezone "Europe/Istanbul" \
  --lat 41.0082 \
  --lon 28.9784
```

### Query City Metrics

```bash
lydian cities metrics city_123 \
  --kind traffic \
  --from 2025-01-01T00:00:00Z \
  --to 2025-01-07T23:59:59Z \
  --limit 100
```

### Create a Persona

```bash
lydian personas create \
  --name "John Smith" \
  --type customer \
  --email "john@example.com" \
  --attributes '{"age": 35, "location": "NYC"}' \
  --skills "JavaScript,Python,AI"
```

### Send a Signal

```bash
lydian signals send \
  --type metric \
  --source "temperature-sensor-01" \
  --data '{"temperature": 25.5, "unit": "celsius", "location": "zone-a"}'
```

### Query Knowledge Graph

```bash
lydian signals kg \
  --query "temperature > 30" \
  --depth 3 \
  --json
```

---

## Output Formats

### Table (Default)

```bash
lydian cities list
```

```
┌──────────┬──────────┬─────────┬────────────┬───────────────┬─────────────────────┐
│ ID       │ Name     │ Country │ Population │ Timezone      │ Created             │
├──────────┼──────────┼─────────┼────────────┼───────────────┼─────────────────────┤
│ city_123 │ Istanbul │ Turkey  │ 15,462,452 │ Europe/Istanbul│ 2025-01-15T10:30:00Z│
└──────────┴──────────┴─────────┴────────────┴───────────────┴─────────────────────┘
```

### JSON

```bash
lydian cities list --json
```

```json
[
  {
    "id": "city_123",
    "name": "Istanbul",
    "country": "Turkey",
    "population": 15462452,
    "timezone": "Europe/Istanbul",
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

### YAML

```bash
lydian cities list --yaml
```

```yaml
- id: city_123
  name: Istanbul
  country: Turkey
  population: 15462452
  timezone: Europe/Istanbul
  created_at: 2025-01-15T10:30:00Z
```

---

## Error Handling

The CLI uses standard exit codes:

| Exit Code | Description |
|-----------|-------------|
| 0 | Success |
| 1 | General error |
| 2 | Usage error |
| 3 | Authentication error |
| 4 | Resource not found |
| 5 | Network error |
| 6 | Configuration error |

### Example Error

```bash
$ lydian cities get invalid_id
Error: Resource not found
Details: City with ID 'invalid_id' does not exist
Request ID: req_abc123
$ echo $?
4
```

---

## Troubleshooting

### Authentication Issues

```bash
# Clear credentials and re-authenticate
lydian auth logout
lydian auth login
```

### Connection Errors

```bash
# Check current endpoint
lydian config get endpoint

# Increase timeout
lydian cities list --timeout 60000

# Enable verbose mode
lydian cities list --verbose
```

### Configuration Issues

```bash
# Reset configuration
rm ~/.lydian/config.yaml
lydian config init
```

---

## Security

- Configuration file has secure permissions (0600)
- OAuth2 tokens are encrypted at rest
- API keys are never logged
- HTTPS-only connections
- Input validation on all commands

---

## Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Linting

```bash
npm run lint
```

### Format Code

```bash
npm run format
```

---

## Documentation

- [Full Command Reference](./MANUAL.md)
- [API Documentation](https://lydian.com/docs/api)
- [Platform Documentation](https://lydian.com/docs)
- [Examples](./examples/)

---

## Support

- **Documentation**: https://lydian.com/docs/cli
- **Issues**: https://github.com/lydian/cli/issues
- **Email**: support@lydian.com
- **Community**: https://community.lydian.com

---

## License

MIT License - see [LICENSE](./LICENSE) file for details

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

---

<p align="center">
  Made with ❤️ by the LyDian Team
</p>
