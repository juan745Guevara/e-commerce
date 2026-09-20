# syntax=docker/dockerfile:1

FROM node:24-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl libc6-compat

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
RUN npx prisma generate

COPY . .
RUN npm run build

FROM builder AS pruned
RUN npm prune --omit=dev

FROM node:24-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat \
  && mkdir -p /data/wa-auth

ENV NODE_ENV=production
ENV WHATSAPP_SESSION_PATH=/data/wa-auth

COPY --from=pruned /app/node_modules ./node_modules
COPY --from=pruned /app/dist ./dist
COPY --from=pruned /app/package.json ./
COPY --from=pruned /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/main.js"]
