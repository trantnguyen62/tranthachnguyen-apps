#!/bin/bash
# Setup self-improve-portfolio on Mac Mini (192.168.0.36)
# Run this script ON the Mac Mini, or it will SSH into it.
set -euo pipefail

WORKSPACE="/Users/tran/Desktop/TranThachnguyen.com/tranthachnguyen-apps"
REPO_URL="https://github.com/tranthachnguyen/TranThachnguyen.com.git"
REPO_ROOT="/Users/tran/Desktop/TranThachnguyen.com"
SCRIPTS_DIR="$WORKSPACE/scripts/self-improve"

echo "=== Self-Improve Portfolio Setup for Mac Mini ==="
echo ""

# Step 1: Clone or pull the repo
echo "--- Step 1: Repository Setup ---"
if [ -d "$REPO_ROOT/.git" ]; then
    echo "Repo exists, pulling latest changes..."
    cd "$REPO_ROOT"
    git pull --rebase || { echo "WARNING: git pull failed, continuing with existing code"; }
else
    echo "Cloning repository..."
    mkdir -p "$(dirname "$REPO_ROOT")"
    git clone "$REPO_URL" "$REPO_ROOT"
fi
echo ""

# Step 2: Install dependencies
echo "--- Step 2: Dependencies ---"

# Check/install Homebrew
if ! command -v brew &>/dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    eval "$(/opt/homebrew/bin/brew shellenv)"
else
    echo "Homebrew: installed"
fi

# Check/install Node.js
if ! command -v node &>/dev/null; then
    echo "Installing Node.js..."
    brew install node
else
    echo "Node.js: $(node --version)"
fi

# Check/install Claude CLI
if ! command -v claude &>/dev/null; then
    echo "Installing Claude CLI..."
    npm install -g @anthropic-ai/claude-code
else
    echo "Claude CLI: installed ($(claude --version 2>/dev/null || echo 'version unknown'))"
fi

# Check/install jq
if ! command -v jq &>/dev/null; then
    echo "Installing jq..."
    brew install jq
else
    echo "jq: installed"
fi
echo ""

# Step 3: Configure git
echo "--- Step 3: Git Configuration ---"
if [ -z "$(git config --global user.name 2>/dev/null)" ]; then
    git config --global user.name "Self-Improve Bot"
    git config --global user.email "bot@tranthachnguyen.com"
    echo "Git user configured: Self-Improve Bot"
else
    echo "Git user: $(git config --global user.name)"
fi
echo ""

# Step 4: Install the LaunchAgent
echo "--- Step 4: LaunchAgent Installation ---"
if [ -f "$SCRIPTS_DIR/install.sh" ]; then
    bash "$SCRIPTS_DIR/install.sh"
else
    echo "ERROR: install.sh not found at $SCRIPTS_DIR/install.sh"
    echo "Make sure the repo is fully cloned."
    exit 1
fi
echo ""

# Step 5: Run a test improvement cycle
echo "--- Step 5: Test Improvement Cycle ---"
if [ -f "$SCRIPTS_DIR/orchestrator.sh" ]; then
    echo "Running test cycle..."
    timeout 120 bash "$SCRIPTS_DIR/orchestrator.sh" --dry-run 2>&1 || {
        echo "WARNING: Test cycle exited with non-zero status (this may be expected for dry-run)"
    }
else
    echo "WARNING: orchestrator.sh not found, skipping test cycle"
    echo "Create the orchestrator at: $SCRIPTS_DIR/orchestrator.sh"
fi
echo ""

# Step 6: Verify everything
echo "--- Step 6: Verification ---"
echo ""

# Check LaunchAgent
echo -n "LaunchAgent: "
if launchctl list | grep -q "com.self-improve-portfolio"; then
    echo "LOADED"
else
    echo "NOT LOADED"
fi

# Check log files
echo -n "Stdout log:  "
if [ -f /tmp/self-improve-portfolio.log ]; then
    echo "exists ($(wc -l < /tmp/self-improve-portfolio.log) lines)"
else
    echo "not yet created"
fi

echo -n "Stderr log:  "
if [ -f /tmp/self-improve-portfolio-error.log ]; then
    echo "exists ($(wc -l < /tmp/self-improve-portfolio-error.log) lines)"
else
    echo "not yet created"
fi

# Check required files
echo ""
echo "Required files:"
for f in orchestrator.sh install.sh uninstall.sh com.self-improve-portfolio.plist; do
    echo -n "  $f: "
    if [ -f "$SCRIPTS_DIR/$f" ]; then
        echo "OK"
    else
        echo "MISSING"
    fi
done

echo ""
echo "=== Setup Complete ==="
echo ""
echo "The self-improve daemon will run every 30 minutes."
echo "Monitor with: tail -f /tmp/self-improve-portfolio.log"
echo "Manual run:   launchctl start com.self-improve-portfolio"
