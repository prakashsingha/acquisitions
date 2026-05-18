# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app

COPY package.json package-lock.json ./

# Development image (includes devDependencies for migrations, drizzle-kit, etc.)
FROM base AS development
RUN npm ci
COPY . .
RUN mkdir -p logs
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Production image (lean runtime only)
FROM base AS production
RUN npm ci --omit=dev && npm cache clean --force
COPY . .
RUN mkdir -p logs
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs
RUN chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3000
CMD ["npm", "run", "start"]
