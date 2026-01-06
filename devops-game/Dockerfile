FROM node:20-alpine
RUN npm install -g serve
WORKDIR /app
COPY index.html styles.css game.js ./
COPY assets/ ./assets/

# Create serve config to disable caching for CSS/JS
RUN echo '{ "headers": [{ "source": "**/*.css", "headers": [{ "key": "Cache-Control", "value": "no-cache, must-revalidate" }] }, { "source": "**/*.js", "headers": [{ "key": "Cache-Control", "value": "no-cache, must-revalidate" }] }, { "source": "**/*.html", "headers": [{ "key": "Cache-Control", "value": "no-cache, must-revalidate" }] }] }' > serve.json

EXPOSE 80
CMD ["serve", "-s", ".", "-l", "80", "--cors", "-c", "serve.json"]
