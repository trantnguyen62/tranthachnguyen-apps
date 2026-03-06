#!/usr/bin/env bash
# =============================================================================
# Meta Agent — Autonomous SaaS Business Machine
# =============================================================================
#
# A self-evolving AI agent that runs 24/7 on the Mac Mini. Unlike the basic
# orchestrator (which round-robins code improvements), this agent THINKS:
#
#   1. MARKET INTELLIGENCE  — researches trends, competitors, keyword gaps
#   2. AUTO-CREATE APPS     — detects niches and builds + deploys new apps
#   3. AUTO-MARKETING & SEO — generates content, meta tags, blog posts
#   4. SELF-EVOLUTION       — rewrites its own strategies based on results
#   5. REVENUE OPTIMIZATION — A/B tests pricing, optimizes funnels
#
# Each 30-minute cycle picks the HIGHEST-PRIORITY action, not round-robin.
# Priority is computed from: time since last action, expected ROI, app health,
# and market intelligence signals.
#
# Usage:
#   ./meta-agent.sh              # Run one cycle (LaunchAgent mode)
#   ./meta-agent.sh --loop       # Continuous loop (30min intervals)
#   ./meta-agent.sh --status     # Print business dashboard
#   ./meta-agent.sh --intel      # Force a market intelligence run
#   ./meta-agent.sh --evolve     # Force a self-evolution run
#   ./meta-agent.sh --reset      # Reset meta-state.json
# =============================================================================

set -euo pipefail

# =============================================================================
# PATHS
# =============================================================================
WORKSPACE="/Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps"
SCRIPTS="$WORKSPACE/scripts/self-improve"
STATE="$SCRIPTS/meta-state.json"
CONFIG="$SCRIPTS/config.json"
LOCK_FILE="$SCRIPTS/.meta-agent.lock"
LOG_DIR="$SCRIPTS/logs"
INSIGHTS_DIR="$SCRIPTS/insights"
EVOLUTION_DIR="$SCRIPTS/evolution"
MARKETING_DIR="$SCRIPTS/marketing"

# =============================================================================
# TUNING
# =============================================================================
CYCLE_INTERVAL=1800           # 30 minutes between cycles in loop mode
MAX_CLAUDE_TIMEOUT=900        # 15 minutes max per Claude invocation
INTEL_INTERVAL_HOURS=6        # Market intelligence every 6 hours
EVOLVE_INTERVAL_HOURS=24      # Self-evolution every 24 hours
MARKETING_INTERVAL_HOURS=12   # Marketing sweep every 12 hours

# Top 3 products get aggressive attention; everything else gets maintenance
TOP_PRODUCTS=("cloudify" "linguaflow" "themify")

# =============================================================================
# LOGGING
# =============================================================================
TODAY=$(date +%Y-%m-%d)
LOG_FILE="$LOG_DIR/meta-${TODAY}.log"
mkdir -p "$LOG_DIR" "$INSIGHTS_DIR" "$EVOLUTION_DIR" "$MARKETING_DIR/posts" \
         "$MARKETING_DIR/seo" "$MARKETING_DIR/email"

log() {
  local level="$1"; shift
  local ts
  ts=$(date '+%Y-%m-%d %H:%M:%S')
  local msg="[$ts] [META/$level] $*"
  echo "$msg" >> "$LOG_FILE"
  if [[ "$level" == "ERROR" ]]; then
    echo "$msg" >&2
  else
    echo "$msg"
  fi
}

log_info()  { log "INFO"  "$@"; }
log_warn()  { log "WARN"  "$@"; }
log_error() { log "ERROR" "$@"; }

# =============================================================================
# LOCK — prevent concurrent meta-agent runs
# =============================================================================
acquire_lock() {
  if [[ -f "$LOCK_FILE" ]]; then
    local pid
    pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      log_warn "Another meta-agent is running (PID $pid). Exiting."
      exit 0
    fi
    log_warn "Stale lock (PID $pid). Removing."
    rm -f "$LOCK_FILE"
  fi
  echo $$ > "$LOCK_FILE"
  trap 'rm -f "$LOCK_FILE"' EXIT INT TERM HUP
}

# =============================================================================
# STATE — meta-state.json read/write via python3 (always available on macOS)
# =============================================================================
init_state() {
  if [[ ! -f "$STATE" ]]; then
    log_info "Initializing meta-state.json..."
    python3 << 'PYINIT'
import json, datetime

state = {
    "version": 2,
    "created": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    "total_cycles": 0,
    "business": {
        "estimated_mrr": 0,
        "total_deploys": 0,
        "total_apps_created": 0,
        "total_marketing_actions": 0,
        "total_intel_runs": 0,
        "total_evolution_runs": 0
    },
    "timing": {
        "last_cycle": None,
        "last_intel": None,
        "last_evolve": None,
        "last_marketing": None,
        "last_app_create": None,
        "last_revenue_opt": None
    },
    "action_stats": {
        "improve": {"runs": 0, "successes": 0, "avg_duration_s": 0},
        "intel": {"runs": 0, "successes": 0, "avg_duration_s": 0},
        "marketing": {"runs": 0, "successes": 0, "avg_duration_s": 0},
        "create_app": {"runs": 0, "successes": 0, "avg_duration_s": 0},
        "evolve": {"runs": 0, "successes": 0, "avg_duration_s": 0},
        "revenue_opt": {"runs": 0, "successes": 0, "avg_duration_s": 0}
    },
    "apps": {},
    "intel_cache": {
        "trending_niches": [],
        "competitor_weaknesses": [],
        "seo_gaps": [],
        "feature_ideas": []
    },
    "evolution": {
        "generation": 0,
        "decisions": [],
        "prompt_versions": {}
    },
    "action_queue": []
}

with open("/Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve/meta-state.json", "w") as f:
    json.dump(state, f, indent=2)
print("meta-state.json initialized")
PYINIT
  fi
}

