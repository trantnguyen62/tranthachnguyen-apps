# Cloudify - Cloud Deployment Platform

Cloudify is a self-hosted deployment platform inspired by Vercel. It provides Git-based deployments, serverless functions, edge functions, storage primitives, and all the tools developers need to build and scale modern web applications.

## Features

### Core Platform
- **Git-based Deployments** - Push to deploy with GitHub webhook integration
- **Build Pipeline** - Docker-isolated builds with framework auto-detection
- **Custom Domains** - Connect your own domains with automatic SSL via Let's Encrypt
- **Preview Deployments** - Every PR gets its own URL
- **Rollback Support** - Instantly roll back to any previous deployment

### Dashboard
- **Project Management** - Create, configure, and monitor all your projects
- **Deployment History** - Track all deployments with real-time streaming build logs
- **Environment Variables** - Securely manage configuration across environments
- **Analytics** - Real-time traffic, web vitals, and performance metrics
- **Team Collaboration** - Invite team members with role-based permissions

### Developer Tools
- **Framework Detection** - Automatic detection and optimization for Next.js, React, Vue, Svelte, and more
- **Monorepo Support** - Turborepo, Nx, Lerna, pnpm/yarn/npm workspaces
- **Serverless Functions** - Auto-scaling backend functions with multiple runtimes
- **Edge Functions** - Low-latency compute at the edge
- **Blob Storage** - S3-compatible object storage via MinIO
- **KV Store** - Key-value storage with TTL support
- **Edge Config** - Low-latency configuration store
- **Cron Jobs** - Scheduled task execution
- **Feature Flags** - Gradual rollouts with targeting rules

### Integrations
- **Stripe Billing** - Subscription plans (Free, Pro, Team)
- **GitHub Webhooks** - Automatic deployments on push
- **Cloudflare** - DNS management, SSL, and tunnel routing
- **Notifications** - Email (Resend/SendGrid), Slack, Discord
- **Monitoring** - Sentry error tracking, Datadog metrics

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Components**: Radix UI + Custom components
- **Animations**: Framer Motion
- **Database**: PostgreSQL + Prisma ORM
- **Storage**: MinIO (S3-compatible)
- **Cache**: Redis
- **Icons**: Lucide React
- **TypeScript**: Strict mode

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis (optional, for rate limiting and cron queues)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/cloudify.git
cd cloudify

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and secrets

# Push database schema
npx prisma db push

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

### Docker Deployment

```bash
docker build -t cloudify .
docker run -p 3000:3000 --env-file .env cloudify
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment instructions.

## Project Structure

```
cloudify/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages (login, signup)
│   ├── (dashboard)/       # Dashboard pages
│   │   ├── analytics/
│   │   ├── dashboard/
│   │   ├── deployments/
│   │   ├── domains/
│   │   ├── projects/
│   │   └── settings/
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication
│   │   ├── deploy/        # Build & deploy pipeline
│   │   ├── projects/      # Project CRUD
│   │   ├── webhooks/      # GitHub/Stripe webhooks
│   │   ├── billing/       # Stripe integration
│   │   └── ...
│   ├── new/               # New project wizard
│   └── pricing/           # Pricing page
├── components/            # React components
│   ├── dashboard/         # Dashboard-specific components
│   ├── landing/           # Landing page sections
│   ├── layout/            # Layout components
│   └── ui/                # Reusable UI components
├── lib/                   # Core business logic
│   ├── auth/              # Session-based authentication
│   ├── build/             # Build executor (Docker/K8s)
│   ├── billing/           # Stripe integration
│   ├── domains/           # DNS, SSL, ACME
│   ├── storage/           # MinIO + Redis clients
│   ├── notifications/     # Email, Slack, Discord
│   └── integrations/      # Cloudflare, Sentry, Datadog
├── prisma/                # Database schema & migrations
├── k8s/                   # Kubernetes manifests
└── packages/              # CLI and SDK packages
```

## API Routes

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/signup` - Register new account
- `POST /api/auth/logout` - End session
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `PATCH /api/projects?id=` - Update project
- `DELETE /api/projects?id=` - Delete project

### Deployments
- `GET /api/deploy` - List deployments
- `POST /api/deploy` - Trigger new deployment
- `POST /api/deploy/rollback` - Rollback to previous deployment

### Domains
- `GET /api/domains` - List domains
- `POST /api/domains` - Add custom domain
- `POST /api/ssl/provision` - Provision SSL certificate

### Webhooks
- `POST /api/webhooks/github` - GitHub push/PR events
- `POST /api/webhooks/stripe` - Stripe subscription events

## License

MIT License

---

Built with Next.js, PostgreSQL, and Tailwind CSS
