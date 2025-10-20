#!/bin/bash
#
# Install Git Hooks for LyDian AI
#

set -e

HOOKS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_HOOKS_DIR="$(git rev-parse --git-dir)/hooks"

echo "Installing LyDian AI Git Hooks..."

# Create symlink for pre-commit hook
ln -sf "$HOOKS_DIR/pre-commit" "$GIT_HOOKS_DIR/pre-commit"
chmod +x "$GIT_HOOKS_DIR/pre-commit"

echo "✅ Git hooks installed successfully!"
echo ""
echo "Hooks installed:"
echo "  - pre-commit: Feed validation + Security audit"
echo ""
echo "To uninstall, run: rm $GIT_HOOKS_DIR/pre-commit"
