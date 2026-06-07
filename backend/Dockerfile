# Optional Docker setup for the backend
FROM node:20-slim

# sharp needs libvips at runtime on slim images
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY prisma ./prisma
RUN npx prisma generate
COPY . .

ENV NODE_ENV=production
EXPOSE 5000
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
