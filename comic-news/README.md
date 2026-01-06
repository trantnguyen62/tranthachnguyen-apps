# 📚 Comic News (Comic Reader)

Browse and read your favorite comics with a beautiful reader interface. Track your progress and bookmark favorites.

## 🎯 Features

- **Comic Browser** - Browse available comics and chapters
- **Clean Reader** - Distraction-free reading experience
- **Progress Tracking** - Remember where you left off
- **Bookmarks** - Save your favorite chapters
- **Responsive Design** - Works on desktop and mobile

## 🚀 Quick Start

### Run the Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start server
npm start
```

### Run the Frontend

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Run with Docker

```bash
docker build -t comic-news .
docker run -p 5187:5187 comic-news
```

## 📁 Project Structure

```
comic-news/
├── backend/            # Express.js API server
│   ├── server.js       # Main server file
│   └── ...
├── frontend/           # Vite + React frontend
│   ├── src/            # React components
│   └── ...
├── package.json        # Root package config
└── Dockerfile          # Docker configuration
```

## 🛠️ Tech Stack

- **Frontend**: React, Vite
- **Backend**: Node.js, Express
- **Styling**: Custom CSS

## 🌐 Live Demo

[comicnews.tranthachnguyen.com](https://comicnews.tranthachnguyen.com)

## 📄 License

© 2025 Tran Thach Nguyen. All rights reserved.
