# Next.js Starter for Cloudify

A minimal Next.js starter template ready to deploy on Cloudify.

## Deploy on Cloudify

1. Push this project to a GitHub repository
2. Go to your Cloudify dashboard
3. Click "Import Project" and select your repository
4. Cloudify will auto-detect Next.js and configure the build settings
5. Click "Deploy" -- your site will be live in under a minute

### Build Settings (auto-detected)

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Build Command | `npm run build` |
| Output Directory | `out` |
| Install Command | `npm install` |
| Node Version | 20 |

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## Project Structure

```
nextjs-starter/
  pages/
    index.tsx       -- Landing page
    api/
      hello.ts      -- API route example
  next.config.js    -- Next.js configuration (static export)
  package.json
  tsconfig.json
```

## What's Included

- **TypeScript** -- Full type safety
- **API Routes** -- Serverless API endpoints
- **Static Export** -- Pre-rendered HTML for fast loading
- **Zero Config** -- Works out of the box with Cloudify
