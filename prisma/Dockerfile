FROM node:22-alpine
RUN apk add --no-cache python3 make g++

WORKDIR /app
# Build context is the repo root so manifests can be baked in alongside the prisma scripts.
COPY prisma/package*.json ./
RUN npm install

COPY prisma/ ./prisma/
# Capability manifests committed at build time — seed-catalog.ts reads from this path.
COPY ESP32Code/tools/manifest-gen/out/ ./ESP32Code/tools/manifest-gen/out/

RUN mkdir -p /app/backend/node_modules

CMD ["sh", "-c", "cd /app/prisma && export PATH=/app/node_modules/.bin:$PATH && prisma migrate deploy && prisma db seed && ts-node seed-catalog.ts"]
