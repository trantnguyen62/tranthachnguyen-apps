# Pre-built static frontend served by Node serve
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY dist ./dist
COPY public ./dist
EXPOSE 80
CMD ["serve", "-s", "dist", "-l", "80"]
