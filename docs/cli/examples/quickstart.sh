#!/bin/bash
# LyDian CLI Quick Start Example
# This script demonstrates basic CLI usage

set -e

echo "=== LyDian CLI Quick Start ==="
echo ""

# 1. Initialize configuration
echo "1. Initializing configuration..."
lydian config init
echo ""

# 2. Configure API endpoint
echo "2. Setting API endpoint..."
lydian config set endpoint https://api.lydian.com
echo ""

# 3. Authenticate
echo "3. Authenticating (this will open a browser)..."
lydian auth login
echo ""

# 4. Check authentication
echo "4. Checking current user..."
lydian auth whoami
echo ""

# 5. Create an API key for programmatic access
echo "5. Creating API key..."
lydian apikey create \
  --name "Development Key" \
  --scopes "cities:read,cities:write,personas:read,signals:write"
echo ""

# 6. List available modules
echo "6. Listing available modules..."
lydian modules list
echo ""

echo "=== Quick Start Complete ==="
echo ""
echo "Next steps:"
echo "  - Create a city: lydian cities create --help"
echo "  - Create a persona: lydian personas create --help"
echo "  - Send a signal: lydian signals send --help"
echo ""
echo "Documentation: https://lydian.com/docs/cli"