# Read a dot-notation field from state
read_state() {
  local field="$1"
  python3 -c "
import json
with open('$STATE') as f:
    s = json.load(f)
keys = '$field'.split('.')
v = s
for k in keys:
    if isinstance(v, dict):
        v = v.get(k)
    else:
        v = None
        break
print('' if v is None else v)
" 2>/dev/null || echo ""
}

# Execute arbitrary python against state (atomic write)
update_state() {
  local py_code="$1"
  python3 -c "
import json
with open('$STATE', 'r') as f:
    state = json.load(f)
$py_code
with open('$STATE', 'w') as f:
    json.dump(state, f, indent=2)
" 2>/dev/null
}

# =============================================================================
# CLAUDE WRAPPER — all AI work goes through this
# Safe: captures output, enforces timeout, logs everything
# =============================================================================
run_claude() {
  local prompt="$1"
  local timeout="${2:-$MAX_CLAUDE_TIMEOUT}"
  local output=""
  local exit_code=0

  if ! command -v claude &>/dev/null; then
    log_error "Claude CLI not found on PATH"
    return 1
  fi

  output=$(timeout "$timeout" claude --print --dangerously-skip-permissions \
    -p "$prompt" 2>&1) || exit_code=$?

  if [[ $exit_code -eq 124 ]]; then
    log_error "Claude timed out after ${timeout}s"
    return 1
  elif [[ $exit_code -ne 0 ]]; then
    log_error "Claude exited with code $exit_code"
    echo "$output" | tail -20 >> "$LOG_FILE"
    return 1
  fi

  echo "$output"
  return 0
}

# =============================================================================
# PRIORITY ENGINE
# =============================================================================
# Returns the single highest-priority action to take this cycle.
# Actions: intel, create_app, marketing, improve, evolve, revenue_opt
#
# Priority formula per action type:
#   score = base_weight * time_multiplier * context_bonus
#
# - time_multiplier increases the longer since last run of that type
# - context_bonus is +50% if intel_cache has actionable signals
# - improve gets a bonus for top products
# =============================================================================
pick_action() {
  python3 << 'PYPICK'
import json, datetime, sys

STATE_PATH = "/Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve/meta-state.json"

with open(STATE_PATH) as f:
    state = json.load(f)

now = datetime.datetime.utcnow()

def hours_since(iso_str):
    """Hours since an ISO timestamp. Returns 9999 if never run."""
    if not iso_str:
        return 9999
    try:
        dt = datetime.datetime.strptime(iso_str, "%Y-%m-%dT%H:%M:%SZ")
        return (now - dt).total_seconds() / 3600
    except:
        return 9999

timing = state.get("timing", {})
stats = state.get("action_stats", {})
intel = state.get("intel_cache", {})

# Hours since each action type last ran
h_intel     = hours_since(timing.get("last_intel"))
h_evolve    = hours_since(timing.get("last_evolve"))
h_marketing = hours_since(timing.get("last_marketing"))
h_cycle     = hours_since(timing.get("last_cycle"))
h_create    = hours_since(timing.get("last_app_create"))
h_revenue   = hours_since(timing.get("last_revenue_opt"))

# Base weights: higher = more important by default
# intel runs every 6h, evolve every 24h, marketing every 12h
# improve is the workhorse, runs most often
weights = {
    "intel":       30,   # market intelligence
    "improve":     50,   # code improvements (most frequent)
    "marketing":   25,   # SEO + content
    "create_app":  15,   # new app creation (rare, high impact)
    "evolve":      20,   # self-evolution
    "revenue_opt": 20,   # revenue optimization
}

# Time multiplier: overdue actions get boosted
# intel is due every 6h, so at 6h it gets 2x, at 12h it gets 3x
def time_mult(hours_since, interval_hours):
    if hours_since >= interval_hours:
        return 1 + (hours_since / interval_hours)
    return hours_since / interval_hours  # <1 if not yet due

scores = {}
scores["intel"]       = weights["intel"]       * time_mult(h_intel, 6)
scores["improve"]     = weights["improve"]     * time_mult(h_cycle, 0.5)  # due every 30min
scores["marketing"]   = weights["marketing"]   * time_mult(h_marketing, 12)
scores["create_app"]  = weights["create_app"]  * time_mult(h_create, 48)  # every 2 days
scores["evolve"]      = weights["evolve"]       * time_mult(h_evolve, 24)
scores["revenue_opt"] = weights["revenue_opt"] * time_mult(h_revenue, 24)

# Context bonuses: if intel found something actionable, boost create_app and marketing
has_niches = len(intel.get("trending_niches", [])) > 0
has_seo_gaps = len(intel.get("seo_gaps", [])) > 0
has_feature_ideas = len(intel.get("feature_ideas", [])) > 0

if has_niches:
    scores["create_app"] *= 1.8   # strong signal to create
if has_seo_gaps:
    scores["marketing"] *= 1.5
if has_feature_ideas:
    scores["improve"] *= 1.3

# Success rate penalty: if an action type keeps failing, deprioritize it
for action, s in stats.items():
    if action in scores and s.get("runs", 0) > 3:
        rate = s.get("successes", 0) / s["runs"]
        if rate < 0.3:
            scores[action] *= 0.5  # halve score for <30% success rate

# Pick the winner
best = max(scores, key=scores.get)
print(best)
PYPICK
}

