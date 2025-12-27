/* =====================================================
   DevOps Mastery - Application Logic
   ===================================================== */

// DevOps Study Data
const devopsData = {
    topics: [
        {
            id: 'docker',
            name: 'Docker',
            icon: '🐳',
            color: '#0db7ed',
            flashcards: [
                { term: 'Container', definition: 'A lightweight, standalone, executable package that includes everything needed to run a piece of software: code, runtime, system tools, libraries, and settings.' },
                { term: 'Docker Image', definition: 'A read-only template with instructions for creating a Docker container. Images are built from Dockerfiles and can be shared via registries.' },
                { term: 'Dockerfile', definition: 'A text file containing instructions to build a Docker image. It defines the base image, dependencies, and commands to run.' },
                { term: 'Docker Compose', definition: 'A tool for defining and running multi-container Docker applications using a YAML file to configure services, networks, and volumes.' },
                { term: 'Docker Hub', definition: 'A cloud-based registry service for storing, sharing, and distributing Docker images. It hosts both public and private repositories.' },
                { term: 'Docker Volume', definition: 'A mechanism for persisting data generated and used by Docker containers. Volumes are stored outside the container filesystem.' },
                { term: 'Docker Network', definition: 'A virtual network that allows containers to communicate with each other and external networks in isolated or connected configurations.' },
                { term: 'Docker Swarm', definition: 'Docker\'s native clustering and orchestration solution for managing a cluster of Docker engines as a single virtual system.' },
                { term: 'Container Registry', definition: 'A repository for storing and distributing container images. Examples include Docker Hub, Amazon ECR, and Google Container Registry.' },
                { term: 'Multi-stage Build', definition: 'A Dockerfile technique using multiple FROM statements to create smaller, more efficient final images by copying only necessary artifacts.' },
                { term: 'Docker Layer', definition: 'Each instruction in a Dockerfile creates a layer. Layers are cached and reused to speed up builds and reduce storage.' },
                { term: 'Entrypoint vs CMD', definition: 'ENTRYPOINT sets the main executable; CMD provides default arguments. ENTRYPOINT is harder to override than CMD.' },
                { term: 'Docker Context', definition: 'The set of files and directories sent to the Docker daemon when building an image. Optimizing context size improves build performance.' },
                { term: 'Docker Buildx', definition: 'An extended build command that supports multi-platform builds, build caching, and other advanced features.' },
                { term: 'Container Runtime', definition: 'The software responsible for running containers. Docker uses containerd as its default runtime, which manages container lifecycle.' },
                { term: 'Docker Healthcheck', definition: 'A Dockerfile instruction that tells Docker how to test a container to check that it is still working properly.' },
                { term: 'Docker Secrets', definition: 'A secure way to pass sensitive data to containers in Swarm mode, stored encrypted until needed by a service.' },
                { term: 'Docker Overlay Network', definition: 'A distributed network that enables communication between containers running on different Docker hosts.' },
                { term: 'containerd', definition: 'An industry-standard container runtime that manages the complete container lifecycle including image transfer, storage, and execution.' },
                { term: 'Docker Desktop', definition: 'An application for Mac and Windows that provides a Docker development environment with built-in Kubernetes.' },
                { term: 'Docker Engine', definition: 'The core technology that creates and runs containers. Consists of a server daemon, REST API, and CLI client.' },
                { term: 'Docker Scout', definition: 'A security tool that analyzes container images for vulnerabilities and provides remediation recommendations.' },
                { term: 'Docker Init', definition: 'A command that helps bootstrap a project with Docker by generating Dockerfile, compose.yaml, and .dockerignore files.' },
                { term: 'COPY vs ADD', definition: 'COPY only copies local files; ADD can also extract archives and download URLs. COPY is preferred for simplicity.' },
                { term: 'Docker Daemon', definition: 'The background service (dockerd) that manages Docker objects like images, containers, networks, and volumes.' },
                { term: 'Bridge Network', definition: 'The default network driver that creates a private internal network on the host for containers to communicate.' },
                { term: 'Host Network', definition: 'A network mode where the container shares the host\'s networking namespace, using the host\'s IP directly.' },
                { term: 'None Network', definition: 'A network mode that disables all networking for a container, providing complete network isolation.' },
                { term: 'Docker Restart Policy', definition: 'Controls whether containers automatically restart when they exit or when Docker daemon restarts. Options: no, on-failure, always, unless-stopped.' },
                { term: 'Docker Logs', definition: 'Commands and drivers for viewing and managing container output. Supports various logging drivers like json-file, syslog, fluentd.' },
                { term: 'Docker Stats', definition: 'Displays real-time resource usage statistics for containers including CPU, memory, network I/O, and block I/O.' },
                { term: 'Docker Tag', definition: 'A label applied to an image to identify different versions. Format: registry/repository:tag.' },
                { term: 'Docker Push', definition: 'Uploads a local image to a remote registry, sharing it for deployment or with other users.' },
                { term: 'Docker Pull', definition: 'Downloads an image from a registry to the local machine for use in creating containers.' },
                { term: 'Docker Commit', definition: 'Creates a new image from a container\'s changes. Useful for debugging but Dockerfiles are preferred for reproducibility.' },
                { term: 'Docker Save/Load', definition: 'Save exports an image to a tar archive; Load imports it back. Used for offline image transfer.' },
                { term: 'Docker Export/Import', definition: 'Export creates a tarball of container filesystem; Import creates an image from it. Flattens layers.' },
                { term: '.dockerignore', definition: 'A file listing patterns of files and directories to exclude from the build context, reducing build time and image size.' },
                { term: 'ARG Instruction', definition: 'Defines build-time variables that can be passed with --build-arg. Not available in running container.' },
                { term: 'ENV Instruction', definition: 'Sets environment variables that persist in the image and are available to running containers.' },
                { term: 'WORKDIR Instruction', definition: 'Sets the working directory for subsequent RUN, CMD, ENTRYPOINT, COPY, and ADD instructions.' },
                { term: 'EXPOSE Instruction', definition: 'Documents which ports the container listens on. Does not actually publish ports; use -p flag for that.' },
                { term: 'USER Instruction', definition: 'Sets the user and optionally the group to use when running the image and for subsequent instructions.' },
                { term: 'LABEL Instruction', definition: 'Adds metadata to an image as key-value pairs, useful for organization, licensing, and automation.' },
                { term: 'SHELL Instruction', definition: 'Overrides the default shell used for the shell form of commands in Dockerfile.' },
                { term: 'STOPSIGNAL Instruction', definition: 'Sets the system call signal that will be sent to the container to exit, default is SIGTERM.' },
                { term: 'ONBUILD Instruction', definition: 'Adds trigger instructions to an image that execute when the image is used as a base for another build.' },
                { term: 'Docker Prune', definition: 'Commands to remove unused data: docker system prune, docker image prune, docker container prune, docker volume prune.' },
                { term: 'Docker Manifest', definition: 'A list of images for different platforms. Enables pulling the correct image for the host architecture automatically.' },
                { term: 'Docker Content Trust', definition: 'A security feature that uses digital signatures to verify the integrity and publisher of Docker images.' },
                { term: 'Docker Bench', definition: 'A security script that checks for common best-practices around deploying Docker containers in production.' },
                { term: 'Bind Mount', definition: 'Mounts a file or directory from the host machine into a container. Changes are reflected bidirectionally.' },
                { term: 'tmpfs Mount', definition: 'A temporary filesystem mount stored in host memory only. Data is lost when container stops.' },
                { term: 'Named Volume', definition: 'A Docker-managed volume with a specific name, easier to reference and manage than anonymous volumes.' },
                { term: 'Anonymous Volume', definition: 'A volume without a specified name, automatically created and harder to reference after container removal.' },
                { term: 'Docker Build Cache', definition: 'Mechanism that reuses unchanged layers from previous builds to speed up subsequent builds.' },
                { term: 'BuildKit', definition: 'A modern build subsystem with parallel build stages, better caching, and new Dockerfile features.' },
                { term: 'Docker Scan', definition: 'Scans local images for vulnerabilities using Snyk, providing a CVE report and remediation advice.' },
                { term: 'Docker Extensions', definition: 'Third-party tools that add functionality to Docker Desktop, accessible through the Extensions Marketplace.' },
                { term: 'Docker Contexts', definition: 'Named configurations that contain information about Docker endpoints, allowing switching between different Docker hosts.' },
                { term: 'Docker Checkpoint', definition: 'Experimental feature to save the state of a running container for later restoration (using CRIU).' },
                { term: 'Resource Constraints', definition: 'Limits for CPU, memory, and other resources that can be set on containers to prevent resource exhaustion.' },
                { term: 'Rootless Mode', definition: 'Running Docker daemon and containers without root privileges for enhanced security.' },
                { term: 'Docker Plugins', definition: 'Extensions that add capabilities like network drivers, volume drivers, or authorization to Docker.' },
                { term: 'Docker API', definition: 'RESTful API that allows programmatic interaction with the Docker daemon for automation and tooling.' },
                { term: 'Docker SDK', definition: 'Libraries for interacting with the Docker API in various programming languages like Python and Go.' },
                { term: 'Docker in Docker (DinD)', definition: 'Running Docker inside a Docker container, commonly used in CI/CD pipelines for building images.' },
                { term: 'Docker Socket', definition: 'Unix socket at /var/run/docker.sock that allows communication with the Docker daemon.' },
                { term: 'Docker Proxy', definition: 'Built-in proxy that handles port forwarding from host to containers for published ports.' },
                { term: 'Scratch Image', definition: 'An explicitly empty image, useful as a base for creating minimal images containing only your application.' },
                { term: 'Alpine Linux', definition: 'A minimal Linux distribution popular as a Docker base image due to its small size (~5MB).' },
                { term: 'Distroless Images', definition: 'Container images that contain only the application and its runtime dependencies, without a shell or package manager.' },
                { term: 'Image Digest', definition: 'A SHA256 hash that uniquely identifies an image, more precise than tags which can be moved.' },
                { term: 'Docker Attach', definition: 'Connects to a running container\'s standard input, output, and error streams.' },
                { term: 'Docker Wait', definition: 'Blocks until a container stops, then prints its exit code. Useful in scripts.' },
                { term: 'Docker Top', definition: 'Displays the running processes inside a container, similar to the Linux top command.' },
                { term: 'Docker Diff', definition: 'Shows changes made to the container\'s filesystem compared to its image.' },
                { term: 'Docker History', definition: 'Shows the history of an image including each layer, its size, and the command that created it.' },
                { term: 'Docker Events', definition: 'Streams real-time events from the Docker daemon, useful for monitoring and automation.' },
                { term: 'Docker Port', definition: 'Lists port mappings for a container, showing which host ports map to container ports.' },
                { term: 'Docker Rename', definition: 'Changes the name of an existing container without affecting its configuration.' },
                { term: 'Docker Update', definition: 'Dynamically updates container resource limits without stopping it.' },
                { term: 'Docker Pause/Unpause', definition: 'Suspends and resumes all processes in a container using cgroups freezer.' },
                { term: 'Docker Kill', definition: 'Sends a signal (default SIGKILL) to a container\'s main process, immediately stopping it.' },
                { term: 'Docker Stop', definition: 'Gracefully stops a container by sending SIGTERM, then SIGKILL after timeout.' },
                { term: 'OCI Standard', definition: 'Open Container Initiative - industry standards for container runtime and image format.' },
                { term: 'Podman', definition: 'A daemonless container engine compatible with Docker commands, uses fork/exec model instead.' },
                { term: 'Docker Machine', definition: 'Legacy tool for provisioning Docker hosts on virtual machines, now largely replaced by Docker Desktop.' }
            ],
            commands: [
                { command: 'docker build -t myapp .', description: 'Build an image from Dockerfile' },
                { command: 'docker run -d -p 8080:80 myapp', description: 'Run container in background with port mapping' },
                { command: 'docker ps -a', description: 'List all containers (running and stopped)' },
                { command: 'docker logs -f container_id', description: 'Follow container logs in real-time' },
                { command: 'docker exec -it container_id bash', description: 'Execute interactive bash in container' },
                { command: 'docker-compose up -d', description: 'Start all services in background' },
                { command: 'docker system prune -a', description: 'Remove all unused images and containers' },
                { command: 'docker inspect container_id', description: 'View detailed container information' },
                { command: 'docker network create mynetwork', description: 'Create a custom network' },
                { command: 'docker volume ls', description: 'List all volumes' },
                { command: 'docker images', description: 'List all local images' },
                { command: 'docker rmi image_id', description: 'Remove an image' },
                { command: 'docker rm container_id', description: 'Remove a stopped container' },
                { command: 'docker stop $(docker ps -q)', description: 'Stop all running containers' },
                { command: 'docker pull nginx:latest', description: 'Download an image from registry' },
                { command: 'docker push myrepo/myapp:v1', description: 'Upload image to registry' },
                { command: 'docker tag myapp myrepo/myapp:v1', description: 'Tag an image for pushing' },
                { command: 'docker login', description: 'Authenticate with Docker registry' },
                { command: 'docker cp file.txt container:/path/', description: 'Copy files to/from container' },
                { command: 'docker stats', description: 'Show live resource usage of containers' },
                { command: 'docker top container_id', description: 'Display running processes in container' },
                { command: 'docker diff container_id', description: 'Show filesystem changes in container' },
                { command: 'docker history image_id', description: 'Show image layer history' },
                { command: 'docker save -o myapp.tar myapp', description: 'Export image to tar file' },
                { command: 'docker load -i myapp.tar', description: 'Import image from tar file' },
                { command: 'docker export container > fs.tar', description: 'Export container filesystem' },
                { command: 'docker import fs.tar newimage', description: 'Create image from tarball' },
                { command: 'docker run --rm -it alpine sh', description: 'Run interactive container and remove on exit' },
                { command: 'docker run -v /host/path:/container/path', description: 'Mount host directory as volume' },
                { command: 'docker run --name mycontainer nginx', description: 'Run container with specific name' },
                { command: 'docker run -e VAR=value myapp', description: 'Set environment variable' },
                { command: 'docker run --env-file .env myapp', description: 'Load environment from file' },
                { command: 'docker run --network mynetwork myapp', description: 'Connect container to network' },
                { command: 'docker run --restart always myapp', description: 'Set restart policy' },
                { command: 'docker run --memory 512m myapp', description: 'Limit container memory' },
                { command: 'docker run --cpus 0.5 myapp', description: 'Limit CPU usage' },
                { command: 'docker network ls', description: 'List all networks' },
                { command: 'docker network inspect bridge', description: 'View network details' },
                { command: 'docker network connect net1 container', description: 'Connect container to network' },
                { command: 'docker network disconnect net1 container', description: 'Disconnect from network' },
                { command: 'docker volume create myvolume', description: 'Create a named volume' },
                { command: 'docker volume rm myvolume', description: 'Remove a volume' },
                { command: 'docker volume inspect myvolume', description: 'View volume details' },
                { command: 'docker-compose down -v', description: 'Stop and remove containers, networks, volumes' },
                { command: 'docker-compose logs -f', description: 'Follow logs of all services' },
                { command: 'docker-compose build --no-cache', description: 'Rebuild without using cache' },
                { command: 'docker-compose exec service bash', description: 'Run command in service container' },
                { command: 'docker-compose ps', description: 'List containers for project' },
                { command: 'docker buildx build --platform linux/amd64,linux/arm64 -t myapp .', description: 'Multi-platform build' },
                { command: 'docker scan myapp', description: 'Scan image for vulnerabilities' }
            ],
            quiz: [
                { question: 'What is the main purpose of a Dockerfile?', options: ['To run containers', 'To define instructions for building an image', 'To manage container networks', 'To store container data'], correct: 1 },
                { question: 'Which command is used to build a Docker image?', options: ['docker run', 'docker build', 'docker create', 'docker start'], correct: 1 },
                { question: 'What does Docker Compose primarily help with?', options: ['Building single containers', 'Managing multi-container applications', 'Storing images', 'Monitoring containers'], correct: 1 },
                { question: 'Where is data stored when using Docker volumes?', options: ['Inside the container', 'In the image layers', 'Outside the container filesystem', 'In Docker Hub'], correct: 2 },
                { question: 'What is a multi-stage build used for?', options: ['Running multiple containers', 'Creating smaller final images', 'Managing multiple registries', 'Building on multiple platforms'], correct: 1 },
                { question: 'Which is Docker\'s native orchestration tool?', options: ['Kubernetes', 'Docker Swarm', 'Mesos', 'Nomad'], correct: 1 },
                { question: 'What does the -d flag do in docker run?', options: ['Deletes the container after exit', 'Runs in detached/background mode', 'Enables debug mode', 'Downloads the image'], correct: 1 },
                { question: 'What is Docker Buildx used for?', options: ['Building Docker Compose files', 'Multi-platform builds', 'Container networking', 'Image scanning'], correct: 1 },
                { question: 'Which network driver enables cross-host communication?', options: ['bridge', 'host', 'overlay', 'none'], correct: 2 },
                { question: 'How are Docker Secrets stored?', options: ['Plain text files', 'Environment variables', 'Encrypted at rest', 'In Dockerfile'], correct: 2 },
                { question: 'What does the --rm flag do in docker run?', options: ['Removes the image after use', 'Automatically removes container when it exits', 'Removes all other containers', 'Resets memory usage'], correct: 1 },
                { question: 'What is the purpose of .dockerignore?', options: ['Ignore containers', 'Exclude files from build context', 'Ignore network issues', 'Skip health checks'], correct: 1 },
                { question: 'Which instruction sets environment variables that persist in running containers?', options: ['ARG', 'ENV', 'SET', 'VAR'], correct: 1 },
                { question: 'What is the difference between COPY and ADD?', options: ['No difference', 'ADD can extract archives and download URLs', 'COPY is slower', 'ADD is deprecated'], correct: 1 },
                { question: 'What is containerd?', options: ['A container name', 'A container registry', 'An industry-standard container runtime', 'A Docker command'], correct: 2 },
                { question: 'What does docker system prune do?', options: ['Updates Docker', 'Removes unused data', 'Prunes container processes', 'Backs up system'], correct: 1 },
                { question: 'What is a bind mount?', options: ['Type of network', 'Mounts host file/directory into container', 'Encryption method', 'Volume driver'], correct: 1 },
                { question: 'What is the scratch image?', options: ['Damaged image', 'An explicitly empty image for minimal builds', 'Testing image', 'Debug image'], correct: 1 },
                { question: 'What is Docker rootless mode?', options: ['Running without root privileges', 'Running without network', 'Minimal container mode', 'Read-only mode'], correct: 0 },
                { question: 'What does docker logs -f do?', options: ['Filters logs', 'Follows/streams logs in real-time', 'Formats logs', 'Finds specific logs'], correct: 1 },
                { question: 'What is an image digest?', options: ['Image description', 'SHA256 hash uniquely identifying an image', 'Image size', 'Build number'], correct: 1 },
                { question: 'What is DinD (Docker in Docker)?', options: ['Docker installation', 'Running Docker inside a Docker container', 'Docker network mode', 'Docker daemon type'], correct: 1 },
                { question: 'What is Alpine Linux commonly used for in Docker?', options: ['Database hosting', 'Minimal base image (~5MB)', 'Web servers only', 'Windows containers'], correct: 1 },
                { question: 'What does docker pause do?', options: ['Stops containers', 'Suspends container processes using cgroups freezer', 'Pauses image download', 'Delays builds'], correct: 1 },
                { question: 'What is the Docker socket path?', options: ['/etc/docker', '/var/run/docker.sock', '/home/docker', '/tmp/docker'], correct: 1 },
                { question: 'What is BuildKit?', options: ['Build tool kit', 'Modern build subsystem with improved caching', 'Docker extension', 'Container kit'], correct: 1 },
                { question: 'What does EXPOSE instruction do in Dockerfile?', options: ['Opens firewall ports', 'Documents which ports container listens on', 'Publishes ports automatically', 'Exposes secrets'], correct: 1 },
                { question: 'What is a tmpfs mount?', options: ['Permanent storage', 'Temporary filesystem stored in memory', 'Tarball filesystem', 'Template filesystem'], correct: 1 },
                { question: 'What command shows running processes in a container?', options: ['docker ps', 'docker top', 'docker proc', 'docker list'], correct: 1 },
                { question: 'How do you limit container memory?', options: ['--mem-limit', '--memory', '--max-mem', '--ram'], correct: 1 },
                { question: 'What is Docker Content Trust?', options: ['License agreement', 'Digital signature verification for images', 'Backup system', 'Access control'], correct: 1 },
                { question: 'What is the OCI?', options: ['Online Container Index', 'Open Container Initiative - industry standards', 'Original Container Image', 'Official Container Installer'], correct: 1 },
                { question: 'What command shows image layer history?', options: ['docker layers', 'docker history', 'docker show', 'docker info'], correct: 1 },
                { question: 'What is the default network driver?', options: ['host', 'bridge', 'overlay', 'macvlan'], correct: 1 },
                { question: 'What does docker cp do?', options: ['Copies containers', 'Copies files between container and host', 'Copies images', 'Copies networks'], correct: 1 },
                { question: 'What is a distroless image?', options: ['Image without distribution', 'Image with only app and runtime, no shell', 'Uncompressed image', 'Raw image'], correct: 1 },
                { question: 'What restart policy restarts unless manually stopped?', options: ['always', 'on-failure', 'unless-stopped', 'never'], correct: 2 },
                { question: 'What does docker diff show?', options: ['Image differences', 'Container filesystem changes', 'Version differences', 'Config differences'], correct: 1 },
                { question: 'What is docker-compose down -v used for?', options: ['Downloads volumes', 'Stops and removes containers, networks, and volumes', 'Verifies down', 'Verbose down'], correct: 1 },
                { question: 'What is Podman?', options: ['Docker plugin', 'Daemonless container engine compatible with Docker', 'Pod manager only', 'Docker GUI'], correct: 1 }
            ],
            codebase: [
                {
                    title: 'Basic Dockerfile',
                    filename: 'Dockerfile',
                    language: 'dockerfile',
                    description: 'A simple Dockerfile for a Node.js application with multi-stage build',
                    code: `# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
USER node
CMD ["node", "server.js"]`
                },
                {
                    title: 'Docker Compose - Full Stack',
                    filename: 'docker-compose.yml',
                    language: 'yaml',
                    description: 'Complete docker-compose setup with web app, database, and Redis cache',
                    code: `version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/myapp
      - REDIS_URL=redis://cache:6379
    depends_on:
      - db
      - cache
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: myapp
    restart: unless-stopped

  cache:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: myapp-network`
                },
                {
                    title: 'Python Flask Dockerfile',
                    filename: 'Dockerfile.python',
                    language: 'dockerfile',
                    description: 'Production-ready Dockerfile for Python Flask applications',
                    code: `FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser
USER appuser

EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]`
                },
                {
                    title: '.dockerignore',
                    filename: '.dockerignore',
                    language: 'plaintext',
                    description: 'Essential dockerignore file to optimize build context',
                    code: `# Dependencies
node_modules
__pycache__
*.pyc
.venv
venv

# Git
.git
.gitignore

# IDE
.vscode
.idea
*.swp

# Build artifacts
dist
build
*.log

# Environment files
.env
.env.local
*.env

# Docker
Dockerfile*
docker-compose*
.docker

# Tests
test
tests
coverage
.pytest_cache

# Documentation
README.md
docs`
                },
                {
                    title: 'Multi-Architecture Build Script',
                    filename: 'build-multi-arch.sh',
                    language: 'bash',
                    description: 'Build and push multi-platform Docker images using buildx',
                    code: `#!/bin/bash
set -e

IMAGE_NAME="myregistry/myapp"
VERSION=\${1:-latest}

# Create and use buildx builder
docker buildx create --name multiarch --use 2>/dev/null || docker buildx use multiarch

# Build and push for multiple platforms
docker buildx build \\
  --platform linux/amd64,linux/arm64 \\
  --tag \${IMAGE_NAME}:\${VERSION} \\
  --tag \${IMAGE_NAME}:latest \\
  --push \\
  --cache-from type=registry,ref=\${IMAGE_NAME}:cache \\
  --cache-to type=registry,ref=\${IMAGE_NAME}:cache,mode=max \\
  .

echo "Successfully built and pushed \${IMAGE_NAME}:\${VERSION}"`
                },
                {
                    title: 'Docker Health Check Script',
                    filename: 'healthcheck.sh',
                    language: 'bash',
                    description: 'Custom health check script for Docker containers',
                    code: `#!/bin/bash
# healthcheck.sh - Custom health check for Docker container

# Check if main process is running
if ! pgrep -x "node" > /dev/null; then
    echo "Main process not running"
    exit 1
fi

# Check HTTP endpoint
response=$(curl -sf http://localhost:3000/health)
if [ $? -ne 0 ]; then
    echo "HTTP health check failed"
    exit 1
fi

# Check database connection
if ! node -e "require('./db').ping()" 2>/dev/null; then
    echo "Database connection failed"
    exit 1
fi

echo "Health check passed"
exit 0`
                }
            ]
        },
        {
            id: 'kubernetes',
            name: 'Kubernetes',
            icon: '☸️',
            color: '#326ce5',
            flashcards: [
                { term: 'Pod', definition: 'The smallest deployable unit in Kubernetes, consisting of one or more containers that share storage, network, and specifications for how to run.' },
                { term: 'Deployment', definition: 'A Kubernetes resource that manages a replicated application, handling updates and rollbacks for Pods and ReplicaSets.' },
                { term: 'Service', definition: 'An abstract way to expose an application running on a set of Pods as a network service with a stable IP and DNS name.' },
                { term: 'Namespace', definition: 'A mechanism for isolating groups of resources within a single cluster. Useful for separating environments or teams.' },
                { term: 'ConfigMap', definition: 'An API object used to store non-confidential configuration data in key-value pairs that can be consumed by Pods.' },
                { term: 'Secret', definition: 'An object that stores sensitive data like passwords, tokens, or keys. Secrets are base64 encoded and can be mounted as volumes.' },
                { term: 'Ingress', definition: 'An API object that manages external access to services in a cluster, typically HTTP, providing load balancing and SSL termination.' },
                { term: 'ReplicaSet', definition: 'A resource that maintains a stable set of replica Pods running at any given time, ensuring the specified number of identical Pods.' },
                { term: 'StatefulSet', definition: 'A workload API object for managing stateful applications with stable, unique network identifiers and persistent storage.' },
                { term: 'DaemonSet', definition: 'Ensures that all (or some) nodes run a copy of a Pod. Useful for node-level operations like log collection or monitoring.' },
                { term: 'Helm', definition: 'A package manager for Kubernetes that helps define, install, and upgrade complex Kubernetes applications using charts.' },
                { term: 'kubectl', definition: 'The command-line tool for communicating with a Kubernetes cluster\'s control plane using the Kubernetes API.' },
                { term: 'Node', definition: 'A worker machine in Kubernetes that runs containerized applications. Each node contains the services necessary to run Pods.' },
                { term: 'Cluster', definition: 'A set of nodes that run containerized applications managed by Kubernetes, including both control plane and worker nodes.' },
                { term: 'PersistentVolume', definition: 'A piece of storage in the cluster that has been provisioned by an administrator or dynamically using Storage Classes.' },
                { term: 'PersistentVolumeClaim', definition: 'A request for storage by a user. PVCs consume PV resources and can specify size and access modes.' },
                { term: 'StorageClass', definition: 'Provides a way to describe different classes of storage, enabling dynamic provisioning of persistent volumes.' },
                { term: 'Control Plane', definition: 'The container orchestration layer that manages the worker nodes and pods, including API server, scheduler, and controller manager.' },
                { term: 'API Server', definition: 'The front-end for the Kubernetes control plane, handling REST operations and serving as the gateway to the cluster.' },
                { term: 'etcd', definition: 'A consistent and highly-available key-value store used as Kubernetes backing store for all cluster data.' },
                { term: 'Scheduler', definition: 'Watches for newly created Pods with no assigned node and selects a node for them to run on.' },
                { term: 'Controller Manager', definition: 'Runs controller processes like node controller, replication controller, and endpoint controller.' },
                { term: 'kubelet', definition: 'An agent that runs on each node ensuring containers are running in a Pod as expected.' },
                { term: 'kube-proxy', definition: 'A network proxy that runs on each node, implementing part of the Kubernetes Service concept.' },
                { term: 'Container Runtime', definition: 'Software responsible for running containers. Kubernetes supports containerd, CRI-O, and other CRI implementations.' },
                { term: 'CRI', definition: 'Container Runtime Interface - a plugin interface enabling kubelet to use different container runtimes.' },
                { term: 'CNI', definition: 'Container Network Interface - a specification for configuring network interfaces in Linux containers.' },
                { term: 'CSI', definition: 'Container Storage Interface - a standard for exposing storage systems to containerized workloads.' },
                { term: 'Horizontal Pod Autoscaler', definition: 'Automatically scales the number of Pod replicas based on observed CPU utilization or other metrics.' },
                { term: 'Vertical Pod Autoscaler', definition: 'Automatically adjusts CPU and memory reservations for pods to help "right size" applications.' },
                { term: 'Cluster Autoscaler', definition: 'Automatically adjusts the size of the Kubernetes cluster when pods fail to schedule or nodes are underutilized.' },
                { term: 'Job', definition: 'Creates one or more Pods and ensures a specified number successfully terminate. Used for batch processing.' },
                { term: 'CronJob', definition: 'Creates Jobs on a repeating schedule, similar to cron in Unix systems.' },
                { term: 'NetworkPolicy', definition: 'Specifies how groups of pods are allowed to communicate with each other and other network endpoints.' },
                { term: 'ResourceQuota', definition: 'Provides constraints that limit aggregate resource consumption per namespace.' },
                { term: 'LimitRange', definition: 'Sets default, minimum, and maximum resource usage constraints for pods in a namespace.' },
                { term: 'ServiceAccount', definition: 'Provides an identity for processes running in a Pod, used for authentication to the API server.' },
                { term: 'RBAC', definition: 'Role-Based Access Control - method for regulating access to resources based on roles.' },
                { term: 'Role', definition: 'Sets permissions within a namespace. Contains rules that represent a set of permissions.' },
                { term: 'ClusterRole', definition: 'Sets permissions cluster-wide. Can be used for cluster-scoped resources or across namespaces.' },
                { term: 'RoleBinding', definition: 'Grants permissions defined in a Role to a user or set of users within a namespace.' },
                { term: 'ClusterRoleBinding', definition: 'Grants permissions defined in a ClusterRole across the entire cluster.' },
                { term: 'Pod Security Policy', definition: 'Cluster-level resource that controls security sensitive aspects of pod specification (deprecated, replaced by Pod Security Admission).' },
                { term: 'Pod Security Admission', definition: 'Built-in admission controller that enforces Pod Security Standards at the namespace level.' },
                { term: 'Admission Controller', definition: 'Intercepts requests to the API server prior to persistence, for validation or mutation.' },
                { term: 'ValidatingWebhook', definition: 'Validates requests to the API server and can reject requests that don\'t meet criteria.' },
                { term: 'MutatingWebhook', definition: 'Modifies requests to the API server before persistence, such as injecting sidecars.' },
                { term: 'Custom Resource Definition', definition: 'Extends the Kubernetes API with custom resources that can be managed like built-in resources.' },
                { term: 'Operator Pattern', definition: 'A method of packaging and running Kubernetes-native applications using custom resources and controllers.' },
                { term: 'Sidecar Container', definition: 'A container that runs alongside the main container in a pod to provide supporting functionality.' },
                { term: 'Init Container', definition: 'Specialized containers that run before app containers in a Pod, useful for setup tasks.' },
                { term: 'Ephemeral Container', definition: 'Temporary containers added to running pods for debugging purposes.' },
                { term: 'Taint', definition: 'Applied to nodes to repel pods that don\'t tolerate the taint, controlling pod placement.' },
                { term: 'Toleration', definition: 'Applied to pods to allow scheduling on nodes with matching taints.' },
                { term: 'Node Selector', definition: 'A simple pod scheduling constraint that matches node labels.' },
                { term: 'Node Affinity', definition: 'More expressive node selection constraints, supporting soft and hard requirements.' },
                { term: 'Pod Affinity', definition: 'Schedules pods based on labels of pods already running on nodes.' },
                { term: 'Pod Anti-Affinity', definition: 'Prevents pods from being scheduled on nodes where certain pods are running.' },
                { term: 'Priority Class', definition: 'Defines a mapping from a priority class name to the integer priority value.' },
                { term: 'Pod Disruption Budget', definition: 'Limits the number of pods that can be down simultaneously during voluntary disruptions.' },
                { term: 'Liveness Probe', definition: 'Checks if a container is running. If it fails, kubelet kills and restarts the container.' },
                { term: 'Readiness Probe', definition: 'Checks if a container is ready to serve traffic. Failing pods are removed from Service endpoints.' },
                { term: 'Startup Probe', definition: 'Checks if the application has started. Disables liveness/readiness probes until it succeeds.' },
                { term: 'ClusterIP', definition: 'Default service type that exposes the service on an internal IP, only reachable within the cluster.' },
                { term: 'NodePort', definition: 'Exposes the service on each node\'s IP at a static port, accessible from outside the cluster.' },
                { term: 'LoadBalancer', definition: 'Exposes the service externally using a cloud provider\'s load balancer.' },
                { term: 'ExternalName', definition: 'Maps a service to a DNS name, returning a CNAME record.' },
                { term: 'Headless Service', definition: 'A service without a cluster IP, used for stateful sets or service discovery.' },
                { term: 'Ingress Controller', definition: 'A component that implements the Ingress resource, such as nginx-ingress or traefik.' },
                { term: 'Gateway API', definition: 'Next-generation Kubernetes API for service networking, more expressive than Ingress.' },
                { term: 'Service Mesh', definition: 'Infrastructure layer handling service-to-service communication with features like encryption and observability.' },
                { term: 'Istio', definition: 'Popular service mesh providing traffic management, security, and observability features.' },
                { term: 'Linkerd', definition: 'Lightweight service mesh focused on simplicity and performance.' },
                { term: 'Kustomize', definition: 'Template-free configuration customization for Kubernetes, built into kubectl.' },
                { term: 'Helm Chart', definition: 'A package containing all resource definitions needed to run an application in Kubernetes.' },
                { term: 'Values File', definition: 'YAML file containing default configuration values for a Helm chart.' },
                { term: 'kubeconfig', definition: 'Configuration file used by kubectl to access clusters, containing cluster, user, and context info.' },
                { term: 'Context', definition: 'A named tuple of cluster, user, and namespace used in kubeconfig for cluster access.' }
            ],
            commands: [
                { command: 'kubectl get pods', description: 'List all pods in current namespace' },
                { command: 'kubectl get pods -A', description: 'List pods in all namespaces' },
                { command: 'kubectl get nodes', description: 'List all nodes in the cluster' },
                { command: 'kubectl describe pod <name>', description: 'Show detailed pod information' },
                { command: 'kubectl logs <pod>', description: 'View pod logs' },
                { command: 'kubectl logs -f <pod>', description: 'Follow/stream pod logs' },
                { command: 'kubectl exec -it <pod> -- bash', description: 'Execute interactive shell in pod' },
                { command: 'kubectl apply -f manifest.yaml', description: 'Apply configuration from file' },
                { command: 'kubectl delete -f manifest.yaml', description: 'Delete resources from file' },
                { command: 'kubectl create namespace <name>', description: 'Create a new namespace' },
                { command: 'kubectl get svc', description: 'List all services' },
                { command: 'kubectl get deploy', description: 'List all deployments' },
                { command: 'kubectl get ingress', description: 'List all ingresses' },
                { command: 'kubectl get configmaps', description: 'List all ConfigMaps' },
                { command: 'kubectl get secrets', description: 'List all Secrets' },
                { command: 'kubectl get pv', description: 'List PersistentVolumes' },
                { command: 'kubectl get pvc', description: 'List PersistentVolumeClaims' },
                { command: 'kubectl scale deploy <name> --replicas=3', description: 'Scale deployment to 3 replicas' },
                { command: 'kubectl rollout status deploy/<name>', description: 'Check rollout status' },
                { command: 'kubectl rollout undo deploy/<name>', description: 'Rollback deployment' },
                { command: 'kubectl rollout history deploy/<name>', description: 'View rollout history' },
                { command: 'kubectl port-forward pod/<name> 8080:80', description: 'Forward local port to pod' },
                { command: 'kubectl top pods', description: 'Show pod resource usage' },
                { command: 'kubectl top nodes', description: 'Show node resource usage' },
                { command: 'kubectl run nginx --image=nginx', description: 'Create and run a pod' },
                { command: 'kubectl expose deploy <name> --port=80', description: 'Create service for deployment' },
                { command: 'kubectl edit deploy <name>', description: 'Edit deployment in editor' },
                { command: 'kubectl patch deploy <name> -p \'{"spec":...}\'', description: 'Patch a resource' },
                { command: 'kubectl label pod <name> app=web', description: 'Add label to pod' },
                { command: 'kubectl annotate pod <name> desc="value"', description: 'Add annotation' },
                { command: 'kubectl taint nodes <node> key=val:NoSchedule', description: 'Add taint to node' },
                { command: 'kubectl cordon <node>', description: 'Mark node as unschedulable' },
                { command: 'kubectl drain <node>', description: 'Safely evict pods from node' },
                { command: 'kubectl uncordon <node>', description: 'Mark node as schedulable' },
                { command: 'kubectl get events --sort-by=.lastTimestamp', description: 'View sorted events' },
                { command: 'kubectl config get-contexts', description: 'List all contexts' },
                { command: 'kubectl config use-context <name>', description: 'Switch context' },
                { command: 'kubectl config current-context', description: 'Show current context' },
                { command: 'kubectl cluster-info', description: 'Display cluster info' },
                { command: 'kubectl api-resources', description: 'List all API resources' },
                { command: 'kubectl explain pod.spec', description: 'Show resource documentation' },
                { command: 'kubectl get pods -o yaml', description: 'Output in YAML format' },
                { command: 'kubectl get pods -o json', description: 'Output in JSON format' },
                { command: 'kubectl get pods -l app=nginx', description: 'Filter by label' },
                { command: 'kubectl get pods --field-selector status.phase=Running', description: 'Filter by field' },
                { command: 'kubectl diff -f manifest.yaml', description: 'Show diff before apply' },
                { command: 'kubectl auth can-i create pods', description: 'Check permissions' },
                { command: 'kubectl debug pod/<name> -it --image=busybox', description: 'Debug pod with ephemeral container' },
                { command: 'helm install release chart/', description: 'Install Helm chart' },
                { command: 'helm upgrade release chart/', description: 'Upgrade Helm release' },
                { command: 'helm list', description: 'List Helm releases' },
                { command: 'helm uninstall release', description: 'Uninstall Helm release' }
            ],
            quiz: [
                { question: 'What is the smallest deployable unit in Kubernetes?', options: ['Container', 'Pod', 'Deployment', 'Node'], correct: 1 },
                { question: 'Which resource provides a stable network endpoint for Pods?', options: ['Deployment', 'ConfigMap', 'Service', 'Ingress'], correct: 2 },
                { question: 'What is the purpose of a Namespace?', options: ['Store secrets', 'Isolate resources within a cluster', 'Manage external traffic', 'Store configuration'], correct: 1 },
                { question: 'Which Kubernetes object is used to store sensitive data?', options: ['ConfigMap', 'Secret', 'Volume', 'Service'], correct: 1 },
                { question: 'What does a DaemonSet ensure?', options: ['All pods have unique names', 'A pod runs on all/some nodes', 'External access to services', 'Data persistence'], correct: 1 },
                { question: 'What is Helm used for in Kubernetes?', options: ['Container runtime', 'Package management', 'Network policies', 'Log collection'], correct: 1 },
                { question: 'Which command-line tool is used to interact with Kubernetes?', options: ['docker', 'kubectl', 'helm', 'kubeadm'], correct: 1 },
                { question: 'What workload is best for stateful applications?', options: ['Deployment', 'ReplicaSet', 'StatefulSet', 'DaemonSet'], correct: 2 },
                { question: 'What is etcd used for in Kubernetes?', options: ['Container runtime', 'Key-value store for cluster data', 'Load balancing', 'Pod scheduling'], correct: 1 },
                { question: 'What does the kubelet do?', options: ['Schedules pods', 'Runs containers in pods', 'Manages API requests', 'Stores configuration'], correct: 1 },
                { question: 'What is a PersistentVolumeClaim?', options: ['Storage request by user', 'Pod definition', 'Network policy', 'Container image'], correct: 0 },
                { question: 'Which service type exposes a static port on each node?', options: ['ClusterIP', 'NodePort', 'LoadBalancer', 'ExternalName'], correct: 1 },
                { question: 'What does HPA stand for?', options: ['High Performance API', 'Horizontal Pod Autoscaler', 'Host Pod Access', 'HTTP Proxy Agent'], correct: 1 },
                { question: 'What is a CronJob used for?', options: ['Continuous deployment', 'Scheduled tasks', 'Persistent storage', 'Network policies'], correct: 1 },
                { question: 'What is an Init Container?', options: ['Container for initialization', 'Main application container', 'Sidecar container', 'Debug container'], correct: 0 },
                { question: 'What does RBAC stand for?', options: ['Resource Based Access Control', 'Role Based Access Control', 'Runtime Based Access Control', 'Request Based Access Control'], correct: 1 },
                { question: 'What is a Taint used for?', options: ['Marking pods', 'Repelling pods from nodes', 'Encrypting data', 'Logging'], correct: 1 },
                { question: 'What probe checks if a container is ready to serve traffic?', options: ['Liveness', 'Readiness', 'Startup', 'Health'], correct: 1 },
                { question: 'What is a Custom Resource Definition (CRD)?', options: ['Custom pod type', 'API extension mechanism', 'Network resource', 'Storage definition'], correct: 1 },
                { question: 'What is the Operator pattern?', options: ['Manual operations', 'Packaging apps with custom controllers', 'Network operations', 'Storage operations'], correct: 1 },
                { question: 'What does kubectl apply do?', options: ['Deletes resources', 'Creates/updates resources from file', 'Shows logs', 'Lists pods'], correct: 1 },
                { question: 'What is a Sidecar container?', options: ['Main container', 'Supporting container in same pod', 'Init container', 'Debug container'], correct: 1 },
                { question: 'What is Pod Affinity used for?', options: ['Pod deletion', 'Scheduling based on other pods', 'Pod scaling', 'Pod networking'], correct: 1 },
                { question: 'What is a Headless Service?', options: ['Service without pods', 'Service without ClusterIP', 'Service without port', 'Service without selector'], correct: 1 },
                { question: 'What controls voluntary disruption limits?', options: ['ResourceQuota', 'LimitRange', 'Pod Disruption Budget', 'Priority Class'], correct: 2 },
                { question: 'What does kubectl drain do?', options: ['Adds pods', 'Safely evicts pods from node', 'Deletes node', 'Creates namespace'], correct: 1 },
                { question: 'What is Kustomize used for?', options: ['Container building', 'Configuration customization', 'Monitoring', 'Logging'], correct: 1 },
                { question: 'What is an Ingress Controller?', options: ['API component', 'Implementation of Ingress resource', 'Storage controller', 'Pod controller'], correct: 1 },
                { question: 'What is the CNI?', options: ['Container Name Interface', 'Container Network Interface', 'Cluster Node Integration', 'Control Network Interface'], correct: 1 },
                { question: 'What does kubectl port-forward do?', options: ['Opens firewall', 'Forwards local port to pod', 'Exposes service', 'Creates ingress'], correct: 1 },
                { question: 'What is a Service Mesh?', options: ['Network cables', 'Service-to-service communication layer', 'Container mesh', 'Pod mesh'], correct: 1 },
                { question: 'What is Istio?', options: ['Container runtime', 'Service mesh', 'Package manager', 'Monitoring tool'], correct: 1 },
                { question: 'What stores cluster, user, and context info?', options: ['ConfigMap', 'Secret', 'kubeconfig', 'Deployment'], correct: 2 },
                { question: 'What does kubectl scale do?', options: ['Weighs pods', 'Changes replica count', 'Measures resources', 'Scales nodes'], correct: 1 },
                { question: 'What is the Control Plane?', options: ['Worker nodes', 'Orchestration layer managing cluster', 'Network layer', 'Storage layer'], correct: 1 },
                { question: 'What does kubectl rollout undo do?', options: ['Deletes deployment', 'Rolls back to previous version', 'Pauses rollout', 'Restarts pods'], correct: 1 },
                { question: 'What is a ValidatingWebhook?', options: ['Creates resources', 'Validates API requests', 'Updates deployments', 'Deletes pods'], correct: 1 },
                { question: 'What provides cluster-wide permissions?', options: ['Role', 'ClusterRole', 'RoleBinding', 'ServiceAccount'], correct: 1 },
                { question: 'What does kubectl top show?', options: ['Pod images', 'Resource usage', 'Pod labels', 'Node addresses'], correct: 1 },
                { question: 'What is Gateway API?', options: ['API gateway', 'Next-gen service networking API', 'Admin API', 'Storage API'], correct: 1 }
            ],
            codebase: [
                {
                    title: 'Deployment Manifest',
                    filename: 'deployment.yaml',
                    language: 'yaml',
                    description: 'Complete Kubernetes Deployment with resource limits, probes, and affinity',
                    code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myregistry/myapp:v1.0.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: myapp
              topologyKey: kubernetes.io/hostname`
                },
                {
                    title: 'Service & Ingress',
                    filename: 'service-ingress.yaml',
                    language: 'yaml',
                    description: 'ClusterIP Service with Ingress for external access',
                    code: `apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - myapp.example.com
    secretName: myapp-tls
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: myapp-service
            port:
              number: 80`
                },
                {
                    title: 'ConfigMap & Secret',
                    filename: 'config-secret.yaml',
                    language: 'yaml',
                    description: 'ConfigMap for app config and Secret for sensitive data',
                    code: `apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: "info"
  FEATURE_FLAGS: "newUI=true,darkMode=false"
  config.json: |
    {
      "apiEndpoint": "https://api.example.com",
      "timeout": 30,
      "retries": 3
    }
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  database-url: "postgres://user:password@db:5432/myapp"
  api-key: "your-secret-api-key"
  jwt-secret: "super-secret-jwt-key"`
                },
                {
                    title: 'HorizontalPodAutoscaler',
                    filename: 'hpa.yaml',
                    language: 'yaml',
                    description: 'Auto-scale pods based on CPU and memory metrics',
                    code: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15`
                },
                {
                    title: 'Helm Chart values.yaml',
                    filename: 'values.yaml',
                    language: 'yaml',
                    description: 'Helm chart values for customizable deployments',
                    code: `# Default values for myapp
replicaCount: 3

image:
  repository: myregistry/myapp
  tag: "v1.0.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: myapp.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: myapp-tls
      hosts:
        - myapp.example.com

resources:
  limits:
    cpu: 500m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

nodeSelector: {}
tolerations: []
affinity: {}`
                }
            ]
        },
        {
            id: 'cicd',
            name: 'CI/CD',
            icon: '🔄',
            color: '#f97316',
            flashcards: [
                { term: 'Continuous Integration', definition: 'A practice where developers frequently merge code changes into a central repository, triggering automated builds and tests.' },
                { term: 'Continuous Delivery', definition: 'An extension of CI that automatically prepares code changes for release to production, requiring manual approval for deployment.' },
                { term: 'Continuous Deployment', definition: 'Takes CD further by automatically deploying every change that passes all stages of the production pipeline without manual intervention.' },
                { term: 'Pipeline', definition: 'A set of automated processes that allows developers to reliably and efficiently compile, build, test, and deploy code.' },
                { term: 'Build Artifact', definition: 'The output of the build process, such as compiled code, Docker images, or packages ready for deployment.' },
                { term: 'GitHub Actions', definition: 'A CI/CD platform integrated with GitHub that automates workflows like building, testing, and deploying code based on events.' },
                { term: 'Jenkins', definition: 'An open-source automation server that enables developers to build, test, and deploy applications with plugins and Jenkinsfiles.' },
                { term: 'GitLab CI/CD', definition: 'A built-in continuous integration and delivery tool in GitLab, configured using a .gitlab-ci.yml file in the repository.' },
                { term: 'Blue-Green Deployment', definition: 'A deployment strategy using two identical production environments to reduce downtime and risk during releases.' },
                { term: 'Canary Deployment', definition: 'A deployment strategy that gradually rolls out changes to a small subset of users before releasing to the entire infrastructure.' },
                { term: 'Rolling Deployment', definition: 'Incrementally updates instances with new versions, replacing old versions one at a time to minimize downtime.' },
                { term: 'Feature Flags', definition: 'Techniques that allow toggling features on/off without deploying new code, enabling gradual rollouts and A/B testing.' },
                { term: 'Jenkinsfile', definition: 'A text file that defines a Jenkins Pipeline, using Groovy-based DSL for pipeline-as-code.' },
                { term: 'Pipeline as Code', definition: 'Practice of defining build/deploy pipelines in version-controlled files rather than through UI configuration.' },
                { term: 'Build Stage', definition: 'A phase in the pipeline that compiles code, runs linters, and creates artifacts from source code.' },
                { term: 'Test Stage', definition: 'A phase that runs automated tests including unit tests, integration tests, and end-to-end tests.' },
                { term: 'Deploy Stage', definition: 'A phase that pushes artifacts to target environments like staging, QA, or production.' },
                { term: 'Workflow', definition: 'A configurable automated process in GitHub Actions defined in YAML files specifying jobs and steps.' },
                { term: 'Job', definition: 'A set of steps in a workflow that execute on the same runner, with jobs running in parallel by default.' },
                { term: 'Step', definition: 'An individual task in a job that can run commands or actions for specific operations.' },
                { term: 'Runner', definition: 'A server that runs GitHub Actions workflows. Can be GitHub-hosted or self-hosted.' },
                { term: 'Action', definition: 'A reusable unit of code for GitHub Actions that performs a specific task in a workflow.' },
                { term: 'CircleCI', definition: 'A cloud-based CI/CD platform that automates build, test, and deploy processes with config.yml.' },
                { term: 'Travis CI', definition: 'A hosted CI service that integrates with GitHub for automated testing and deployment.' },
                { term: 'Azure DevOps Pipelines', definition: 'CI/CD service from Microsoft that supports any language, platform, and cloud deployment.' },
                { term: 'AWS CodePipeline', definition: 'A fully managed CI/CD service for automating release pipelines on AWS infrastructure.' },
                { term: 'ArgoCD', definition: 'A declarative GitOps continuous delivery tool for Kubernetes applications.' },
                { term: 'GitOps', definition: 'A paradigm where Git is the single source of truth for infrastructure and application configuration.' },
                { term: 'Flux', definition: 'A GitOps toolkit for keeping Kubernetes clusters in sync with sources of configuration.' },
                { term: 'Spinnaker', definition: 'An open-source multi-cloud continuous delivery platform for releasing software changes.' },
                { term: 'Tekton', definition: 'A Kubernetes-native framework for creating CI/CD pipelines as custom resources.' },
                { term: 'Build Cache', definition: 'Mechanism to store and reuse previously computed build outputs to speed up subsequent builds.' },
                { term: 'Parallel Execution', definition: 'Running multiple jobs or stages simultaneously to reduce overall pipeline duration.' },
                { term: 'Matrix Build', definition: 'Running tests across multiple configurations (OS, language versions) in parallel.' },
                { term: 'Secrets Management', definition: 'Securely storing and accessing sensitive data like API keys and passwords in CI/CD pipelines.' },
                { term: 'Environment Variables', definition: 'Key-value pairs that configure pipeline behavior and pass configuration to build/deploy scripts.' },
                { term: 'Trigger', definition: 'An event that starts a pipeline, such as push, pull request, schedule, or manual trigger.' },
                { term: 'Webhook', definition: 'HTTP callbacks that notify CI/CD systems about repository events to trigger pipelines.' },
                { term: 'Approval Gates', definition: 'Manual or automated checkpoints requiring approval before proceeding to next deployment stage.' },
                { term: 'Rollback', definition: 'Reverting to a previous version of an application when issues are detected in a deployment.' },
                { term: 'Smoke Tests', definition: 'Preliminary tests to verify that basic functionality works after deployment.' },
                { term: 'Integration Tests', definition: 'Tests that verify different modules or services work together correctly.' },
                { term: 'End-to-End Tests', definition: 'Tests that validate entire application flows from user perspective.' },
                { term: 'Code Coverage', definition: 'A metric measuring the percentage of code executed during tests.' },
                { term: 'Static Analysis', definition: 'Analyzing code without executing it to find bugs, security issues, and code smells.' },
                { term: 'Linting', definition: 'Automated checking of source code for programmatic and stylistic errors.' },
                { term: 'Quality Gates', definition: 'Criteria that code must meet before proceeding, like coverage thresholds or zero critical bugs.' },
                { term: 'Deployment Slot', definition: 'Staging environment in Azure App Service for testing before swapping to production.' },
                { term: 'Infrastructure as Code', definition: 'Managing infrastructure through configuration files that can be version-controlled and tested.' },
                { term: 'Immutable Infrastructure', definition: 'Infrastructure that is never modified after deployment; changes require new deployments.' }
            ],
            commands: [
                { command: 'gh workflow run workflow.yml', description: 'Manually trigger GitHub Actions workflow' },
                { command: 'gh run list', description: 'List recent workflow runs' },
                { command: 'gh run view --log', description: 'View workflow run logs' },
                { command: 'jenkins-cli build job-name', description: 'Trigger Jenkins job from CLI' },
                { command: 'gitlab-runner register', description: 'Register a new GitLab runner' },
                { command: 'gitlab-ci-lint .gitlab-ci.yml', description: 'Validate GitLab CI config' },
                { command: 'circleci local execute', description: 'Run CircleCI jobs locally' },
                { command: 'argocd app sync app-name', description: 'Sync ArgoCD application' },
                { command: 'argocd app list', description: 'List ArgoCD applications' },
                { command: 'flux reconcile kustomization', description: 'Trigger Flux reconciliation' },
                { command: 'tekton pipeline start pipeline', description: 'Start Tekton pipeline' },
                { command: 'tkn pipelinerun list', description: 'List Tekton pipeline runs' },
                { command: 'aws codepipeline start-pipeline-execution', description: 'Start AWS CodePipeline' },
                { command: 'az pipelines run --name pipeline', description: 'Run Azure DevOps pipeline' },
                { command: 'spinnaker pipeline execute', description: 'Execute Spinnaker pipeline' },
                { command: 'newman run collection.json', description: 'Run Postman collection for API tests' },
                { command: 'npm test', description: 'Run npm test scripts' },
                { command: 'pytest --cov=app tests/', description: 'Run Python tests with coverage' },
                { command: 'mvn clean install', description: 'Build Maven project' },
                { command: 'gradle build', description: 'Build Gradle project' },
                { command: 'make test', description: 'Run Makefile test target' },
                { command: 'sonar-scanner', description: 'Run SonarQube analysis' },
                { command: 'eslint --fix .', description: 'Run ESLint with auto-fix' },
                { command: 'black --check .', description: 'Check Python formatting' },
                { command: 'hadolint Dockerfile', description: 'Lint Dockerfile' }
            ],
            quiz: [
                { question: 'What is the main goal of Continuous Integration?', options: ['Deploy to production', 'Frequently merge and test code changes', 'Monitor applications', 'Manage infrastructure'], correct: 1 },
                { question: 'What distinguishes Continuous Deployment from Continuous Delivery?', options: ['More testing', 'Automatic deployment without manual approval', 'Better monitoring', 'Faster builds'], correct: 1 },
                { question: 'What is a CI/CD pipeline?', options: ['A type of container', 'Automated processes for build, test, and deploy', 'A monitoring tool', 'A version control system'], correct: 1 },
                { question: 'Which deployment strategy uses two identical environments?', options: ['Canary', 'Rolling', 'Blue-Green', 'A/B Testing'], correct: 2 },
                { question: 'What is a build artifact?', options: ['Source code', 'Test results', 'Output of the build process', 'Configuration file'], correct: 2 },
                { question: 'What is a Jenkinsfile?', options: ['Jenkins configuration', 'Pipeline definition file', 'Log file', 'Credential file'], correct: 1 },
                { question: 'What is GitOps?', options: ['Git operations', 'Git as single source of truth for config', 'GitHub operations', 'Git optimization'], correct: 1 },
                { question: 'What is a canary deployment?', options: ['Full release', 'Gradual rollout to subset of users', 'Emergency release', 'Blue-green switch'], correct: 1 },
                { question: 'What is ArgoCD primarily used for?', options: ['Container building', 'GitOps CD for Kubernetes', 'Monitoring', 'Testing'], correct: 1 },
                { question: 'What triggers a pipeline?', options: ['Manual only', 'Events like push, PR, schedule', 'Only on Fridays', 'Random'], correct: 1 },
                { question: 'What is a runner in GitHub Actions?', options: ['Fast pipeline', 'Server that executes workflows', 'Type of action', 'Workflow step'], correct: 1 },
                { question: 'What is rolling deployment?', options: ['Rollback', 'Incremental updates replacing old versions', 'Fast deployment', 'Manual deployment'], correct: 1 },
                { question: 'What are feature flags used for?', options: ['Flagging errors', 'Toggling features without deploying', 'Marking files', 'Security alerts'], correct: 1 },
                { question: 'What is pipeline as code?', options: ['Coding pipelines', 'Defining pipelines in version-controlled files', 'Pipeline encryption', 'Code testing'], correct: 1 },
                { question: 'What does code coverage measure?', options: ['Code quality', 'Percentage of code executed by tests', 'Code size', 'Code complexity'], correct: 1 },
                { question: 'What is static analysis?', options: ['Running tests', 'Analyzing code without executing it', 'Performance testing', 'Load testing'], correct: 1 },
                { question: 'What is a quality gate?', options: ['Code review', 'Criteria code must meet before proceeding', 'Deployment gate', 'Security check'], correct: 1 },
                { question: 'What is a rollback?', options: ['Moving forward', 'Reverting to previous version', 'Restarting pipeline', 'Deploying backup'], correct: 1 },
                { question: 'What is Tekton?', options: ['CI tool', 'Kubernetes-native CI/CD framework', 'Container tool', 'Monitoring tool'], correct: 1 },
                { question: 'What are smoke tests?', options: ['Performance tests', 'Preliminary tests for basic functionality', 'Security tests', 'Load tests'], correct: 1 },
                { question: 'What is immutable infrastructure?', options: ['Infrastructure that changes', 'Infrastructure never modified after deployment', 'Static infrastructure', 'Old infrastructure'], correct: 1 },
                { question: 'What is a webhook?', options: ['Web application', 'HTTP callback for event notification', 'Security hook', 'API endpoint'], correct: 1 },
                { question: 'What is matrix build?', options: ['Mathematical build', 'Running tests across multiple configurations', 'Single build', 'Complex build'], correct: 1 },
                { question: 'What are approval gates?', options: ['Security gates', 'Checkpoints requiring approval before deployment', 'Code gates', 'Test gates'], correct: 1 },
                { question: 'What is linting?', options: ['Code cleaning', 'Automated checking for code errors', 'Code compression', 'Code encryption'], correct: 1 }
            ],
            codebase: [
                {
                    title: 'GitHub Actions Workflow',
                    filename: '.github/workflows/ci-cd.yml',
                    language: 'yaml',
                    description: 'Complete CI/CD pipeline with build, test, and deploy stages',
                    code: `name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v4
        with:
          manifests: k8s/
          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }}`
                },
                {
                    title: 'GitLab CI Pipeline',
                    filename: '.gitlab-ci.yml',
                    language: 'yaml',
                    description: 'GitLab CI/CD pipeline with stages and environments',
                    code: `stages:
  - test
  - build
  - deploy

variables:
  DOCKER_IMAGE: \$CI_REGISTRY_IMAGE:\$CI_COMMIT_SHA

test:
  stage: test
  image: node:20-alpine
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run lint
    - npm test
  coverage: '/Lines\\s*:\\s*(\\d+\\.?\\d*)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - docker login -u \$CI_REGISTRY_USER -p \$CI_REGISTRY_PASSWORD \$CI_REGISTRY
  script:
    - docker build -t \$DOCKER_IMAGE .
    - docker push \$DOCKER_IMAGE
  only:
    - main
    - develop

deploy_staging:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/myapp myapp=\$DOCKER_IMAGE
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - develop

deploy_production:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/myapp myapp=\$DOCKER_IMAGE
  environment:
    name: production
    url: https://example.com
  when: manual
  only:
    - main`
                },
                {
                    title: 'Jenkinsfile',
                    filename: 'Jenkinsfile',
                    language: 'groovy',
                    description: 'Declarative Jenkins pipeline with parallel stages',
                    code: `pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'registry.example.com'
        IMAGE_NAME = 'myapp'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'npm ci'
                        sh 'npm run test:unit'
                    }
                }
                stage('Integration Tests') {
                    steps {
                        sh 'npm run test:integration'
                    }
                }
                stage('Lint') {
                    steps {
                        sh 'npm run lint'
                    }
                }
            }
        }
        
        stage('Build') {
            steps {
                script {
                    docker.build("\${DOCKER_REGISTRY}/\${IMAGE_NAME}:\${BUILD_NUMBER}")
                }
            }
        }
        
        stage('Push') {
            steps {
                script {
                    docker.withRegistry("https://\${DOCKER_REGISTRY}", 'docker-credentials') {
                        docker.image("\${DOCKER_REGISTRY}/\${IMAGE_NAME}:\${BUILD_NUMBER}").push()
                        docker.image("\${DOCKER_REGISTRY}/\${IMAGE_NAME}:\${BUILD_NUMBER}").push('latest')
                    }
                }
            }
        }
        
        stage('Deploy to Staging') {
            steps {
                sh "kubectl set image deployment/myapp myapp=\${DOCKER_REGISTRY}/\${IMAGE_NAME}:\${BUILD_NUMBER}"
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            input {
                message 'Deploy to production?'
                ok 'Deploy'
            }
            steps {
                sh "kubectl set image deployment/myapp myapp=\${DOCKER_REGISTRY}/\${IMAGE_NAME}:\${BUILD_NUMBER} --context=production"
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        failure {
            slackSend channel: '#alerts', message: "Build failed: \${env.JOB_NAME} #\${env.BUILD_NUMBER}"
        }
    }
}`
                },
                {
                    title: 'ArgoCD Application',
                    filename: 'argocd-app.yaml',
                    language: 'yaml',
                    description: 'GitOps deployment with ArgoCD',
                    code: `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/myapp.git
    targetRevision: HEAD
    path: k8s/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: myapp
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m`
                }
            ]
        },
        {
            id: 'aws',
            name: 'AWS',
            icon: '☁️',
            color: '#ff9900',
            flashcards: [
                { term: 'EC2', definition: 'Elastic Compute Cloud - A web service providing resizable compute capacity in the cloud as virtual servers (instances).' },
                { term: 'S3', definition: 'Simple Storage Service - Object storage service offering scalability, data availability, security, and performance for any amount of data.' },
                { term: 'Lambda', definition: 'A serverless compute service that runs code in response to events without provisioning or managing servers.' },
                { term: 'VPC', definition: 'Virtual Private Cloud - A logically isolated section of AWS where you can launch resources in a virtual network you define.' },
                { term: 'IAM', definition: 'Identity and Access Management - A service for securely controlling access to AWS services and resources.' },
                { term: 'EKS', definition: 'Elastic Kubernetes Service - A managed Kubernetes service to run Kubernetes on AWS without installing and operating your own cluster.' },
                { term: 'RDS', definition: 'Relational Database Service - A managed database service supporting multiple database engines like MySQL, PostgreSQL, and Aurora.' },
                { term: 'CloudFormation', definition: 'Infrastructure as Code service that lets you model and provision AWS resources using templates.' },
                { term: 'Route 53', definition: 'A scalable Domain Name System (DNS) web service for routing end users to applications and managing domain registrations.' },
                { term: 'ELB', definition: 'Elastic Load Balancing - Automatically distributes incoming application traffic across multiple targets like EC2 instances.' },
                { term: 'CloudWatch', definition: 'A monitoring and observability service for AWS resources and applications, providing metrics, logs, and alarms.' },
                { term: 'ECR', definition: 'Elastic Container Registry - A fully managed Docker container registry for storing, managing, and deploying container images.' }
            ],
            quiz: [
                {
                    question: 'What type of service is AWS Lambda?',
                    options: ['Database', 'Serverless compute', 'Storage', 'Networking'],
                    correct: 1
                },
                {
                    question: 'What does S3 stand for?',
                    options: ['Simple Server Service', 'Simple Storage Service', 'Secure Storage System', 'Server Storage Service'],
                    correct: 1
                },
                {
                    question: 'Which service is used for managing access to AWS resources?',
                    options: ['VPC', 'IAM', 'EC2', 'S3'],
                    correct: 1
                },
                {
                    question: 'What is AWS EKS?',
                    options: ['A database service', 'A managed Kubernetes service', 'A storage service', 'A monitoring tool'],
                    correct: 1
                },
                {
                    question: 'Which service provides Infrastructure as Code on AWS?',
                    options: ['Lambda', 'EC2', 'CloudFormation', 'RDS'],
                    correct: 2
                },
                {
                    question: 'What is Route 53 used for?',
                    options: ['Load balancing', 'Container orchestration', 'DNS and domain routing', 'Serverless functions'],
                    correct: 2
                }
            ],
            codebase: [
                {
                    title: 'Lambda Function with API Gateway',
                    filename: 'lambda-api.py',
                    language: 'python',
                    description: 'AWS Lambda handler with API Gateway integration',
                    code: `import json
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Items')

def lambda_handler(event, context):
    """
    Lambda function handler for API Gateway
    """
    http_method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    
    try:
        if http_method == 'GET':
            response = table.scan()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps(response['Items'])
            }
        
        elif http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            item = {
                'id': str(datetime.now().timestamp()),
                'name': body.get('name'),
                'created_at': datetime.now().isoformat()
            }
            table.put_item(Item=item)
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps(item)
            }
        
        else:
            return {
                'statusCode': 405,
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }`
                },
                {
                    title: 'CloudFormation Template',
                    filename: 'infrastructure.yaml',
                    language: 'yaml',
                    description: 'CloudFormation template for VPC with public/private subnets',
                    code: `AWSTemplateFormatVersion: '2010-09-09'
Description: VPC with public and private subnets

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues: [development, staging, production]

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub \${Environment}-vpc

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub \${Environment}-public-1

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub \${Environment}-private-1

  InternetGateway:
    Type: AWS::EC2::InternetGateway

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

Outputs:
  VPCId:
    Value: !Ref VPC
    Export:
      Name: !Sub \${Environment}-VPCId`
                },
                {
                    title: 'IAM Policy Document',
                    filename: 'iam-policy.json',
                    language: 'json',
                    description: 'Least-privilege IAM policy for S3 and DynamoDB access',
                    code: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Access",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::my-bucket/*"
    },
    {
      "Sid": "DynamoDBAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:123456789012:table/MyTable",
        "arn:aws:dynamodb:us-east-1:123456789012:table/MyTable/index/*"
      ]
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}`
                },
                {
                    title: 'AWS CLI Deployment Script',
                    filename: 'deploy-aws.sh',
                    language: 'bash',
                    description: 'Deployment script using AWS CLI for ECS',
                    code: `#!/bin/bash
set -e

# Configuration
CLUSTER_NAME="production-cluster"
SERVICE_NAME="myapp-service"
TASK_FAMILY="myapp"
ECR_REPO="123456789012.dkr.ecr.us-east-1.amazonaws.com/myapp"
IMAGE_TAG=\${1:-latest}

# Login to ECR
aws ecr get-login-password --region us-east-1 | \\
  docker login --username AWS --password-stdin \$ECR_REPO

# Build and push image
docker build -t \$ECR_REPO:\$IMAGE_TAG .
docker push \$ECR_REPO:\$IMAGE_TAG

# Get current task definition
TASK_DEF=$(aws ecs describe-task-definition --task-definition \$TASK_FAMILY)

# Create new task definition with updated image
NEW_TASK_DEF=$(echo \$TASK_DEF | jq --arg IMAGE "\$ECR_REPO:\$IMAGE_TAG" \\
  '.taskDefinition | .containerDefinitions[0].image = \$IMAGE | 
   del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)')

# Register new task definition
NEW_TASK_ARN=$(aws ecs register-task-definition --cli-input-json "\$NEW_TASK_DEF" \\
  --query 'taskDefinition.taskDefinitionArn' --output text)

# Update service
aws ecs update-service \\
  --cluster \$CLUSTER_NAME \\
  --service \$SERVICE_NAME \\
  --task-definition \$NEW_TASK_ARN

echo "Deployed \$ECR_REPO:\$IMAGE_TAG to \$SERVICE_NAME"`
                }
            ]
        },
        {
            id: 'terraform',
            name: 'Terraform',
            icon: '🏗️',
            color: '#7b42bc',
            flashcards: [
                { term: 'Infrastructure as Code', definition: 'Managing and provisioning infrastructure through machine-readable configuration files rather than manual processes.' },
                { term: 'Provider', definition: 'A plugin that allows Terraform to interact with cloud platforms, SaaS providers, and other APIs like AWS, Azure, or GCP.' },
                { term: 'Resource', definition: 'The most important element in Terraform - describes infrastructure objects like compute instances, databases, or networks.' },
                { term: 'State File', definition: 'A JSON file that Terraform uses to map real-world resources to your configuration and track metadata.' },
                { term: 'Module', definition: 'A container for multiple resources used together, enabling reusable and shareable infrastructure configurations.' },
                { term: 'Terraform Plan', definition: 'A command that creates an execution plan showing what actions Terraform will take to achieve the desired state.' },
                { term: 'Terraform Apply', definition: 'A command that executes the actions proposed in a Terraform plan to create, update, or delete infrastructure.' },
                { term: 'Variable', definition: 'Input parameters that make Terraform configurations flexible and reusable, defined using variable blocks.' },
                { term: 'Output', definition: 'Values exported from a Terraform module, useful for passing data between modules or displaying to users.' },
                { term: 'Backend', definition: 'Determines how state is stored and how operations are executed. Remote backends enable team collaboration.' }
            ],
            quiz: [
                {
                    question: 'What is Infrastructure as Code (IaC)?',
                    options: ['Manual server configuration', 'Managing infrastructure through code/configuration files', 'A type of database', 'Container orchestration'],
                    correct: 1
                },
                {
                    question: 'What does a Terraform provider do?',
                    options: ['Stores state', 'Interacts with cloud platforms and APIs', 'Runs containers', 'Manages secrets'],
                    correct: 1
                },
                {
                    question: 'What is stored in the Terraform state file?',
                    options: ['Source code', 'Mapping of resources to configuration', 'Container images', 'User credentials'],
                    correct: 1
                },
                {
                    question: 'What does "terraform plan" do?',
                    options: ['Applies changes', 'Shows proposed changes', 'Destroys resources', 'Initializes modules'],
                    correct: 1
                },
                {
                    question: 'What is a Terraform module?',
                    options: ['A single resource', 'A container for reusable resources', 'A variable', 'A provider'],
                    correct: 1
                }
            ],
            codebase: [
                {
                    title: 'AWS VPC Module',
                    filename: 'main.tf',
                    language: 'hcl',
                    description: 'Complete Terraform configuration for AWS VPC with modules',
                    code: `terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "\${var.project}-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = var.environment != "production"

  tags = {
    Project = var.project
  }
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "19.0.0"

  cluster_name    = "\${var.project}-cluster"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    default = {
      min_size     = 2
      max_size     = 10
      desired_size = 3
      instance_types = ["t3.medium"]
    }
  }
}`
                },
                {
                    title: 'Variables & Outputs',
                    filename: 'variables.tf',
                    language: 'hcl',
                    description: 'Terraform variables with validation and outputs',
                    code: `# variables.tf
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "project" {
  description = "Project name"
  type        = string
}

variable "instance_config" {
  description = "EC2 instance configuration"
  type = object({
    instance_type = string
    volume_size   = number
    volume_type   = string
  })
  default = {
    instance_type = "t3.micro"
    volume_size   = 20
    volume_type   = "gp3"
  }
}

# outputs.tf
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
  sensitive   = true
}

