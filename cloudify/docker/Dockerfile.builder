# Lightweight build container for Cloudify
# Used to run npm install and npm build in isolation

FROM node:20-alpine

# Install git for cloning repos and other build tools
RUN apk add --no-cache \
    git \
    openssh-client \
    curl

# Set working directory
WORKDIR /build

# Default entrypoint that accepts shell commands
ENTRYPOINT ["/bin/sh", "-c"]
