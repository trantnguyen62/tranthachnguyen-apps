# =============================================================================
# Stage 1: Dependencies - Cached separately for faster rebuilds
# =============================================================================
FROM node:20.11-slim AS deps

WORKDIR /app

# Install build dependencies needed for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy only package files and Prisma schema for dependency layer caching
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies (this layer is cached unless package*.json changes)
RUN npm ci --ignore-scripts \
    && npx prisma generate

# =============================================================================
# Stage 2: Builder - Compiles the Next.js application
# =============================================================================
FROM node:20.11-slim AS builder

WORKDIR /app

# Install openssl (needed for Prisma at build time)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy cached node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy source files (respects .dockerignore)
COPY . .

# Build the application with telemetry disabled
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# =============================================================================
# Stage 3: Runner - Minimal production image
# =============================================================================
FROM node:20.11-slim AS runner

# Labels for container metadata
LABEL org.opencontainers.image.title="Cloudify"
LABEL org.opencontainers.image.description="Deployment platform for static sites and web apps"
LABEL org.opencontainers.image.vendor="tranthachnguyen.com"
LABEL org.opencontainers.image.source="https://github.com/tranthachnguyen/cloudify"

WORKDIR /app

# Install only runtime dependencies and apply security updates in a single layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    curl \
    dumb-init \
    git \
    && apt-get upgrade -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Create non-root user for security
RUN groupadd --gid 1001 nodejs \
    && useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy built files with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma client and schema for runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Create data directories
RUN mkdir -p /data/repos /data/builds /data/certs \
    && chown -R nextjs:nodejs /data

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health/live || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