output "private_subnets" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnets
}`
                },
                {
                    title: 'Terraform Module',
                    filename: 'modules/app/main.tf',
                    language: 'hcl',
                    description: 'Reusable Terraform module for application deployment',
                    code: `# modules/app/main.tf
resource "aws_security_group" "app" {
  name_prefix = "\${var.name}-sg"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [var.alb_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = var.name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([{
    name  = var.name
    image = var.image
    portMappings = [{
      containerPort = var.app_port
      protocol      = "tcp"
    }]
    environment = var.environment_variables
    secrets     = var.secrets
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.app.name
        awslogs-region        = data.aws_region.current.name
        awslogs-stream-prefix = var.name
      }
    }
  }])
}

resource "aws_ecs_service" "app" {
  name            = var.name
  cluster         = var.cluster_id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = var.name
    container_port   = var.app_port
  }
}`
                }
            ]
        },
        {
            id: 'git',
            name: 'Git',
            icon: '📁',
            color: '#f05032',
            flashcards: [
                { term: 'Repository', definition: 'A directory containing your project files and the entire history of changes tracked by Git.' },
                { term: 'Commit', definition: 'A snapshot of changes saved to the repository history with a unique SHA identifier and commit message.' },
                { term: 'Branch', definition: 'An independent line of development allowing you to work on features or fixes without affecting the main codebase.' },
                { term: 'Merge', definition: 'The process of combining changes from different branches into a single branch, integrating separate development efforts.' },
                { term: 'Pull Request', definition: 'A method for submitting contributions where changes are reviewed before being merged into the target branch.' },
                { term: 'Rebase', definition: 'An alternative to merging that applies commits from one branch on top of another, creating a linear history.' },
                { term: 'Git Clone', definition: 'Creates a local copy of a remote repository, including all files, branches, and commit history.' },
                { term: 'Git Stash', definition: 'Temporarily saves changes that are not ready to be committed, allowing you to switch branches cleanly.' }
            ],
            quiz: [
                {
                    question: 'What is a Git commit?',
                    options: ['A branch', 'A snapshot of changes', 'A merge conflict', 'A remote repository'],
                    correct: 1
                },
                {
                    question: 'What is the purpose of a branch in Git?',
                    options: ['Delete history', 'Independent line of development', 'Store backups', 'Connect to remote'],
                    correct: 1
                },
                {
                    question: 'What does git rebase do?',
                    options: ['Deletes commits', 'Applies commits on top of another branch', 'Creates a backup', 'Merges conflicts'],
                    correct: 1
                },
                {
                    question: 'What is a Pull Request?',
                    options: ['Downloading code', 'A method for reviewing and merging changes', 'A type of branch', 'A commit message'],
                    correct: 1
                }
            ],
            codebase: [
                {
                    title: 'Git Workflow Script',
                    filename: 'git-workflow.sh',
                    language: 'bash',
                    description: 'Common Git workflow operations and best practices',
                    code: `#!/bin/bash
