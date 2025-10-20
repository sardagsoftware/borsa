# LyDian CLI PowerShell Completion Script
# Installation: Add to PowerShell profile
# Find profile path: $PROFILE
# Add this line: . /path/to/powershell.ps1

Register-ArgumentCompleter -Native -CommandName lydian -ScriptBlock {
    param($wordToComplete, $commandAst, $cursorPosition)

    $commands = @{
        'auth' = @('login', 'logout', 'whoami', 'refresh')
        'config' = @('init', 'set', 'get', 'list', 'profile', 'path')
        'apikey' = @('create', 'list', 'revoke', 'info')
        'cities' = @('create', 'list', 'get', 'assets', 'metrics', 'alerts')
        'personas' = @('create', 'list', 'get', 'skills')
        'signals' = @('send', 'list', 'insights', 'kg')
        'modules' = @('list', 'info')
        'completion' = @('bash', 'zsh', 'fish', 'powershell')
    }

    $globalOptions = @(
        '--verbose',
        '--json',
        '--yaml',
        '--silent',
        '--timeout',
        '--retry',
        '--profile',
        '--help',
        '--version'
    )

    $commandElements = $commandAst.CommandElements
    $command = @(
        $commandElements |
        Select-Object -Skip 1 |
        Where-Object { $_ -is [System.Management.Automation.Language.StringConstantExpressionAst] } |
        ForEach-Object { $_.Value }
    )

    $completions = @()

    # First level - main commands
    if ($command.Count -eq 0) {
        $completions += $commands.Keys | Where-Object { $_ -like "$wordToComplete*" }
        $completions += $globalOptions | Where-Object { $_ -like "$wordToComplete*" }
    }
    # Second level - subcommands
    elseif ($command.Count -eq 1 -and $commands.ContainsKey($command[0])) {
        $completions += $commands[$command[0]] | Where-Object { $_ -like "$wordToComplete*" }
    }

    $completions | ForEach-Object {
        [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
    }
}

# Usage:
# 1. Find your PowerShell profile: echo $PROFILE
# 2. Create profile if it doesn't exist: New-Item -Path $PROFILE -Type File -Force
# 3. Add this line to profile: . /path/to/powershell.ps1
# 4. Reload profile: . $PROFILE
