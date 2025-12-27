# Pre-built deployment (build happens on Mac, not in container)
FROM node:20-alpine

WORKDIR /app

# Install Caddy and Node runtime dependencies
RUN apk add --no-cache caddy && \
    npm install express cors dotenv @google/genai ws

# Copy pre-built frontend and server
COPY dist ./dist
COPY server ./server

# Create Caddyfile for reverse proxy
RUN echo ':3000 {' > /etc/caddy/Caddyfile && \
    echo '    handle /ws {' >> /etc/caddy/Caddyfile && \
    echo '        reverse_proxy localhost:3001' >> /etc/caddy/Caddyfile && \
    echo '    }' >> /etc/caddy/Caddyfile && \
    echo '    handle /api/* {' >> /etc/caddy/Caddyfile && \
    echo '        reverse_proxy localhost:3002' >> /etc/caddy/Caddyfile && \
    echo '    }' >> /etc/caddy/Caddyfile && \
    echo '    handle {' >> /etc/caddy/Caddyfile && \
    echo '        root * /app/dist' >> /etc/caddy/Caddyfile && \
    echo '        try_files {path} /index.html' >> /etc/caddy/Caddyfile && \
    echo '        file_server' >> /etc/caddy/Caddyfile && \
    echo '    }' >> /etc/caddy/Caddyfile && \
    echo '}' >> /etc/caddy/Caddyfile

# Create startup script (websocket proxy + api server + caddy)
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'node /app/server/websocket-proxy.js &' >> /app/start.sh && \
    echo 'node /app/server/api-server.js &' >> /app/start.sh && \
    echo 'caddy run --config /etc/caddy/Caddyfile' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose ports: main (3000), websocket internal (3001), api internal (3002)
EXPOSE 3000 3001 3002

ENV GEMINI_API_KEY=""

CMD ["/bin/sh", "/app/start.sh"]
