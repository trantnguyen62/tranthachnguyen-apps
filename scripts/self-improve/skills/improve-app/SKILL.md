# Skill: improve-app

## Description
Run a targeted improvement cycle on the specified app using the self-improvement pipeline.

## Triggers
- "improve <app>"
- "fix <app>"
- "enhance <app>"
- "improve cloudify"
- "fix the landing page"

## What It Does
1. Looks up the app in `config.json` (34 registered apps)
2. Selects an improvement type (bug-fix, ui-ux, performance, seo, security, testing, code-quality, etc.)
3. Runs `improve-app.sh <app-name> <type>` which:
   - Constructs a targeted prompt for Claude Code
   - Saves pre-improvement git state
   - Runs Claude Code with the improvement prompt (10-minute timeout)
   - Verifies the build still passes
   - Reverts on failure, keeps changes on success
4. Records success/failure in `state.json`
5. Logs results to `logs/YYYY-MM-DD.log`

## Configuration
- **Pipeline scripts**: /Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve/
- **Config**: /Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve/config.json
- **State**: /Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve/state.json
- **App root**: /Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/

## Available Improvement Types
| Type | Description |
|------|-------------|
| bug-fix | Fix TypeScript errors, null pointers, runtime errors |
| ui-ux | Responsive design, accessibility, animations |
| performance | Bundle size, load time, rendering efficiency |
| seo | Meta tags, structured data, Open Graph |
| security | XSS, CSRF, injection, headers |
| testing | Unit tests, integration tests |
| code-quality | Refactoring, dead code, naming |
| content | Copy, descriptions, placeholder text |
| dependencies | Update outdated packages |
| infrastructure | Dockerfile, build config optimization |
| docs | README, inline comments, JSDoc |
| features | Small useful features |

## Usage Examples

### Example 1: Improve a specific app
```
User: improve cloudify
Action: ./improve-app.sh cloudify <auto-selected-type>
```

### Example 2: Fix a specific app with a type
```
User: fix the landing page seo
Action: ./improve-app.sh landing-page seo
```

### Example 3: Enhance an app
```
User: enhance linguaflow performance
Action: ./improve-app.sh linguaflow performance
```

## Implementation
```bash
# Direct invocation
cd /Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve
./improve-app.sh <app-name> <improvement-type>

# Record result
./state.sh record-success <app-name> <type>   # on success
./state.sh record-failure <app-name>           # on failure
```

## Safety
- Build verification after every improvement
- Automatic git revert on build failure
- 10-minute timeout per improvement
- Cooldown after consecutive failures (exponential backoff)

---
*Part of the self-improvement pipeline for tranthachnguyen-apps*
