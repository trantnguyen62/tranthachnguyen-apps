# Static landing page served by Node `serve`
# `serve` is a zero-config static file server that also applies the header
# rules defined in serve.json (cache control, CSP, security headers).
FROM node:20-alpine
WORKDIR /app
# Create a non-root user so the container process cannot write to the host
# filesystem or escalate privileges if the process is ever compromised.
RUN npm install -g serve && \
    addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --chown=appuser:appgroup index.html ./
COPY --chown=appuser:appgroup styles.css ./
COPY --chown=appuser:appgroup robots.txt ./
COPY --chown=appuser:appgroup sitemap.xml ./
COPY --chown=appuser:appgroup serve.json ./
COPY --chown=appuser:appgroup fonts/ ./fonts/
USER appuser
EXPOSE 80
CMD ["serve", "-s", ".", "-l", "80"]
