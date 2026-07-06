FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
ARG VITE_API_BASE=http://localhost:8080
ENV VITE_API_BASE=$VITE_API_BASE
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.output /app/.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
