# Static landing page served by Node serve
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY index.html ./
COPY styles.css ./
COPY robots.txt ./
COPY sitemap.xml ./
EXPOSE 80
CMD ["serve", "-s", ".", "-l", "80"]