# Git Workflow Script

# Feature branch workflow
create_feature() {
    git checkout main
    git pull origin main
    git checkout -b feature/$1
    echo "Created feature branch: feature/$1"
}

# Sync with main
sync_main() {
    git fetch origin
    git rebase origin/main
    echo "Synced with main branch"
}

# Commit with conventional commit format
commit() {
    local type=$1
    local message=$2
    git add -A
    git commit -m "$type: $message"
}

# Interactive rebase to clean up commits
cleanup_commits() {
    local count=\${1:-5}
    git rebase -i HEAD~$count
}

# Push and create PR
push_and_pr() {
    local branch=$(git branch --show-current)
    git push -u origin $branch
    gh pr create --fill
}

# Stash with message
save_work() {
    git stash push -m "$1"
}

# Usage examples:
# create_feature "add-login"
# commit "feat" "add user authentication"
# commit "fix" "resolve login bug"
# sync_main
# push_and_pr`
                },
                {
                    title: '.gitconfig',
                    filename: '.gitconfig',
                    language: 'ini',
                    description: 'Git configuration with useful aliases and settings',
                    code: `[user]
    name = Your Name
    email = your.email@example.com

[core]
    editor = vim
    autocrlf = input
    excludesfile = ~/.gitignore_global

[init]
    defaultBranch = main

[pull]
    rebase = true

[fetch]
    prune = true

[alias]
    st = status -sb
    co = checkout
    br = branch
    ci = commit
    lg = log --oneline --graph --decorate -20
    ll = log --pretty=format:'%C(yellow)%h%Creset %s %C(blue)<%an>%Creset %C(green)(%cr)%Creset' -20
    unstage = reset HEAD --
    last = log -1 HEAD --stat
    amend = commit --amend --no-edit
    undo = reset --soft HEAD^
    stash-all = stash save --include-untracked
    aliases = config --get-regexp alias
    branches = branch -a
    remotes = remote -v
    contributors = shortlog -sn
    today = log --since=midnight --author='Your Name' --oneline

[color]
    ui = auto

[merge]
    conflictstyle = diff3
    tool = vscode

[diff]
    colorMoved = zebra

[credential]
    helper = cache --timeout=3600`
                },
                {
                    title: 'Pre-commit Hooks',
                    filename: '.pre-commit-config.yaml',
                    language: 'yaml',
                    description: 'Pre-commit hooks for code quality',
                    code: `repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-added-large-files
        args: ['--maxkb=1000']
      - id: detect-private-key
      - id: check-merge-conflict

  - repo: https://github.com/psf/black
    rev: 24.1.0
    hooks:
      - id: black

  - repo: https://github.com/pycqa/flake8
    rev: 7.0.0
    hooks:
      - id: flake8
        args: ['--max-line-length=100']

  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.56.0
    hooks:
      - id: eslint
        files: \\.[jt]sx?$
        types: [file]
        additional_dependencies:
          - eslint@8.56.0
          - eslint-config-prettier@9.1.0

  - repo: https://github.com/hadolint/hadolint
    rev: v2.12.0
    hooks:
      - id: hadolint-docker`
                }
            ]
        },
        {
            id: 'linux',
            name: 'Linux',
            icon: '🐧',
            color: '#fcc624',
            flashcards: [
                { term: 'Shell', definition: 'A command-line interface that interprets user commands and communicates with the operating system kernel.' },
                { term: 'Bash', definition: 'Bourne Again SHell - The most common shell on Linux systems, used for command-line operations and scripting.' },
                { term: 'sudo', definition: 'A command that allows users to run programs with the security privileges of another user, typically root.' },
                { term: 'chmod', definition: 'A command to change file access permissions, controlling read, write, and execute rights for users.' },
                { term: 'grep', definition: 'A command-line utility for searching plain-text data for lines matching a regular expression or pattern.' },
                { term: 'SSH', definition: 'Secure Shell - A cryptographic network protocol for secure communication and remote server access.' },
                { term: 'systemd', definition: 'A system and service manager for Linux, responsible for initializing and managing system services.' },
                { term: 'Package Manager', definition: 'Tools like apt, yum, or dnf that automate installing, updating, configuring, and removing software packages.' },
                { term: 'Cron', definition: 'A time-based job scheduler that runs commands or scripts automatically at specified times or intervals.' },
                { term: 'File Permissions', definition: 'Linux uses read (r), write (w), and execute (x) permissions for owner, group, and others to control access.' }
            ],
            quiz: [
                {
                    question: 'What is the purpose of the sudo command?',
                    options: ['List files', 'Run commands as another user (typically root)', 'Search for text', 'Change directories'],
                    correct: 1
                },
                {
                    question: 'Which command is used to change file permissions?',
                    options: ['chown', 'chmod', 'chgrp', 'chperm'],
                    correct: 1
                },
                {
                    question: 'What does SSH stand for?',
                    options: ['Simple Shell Handler', 'Secure Shell', 'System Shell Host', 'Super Secure Handler'],
                    correct: 1
                },
                {
                    question: 'What is systemd used for?',
                    options: ['File editing', 'System and service management', 'Network configuration', 'User authentication'],
                    correct: 1
                },
                {
                    question: 'What does grep do?',
                    options: ['Manages packages', 'Searches for text patterns', 'Compresses files', 'Creates directories'],
                    correct: 1
                }
            ],
            codebase: [
                {
                    title: 'Bash Script Template',
                    filename: 'script-template.sh',
                    language: 'bash',
                    description: 'Professional bash script template with error handling and logging',
                    code: `#!/bin/bash
set -euo pipefail
IFS=$'\\n\\t'

# Script configuration
readonly SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_NAME="$(basename "\${BASH_SOURCE[0]}")"
readonly LOG_FILE="/var/log/\${SCRIPT_NAME%.sh}.log"

# Colors for output
readonly RED='\\033[0;31m'
readonly GREEN='\\033[0;32m'
readonly YELLOW='\\033[1;33m'
readonly NC='\\033[0m'

# Logging functions
log() { echo -e "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $*" | tee -a "\$LOG_FILE"; }
warn() { echo -e "$(date '+%Y-%m-%d %H:%M:%S') \${YELLOW}[WARN]\${NC} $*" | tee -a "\$LOG_FILE"; }
error() { echo -e "$(date '+%Y-%m-%d %H:%M:%S') \${RED}[ERROR]\${NC} $*" | tee -a "\$LOG_FILE" >&2; }
success() { echo -e "$(date '+%Y-%m-%d %H:%M:%S') \${GREEN}[OK]\${NC} $*" | tee -a "\$LOG_FILE"; }

# Cleanup function
cleanup() {
    local exit_code=$?
    log "Cleaning up..."
    # Add cleanup tasks here
    exit \$exit_code
}
trap cleanup EXIT

# Check if running as root
check_root() {
    if [[ \$EUID -ne 0 ]]; then
        error "This script must be run as root"
        exit 1
    fi
}

# Usage function
usage() {
    cat << EOF
Usage: \$SCRIPT_NAME [OPTIONS]

Options:
    -h, --help      Show this help message
    -v, --verbose   Enable verbose output
    -d, --dry-run   Dry run mode

Examples:
    \$SCRIPT_NAME --verbose
    \$SCRIPT_NAME --dry-run
EOF
}

# Parse arguments
parse_args() {
    while [[ \$# -gt 0 ]]; do
        case \$1 in
            -h|--help) usage; exit 0 ;;
            -v|--verbose) VERBOSE=true ;;
            -d|--dry-run) DRY_RUN=true ;;
            *) error "Unknown option: \$1"; usage; exit 1 ;;
        esac
        shift
    done
}

# Main function
main() {
    log "Starting \$SCRIPT_NAME..."
    parse_args "\$@"
    
    # Your script logic here
    
    success "Script completed successfully"
}

main "\$@"`
                },
                {
                    title: 'Systemd Service Unit',
                    filename: 'myapp.service',
                    language: 'ini',
                    description: 'Systemd service unit file for application management',
                    code: `[Unit]
Description=My Application Service
Documentation=https://docs.example.com
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=appuser
Group=appgroup
WorkingDirectory=/opt/myapp
Environment="NODE_ENV=production"
Environment="PORT=3000"
EnvironmentFile=-/etc/myapp/env

ExecStartPre=/usr/bin/npm run migrate
ExecStart=/usr/bin/node /opt/myapp/server.js
ExecReload=/bin/kill -HUP $MAINPID
ExecStop=/bin/kill -TERM $MAINPID

Restart=always
RestartSec=10
TimeoutStartSec=30
TimeoutStopSec=30

StandardOutput=journal
StandardError=journal
SyslogIdentifier=myapp

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/myapp/data /var/log/myapp

[Install]
WantedBy=multi-user.target`
                },
                {
                    title: 'Server Setup Script',
                    filename: 'server-setup.sh',
                    language: 'bash',
                    description: 'Initial server setup and hardening script',
                    code: `#!/bin/bash
set -euo pipefail

# Update system
apt-get update && apt-get upgrade -y

# Install essential packages
apt-get install -y \\
    curl wget git vim htop \\
    ufw fail2ban \\
    unattended-upgrades \\
    apt-transport-https ca-certificates

# Create application user
useradd -m -s /bin/bash -G sudo appuser

# Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Configure fail2ban
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
EOF
systemctl enable fail2ban
systemctl start fail2ban

# SSH hardening
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# Enable automatic updates
dpkg-reconfigure -plow unattended-upgrades

echo "Server setup complete!"`
                }
            ]
        },
        {
            id: 'monitoring',
            name: 'Monitoring',
            icon: '📊',
            color: '#00c853',
            flashcards: [
                { term: 'Prometheus', definition: 'An open-source monitoring and alerting toolkit designed for reliability, using a pull-based model and time-series database.' },
                { term: 'Grafana', definition: 'An open-source analytics and visualization platform for monitoring data, creating dashboards from various data sources.' },
                { term: 'Metrics', definition: 'Numerical measurements collected over time like CPU usage, memory consumption, request latency, and error rates.' },
                { term: 'Logging', definition: 'The practice of recording events and messages from applications and systems for debugging, auditing, and analysis.' },
                { term: 'Alerting', definition: 'Automated notifications triggered when metrics exceed thresholds, enabling quick response to issues.' },
                { term: 'APM', definition: 'Application Performance Monitoring - Tools that track application performance, errors, and user experience.' },
                { term: 'ELK Stack', definition: 'Elasticsearch, Logstash, and Kibana - A popular stack for log aggregation, search, and visualization.' },
                { term: 'SLI/SLO/SLA', definition: 'Service Level Indicator (metric), Objective (target), and Agreement (contract) - Key concepts for reliability measurement.' }
            ],
            commands: [
                { command: 'prometheus --config.file=prometheus.yml', description: 'Start Prometheus with config' },
                { command: 'curl localhost:9090/metrics', description: 'View Prometheus metrics endpoint' },
                { command: 'grafana-server', description: 'Start Grafana server' },
                { command: 'journalctl -u service-name -f', description: 'Follow systemd service logs' },
                { command: 'tail -f /var/log/syslog', description: 'Follow system logs' }
            ],
            quiz: [
                { question: 'What is Prometheus primarily used for?', options: ['Log management', 'Monitoring and alerting', 'Container orchestration', 'Configuration management'], correct: 1 },
                { question: 'What does Grafana help you create?', options: ['Containers', 'Alerts', 'Visualization dashboards', 'Logs'], correct: 2 },
                { question: 'What does ELK stand for?', options: ['Elastic, Lambda, Kubernetes', 'Elasticsearch, Logstash, Kibana', 'Event, Log, Key', 'External Load Keeper'], correct: 1 },
                { question: 'What is an SLO?', options: ['Service Level Output', 'Service Level Objective', 'System Log Observer', 'Server Load Optimizer'], correct: 1 }
            ],
            codebase: [
                {
                    title: 'Prometheus Configuration',
                    filename: 'prometheus.yml',
                    language: 'yaml',
                    description: 'Prometheus server configuration with scrape targets and alerting',
                    code: `global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - '/etc/prometheus/rules/*.yml'

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)

  - job_name: 'application'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['app:8080']
        labels:
          environment: 'production'
          service: 'myapp'`
                },
                {
                    title: 'Alerting Rules',
                    filename: 'alerts.yml',
                    language: 'yaml',
                    description: 'Prometheus alerting rules for common scenarios',
                    code: `groups:
  - name: application
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ \$value | humanizePercentage }} for {{ \$labels.instance }}"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "P95 latency is {{ \$value }}s"

  - name: infrastructure
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ \$labels.instance }}"

      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ \$labels.instance }}"

      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Low disk space on {{ \$labels.instance }}"`
                },
                {
                    title: 'Grafana Dashboard JSON',
                    filename: 'dashboard.json',
                    language: 'json',
                    description: 'Grafana dashboard for application monitoring',
                    code: `{
  "dashboard": {
    "title": "Application Overview",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "gridPos": {"x": 0, "y": 0, "w": 12, "h": 8},
        "targets": [{
          "expr": "sum(rate(http_requests_total[5m])) by (status)",
          "legendFormat": "{{status}}"
        }]
      },
      {
        "title": "Response Time (P95)",
        "type": "gauge",
        "gridPos": {"x": 12, "y": 0, "w": 6, "h": 8},
        "targets": [{
          "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))"
        }],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "thresholds": {
              "steps": [
                {"value": 0, "color": "green"},
                {"value": 0.3, "color": "yellow"},
                {"value": 0.5, "color": "red"}
              ]
            }
          }
        }
      },
      {
        "title": "Error Rate",
        "type": "stat",
        "gridPos": {"x": 18, "y": 0, "w": 6, "h": 8},
        "targets": [{
          "expr": "sum(rate(http_requests_total{status=~'5..'}[5m])) / sum(rate(http_requests_total[5m])) * 100"
        }],
        "fieldConfig": {
          "defaults": {
            "unit": "percent"
          }
        }
      }
    ]
  }
}`
                }
            ]
        },
        {
            id: 'ansible',
            name: 'Ansible',
            icon: '🔧',
            color: '#ee0000',
            flashcards: [
                { term: 'Playbook', definition: 'A YAML file containing a series of plays that define automation tasks to be executed on managed hosts.' },
                { term: 'Inventory', definition: 'A file listing managed hosts and groups, defining which systems Ansible will manage and how to connect.' },
                { term: 'Role', definition: 'A reusable, self-contained collection of tasks, handlers, variables, and files organized in a defined structure.' },
                { term: 'Task', definition: 'A single unit of work in Ansible, calling a module with specific arguments to perform an action.' },
                { term: 'Module', definition: 'Reusable scripts that Ansible runs on managed nodes to perform specific tasks like copying files or installing packages.' },
                { term: 'Handler', definition: 'A special task that only runs when notified by another task, commonly used for service restarts.' },
                { term: 'Vault', definition: 'Ansible feature for encrypting sensitive data like passwords and keys within playbooks and files.' },
                { term: 'Galaxy', definition: 'A hub for finding, sharing, and downloading community-created Ansible roles and collections.' }
            ],
            commands: [
                { command: 'ansible-playbook site.yml', description: 'Run a playbook' },
                { command: 'ansible all -m ping', description: 'Ping all hosts' },
                { command: 'ansible-vault encrypt file.yml', description: 'Encrypt a file' },
                { command: 'ansible-galaxy install role', description: 'Install a role from Galaxy' },
                { command: 'ansible-inventory --list', description: 'List inventory hosts' }
            ],
            quiz: [
                { question: 'What file format does Ansible use for playbooks?', options: ['JSON', 'YAML', 'XML', 'INI'], correct: 1 },
                { question: 'What is an Ansible role?', options: ['A user account', 'Reusable collection of tasks', 'A network configuration', 'A container'], correct: 1 },
                { question: 'What is Ansible Vault used for?', options: ['Storage', 'Encrypting sensitive data', 'Container management', 'Load balancing'], correct: 1 },
                { question: 'How does Ansible connect to managed hosts by default?', options: ['HTTP', 'SSH', 'RDP', 'FTP'], correct: 1 }
            ],
            codebase: [
                {
                    title: 'Ansible Playbook',
                    filename: 'site.yml',
                    language: 'yaml',
                    description: 'Main playbook for deploying a web application',
                    code: `---
- name: Deploy Web Application
  hosts: webservers
  become: yes
  vars_files:
    - vars/main.yml
    - vars/secrets.yml

  pre_tasks:
    - name: Update apt cache
      apt:
        update_cache: yes
        cache_valid_time: 3600

  roles:
    - common
    - nginx
    - nodejs
    - app

  tasks:
    - name: Ensure app directory exists
      file:
        path: "{{ app_dir }}"
        state: directory
        owner: "{{ app_user }}"
        mode: '0755'

    - name: Deploy application code
      git:
        repo: "{{ git_repo }}"
        dest: "{{ app_dir }}"
        version: "{{ git_branch }}"
      notify: Restart application

    - name: Install dependencies
      npm:
        path: "{{ app_dir }}"
        state: present

    - name: Configure environment
      template:
        src: templates/env.j2
        dest: "{{ app_dir }}/.env"
        mode: '0600'
      notify: Restart application

  handlers:
    - name: Restart application
      systemd:
        name: myapp
        state: restarted
        enabled: yes`
                },
                {
                    title: 'Ansible Role Structure',
                    filename: 'roles/app/tasks/main.yml',
                    language: 'yaml',
                    description: 'Tasks file for application role',
                    code: `---
- name: Create application user
  user:
    name: "{{ app_user }}"
    shell: /bin/bash
    home: "/home/{{ app_user }}"
    create_home: yes

- name: Install application dependencies
  apt:
    name:
      - nodejs
      - npm
      - build-essential
    state: present

- name: Create application directories
  file:
    path: "{{ item }}"
    state: directory
    owner: "{{ app_user }}"
    group: "{{ app_user }}"
    mode: '0755'
  loop:
    - "{{ app_dir }}"
    - "{{ app_dir }}/logs"
    - "{{ app_dir }}/data"

- name: Copy systemd service file
  template:
    src: app.service.j2
    dest: /etc/systemd/system/myapp.service
  notify:
    - Reload systemd
    - Restart application

- name: Ensure application is running
  systemd:
    name: myapp
    state: started
    enabled: yes`
                },
                {
                    title: 'Ansible Inventory',
                    filename: 'inventory/production.yml',
                    language: 'yaml',
                    description: 'Dynamic inventory file for production environment',
                    code: `---
all:
  vars:
    ansible_user: deploy
    ansible_ssh_private_key_file: ~/.ssh/deploy_key
    ansible_python_interpreter: /usr/bin/python3

  children:
    webservers:
      hosts:
        web1.example.com:
          nginx_worker_processes: 4
        web2.example.com:
          nginx_worker_processes: 4
      vars:
        app_port: 3000
        nginx_enabled: true

    databases:
      hosts:
        db1.example.com:
          postgres_max_connections: 200
        db2.example.com:
          postgres_max_connections: 200
          postgres_role: replica
      vars:
        postgres_version: 15

    cache:
      hosts:
        redis1.example.com:
        redis2.example.com:
      vars:
        redis_maxmemory: 2gb

    loadbalancers:
      hosts:
        lb1.example.com:
      vars:
        haproxy_enabled: true`
                }
            ]
        },
        {
            id: 'azure',
            name: 'Azure',
            icon: '🔷',
            color: '#0078d4',
            flashcards: [
                { term: 'Azure Resource Manager', definition: 'The deployment and management service for Azure, providing a management layer for creating, updating, and deleting resources.' },
                { term: 'Azure Functions', definition: 'A serverless compute service that lets you run event-triggered code without managing infrastructure.' },
                { term: 'Azure Kubernetes Service', definition: 'A managed Kubernetes container orchestration service to deploy and manage containerized applications.' },
                { term: 'Azure DevOps', definition: 'A set of development tools for software teams including pipelines, repos, boards, and artifacts.' },
                { term: 'Azure Blob Storage', definition: 'Object storage solution for storing massive amounts of unstructured data like text or binary data.' },
                { term: 'Azure Virtual Network', definition: 'A logically isolated network in Azure for securely connecting Azure resources to each other and to on-premises.' },
                { term: 'Azure Active Directory', definition: 'A cloud-based identity and access management service for signing in and accessing resources.' },
                { term: 'Azure Container Registry', definition: 'A managed Docker registry service for storing and managing container images.' }
            ],
            commands: [
                { command: 'az login', description: 'Login to Azure CLI' },
                { command: 'az group create -n mygroup -l eastus', description: 'Create a resource group' },
                { command: 'az aks get-credentials -n cluster -g group', description: 'Get AKS credentials' },
                { command: 'az vm list -o table', description: 'List VMs in table format' },
                { command: 'az acr build -t image:tag -r registry .', description: 'Build container in ACR' }
            ],
            quiz: [
                { question: 'What is Azure Functions?', options: ['Database service', 'Serverless compute', 'Container service', 'Storage service'], correct: 1 },
                { question: 'What is AKS?', options: ['Azure Key Storage', 'Azure Kubernetes Service', 'Azure Knowledge System', 'Azure Kernel Service'], correct: 1 },
                { question: 'What is Azure Blob Storage used for?', options: ['Relational data', 'Unstructured data', 'Real-time streams', 'Container images'], correct: 1 },
                { question: 'What is Azure DevOps?', options: ['A programming language', 'Development tools suite', 'A database', 'A container runtime'], correct: 1 }
            ],
            codebase: [
                {
                    title: 'Azure DevOps Pipeline',
                    filename: 'azure-pipelines.yml',
                    language: 'yaml',
                    description: 'Azure DevOps CI/CD pipeline with multi-stage deployment',
                    code: `trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: production-secrets
  - name: imageRepository
    value: 'myapp'
  - name: dockerfilePath
    value: '$(Build.SourcesDirectory)/Dockerfile'

stages:
  - stage: Build
    jobs:
      - job: BuildAndTest
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'
          
          - script: |
              npm ci
              npm run lint
              npm test -- --coverage
            displayName: 'Install and Test'
          
          - task: Docker@2
            displayName: 'Build and Push Image'
            inputs:
              containerRegistry: 'acr-connection'
              repository: $(imageRepository)
              command: 'buildAndPush'
              Dockerfile: $(dockerfilePath)
              tags: |
                $(Build.BuildId)
                latest

  - stage: DeployStaging
    dependsOn: Build
    condition: succeeded()
    jobs:
      - deployment: DeployToStaging
        environment: staging
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebAppContainer@1
                  inputs:
                    azureSubscription: 'azure-connection'
                    appName: 'myapp-staging'
                    imageName: '$(containerRegistry)/$(imageRepository):$(Build.BuildId)'

  - stage: DeployProduction
    dependsOn: DeployStaging
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: DeployToProduction
        environment: production
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebAppContainer@1
                  inputs:
                    azureSubscription: 'azure-connection'
                    appName: 'myapp-production'
                    imageName: '$(containerRegistry)/$(imageRepository):$(Build.BuildId)'`
                },
                {
                    title: 'ARM Template',
                    filename: 'azuredeploy.json',
                    language: 'json',
                    description: 'Azure Resource Manager template for web app deployment',
                    code: `{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "appName": {
      "type": "string",
      "metadata": {
        "description": "Name of the web app"
      }
    },
    "location": {
      "type": "string",
      "defaultValue": "[resourceGroup().location]"
    },
    "sku": {
      "type": "string",
      "defaultValue": "P1v3",
      "allowedValues": ["F1", "B1", "P1v3", "P2v3"]
    }
  },
  "resources": [
    {
      "type": "Microsoft.Web/serverfarms",
      "apiVersion": "2022-03-01",
      "name": "[concat(parameters('appName'), '-plan')]",
      "location": "[parameters('location')]",
      "sku": {
        "name": "[parameters('sku')]"
      },
      "kind": "linux",
      "properties": {
        "reserved": true
      }
    },
    {
      "type": "Microsoft.Web/sites",
      "apiVersion": "2022-03-01",
      "name": "[parameters('appName')]",
      "location": "[parameters('location')]",
      "dependsOn": [
        "[resourceId('Microsoft.Web/serverfarms', concat(parameters('appName'), '-plan'))]"
      ],
      "properties": {
        "serverFarmId": "[resourceId('Microsoft.Web/serverfarms', concat(parameters('appName'), '-plan'))]",
        "siteConfig": {
          "linuxFxVersion": "NODE|20-lts",
          "alwaysOn": true
        },
        "httpsOnly": true
      }
    }
  ],
  "outputs": {
    "appUrl": {
      "type": "string",
      "value": "[concat('https://', parameters('appName'), '.azurewebsites.net')]"
    }
  }
}`
                }
            ]
        },
        {
            id: 'devsecops',
            name: 'DevSecOps',
            icon: '🔒',
            color: '#dc2626',
            flashcards: [
                { term: 'Shift Left Security', definition: 'The practice of integrating security earlier in the software development lifecycle rather than at the end.' },
                { term: 'SAST', definition: 'Static Application Security Testing - Analyzing source code for security vulnerabilities without executing the program.' },
                { term: 'DAST', definition: 'Dynamic Application Security Testing - Testing running applications to find vulnerabilities by simulating attacks.' },
                { term: 'Container Scanning', definition: 'Analyzing container images for known vulnerabilities in OS packages and application dependencies.' },
                { term: 'Secret Management', definition: 'Securely storing, distributing, and rotating sensitive data like API keys, passwords, and certificates.' },
                { term: 'OWASP Top 10', definition: 'A standard awareness document listing the most critical security risks to web applications.' },
                { term: 'Dependency Scanning', definition: 'Automated checking of third-party libraries and dependencies for known security vulnerabilities.' },
                { term: 'Infrastructure Scanning', definition: 'Analyzing IaC templates and cloud configurations for security misconfigurations and compliance issues.' }
            ],
            commands: [
                { command: 'trivy image myimage:tag', description: 'Scan container for vulnerabilities' },
                { command: 'snyk test', description: 'Test project dependencies for vulnerabilities' },
                { command: 'gitleaks detect', description: 'Detect secrets in git repos' },
                { command: 'checkov -f main.tf', description: 'Scan Terraform for misconfigurations' },
                { command: 'tfsec .', description: 'Security scanner for Terraform' }
            ],
            quiz: [
                { question: 'What does "Shift Left" mean in DevSecOps?', options: ['Move to cloud', 'Integrate security early', 'Use left-aligned code', 'Deploy faster'], correct: 1 },
                { question: 'What is SAST?', options: ['Simple Auth Service', 'Static Application Security Testing', 'Server Authentication', 'System Admin Tool'], correct: 1 },
                { question: 'What does Trivy scan for?', options: ['Performance issues', 'Container vulnerabilities', 'Network traffic', 'User activity'], correct: 1 },
                { question: 'What is the OWASP Top 10?', options: ['Best frameworks', 'Critical web security risks', 'Programming languages', 'Cloud providers'], correct: 1 }
            ],
            codebase: [
                {
                    title: 'Security Scanning Pipeline',
                    filename: '.github/workflows/security.yml',
                    language: 'yaml',
                    description: 'GitHub Actions workflow for comprehensive security scanning',
                    code: `name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: p/owasp-top-ten

  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build image
        run: docker build -t myapp:test .
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'myapp:test'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Detect secrets with Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

  iac-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Checkov
        uses: bridgecrewio/checkov-action@master
        with:
          directory: terraform/
          framework: terraform`
                },
                {
                    title: 'Trivy Configuration',
                    filename: 'trivy.yaml',
                    language: 'yaml',
                    description: 'Trivy scanner configuration for container security',
                    code: `# trivy.yaml - Trivy configuration file
severity:
  - CRITICAL
  - HIGH
  - MEDIUM

vuln-type:
  - os
  - library

ignore-unfixed: true

exit-code: 1

format: table

# Ignore specific CVEs if needed
ignorefile: .trivyignore

# Scan configuration
scan:
  # Skip directories
  skip-dirs:
    - node_modules
    - vendor
    - .git
  
  # Security checks to enable
  security-checks:
    - vuln
    - config
    - secret

# Misconfig scanning options
misconfiguration:
  # Policy paths
  policy-paths:
    - ./policies
  
  # Include successes in report
  include-successes: false

# Cache settings
cache:
  dir: /tmp/trivy-cache
  clear: false`
                },
                {
                    title: 'OWASP Security Headers',
                    filename: 'security-headers.conf',
                    language: 'nginx',
                    description: 'Nginx security headers configuration following OWASP guidelines',
                    code: `# Security Headers Configuration

# Prevent clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# Prevent MIME type sniffing
add_header X-Content-Type-Options "nosniff" always;

# Enable XSS filter
add_header X-XSS-Protection "1; mode=block" always;

# Referrer policy
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.example.com; frame-ancestors 'self';" always;

# Permissions Policy
add_header Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()" always;

# HSTS - Strict Transport Security
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Remove server header
server_tokens off;

# SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_prefer_server_ciphers off;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_stapling on;
ssl_stapling_verify on;`
                }
            ]
        },
        {
            id: 'networking',
            name: 'Networking',
            icon: '🌐',
            color: '#0891b2',
            flashcards: [
                { term: 'TCP/IP', definition: 'The fundamental communication protocol suite of the internet, providing end-to-end data communication.' },
                { term: 'DNS', definition: 'Domain Name System - Translates human-readable domain names to IP addresses that computers use.' },
                { term: 'Load Balancer', definition: 'Distributes incoming network traffic across multiple servers to ensure availability and reliability.' },
                { term: 'Reverse Proxy', definition: 'A server that sits in front of web servers, forwarding client requests to appropriate backend servers.' },
                { term: 'CIDR', definition: 'Classless Inter-Domain Routing - A method for allocating IP addresses and IP routing.' },
                { term: 'SSL/TLS', definition: 'Cryptographic protocols providing secure communication over a computer network through encryption.' },
                { term: 'Firewall', definition: 'A network security system that monitors and controls incoming and outgoing network traffic.' },
                { term: 'NAT', definition: 'Network Address Translation - Maps private IP addresses to public IP addresses for internet access.' }
            ],
            commands: [
                { command: 'curl -v https://example.com', description: 'Make HTTP request with verbose output' },
                { command: 'nslookup domain.com', description: 'Query DNS for domain' },
                { command: 'netstat -tulpn', description: 'Show listening ports' },
                { command: 'traceroute example.com', description: 'Trace packet route to host' },
                { command: 'ss -tunlp', description: 'Show socket statistics' }
            ],
            quiz: [
                { question: 'What does DNS translate?', options: ['IP to MAC', 'Domain names to IPs', 'Ports to services', 'HTTP to HTTPS'], correct: 1 },
                { question: 'What is a load balancer used for?', options: ['Encryption', 'Distributing traffic', 'DNS resolution', 'File storage'], correct: 1 },
                { question: 'What does CIDR stand for?', options: ['Cloud Internet Domain Routing', 'Classless Inter-Domain Routing', 'Central IP Data Registry', 'Cluster IP Distribution Rule'], correct: 1 },
                { question: 'What does NAT do?', options: ['Encrypts traffic', 'Maps private to public IPs', 'Balances load', 'Resolves DNS'], correct: 1 }
            ],
            codebase: [
                {
                    title: 'Nginx Reverse Proxy',
                    filename: 'nginx.conf',
                    language: 'nginx',
                    description: 'Nginx configuration for reverse proxy with load balancing',
                    code: `upstream backend {
    least_conn;
    server app1:3000 weight=3;
    server app2:3000 weight=2;
    server app3:3000 backup;
    
    keepalive 32;
}

server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/ssl/certs/example.com.crt;
    ssl_certificate_key /etc/ssl/private/example.com.key;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Proxy settings
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location /static/ {
        alias /var/www/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK";
    }
}`
                },
                {
                    title: 'HAProxy Configuration',
                    filename: 'haproxy.cfg',
                    language: 'haproxy',
                    description: 'HAProxy load balancer configuration with health checks',
                    code: `global
    log stdout format raw local0
    maxconn 4096
    tune.ssl.default-dh-param 2048

defaults
    mode http
    log global
    option httplog
    option dontlognull
    option http-server-close
    option forwardfor except 127.0.0.0/8
    option redispatch
    retries 3
    timeout connect 5s
    timeout client 30s
    timeout server 30s
    timeout http-keep-alive 10s
    timeout check 5s

frontend http_front
    bind *:80
    redirect scheme https code 301 if !{ ssl_fc }

frontend https_front
    bind *:443 ssl crt /etc/ssl/certs/combined.pem
    
    # ACLs for routing
    acl is_api path_beg /api
    acl is_ws hdr(Upgrade) -i websocket
    
    use_backend api_servers if is_api
    use_backend ws_servers if is_ws
    default_backend web_servers

backend web_servers
    balance roundrobin
    option httpchk GET /health
    http-check expect status 200
    
    server web1 10.0.1.10:3000 check inter 5s fall 3 rise 2
    server web2 10.0.1.11:3000 check inter 5s fall 3 rise 2
    server web3 10.0.1.12:3000 check inter 5s fall 3 rise 2 backup

backend api_servers
    balance leastconn
    option httpchk GET /api/health
    
    server api1 10.0.2.10:8080 check
    server api2 10.0.2.11:8080 check

backend ws_servers
    balance source
    server ws1 10.0.3.10:9000 check
    server ws2 10.0.3.11:9000 check

listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 10s
    stats admin if LOCALHOST`
                },
                {
                    title: 'iptables Firewall Rules',
                    filename: 'firewall.sh',
                    language: 'bash',
                    description: 'Linux iptables firewall configuration script',
                    code: `#!/bin/bash
# Firewall configuration script

# Flush existing rules
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X

# Set default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Allow established connections
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow SSH (rate limited)
iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -m limit --limit 3/min --limit-burst 3 -j ACCEPT

# Allow HTTP/HTTPS
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow ping (limited)
iptables -A INPUT -p icmp --icmp-type echo-request -m limit --limit 1/s --limit-burst 4 -j ACCEPT

# Drop invalid packets
iptables -A INPUT -m conntrack --ctstate INVALID -j DROP

# Log dropped packets
iptables -A INPUT -j LOG --log-prefix "DROPPED: " --log-level 4

# Save rules
iptables-save > /etc/iptables/rules.v4

echo "Firewall rules applied"`
                }
            ]
        }
    ]
};

