#!/bin/zsh
# LyDian CLI Zsh Completion Script
# Installation: source this file or add to ~/.zshrc

#compdef lydian

_lydian() {
    local -a commands auth_cmds config_cmds apikey_cmds cities_cmds personas_cmds signals_cmds modules_cmds

    commands=(
        'auth:Manage authentication'
        'config:Manage CLI configuration'
        'apikey:Manage API keys'
        'cities:Manage smart cities'
        'personas:Manage personas (Insan-IQ)'
        'signals:Manage signals (LyDian-IQ)'
        'modules:Manage platform modules'
        'completion:Generate shell completion script'
    )

    auth_cmds=(
        'login:Authenticate with LyDian platform'
        'logout:Sign out and clear credentials'
        'whoami:Display current user information'
        'refresh:Refresh authentication token'
    )

    config_cmds=(
        'init:Initialize configuration'
        'set:Set a configuration value'
        'get:Get a configuration value'
        'list:List all configuration'
        'profile:Switch to a different profile'
        'path:Show configuration file path'
    )

    apikey_cmds=(
        'create:Create a new API key'
        'list:List all API keys'
        'revoke:Revoke an API key'
        'info:Get API key information'
    )

    cities_cmds=(
        'create:Create a new city'
        'list:List all cities'
        'get:Get city details'
        'assets:List city assets'
        'metrics:Get city metrics'
        'alerts:Get city alerts'
    )

    personas_cmds=(
        'create:Create a new persona'
        'list:List all personas'
        'get:Get persona details'
        'skills:Manage persona skills'
    )

    signals_cmds=(
        'send:Send a new signal'
        'list:List all signals'
        'insights:Get insights for a signal'
        'kg:Query knowledge graph'
    )

    modules_cmds=(
        'list:List all available modules'
        'info:Get detailed module information'
    )

    _arguments -C \
        '1: :->command' \
        '*:: :->args' \
        '--verbose[Enable verbose output]' \
        '--json[Output as JSON]' \
        '--yaml[Output as YAML]' \
        '--silent[Suppress all output]' \
        '--timeout[Request timeout in milliseconds]:timeout:' \
        '--retry[Number of retry attempts]:retry:' \
        '--profile[Use specific configuration profile]:profile:' \
        '--help[Show help]' \
        '--version[Show version]'

    case $state in
        command)
            _describe 'lydian command' commands
            ;;
        args)
            case $words[1] in
                auth)
                    _describe 'auth command' auth_cmds
                    ;;
                config)
                    _describe 'config command' config_cmds
                    ;;
                apikey)
                    _describe 'apikey command' apikey_cmds
                    ;;
                cities)
                    _describe 'cities command' cities_cmds
                    ;;
                personas)
                    _describe 'personas command' personas_cmds
                    ;;
                signals)
                    _describe 'signals command' signals_cmds
                    ;;
                modules)
                    _describe 'modules command' modules_cmds
                    ;;
                completion)
                    _arguments '1:shell:(bash zsh fish powershell)'
                    ;;
            esac
            ;;
    esac
}

_lydian "$@"

# Usage:
# Source this file: source /path/to/zsh.sh
# Or add to ~/.zshrc: echo 'source /path/to/zsh.sh' >> ~/.zshrc
