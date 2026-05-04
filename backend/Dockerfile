FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

CMD ["sh", "-c", "node_modules/.bin/node-pg-migrate up && node src/index.js"]
