# LyDian CLI Fish Completion Script
# Installation: Copy to ~/.config/fish/completions/lydian.fish

# Main commands
complete -c lydian -n "__fish_use_subcommand" -a "auth" -d "Manage authentication"
complete -c lydian -n "__fish_use_subcommand" -a "config" -d "Manage CLI configuration"
complete -c lydian -n "__fish_use_subcommand" -a "apikey" -d "Manage API keys"
complete -c lydian -n "__fish_use_subcommand" -a "cities" -d "Manage smart cities"
complete -c lydian -n "__fish_use_subcommand" -a "personas" -d "Manage personas (Insan-IQ)"
complete -c lydian -n "__fish_use_subcommand" -a "signals" -d "Manage signals (LyDian-IQ)"
complete -c lydian -n "__fish_use_subcommand" -a "modules" -d "Manage platform modules"
complete -c lydian -n "__fish_use_subcommand" -a "completion" -d "Generate shell completion script"

# Global options
complete -c lydian -l verbose -d "Enable verbose output"
complete -c lydian -l json -d "Output as JSON"
complete -c lydian -l yaml -d "Output as YAML"
complete -c lydian -l silent -d "Suppress all output"
complete -c lydian -l timeout -d "Request timeout in milliseconds"
complete -c lydian -l retry -d "Number of retry attempts"
complete -c lydian -l profile -d "Use specific configuration profile"
complete -c lydian -l help -d "Show help"
complete -c lydian -s v -l version -d "Show version"

# Auth subcommands
complete -c lydian -n "__fish_seen_subcommand_from auth" -a "login" -d "Authenticate with LyDian platform"
complete -c lydian -n "__fish_seen_subcommand_from auth" -a "logout" -d "Sign out and clear credentials"
complete -c lydian -n "__fish_seen_subcommand_from auth" -a "whoami" -d "Display current user information"
complete -c lydian -n "__fish_seen_subcommand_from auth" -a "refresh" -d "Refresh authentication token"

# Config subcommands
complete -c lydian -n "__fish_seen_subcommand_from config" -a "init" -d "Initialize configuration"
complete -c lydian -n "__fish_seen_subcommand_from config" -a "set" -d "Set a configuration value"
complete -c lydian -n "__fish_seen_subcommand_from config" -a "get" -d "Get a configuration value"
complete -c lydian -n "__fish_seen_subcommand_from config" -a "list" -d "List all configuration"
complete -c lydian -n "__fish_seen_subcommand_from config" -a "profile" -d "Switch to a different profile"
complete -c lydian -n "__fish_seen_subcommand_from config" -a "path" -d "Show configuration file path"

# Apikey subcommands
complete -c lydian -n "__fish_seen_subcommand_from apikey" -a "create" -d "Create a new API key"
complete -c lydian -n "__fish_seen_subcommand_from apikey" -a "list" -d "List all API keys"
complete -c lydian -n "__fish_seen_subcommand_from apikey" -a "revoke" -d "Revoke an API key"
complete -c lydian -n "__fish_seen_subcommand_from apikey" -a "info" -d "Get API key information"

# Cities subcommands
complete -c lydian -n "__fish_seen_subcommand_from cities" -a "create" -d "Create a new city"
complete -c lydian -n "__fish_seen_subcommand_from cities" -a "list" -d "List all cities"
complete -c lydian -n "__fish_seen_subcommand_from cities" -a "get" -d "Get city details"
complete -c lydian -n "__fish_seen_subcommand_from cities" -a "assets" -d "List city assets"
complete -c lydian -n "__fish_seen_subcommand_from cities" -a "metrics" -d "Get city metrics"
complete -c lydian -n "__fish_seen_subcommand_from cities" -a "alerts" -d "Get city alerts"

# Personas subcommands
complete -c lydian -n "__fish_seen_subcommand_from personas" -a "create" -d "Create a new persona"
complete -c lydian -n "__fish_seen_subcommand_from personas" -a "list" -d "List all personas"
complete -c lydian -n "__fish_seen_subcommand_from personas" -a "get" -d "Get persona details"
complete -c lydian -n "__fish_seen_subcommand_from personas" -a "skills" -d "Manage persona skills"

# Signals subcommands
complete -c lydian -n "__fish_seen_subcommand_from signals" -a "send" -d "Send a new signal"
complete -c lydian -n "__fish_seen_subcommand_from signals" -a "list" -d "List all signals"
complete -c lydian -n "__fish_seen_subcommand_from signals" -a "insights" -d "Get insights for a signal"
complete -c lydian -n "__fish_seen_subcommand_from signals" -a "kg" -d "Query knowledge graph"

# Modules subcommands
complete -c lydian -n "__fish_seen_subcommand_from modules" -a "list" -d "List all available modules"
complete -c lydian -n "__fish_seen_subcommand_from modules" -a "info" -d "Get detailed module information"

# Completion shells
complete -c lydian -n "__fish_seen_subcommand_from completion" -a "bash zsh fish powershell" -d "Shell type"
