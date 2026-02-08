# ============================================
# Stage 1: Build (npm ile derleme)
# ============================================
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG CACHEBUST=1
RUN npm run build

# ============================================
# Stage 2: Serve (Nginx ile static dosya sun)
# ============================================
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
