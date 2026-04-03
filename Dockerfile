FROM node:20-alpine

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

ENV PORT=3000
EXPOSE 3000

CMD ["node_modules/.bin/next", "start", "-p", "3000", "-H", "0.0.0.0"]
