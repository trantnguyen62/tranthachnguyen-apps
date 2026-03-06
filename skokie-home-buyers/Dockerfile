# Skokie Home Buyers with Express backend
FROM node:20-alpine
WORKDIR /app

# Copy backend package.json and install dependencies
COPY backend/package.json ./backend/
WORKDIR /app/backend
RUN npm install

# Copy all backend JS files
COPY backend/*.js ./

# Copy frontend files
WORKDIR /app
COPY index.html ./
COPY styles.css ./
COPY script.js ./
COPY admin.html ./
COPY assets ./assets

# Set environment variables (can be overridden at runtime)
ENV PORT=80
ENV NODE_ENV=production

EXPOSE 80

# Start the Express server
WORKDIR /app/backend
CMD ["node", "server.js"]
