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
# Start backend on port 5188 (Vite dev server proxies /api to this port)
cd backend
npm install
ALLOWED_ORIGIN=http://localhost:5187 PORT=5188 npm start

# Start frontend dev server (port 5187)
cd frontend
npm install
npm run dev
```

> The Vite dev proxy forwards `/api` requests from `localhost:5187` to the backend on `localhost:5188`, so both ports must be free. In production (Docker), a single process serves everything on one port.

### Docker

The Dockerfile expects a pre-built frontend. Build locally first, then build the image:

```bash
# Build frontend
cd frontend && npm install && npm run build && cd ..

# Build and run Docker image
docker build -t comic-news .
docker run -p 5187:5187 \
  -e BASE_URL=https://example.com \
  -e ALLOWED_ORIGIN=https://example.com \
  comic-news
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
| GET | `/api/comics` | List comics. Query params: `genre` (exact match), `search` (matches title/author/description), `sort` (`rating`\|`title`) |
| GET | `/api/comics/:id` | Get single comic with `pages` (images) and `panels` (text descriptions) |
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

> Note: Bookmarks and reading progress are stored in-memory and reset on server restart. Bookmarks are capped at 500 entries; reading progress at 1000 unique comics.

## Data Model

A comic object returned by `/api/comics/:id`:

```json
{
  "id": 1,
  "title": "Story Title",
  "author": "Author Name",
  "genre": "Slice of Life",
  "publishedDate": "2025-01-15",
  "coverImage": "/images/cover.png",
  "description": "Short description shown on cards and detail pages.",
  "rating": 4.8,
  "chapters": 1,
  "status": "Completed",
  "hasTextVersion": true,
  "textStory": "Full plain-text version of the story.",
  "pages": [
    { "id": 1, "image": "/images/panel_1.png", "caption": "Panel caption for alt text" }
  ],
  "panels": [
    { "id": 1, "title": "Panel Title", "description": "Panel summary shown on detail page" }
  ]
}
```

List endpoints (`/api/comics`, `/api/featured`, `/api/bookmarks`) omit `pages` to keep payloads small.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5187` | Backend server port |
| `BASE_URL` | `https://comic-news.tranthachnguyen.com` | Base URL used in sitemap.xml |
| `ALLOWED_ORIGIN` | `https://comic-news.tranthachnguyen.com` | CORS allowed origin for API requests |

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, React Router, Lucide React
- **Backend**: Node.js, Express
- **Deployment**: Docker (single container, backend serves built frontend)

## Live Demo

[comicnews.tranthachnguyen.com](https://comicnews.tranthachnguyen.com)

## License

© 2025 Tran Thach Nguyen. All rights reserved.
