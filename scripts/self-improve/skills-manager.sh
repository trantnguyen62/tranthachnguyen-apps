#!/usr/bin/env bash
# =============================================================================
# Skills Manager & Daily Diary Agent
# =============================================================================
#
# Maintains Claude Code skills, creates new ones from patterns, writes daily
# diary entries, and syncs memory files.
#
# Usage:
#   ./skills-manager.sh                  # Run all sections (default)
#   ./skills-manager.sh --audit          # A. Skill Auditor only
#   ./skills-manager.sh --create         # B. Skill Creator only
#   ./skills-manager.sh --diary          # C. Daily Diary only
#   ./skills-manager.sh --memory         # D. Memory Sync only
#   ./skills-manager.sh --weekly         # Generate weekly summary
#   ./skills-manager.sh --install        # Install skills to ~/.claude/
# =============================================================================

set -euo pipefail

# =============================================================================
# PATHS
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="/Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps"
SCRIPTS="$WORKSPACE/scripts/self-improve"
CONFIG_FILE="$SCRIPTS/config.json"
STATE_FILE="$SCRIPTS/state.json"
META_STATE="$SCRIPTS/meta-state.json"
LOG_DIR="$SCRIPTS/logs"
DIARY_DIR="$SCRIPTS/diary"
WEEKLY_DIR="$DIARY_DIR/weekly"
SKILLS_SRC="$SCRIPTS/skills"
REPORTS_DIR="$SCRIPTS/reports"

CLAUDE_SKILLS="$HOME/.claude/skills"
CLAUDE_COMMANDS="$HOME/.claude/commands"
MEMORY_DIR="$HOME/.claude/projects/-Users-trannguyen-Desktop-TranThachnguyen-com/memory"
MEMORY_FILE="$MEMORY_DIR/MEMORY.md"

TODAY="$(date +%Y-%m-%d)"
NOW="$(date '+%Y-%m-%d %H:%M:%S')"
YEAR="$(date +%Y)"
WEEK_NUM="$(date +%V)"

LOG_FILE="$LOG_DIR/skills-manager-${TODAY}.log"

mkdir -p "$LOG_DIR" "$DIARY_DIR" "$WEEKLY_DIR" "$SKILLS_SRC"

# =============================================================================
# LOGGING
# =============================================================================
log() {
    local level="$1"; shift
    local msg="[$NOW] [skills-manager] [$level] $*"
    echo "$msg" >> "$LOG_FILE"
    echo "$msg"
}

log_info()  { log "INFO"  "$@"; }
log_warn()  { log "WARN"  "$@"; }
log_error() { log "ERROR" "$@"; }
log_ok()    { log "OK"    "$@"; }

# =============================================================================
# HELPERS
# =============================================================================

# Check if claude CLI is available
has_claude() {
    command -v claude &>/dev/null
}

# Read a JSON field using python3 (always available on macOS)
json_get() {
    local file="$1"
    local key="$2"
    python3 -c "
import json, sys
try:
    with open('$file') as f:
        data = json.load(f)
    keys = '$key'.split('.')
    val = data
    for k in keys:
        if isinstance(val, dict):
            val = val.get(k, '')
        else:
            val = ''
            break
    if isinstance(val, (dict, list)):
        print(json.dumps(val))
    else:
        print(val if val is not None else '')
except Exception:
    print('')
" 2>/dev/null || echo ""
}

# Count files matching a pattern
count_files() {
    local dir="$1"
    local pattern="$2"
    find "$dir" -maxdepth 3 -name "$pattern" 2>/dev/null | wc -l | tr -d ' '
}

# Get today's log content
get_today_log() {
    local log="$LOG_DIR/${TODAY}.log"
    if [[ -f "$log" ]]; then
        cat "$log"
    else
        echo "(no log for today)"
    fi
}

