# Pre-built Comic News (build happens on Mac, not in container)
FROM node:20-alpine
WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy pre-built frontend and backend code
COPY frontend/dist ./dist
COPY backend/server.js ./server.js
COPY backend/images ./images

EXPOSE 5187
CMD ["node", "server.js"]
