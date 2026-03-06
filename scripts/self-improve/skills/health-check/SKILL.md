# Skill: health-check

## Description
Run the health scanner across all apps, showing scores, grades, and priority recommendations.

## Triggers
- "health check"
- "check all apps"
- "app health"
- "scan health"
- "how healthy are the apps"

## What It Does
1. Runs `scan-health.sh` which checks each app for:
   - Dockerfile presence and validity (+5 pts)
   - README presence (+5 pts)
   - TypeScript errors (+10 pts)
   - ESLint errors (+10 pts)
   - Build success (+30 pts)
   - Test presence (+15 pts) and passing (+10 pts)
   - Dependencies freshness (+5 pts)
   - SEO meta tags (+5 pts)
   - Bundle size (+5 pts)
2. Generates scores (0-100) with letter grades (A-F)
3. Outputs JSON report at `reports/health-scan.json`
4. Outputs Markdown report at `reports/health-scan.md`
5. Shows priority queue (worst scores first)

## Configuration
- **Scanner**: /Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve/scan-health.sh
- **JSON report**: /Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve/reports/health-scan.json
- **MD report**: /Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve/reports/health-scan.md

## Scoring Breakdown
| Check | Points | Description |
|-------|--------|-------------|
| Dockerfile | 5 | Has valid Dockerfile with FROM |
| README | 5 | Has README.md |
| TypeScript | 10 | No TS errors (tsc --noEmit) |
| ESLint | 10 | No lint errors |
| Build | 30 | Build passes (npm run build) |
| Has Tests | 15 | Test script exists |
| Tests Pass | 10 | Tests pass |
| Dependencies | 5 | <= 2 outdated packages |
| SEO | 5 | Meta tags detected |
| Bundle Size | 5 | Under 500KB threshold |
| **Total** | **100** | |

## Grade Scale
| Grade | Score Range |
|-------|------------|
| A | 90-100 |
| B | 80-89 |
| C | 70-79 |
| D | 60-69 |
| F | 0-59 |

## Usage Examples

### Example 1
```
User: health check
Action: Run scan-health.sh, display results summary
```

### Example 2
```
User: check all apps
Action: Run full scan, show scoreboard table
```

## Implementation
```bash
cd /Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve
./scan-health.sh
cat reports/health-scan.md
```

## Notes
- Full scan takes several minutes (builds + tests for each app)
- Docker checks are skipped if Docker is not available locally
- Apps without package.json get reduced scoring categories

---
*Part of the self-improvement pipeline for tranthachnguyen-apps*
