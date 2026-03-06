#!/bin/bash
# Install the self-improve-portfolio LaunchAgent
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST_NAME="com.self-improve-portfolio.plist"
PLIST_SRC="$SCRIPT_DIR/$PLIST_NAME"
PLIST_DST="$HOME/Library/LaunchAgents/$PLIST_NAME"

echo "=== Installing self-improve-portfolio LaunchAgent ==="

# Check plist exists
if [ ! -f "$PLIST_SRC" ]; then
    echo "ERROR: $PLIST_SRC not found"
    exit 1
fi

# Check orchestrator exists
ORCHESTRATOR="$SCRIPT_DIR/orchestrator.sh"
if [ ! -f "$ORCHESTRATOR" ]; then
    echo "WARNING: orchestrator.sh not found at $ORCHESTRATOR"
    echo "The LaunchAgent will fail until the orchestrator is created."
fi

# Ensure LaunchAgents directory exists
mkdir -p "$HOME/Library/LaunchAgents"

# Unload existing agent if loaded
if launchctl list | grep -q "com.self-improve-portfolio"; then
    echo "Unloading existing agent..."
    launchctl unload "$PLIST_DST" 2>/dev/null || true
fi

# Copy plist
echo "Copying plist to $PLIST_DST..."
cp "$PLIST_SRC" "$PLIST_DST"

# Load the agent
echo "Loading LaunchAgent..."
launchctl load "$PLIST_DST"

# Verify
sleep 1
if launchctl list | grep -q "com.self-improve-portfolio"; then
    echo "LaunchAgent loaded successfully."
else
    echo "WARNING: LaunchAgent may not have loaded. Check with: launchctl list | grep self-improve"
fi

echo ""
echo "=== Status ==="
launchctl list | grep "self-improve-portfolio" || echo "Agent not found in launchctl list"
echo ""
echo "Logs:"
echo "  stdout: /tmp/self-improve-portfolio.log"
echo "  stderr: /tmp/self-improve-portfolio-error.log"
echo ""
echo "Commands:"
echo "  View logs:  tail -f /tmp/self-improve-portfolio.log"
echo "  Stop:       launchctl unload ~/Library/LaunchAgents/$PLIST_NAME"
echo "  Start:      launchctl load ~/Library/LaunchAgents/$PLIST_NAME"
echo "  Run now:    launchctl start com.self-improve-portfolio"
