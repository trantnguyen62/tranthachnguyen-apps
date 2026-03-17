# The frontend is built on the host (npm run build inside frontend/) before the
# image is assembled, so the container only needs to run the Express server.
# This keeps the image small — no build tools, no dev deps, no source files.
FROM node:20-alpine
WORKDIR /app

# Install production backend dependencies only
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy pre-built frontend bundle and backend runtime files
COPY frontend/dist ./dist
COPY backend/server.js ./server.js
COPY backend/images ./images

EXPOSE 5187
# Run as non-root for container security best practice
USER node
CMD ["node", "server.js"]
