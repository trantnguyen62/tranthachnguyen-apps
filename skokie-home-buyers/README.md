# Skokie Home Buyers

A lead generation landing page for a real estate cash buying business in Skokie, IL (ZIP 60076).

## Features

- Modern, responsive landing page
- Lead capture form with backend API
- Email notifications for new leads (optional)
- Admin dashboard to view and manage leads
- Docker-ready deployment

## Project Structure

```
skokie-home-buyers/
├── backend/
│   ├── server.js          # Express backend server
│   └── package.json       # Backend dependencies
├── assets/                # Images and static assets
├── index.html            # Main landing page
├── admin.html            # Admin dashboard
├── script.js             # Frontend JavaScript
├── styles.css            # Styling
├── Dockerfile            # Docker configuration
└── .env.example          # Environment variables template
```

## Development

### Prerequisites

- Node.js 20+
- npm

### Local Development

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. (Optional) Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your email settings if you want notifications
```

3. Start the development server:
```bash
cd backend
npm run dev
```

4. Open your browser to `http://localhost:5188`

### Access Admin Dashboard

Navigate to `http://localhost:5188/admin.html` to view submitted leads.

## Production Deployment

### Using Docker

Build and run with Docker:

```bash
docker build -t skokie-home-buyers .
docker run -p 5188:80 skokie-home-buyers
```

With email notifications:

```bash
docker run -p 5188:80 \
  -e EMAIL_USER=your-email@gmail.com \
  -e EMAIL_PASS=your-app-password \
  -e NOTIFY_EMAIL=notifications@example.com \
  skokie-home-buyers
```

## API Endpoints

### Public Endpoints

- `POST /api/leads` - Submit a new lead
  - Body: `{ address, email, phone }`
  - Returns: `{ success, message, leadId }`

### Admin Endpoints

- `GET /api/leads` - Get all leads
- `GET /api/leads/:id` - Get specific lead
- `PATCH /api/leads/:id` - Update lead status
- `DELETE /api/leads/:id` - Delete a lead
- `GET /api/health` - Health check

## Email Notifications

To enable email notifications when new leads are submitted:

1. Copy `.env.example` to `.env`
2. Configure your email settings:
   - For Gmail: Enable 2FA and create an App Password
   - Set `EMAIL_USER`, `EMAIL_PASS`, and `NOTIFY_EMAIL`
3. Restart the server

## Data Storage

Currently, leads are stored in-memory. For production use, consider:

- Adding a database (PostgreSQL, MongoDB, etc.)
- Implementing data persistence
- Adding authentication to admin endpoints
- Setting up automated backups

## SEO

The landing page includes:
- Optimized meta tags
- Location-specific keywords (Skokie, IL 60076)
- Semantic HTML structure
- Mobile-responsive design

## License

Copyright © 2026 Skokie Home Buyers. All rights reserved.
