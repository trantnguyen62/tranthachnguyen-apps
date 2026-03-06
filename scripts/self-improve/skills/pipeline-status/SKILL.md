# Skill: pipeline-status

## Description
Show current pipeline health, recent improvement cycles, success rates, and business metrics.

## Triggers
- "pipeline status"
- "how is the pipeline"
- "show improvements"
- "pipeline health"
- "what has the pipeline done"

## What It Does
1. Reads `state.json` for cycle counts, success rates, per-app stats
2. Reads `meta-state.json` for business metrics (MRR, deploys, marketing)
3. Reads recent logs for today's activity
4. Reads health scan results for app scores
5. Compiles a dashboard showing:
   - Total cycles, success rate, last cycle time
   - Per-app improvement counts and health
   - Business metrics (MRR, deploys, apps created)
   - Recent activity from logs

## Configuration
- **State file**: /Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve/state.json
- **Meta-state**: /Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve/meta-state.json
- **Health report**: /Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve/reports/health-scan.json
- **Logs**: /Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve/logs/

## Dashboard Sections

### Global Stats
| Metric | Source |
|--------|--------|
| Total cycles | state.json -> totalCycles |
| Success rate | state.json -> totalSuccess / totalCycles |
| Last cycle | state.json -> lastCycle |
| Estimated MRR | meta-state.json -> business.estimated_mrr |
| Total deploys | meta-state.json -> business.total_deploys |

### Per-App Stats
| Field | Source |
|-------|--------|
| Total improvements | state.json -> apps.<name>.totalImprovements |
| Last improvement | state.json -> apps.<name>.lastImprovement |
| Last type | state.json -> apps.<name>.lastType |
| Consecutive failures | state.json -> apps.<name>.consecutiveFailures |
| Health score | reports/health-scan.json -> apps.<name>.score |

## Usage Examples

### Example 1
```
User: pipeline status
Response: Shows full dashboard with all metrics
```

### Example 2
```
User: how is the pipeline doing?
Response: Summary of recent activity and health
```

## Implementation
```bash
# Quick stats via state.sh
cd /Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve
./state.sh stats

# Full health scan
./scan-health.sh

# View recent diary
cat diary/$(date +%Y-%m-%d).md
```

---
*Part of the self-improvement pipeline for tranthachnguyen-apps*
