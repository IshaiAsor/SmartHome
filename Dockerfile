# ==========================================
# STAGE 1: Build the Angular UI
# ==========================================
FROM --platform=$BUILDPLATFORM node:20-alpine AS ui-build
WORKDIR /app/backoffice
COPY backoffice/package*.json ./
RUN npm install
COPY backoffice/ ./
# This compiles your Angular app into static files
RUN npm run build --configuration=production

# ==========================================
# STAGE 2: Build the Node.js Backend & Combine
# ==========================================
FROM --platform=$BUILDPLATFORM node:20-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

# Copy the compiled Angular files from Stage 1 into a "public" folder in the backend
# IMPORTANT: Check your angular.json "outputPath". It is usually dist/backoffice/browser or just dist/backoffice
COPY --from=ui-build /app/backoffice/dist/backoffice ./public

EXPOSE 3000
CMD ["node", "server.js"]