FROM node:20-alpine AS asset-optimizer
RUN apk add --no-cache imagemagick
WORKDIR /assets
COPY assets/ ./
# Ship sprites displayed at 80px — 160×160 is sufficient for 2× HiDPI displays
# Background covers full viewport but is dimmed at 0.5 alpha and upscaled anyway; 900×900 is fine
RUN convert player_ship.png  -resize 160x160  -strip player_ship.png  && \
    convert enemy_ship.png   -resize 160x160  -strip enemy_ship.png   && \
    convert menu_icon.png    -resize 128x128  -strip menu_icon.png    && \
    convert background.png   -resize 900x900  -strip background.png

FROM node:20-alpine
RUN npm install -g serve@14.2.6
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
WORKDIR /app
COPY index.html styles.css game.js manifest.json robots.txt sitemap.xml ./
COPY --from=asset-optimizer /assets ./assets/

# Create serve config with caching and security headers
RUN cat > serve.json << 'SERVEJSON'
{
  "headers": [
    {
      "source": "**",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Content-Security-Policy", "value": "default-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Resource-Policy", "value": "same-origin" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" }
      ]
    },
    { "source": "**/*.css",  "headers": [{ "key": "Cache-Control", "value": "no-cache, must-revalidate" }] },
    { "source": "**/*.js",   "headers": [{ "key": "Cache-Control", "value": "no-cache, must-revalidate" }] },
    { "source": "**/*.html", "headers": [{ "key": "Cache-Control", "value": "no-cache, must-revalidate" }] },
    { "source": "**/*.png",  "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }
  ]
}
SERVEJSON
RUN chown -R appuser:appgroup /app

USER appuser
EXPOSE 80
CMD ["serve", "-s", ".", "-l", "80", "-c", "serve.json"]
