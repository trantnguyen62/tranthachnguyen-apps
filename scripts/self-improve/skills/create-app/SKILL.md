# Skill: create-app

## Description
Generate a complete new app from a description, with Dockerfile, configuration, and optional deployment.

## Triggers
- "create new app"
- "build an app for"
- "new project"
- "generate an app that"
- "scaffold a new app"

## What It Does
1. Takes a description of the desired app
2. Determines the best tech stack based on requirements:
   - Static HTML for simple landing pages / info sites
   - React + Vite for interactive single-page apps
   - Next.js for full-stack apps with SSR
   - Node.js + Express for API-heavy backends
3. Generates all project files using Claude Code
4. Creates a production-ready Dockerfile
5. Adds the app to `config.json` with proper metadata
6. Optionally deploys to a Proxmox LXC container

## Configuration
- **Config**: /Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve/config.json
- **Apps root**: /Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/
- **Templates**: /Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve/templates/

## App Types
| Type | When to Use | Frameworks |
|------|-------------|------------|
| static-html | Simple sites, landing pages | HTML/CSS/JS |
| react | Interactive SPAs | React, Vite |
| nextjs | Full-stack with SSR | Next.js, React, Prisma |
| nodejs | Backend APIs | Express, Node.js |

## Generated Structure
```
new-app/
  Dockerfile          # Multi-stage production build
  package.json        # Dependencies and scripts
  README.md           # App documentation
  src/                # Source code
  public/             # Static assets
  .dockerignore       # Exclude node_modules, .git
```

## Deploy Targets
| Target | Capacity | Notes |
|--------|----------|-------|
| lxc201 | Primary | Main app server, most apps go here |
| lxc202 | Marketplaces | Marketplace-style apps |
| lxc203 | Cloudify only | Reserved for Cloudify platform |
| none | No deploy | Dev-only or experimental apps |

## Usage Examples

### Example 1
```
User: create a new app for tracking daily habits
Action: Scaffold React+Vite app, add habit tracking features, generate Dockerfile
```

### Example 2
```
User: build an app for comparing car insurance quotes
Action: Generate static HTML app with comparison UI, add to config.json
```

### Example 3
```
User: new project - AI-powered recipe generator
Action: Scaffold Next.js app with API routes, Gemini AI integration
```

## Implementation
```bash
# Via meta-agent
cd /Users/trannguyen/Desktop/TranThachnguyen.com/tranthachnguyen-apps/scripts/self-improve
./meta-agent.sh --create-app "description of the app"
```

## Post-Creation Steps
1. App added to `config.json` with appropriate priority
2. Health scan runs to verify build passes
3. If `deployTarget` is set, deploy to production
4. Meta-state updated with `total_apps_created` counter

---
*Part of the self-improvement pipeline for tranthachnguyen-apps*
