# Pre-built deployment (build happens on Mac, not in container)
FROM node:20-alpine
WORKDIR /app

# Install runtime dependencies
RUN npm install express cors dotenv @google/genai

# Copy pre-built files
COPY dist ./dist
COPY server ./server
COPY public ./public

EXPOSE 5185
CMD ["node", "server/passport-proxy.js"]
