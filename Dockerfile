# ==========================================
# STAGE 1: Build the Angular UI
# ==========================================
FROM node:bookworm-slim AS ui-build
WORKDIR /app/backoffice
COPY backoffice/package*.json ./
RUN npm install
COPY backoffice/ ./
# This compiles your Angular app into static files
RUN npm run build --configuration=production

# ==========================================
# STAGE 2: Build the Node.js Backend & Combine
# ==========================================
FROM node:bookworm-slim
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
# Compile TypeScript to JavaScript
RUN npm run build

# Install production dependencies only (remove devDependencies)
RUN npm install --production

# Copy the compiled Angular files from Stage 1 into a "public" folder in the backend
# IMPORTANT: Check your angular.json "outputPath". It is usually dist/backoffice/browser or just dist/backoffice
COPY --from=ui-build /app/backoffice/dist/backoffice ./public

EXPOSE 3000
CMD ["npm", "start"]