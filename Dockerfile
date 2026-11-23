FROM node:24-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY . .
RUN npm install --omit=dev
USER appuser
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "gateway/server.js"]
