#!/usr/bin/env bash
# =============================================================================
# install-skills.sh — Install generated skills to ~/.claude/
# =============================================================================
#
# Copies all skill templates from the skills/ directory to ~/.claude/skills/
# and ~/.claude/commands/ using symlinks so updates propagate automatically.
#
# Usage:
#   ./install-skills.sh              # Install all skills
#   ./install-skills.sh --copy       # Copy instead of symlink
#   ./install-skills.sh --uninstall  # Remove installed skills
#   ./install-skills.sh --list       # List installed skills
#   ./install-skills.sh --plist      # Also install the LaunchAgent
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_SRC="$SCRIPT_DIR/skills"
CLAUDE_SKILLS="$HOME/.claude/skills"
CLAUDE_COMMANDS="$HOME/.claude/commands"
PLIST_SRC="$SCRIPT_DIR/com.skills-diary.plist"
PLIST_DST="$HOME/Library/LaunchAgents/com.skills-diary.plist"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_err()   { echo -e "${RED}[ERR]${NC}   $*"; }

# =============================================================================
# INSTALL SKILLS
# =============================================================================
install_skills() {
    local mode="${1:-symlink}"  # symlink or copy

    echo ""
    echo "=============================================="
    echo "  Skills Installer"
    echo "  Source: $SKILLS_SRC"
    echo "  Target: $CLAUDE_SKILLS"
    echo "  Mode:   $mode"
    echo "=============================================="
    echo ""

    # Ensure target directories exist
    mkdir -p "$CLAUDE_SKILLS"
    mkdir -p "$CLAUDE_COMMANDS"

    if [[ ! -d "$SKILLS_SRC" ]]; then
        log_err "Skills source directory not found: $SKILLS_SRC"
        log_info "Run skills-manager.sh --create first to generate skill templates."
        exit 1
    fi

    local installed=0
    local skipped=0
    local updated=0

    for skill_dir in "$SKILLS_SRC"/*/; do
        [[ ! -d "$skill_dir" ]] && continue

        local skill_name
        skill_name="$(basename "$skill_dir")"
        local target_dir="$CLAUDE_SKILLS/$skill_name"

        # Check if SKILL.md exists in source
        if [[ ! -f "$skill_dir/SKILL.md" ]]; then
            log_warn "Skipping $skill_name (no SKILL.md)"
            skipped=$((skipped + 1))
            continue
        fi

        if [[ "$mode" == "symlink" ]]; then
            # Remove existing if it's not already a symlink to our source
            if [[ -L "$target_dir" ]]; then
                local current_target
                current_target="$(readlink "$target_dir")"
                if [[ "$current_target" == "$skill_dir" || "$current_target" == "${skill_dir%/}" ]]; then
                    log_info "Already linked: $skill_name"
                    skipped=$((skipped + 1))
                    continue
                else
                    log_warn "Updating symlink for $skill_name (was: $current_target)"
                    rm "$target_dir"
                    updated=$((updated + 1))
                fi
            elif [[ -d "$target_dir" ]]; then
                log_warn "Replacing directory with symlink: $skill_name"
                rm -rf "$target_dir"
                updated=$((updated + 1))
            fi

            # Create symlink (remove trailing slash from skill_dir for clean link)
            ln -s "${skill_dir%/}" "$target_dir"
            log_ok "Linked: $skill_name -> $skill_dir"
            installed=$((installed + 1))
        else
            # Copy mode
            mkdir -p "$target_dir"
            cp -R "$skill_dir"/* "$target_dir/" 2>/dev/null || true
            log_ok "Copied: $skill_name -> $target_dir"
            installed=$((installed + 1))
        fi
    done

    echo ""
    echo "=============================================="
    echo "  Results:"
    echo "    Installed: $installed"
    echo "    Updated:   $updated"
    echo "    Skipped:   $skipped"
    echo "=============================================="
}

# =============================================================================
# UNINSTALL SKILLS
# =============================================================================
uninstall_skills() {
    echo ""
    echo "=============================================="
    echo "  Uninstalling skills from $CLAUDE_SKILLS"
    echo "=============================================="
    echo ""

    local removed=0

    for skill_dir in "$SKILLS_SRC"/*/; do
        [[ ! -d "$skill_dir" ]] && continue
        local skill_name
        skill_name="$(basename "$skill_dir")"
        local target_dir="$CLAUDE_SKILLS/$skill_name"

        if [[ -L "$target_dir" || -d "$target_dir" ]]; then
            rm -rf "$target_dir"
            log_ok "Removed: $skill_name"
            removed=$((removed + 1))
        fi
    done

    # Unload LaunchAgent if installed
    if [[ -f "$PLIST_DST" ]]; then
        launchctl unload "$PLIST_DST" 2>/dev/null || true
        rm -f "$PLIST_DST"
        log_ok "Removed LaunchAgent: com.skills-diary"
    fi

    echo ""
    echo "Removed $removed skill(s)."
}