// Application State
let state = {
    currentTopic: null,
    currentView: 'welcome',
    currentTab: 'flashcards',
    currentCardIndex: 0,
    currentQuestionIndex: 0,
    quizScore: 0,
    quizAnswered: false,
    isCardFlipped: false,
    progress: {}
};

// Load progress from localStorage
function loadProgress() {
    const saved = localStorage.getItem('devops-mastery-progress');
    if (saved) {
        state.progress = JSON.parse(saved);
    } else {
        // Initialize progress for all topics
        devopsData.topics.forEach(topic => {
            state.progress[topic.id] = {
                flashcardsViewed: [],
                quizBestScore: 0,
                quizAttempts: 0
            };
        });
    }
}

// Save progress to localStorage
function saveProgress() {
    localStorage.setItem('devops-mastery-progress', JSON.stringify(state.progress));
    updateHeaderStats();
}

// Calculate overall progress
function calculateOverallProgress() {
    let totalCards = 0;
    let viewedCards = 0;

    devopsData.topics.forEach(topic => {
        totalCards += topic.flashcards.length;
        if (state.progress[topic.id]) {
            viewedCards += state.progress[topic.id].flashcardsViewed.length;
        }
    });

    return totalCards > 0 ? Math.round((viewedCards / totalCards) * 100) : 0;
}

