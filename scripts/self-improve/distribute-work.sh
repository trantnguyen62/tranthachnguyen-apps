#!/usr/bin/env bash
# =============================================================================
# Work Distributor - Intelligent work assignment across workers
#
# Reads config.json and assigns apps to workers based on:
# - App complexity (complex -> Mac Mini, simple -> Proxmox)
# - Worker capabilities (iOS -> Mac Mini only)
# - App priority and cooldown status
# - Load balancing across workers
#
# Outputs: work-queue.json
#
# Usage:
#   ./distribute-work.sh              # Generate work-queue.json
#   ./distribute-work.sh --show       # Show current distribution
#   ./distribute-work.sh --rebalance  # Force rebalance based on results
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/config.json"
STATE_FILE="${SCRIPT_DIR}/state.json"
WORK_QUEUE="${SCRIPT_DIR}/work-queue.json"
META_STATE="${SCRIPT_DIR}/meta-state.json"

# ---------------------------------------------------------------------------
# Worker definitions
# ---------------------------------------------------------------------------
# Worker capabilities and constraints
# mac-mini: Full macOS, Claude CLI, can handle complex apps + iOS
# proxmox-206: Linux LXC, Claude CLI, handles simple/static apps
# github-actions: CI/CD only, overflow tasks, health checks

