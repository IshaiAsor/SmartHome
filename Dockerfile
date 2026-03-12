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
RUN npm run build

# Install production dependencies only
RUN npm install --production

# FIX: Copy Angular files into the DIST folder where the compiled JS lives
# This ensures path.join(__dirname, 'public') actually works.
COPY --from=ui-build /app/backoffice/dist/backoffice/browser ./dist/public

# If your Angular version is older and doesn't have the /browser suffix, use:
# COPY --from=ui-build /app/backoffice/dist/backoffice ./dist/public

EXPOSE 3000
CMD ["node", "dist/index.js"]