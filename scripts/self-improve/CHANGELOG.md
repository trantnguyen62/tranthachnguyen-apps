# Changelog

All notable changes to the self-improvement pipeline are documented in this file.

## [1.0.0] - 2026-03-06

### Added

- **Orchestrator** (`orchestrator.sh`): Master controller with round-robin app and type selection, cooldown management, state tracking, lock file for concurrency prevention, and three run modes (single cycle, continuous loop, status).

- **App Improver** (`improve-app.sh`): Per-app improvement executor with Claude Code CLI integration, build verification, automatic revert on failure, git stash/restore for pre-existing changes, and timeout handling.

- **Test and Merge** (`test-and-merge.sh`): CI/CD gate supporting five app types (nextjs, react, static-html, nodejs, python), auto-detection of change types from file names, structured commit messages, and JSON report generation.

- **Rollback** (`rollback.sh`): Production rollback via SSH to Proxmox LXC containers, Docker image version management, health check verification (60s window), automatic restoration of original container on failure, and webhook notifications.

- **Report Generator** (`report.sh`): Daily markdown reports from JSONL logs with summary stats, per-app table, per-type breakdown, timeline, and failures section. Supports webhook delivery.

- **Notifications** (`notify.sh`): Local logging and optional Discord webhook integration with severity levels (success, failure, info) and colored embeds.

- **LaunchAgent**: macOS plist (`com.self-improve-portfolio.plist`) running every 30 minutes with proper PATH, working directory, and nice level configured.

- **Setup Scripts**: `install.sh` and `uninstall.sh` for LaunchAgent management, `setup-mac-mini.sh` for full machine provisioning (Homebrew, Node.js, Claude CLI, jq, git config).

- **12 Improvement Types**: error-handling, performance, security, testing, documentation, accessibility, code-quality, type-safety, logging, dependency-update, seo, ux-polish.

- **5 Additional Types in improve-app.sh**: bug-fix, ui-ux, content, features, infrastructure.

- **Auto-generated Config**: Workspace scanning for project directories with marker file detection (package.json, Cargo.toml, go.mod, pyproject.toml, etc.).

- **State Persistence**: JSON state file tracking total cycles, successes, failures, skips, per-app stats, and cooldown periods.

- **Safety Mechanisms**: Build verification before committing, git stash/revert on failure, cooldown after failures, lock file for single-instance enforcement, 10-minute timeout per improvement, health-checked rollbacks with automatic restoration.
