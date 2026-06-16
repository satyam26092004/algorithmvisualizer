# Stage 1: Build React static assets
FROM node:22-alpine AS build

WORKDIR /app

# Copy package management files
COPY package*.json ./

# Install npm dependencies
RUN npm ci

# Copy project source and configuration
COPY . .

# Build Vite application for production
RUN npm run build

# Stage 2: Serve React assets using Nginx
FROM nginx:alpine

# Copy built assets from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for traffic
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