generate_distribution() {
    python3 << 'PYDIST'
import json
import os
import sys
from datetime import datetime, timedelta

SCRIPT_DIR = os.path.dirname(os.path.abspath("__file__"))
# Use the actual script directory passed via env or default
SCRIPT_DIR = os.environ.get("SCRIPT_DIR", "/Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve")

CONFIG_FILE = os.path.join(SCRIPT_DIR, "config.json")
STATE_FILE = os.path.join(SCRIPT_DIR, "state.json")
WORK_QUEUE = os.path.join(SCRIPT_DIR, "work-queue.json")

# Load config
try:
    with open(CONFIG_FILE) as f:
        config = json.load(f)
except Exception as e:
    print(f"ERROR: Cannot read config.json: {e}", file=sys.stderr)
    sys.exit(1)

# Load state (optional)
state = {}
try:
    with open(STATE_FILE) as f:
        state = json.load(f)
except Exception:
    pass

# Worker definitions with constraints
WORKERS = {
    "mac-mini": {
        "max_apps": 5,
        "capabilities": ["nextjs", "react", "nodejs", "static-html", "ios-app", "python"],
        "preferred_types": ["nextjs", "ios-app"],  # Complex apps prefer Mac Mini
        "preferred_apps": ["cloudify", "linguaflow", "themify", "flow-sounds", "tinni-relief"],
    },
    "proxmox-206": {
        "max_apps": 12,
        "capabilities": ["static-html", "nodejs", "react"],
        "preferred_types": ["static-html"],  # Simple apps prefer Proxmox
        "preferred_apps": [],  # Assigned dynamically
    },
    "github-actions": {
        "max_apps": 5,
        "capabilities": ["static-html", "nodejs", "react", "nextjs"],
        "preferred_types": [],  # Overflow only
        "preferred_apps": [],
    },
}

# Classification rules
def classify_app(app):
    """Determine the best worker for an app."""
    name = app.get("name", "")
    app_type = app.get("type", "unknown")
    priority = app.get("priority", 5)
    frameworks = app.get("frameworks", [])

    # Rule 1: iOS apps -> Mac Mini only
    if app_type == "ios-app":
        return "mac-mini"

    # Rule 2: Explicitly preferred apps
    for worker, wdef in WORKERS.items():
        if name in wdef["preferred_apps"]:
            return worker

    # Rule 3: Complex Next.js apps with Prisma -> Mac Mini
    if app_type == "nextjs" and "prisma" in frameworks:
        return "mac-mini"

    # Rule 4: High-priority complex apps -> Mac Mini
    if priority <= 2 and app_type in ("nextjs", "react") and len(frameworks) > 2:
        return "mac-mini"

    # Rule 5: Simple static/nodejs apps -> Proxmox
    if app_type == "static-html":
        return "proxmox-206"

    # Rule 6: Simple React apps (no complex deps) -> Proxmox
    if app_type == "react" and priority >= 3:
        return "proxmox-206"

    # Rule 7: Simple nodejs -> Proxmox
    if app_type == "nodejs":
        return "proxmox-206"

    # Rule 8: Medium complexity -> Mac Mini (default for anything left)
    if app_type in ("nextjs", "react"):
        return "mac-mini"

    # Rule 9: Undeployed/low-priority -> GitHub Actions overflow
    if app.get("deployTarget") == "none" and priority >= 5:
        return "github-actions"

    # Default: Proxmox for simple, Mac Mini for complex
    return "proxmox-206" if priority >= 4 else "mac-mini"


def check_cooldown(app_name):
    """Check if an app is in cooldown."""
    app_state = state.get("apps", {}).get(app_name, {})

    # Check cooldown from state.sh format
    cooldown_until = app_state.get("cooldownUntil")
    if cooldown_until and cooldown_until != "null":
        try:
            cd_time = datetime.fromisoformat(cooldown_until.replace("Z", "+00:00"))
            if cd_time > datetime.now(cd_time.tzinfo):
                return True
        except Exception:
            pass

    # Check cooldown from orchestrator.sh format
    last_fail_cycle = app_state.get("last_fail_cycle")
    total_cycles = state.get("total_cycles", 0)
    if last_fail_cycle is not None:
        cycles_since = total_cycles - int(last_fail_cycle)
        if cycles_since < 2:
            return True

    return False


def get_app_health(app_name):
    """Get success rate for an app (0-100)."""
    app_state = state.get("apps", {}).get(app_name, {})
    successes = app_state.get("total_improvements", app_state.get("totalImprovements", 0))
    failures = app_state.get("total_failures", app_state.get("consecutiveFailures", 0))
    total = successes + failures
    if total == 0:
        return 50  # Unknown, neutral score
    return int(successes / total * 100)


# Build distribution
distribution = {
    "mac-mini": [],
    "proxmox-206": [],
    "github-actions": [],
}

skipped = []
app_assignments = {}

# First pass: classify all enabled apps
apps = config.get("apps", [])
for app in apps:
    name = app.get("name", "")
    enabled = app.get("enabled", True)

    if not enabled:
        skipped.append({"name": name, "reason": "disabled"})
        continue

    if check_cooldown(name):
        skipped.append({"name": name, "reason": "cooldown"})
        continue

    worker = classify_app(app)
    app_assignments[name] = {
        "worker": worker,
        "type": app.get("type", "unknown"),
        "priority": app.get("priority", 5),
        "health": get_app_health(name),
    }

# Second pass: balance load
for name, assignment in sorted(app_assignments.items(), key=lambda x: x[1]["priority"]):
    worker = assignment["worker"]
    max_apps = WORKERS[worker]["max_apps"]

    if len(distribution[worker]) >= max_apps:
        # Overflow to next available worker
        overflow_order = ["proxmox-206", "mac-mini", "github-actions"]
        placed = False
        for alt_worker in overflow_order:
            if alt_worker == worker:
                continue
            alt_type = assignment["type"]
            if alt_type in WORKERS[alt_worker]["capabilities"] and len(distribution[alt_worker]) < WORKERS[alt_worker]["max_apps"]:
                distribution[alt_worker].append(name)
                assignment["worker"] = alt_worker
                assignment["overflow"] = True
                placed = True
                break
        if not placed:
            distribution["github-actions"].append(name)
            assignment["worker"] = "github-actions"
            assignment["overflow"] = True
    else:
        distribution[worker].append(name)

# Sort each worker's apps by priority
for worker in distribution:
    distribution[worker].sort(
        key=lambda n: app_assignments.get(n, {}).get("priority", 5)
    )

# Build output
output = {
    "generated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    "generator": "distribute-work.sh",
    "mac-mini": distribution["mac-mini"],
    "proxmox-206": distribution["proxmox-206"],
    "github-actions": distribution["github-actions"],
    "metadata": {
        "total_apps": len(app_assignments),
        "skipped": len(skipped),
        "per_worker": {
            w: len(distribution[w]) for w in distribution
        },
        "assignments": app_assignments,
        "skipped_apps": skipped,
    },
}

# Write work queue
with open(WORK_QUEUE, "w") as f:
    json.dump(output, f, indent=2)

# Print summary
print("=== Work Distribution ===")
print(f"Total apps: {len(app_assignments)} | Skipped: {len(skipped)}")
print()
for worker in ["mac-mini", "proxmox-206", "github-actions"]:
    apps_list = distribution[worker]
    print(f"  {worker} ({len(apps_list)} apps):")
    for a in apps_list:
        info = app_assignments.get(a, {})
        overflow = " [overflow]" if info.get("overflow") else ""
        health = info.get("health", "?")
        print(f"    - {a} (p{info.get('priority', '?')}, {info.get('type', '?')}, health={health}%){overflow}")
    print()

if skipped:
    print(f"  Skipped ({len(skipped)}):")
    for s in skipped:
        print(f"    - {s['name']}: {s['reason']}")
    print()

print(f"Written to: {WORK_QUEUE}")
PYDIST
}

