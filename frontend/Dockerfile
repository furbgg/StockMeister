# ============================================
# Stage 1: Build
# ============================================
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV VITE_UPLOADS_BASE=https://stockmeister-production.up.railway.app
RUN npm run build

# ============================================
# Stage 2: Serve
# ============================================
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
