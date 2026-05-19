FROM node:20-alpine
WORKDIR /app

# Install dependencies (all — devDeps needed for TS build + prisma CLI)
COPY package*.json ./
RUN npm ci

# Copy Prisma config and schema first (needed by prisma generate)
COPY prisma.config.ts ./
COPY prisma/ ./prisma/

# Copy source and build (prisma generate && tsc)
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

EXPOSE 3000

# Apply pending migrations, then start
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/index.js"]
