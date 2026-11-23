FROM node:24-alpine AS base
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY package.json ./
COPY shared ./shared
COPY task8_redis_queue_cache_cognitive ./task8_redis_queue_cache_cognitive
WORKDIR /app/task8_redis_queue_cache_cognitive
RUN npm install --omit=dev
USER appuser
EXPOSE 3008
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3008/health || exit 1
CMD ["node", "server.js"]