// Calculate topic progress
function calculateTopicProgress(topicId) {
    const topic = devopsData.topics.find(t => t.id === topicId);
    if (!topic || !state.progress[topicId]) return 0;

    const cardProgress = (state.progress[topicId].flashcardsViewed.length / topic.flashcards.length) * 50;
    const quizProgress = (state.progress[topicId].quizBestScore / topic.quiz.length) * 50;

    return Math.round(cardProgress + quizProgress);
}

// Update header stats
function updateHeaderStats() {
    const totalProgress = calculateOverallProgress();
    let totalCardsStudied = 0;

    Object.values(state.progress).forEach(p => {
        totalCardsStudied += p.flashcardsViewed.length;
    });

    document.getElementById('totalProgress').textContent = totalProgress + '%';
    document.getElementById('cardsStudied').textContent = totalCardsStudied;
}

// Render sidebar topics
function renderSidebarTopics() {
    const topicList = document.getElementById('topicList');
    topicList.innerHTML = '';

    devopsData.topics.forEach(topic => {
        const progress = calculateTopicProgress(topic.id);
        const li = document.createElement('li');
        li.className = `topic-item ${state.currentTopic?.id === topic.id ? 'active' : ''}`;
        li.style.setProperty('--topic-color', topic.color);
        li.innerHTML = `
            <span class="topic-icon">${topic.icon}</span>
            <span class="topic-name">${topic.name}</span>
            <div class="topic-progress">
                <div class="topic-progress-fill" style="width: ${progress}%"></div>
            </div>
        `;
        li.addEventListener('click', () => selectTopic(topic));
        topicList.appendChild(li);
    });
}

