# Stage 1: Build React App
FROM node:20-alpine AS build
WORKDIR /app

# Copy dependency files
COPY package*.json ./
RUN npm ci

# Copy source code & build
COPY . .

# Inject VITE_API_URL at build time (default points to Gateway)
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}}

RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine AS runtime

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
