# Comic News

Browse and read daily news stories transformed into comics. Track your reading progress and bookmark favorites.

## Features

- **Comic Browser** - Browse available comics with search, filter by genre, and sort by rating
- **Clean Reader** - Distraction-free panel-by-panel reading experience
- **Text Mode** - Toggle between comic and text versions of each story
- **Progress Tracking** - Resume reading where you left off (server-side)
- **Bookmarks** - Save favorite stories
- **Responsive Design** - Works on desktop and mobile

## Quick Start

### Development

```bash
# Start backend (port 5187)
cd backend
npm install
npm start

# Start frontend dev server (port 5173)
cd frontend
npm install
npm run dev
```

### Docker

The Dockerfile expects a pre-built frontend. Build locally first, then build the image:

```bash
# Build frontend
cd frontend && npm install && npm run build && cd ..

# Build and run Docker image
docker build -t comic-news .
docker run -p 5187:5187 comic-news
```

## Project Structure

```
comic-news/
├── backend/
│   ├── server.js       # Express API server + static file serving
│   ├── images/         # Comic image assets
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/ # Navbar, ComicCard
│   │   ├── pages/      # Home, Library, ComicDetail, Reader, Bookmarks
│   │   └── App.jsx     # Router setup
│   ├── public/
│   └── package.json
├── Dockerfile
└── package.json
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/comics` | List comics. Query params: `genre`, `search`, `sort` (`rating`\|`title`) |
| GET | `/api/comics/:id` | Get single comic with pages |
| GET | `/api/genres` | List available genres |
| GET | `/api/featured` | Top-rated comics (up to 4) |
| GET | `/api/bookmarks` | Get bookmarked comics |
| POST | `/api/bookmarks/:id` | Add bookmark |
| DELETE | `/api/bookmarks/:id` | Remove bookmark |
| GET | `/api/bookmarks/check/:id` | Check if comic is bookmarked |
| GET | `/api/progress/:id` | Get reading progress (page number) |
| POST | `/api/progress/:id` | Save reading progress (`{ page }`) |
| GET | `/robots.txt` | SEO robots file |
| GET | `/sitemap.xml` | SEO sitemap |

> Note: Bookmarks and reading progress are stored in-memory and reset on server restart.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5187` | Backend server port |
| `BASE_URL` | `https://comic-news.tranthachnguyen.com` | Base URL used in sitemap.xml |

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, React Router, Lucide React
- **Backend**: Node.js, Express
- **Deployment**: Docker (single container, backend serves built frontend)

## Live Demo

[comicnews.tranthachnguyen.com](https://comicnews.tranthachnguyen.com)

## License

© 2025 Tran Thach Nguyen. All rights reserved.