# Count lines matching a pattern in today's log
count_log_pattern() {
    local pattern="$1"
    local log="$LOG_DIR/${TODAY}.log"
    if [[ -f "$log" ]]; then
        grep -c "$pattern" "$log" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# =============================================================================
# A. SKILL AUDITOR — Reviews and updates existing skills
# =============================================================================
skill_audit() {
    log_info "=== SKILL AUDITOR ==="

    local skills_updated=0
    local skills_checked=0
    local issues_found=0
    local audit_results=""

    # Scan ~/.claude/skills/
    if [[ -d "$CLAUDE_SKILLS" ]]; then
        log_info "Scanning $CLAUDE_SKILLS..."
        for skill_dir in "$CLAUDE_SKILLS"/*/; do
            [[ ! -d "$skill_dir" ]] && continue
            local skill_name
            skill_name="$(basename "$skill_dir")"
            local skill_file="$skill_dir/SKILL.md"

            skills_checked=$((skills_checked + 1))

            if [[ ! -f "$skill_file" ]]; then
                log_warn "Skill '$skill_name' has no SKILL.md"
                issues_found=$((issues_found + 1))
                audit_results="${audit_results}\n- $skill_name: MISSING SKILL.md"
                continue
            fi

            # Check for broken file references in the skill
            local broken_refs=0
            while IFS= read -r ref_path; do
                ref_path="$(echo "$ref_path" | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')"
                # Skip URLs and relative references
                [[ "$ref_path" == http* ]] && continue
                [[ "$ref_path" != /* ]] && continue
                if [[ ! -e "$ref_path" ]]; then
                    log_warn "  Broken reference in $skill_name: $ref_path"
                    broken_refs=$((broken_refs + 1))
                fi
            done < <(grep -oE '/[A-Za-z0-9/_.-]+' "$skill_file" 2>/dev/null || true)

            if [[ $broken_refs -gt 0 ]]; then
                issues_found=$((issues_found + broken_refs))
                audit_results="${audit_results}\n- $skill_name: $broken_refs broken path references"
            fi

            # Check skill freshness (was it modified in the last 30 days?)
            local mod_days
            if stat -f "%Sm" -t "%s" "$skill_file" &>/dev/null; then
                # macOS stat
                local mod_epoch
                mod_epoch=$(stat -f "%m" "$skill_file")
                local now_epoch
                now_epoch=$(date +%s)
                mod_days=$(( (now_epoch - mod_epoch) / 86400 ))
            else
                mod_days=0
            fi

            if [[ $mod_days -gt 30 ]]; then
                log_warn "  Skill '$skill_name' is stale (last modified ${mod_days} days ago)"
                audit_results="${audit_results}\n- $skill_name: STALE (${mod_days} days old)"
                issues_found=$((issues_found + 1))
            else
                audit_results="${audit_results}\n- $skill_name: OK"
            fi

            # If claude CLI is available, ask for suggestions on stale or broken skills
            if [[ $broken_refs -gt 0 || $mod_days -gt 60 ]] && has_claude; then
                log_info "  Asking Claude to review skill: $skill_name"
                local skill_content
                skill_content="$(cat "$skill_file")"
                local suggestion
                suggestion=$(claude --print -p "Review this Claude Code skill and suggest brief improvements (max 3 bullet points). Focus on accuracy and usefulness:

---
$skill_content
---

Reply with only the bullet points, no preamble." 2>/dev/null || echo "(claude unavailable)")

                if [[ -n "$suggestion" && "$suggestion" != "(claude unavailable)" ]]; then
                    log_info "  Suggestions for $skill_name:"
                    echo "$suggestion" >> "$LOG_FILE"
                    audit_results="${audit_results}\n  Suggestions: $suggestion"
                fi
            fi
        done
    fi

    # Scan ~/.claude/commands/
    if [[ -d "$CLAUDE_COMMANDS" ]]; then
        log_info "Scanning $CLAUDE_COMMANDS..."
        for cmd_dir in "$CLAUDE_COMMANDS"/*/; do
            [[ ! -d "$cmd_dir" ]] && continue
            local cmd_name
            cmd_name="$(basename "$cmd_dir")"
            skills_checked=$((skills_checked + 1))

            # Check for SKILL.md or main command file
            if [[ ! -f "$cmd_dir/SKILL.md" && ! -f "$cmd_dir/README.md" ]]; then
                log_warn "Command '$cmd_name' has no SKILL.md or README.md"
                issues_found=$((issues_found + 1))
                audit_results="${audit_results}\n- command:$cmd_name: MISSING docs"
            else
                audit_results="${audit_results}\n- command:$cmd_name: OK"
            fi
        done
    fi

    log_ok "Audit complete: $skills_checked skills checked, $issues_found issues found"

    # Write audit report
    cat > "$SCRIPTS/reports/skill-audit-${TODAY}.md" <<EOF
# Skill Audit Report — $TODAY

## Summary
- Skills checked: $skills_checked
- Issues found: $issues_found
- Skills updated: $skills_updated

## Details
$(echo -e "$audit_results")

---
*Generated by skills-manager.sh at $NOW*
EOF

    log_info "Audit report written to $SCRIPTS/reports/skill-audit-${TODAY}.md"
}

# =============================================================================
# B. SKILL CREATOR — Builds new skills from patterns
# =============================================================================
skill_create() {
    log_info "=== SKILL CREATOR ==="

    local skills_created=0

    # Check which skills already exist
    local existing_skills=""
    if [[ -d "$CLAUDE_SKILLS" ]]; then
        existing_skills="$(ls "$CLAUDE_SKILLS"/ 2>/dev/null | tr '\n' ' ')"
    fi

    # Analyze last 7 days of improvement logs for patterns
    local pattern_report=""
    local log_files=()
    for i in $(seq 0 6); do
        local log_date
        if date -v-${i}d +%Y-%m-%d &>/dev/null 2>&1; then
            log_date=$(date -v-${i}d +%Y-%m-%d)
        else
            log_date=$(date -d "-${i} days" +%Y-%m-%d)
        fi
        local lf="$LOG_DIR/${log_date}.log"
        [[ -f "$lf" ]] && log_files+=("$lf")
    done

    if [[ ${#log_files[@]} -gt 0 ]]; then
        # Count improvement types from logs
        local type_counts
        type_counts=$(cat "${log_files[@]}" 2>/dev/null | grep -oE "type: [a-z-]+" | sort | uniq -c | sort -rn || echo "")
        if [[ -n "$type_counts" ]]; then
            pattern_report="Recent improvement type frequency:\n$type_counts"
            log_info "Pattern analysis from ${#log_files[@]} log files"
        fi

        # Count app mentions
        local app_counts
        app_counts=$(cat "${log_files[@]}" 2>/dev/null | grep -oE "app: [a-z-]+" | sort | uniq -c | sort -rn | head -10 || echo "")
        if [[ -n "$app_counts" ]]; then
            pattern_report="${pattern_report}\n\nMost-improved apps:\n$app_counts"
        fi

        # Detect repeated manual commands
        local repeated_commands
        repeated_commands=$(cat "${log_files[@]}" 2>/dev/null | grep -oE "Running: .*" | sort | uniq -c | sort -rn | head -5 || echo "")
        if [[ -n "$repeated_commands" ]]; then
            pattern_report="${pattern_report}\n\nRepeated commands:\n$repeated_commands"
        fi
    fi

    # Generate each skill template if it doesn't already exist in SKILLS_SRC
    generate_skill_template "improve-app" \
        "Run a targeted improvement cycle on any app" \
        "improve <app>, fix <app>, enhance <app>" \
        "Triggers the self-improvement pipeline for a specific app with an auto-selected or user-specified improvement type."

    generate_skill_template "pipeline-status" \
        "Show pipeline health, recent cycles, success rates" \
        "pipeline status, how is the pipeline, show improvements" \
        "Reads state.json, meta-state.json, and recent logs to compile a dashboard of pipeline health."

    generate_skill_template "deploy-app" \
        "Deploy a specific app to Proxmox production" \
        "deploy <app>, ship <app>, push <app> to production" \
        "Builds the Docker image, transfers it to the target LXC container, and restarts the service."

    generate_skill_template "health-check" \
        "Run health scanner across all apps" \
        "health check, check all apps, app health" \
        "Executes scan-health.sh and presents results with scores, grades, and priority recommendations."

    generate_skill_template "create-app" \
        "Generate a complete new app with Dockerfile" \
        "create new app, build an app for, new project" \
        "Scaffolds a new app from description, generates Dockerfile, adds to config.json, and optionally deploys."

    log_ok "Skill creation complete. $skills_created new skills generated."
}

generate_skill_template() {
    local name="$1"
    local description="$2"
    local triggers="$3"
    local detail="$4"

    local skill_dir="$SKILLS_SRC/$name"
    local skill_file="$skill_dir/SKILL.md"

    # Always regenerate templates from source (they live in skills/ dir)
    mkdir -p "$skill_dir/examples" "$skill_dir/resources"

    cat > "$skill_file" <<SKILLEOF
# Skill: $name

## Description
$description

## Triggers
$triggers

## Detail
$detail

## Configuration
- **Pipeline scripts**: $SCRIPTS/
- **Config**: $CONFIG_FILE
- **State**: $STATE_FILE
- **Meta-state**: $META_STATE
- **Logs**: $LOG_DIR/

## Usage Examples

### Example 1
\`\`\`
User: $( echo "$triggers" | cut -d',' -f1 | sed 's/^ //')
\`\`\`

### Example 2
\`\`\`
User: $( echo "$triggers" | cut -d',' -f2 | sed 's/^ //')
\`\`\`

## Implementation Notes
- Uses the self-improvement pipeline infrastructure at $SCRIPTS/
- Reads app configuration from config.json (${#APPS_COUNT:-34} apps registered)
- State tracked in state.json and meta-state.json
- Results logged to $LOG_DIR/

---
*Auto-generated by skills-manager.sh on $TODAY*
SKILLEOF

    log_info "Generated skill template: $name -> $skill_file"
}

# =============================================================================
# C. DAILY DIARY — Records everything that happened
# =============================================================================
daily_diary() {
    log_info "=== DAILY DIARY ==="

    local diary_file="$DIARY_DIR/${TODAY}.md"

    # --- Gather data from all sources ---

    # 1. State data
    local total_cycles=0 total_success=0 total_failure=0 last_cycle="never"
    if [[ -f "$STATE_FILE" ]]; then
        total_cycles=$(json_get "$STATE_FILE" "totalCycles")
        total_success=$(json_get "$STATE_FILE" "totalSuccess")
        total_failure=$(json_get "$STATE_FILE" "totalFailure")
        last_cycle=$(json_get "$STATE_FILE" "lastCycle")
    fi
    [[ -z "$total_cycles" ]] && total_cycles=0
    [[ -z "$total_success" ]] && total_success=0
    [[ -z "$total_failure" ]] && total_failure=0
    [[ -z "$last_cycle" ]] && last_cycle="never"

    local success_rate=0
    if [[ $total_cycles -gt 0 ]]; then
        success_rate=$(python3 -c "print(round($total_success / $total_cycles * 100, 1))" 2>/dev/null || echo "0")
    fi

    # 2. Meta-state data
    local estimated_mrr=0 total_deploys=0 total_apps_created=0
    local total_marketing=0 total_intel=0 total_evolution=0
    if [[ -f "$META_STATE" ]]; then
        estimated_mrr=$(json_get "$META_STATE" "business.estimated_mrr")
        total_deploys=$(json_get "$META_STATE" "business.total_deploys")
        total_apps_created=$(json_get "$META_STATE" "business.total_apps_created")
        total_marketing=$(json_get "$META_STATE" "business.total_marketing_actions")
        total_intel=$(json_get "$META_STATE" "business.total_intel_runs")
        total_evolution=$(json_get "$META_STATE" "business.total_evolution_runs")
    fi
    [[ -z "$estimated_mrr" ]] && estimated_mrr=0
    [[ -z "$total_deploys" ]] && total_deploys=0
    [[ -z "$total_apps_created" ]] && total_apps_created=0

    # 3. Today's log analysis
    local today_log="$LOG_DIR/${TODAY}.log"
    local today_cycles=0 today_successes=0 today_failures=0
    local apps_improved_today=""
    if [[ -f "$today_log" ]]; then
        today_cycles=$(grep -c "\[improve-app\]" "$today_log" 2>/dev/null || echo "0")
        today_successes=$(grep -c "RESULT: SUCCESS" "$today_log" 2>/dev/null || echo "0")
        today_failures=$(grep -c "RESULT: FAIL" "$today_log" 2>/dev/null || echo "0")
        apps_improved_today=$(grep -oE "App: [a-zA-Z0-9_-]+" "$today_log" 2>/dev/null | sort -u | sed 's/App: //' | tr '\n' ', ' | sed 's/,$//' || echo "none")
    fi
    [[ -z "$apps_improved_today" ]] && apps_improved_today="none"

    # 4. Git log for today
    local git_commits=""
    if cd "$WORKSPACE" && git rev-parse --is-inside-work-tree &>/dev/null 2>&1; then
        git_commits=$(git log --since="$TODAY" --oneline --no-merges 2>/dev/null | head -20 || echo "(no commits)")
    else
        git_commits="(not a git repo)"
    fi

    # 5. Health scan results (most recent)
    local health_summary="(no health scan available)"
    local health_json="$REPORTS_DIR/health-scan.json"
    if [[ -f "$health_json" ]]; then
        health_summary=$(python3 -c "
import json
with open('$health_json') as f:
    data = json.load(f)
s = data.get('summary', {})
print(f\"Apps scanned: {s.get('total_apps', 0)}\")
print(f\"Average score: {s.get('average_score', 0)}/100\")
gd = s.get('grade_distribution', {})
print(f\"Grades: A={gd.get('A',0)} B={gd.get('B',0)} C={gd.get('C',0)} D={gd.get('D',0)} F={gd.get('F',0)}\")
po = s.get('priority_order', [])[:5]
if po:
    print(f\"Priority (worst first): {', '.join(po)}\")
" 2>/dev/null || echo "(parse error)")
    fi

    # 6. Skills activity
    local skills_audit_report="$REPORTS_DIR/skill-audit-${TODAY}.md"
    local skills_activity="(no audit today)"
    if [[ -f "$skills_audit_report" ]]; then
        skills_activity=$(head -20 "$skills_audit_report" 2>/dev/null || echo "(error reading audit)")
    fi

    # 7. Yesterday's metrics for comparison
    local yesterday
    if date -v-1d +%Y-%m-%d &>/dev/null 2>&1; then
        yesterday=$(date -v-1d +%Y-%m-%d)
    else
        yesterday=$(date -d "-1 day" +%Y-%m-%d)
    fi
    local yesterday_diary="$DIARY_DIR/${yesterday}.md"
    local yesterday_cycles="N/A" yesterday_rate="N/A"
    if [[ -f "$yesterday_diary" ]]; then
        yesterday_cycles=$(grep "Total improvement cycles" "$yesterday_diary" 2>/dev/null | grep -oE "[0-9]+" | head -1 || echo "N/A")
        yesterday_rate=$(grep "Success rate" "$yesterday_diary" 2>/dev/null | grep -oE "[0-9]+\.?[0-9]*%" | head -1 || echo "N/A")
    fi

    # 8. Count total apps from config
    local total_apps_count=0
    if [[ -f "$CONFIG_FILE" ]]; then
        total_apps_count=$(python3 -c "
import json
with open('$CONFIG_FILE') as f:
    data = json.load(f)
print(len(data.get('apps', [])))
" 2>/dev/null || echo "0")
    fi

    # --- Generate diary ---
    cat > "$diary_file" <<DIARYEOF
# Daily Diary -- $TODAY

## Summary
- Total improvement cycles (all-time): $total_cycles
- Today's cycles: $today_cycles ($today_successes success, $today_failures failed)
- Success rate (all-time): ${success_rate}%
- Apps improved today: $apps_improved_today
- New apps created (all-time): $total_apps_created
- Skills updated: (see Skills Activity below)
- Estimated MRR: \$${estimated_mrr}

## Highlights
- Total apps in pipeline: $total_apps_count
- Total deploys (all-time): $total_deploys
- Marketing actions (all-time): $total_marketing
- Intelligence runs (all-time): $total_intel
- Evolution runs (all-time): $total_evolution
- Last cycle: $last_cycle

## Health Scan
\`\`\`
$health_summary
\`\`\`

## Git Activity (Today)
\`\`\`
$git_commits
\`\`\`

## By App
| App | Status | Notes |
|-----|--------|-------|
$(generate_app_table)

## Market Intelligence
- Trending niches: $(json_get "$META_STATE" "intel_cache.trending_niches" 2>/dev/null || echo "(none)")
- SEO gaps: $(json_get "$META_STATE" "intel_cache.seo_gaps" 2>/dev/null || echo "(none)")
- Feature ideas: $(json_get "$META_STATE" "intel_cache.feature_ideas" 2>/dev/null || echo "(none)")

## Skills Activity
$skills_activity

## Metrics Comparison
| Metric | Yesterday | Today | Change |
|--------|-----------|-------|--------|
| Total cycles | $yesterday_cycles | $total_cycles | -- |
| Success rate | $yesterday_rate | ${success_rate}% | -- |
| Apps in pipeline | -- | $total_apps_count | -- |
| Estimated MRR | -- | \$${estimated_mrr} | -- |

## Tomorrow's Priority
1. Continue improvement cycles on priority 1 apps (cloudify, landing-page)
2. Run health scan to track progress
3. Review and update stale skills

---
*Generated by skills-manager.sh at $NOW*
DIARYEOF

    log_ok "Daily diary written to $diary_file"

    # Commit diary to git if in a git repo
    if cd "$WORKSPACE" && git rev-parse --is-inside-work-tree &>/dev/null 2>&1; then
        local diary_rel_path="scripts/self-improve/diary/${TODAY}.md"
        if [[ -f "$WORKSPACE/$diary_rel_path" ]] || cp "$diary_file" "$WORKSPACE/$diary_rel_path" 2>/dev/null; then
            git add "$diary_rel_path" 2>/dev/null || true
            if ! git diff --cached --quiet 2>/dev/null; then
                git commit -m "diary: ${TODAY} -- ${today_cycles} cycles, ${success_rate}% success, apps: ${apps_improved_today}" 2>/dev/null || true
                log_info "Committed diary to git"
            fi
        fi
    fi
}

generate_app_table() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        echo "| (no config) | - | - |"
        return
    fi

    python3 -c "
import json
with open('$CONFIG_FILE') as f:
    data = json.load(f)
apps = data.get('apps', [])
# Read state for per-app data
state = {}
try:
    with open('$STATE_FILE') as f:
        state = json.load(f)
except Exception:
    pass

for app in apps[:20]:  # Limit to 20 for readability
    name = app.get('name', '?')
    app_state = state.get('apps', {}).get(name, {})
    total_imp = app_state.get('totalImprovements', 0)
    last_type = app_state.get('lastType', '-')
    failures = app_state.get('consecutiveFailures', 0)
    status = 'OK' if failures == 0 else f'WARN ({failures} failures)'
    print(f'| {name} | {status} | {total_imp} improvements, last: {last_type} |')
" 2>/dev/null || echo "| (error reading config) | - | - |"
}

# =============================================================================
# D. MEMORY SYNC — Updates Claude Code memory files
# =============================================================================
memory_sync() {
    log_info "=== MEMORY SYNC ==="

    if [[ ! -d "$MEMORY_DIR" ]]; then
        log_warn "Memory directory not found: $MEMORY_DIR"
        return
    fi

    if [[ ! -f "$MEMORY_FILE" ]]; then
        log_warn "MEMORY.md not found, skipping sync"
        return
    fi

    # Read current memory line count
    local current_lines
    current_lines=$(wc -l < "$MEMORY_FILE" | tr -d ' ')
    log_info "Current MEMORY.md: $current_lines lines"

    if [[ $current_lines -ge 190 ]]; then
        log_warn "MEMORY.md is near the 200-line limit ($current_lines lines)"
        log_info "Consider pruning outdated entries manually"
    fi

    # Update the currentDate entry if it exists
    if grep -q "# currentDate" "$MEMORY_FILE"; then
        # Use python to update the date line
        python3 -c "
import re
with open('$MEMORY_FILE', 'r') as f:
    content = f.read()
content = re.sub(
    r\"Today's date is \\d{4}-\\d{2}-\\d{2}\\.\",
    \"Today's date is $TODAY.\",
    content
)
with open('$MEMORY_FILE', 'w') as f:
    f.write(content)
" 2>/dev/null && log_info "Updated currentDate in MEMORY.md"
    fi

    log_ok "Memory sync complete"
}

# =============================================================================
# WEEKLY SUMMARY — Generated every Sunday
# =============================================================================
weekly_summary() {
    log_info "=== WEEKLY SUMMARY ==="

    local weekly_file="$WEEKLY_DIR/${YEAR}-W${WEEK_NUM}.md"

    # Gather all diary files from the past 7 days
    local diary_entries=""
    local total_week_cycles=0
    local total_week_success=0

    for i in $(seq 0 6); do
        local day_date
        if date -v-${i}d +%Y-%m-%d &>/dev/null 2>&1; then
            day_date=$(date -v-${i}d +%Y-%m-%d)
        else
            day_date=$(date -d "-${i} days" +%Y-%m-%d)
        fi
        local day_diary="$DIARY_DIR/${day_date}.md"
        if [[ -f "$day_diary" ]]; then
            diary_entries="${diary_entries}\n### $day_date\n"
            # Extract summary section
            local summary
            summary=$(sed -n '/^## Summary/,/^## /p' "$day_diary" | head -10)
            diary_entries="${diary_entries}${summary}\n"

            # Extract cycle counts
            local day_cycles
            day_cycles=$(grep "Today's cycles:" "$day_diary" 2>/dev/null | grep -oE "^[0-9]+" || echo "0")
            local day_success
            day_success=$(grep "Today's cycles:" "$day_diary" 2>/dev/null | grep -oE "[0-9]+ success" | grep -oE "^[0-9]+" || echo "0")
            total_week_cycles=$((total_week_cycles + day_cycles))
            total_week_success=$((total_week_success + day_success))
        fi
    done

    local week_rate=0
    if [[ $total_week_cycles -gt 0 ]]; then
        week_rate=$(python3 -c "print(round($total_week_success / $total_week_cycles * 100, 1))" 2>/dev/null || echo "0")
    fi

    cat > "$weekly_file" <<WEEKEOF
# Weekly Summary -- ${YEAR}-W${WEEK_NUM}

## Week Overview
- Week: $YEAR-W$WEEK_NUM (ending $TODAY)
- Total cycles this week: $total_week_cycles
- Success rate this week: ${week_rate}%

## Daily Summaries
$(echo -e "$diary_entries")

## Key Decisions This Week
(Review daily diaries for decisions made)

## Next Week Priorities
1. Continue high-priority app improvements
2. Address any skills that need updating
3. Review pipeline health trends

---
*Generated by skills-manager.sh at $NOW*
WEEKEOF

    log_ok "Weekly summary written to $weekly_file"
}

# =============================================================================
# INSTALL SKILLS — Copy generated skills to ~/.claude/
# =============================================================================
install_skills() {
    log_info "=== INSTALL SKILLS ==="

    # This just calls the separate install script
    local installer="$SCRIPTS/install-skills.sh"
    if [[ -x "$installer" ]]; then
        bash "$installer"
    else
        log_error "install-skills.sh not found or not executable at $installer"
        return 1
    fi
}

# =============================================================================
# MAIN
# =============================================================================
main() {
    local mode="${1:---all}"

    log_info "=========================================="
    log_info "  Skills Manager & Daily Diary Agent"
    log_info "  Mode: $mode"
    log_info "  Date: $TODAY"
    log_info "=========================================="

    case "$mode" in
        --audit)
            skill_audit
            ;;
        --create)
            skill_create
            ;;
        --diary)
            daily_diary
            ;;
        --memory)
            memory_sync
            ;;
        --weekly)
            weekly_summary
            ;;
        --install)
            install_skills
            ;;
        --all)
            skill_audit
            skill_create
            daily_diary
            memory_sync
            # Generate weekly on Sundays (day 0 or 7)
            local dow
            dow=$(date +%u)
            if [[ "$dow" -eq 7 ]]; then
                weekly_summary
            fi
            ;;
        --help|-h)
            echo "Usage: skills-manager.sh [--audit|--create|--diary|--memory|--weekly|--install|--all]"
            echo ""
            echo "Modes:"
            echo "  --audit    Review and validate existing skills"
            echo "  --create   Generate skill templates from patterns"
            echo "  --diary    Write daily diary entry"
            echo "  --memory   Sync memory files"
            echo "  --weekly   Generate weekly summary"
            echo "  --install  Install skills to ~/.claude/"
            echo "  --all      Run all sections (default)"
            ;;
        *)
            log_error "Unknown mode: $mode"
            echo "Run: skills-manager.sh --help"
            exit 1
            ;;
    esac

    log_info "Skills Manager complete."
}

main "$@"
