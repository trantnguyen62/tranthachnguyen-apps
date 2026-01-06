# Pre-built deployment (build happens on Mac, not in container)
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies
RUN npm install -g serve && \
    npm install express cors dotenv @google/genai

# Copy pre-built frontend and server
COPY dist ./dist
COPY server ./server

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'node /app/server/proxy.js &' >> /app/start.sh && \
    echo 'serve -s /app/dist -l 5173' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 5173 5174

ENV GEMINI_API_KEY=""

CMD ["/bin/sh", "/app/start.sh"]
