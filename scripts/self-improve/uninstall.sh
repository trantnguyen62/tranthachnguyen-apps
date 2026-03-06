#!/bin/bash
# Uninstall the self-improve-portfolio LaunchAgent
set -euo pipefail

PLIST_NAME="com.self-improve-portfolio.plist"
PLIST_DST="$HOME/Library/LaunchAgents/$PLIST_NAME"

echo "=== Uninstalling self-improve-portfolio LaunchAgent ==="

# Unload if running
if launchctl list | grep -q "com.self-improve-portfolio"; then
    echo "Stopping and unloading agent..."
    launchctl unload "$PLIST_DST" 2>/dev/null || true
    sleep 1
fi

# Remove plist
if [ -f "$PLIST_DST" ]; then
    echo "Removing $PLIST_DST..."
    rm "$PLIST_DST"
    echo "Plist removed."
else
    echo "Plist not found at $PLIST_DST (already removed?)"
fi

# Verify
if launchctl list | grep -q "com.self-improve-portfolio"; then
    echo "WARNING: Agent still appears in launchctl list"
else
    echo "Agent successfully uninstalled."
fi

echo ""
echo "Note: Log files remain at /tmp/self-improve-portfolio*.log"
echo "To remove them: rm -f /tmp/self-improve-portfolio*.log"
