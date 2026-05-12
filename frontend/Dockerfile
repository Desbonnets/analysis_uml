FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./
# npm ci fails on cross-platform lock files (Windows lock file missing Linux-only
# optional deps like @emnapi/core required by @tailwindcss/oxide-wasm32-wasi).
# npm install respects the lock file versions without the strict sync check.
RUN npm install

# ── Dev stage: Vite dev server with HMR ──────────────────────────────
FROM base AS dev
COPY . .
EXPOSE 5173
CMD ["npx", "vite", "--host"]

# ── Production stage: static build served by Nginx ───────────────────
FROM base AS builder
COPY . .
RUN npm run build

FROM nginx:alpine AS prod
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
