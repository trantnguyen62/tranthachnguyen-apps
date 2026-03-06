# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy server code
COPY server ./server

# Copy built frontend from previous stage
COPY --from=frontend-build /app/dist ./dist

# Copy public folder for article images
COPY public ./public

# Create necessary directories
RUN mkdir -p server/db public/uploads

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "server/server.js"]
