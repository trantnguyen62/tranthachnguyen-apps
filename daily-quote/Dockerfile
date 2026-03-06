FROM node:20-alpine
RUN npm install -g serve
WORKDIR /app
COPY . .
EXPOSE 80
CMD ["serve", "-s", ".", "-l", "80", "--cors"]
