# Alpine keeps the image small (~50 MB) and reduces the attack surface.
FROM node:20-alpine

# 'serve' is the static file server used in production.
RUN npm install -g serve

# Run as a non-root user to limit damage if the process is compromised.
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Only copy the production-ready minified assets and config — no source files.
COPY index.html styles.min.css app.min.js privacy.html serve.json ./

RUN chown -R app:app /app
USER app

EXPOSE 80

# -s  SPA mode: unknown paths redirect to index.html instead of returning 404.
# -l  Port to listen on inside the container (mapped by `docker run -p`).
CMD ["serve", "-s", ".", "-l", "80"]
