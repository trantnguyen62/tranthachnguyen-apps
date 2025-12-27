# WebSocket proxy server only
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev && npm install ws dotenv @google/genai
COPY server/websocket-proxy.js server/logger.js ./server/
EXPOSE 3001
CMD ["node", "server/websocket-proxy.js"]
