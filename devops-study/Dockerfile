FROM node:20-alpine
RUN npm install -g serve
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY index.html styles.min.css app.min.js privacy.html serve.json ./
RUN chown -R app:app /app
USER app
EXPOSE 80
CMD ["serve", "-s", ".", "-l", "80"]
