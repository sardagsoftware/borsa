#!/bin/bash
# LyDian CLI Bash Completion Script
# Installation: source this file or add to ~/.bashrc

_lydian_completion() {
    local cur prev opts
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"

    # Main commands
    local commands="auth config apikey cities personas signals modules completion"

    # Auth subcommands
    local auth_cmds="login logout whoami refresh"

    # Config subcommands
    local config_cmds="init set get list profile path"

    # Apikey subcommands
    local apikey_cmds="create list revoke info"

    # Cities subcommands
    local cities_cmds="create list get assets metrics alerts"

    # Personas subcommands
    local personas_cmds="create list get skills"

    # Signals subcommands
    local signals_cmds="send list insights kg"

    # Modules subcommands
    local modules_cmds="list info"

    # Global options
    local global_opts="--verbose --json --yaml --silent --timeout --retry --profile --help --version"

    if [ $COMP_CWORD -eq 1 ]; then
        COMPREPLY=( $(compgen -W "${commands} ${global_opts}" -- ${cur}) )
        return 0
    fi

    case "${COMP_WORDS[1]}" in
        auth)
            if [ $COMP_CWORD -eq 2 ]; then
                COMPREPLY=( $(compgen -W "${auth_cmds}" -- ${cur}) )
            fi
            ;;
        config)
            if [ $COMP_CWORD -eq 2 ]; then
                COMPREPLY=( $(compgen -W "${config_cmds}" -- ${cur}) )
            fi
            ;;
        apikey)
            if [ $COMP_CWORD -eq 2 ]; then
                COMPREPLY=( $(compgen -W "${apikey_cmds}" -- ${cur}) )
            fi
            ;;
        cities)
            if [ $COMP_CWORD -eq 2 ]; then
                COMPREPLY=( $(compgen -W "${cities_cmds}" -- ${cur}) )
            fi
            ;;
        personas)
            if [ $COMP_CWORD -eq 2 ]; then
                COMPREPLY=( $(compgen -W "${personas_cmds}" -- ${cur}) )
            fi
            ;;
        signals)
            if [ $COMP_CWORD -eq 2 ]; then
                COMPREPLY=( $(compgen -W "${signals_cmds}" -- ${cur}) )
            fi
            ;;
        modules)
            if [ $COMP_CWORD -eq 2 ]; then
                COMPREPLY=( $(compgen -W "${modules_cmds}" -- ${cur}) )
            fi
            ;;
        completion)
            if [ $COMP_CWORD -eq 2 ]; then
                COMPREPLY=( $(compgen -W "bash zsh fish powershell" -- ${cur}) )
            fi
            ;;
    esac

    return 0
}

complete -F _lydian_completion lydian

# Usage:
# Source this file: source /path/to/bash.sh
# Or add to ~/.bashrc: echo 'source /path/to/bash.sh' >> ~/.bashrc