// Render topic grid on welcome screen
function renderTopicGrid() {
    const topicGrid = document.getElementById('topicGrid');
    topicGrid.innerHTML = '';

    devopsData.topics.forEach(topic => {
        const progress = calculateTopicProgress(topic.id);
        const card = document.createElement('div');
        card.className = 'topic-card';
        card.style.setProperty('--card-color', topic.color);
        card.innerHTML = `
            <span class="topic-card-icon">${topic.icon}</span>
            <h3 class="topic-card-name">${topic.name}</h3>
            <div class="topic-card-stats">
                <span>📇 ${topic.flashcards.length} cards</span>
                <span>❓ ${topic.quiz.length} questions</span>
            </div>
            <div class="topic-card-progress">
                <div class="topic-card-progress-fill" style="width: ${progress}%"></div>
            </div>
        `;
        card.addEventListener('click', () => selectTopic(topic));
        topicGrid.appendChild(card);
    });
}

// Select a topic
function selectTopic(topic) {
    state.currentTopic = topic;
    state.currentCardIndex = 0;
    state.currentQuestionIndex = 0;
    state.quizScore = 0;
    state.isCardFlipped = false;

    // Update UI
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('studyArea').classList.remove('hidden');
    document.getElementById('currentTopicIcon').textContent = topic.icon;
    document.getElementById('currentTopicName').textContent = topic.name;

    // Reset to flashcards tab
    state.currentTab = 'flashcards';
    updateTabs();
    renderFlashcard();
    renderSidebarTopics();
}