# ---------------------------------------------------------------------------
# Show current distribution
# ---------------------------------------------------------------------------
show_distribution() {
    if [[ ! -f "$WORK_QUEUE" ]]; then
        echo "No work-queue.json found. Run ./distribute-work.sh first."
        exit 1
    fi

    echo "=== Current Work Distribution ==="
    echo ""
    echo "Generated: $(jq -r '.generated_at // "unknown"' "$WORK_QUEUE")"
    echo ""

    for worker in "mac-mini" "proxmox-206" "github-actions"; do
        local count
        count=$(jq -r ".\"${worker}\" | length" "$WORK_QUEUE" 2>/dev/null || echo "0")
        echo "  ${worker} (${count} apps):"
        jq -r ".\"${worker}\"[]" "$WORK_QUEUE" 2>/dev/null | while read -r app; do
            local prio
            prio=$(jq -r ".metadata.assignments.\"${app}\".priority // \"?\"" "$WORK_QUEUE" 2>/dev/null || echo "?")
            local atype
            atype=$(jq -r ".metadata.assignments.\"${app}\".type // \"?\"" "$WORK_QUEUE" 2>/dev/null || echo "?")
            echo "    - ${app} (p${prio}, ${atype})"
        done
        echo ""
    done

    local skipped_count
    skipped_count=$(jq -r '.metadata.skipped // 0' "$WORK_QUEUE" 2>/dev/null || echo "0")
    if [[ "$skipped_count" -gt 0 ]]; then
        echo "  Skipped (${skipped_count}):"
        jq -r '.metadata.skipped_apps[]? | "    - \(.name): \(.reason)"' "$WORK_QUEUE" 2>/dev/null
        echo ""
    fi
}

# ---------------------------------------------------------------------------
# Rebalance based on recent results
# ---------------------------------------------------------------------------
rebalance() {
    echo "Rebalancing based on recent results..."

    # Check if state.json exists with result data
    if [[ ! -f "$STATE_FILE" ]]; then
        echo "No state.json found. Running initial distribution."
        SCRIPT_DIR="$SCRIPT_DIR" generate_distribution
        return
    fi

    # Regenerate with current state (classification considers health scores)
    SCRIPT_DIR="$SCRIPT_DIR" generate_distribution

    echo ""
    echo "Rebalance complete. Review work-queue.json for changes."
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
    local mode="${1:-distribute}"

    case "$mode" in
        --show|-s)
            show_distribution
            ;;
        --rebalance|-r)
            rebalance
            ;;
        --help|-h)
            echo "Usage: distribute-work.sh [--show|--rebalance|--help]"
            echo ""
            echo "  (default)      Generate work-queue.json with app assignments"
            echo "  --show         Show current distribution"
            echo "  --rebalance    Regenerate based on recent results"
            ;;
        *)
            SCRIPT_DIR="$SCRIPT_DIR" generate_distribution
            ;;
    esac
}

main "$@"
