# Self-Improvement Pipeline

A 24/7 AI-powered pipeline that continuously analyzes and improves apps in the `tranthachnguyen-apps` monorepo using Claude Code CLI. It runs on a schedule, selects an app and improvement type via round-robin, applies changes, verifies builds, and rolls back on failure.

## Architecture

```
+---------------------------+      +------------------------+      +---------------------+
|   Tier 1: Mac Mini        |      |  Tier 2: GitHub        |      |  Tier 3: Proxmox    |
|   (AI Brain)              |      |  Actions (CI/CD Gate)  |      |  (Deploy Target)    |
|                           |      |                        |      |                     |
|  LaunchAgent (30m)        |      |  test-and-merge.sh     |      |  rollback.sh        |
|    |                      |      |    |                   |      |    |                |
|    v                      |      |    v                   |      |    v                |
|  orchestrator.sh          +----->+  Build verification    +----->+  Docker deploy      |
|    |                      | push |  Test suite            | pass |  Health check       |
|    v                      |      |  Auto-merge            |      |  Auto-rollback      |
|  improve-app.sh           |      |                        |      |                     |
|    |                      |      +------------------------+      +---------------------+
|    v                      |
|  Claude Code CLI          |
|    |                      |
|    v                      |
|  Git branch + push        |
+---------------------------+

Data flow:
  orchestrator.sh --> pick app (round-robin) --> pick type (round-robin)
       |
       v
  improve-app.sh --> Claude Code CLI --> code changes
       |
       v
  Build verification --> pass? --> commit + push branch
       |                  |
       | fail             v
       v             test-and-merge.sh (CI)
  Revert changes          |
                          v
                     rollback.sh (if deploy fails)
```

## Quick Start

### 1. Clone and navigate

```bash
cd /path/to/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve
```

### 2. Run the Mac Mini setup (installs all dependencies)

```bash
./setup-mac-mini.sh
```

This installs Homebrew, Node.js, Claude Code CLI, jq, configures git, installs the LaunchAgent, and runs a test cycle.

### 3. Or install manually

```bash
# Install the LaunchAgent (runs every 30 minutes)
./install.sh

# Run a single cycle manually
./orchestrator.sh

# Run in continuous loop mode
./orchestrator.sh --loop

# Check status
./orchestrator.sh --status
```

## Scripts Reference

### orchestrator.sh

The master controller. Manages state, picks the next app/type, runs improvements, and records results.

```bash
./orchestrator.sh              # Run one cycle (default, for LaunchAgent/cron)
./orchestrator.sh --loop       # Run continuous loop (30m intervals)
./orchestrator.sh --status     # Print state summary
./orchestrator.sh --reset      # Reset state file to defaults
```

**Key behaviors:**
- Acquires a lock file to prevent concurrent runs
- Round-robin selects app and improvement type from `config.json`
- Skips apps on cooldown (2 cycles after failure)
- Delegates to `improve-app.sh` or falls back to built-in Claude Code analysis
- Records results to `state.json`
- Timeout: 10 minutes per improvement

### improve-app.sh

Per-app improvement executor. Called by the orchestrator.

```bash
./improve-app.sh <app-name> <improvement-type>
# Example:
./improve-app.sh cloudify performance
```

**Key behaviors:**
- Reads app config from `config.json` (path, framework, build command)
- Stashes existing git changes before running
- Runs Claude Code CLI with a type-specific prompt
- Verifies build passes after changes
- Reverts all changes on timeout, Claude failure, or build failure
- Auto-detects build command from `package.json` if not configured

### test-and-merge.sh

CI/CD gate. Runs tests and commits/pushes on success, reverts on failure.

```bash
./test-and-merge.sh <app-name> <branch-name>
# Example:
./test-and-merge.sh cloudify auto-improve/cloudify-perf
```

**Supports app types:** `nextjs`, `react`, `static-html`, `nodejs`, `python`

**Key behaviors:**
- Runs framework-appropriate tests (build + test for Next.js, HTML validation for static, pytest for Python)
- Detects change type from modified file names (tests, performance, security, etc.)
- Commits with structured message: `auto-improve(app): type - summary`
- Writes JSON report to `reports/`
- Reverts and cleans on test failure

### rollback.sh

Rolls back a deployed app to a previous Docker image on a remote Proxmox LXC container.

```bash
./rollback.sh <app-name> <deploy-id>
# Example:
./rollback.sh cloudify deploy-2026-03-06-1430
```

**Key behaviors:**
- SSHs into Proxmox via Cloudflare Tunnel, then `pct exec` into the target LXC
- Finds previous Docker image (`:previous` tag, deploy-id tag, or second most recent)
- Stops current container, starts rollback image
- Health checks the new container (up to 60 seconds)
- If health check fails: restores original container automatically
- Sends Discord webhook notification on success/failure

### report.sh

Generates daily markdown reports from JSONL log files.

```bash
./report.sh              # Report for today
./report.sh 2026-03-05   # Report for specific date
```