// Go back to welcome screen
function goBack() {
    state.currentTopic = null;
    state.currentView = 'welcome';

    document.getElementById('welcomeScreen').classList.remove('hidden');
    document.getElementById('studyArea').classList.add('hidden');

    renderSidebarTopics();
}

// Update tabs
function updateTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === state.currentTab);
    });

    const flashcardView = document.getElementById('flashcardView');
    const quizView = document.getElementById('quizView');
    const quizResults = document.getElementById('quizResults');
    const commandsView = document.getElementById('commandsView');
    const matchView = document.getElementById('matchView');
    const codebaseView = document.getElementById('codebaseView');

    flashcardView.classList.toggle('hidden', state.currentTab !== 'flashcards');
    quizView.classList.toggle('hidden', state.currentTab !== 'quiz');
    commandsView.classList.toggle('hidden', state.currentTab !== 'commands');
    matchView.classList.toggle('hidden', state.currentTab !== 'match');
    codebaseView.classList.toggle('hidden', state.currentTab !== 'codebase');
    quizResults.classList.add('hidden');

    if (state.currentTab === 'quiz') {
        state.currentQuestionIndex = 0;
        state.quizScore = 0;
        state.quizAnswered = false;
        renderQuizQuestion();
    }

    if (state.currentTab === 'commands') {
        renderCommands();
    }

    if (state.currentTab === 'match') {
        initMatchGame();
    }

    if (state.currentTab === 'codebase') {
        renderCodebase();
    }
}

