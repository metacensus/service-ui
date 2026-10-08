# syntax=docker/dockerfile:1

# --- Build stage: compile the Vite SPA to static assets in /app/dist ---
# Pin to the native build platform ($BUILDPLATFORM), NOT the target arch: the
# output is static files (architecture-independent), so there's no reason to run
# the Node/esbuild build under QEMU emulation for each target — esbuild's Go
# binary crashes under emulation ("lfstack.push"), and it would be needlessly
# slow. Only the Caddy runtime stage below varies per target architecture.
FROM --platform=$BUILDPLATFORM node:26-alpine AS builder
WORKDIR /app

# Install dependencies against the committed lockfile for reproducible builds.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# The SPA calls the API with relative /metacensus/* paths and lets whatever
RUN npm run build

# --- Runner stage: host the static bundle with Caddy (no routing, no API proxy) ---
# Caddy is used here as a prebuilt static-file host, not an edge/reverse-proxy:
# it serves /srv and rewrites unknown paths to index.html so TanStack Router's
# client-side routing works on deep links/refreshes. Routing /metacensus/* to
# the API is the consumer's edge concern, deliberately not baked into this image.
FROM caddy:2-alpine AS runner
COPY --from=builder /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 8080