**Output includes:** summary stats, per-app table, per-type table, timeline, and failures section.

### notify.sh

Notification helper. Logs locally and optionally sends to Discord.

```bash
./notify.sh "message" [severity]
# severity: success | failure | info (default)
```

Set `DISCORD_WEBHOOK_URL` environment variable to enable Discord notifications.

### install.sh / uninstall.sh

Manage the macOS LaunchAgent.

```bash
./install.sh     # Copy plist, load agent
./uninstall.sh   # Unload agent, remove plist
```

### setup-mac-mini.sh

One-shot setup for a fresh Mac Mini. Installs all dependencies, clones repo, installs LaunchAgent, and runs a test cycle.

```bash
./setup-mac-mini.sh
```

## Configuration

### config.json (auto-generated)

The orchestrator auto-generates `config.json` by scanning the workspace for directories containing project markers (`package.json`, `Cargo.toml`, `go.mod`, etc.).

```json
{
  "apps": [
    {
      "name": "cloudify",
      "enabled": true,
      "priority": 1
    },
    {
      "name": "portfolio",
      "enabled": true,
      "priority": 1
    }
  ],
  "max_runtime_seconds": 600,
  "cooldown_cycles": 2,
  "loop_interval": 1800
}
```

### Adding a new app

1. Ensure the app directory exists under `tranthachnguyen-apps/`
2. Include a project marker file (`package.json`, etc.)
3. Delete `config.json` and re-run the orchestrator (it will regenerate)
4. Or manually edit `config.json` to add the entry

### Disabling an app

Set `"enabled": false` in `config.json`:

```json
{ "name": "my-app", "enabled": false, "priority": 1 }
```

### Adjusting timing

Edit constants in `orchestrator.sh`:

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_RUNTIME_SECONDS` | 600 | Timeout per improvement (10 min) |
| `LOOP_INTERVAL` | 1800 | Seconds between cycles in loop mode (30 min) |
| `COOLDOWN_CYCLES` | 2 | Cycles to skip an app after failure |

Or set in `config.json`:

```json
{
  "max_runtime_seconds": 600,
  "cooldown_cycles": 2,
  "loop_interval": 1800
}
```

## Improvement Types

The orchestrator rotates through 12 improvement types:

| Type | Description |
|------|-------------|
| `error-handling` | Missing try-catch, unhandled rejections, silent failures |
| `performance` | Re-renders, missing memoization, N+1 queries, bundle size |
| `security` | XSS, injection, input validation, exposed secrets, CSRF |
| `testing` | Critical untested paths, edge cases, error paths |
| `documentation` | Missing JSDoc, API docs, complex algorithm explanations |
| `accessibility` | ARIA labels, color contrast, keyboard nav, alt text |
| `code-quality` | Dead code, duplication, complexity, naming, types |
| `type-safety` | `any` types, missing definitions, unsafe assertions |
| `logging` | Missing structured logging, log levels, audit trails |
| `dependency-update` | Outdated packages, security advisories, safe bumps |
| `seo` | Meta tags, structured data, Open Graph, sitemap |
| `ux-polish` | Loading states, error feedback, empty states, spacing |

`improve-app.sh` also supports these additional types when called directly:

| Type | Description |
|------|-------------|
| `bug-fix` | Runtime errors, null pointers, logic errors |
| `ui-ux` | Responsive design, WCAG AA, animations, visual polish |
| `content` | Replace placeholder text with realistic content |
| `features` | Add a small, self-contained useful feature |
| `infrastructure` | Dockerfile, build config, CI optimization |

## State Management

### state.json

Tracks cumulative pipeline state across cycles:

```json
{
  "total_cycles": 42,
  "total_successes": 35,
  "total_failures": 5,
  "total_skips": 2,
  "app_index": 12,
  "type_index": 8,
  "last_run": "2026-03-06T14:30:00Z",
  "apps": {
    "cloudify": {
      "total_improvements": 15,
      "last_success": "2026-03-06T14:30:00Z",
      "last_type": "performance",
      "last_duration": 245
    }
  }
}
```

Reset state: `./orchestrator.sh --reset`

## Monitoring

### Check pipeline status

```bash
./orchestrator.sh --status
```

Outputs a formatted summary table with total cycles, success rate, and per-app stats.

### View logs

```bash
# LaunchAgent stdout/stderr
tail -f /tmp/self-improve-portfolio.log
tail -f /tmp/self-improve-portfolio-error.log

# Daily orchestrator log
tail -f logs/$(date +%Y-%m-%d).log

