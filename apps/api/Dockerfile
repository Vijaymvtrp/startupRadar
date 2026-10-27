# Multi-stage production build for NestJS backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configs
COPY package*.json tsconfig*.json ./
COPY packages/ packages/
COPY apps/api/ apps/api/

# Install dependencies and build shared packages & api
RUN npm install
RUN npm --prefix packages/shared-types run build
RUN npm --prefix apps/api run build

# Production runner image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY package*.json ./
COPY packages/shared-types/package*.json packages/shared-types/
COPY packages/shared-types/dist packages/shared-types/dist
COPY apps/api/package*.json apps/api/
COPY apps/api/prisma apps/api/prisma

RUN npm install --omit=dev
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 4000

CMD ["node", "apps/api/dist/main.js"]
