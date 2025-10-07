# LyDian CLI - Project Structure

```
lydian-cli/
│
├── 📦 Package Configuration
│   ├── package.json                # Dependencies & scripts
│   └── tsconfig.json              # TypeScript configuration
│
├── 🚀 Executable
│   └── bin/
│       └── lydian.js              # CLI entry point (executable)
│
├── 💻 Source Code
│   └── src/
│       ├── index.ts               # Main CLI application
│       │
│       ├── commands/              # Command implementations
│       │   ├── auth.ts           # Authentication (login, logout, whoami, refresh)
│       │   ├── config.ts         # Configuration (init, set, get, list, profile)
│       │   ├── apikey.ts         # API Keys (create, list, revoke, info)
│       │   ├── cities.ts         # Smart Cities (create, list, get, assets, metrics, alerts)
│       │   ├── personas.ts       # Insan-IQ (create, list, get, skills)
│       │   ├── signals.ts        # LyDian-IQ (send, list, insights, kg)
│       │   └── modules.ts        # Modules (list, info)
│       │
│       ├── lib/                  # Core libraries
│       │   ├── client.ts         # HTTP client with auth & retry logic
│       │   ├── auth.ts           # OAuth2 device flow & token management
│       │   ├── config.ts         # Configuration file management
│       │   ├── output.ts         # Output formatters (table/JSON/YAML)
│       │   └── errors.ts         # Error handling & exit codes
│       │
│       └── types/                # TypeScript definitions
│           └── index.ts          # All type definitions
│
├── 🐚 Shell Completions
│   └── completions/
│       ├── bash.sh               # Bash completion script
│       ├── zsh.sh                # Zsh completion script
│       ├── fish.sh               # Fish completion script
│       └── powershell.ps1        # PowerShell completion script
│
├── 📚 Examples
│   └── examples/
│       ├── quickstart.sh         # Quick start guide
│       ├── cities-workflow.sh    # Smart cities workflow
│       └── personas-workflow.sh  # Personas workflow
│
└── 📖 Documentation
    ├── README.md                 # Installation & usage guide
    ├── MANUAL.md                 # Complete command reference
    ├── BRIEF-D.md                # Implementation report
    └── STRUCTURE.md              # This file
```

## Command Tree

```
lydian
│
├── auth
│   ├── login                     # OAuth2 device flow authentication
│   ├── logout                    # Sign out & clear credentials
│   ├── whoami                    # Display current user info
│   └── refresh                   # Refresh access token
│
├── config
│   ├── init                      # Initialize configuration
│   ├── set <key> <value>        # Set config value
│   ├── get <key>                # Get config value
│   ├── list                      # List all configuration
│   ├── profile <name>           # Switch profile
│   └── path                      # Show config file path
│
├── apikey
│   ├── create                    # Create new API key
│   ├── list                      # List all API keys
│   ├── revoke <key-id>          # Revoke an API key
│   └── info <key-id>            # Get API key details
│
├── cities (Smart Cities Module)
│   ├── create                    # Create new city
│   ├── list                      # List all cities
│   ├── get <city-id>            # Get city details
│   ├── assets <city-id>         # List city assets (sensors, cameras)
│   ├── metrics <city-id>        # Get city metrics (traffic, air quality)
│   └── alerts <city-id>         # Get city alerts
│
├── personas (Insan-IQ Module)
│   ├── create                    # Create new persona
│   ├── list                      # List all personas
│   ├── get <persona-id>         # Get persona details
│   └── skills <persona-id>      # Manage persona skills
│       ├── --list               # List all skills
│       ├── --add <skill>        # Add new skill
│       ├── --remove <skill-id>  # Remove skill
│       └── --publish <skill-id> # Publish skill
│
├── signals (LyDian-IQ Module)
│   ├── send                      # Send new signal
│   ├── list                      # List all signals
│   ├── insights <signal-id>     # Get signal insights
│   └── kg                        # Query knowledge graph
│       ├── --query <query>      # Graph query
│       ├── --node <node-id>     # Get specific node
│       └── --depth <depth>      # Traversal depth
│
├── modules
│   ├── list                      # List all modules
│   └── info <module-id>         # Get module details
│
└── completion <shell>            # Generate shell completion
    ├── bash
    ├── zsh
    ├── fish
    └── powershell
```

## Global Flags

Available on all commands:

```
--verbose          Enable verbose output
--json             Output as JSON
--yaml             Output as YAML
--silent           Suppress all output
--timeout <ms>     Request timeout in milliseconds
--retry <count>    Number of retry attempts
--profile <name>   Use specific configuration profile
--help             Show help
-v, --version      Show version
```

## Technology Stack

### Core Dependencies
- **commander** - CLI framework
- **chalk** - Colored terminal output
- **inquirer** - Interactive prompts
- **ora** - Progress spinners
- **axios** - HTTP client
- **yaml** - YAML parser
- **cli-table3** - Table formatting
- **jsonwebtoken** - JWT handling

### Development
- **TypeScript 5.3.2** - Type safety
- **Node.js 16+** - Runtime
- **ESLint** - Code linting
- **Prettier** - Code formatting

## File Statistics

- **Total Files:** 26
- **TypeScript Files:** 15
- **Lines of Code:** ~2,700+
- **Shell Scripts:** 7
- **Documentation:** 4

## Configuration File

Location: `~/.lydian/config.yaml`

```yaml
current_profile: production

profiles:
  development:
    endpoint: https://dev.api.lydian.com
    auth_method: apikey
    apikey: dev_xxxxx

  staging:
    endpoint: https://staging.api.lydian.com
    auth_method: oauth2
    access_token: eyJhbGc...
    refresh_token: eyJhbGc...

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

## Exit Codes

```
0 - Success
1 - General error
2 - Usage error (invalid arguments)
3 - Authentication error
4 - Resource not found
5 - Network error
6 - Configuration error
```

## Installation

```bash
# From npm (when published)
npm install -g @lydian/cli

# From source
git clone https://github.com/lydian/cli.git
cd cli
npm install
npm run build
npm link
```

## Quick Start

```bash
# Initialize
lydian config init

# Authenticate
lydian auth login

# Create API key
lydian apikey create --name "My Key" --scopes "cities:*"

# Use the CLI
lydian cities list
lydian personas create --name "John" --type customer
lydian signals send --type metric --data '{"temp": 25}'
```

## Support

- **Documentation:** https://lydian.com/docs/cli
- **Issues:** https://github.com/lydian/cli/issues
- **Email:** support@lydian.com