# =============================================================================
# LIST INSTALLED SKILLS
# =============================================================================
list_skills() {
    echo ""
    echo "=============================================="
    echo "  Installed Skills"
    echo "=============================================="
    echo ""

    echo "--- Skills ($CLAUDE_SKILLS) ---"
    if [[ -d "$CLAUDE_SKILLS" ]]; then
        for dir in "$CLAUDE_SKILLS"/*/; do
            [[ ! -d "$dir" ]] && continue
            local name
            name="$(basename "$dir")"
            local link_info=""
            if [[ -L "${dir%/}" ]]; then
                link_info=" -> $(readlink "${dir%/}")"
            fi

            local has_skill="no"
            [[ -f "$dir/SKILL.md" ]] && has_skill="yes"

            echo "  $name (SKILL.md: $has_skill)$link_info"
        done
    else
        echo "  (no skills directory)"
    fi

    echo ""
    echo "--- Commands ($CLAUDE_COMMANDS) ---"
    if [[ -d "$CLAUDE_COMMANDS" ]]; then
        for dir in "$CLAUDE_COMMANDS"/*/; do
            [[ ! -d "$dir" ]] && continue
            local name
            name="$(basename "$dir")"
            echo "  $name"
        done
    else
        echo "  (no commands directory)"
    fi

    echo ""
    echo "--- LaunchAgent ---"
    if [[ -f "$PLIST_DST" ]]; then
        echo "  com.skills-diary: INSTALLED"
        launchctl list 2>/dev/null | grep "skills-diary" || echo "  (not loaded)"
    else
        echo "  com.skills-diary: NOT INSTALLED"
    fi
    echo ""
}

# =============================================================================
# INSTALL LAUNCHAGENT
# =============================================================================
install_plist() {
    echo ""
    echo "=============================================="
    echo "  Installing LaunchAgent: com.skills-diary"
    echo "=============================================="
    echo ""

    if [[ ! -f "$PLIST_SRC" ]]; then
        log_err "LaunchAgent plist not found: $PLIST_SRC"
        exit 1
    fi

    mkdir -p "$HOME/Library/LaunchAgents"

    # Unload existing if present
    if launchctl list 2>/dev/null | grep -q "com.skills-diary"; then
        log_info "Unloading existing agent..."
        launchctl unload "$PLIST_DST" 2>/dev/null || true
    fi

    # Copy plist
    cp "$PLIST_SRC" "$PLIST_DST"
    log_ok "Copied plist to $PLIST_DST"

    # Load
    launchctl load "$PLIST_DST"
    log_ok "Loaded LaunchAgent"

    # Verify
    sleep 1
    if launchctl list 2>/dev/null | grep -q "com.skills-diary"; then
        log_ok "LaunchAgent is running"
    else
        log_warn "LaunchAgent may not have loaded. Check: launchctl list | grep skills-diary"
    fi

    echo ""
    echo "Schedule:"
    echo "  - Daily diary:  11:55 PM every day"
    echo "  - Skill audit:  12:05 AM every Sunday"
    echo ""
    echo "Logs: tail -f /tmp/skills-diary.log"
    echo "Stop: launchctl unload ~/Library/LaunchAgents/com.skills-diary.plist"
    echo "Start: launchctl load ~/Library/LaunchAgents/com.skills-diary.plist"
    echo "Run now: launchctl start com.skills-diary"
}

# =============================================================================
# MAIN
# =============================================================================
main() {
    local command="${1:---symlink}"

    case "$command" in
        --symlink|"")
            install_skills "symlink"
            ;;
        --copy)
            install_skills "copy"
            ;;
        --uninstall)
            uninstall_skills
            ;;
        --list)
            list_skills
            ;;
        --plist)
            install_plist
            ;;
        --all)
            install_skills "symlink"
            install_plist
            ;;
        --help|-h)
            echo "Usage: install-skills.sh [option]"
            echo ""
            echo "Options:"
            echo "  (default)     Install skills using symlinks"
            echo "  --copy        Install skills by copying files"
            echo "  --symlink     Install skills using symlinks (default)"
            echo "  --uninstall   Remove all installed skills"
            echo "  --list        List currently installed skills"
            echo "  --plist       Install the LaunchAgent for daily diary"
            echo "  --all         Install skills + LaunchAgent"
            echo "  --help        Show this help"
            ;;
        *)
            echo "Unknown option: $command"
            echo "Run: install-skills.sh --help"
            exit 1
            ;;
    esac
}

main "$@"
