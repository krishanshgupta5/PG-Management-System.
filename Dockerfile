# Stage 1: Build the frontend React + Vite app
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve the app with Node.js backend
FROM node:20-alpine AS runner
WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN npm install --prefix backend --only=production

# Copy backend codebase
COPY backend/ ./backend/

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose backend port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the unified Express server
CMD ["node", "backend/server.js"]
