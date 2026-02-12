# React + Vite Starter for Cloudify

A minimal React app with Vite, TypeScript, and zero extra dependencies. Ready to deploy on Cloudify.

## Deploy on Cloudify

1. Push this project to a GitHub repository
2. Go to your Cloudify dashboard
3. Click "Import Project" and select your repository
4. Cloudify will auto-detect Vite and configure build settings
5. Click "Deploy"

### Build Settings (auto-detected)

| Setting | Value |
|---------|-------|
| Framework | Vite |
| Build Command | `tsc && vite build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node Version | 20 |

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to see the result.

## Project Structure

```
react-vite/
  src/
    App.tsx     -- Main application component
    main.tsx    -- Entry point
  index.html    -- HTML template
  vite.config.ts
  package.json
  tsconfig.json
```

## What's Included

- **React 18** -- Latest React with concurrent features
- **Vite** -- Lightning-fast dev server and build tool
- **TypeScript** -- Full type safety
- **HMR** -- Hot Module Replacement for instant feedback
