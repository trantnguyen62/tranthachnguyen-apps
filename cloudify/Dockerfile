# Build stage - Use full Debian for better compatibility
FROM node:20 AS builder

# Run as root to avoid permission issues
USER root
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files for layer caching
COPY package*.json ./

# Copy Prisma schema first (needed for prisma generate)
COPY prisma ./prisma

# Install dependencies and generate Prisma client
RUN npm ci

# Copy source files
COPY . .

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production stage - Use Debian-slim for Prisma compatibility
FROM node:20-slim AS runner

# Labels for container metadata
LABEL org.opencontainers.image.title="Cloudify"
LABEL org.opencontainers.image.description="Deployment platform for static sites and web apps"
LABEL org.opencontainers.image.vendor="tranthachnguyen.com"
LABEL org.opencontainers.image.source="https://github.com/tranthachnguyen/cloudify"

WORKDIR /app

# Install runtime dependencies, build tools, and security updates
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    curl \
    dumb-init \
    git \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /tmp/*

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
    CMD curl -f http://localhost:3000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
