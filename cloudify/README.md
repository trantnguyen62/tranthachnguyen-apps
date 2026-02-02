# Cloudify - Cloud Platform for Developers

Cloudify is a full-featured deployment platform inspired by Vercel. It provides Git-based deployments, serverless functions, a global edge network, and all the tools developers need to build and scale modern web applications.

## Features

### Core Platform
- **Git-based Deployments** - Push to deploy with automatic preview environments
- **Global Edge Network** - 100+ edge locations for low-latency content delivery
- **Serverless Functions** - Auto-scaling backend without infrastructure management
- **Custom Domains** - Connect your own domains with automatic SSL

### Dashboard
- **Project Management** - Create, configure, and monitor all your projects
- **Deployment History** - Track all deployments with detailed build logs
- **Environment Variables** - Securely manage configuration across environments
- **Analytics** - Real-time traffic, performance, and function metrics

### Developer Experience
- **Framework Detection** - Automatic detection and optimization for popular frameworks
- **Build Logs** - Real-time streaming logs with search and download
- **Preview Deployments** - Every branch gets its own URL
- **Team Collaboration** - Invite team members with role-based permissions

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Components**: Radix UI + Custom components
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Theming**: next-themes
- **TypeScript**: Strict mode

## Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/cloudify.git
cd cloudify

# Install dependencies
npm install

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
docker run -p 3000:3000 cloudify
```

## Project Structure

```
cloudify/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/       # Dashboard pages
│   │   ├── analytics/
│   │   ├── dashboard/
│   │   ├── deployments/
│   │   ├── domains/
│   │   ├── projects/
│   │   └── settings/
│   ├── api/               # API routes
│   │   ├── auth/
│   │   ├── deploy/
│   │   └── projects/
│   ├── new/               # New project wizard
│   └── pricing/           # Pricing page
├── components/            # React components
│   ├── dashboard/         # Dashboard-specific components
│   ├── landing/           # Landing page sections
│   ├── layout/            # Layout components
│   └── ui/                # Reusable UI components
├── lib/                   # Utility functions
├── types/                 # TypeScript types
└── public/                # Static assets
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, features, testimonials |
| `/login` | User authentication |
| `/signup` | New user registration |
| `/dashboard` | Main dashboard overview |
| `/projects` | Project list and management |
| `/projects/[name]` | Project details and configuration |
| `/deployments` | Deployment history across all projects |
| `/domains` | Custom domain management |
| `/analytics` | Traffic and performance analytics |
| `/settings` | Account and team settings |
| `/new` | New project import wizard |
| `/pricing` | Pricing plans and comparison |

## API Routes

### Authentication
- `POST /api/auth` - Login, signup, logout
- `GET /api/auth` - Get current user

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `PATCH /api/projects?id=` - Update project
- `DELETE /api/projects?id=` - Delete project

### Deployments
- `GET /api/deploy` - List deployments
- `POST /api/deploy` - Create new deployment

## Components

### UI Components
- `Button` - Primary action buttons with variants
- `Card` - Content container with header/footer
- `Input` - Form input with validation states
- `Badge` - Status and label indicators
- `Dialog` - Modal dialogs
- `DropdownMenu` - Context menus
- `Tabs` - Content organization
- `Progress` - Progress bars
- `Avatar` - User avatars
- `Switch` - Toggle switches
- `Tooltip` - Hover tooltips

### Dashboard Components
- `BuildLogs` - Real-time build log viewer
- `EnvVariables` - Environment variable editor
- `Sidebar` - Navigation sidebar

## Roadmap

### Phase 1 (Current)
- [x] Landing page
- [x] Authentication
- [x] Dashboard UI
- [x] Project management
- [x] Deployment tracking
- [x] Domain management
- [x] Analytics dashboard
- [x] Settings pages
- [x] Pricing page
- [x] API routes

### Phase 2 (Planned)
- [ ] Real deployment pipeline
- [ ] GitHub OAuth integration
- [ ] Webhook handlers
- [ ] Database integration
- [ ] Team invitations
- [ ] Billing integration

### Phase 3 (Future)
- [ ] Edge functions runtime
- [ ] Web Analytics SDK
- [ ] Speed Insights
- [ ] Cron jobs
- [ ] Storage (Blob/KV)
- [ ] AI features

## License

MIT License

---

Built with Next.js and Tailwind CSS