# Notification history
cat logs/notifications.log
```

### Generate a daily report

```bash
./report.sh              # Today
./report.sh 2026-03-05   # Specific date
cat reports/2026-03-05.md
```

Reports include per-app tables, per-type breakdown, timeline, and failure details.

### Discord notifications

Set `DISCORD_WEBHOOK_URL` as an environment variable (in the plist or shell profile) to receive notifications for daily reports and rollback events.

## Safety

### Build verification

Every improvement is verified by running the app's build command. If the build fails, all changes are reverted immediately.

### Git stash/revert

- Pre-existing changes are stashed before each improvement
- On any failure (timeout, Claude error, build failure), `git checkout -- . && git clean -fd` reverts all changes
- Stashed changes are restored after revert

### Cooldown periods

After a failure, the app is skipped for 2 cycles (configurable via `COOLDOWN_CYCLES`). If all apps are on cooldown, the next one is forced.

### Rollback

`rollback.sh` provides production rollback with these safety measures:

1. Current container is renamed (not deleted) before rollback
2. Health checks run for up to 60 seconds after rollback
3. If the rollback image is unhealthy, the original container is automatically restored
4. Notifications are sent on both success and failure

### Lock file

Only one orchestrator instance can run at a time. A lock file (`/.orchestrator.lock`) with PID prevents concurrent runs. Stale locks from crashed processes are automatically cleaned up.

### Timeout

Each improvement is limited to 10 minutes (`MAX_RUNTIME_SECONDS=600`). Claude Code processes that exceed this are killed.

## Troubleshooting

### LaunchAgent not running

```bash
# Check if loaded
launchctl list | grep self-improve

# Reload
launchctl unload ~/Library/LaunchAgents/com.self-improve-portfolio.plist
launchctl load ~/Library/LaunchAgents/com.self-improve-portfolio.plist

# Check logs for errors
cat /tmp/self-improve-portfolio-error.log
```

### "Another orchestrator is running"

The lock file prevents concurrent runs. If the previous process crashed:

```bash
# Check if the PID is actually running
cat scripts/self-improve/.orchestrator.lock
ps aux | grep orchestrator

# If stale, remove it (the script does this automatically on next run)
rm scripts/self-improve/.orchestrator.lock
```

### Claude Code CLI not found

```bash
npm install -g @anthropic-ai/claude-code
```

Ensure `/usr/local/bin` or `/opt/homebrew/bin` is in PATH. The LaunchAgent plist includes these in its `EnvironmentVariables`.

### config.json not generated

The orchestrator auto-generates `config.json` on first run. If it fails:

```bash
# Check that the workspace directory exists and contains app directories
ls /path/to/tranthachnguyen-apps/

# Delete and let it regenerate
rm scripts/self-improve/config.json
./orchestrator.sh
```

### Build verification fails repeatedly

Check if the app actually builds locally:

```bash
cd /path/to/app
npm install
npm run build
```

If the app has external dependencies (database, API keys), the build may fail in the pipeline. Consider disabling the app in `config.json`.

### Rollback fails with "no previous image"

Rollback requires a previous Docker image to exist. Ensure images are tagged before deploys:

```bash
# Before deploying new version, tag current as :previous
docker tag myapp:latest myapp:previous
```

## Development

### File structure

```
self-improve/
  orchestrator.sh          # Master controller
  improve-app.sh           # Per-app improvement executor
  test-and-merge.sh        # CI/CD gate (test + commit)
  rollback.sh              # Production rollback
  report.sh                # Daily report generator
  notify.sh                # Notification helper
  install.sh               # LaunchAgent installer
  uninstall.sh             # LaunchAgent uninstaller
  setup-mac-mini.sh        # Full Mac Mini setup
  com.self-improve-portfolio.plist  # macOS LaunchAgent config
  state.json               # Pipeline state (auto-managed)
  config.json              # App configuration (auto-generated)
  logs/                    # Daily logs and JSONL data
  reports/                 # Generated markdown reports
  dashboard/               # (reserved for web dashboard)
  templates/               # Prompt templates
```

### Adding a new improvement type

1. Add the type name to the `IMPROVEMENT_TYPES` array in `orchestrator.sh`
2. Add a matching `case` entry in the `run_builtin_improvement` function with its prompt
3. Optionally add it to the `PROMPTS` associative array in `improve-app.sh`

### Modifying the pipeline flow

The pipeline follows this sequence:

1. `orchestrator.sh` acquires lock, initializes state and config
2. `pick_next_app()` selects app via round-robin with cooldown
3. `pick_next_type()` selects improvement type via round-robin
4. `run_improvement()` delegates to `improve-app.sh`
5. `improve-app.sh` runs Claude Code, verifies build, reverts on failure
6. `record_result()` updates `state.json`
7. `print_summary()` outputs the current stats

To modify the flow, edit `run_cycle()` in `orchestrator.sh`.

### State management internals

State is stored as JSON in `state.json` and manipulated via inline Python scripts (`update_state` and `read_state_field` functions). This avoids a `jq` dependency for state management while keeping the format human-readable.

### Testing changes

```bash
# Reset state and run a single cycle
./orchestrator.sh --reset
./orchestrator.sh

# Check state after
./orchestrator.sh --status

# View the log
cat logs/$(date +%Y-%m-%d).log
```
