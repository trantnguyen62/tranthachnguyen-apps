# Static landing page served by Node serve
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve && \
    addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --chown=appuser:appgroup index.html ./
COPY --chown=appuser:appgroup robots.txt ./
COPY --chown=appuser:appgroup sitemap.xml ./
USER appuser
EXPOSE 3000
CMD ["serve", "-s", ".", "-l", "3000"]
