FROM node:20-alpine
RUN npm install -g serve
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
WORKDIR /app
COPY index.html styles.css game.js ./
COPY assets/ ./assets/

# Create serve config with caching and security headers
RUN cat > serve.json << 'SERVEJSON'
{
  "headers": [
    {
      "source": "**",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Content-Security-Policy", "value": "default-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self'; frame-ancestors 'none'" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    { "source": "**/*.css",  "headers": [{ "key": "Cache-Control", "value": "no-cache, must-revalidate" }] },
    { "source": "**/*.js",   "headers": [{ "key": "Cache-Control", "value": "no-cache, must-revalidate" }] },
    { "source": "**/*.html", "headers": [{ "key": "Cache-Control", "value": "no-cache, must-revalidate" }] }
  ]
}
SERVEJSON
RUN chown -R appuser:appgroup /app

USER appuser
EXPOSE 80
CMD ["serve", "-s", ".", "-l", "80", "--cors", "-c", "serve.json"]