# =============================================================================
# ACTION 1: MARKET INTELLIGENCE
# =============================================================================
# Uses Claude to research trends across ProductHunt, HN, IndieHackers.
# Saves structured insights to insights/YYYY-MM-DD.json.
# Updates intel_cache in meta-state for other actions to consume.
# =============================================================================
action_intel() {
  log_info "=== MARKET INTELLIGENCE ==="
  local start_time
  start_time=$(date +%s)

  local today
  today=$(date +%Y-%m-%d)
  local insights_file="$INSIGHTS_DIR/${today}.json"

  local prompt
  prompt="You are a SaaS market intelligence analyst. Research and analyze the current market landscape for a developer who runs these products:

1. **Cloudify** — A Vercel/Netlify rival deployment platform (PaaS)
2. **LinguaFlow** — An AI-powered language learning app
3. **Themify** — An iOS theming/customization app

Also consider the broader SaaS landscape for solo developers.

Provide your analysis as a JSON object with these fields:
{
  \"date\": \"${today}\",
  \"trending_niches\": [
    {\"niche\": \"...\", \"demand_signal\": \"...\", \"competition_level\": \"low|medium|high\", \"monetization_potential\": \"low|medium|high\", \"suggested_app_name\": \"...\", \"one_liner\": \"...\"}
  ],
  \"competitor_weaknesses\": [
    {\"competitor\": \"...\", \"product_area\": \"cloudify|linguaflow|themify\", \"weakness\": \"...\", \"opportunity\": \"...\"}
  ],
  \"seo_gaps\": [
    {\"keyword\": \"...\", \"monthly_volume_estimate\": \"...\", \"difficulty\": \"low|medium|high\", \"target_app\": \"...\", \"content_strategy\": \"...\"}
  ],
  \"feature_ideas\": [
    {\"app\": \"...\", \"feature\": \"...\", \"user_demand_signal\": \"...\", \"effort\": \"low|medium|high\", \"impact\": \"low|medium|high\"}
  ]
}

Focus on ACTIONABLE insights. Each niche should be something a solo developer could build and launch in 1-2 days. Each SEO gap should target keywords with low competition. Each feature idea should be high-impact, low-effort.

Output ONLY the JSON object, no other text."

  local result
  result=$(run_claude "$prompt" 600) || {
    log_error "Market intelligence failed"
    update_state "
import datetime
state['action_stats']['intel']['runs'] = state['action_stats']['intel'].get('runs', 0) + 1
"
    return 1
  }

  # Extract JSON from the response (Claude might wrap it in markdown)
  local json_result
  json_result=$(echo "$result" | python3 -c "
import sys, json, re
text = sys.stdin.read()
# Try to extract JSON from markdown code blocks or raw text
match = re.search(r'\{[\s\S]*\}', text)
if match:
    try:
        obj = json.loads(match.group())
        print(json.dumps(obj, indent=2))
    except:
        print('{}')
else:
    print('{}')
" 2>/dev/null || echo "{}")

  # Save insights to file
  echo "$json_result" > "$insights_file"
  log_info "Saved insights to $insights_file"

  # Update intel_cache in meta-state
  update_state "
import json, datetime
try:
    insights = json.loads('''$json_result''')
except:
    insights = {}

state['intel_cache']['trending_niches'] = insights.get('trending_niches', [])[:5]
state['intel_cache']['competitor_weaknesses'] = insights.get('competitor_weaknesses', [])[:5]
state['intel_cache']['seo_gaps'] = insights.get('seo_gaps', [])[:10]
state['intel_cache']['feature_ideas'] = insights.get('feature_ideas', [])[:10]
state['timing']['last_intel'] = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
state['business']['total_intel_runs'] = state['business'].get('total_intel_runs', 0) + 1
state['action_stats']['intel']['runs'] = state['action_stats']['intel'].get('runs', 0) + 1
state['action_stats']['intel']['successes'] = state['action_stats']['intel'].get('successes', 0) + 1
"

  local end_time
  end_time=$(date +%s)
  local duration=$((end_time - start_time))
  log_info "Market intelligence complete in ${duration}s"

  # Update average duration
  update_state "
s = state['action_stats']['intel']
runs = s.get('runs', 1)
old_avg = s.get('avg_duration_s', 0)
s['avg_duration_s'] = int((old_avg * (runs - 1) + $duration) / runs)
"
}

# =============================================================================
# ACTION 2: AUTO-CREATE NEW APP
# =============================================================================
# Checks intel_cache for trending niches. If one looks viable:
#   1. Generates a complete app scaffold using Claude
#   2. Creates Dockerfile and docker-compose entry
#   3. Generates a landing page with SEO
#   4. Adds to config.json
#   5. (Optional) deploys if target infra is available
# =============================================================================
action_create_app() {
  log_info "=== AUTO-CREATE APP ==="
  local start_time
  start_time=$(date +%s)

  # Pick the best niche from intel_cache
  local niche_info
  niche_info=$(python3 -c "
import json
with open('$STATE') as f:
    state = json.load(f)
niches = state.get('intel_cache', {}).get('trending_niches', [])
if not niches:
    print('NONE')
else:
    # Pick the first niche with high monetization potential
    best = None
    for n in niches:
        if n.get('monetization_potential') == 'high' and n.get('competition_level') != 'high':
            best = n
            break
    if not best:
        best = niches[0]
    print(json.dumps(best))
" 2>/dev/null)

  if [[ "$niche_info" == "NONE" || -z "$niche_info" ]]; then
    log_info "No actionable niches in intel cache. Skipping app creation."
    # Remove the consumed niche so we don't retry it
    update_state "
import datetime
state['timing']['last_app_create'] = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
"
    return 0
  fi

  log_info "Selected niche: $niche_info"

  # Ask Claude to generate the app
  local prompt
  prompt="You are an expert full-stack developer. Create a complete, production-ready web application based on this market opportunity:

$niche_info

Requirements:
1. Use React + Vite for the frontend (fast, lightweight)
2. Include an Express.js backend if the app needs server-side logic
3. Create a beautiful, modern landing page with:
   - Hero section with clear value proposition
   - Features section
   - Pricing section (free tier + pro tier)
   - SEO meta tags, Open Graph tags, structured data (JSON-LD)
   - Responsive design (mobile-first)
4. Create a Dockerfile (multi-stage build, nginx for static, node for server)
5. Create a package.json with all dependencies
6. Include a .env.example file

Create all files in the directory: $WORKSPACE/<app-name>/

Use a short, catchy app name as the directory name (lowercase, hyphens ok).

IMPORTANT: Actually create the files. Do not just describe what to create. Write real, working code."

  local result
  result=$(run_claude "$prompt" "$MAX_CLAUDE_TIMEOUT") || {
    log_error "App creation failed"
    update_state "
import datetime
state['action_stats']['create_app']['runs'] = state['action_stats']['create_app'].get('runs', 0) + 1
state['timing']['last_app_create'] = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
"
    return 1
  }

  # Find what new directory was created
  local new_app=""
  new_app=$(python3 -c "
import os, json
workspace = '$WORKSPACE'
config_path = '$CONFIG'
with open(config_path) as f:
    config = json.load(f)
known = set(a['name'] for a in config.get('apps', []))
known.update({'scripts', 'infra', 'terraform', 'docs', '.git', 'node_modules'})
for entry in os.listdir(workspace):
    full = os.path.join(workspace, entry)
    if os.path.isdir(full) and entry not in known and not entry.startswith('.'):
        # Check if it has project files (created by Claude)
        markers = ['package.json', 'Dockerfile', 'index.html', 'index.js', 'main.tsx', 'App.tsx']
        if any(os.path.exists(os.path.join(full, m)) for m in markers):
            print(entry)
            break
" 2>/dev/null || echo "")

  if [[ -z "$new_app" ]]; then
    log_warn "No new app directory detected after creation attempt"
    update_state "
import datetime
state['action_stats']['create_app']['runs'] = state['action_stats']['create_app'].get('runs', 0) + 1
state['timing']['last_app_create'] = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
"
    return 1
  fi

  log_info "New app created: $new_app"

  # Add to config.json
  update_state "
import datetime
state['timing']['last_app_create'] = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
state['business']['total_apps_created'] = state['business'].get('total_apps_created', 0) + 1
state['action_stats']['create_app']['runs'] = state['action_stats']['create_app'].get('runs', 0) + 1
state['action_stats']['create_app']['successes'] = state['action_stats']['create_app'].get('successes', 0) + 1
# Remove consumed niche from cache
niches = state.get('intel_cache', {}).get('trending_niches', [])
if niches:
    state['intel_cache']['trending_niches'] = niches[1:]
"

  # Add to config.json as a new app entry
  python3 -c "
import json
config_path = '$CONFIG'
with open(config_path) as f:
    config = json.load(f)
new_entry = {
    'name': '$new_app',
    'path': '$new_app',
    'type': 'react',
    'hasDockerfile': True,
    'hasPackageJson': True,
    'hasTests': False,
    'testCommand': None,
    'buildCommand': 'npm run build',
    'deployTarget': 'none',
    'priority': 3,
    'productionUrl': None,
    'description': 'Auto-created by Meta Agent',
    'frameworks': ['react', 'vite']
}
config['apps'].append(new_entry)
with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)
print('Added $new_app to config.json')
" 2>/dev/null

  local end_time
  end_time=$(date +%s)
  local duration=$((end_time - start_time))
  log_info "App creation complete in ${duration}s: $new_app"
}

# =============================================================================
# ACTION 3: AUTO-MARKETING & SEO
# =============================================================================
# For each app, generates SEO-optimized content:
#   - Landing page meta tags and structured data
#   - Blog post drafts targeting keyword gaps
#   - Social media post drafts
#   - Sitemap updates
# Focuses on apps with the highest potential ROI.
# =============================================================================
action_marketing() {
  log_info "=== AUTO-MARKETING & SEO ==="
  local start_time
  start_time=$(date +%s)

  # Pick which app to do marketing for (prioritize top products)
  local target_app
  target_app=$(python3 -c "
import json, datetime, random

with open('$STATE') as f:
    state = json.load(f)
with open('$CONFIG') as f:
    config = json.load(f)

top = ['cloudify', 'linguaflow', 'edu-resources', 'nanoedit-ai', 'passport-photo-ai']
apps_state = state.get('apps', {})
now = datetime.datetime.utcnow()

# Find the top product that has gone longest without marketing
best = None
best_hours = -1
for name in top:
    app_s = apps_state.get(name, {})
    last_m = app_s.get('last_marketing')
    if not last_m:
        hours = 9999
    else:
        try:
            dt = datetime.datetime.strptime(last_m, '%Y-%m-%dT%H:%M:%SZ')
            hours = (now - dt).total_seconds() / 3600
        except:
            hours = 9999
    if hours > best_hours:
        best_hours = hours
        best = name

# Fallback to any deployed app
if not best:
    deployed = [a['name'] for a in config.get('apps', [])
                if a.get('productionUrl') and a.get('priority', 5) <= 3]
    best = random.choice(deployed) if deployed else 'cloudify'

print(best)
" 2>/dev/null)

  log_info "Marketing target: $target_app"

  # Get app details from config
  local app_url
  app_url=$(python3 -c "
import json
with open('$CONFIG') as f:
    config = json.load(f)
for app in config.get('apps', []):
    if app['name'] == '$target_app':
        print(app.get('productionUrl', 'https://${target_app}.tranthachnguyen.com'))
        break
" 2>/dev/null)

  # Get SEO gaps from intel cache relevant to this app
  local seo_context
  seo_context=$(python3 -c "
import json
with open('$STATE') as f:
    state = json.load(f)
gaps = [g for g in state.get('intel_cache', {}).get('seo_gaps', [])
        if g.get('target_app', '').lower() == '$target_app'.lower()]
print(json.dumps(gaps[:3]) if gaps else '[]')
" 2>/dev/null)

  local prompt
  prompt="You are an expert SEO and content marketing specialist. Generate marketing content for this app:

App: $target_app
URL: $app_url
SEO keyword gaps to target: $seo_context

Generate the following as a JSON object:
{
  \"meta_tags\": {
    \"title\": \"...\",
    \"description\": \"...\",
    \"keywords\": \"...\",
    \"og_title\": \"...\",
    \"og_description\": \"...\",
    \"og_image_prompt\": \"... (description for AI image generation)\"
  },
  \"blog_post\": {
    \"title\": \"...\",
    \"slug\": \"...\",
    \"meta_description\": \"...\",
    \"content_markdown\": \"... (full blog post, 800-1200 words, SEO optimized)\"
  },
  \"social_posts\": {
    \"twitter\": \"... (280 chars max, include hashtags)\",
    \"linkedin\": \"... (professional tone, 200 words)\",
    \"producthunt_tagline\": \"... (short tagline for PH launch)\"
  },
  \"structured_data\": {
    \"json_ld\": { ... }
  }
}

Make content genuine, valuable, and SEO-optimized. No fluff. Focus on solving real user problems.
Output ONLY the JSON object."

  local result
  result=$(run_claude "$prompt" 600) || {
    log_error "Marketing generation failed for $target_app"
    update_state "
import datetime
state['action_stats']['marketing']['runs'] = state['action_stats']['marketing'].get('runs', 0) + 1
"
    return 1
  }

  # Save marketing output
  local ts
  ts=$(date +%Y%m%d-%H%M%S)
  local output_file="$MARKETING_DIR/posts/${target_app}_${ts}.json"

  echo "$result" | python3 -c "
import sys, json, re
text = sys.stdin.read()
match = re.search(r'\{[\s\S]*\}', text)
if match:
    try:
        obj = json.loads(match.group())
        print(json.dumps(obj, indent=2))
    except:
        print(json.dumps({'raw': text[:2000]}))
else:
    print(json.dumps({'raw': text[:2000]}))
" > "$output_file" 2>/dev/null

  log_info "Marketing content saved to $output_file"

  # Now apply SEO improvements directly to the app if possible
  local app_dir="$WORKSPACE/$target_app"
  if [[ -d "$app_dir" ]]; then
    log_info "Applying SEO improvements to $app_dir..."
    local seo_prompt
    seo_prompt="You are improving SEO for the app at: $app_dir

Based on this marketing analysis, apply these improvements directly to the codebase:
1. Update or add meta tags in the main HTML/layout file
2. Add or improve structured data (JSON-LD)
3. Ensure Open Graph tags are present
4. Add or update robots.txt if missing
5. Add or update sitemap.xml if missing

Marketing data:
$(cat "$output_file" 2>/dev/null | head -100)

Rules:
- Only modify files within $app_dir
- Do not break existing functionality
- Make targeted, meaningful SEO improvements"

    run_claude "$seo_prompt" 600 >> "$LOG_FILE" 2>&1 || {
      log_warn "SEO application failed for $target_app (content still saved)"
    }
  fi

  # Update state
  update_state "
import datetime
now = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
state['timing']['last_marketing'] = now
state['business']['total_marketing_actions'] = state['business'].get('total_marketing_actions', 0) + 1
state['action_stats']['marketing']['runs'] = state['action_stats']['marketing'].get('runs', 0) + 1
state['action_stats']['marketing']['successes'] = state['action_stats']['marketing'].get('successes', 0) + 1
app_s = state.setdefault('apps', {}).setdefault('$target_app', {})
app_s['last_marketing'] = now
"

  local end_time
  end_time=$(date +%s)
  local duration=$((end_time - start_time))
  log_info "Marketing complete for $target_app in ${duration}s"
}

# =============================================================================
# ACTION 4: CODE IMPROVEMENT (delegates to existing orchestrator)
# =============================================================================
# Smart wrapper around the existing improve-app.sh. The difference:
# - Picks app based on priority + intel signals, not round-robin
# - Picks improvement type based on what intel says is needed
# - Records richer metrics
# =============================================================================
action_improve() {
  log_info "=== CODE IMPROVEMENT ==="
  local start_time
  start_time=$(date +%s)

  # Smart app selection: weighted by priority, health, and time since last improvement
  local target_app
  target_app=$(python3 -c "
import json, datetime, random

with open('$STATE') as f:
    state = json.load(f)
with open('$CONFIG') as f:
    config = json.load(f)

now = datetime.datetime.utcnow()
apps_state = state.get('apps', {})

candidates = []
for app in config.get('apps', []):
    name = app['name']
    if not app.get('hasPackageJson', False) and app.get('type') == 'ios-app':
        continue  # skip iOS apps (can't improve remotely)
    priority = app.get('priority', 5)
    app_s = apps_state.get(name, {})

    # Hours since last improvement
    last_imp = app_s.get('last_improvement')
    if not last_imp:
        hours = 9999
    else:
        try:
            dt = datetime.datetime.strptime(last_imp, '%Y-%m-%dT%H:%M:%SZ')
            hours = (now - dt).total_seconds() / 3600
        except:
            hours = 9999

    # Skip if recently improved (less than priority-based interval)
    intervals = {1: 12, 2: 24, 3: 72, 4: 168, 5: 336}
    min_hours = intervals.get(priority, 168)
    if hours < min_hours * 0.5:
        continue  # not yet due

    # Score: lower priority number = higher score, more overdue = higher score
    score = (6 - priority) * 10 + min(hours / min_hours, 5) * 20

    # Bonus if intel has feature ideas for this app
    feature_ideas = state.get('intel_cache', {}).get('feature_ideas', [])
    for idea in feature_ideas:
        if idea.get('app', '').lower() == name.lower():
            score += 30
            break

    # Penalty for consecutive failures
    fails = app_s.get('consecutive_failures', 0)
    if fails > 2:
        score *= 0.3

    candidates.append((name, score))

if not candidates:
    # Fallback: pick a random top product
    print(random.choice(['cloudify', 'linguaflow', 'edu-resources']))
else:
    candidates.sort(key=lambda x: x[1], reverse=True)
    print(candidates[0][0])
" 2>/dev/null)

  # Smart improvement type selection based on app and intel
  local improvement_type
  improvement_type=$(python3 -c "
import json, random

with open('$STATE') as f:
    state = json.load(f)
with open('$CONFIG') as f:
    config = json.load(f)

app_name = '$target_app'
app_s = state.get('apps', {}).get(app_name, {})
last_type = app_s.get('last_improvement_type', '')

# All valid types for the app
app_config = None
for a in config.get('apps', []):
    if a['name'] == app_name:
        app_config = a
        break

app_type = app_config.get('type', 'react') if app_config else 'react'

types_by_app = {
    'nextjs': ['performance', 'security', 'seo', 'accessibility', 'code-quality', 'testing', 'ux'],
    'react': ['performance', 'seo', 'accessibility', 'code-quality', 'ux', 'content'],
    'static-html': ['seo', 'accessibility', 'content', 'performance', 'ux'],
    'nodejs': ['performance', 'security', 'code-quality', 'testing'],
    'ios-app': ['code-quality', 'ux'],
}

valid_types = types_by_app.get(app_type, ['code-quality', 'performance', 'seo'])

# Check if intel suggests a specific focus
feature_ideas = state.get('intel_cache', {}).get('feature_ideas', [])
for idea in feature_ideas:
    if idea.get('app', '').lower() == app_name.lower():
        if idea.get('effort') == 'low':
            valid_types.insert(0, 'features')
        break

seo_gaps = state.get('intel_cache', {}).get('seo_gaps', [])
for gap in seo_gaps:
    if gap.get('target_app', '').lower() == app_name.lower():
        if 'seo' in valid_types:
            valid_types.remove('seo')
            valid_types.insert(0, 'seo')
        break

# Don't repeat the same type consecutively
if last_type in valid_types and len(valid_types) > 1:
    valid_types.remove(last_type)

print(valid_types[0])
" 2>/dev/null)

  log_info "Improving $target_app with type: $improvement_type"

  # Delegate to existing improve-app.sh if available
  local improve_script="$SCRIPTS/improve-app.sh"
  local exit_code=0

  if [[ -x "$improve_script" ]]; then
    timeout "$MAX_CLAUDE_TIMEOUT" "$improve_script" "$target_app" "$improvement_type" \
      >> "$LOG_FILE" 2>&1 || exit_code=$?
  else
    # Fallback: direct Claude invocation
    local app_dir="$WORKSPACE/$target_app"
    if [[ ! -d "$app_dir" ]]; then
      log_error "App directory not found: $app_dir"
      exit_code=1
    else
      local prompt="Improve the app at $app_dir. Focus on: $improvement_type.
Only modify files within this directory. Keep changes minimal and targeted."
      run_claude "$prompt" "$MAX_CLAUDE_TIMEOUT" >> "$LOG_FILE" 2>&1 || exit_code=$?
    fi
  fi

  local end_time
  end_time=$(date +%s)
  local duration=$((end_time - start_time))

  # Record result
  if [[ $exit_code -eq 0 ]]; then
    update_state "
import datetime
now = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
state['timing']['last_cycle'] = now
state['action_stats']['improve']['runs'] = state['action_stats']['improve'].get('runs', 0) + 1
state['action_stats']['improve']['successes'] = state['action_stats']['improve'].get('successes', 0) + 1
app_s = state.setdefault('apps', {}).setdefault('$target_app', {})
app_s['last_improvement'] = now
app_s['last_improvement_type'] = '$improvement_type'
app_s['total_improvements'] = app_s.get('total_improvements', 0) + 1
app_s['consecutive_failures'] = 0
"
    log_info "Improvement SUCCESS: $target_app/$improvement_type in ${duration}s"
  else
    update_state "
import datetime
now = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
state['timing']['last_cycle'] = now
state['action_stats']['improve']['runs'] = state['action_stats']['improve'].get('runs', 0) + 1
app_s = state.setdefault('apps', {}).setdefault('$target_app', {})
app_s['consecutive_failures'] = app_s.get('consecutive_failures', 0) + 1
"
    log_error "Improvement FAILED: $target_app/$improvement_type in ${duration}s (exit=$exit_code)"
  fi
}

# =============================================================================
# ACTION 5: SELF-EVOLUTION
# =============================================================================
# Analyzes its own performance and rewrites strategies:
# - Which action types have highest ROI?
# - Which apps benefit most?
# - Should we adjust weights, intervals, or prompts?
# - Are there new action types to add?
# Logs all decisions to evolution/decisions.json
# =============================================================================
action_evolve() {
  log_info "=== SELF-EVOLUTION ==="
  local start_time
  start_time=$(date +%s)

  # Gather current state for analysis
  local state_snapshot
  state_snapshot=$(python3 -c "
import json
with open('$STATE') as f:
    state = json.load(f)
# Summarize for Claude (don't send the full state)
summary = {
    'total_cycles': state.get('total_cycles', 0),
    'action_stats': state.get('action_stats', {}),
    'business': state.get('business', {}),
    'app_performance': {},
    'evolution_generation': state.get('evolution', {}).get('generation', 0)
}
for name, app_s in state.get('apps', {}).items():
    summary['app_performance'][name] = {
        'improvements': app_s.get('total_improvements', 0),
        'failures': app_s.get('consecutive_failures', 0),
        'last_type': app_s.get('last_improvement_type', 'none')
    }
print(json.dumps(summary, indent=2))
" 2>/dev/null)

  # Read recent log entries for context
  local recent_logs=""
  if [[ -f "$LOG_FILE" ]]; then
    recent_logs=$(tail -100 "$LOG_FILE" 2>/dev/null || echo "")
  fi

  local prompt
  prompt="You are the self-evolution module of an autonomous SaaS business agent. Analyze performance data and recommend strategic adjustments.

Current state:
$state_snapshot

Recent activity (last 100 log lines):
$recent_logs

Analyze and output a JSON object with your evolution decisions:
{
  \"generation\": <current generation + 1>,
  \"analysis\": {
    \"best_performing_action\": \"...\",
    \"worst_performing_action\": \"...\",
    \"best_performing_app\": \"...\",
    \"apps_to_deprioritize\": [\"...\"],
    \"apps_to_boost\": [\"...\"]
  },
  \"decisions\": [
    {
      \"type\": \"weight_adjustment|interval_change|new_strategy|prune_app|boost_app\",
      \"target\": \"...\",
      \"old_value\": \"...\",
      \"new_value\": \"...\",
      \"reasoning\": \"...\"
    }
  ],
  \"recommendations\": [
    \"Free-form strategic recommendations for the next 24 hours\"
  ]
}

Be data-driven. If there is not enough data yet (< 10 cycles), recommend staying the course and gathering more data. If actions consistently fail, recommend reducing their frequency. If an app has 0 improvements and keeps failing, recommend deprioritizing it.

Output ONLY the JSON object."

  local result
  result=$(run_claude "$prompt" 600) || {
    log_error "Self-evolution analysis failed"
    update_state "
import datetime
state['action_stats']['evolve']['runs'] = state['action_stats']['evolve'].get('runs', 0) + 1
"
    return 1
  }

  # Parse and save evolution decisions
  local decisions_file="$EVOLUTION_DIR/decisions.json"
  local new_decisions
  new_decisions=$(echo "$result" | python3 -c "
import sys, json, re
text = sys.stdin.read()
match = re.search(r'\{[\s\S]*\}', text)
if match:
    try:
        obj = json.loads(match.group())
        print(json.dumps(obj, indent=2))
    except:
        print('{}')
else:
    print('{}')
" 2>/dev/null || echo "{}")

  # Append to decisions history
  python3 -c "
import json, datetime, os

decisions_path = '$decisions_file'
new_raw = '''$new_decisions'''

try:
    new = json.loads(new_raw)
except:
    new = {}

# Load existing decisions history
history = []
if os.path.exists(decisions_path):
    try:
        with open(decisions_path) as f:
            history = json.load(f)
    except:
        history = []

new['timestamp'] = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
history.append(new)

# Keep last 50 evolution records
history = history[-50:]

with open(decisions_path, 'w') as f:
    json.dump(history, f, indent=2)
" 2>/dev/null

  log_info "Evolution decisions saved to $decisions_file"

  # Apply decisions to meta-state
  update_state "
import json, datetime

now = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
state['timing']['last_evolve'] = now
state['business']['total_evolution_runs'] = state['business'].get('total_evolution_runs', 0) + 1
state['action_stats']['evolve']['runs'] = state['action_stats']['evolve'].get('runs', 0) + 1
state['action_stats']['evolve']['successes'] = state['action_stats']['evolve'].get('successes', 0) + 1

try:
    decisions = json.loads('''$new_decisions''')
    gen = decisions.get('generation', state.get('evolution', {}).get('generation', 0) + 1)
    state['evolution']['generation'] = gen
    state['evolution']['decisions'] = decisions.get('decisions', [])[:10]
except:
    pass
"

  local end_time
  end_time=$(date +%s)
  local duration=$((end_time - start_time))
  log_info "Self-evolution complete in ${duration}s (generation $(read_state 'evolution.generation'))"
}

# =============================================================================
# ACTION 6: REVENUE OPTIMIZATION
# =============================================================================
# For monetizable apps (Cloudify, LinguaFlow, etc.):
# - Generates pricing page variants for A/B testing
# - Optimizes conversion funnels
# - Adds analytics tracking code
# - Generates email capture forms and sequences
# =============================================================================
action_revenue_opt() {
  log_info "=== REVENUE OPTIMIZATION ==="
  local start_time
  start_time=$(date +%s)

  # Revenue-relevant apps only
  local target_app
  target_app=$(python3 -c "
import json, datetime, random

monetizable = ['cloudify', 'linguaflow', 'edu-resources', 'nanoedit-ai', 'passport-photo-ai']

with open('$STATE') as f:
    state = json.load(f)

now = datetime.datetime.utcnow()
best = None
best_hours = -1

for name in monetizable:
    app_s = state.get('apps', {}).get(name, {})
    last_r = app_s.get('last_revenue_opt')
    if not last_r:
        hours = 9999
    else:
        try:
            dt = datetime.datetime.strptime(last_r, '%Y-%m-%dT%H:%M:%SZ')
            hours = (now - dt).total_seconds() / 3600
        except:
            hours = 9999
    if hours > best_hours:
        best_hours = hours
        best = name

print(best or random.choice(monetizable))
" 2>/dev/null)

  log_info "Revenue optimization target: $target_app"

  local app_dir="$WORKSPACE/$target_app"
  if [[ ! -d "$app_dir" ]]; then
    log_error "App directory not found: $app_dir"
    return 1
  fi

  local prompt
  prompt="You are a conversion rate optimization expert. Improve the revenue potential of the app at: $app_dir

Do the following (only if not already done):
1. If there is a pricing page, improve its copy and layout for better conversions
2. Add or improve email capture (newsletter signup) with a clear value proposition
3. Add Plausible analytics script tag if not present (<script defer data-domain=\"${target_app}.tranthachnguyen.com\" src=\"https://plausible.io/js/script.js\"></script>)
4. Ensure there is a clear call-to-action (CTA) above the fold on the landing page
5. Add social proof elements if missing (testimonials section, user count, GitHub stars)

Rules:
- Only modify files within $app_dir
- Do not break existing functionality
- Focus on high-impact, low-effort changes
- Make the changes look professional and native to the existing design"

  local exit_code=0
  run_claude "$prompt" "$MAX_CLAUDE_TIMEOUT" >> "$LOG_FILE" 2>&1 || exit_code=$?

  # Update state
  update_state "
import datetime
now = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
state['timing']['last_revenue_opt'] = now
state['action_stats']['revenue_opt']['runs'] = state['action_stats']['revenue_opt'].get('runs', 0) + 1
app_s = state.setdefault('apps', {}).setdefault('$target_app', {})
app_s['last_revenue_opt'] = now
$(if [[ $exit_code -eq 0 ]]; then echo "state['action_stats']['revenue_opt']['successes'] = state['action_stats']['revenue_opt'].get('successes', 0) + 1"; fi)
"

  local end_time
  end_time=$(date +%s)
  local duration=$((end_time - start_time))

  if [[ $exit_code -eq 0 ]]; then
    log_info "Revenue optimization SUCCESS for $target_app in ${duration}s"
  else
    log_error "Revenue optimization FAILED for $target_app in ${duration}s"
  fi
}

# =============================================================================
# BUSINESS DASHBOARD
# =============================================================================
print_dashboard() {
  python3 << 'PYDASH'
import json, sys

STATE_PATH = "/Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve/meta-state.json"

try:
    with open(STATE_PATH) as f:
        state = json.load(f)
except Exception as e:
    print(f"Could not read state: {e}")
    sys.exit(0)

biz = state.get("business", {})
timing = state.get("timing", {})
stats = state.get("action_stats", {})
intel = state.get("intel_cache", {})
evo = state.get("evolution", {})

print()
print("=" * 70)
print("  META AGENT — AUTONOMOUS SAAS BUSINESS MACHINE")
print("=" * 70)
print()

# Business metrics
print("  BUSINESS METRICS")
print("  " + "-" * 40)
print(f"  Total cycles:          {state.get('total_cycles', 0)}")
print(f"  Apps created:          {biz.get('total_apps_created', 0)}")
print(f"  Marketing actions:     {biz.get('total_marketing_actions', 0)}")
print(f"  Intel runs:            {biz.get('total_intel_runs', 0)}")
print(f"  Evolution generation:  {evo.get('generation', 0)}")
print(f"  Total deploys:         {biz.get('total_deploys', 0)}")
print()

# Action performance
print("  ACTION PERFORMANCE")
print("  " + "-" * 40)
print(f"  {'Action':<15} {'Runs':>6} {'Success':>8} {'Rate':>7} {'Avg(s)':>7}")
for action in ["improve", "intel", "marketing", "create_app", "evolve", "revenue_opt"]:
    s = stats.get(action, {})
    runs = s.get("runs", 0)
    successes = s.get("successes", 0)
    rate = f"{successes/runs*100:.0f}%" if runs > 0 else "N/A"
    avg = s.get("avg_duration_s", 0)
    print(f"  {action:<15} {runs:>6} {successes:>8} {rate:>7} {avg:>7}")
print()

# Timing
print("  LAST RUN TIMES")
print("  " + "-" * 40)
for key, label in [("last_cycle", "Last cycle"), ("last_intel", "Intel"),
                    ("last_evolve", "Evolution"), ("last_marketing", "Marketing"),
                    ("last_app_create", "App creation"), ("last_revenue_opt", "Revenue opt")]:
    val = timing.get(key, "never") or "never"
    print(f"  {label:<20} {val}")
print()

# Intel cache summary
print("  MARKET INTELLIGENCE CACHE")
print("  " + "-" * 40)
niches = intel.get("trending_niches", [])
print(f"  Trending niches:       {len(niches)}")
for n in niches[:3]:
    print(f"    - {n.get('niche', '?')} (monetization: {n.get('monetization_potential', '?')})")
gaps = intel.get("seo_gaps", [])
print(f"  SEO keyword gaps:      {len(gaps)}")
for g in gaps[:3]:
    print(f"    - \"{g.get('keyword', '?')}\" -> {g.get('target_app', '?')}")
ideas = intel.get("feature_ideas", [])
print(f"  Feature ideas:         {len(ideas)}")
for i in ideas[:3]:
    print(f"    - [{i.get('app', '?')}] {i.get('feature', '?')} (impact: {i.get('impact', '?')})")
print()

# Per-app stats
apps = state.get("apps", {})
if apps:
    print("  APP HEALTH")
    print("  " + "-" * 40)
    print(f"  {'App':<25} {'Impr':>5} {'Fails':>6} {'Last Type':<15}")
    for name in sorted(apps.keys()):
        a = apps[name]
        impr = a.get("total_improvements", 0)
        fails = a.get("consecutive_failures", 0)
        lt = a.get("last_improvement_type", "-")
        status = " [!]" if fails > 2 else ""
        print(f"  {name:<25} {impr:>5} {fails:>6} {lt:<15}{status}")
    print()

# Evolution decisions
decisions = evo.get("decisions", [])
if decisions:
    print("  LATEST EVOLUTION DECISIONS")
    print("  " + "-" * 40)
    for d in decisions[:5]:
        print(f"    [{d.get('type', '?')}] {d.get('target', '?')}: {d.get('reasoning', '?')[:60]}")
    print()

print("=" * 70)
print()
PYDASH
}

# =============================================================================
# SINGLE CYCLE — the main event loop body
# =============================================================================
run_cycle() {
  log_info "=== META AGENT CYCLE START ==="

  # Increment cycle counter
  update_state "
import datetime
state['total_cycles'] = state.get('total_cycles', 0) + 1
state['timing']['last_cycle'] = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
"

  # Pick the highest-priority action
  local action
  action=$(pick_action)
  log_info "Priority engine selected action: $action"

  # Execute the action
  case "$action" in
    intel)
      action_intel || log_error "Intel action failed"
      ;;
    create_app)
      action_create_app || log_error "Create app action failed"
      ;;
    marketing)
      action_marketing || log_error "Marketing action failed"
      ;;
    improve)
      action_improve || log_error "Improve action failed"
      ;;
    evolve)
      action_evolve || log_error "Evolve action failed"
      ;;
    revenue_opt)
      action_revenue_opt || log_error "Revenue opt action failed"
      ;;
    *)
      log_warn "Unknown action: $action. Defaulting to improve."
      action_improve || log_error "Improve action failed"
      ;;
  esac

  local cycle_num
  cycle_num=$(read_state "total_cycles")
  log_info "=== META AGENT CYCLE $cycle_num COMPLETE (action=$action) ==="
}

# =============================================================================
# MAIN
# =============================================================================
main() {
  local mode="${1:-cycle}"

  case "$mode" in
    --status|-s)
      init_state
      print_dashboard
      ;;
    --reset)
      rm -f "$STATE"
      init_state
      log_info "Meta-state reset."
      ;;
    --intel)
      acquire_lock
      init_state
      action_intel
      ;;
    --evolve)
      acquire_lock
      init_state
      action_evolve
      ;;
    --loop|-l)
      acquire_lock
      init_state
      log_info "Starting Meta Agent in LOOP mode (interval=${CYCLE_INTERVAL}s)"
      while true; do
        run_cycle || true
        print_dashboard
        log_info "Sleeping ${CYCLE_INTERVAL}s..."
        sleep "$CYCLE_INTERVAL"
      done
      ;;
    *)
      # Single cycle mode (for LaunchAgent)
      acquire_lock
      init_state
      run_cycle || true
      print_dashboard
      ;;
  esac
}

main "$@"
