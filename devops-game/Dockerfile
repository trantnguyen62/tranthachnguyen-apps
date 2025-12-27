FROM node:20-alpine
RUN npm install -g serve
WORKDIR /app
COPY index.html styles.css game.js ./
EXPOSE 80
CMD ["serve", "-s", ".", "-l", "80", "--cors"]