// Render codebase examples
function renderCodebase() {
    if (!state.currentTopic) return;

    const codebase = state.currentTopic.codebase || [];
    const codebaseList = document.getElementById('codebaseList');
    codebaseList.innerHTML = '';

    if (codebase.length === 0) {
        codebaseList.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 2rem;">No code examples available for this topic yet.</p>';
        return;
    }

    codebase.forEach((item, index) => {
        const codeItem = document.createElement('div');
        codeItem.className = 'codebase-item';
        codeItem.innerHTML = `
            <div class="codebase-item-header">
                <div class="codebase-item-title">
                    <span class="file-icon">📄</span>
                    <span>${item.title}</span>
                    <span class="file-name">${item.filename}</span>
                </div>
                <span class="codebase-item-badge">${item.language}</span>
            </div>
            <div class="codebase-item-description">${item.description}</div>
            <div class="codebase-item-code">
                <button class="codebase-copy-btn" onclick="copyCodebase(${index})">📋 Copy</button>
                <pre><code>${escapeHtml(item.code)}</code></pre>
            </div>
        `;
        codebaseList.appendChild(codeItem);
    });
}

// Escape HTML for code display
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Copy codebase to clipboard
function copyCodebase(index) {
    const codebase = state.currentTopic.codebase || [];
    if (codebase[index]) {
        navigator.clipboard.writeText(codebase[index].code).then(() => {
            const btns = document.querySelectorAll('.codebase-copy-btn');
            if (btns[index]) {
                const originalText = btns[index].textContent;
                btns[index].textContent = '✓ Copied!';
                setTimeout(() => {
                    btns[index].textContent = originalText;
                }, 1500);
            }
        });
    }
}

// Render commands cheat sheet
function renderCommands() {
    if (!state.currentTopic) return;

    const commands = state.currentTopic.commands || [];
    const commandsList = document.getElementById('commandsList');
    commandsList.innerHTML = '';

    if (commands.length === 0) {
        commandsList.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 2rem;">No commands available for this topic yet.</p>';
        return;
    }

    commands.forEach(cmd => {
        const item = document.createElement('div');
        item.className = 'command-item';
        item.innerHTML = `
            <button class="command-copy-btn" onclick="copyCommand('${cmd.command.replace(/'/g, "\\'")}')">📋 Copy</button>
            <code class="command-code">${cmd.command}</code>
            <p class="command-description">${cmd.description}</p>
        `;
        commandsList.appendChild(item);
    });
}

// Copy command to clipboard
function copyCommand(command) {
    navigator.clipboard.writeText(command).then(() => {
        // Show brief feedback
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 1500);
    });
}

// =====================================================
// Match Game Functions
// =====================================================

let matchState = {
    pairs: [],
    selectedTerm: null,
    matchedPairs: 0,
    attempts: 0,
    startTime: null,
    timerInterval: null
};

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function initMatchGame() {
    if (!state.currentTopic) return;
    
    // Reset match state
    matchState = {
        pairs: [],
        selectedTerm: null,
        matchedPairs: 0,
        attempts: 0,
        startTime: Date.now(),
        timerInterval: null
    };
    
    // Get 6 random flashcards for the game
    const allCards = state.currentTopic.flashcards;
    const shuffledCards = shuffleArray(allCards);
    const gameCards = shuffledCards.slice(0, Math.min(6, allCards.length));
    
    matchState.pairs = gameCards.map((card, index) => ({
        id: index,
        term: card.term,
        definition: card.definition.length > 100 
            ? card.definition.substring(0, 100) + '...' 
            : card.definition,
        matched: false
    }));
    
    // Update UI
    document.getElementById('totalPairs').textContent = matchState.pairs.length;
    document.getElementById('matchedPairs').textContent = '0';
    document.getElementById('matchAttempts').textContent = '0';
    document.getElementById('matchComplete').classList.add('hidden');
    
    // Render shuffled terms and definitions
    renderMatchItems();
    
    // Start timer
    if (matchState.timerInterval) clearInterval(matchState.timerInterval);
    matchState.timerInterval = setInterval(updateMatchTimer, 1000);
    updateMatchTimer();
}

function renderMatchItems() {
    const termsContainer = document.getElementById('matchTerms');
    const defsContainer = document.getElementById('matchDefinitions');
    
    // Shuffle terms and definitions separately
    const shuffledTerms = shuffleArray(matchState.pairs);
    const shuffledDefs = shuffleArray(matchState.pairs);
    
    termsContainer.innerHTML = '';
    defsContainer.innerHTML = '';
    
    shuffledTerms.forEach(pair => {
        const item = document.createElement('div');
        item.className = `match-item term ${pair.matched ? 'matched' : ''}`;
        item.dataset.id = pair.id;
        item.dataset.type = 'term';
        item.textContent = pair.term;
        if (!pair.matched) {
            item.addEventListener('click', () => selectMatchItem(item, pair.id, 'term'));
        }
        termsContainer.appendChild(item);
    });
    
    shuffledDefs.forEach(pair => {
        const item = document.createElement('div');
        item.className = `match-item definition ${pair.matched ? 'matched' : ''}`;
        item.dataset.id = pair.id;
        item.dataset.type = 'definition';
        item.textContent = pair.definition;
        if (!pair.matched) {
            item.addEventListener('click', () => selectMatchItem(item, pair.id, 'definition'));
        }
        defsContainer.appendChild(item);
    });
}

function selectMatchItem(element, id, type) {
    if (element.classList.contains('matched')) return;
    
    if (type === 'term') {
        // Deselect previous term if any
        document.querySelectorAll('.match-item.term.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        element.classList.add('selected');
        matchState.selectedTerm = id;
    } else if (type === 'definition' && matchState.selectedTerm !== null) {
        // Check if match
        matchState.attempts++;
        document.getElementById('matchAttempts').textContent = matchState.attempts;
        
        if (matchState.selectedTerm === id) {
            // Correct match!
            matchState.pairs[id].matched = true;
            matchState.matchedPairs++;
            document.getElementById('matchedPairs').textContent = matchState.matchedPairs;
            
            // Mark both items as matched
            document.querySelectorAll(`.match-item[data-id="${id}"]`).forEach(el => {
                el.classList.remove('selected');
                el.classList.add('matched');
            });
            
            matchState.selectedTerm = null;
            
            // Check if game complete
            if (matchState.matchedPairs === matchState.pairs.length) {
                endMatchGame();
            }
        } else {
            // Wrong match - shake animation
            element.classList.add('incorrect');
            const selectedTermEl = document.querySelector(`.match-item.term.selected`);
            if (selectedTermEl) selectedTermEl.classList.add('incorrect');
            
            setTimeout(() => {
                element.classList.remove('incorrect');
                if (selectedTermEl) {
                    selectedTermEl.classList.remove('incorrect', 'selected');
                }
                matchState.selectedTerm = null;
            }, 500);
        }
    }
}

function updateMatchTimer() {
    if (!matchState.startTime) return;
    
    const elapsed = Math.floor((Date.now() - matchState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('matchTimer').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function endMatchGame() {
    clearInterval(matchState.timerInterval);
    
    const elapsed = Math.floor((Date.now() - matchState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    document.getElementById('matchFinalTime').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('matchFinalAttempts').textContent = matchState.attempts;
    document.getElementById('matchComplete').classList.remove('hidden');
}

function restartMatchGame() {
    if (matchState.timerInterval) clearInterval(matchState.timerInterval);
    initMatchGame();
}

// Render flashcard
function renderFlashcard() {
    if (!state.currentTopic) return;

    const cards = state.currentTopic.flashcards;
    const card = cards[state.currentCardIndex];

    document.getElementById('flashcardTerm').textContent = card.term;
    document.getElementById('flashcardDefinition').textContent = card.definition;
    document.getElementById('currentCardNum').textContent = state.currentCardIndex + 1;
    document.getElementById('totalCards').textContent = cards.length;

    // Update progress bar
    const progress = ((state.currentCardIndex + 1) / cards.length) * 100;
    document.getElementById('flashcardProgress').style.width = progress + '%';

    // Reset flip state
    document.getElementById('flashcard').classList.remove('flipped');
    state.isCardFlipped = false;

    // Update button states
    document.getElementById('prevCard').disabled = state.currentCardIndex === 0;
    document.getElementById('nextCard').disabled = state.currentCardIndex === cards.length - 1;

    // Mark as viewed
    markCardViewed(state.currentTopic.id, state.currentCardIndex);
}

// Mark card as viewed
function markCardViewed(topicId, cardIndex) {
    if (!state.progress[topicId]) {
        state.progress[topicId] = { flashcardsViewed: [], quizBestScore: 0, quizAttempts: 0 };
    }

    if (!state.progress[topicId].flashcardsViewed.includes(cardIndex)) {
        state.progress[topicId].flashcardsViewed.push(cardIndex);
        saveProgress();
        renderSidebarTopics();
    }
}

// Flip flashcard
function flipCard() {
    const flashcard = document.getElementById('flashcard');
    flashcard.classList.toggle('flipped');
    state.isCardFlipped = !state.isCardFlipped;
}

// Navigate flashcards
function prevCard() {
    if (state.currentCardIndex > 0) {
        state.currentCardIndex--;
        renderFlashcard();
    }
}

function nextCard() {
    if (state.currentCardIndex < state.currentTopic.flashcards.length - 1) {
        state.currentCardIndex++;
        renderFlashcard();
    }
}

// Render quiz question
function renderQuizQuestion() {
    if (!state.currentTopic) return;

    const questions = state.currentTopic.quiz;
    const question = questions[state.currentQuestionIndex];

    document.getElementById('quizQuestion').textContent = question.question;
    document.getElementById('currentQuestionNum').textContent = state.currentQuestionIndex + 1;
    document.getElementById('totalQuestions').textContent = questions.length;
    document.getElementById('quizScore').textContent = state.quizScore;

    const optionsContainer = document.getElementById('quizOptions');
    optionsContainer.innerHTML = '';

    const letters = ['A', 'B', 'C', 'D'];
    question.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.innerHTML = `
            <span class="option-letter">${letters[index]}</span>
            <span>${option}</span>
        `;
        btn.addEventListener('click', () => selectAnswer(index));
        optionsContainer.appendChild(btn);
    });

    // Update progress bar
    const progress = ((state.currentQuestionIndex + 1) / questions.length) * 100;
    document.getElementById('quizProgress').style.width = progress + '%';

    // Hide feedback and next button
    document.getElementById('quizFeedback').classList.add('hidden');
    document.getElementById('quizNextBtn').classList.add('hidden');
    state.quizAnswered = false;
}

// Select quiz answer
function selectAnswer(selectedIndex) {
    if (state.quizAnswered) return;
    state.quizAnswered = true;

    const question = state.currentTopic.quiz[state.currentQuestionIndex];
    const isCorrect = selectedIndex === question.correct;

    if (isCorrect) {
        state.quizScore++;
        document.getElementById('quizScore').textContent = state.quizScore;
    }

    // Highlight answers
    const options = document.querySelectorAll('.quiz-option');
    options.forEach((opt, index) => {
        opt.disabled = true;
        if (index === question.correct) {
            opt.classList.add('correct');
        } else if (index === selectedIndex && !isCorrect) {
            opt.classList.add('incorrect');
        }
    });

    // Show feedback
    const feedback = document.getElementById('quizFeedback');
    const feedbackText = document.getElementById('feedbackText');
    feedback.classList.remove('hidden', 'correct', 'incorrect');
    feedback.classList.add(isCorrect ? 'correct' : 'incorrect');
    feedbackText.textContent = isCorrect
        ? '✓ Correct! Well done!'
        : `✗ Incorrect. The correct answer is: ${question.options[question.correct]}`;

    // Show next button
    document.getElementById('quizNextBtn').classList.remove('hidden');
}

// Next quiz question
function nextQuizQuestion() {
    if (state.currentQuestionIndex < state.currentTopic.quiz.length - 1) {
        state.currentQuestionIndex++;
        renderQuizQuestion();
    } else {
        showQuizResults();
    }
}

// Show quiz results
function showQuizResults() {
    const quizView = document.getElementById('quizView');
    const quizResults = document.getElementById('quizResults');

    quizView.classList.add('hidden');
    quizResults.classList.remove('hidden');

    const totalQuestions = state.currentTopic.quiz.length;
    const percentage = Math.round((state.quizScore / totalQuestions) * 100);

    document.getElementById('finalScore').textContent = state.quizScore;
    document.getElementById('maxScore').textContent = totalQuestions;
    document.getElementById('resultsPercentage').textContent = percentage + '%';

    // Update icon and title based on score
    const resultsIcon = document.getElementById('resultsIcon');
    const resultsTitle = document.getElementById('resultsTitle');

    if (percentage >= 80) {
        resultsIcon.textContent = '🎉';
        resultsTitle.textContent = 'Excellent Work!';
    } else if (percentage >= 60) {
        resultsIcon.textContent = '👍';
        resultsTitle.textContent = 'Good Job!';
    } else if (percentage >= 40) {
        resultsIcon.textContent = '📚';
        resultsTitle.textContent = 'Keep Studying!';
    } else {
        resultsIcon.textContent = '💪';
        resultsTitle.textContent = 'Practice Makes Perfect!';
    }

    // Update best score
    if (!state.progress[state.currentTopic.id]) {
        state.progress[state.currentTopic.id] = { flashcardsViewed: [], quizBestScore: 0, quizAttempts: 0 };
    }

    if (state.quizScore > state.progress[state.currentTopic.id].quizBestScore) {
        state.progress[state.currentTopic.id].quizBestScore = state.quizScore;
    }
    state.progress[state.currentTopic.id].quizAttempts++;
    saveProgress();
    renderSidebarTopics();
}

// Retry quiz
function retryQuiz() {
    state.currentQuestionIndex = 0;
    state.quizScore = 0;
    state.quizAnswered = false;

    document.getElementById('quizResults').classList.add('hidden');
    document.getElementById('quizView').classList.remove('hidden');
    renderQuizQuestion();
}

// Switch to flashcards from results
function studyCards() {
    state.currentTab = 'flashcards';
    state.currentCardIndex = 0;

    document.getElementById('quizResults').classList.add('hidden');
    updateTabs();
    renderFlashcard();
}

// Search functionality
function handleSearch(event) {
    const query = event.target.value.toLowerCase().trim();

    if (!query) {
        renderTopicGrid();
        return;
    }

    // Search through all topics and cards
    const results = [];
    devopsData.topics.forEach(topic => {
        const topicMatch = topic.name.toLowerCase().includes(query);
        const cardMatches = topic.flashcards.filter(card =>
            card.term.toLowerCase().includes(query) ||
            card.definition.toLowerCase().includes(query)
        );

        if (topicMatch || cardMatches.length > 0) {
            results.push({
                topic,
                matchCount: cardMatches.length + (topicMatch ? 1 : 0)
            });
        }
    });

    // Re-render topic grid with filtered results
    const topicGrid = document.getElementById('topicGrid');
    topicGrid.innerHTML = '';

    if (results.length === 0) {
        topicGrid.innerHTML = '<p style="color: var(--text-tertiary); grid-column: 1/-1; text-align: center; padding: 2rem;">No results found</p>';
        return;
    }

    results.forEach(({ topic }) => {
        const progress = calculateTopicProgress(topic.id);
        const card = document.createElement('div');
        card.className = 'topic-card';
        card.style.setProperty('--card-color', topic.color);
        card.innerHTML = `
            <span class="topic-card-icon">${topic.icon}</span>
            <h3 class="topic-card-name">${topic.name}</h3>
            <div class="topic-card-stats">
                <span>📇 ${topic.flashcards.length} cards</span>
                <span>❓ ${topic.quiz.length} questions</span>
            </div>
            <div class="topic-card-progress">
                <div class="topic-card-progress-fill" style="width: ${progress}%"></div>
            </div>
        `;
        card.addEventListener('click', () => selectTopic(topic));
        topicGrid.appendChild(card);
    });
}

// Initialize app
function init() {
    loadProgress();
    renderSidebarTopics();
    renderTopicGrid();
    updateHeaderStats();

    // Event listeners
    document.getElementById('backBtn').addEventListener('click', goBack);
    document.getElementById('flashcard').addEventListener('click', flipCard);
    document.getElementById('prevCard').addEventListener('click', prevCard);
    document.getElementById('nextCard').addEventListener('click', nextCard);
    document.getElementById('quizNextBtn').addEventListener('click', nextQuizQuestion);
    document.getElementById('retryQuizBtn').addEventListener('click', retryQuiz);
    document.getElementById('studyCardsBtn').addEventListener('click', studyCards);
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('matchRestartBtn').addEventListener('click', restartMatchGame);
    document.getElementById('matchPlayAgainBtn').addEventListener('click', restartMatchGame);

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.currentTab = btn.dataset.tab;
            updateTabs();
            if (state.currentTab === 'flashcards') {
                renderFlashcard();
            }
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!state.currentTopic) return;

        if (state.currentTab === 'flashcards') {
            if (e.key === 'ArrowLeft') prevCard();
            if (e.key === 'ArrowRight') nextCard();
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                flipCard();
            }
        }
    });
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
