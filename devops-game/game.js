/* =====================================================
   DevOps Defender - Game Engine
   ===================================================== */

// Game Configuration
const CONFIG = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 800,
    PLAYER_SPEED: 5,
    ENEMY_SPEED: 1,
    QUESTION_TIME: 15,
    SPEEDQUIZ_QUESTION_TIME: 8,
    BASE_SCORE: 100,
    SPEED_BONUS: 50,
    STREAK_MULTIPLIER: 0.5,
    DAMAGE_WRONG: 20,
    DAMAGE_TIMEOUT: 15,
    WAVES_PER_ZONE: 5,
    ENEMIES_PER_WAVE_BASE: 3,
    // Shooting config
    PROJECTILE_SPEED: 12,
    FIRE_RATE: 150,        // ms between shots
    ENEMY_MAX_HEALTH: 3,   // hits needed to destroy
    SHOOT_DAMAGE: 1,
    SHOOT_SCORE: 50,       // points for shooting enemy
    MAX_PARTICLES: 150     // cap to prevent GC churn
};

/**
 * Questions database, keyed by topic ID.
 *
 * Each entry is an array of question objects with the following shape:
 *   q  {string}   - Question text displayed to the player
 *   a  {string[]} - Array of exactly 4 answer choices
 *   c  {number}   - Zero-based index of the correct answer in `a`
 *   e  {string}   - Explanation shown after the player answers
 *
 * At runtime the answer array is Fisher-Yates shuffled, so `c` must
 * always point to the correct item in the *original* `a` array order.
 *
 * To add a new topic:
 *   1. Add a key here with at least 5 question objects.
 *   2. Add a matching entry to the TOPICS array (id, name, icon, color, desc).
 *
 * To add questions to an existing topic, append objects to the relevant array.
 */
const QUESTIONS = {
    docker: [
        { q: "What command creates AND starts a container from an image?", a: ["docker run", "docker start", "docker create", "docker build"], c: 0, e: "docker run = create + start in one step; docker create only creates, docker start only starts an existing stopped container." },
        { q: "Which file defines a Docker image's build instructions?", a: ["Dockerfile", "docker-compose.yml", "config.json", "image.yaml"], c: 0, e: "A Dockerfile contains ordered instructions (FROM, RUN, COPY, CMD…) that docker build executes layer by layer to produce an image." },
        { q: "What does 'docker system prune' remove?", a: ["Stopped containers, unused networks, dangling images, and build cache", "All images including those used by running containers", "Only running containers and their volumes", "Only dangling images and build cache"], c: 0, e: "Add -a to also remove unused (not just dangling) images, and --volumes to include anonymous volumes." },
        { q: "Which command lists all running containers?", a: ["docker ps", "docker list", "docker show", "docker containers"], c: 0, e: "docker ps -a lists all containers including stopped ones." },
        { q: "What happens when you run 'docker run' with an image not present locally?", a: ["Docker automatically pulls it from the registry", "Docker returns an error and exits", "Docker builds it from the nearest Dockerfile", "Docker uses a cached empty image"], c: 0, e: "Docker checks the local image cache first, then pulls from Docker Hub (or the configured registry) if not found." },
        { q: "What is Docker Compose used for?", a: ["Multi-container applications", "Building images", "Network configuration", "Security scanning"], c: 0, e: "Docker Compose lets you define and run multi-container apps in a single docker-compose.yml file, starting all services with one command." },
        { q: "Which command gracefully stops a container by sending SIGTERM first?", a: ["docker stop", "docker kill", "docker end", "docker halt"], c: 0, e: "docker stop sends SIGTERM and waits (default 10s) for a graceful shutdown before sending SIGKILL; docker kill sends SIGKILL immediately." },
        { q: "What is the main benefit of a .dockerignore file?", a: ["Reduces build context size and keeps sensitive files out of the image", "Speeds up container runtime startup", "Prevents containers from accessing the host filesystem", "Limits the number of image layers created"], c: 0, e: "The build context is sent to the Docker daemon; .dockerignore excludes large or sensitive files (e.g. .git, .env) from that transfer." },
        { q: "What does the -d flag do in 'docker run -d'?", a: ["Runs container in detached mode", "Enables debugging", "Downloads image", "Deletes after exit"], c: 0, e: "Detached mode returns the container ID and runs the container in the background; use docker logs <id> to view output." },
        { q: "Which port mapping is correct?", a: ["-p 8080:80", "-p 80-8080", "-port 8080:80", "--port=8080,80"], c: 0, e: "The format is -p hostPort:containerPort. Here host port 8080 maps to container port 80." },
        { q: "What is a multi-stage build?", a: ["Build with multiple FROM statements", "Building multiple containers", "Parallel builds", "Sequential deployments"], c: 0, e: "Each FROM starts a new stage; you copy only the compiled artifacts into the final stage, keeping the runtime image small." },
        { q: "What does ENTRYPOINT do in a Dockerfile?", a: ["Sets the main executable", "Defines environment variables", "Copies files", "Exposes ports"], c: 0, e: "ENTRYPOINT defines the main process; CMD provides default arguments to it. Together they make a container behave like an executable." },
        { q: "Which Dockerfile instruction sets the user that runs the container process?", a: ["USER", "RUN", "ENV", "EXPOSE"], c: 0, e: "Using USER to run as a non-root user is a key container security best practice to limit blast radius if the app is compromised." },
        { q: "What does 'docker exec' do?", a: ["Runs command in running container", "Starts new container", "Stops container", "Removes container"], c: 0, e: "docker exec -it <container> bash opens an interactive shell in a running container, useful for debugging." },
        { q: "What Dockerfile instruction declares a build-time variable overridable with --build-arg?", a: ["ARG", "ENV", "VAR", "BUILD"], c: 0, e: "ARG values are only available at build time; ENV values persist into the running container as environment variables." },
        { q: "Which command shows live CPU, memory, and network stats for running containers?", a: ["docker stats", "docker top", "docker inspect", "docker metrics"], c: 0, e: "docker stats streams real-time resource usage; docker top shows the processes running inside a container." },
        { q: "What is the difference between ADD and COPY?", a: ["ADD can extract archives", "ADD is faster", "COPY is deprecated", "No difference"], c: 0, e: "ADD also supports fetching URLs and auto-extracting local .tar files; COPY is preferred for simple file copies as its behavior is explicit." },
        { q: "What does 'docker network create' do?", a: ["Creates custom network", "Lists networks", "Removes network", "Inspects network"], c: 0, e: "Custom networks give containers DNS-based service discovery by name, unlike the default bridge network." },
        { q: "Which Dockerfile instruction is most likely to invalidate the build cache for all subsequent layers?", a: ["COPY . .", "FROM ubuntu:22.04", "ENV APP_PORT=8080", "EXPOSE 8080"], c: 0, e: "COPY . . copies the entire source tree; any file change invalidates the layer cache for every instruction that follows it." },
        { q: "What does '--rm' flag do in docker run?", a: ["Removes container after exit", "Runs in read mode", "Enables root mode", "Uses RAM mount"], c: 0, e: "--rm automatically removes the container's writable layer when it exits, preventing accumulation of stopped containers." }
    ],
    kubernetes: [
        { q: "Two containers are in the same Pod. What do they share by default?", a: ["Network namespace and localhost", "Persistent volume claims", "Environment variables", "CPU and memory limits"], c: 0, e: "Co-located containers share the same IP address and port space, and can communicate via localhost; storage must be explicitly shared via volumes." },
        { q: "Which object manages Pod replicas?", a: ["Deployment", "Service", "ConfigMap", "Secret"], c: 0, e: "A Deployment manages a ReplicaSet, which in turn manages Pod replicas and handles rolling updates and rollbacks." },
        { q: "What exposes Pods to network traffic?", a: ["Service", "Deployment", "ReplicaSet", "Namespace"], c: 0, e: "A Service provides a stable virtual IP and DNS name that load-balances traffic across matching Pods, abstracting ephemeral Pod IPs." },
        { q: "Which command applies a YAML configuration?", a: ["kubectl apply -f", "kubectl create", "kubectl run", "kubectl start"], c: 0, e: "kubectl apply is declarative and idempotent—it creates or updates resources; kubectl create is imperative and fails if the resource already exists." },
        { q: "What is a Kubernetes Namespace?", a: ["Virtual cluster partition", "Physical server", "Container runtime", "Storage class"], c: 0, e: "Namespaces scope resource names, RBAC policies, and resource quotas; common pattern: one namespace per team or environment." },
        { q: "What does HPA stand for?", a: ["Horizontal Pod Autoscaler", "High Performance Architecture", "Host Port Allocation", "Hybrid Pod Application"], c: 0, e: "HPA scales Pod count up or down based on CPU/memory utilization or custom metrics, responding to load automatically." },
        { q: "Which object stores sensitive data?", a: ["Secret", "ConfigMap", "PersistentVolume", "Deployment"], c: 0, e: "Secrets are base64-encoded by default; use encryption at rest and restrict access with RBAC—base64 alone is not encryption." },
        { q: "What is an Ingress?", a: ["HTTP route manager", "Container runtime", "Pod scheduler", "Volume provisioner"], c: 0, e: "An Ingress resource defines HTTP/S routing rules (host, path → Service); an Ingress controller (nginx, Traefik, etc.) implements them." },
        { q: "What kubectl command shows detailed events for a pod stuck in CrashLoopBackOff?", a: ["kubectl describe pod", "kubectl get pod", "kubectl logs --tail", "kubectl exec -it"], c: 0, e: "kubectl describe pod shows the Events section with image pull errors, OOM kills, liveness probe failures, and scheduling issues." },
        { q: "What is a StatefulSet used for?", a: ["Stateful applications", "Stateless services", "Network policies", "Resource quotas"], c: 0, e: "StatefulSets provide stable network IDs (pod-0, pod-1…) and persistent storage per pod; used for databases, Kafka, ZooKeeper, etc." },
        { q: "What is a DaemonSet?", a: ["Runs Pod on every node", "Manages secrets", "Handles ingress", "Schedules jobs"], c: 0, e: "DaemonSets are ideal for cluster-wide agents: log collectors (Fluentd), metrics exporters (node-exporter), and CNI plugins." },
        { q: "What does kubelet do?", a: ["Runs containers on nodes", "Manages the API", "Stores cluster state", "Routes traffic"], c: 0, e: "kubelet is the node agent that registers the node with the API server and ensures the containers in Pods are running and healthy." },
        { q: "What is etcd used for in Kubernetes?", a: ["Cluster state storage", "Container runtime", "Load balancing", "Pod scheduling"], c: 0, e: "etcd is a distributed key-value store; all Kubernetes objects (Pods, Services, configs) are persisted there. Backing it up is critical." },
        { q: "What is a PersistentVolumeClaim?", a: ["Request for storage", "Network policy", "Security context", "Resource limit"], c: 0, e: "A PVC requests storage of a certain size and access mode; Kubernetes binds it to a matching PersistentVolume automatically." },
        { q: "A pod shows status 'OOMKilled'. What is the most likely cause?", a: ["Container exceeded its memory limit", "Container exceeded its CPU limit", "Image failed to pull from registry", "Liveness probe failed repeatedly"], c: 0, e: "When a container's RSS exceeds its memory limit, the kernel OOM killer terminates it; increase the limit or fix the memory leak." },
        { q: "What is a ReplicaSet?", a: ["Ensures Pod count", "Manages secrets", "Routes traffic", "Stores config"], c: 0, e: "A ReplicaSet watches Pods and creates or deletes them to maintain the desired count; Deployments manage ReplicaSets for you." },
        { q: "What is a NodePort service?", a: ["Exposes port on all nodes", "Internal only", "Load balancer", "External DNS"], c: 0, e: "NodePort opens a static port (30000–32767) on every node's IP; external traffic hits any node IP:nodePort and gets forwarded to the Service." },
        { q: "Which command rolls back a Deployment to its previous revision?", a: ["kubectl rollout undo deployment/<name>", "kubectl rollback deployment/<name>", "kubectl apply --previous deployment/<name>", "kubectl revert deployment/<name>"], c: 0, e: "Use --to-revision=<n> to roll back to a specific revision; kubectl rollout history shows available revisions." },
        { q: "What is a CronJob?", a: ["Scheduled job", "Continuous job", "One-time job", "Parallel job"], c: 0, e: "CronJob creates Jobs on a cron schedule (e.g., '0 * * * *' = hourly); each Job runs a Pod to completion." },
        { q: "What does a Kubernetes NetworkPolicy resource do?", a: ["Controls which pods can send and receive traffic from other pods", "Assigns IP addresses to pods", "Routes external traffic into the cluster", "Limits CPU and memory for pods"], c: 0, e: "By default all pods can communicate; NetworkPolicies add allow-list rules based on pod labels, namespaces, and ports." }
    ],
    cicd: [
        { q: "What does CI stand for?", a: ["Continuous Integration", "Code Inspection", "Container Instance", "Cloud Infrastructure"], c: 0, e: "CI means automatically building and testing code on every commit so integration bugs are caught immediately, not at release time." },
        { q: "What does CD stand for?", a: ["Continuous Delivery/Deployment", "Code Deployment", "Container Distribution", "Cloud Development"], c: 0, e: "Continuous Delivery keeps software always releasable; Continuous Deployment goes further by automatically pushing every passing build to production." },
        { q: "In GitHub Actions, what does the 'needs' key in a job definition specify?", a: ["Jobs that must complete successfully before this job runs", "Required secrets for the job", "Minimum runner version needed", "Required file dependencies"], c: 0, e: "'needs' creates explicit dependencies between jobs in a workflow, enabling fan-out/fan-in pipeline patterns." },
        { q: "Which is a popular CI/CD tool?", a: ["Jenkins", "Prometheus", "Ansible", "Terraform"], c: 0, e: "Jenkins is the most widely deployed CI/CD server; Prometheus is monitoring, Ansible is config management, Terraform is IaC." },
        { q: "What triggers a CI pipeline?", a: ["Code commit/push", "Server restart", "User login", "Database query"], c: 0, e: "Pipelines are event-driven: push, pull request, tag, or schedule events trigger the pipeline via webhooks." },
        { q: "What is a build artifact?", a: ["Output of build process", "Source code", "Configuration file", "Log file"], c: 0, e: "Artifacts (Docker image, JAR, binary) are stored in an artifact registry and promoted unchanged through pipeline stages to production." },
        { q: "What is GitOps?", a: ["Git as source of truth for infrastructure", "Git hosting service", "Git GUI tool", "Git branching strategy"], c: 0, e: "GitOps uses Git PRs as the only change mechanism; a controller (ArgoCD, Flux) reconciles cluster state to match the repo." },
        { q: "What is the primary purpose of a staging environment in a CI/CD pipeline?", a: ["Production-like testing before a release", "Speeding up the build process", "Storing build artifacts long-term", "Running unit tests in isolation"], c: 0, e: "Staging catches environment-specific bugs (config, secrets, integrations) that unit tests miss because it mirrors production." },
        { q: "What does 'fail fast' mean in CI/CD?", a: ["Detect failures early in the pipeline", "Deploy quickly to production", "Skip non-critical tests for speed", "Fail silently without blocking deploys"], c: 0, e: "Run the cheapest, fastest checks first (lint → unit tests → build → integration) so developers get feedback in seconds, not hours." },
        { q: "What is blue-green deployment?", a: ["Two identical environments", "Color-coded logs", "Branch naming", "Error highlighting"], c: 0, e: "Traffic is instantly switched from blue (current) to green (new); rollback is instant by switching back to blue." },
        { q: "What is a canary deployment?", a: ["Gradual rollout to subset", "Fast deployment", "Rollback strategy", "Testing approach"], c: 0, e: "Canary routes a small percentage of traffic to the new version; metrics are monitored before progressively increasing traffic." },
        { q: "What is GitHub Actions?", a: ["CI/CD platform", "Code review tool", "Issue tracker", "Wiki system"], c: 0, e: "GitHub Actions runs YAML workflows in .github/workflows/ triggered by GitHub events, with free minutes for public repos." },
        { q: "What is the purpose of a 'quality gate' in a CI/CD pipeline?", a: ["Blocks promotion if code quality or test coverage thresholds are not met", "Controls who can merge pull requests", "Sets the maximum allowed pipeline run time", "Defines which environment to deploy to next"], c: 0, e: "SonarQube quality gates are a common example: block the PR if coverage drops below 80% or critical vulnerabilities are found." },
        { q: "What is ArgoCD?", a: ["GitOps continuous delivery tool", "Source code repository", "Container registry", "Monitoring platform"], c: 0, e: "ArgoCD continuously syncs Kubernetes clusters to a desired state defined in Git, providing drift detection and self-healing." },
        { q: "What is the main advantage of promoting immutable build artifacts through pipeline stages?", a: ["The exact same binary tested in staging is deployed to production", "Builds run faster on each stage", "Secrets are baked in securely at build time", "Rollbacks require no additional pipeline run"], c: 0, e: "Immutability eliminates 'works on my machine' surprises; the SHA-tagged image from staging is the exact same bytes that hit production." },
        { q: "What is feature flagging?", a: ["Toggle features on/off", "Code commenting", "Branch naming", "Error logging"], c: 0, e: "Feature flags decouple deploy from release: ship code dark, enable it via config for specific users or percentages." },
        { q: "What is trunk-based development?", a: ["Single main branch", "Many long branches", "Feature branches", "Release branches"], c: 0, e: "Short-lived branches (< 1 day) or direct commits to main keep merge conflicts small and enable true CI." },
        { q: "What CI/CD tool uses 'orbs' as reusable shareable configuration packages?", a: ["CircleCI", "Jenkins", "GitHub Actions", "GitLab CI"], c: 0, e: "CircleCI Orbs are published YAML packages that encapsulate jobs, commands, and executors for sharing across pipelines." },
        { q: "What is a build matrix?", a: ["Multiple config combinations", "Single build", "Code coverage", "Deployment target"], c: 0, e: "A matrix runs the same job with every combination of variables (Node 18×20, Linux×macOS), catching compatibility issues early." },
        { q: "What is semantic versioning?", a: ["MAJOR.MINOR.PATCH format", "Date-based versioning", "Random numbering", "Alphabetic versioning"], c: 0, e: "MAJOR = breaking change, MINOR = new backward-compatible feature, PATCH = backward-compatible bug fix. E.g., 2.1.3." }
    ],
    aws: [
        { q: "Which EC2 pricing model offers the biggest discount in exchange for a 1- or 3-year commitment?", a: ["Reserved Instances", "Spot Instances", "On-Demand Instances", "Dedicated Hosts"], c: 0, e: "Reserved Instances offer ~40–75% savings; Spot Instances are cheaper but can be interrupted with 2 minutes notice." },
        { q: "What is S3 used for?", a: ["Object storage", "Compute instances", "Database hosting", "Network routing"], c: 0, e: "S3 stores objects (files) in buckets; 99.999999999% durability, no capacity limits, used for backups, static sites, and data lakes." },
        { q: "What is the maximum execution timeout for an AWS Lambda function?", a: ["15 minutes", "5 minutes", "30 minutes", "1 hour"], c: 0, e: "Lambda's 15-minute limit means long-running workloads should use ECS/Fargate, Step Functions, or EC2 instead." },
        { q: "What does IAM manage?", a: ["Identity and Access", "Internet and Media", "Infrastructure and Monitoring", "Integration and Migration"], c: 0, e: "IAM controls who (users, roles, services) can do what (actions) on which AWS resources via policies." },
        { q: "What is VPC?", a: ["Virtual Private Cloud", "Virtual Public Cloud", "Very Private Container", "Virtual Pod Cluster"], c: 0, e: "A VPC is your isolated private network in AWS; you control subnets, route tables, security groups, and internet gateways." },
        { q: "What is CloudFormation?", a: ["Infrastructure as Code", "Monitoring service", "Storage service", "Compute service"], c: 0, e: "CloudFormation provisions and manages AWS resources from JSON/YAML templates; it's AWS's native IaC service." },
        { q: "What is EKS?", a: ["Elastic Kubernetes Service", "Elastic Key Storage", "Enterprise Kubernetes System", "Easy Kubernetes Setup"], c: 0, e: "EKS runs a managed Kubernetes control plane; you manage worker nodes (or use Fargate for serverless nodes)." },
        { q: "What is RDS?", a: ["Relational Database Service", "Remote Data Storage", "Rapid Deployment Service", "Resource Distribution System"], c: 0, e: "RDS manages MySQL, PostgreSQL, MariaDB, SQL Server, and Oracle with automated backups, patching, and Multi-AZ failover." },
        { q: "What is the purpose of CloudWatch Logs Insights?", a: ["Interactively query and analyze log data using a purpose-built query language", "Archive logs to S3 automatically", "Forward logs to third-party SIEM tools", "Set up metric alarms triggered by log patterns"], c: 0, e: "Logs Insights queries are fast even on terabytes of logs; use fields, filter, stats, and sort commands in its query language." },
        { q: "What is an AWS Region?", a: ["Geographic location of data centers", "Pricing tier", "Account type", "Service category"], c: 0, e: "Each Region is independent with multiple Availability Zones; choose based on latency, compliance, and service availability." },
        { q: "What is Route 53?", a: ["DNS service", "Routing table", "VPC component", "Load balancer"], c: 0, e: "Route 53 is 100% SLA DNS with routing policies: latency, weighted, geolocation, failover, and multi-value." },
        { q: "What is ELB?", a: ["Elastic Load Balancer", "Enterprise Linux Box", "Easy Lambda Builder", "Elastic Log Buffer"], c: 0, e: "Use ALB for HTTP/HTTPS (Layer 7), NLB for TCP/UDP (Layer 4), and Gateway LB for inline appliances." },
        { q: "What is ECS?", a: ["Elastic Container Service", "Enterprise Compute Service", "Easy Cloud Storage", "Elastic CDN Service"], c: 0, e: "ECS is AWS's container orchestration service; use EC2 launch type for control or Fargate for serverless containers." },
        { q: "What is DynamoDB?", a: ["NoSQL database", "SQL database", "Cache service", "Queue service"], c: 0, e: "DynamoDB is a fully managed key-value and document store with single-digit millisecond latency at any scale." },
        { q: "What is the key difference between SNS and SQS?", a: ["SNS is push-based pub/sub fanout; SQS is a pull-based message queue", "SQS supports multiple subscribers; SNS does not", "SNS persists messages indefinitely; SQS deletes them immediately", "SQS delivers to all subscribers at once; SNS delivers to one"], c: 0, e: "SNS fans out to all subscribers simultaneously; SQS queues messages so consumers pull them at their own pace." },
        { q: "What is SQS?", a: ["Simple Queue Service", "Secure Query Service", "Storage Queue System", "Server Query Service"], c: 0, e: "SQS decouples producers and consumers; messages are retained up to 14 days and delivered at-least-once." },
        { q: "What is an Availability Zone?", a: ["Isolated data center", "Service type", "Pricing tier", "Account region"], c: 0, e: "AZs have independent power, cooling, and networking; deploy across multiple AZs for high availability." },
        { q: "What is Fargate?", a: ["Serverless containers", "Database service", "Storage tier", "Network type"], c: 0, e: "Fargate removes EC2 instance management; you define vCPU and memory per task and pay per second of use." },
        { q: "What is the key difference between an IAM Role and an IAM User?", a: ["Roles are assumed temporarily; users have long-term credentials", "Roles have more permissions than users by default", "Users can assume roles but roles cannot be assumed", "Roles require MFA while users do not"], c: 0, e: "Roles issue temporary STS credentials that expire; they're assumed by services, EC2 instances, or Lambda functions." },
        { q: "What is ElastiCache?", a: ["In-memory caching", "File storage", "Compute service", "Database backup"], c: 0, e: "ElastiCache provides managed Redis or Memcached clusters to cache database results, reducing latency and load." }
    ],
    terraform: [
        { q: "What does 'terraform import' do?", a: ["Brings existing infrastructure into Terraform state", "Downloads provider plugins", "Imports a Terraform module", "Exports the current state file"], c: 0, e: "After importing, you must write the matching HCL configuration; import only updates state, not config files." },
        { q: "What language does Terraform use?", a: ["HCL", "YAML", "JSON", "Python"], c: 0, e: "HCL (HashiCorp Configuration Language) is human-friendly with comments; JSON is also valid but verbose." },
        { q: "What does 'terraform init' do?", a: ["Initializes working directory", "Creates resources", "Destroys resources", "Shows plan"], c: 0, e: "terraform init downloads provider plugins, sets up the backend, and installs modules. Run it first in any new workspace." },
        { q: "What does 'terraform plan' show?", a: ["Preview of changes", "Current state", "Provider list", "Variable values"], c: 0, e: "terraform plan does a dry run—+ means create, ~ means update, - means destroy. Review it carefully before applying." },
        { q: "What does 'terraform apply' do?", a: ["Applies changes", "Shows plan", "Initializes directory", "Validates config"], c: 0, e: "terraform apply runs the plan and provisions/modifies real infrastructure; use -auto-approve only in CI pipelines." },
        { q: "What is Terraform state?", a: ["Record of managed infrastructure", "Configuration file", "Variable definition", "Provider plugin"], c: 0, e: "The state file maps HCL resources to real infrastructure; it's the source of truth for drift detection and dependency resolution." },
        { q: "What is a Terraform module?", a: ["Reusable configuration", "State file", "Provider", "Resource type"], c: 0, e: "Modules group resources into reusable components with input variables and output values, similar to functions in code." },
        { q: "What is a Terraform provider?", a: ["Plugin for API interaction", "State backend", "Module source", "Variable type"], c: 0, e: "Providers (aws, azurerm, google, kubernetes) are plugins that translate Terraform resources into API calls." },
        { q: "What does 'terraform destroy' do?", a: ["Removes all resources", "Shows plan", "Applies changes", "Validates config"], c: 0, e: "terraform destroy removes all resources in the state file; it first shows a destruction plan and asks for confirmation." },
        { q: "What does 'terraform fmt' do?", a: ["Rewrites Terraform config files to canonical HCL style", "Validates config syntax for errors", "Formats the state file for readability", "Pretty-prints the terraform plan output"], c: 0, e: "terraform fmt rewrites .tf files with consistent indentation and spacing; run it in CI to enforce style." },
        { q: "What is a Terraform workspace?", a: ["Isolated state environment", "Configuration file", "Module directory", "Provider setting"], c: 0, e: "Workspaces store separate state files for the same config; useful for dev/staging/prod with the same code." },
        { q: "What is terraform.tfvars?", a: ["Variable values file", "State file", "Plan output", "Lock file"], c: 0, e: "Terraform auto-loads terraform.tfvars and *.auto.tfvars; commit a .tfvars.example instead of the real file to avoid leaking secrets." },
        { q: "What is terraform.lock.hcl?", a: ["Dependency lock file", "State file", "Config file", "Variable file"], c: 0, e: "The lock file pins exact provider versions and hashes; commit it so every team member and CI run uses the same provider." },
        { q: "What happens when two engineers run 'terraform apply' simultaneously on a remote backend with state locking?", a: ["The second apply is blocked until the first releases the lock", "Both applies run in parallel and merge their changes", "The second apply overwrites the first apply's state", "Terraform randomly selects which apply proceeds"], c: 0, e: "State locking (DynamoDB for S3 backend) prevents concurrent applies from corrupting the state file." },
        { q: "What is a data source in Terraform?", a: ["Reads external data", "Creates resources", "Stores state", "Defines variables"], c: 0, e: "Data sources query existing infrastructure (e.g., data.aws_ami.latest) and expose attributes without managing the resource." },
        { q: "What is terraform output?", a: ["Displays output values", "Creates resources", "Shows plan", "Validates config"], c: 0, e: "Output values expose resource attributes (IPs, ARNs) for use by other configs or scripts after apply." },
        { q: "What advantage does 'for_each' have over 'count' when creating multiple resource instances?", a: ["Resources get stable identities from map keys, preventing unwanted replacements", "for_each creates resources faster than count", "count cannot be used with modules", "for_each supports conditional creation; count does not"], c: 0, e: "count indexes by number, so removing item 1 of 3 shifts the index of item 2, causing unexpected replacement. for_each uses stable keys." },
        { q: "What is remote state?", a: ["State stored externally", "Local state", "Cached state", "Temp state"], c: 0, e: "Remote state (S3, Terraform Cloud) enables team collaboration, state locking, versioning, and cross-workspace data access." },
        { q: "What is a Terraform local value?", a: ["Named expression within a module", "Local state file", "Module variable", "Provider config"], c: 0, e: "locals {} compute reusable expressions once (e.g., common tags map) and reference them as local.name throughout the module." },
        { q: "What does the 'count' meta-argument do?", a: ["Creates multiple resource instances", "Counts total resources", "Limits resource quantity", "Checks resource count"], c: 0, e: "count = 3 creates 3 instances indexed as resource.name[0], [1], [2]; use for_each when items have natural unique identifiers." }
    ],
    git: [
        { q: "What makes 'git revert' safer than 'git reset' on shared branches?", a: ["It creates a new commit without rewriting history", "It is faster to execute", "It doesn't affect the working directory", "It only works locally"], c: 0, e: "Rewriting history with reset forces team members to reconcile diverged branches; revert adds a new commit that everyone can pull cleanly." },
        { q: "What does 'git commit' do?", a: ["Saves changes to local repo", "Uploads to remote", "Downloads changes", "Creates branch"], c: 0, e: "git commit records staged changes to the local repository history with a message; use -m for inline messages." },
        { q: "What does 'git push' do?", a: ["Uploads commits to remote", "Downloads changes", "Creates branch", "Merges branches"], c: 0, e: "git push uploads local commits to the remote repository; use -u origin <branch> to set the upstream tracking branch." },
        { q: "What does 'git pull' do?", a: ["Fetches and merges changes", "Uploads commits", "Creates branch", "Shows history"], c: 0, e: "git pull = git fetch + git merge; use --rebase to replay your commits on top of fetched changes for a cleaner history." },
        { q: "What is a Git branch?", a: ["Parallel version of code", "Remote server", "Commit message", "File backup"], c: 0, e: "A branch is a lightweight pointer to a commit; creating one is instant and doesn't copy any files." },
        { q: "What does 'git merge' do?", a: ["Combines branches", "Creates branch", "Deletes branch", "Shows differences"], c: 0, e: "Merge integrates branches; fast-forward moves the pointer; three-way merge creates a merge commit for diverged histories." },
        { q: "What is a merge conflict?", a: ["Competing changes to same lines", "Network error", "Authentication failure", "File corruption"], c: 0, e: "Conflicts occur when two branches modify the same lines differently; Git marks them with <<<<<<, =======, >>>>>>> for manual resolution." },
        { q: "What does 'git stash' do?", a: ["Temporarily saves changes", "Deletes changes", "Commits changes", "Pushes changes"], c: 0, e: "git stash push saves the dirty working directory onto a stack; git stash pop restores the most recent stash." },
        { q: "What is 'git rebase'?", a: ["Reapplies commits on new base", "Creates backup", "Deletes history", "Merges repositories"], c: 0, e: "Rebase replays commits onto a new base, producing a linear history; never rebase commits already pushed to a shared branch." },
        { q: "What does HEAD refer to?", a: ["Current commit reference", "Remote server", "Branch list", "Commit history"], c: 0, e: "HEAD is a pointer to the current commit (usually the tip of the checked-out branch); detached HEAD points directly to a commit." },
        { q: "What does 'git reflog' let you recover?", a: ["Commits no longer referenced by any branch or tag", "Deleted remote branches", "Uncommitted file changes", "Stashed changes that expired"], c: 0, e: "reflog records every HEAD movement for ~90 days; use it to find the SHA of accidentally reset or deleted commits." },
        { q: "What does 'git log --oneline --graph --all' display?", a: ["Visual ASCII branch history for all branches in one-line format", "All commits across all remote repositories", "Only commits reachable from the current branch", "Commits grouped by author name"], c: 0, e: "--graph draws branch topology as ASCII art; --all includes all local branches and tags; --oneline keeps output compact." },
        { q: "What does 'git diff HEAD~1 HEAD' show?", a: ["Changes introduced by the most recent commit", "Differences between two remote branches", "Unstaged working-directory changes", "Changes between the index and working tree"], c: 0, e: "HEAD~1 is the parent of HEAD; this diff shows exactly what the latest commit added, changed, or removed." },
        { q: "What is 'git fetch'?", a: ["Downloads without merging", "Uploads changes", "Deletes branch", "Creates tag"], c: 0, e: "git fetch safely downloads remote refs without touching your working directory or branches; review before merging." },
        { q: "What is the difference between 'git reset --soft' and 'git reset --hard'?", a: ["--soft keeps staged changes; --hard discards all working-directory changes", "--soft is reversible; --hard permanently deletes history", "--soft resets only the index; --hard resets only the working tree", "--hard is safer for shared branches; --soft is dangerous"], c: 0, e: "--soft undoes commits but keeps changes staged; --mixed (default) unstages changes; --hard discards all changes." },
        { q: "What is a Git tag?", a: ["Named commit reference", "Branch type", "Remote server", "File marker"], c: 0, e: "Annotated tags (git tag -a v1.0 -m '…') include a message, tagger, and date and are recommended for releases." },
        { q: "What does 'git cherry-pick' do?", a: ["Applies specific commit", "Deletes commit", "Creates branch", "Merges all"], c: 0, e: "Cherry-pick applies the diff of a specific commit onto the current branch; useful for backporting fixes to older releases." },
        { q: "What is .gitignore?", a: ["Files to exclude from tracking", "Config file", "Branch list", "Remote list"], c: 0, e: ".gitignore patterns exclude files from being tracked; it doesn't un-track files already committed—use git rm --cached for those." },
        { q: "What is 'git blame'?", a: ["Shows line-by-line authorship", "Deletes history", "Creates backup", "Merges branches"], c: 0, e: "git blame shows the last commit SHA, author, and date for each line; useful for understanding context behind code changes." },
        { q: "What is a Git submodule?", a: ["Repository inside repository", "Branch type", "Commit type", "Tag type"], c: 0, e: "Submodules embed another repo at a specific commit; use git submodule update --init --recursive after cloning." }
    ],
    linux: [
        { q: "What does the sticky bit (chmod +t) on a directory do?", a: ["Prevents users from deleting files they don't own", "Makes all files in it executable", "Hides the directory from other users", "Sets default permissions for new files"], c: 0, e: "The sticky bit is why /tmp is writable by all but each user can only delete their own files." },
        { q: "Which command displays the full path of the current working directory?", a: ["pwd", "ls -la", "echo $SHELL", "cd --show"], c: 0, e: "pwd (print working directory) is the quickest way to confirm your location in the filesystem." },
        { q: "What does 'grep' do?", a: ["Searches text patterns", "Creates files", "Compresses files", "Lists processes"], c: 0, e: "grep -r searches recursively, -i is case-insensitive, -n shows line numbers, -v inverts the match." },
        { q: "What does 'chmod' modify?", a: ["File permissions", "File owner", "File name", "File size"], c: 0, e: "chmod 755 = rwxr-xr-x (owner:rwx, group:r-x, others:r-x); chown changes ownership, chgrp changes group." },
        { q: "What does 'sudo' do?", a: ["Runs as superuser", "Shuts down system", "Shows disk usage", "Searches files"], c: 0, e: "sudo runs one command as root (or another user with -u); it logs the action for auditability." },
        { q: "What does 'ps' show?", a: ["Running processes", "File permissions", "Network connections", "Disk space"], c: 0, e: "ps aux shows all processes with user, CPU%, MEM%, and command; pipe to grep to filter by name." },
        { q: "What is the difference between 'kill -15' and 'kill -9'?", a: ["-15 sends SIGTERM (graceful); -9 sends SIGKILL (immediate, cannot be caught)", "-15 kills a process group; -9 kills only one process", "-9 sends SIGTERM; -15 sends SIGKILL", "-15 requires root privileges; -9 does not"], c: 0, e: "Always try SIGTERM first to allow cleanup; SIGKILL cannot be caught or ignored by the process." },
        { q: "What is systemd?", a: ["System and service manager", "File system", "Network manager", "Package manager"], c: 0, e: "systemd is PID 1 on most modern distros; use systemctl start/stop/enable/status to manage services." },
        { q: "Which command shows real-time kernel ring buffer messages, useful for debugging boot or hardware issues?", a: ["dmesg", "journalctl -xe", "syslog -f", "top -b"], c: 0, e: "dmesg -T shows human-readable timestamps; journalctl -k is the modern equivalent for systemd systems." },
        { q: "What does 'df' show?", a: ["Disk space usage", "Directory files", "Data format", "Device info"], c: 0, e: "df -h shows human-readable sizes; df -i shows inode usage (a full inode table can also prevent file creation)." },
        { q: "What does 'top' display?", a: ["System processes", "File contents", "Network status", "User list"], c: 0, e: "top shows dynamic real-time CPU/memory per process; press '1' for per-CPU breakdown, 'M' to sort by memory." },
        { q: "What does 'ssh' do?", a: ["Secure remote connection", "File transfer", "Service start", "System shutdown"], c: 0, e: "SSH encrypts the session; key-based auth (-i keyfile) is more secure than passwords; use -L for port forwarding." },
        { q: "What does 'wget' do?", a: ["Downloads files from web", "Uploads files", "Lists directories", "Edits files"], c: 0, e: "wget supports resuming (-c), recursive downloads (-r), and running without user interaction (great for scripts)." },
        { q: "What does 'curl' do?", a: ["Transfers data via URLs", "Creates users", "Compresses files", "Lists processes"], c: 0, e: "curl -I fetches headers only, -X sets HTTP method, -d sends POST body, -H adds headers, -o saves to file." },
        { q: "What does 'tar -xzvf archive.tar.gz' do?", a: ["Extracts a gzip-compressed tar archive with verbose output", "Creates a compressed archive from a directory", "Lists archive contents without extracting", "Compresses only changed files into a new archive"], c: 0, e: "Flags: x=extract, z=gunzip/gzip, v=verbose, f=filename. To create: tar -czf archive.tar.gz directory/" },
        { q: "What does 'awk' do?", a: ["Text processing", "Archive creation", "Process listing", "Disk formatting"], c: 0, e: "awk processes text field-by-field; 'awk '{print $2}'' prints the second whitespace-delimited column." },
        { q: "What does 'sed' do?", a: ["Stream editing", "Service daemon", "System export", "Secure delete"], c: 0, e: "sed 's/old/new/g' replaces all occurrences per line; -i edits files in place; -n with p prints matching lines." },
        { q: "What is /etc/passwd?", a: ["User account info file", "Encrypted password storage", "Network config", "System log"], c: 0, e: "/etc/passwd stores username, UID, GID, home dir, and shell; actual password hashes live in /etc/shadow (root-only)." },
        { q: "What does 'crontab' manage?", a: ["Scheduled tasks", "User accounts", "Network routes", "File systems"], c: 0, e: "crontab -e edits cron jobs; format: minute hour day month weekday command. Use crontab -l to list current jobs." },
        { q: "What does 'htop' provide?", a: ["Interactive process viewer", "HTTP server", "Help topics", "Hash table"], c: 0, e: "htop is a ncurses-based top replacement with color, mouse support, and easier process kill/nice controls." }
    ],
    monitoring: [
        { q: "What collection model does Prometheus use to gather metrics from targets?", a: ["Pull-based: Prometheus scrapes HTTP endpoints on targets", "Push-based: targets send metrics to Prometheus", "Agent-based: a sidecar forwards metrics to central storage", "Event-driven: targets emit metrics only on state change"], c: 0, e: "The pull model simplifies firewall rules (Prometheus opens connections) and makes it easy to detect if a target is down." },
        { q: "What is Grafana used for?", a: ["Data visualization", "Data storage", "Data processing", "Data backup"], c: 0, e: "Grafana connects to Prometheus, Loki, InfluxDB, Elasticsearch and many others via data source plugins to build dashboards." },
        { q: "What is the 'USE Method' for performance analysis?", a: ["Utilization, Saturation, and Errors for every resource", "Usage, Speed, and Efficiency per service", "Uptime, Stability, and Errors per host", "Utilization, Speed, and Events per component"], c: 0, e: "For each resource (CPU, disk, NIC): Utilization = % busy, Saturation = queue depth, Errors = error rate." },
        { q: "In Prometheus, what does Alertmanager handle after a rule fires?", a: ["Deduplication, grouping, silencing, and routing alerts to receivers", "Storing alert history in a time-series database", "Evaluating alerting rules against live metrics", "Scraping endpoints to collect new metric samples"], c: 0, e: "Alertmanager prevents alert storms by grouping related alerts and routing them to Slack, PagerDuty, email, etc." },
        { q: "What does ELK stand for?", a: ["Elasticsearch, Logstash, Kibana", "Easy Linux Kit", "Enterprise Log Keeper", "Elastic Load Kit"], c: 0, e: "Logstash ingests/transforms, Elasticsearch indexes/stores, Kibana visualizes. Beats agents are often added (ELKB/Elastic Stack)." },
        { q: "What is an SLO?", a: ["Service Level Objective", "System Log Output", "Server Load Optimizer", "Service Launch Order"], c: 0, e: "SLOs are internal targets (e.g., 99.9% success rate); they're stricter than SLAs so you have a buffer before breaching contracts." },
        { q: "What is APM?", a: ["Application Performance Monitoring", "Automated Process Manager", "Advanced Package Manager", "Application Process Memory"], c: 0, e: "APM instruments code to measure transaction latency, throughput, and error rates at the method/database query level." },
        { q: "What is tracing?", a: ["Following request paths", "Logging errors", "Measuring latency", "Counting requests"], c: 0, e: "Distributed tracing propagates a trace ID across services, showing each hop's latency as a flame chart or waterfall." },
        { q: "What is a Prometheus 'recording rule' used for?", a: ["Pre-computing expensive queries for performance", "Creating alert conditions", "Storing raw metrics to disk", "Routing alerts to receivers"], c: 0, e: "Recording rules evaluate PromQL expressions on an interval and store results as new metrics, speeding up dashboard loads." },
        { q: "What is log aggregation?", a: ["Collecting logs centrally", "Deleting old logs", "Compressing logs", "Encrypting logs"], c: 0, e: "Centralizing logs (ELK, Loki, Splunk) enables cross-service correlation, full-text search, and alerting on log patterns." },
        { q: "What is OpenTelemetry?", a: ["Observability framework", "Container runtime", "CI/CD tool", "Database service"], c: 0, e: "OpenTelemetry is a CNCF standard providing vendor-neutral APIs and SDKs for collecting metrics, traces, and logs." },
        { q: "What is a time series database?", a: ["Stores timestamped data points", "SQL relational database", "NoSQL document store", "In-memory cache"], c: 0, e: "TSDBs (Prometheus, InfluxDB, VictoriaMetrics) are optimized for high-frequency writes and fast time-range queries." },
        { q: "What is Jaeger used for?", a: ["Distributed tracing", "Log aggregation", "Metrics storage", "Alert routing"], c: 0, e: "Jaeger (CNCF) visualizes request flows across microservices as traces with span timelines and service dependency graphs." },
        { q: "What is Loki?", a: ["Log aggregation system", "Metrics database", "Tracing tool", "Alert manager"], c: 0, e: "Loki indexes only log labels (not full text) making storage much cheaper; query with LogQL in Grafana." },
        { q: "What is an SLA?", a: ["Service Level Agreement", "System Load Average", "Server Log Analysis", "Service Launch Action"], c: 0, e: "SLAs are contractual commitments to customers; breaching them typically triggers credits or penalties." },
        { q: "What does MTTR measure?", a: ["Mean Time To Recovery", "Maximum Transfer Rate", "Minimum Threshold Ratio", "Mean Traffic Rate"], c: 0, e: "MTTR is a key SRE metric; reduce it via runbooks, on-call training, good alerting, and feature flags for rollback." },
        { q: "What is an SLI?", a: ["Service Level Indicator", "System Log Index", "Server Load Index", "Service Launch Indicator"], c: 0, e: "SLIs are the actual measured metrics (request success rate, latency p99) used to evaluate whether SLOs are met." },
        { q: "What does PagerDuty do?", a: ["Incident management", "Log storage", "Metric collection", "Code deployment"], c: 0, e: "PagerDuty routes alerts to on-call engineers, manages escalation policies, and tracks incident timelines and postmortems." },
        { q: "What is Datadog?", a: ["Monitoring and analytics platform", "Database management tool", "CI/CD platform", "Container runtime"], c: 0, e: "Datadog is a SaaS observability platform with a unified agent collecting metrics, logs, and APM traces." },
        { q: "What is an on-call rotation?", a: ["Scheduled team incident response", "Database backup schedule", "Deployment schedule", "Sprint planning cycle"], c: 0, e: "Rotations distribute pager duty evenly; good practices include handoff docs, escalation policies, and blameless postmortems." }
    ],
    ansible: [
        { q: "What makes Ansible agentless compared to tools like Puppet or Chef?", a: ["It uses SSH and requires no agent on managed hosts", "It runs faster than agent-based tools", "It uses a push model over HTTP", "It stores state on managed hosts"], c: 0, e: "Agentless means no software to install, upgrade, or secure on managed hosts—just an SSH key and Python." },
        { q: "What is an Ansible Playbook?", a: ["YAML file with tasks", "Python script", "Shell script", "JSON config"], c: 0, e: "Playbooks list plays; each play targets a host group and runs tasks in order using modules." },
        { q: "What is Ansible inventory?", a: ["List of managed hosts", "Task definitions", "Variable storage", "Module library"], c: 0, e: "Inventory can be a static INI/YAML file or dynamic (AWS, GCP plugins); hosts can be grouped and given variables." },
        { q: "What is an Ansible role?", a: ["Reusable task collection", "User account", "Network config", "Container image"], c: 0, e: "Roles use a standard directory layout (tasks/, handlers/, templates/, vars/) to package reusable automation." },
        { q: "How does Ansible connect to hosts?", a: ["SSH", "HTTP", "FTP", "RDP"], c: 0, e: "Ansible uses SSH by default for Linux; WinRM for Windows; configure in ansible.cfg or per-host in inventory." },
        { q: "What is Ansible Vault?", a: ["Encrypts sensitive data", "Stores variables", "Manages inventory", "Runs tasks"], c: 0, e: "ansible-vault encrypt_string encrypts inline values; encrypt/decrypt files; use --vault-password-file in CI." },
        { q: "What is an Ansible module?", a: ["Reusable task unit", "Playbook section", "Inventory group", "Variable file"], c: 0, e: "Modules abstract OS differences; prefer package over apt/yum for portability, and use the module instead of shell/command when possible." },
        { q: "What is idempotency?", a: ["Same result on repeated runs", "Parallel execution", "Sequential tasks", "Error handling"], c: 0, e: "Idempotent modules check current state before acting; running a playbook twice should produce no changes the second time." },
        { q: "What is Ansible Galaxy?", a: ["Role sharing platform", "Monitoring dashboard", "Log aggregator", "Container registry"], c: 0, e: "Galaxy hosts community roles and collections; use ansible-galaxy install to download them." },
        { q: "What does a handler do?", a: ["Runs when notified", "Always runs", "Never runs", "Runs first"], c: 0, e: "Handlers run once at the end of a play (not immediately) and only if notified by a task that reported 'changed'." },
        { q: "What does 'become: yes' do in Ansible?", a: ["Privilege escalation", "Enables a module", "Registers a result", "Skips the task"], c: 0, e: "become: yes uses sudo by default; set become_method: su or pfexec if needed, and become_user for a specific account." },
        { q: "What is an Ansible fact?", a: ["Auto-gathered host information", "Static variable", "Task output", "Module parameter"], c: 0, e: "Facts like ansible_os_family and ansible_memory_mb are gathered by the setup module at play start; use gather_facts: false to skip." },
        { q: "What does the 'register' keyword do?", a: ["Saves task output to variable", "Registers a module", "Registers a host", "Creates a fact"], c: 0, e: "Registered variables capture return values (rc, stdout, stderr, changed) for use in conditions or later tasks." },
        { q: "What does the 'when' keyword do?", a: ["Conditional task execution", "Times a task", "Schedules a task", "Waits for input"], c: 0, e: "'when' evaluates a Jinja2 expression; the task is skipped (not failed) if the condition is false." },
        { q: "What are Ansible tags?", a: ["Labels to run specific tasks", "Inventory groups", "Variable files", "Module parameters"], c: 0, e: "ansible-playbook --tags install runs only tagged tasks; --skip-tags skips them. Useful for partial runs during development." },
        { q: "What is AWX?", a: ["Open-source Ansible web UI", "CLI tool for Ansible", "Module library", "Inventory plugin"], c: 0, e: "AWX is the upstream open-source project for Red Hat Ansible Automation Platform; it provides a web UI and REST API." },
        { q: "What is ansible-lint?", a: ["Checks playbook best practices", "Runs playbooks", "Manages inventory", "Encrypts variables"], c: 0, e: "ansible-lint enforces best practices (no bare variables, use FQCN modules, etc.); integrate it into CI to catch issues early." },
        { q: "What is the modern Ansible syntax for iterating over a list?", a: ["loop", "with_items", "for_each", "iterate"], c: 0, e: "loop: replaces the deprecated with_* lookups; use loop with subelements or dict2items for nested iteration." },
        { q: "What is an Ansible ad hoc command?", a: ["One-off task without a playbook", "Scheduled playbook run", "Role-based execution", "Module unit test"], c: 0, e: "ansible all -m ping is a classic ad hoc command; use -b for privilege escalation and -i for a custom inventory." },
        { q: "What does 'delegate_to' do in Ansible?", a: ["Runs the task on a different host", "Delegates role creation", "Assigns task priority", "Runs as a different user"], c: 0, e: "delegate_to: localhost runs a task locally (e.g., API call) while iterating over remote hosts; useful for load balancer drain." }
    ],
    azure: [
        { q: "What is the correct Azure scope hierarchy from broadest to narrowest?", a: ["Management Group → Subscription → Resource Group → Resource", "Subscription → Management Group → Resource Group → Resource", "Resource Group → Subscription → Resource → Management Group", "Management Group → Resource Group → Subscription → Resource"], c: 0, e: "Policies and RBAC assigned at a higher scope cascade down; use Management Groups to enforce governance across subscriptions." },
        { q: "What is the purpose of Azure Managed Identities?", a: ["Allow Azure services to authenticate to other services without storing credentials", "Manage user passwords in Azure AD", "Provision new Azure subscriptions automatically", "Monitor identity-related security events"], c: 0, e: "Managed Identities (system-assigned or user-assigned) get automatic credential rotation—no secrets in code or config." },
        { q: "What is AKS?", a: ["Azure Kubernetes Service", "Azure Key Storage", "Azure Knowledge System", "Azure Kernel Service"], c: 0, e: "AKS manages the Kubernetes control plane for free; you pay only for the agent node VMs and associated storage." },
        { q: "What is Azure Functions?", a: ["Serverless compute", "Virtual machines", "Container instances", "Database service"], c: 0, e: "Functions support HTTP, timer, blob, queue, and event hub triggers; the Consumption plan bills per execution." },
        { q: "What is Azure Blob Storage?", a: ["Object storage", "Block storage", "File storage", "Queue storage"], c: 0, e: "Blob Storage stores unstructured data in containers; tiers (Hot, Cool, Cold, Archive) optimize cost vs access frequency." },
        { q: "What is ARM?", a: ["Azure Resource Manager", "Azure Runtime Module", "Azure Region Manager", "Azure Role Manager"], c: 0, e: "ARM is the unified control plane for all Azure resources; it processes all deployment requests via REST APIs." },
        { q: "What is Azure AD?", a: ["Identity management", "Application deployment", "Network configuration", "Storage management"], c: 0, e: "Azure Active Directory (now Microsoft Entra ID) provides identity, SSO, MFA, and conditional access for cloud resources." },
        { q: "What is an Azure Resource Group?", a: ["Container for resources", "Virtual network", "Storage account", "Compute instance"], c: 0, e: "Resources in a group share the same lifecycle; delete the group to delete all resources at once—great for dev environments." },
        { q: "Which Azure service provides a Web Application Firewall (WAF) to protect against common web exploits?", a: ["Azure Application Gateway or Azure Front Door with WAF policy", "Azure Firewall", "Network Security Group (NSG)", "Azure DDoS Protection Standard"], c: 0, e: "WAF policies on Application Gateway or Front Door provide managed OWASP CRS rules and custom rules for web traffic." },
        { q: "What is Azure Pipelines?", a: ["CI/CD service", "Data pipeline", "Network route", "Storage tier"], c: 0, e: "Azure Pipelines is Azure DevOps's CI/CD service supporting YAML or classic GUI pipeline definitions with any language/platform." },
        { q: "What is Azure App Service?", a: ["Platform for hosting web apps", "Virtual machine", "Database service", "Object storage"], c: 0, e: "App Service is a PaaS for web apps and APIs; it handles OS patching, TLS certs (with managed certificates), and auto-scaling." },
        { q: "What is Azure Monitor?", a: ["Monitoring and alerting service", "Storage service", "Compute service", "Network service"], c: 0, e: "Azure Monitor collects metrics and logs from all Azure resources; Log Analytics workspaces store and query the data." },
        { q: "What is Azure Container Registry?", a: ["Private container image registry", "Kubernetes service", "Serverless platform", "CI/CD service"], c: 0, e: "ACR stores container images and Helm charts privately; integrate with AKS using managed identity for pull access." },
        { q: "What is Bicep?", a: ["Azure infrastructure-as-code language", "CI/CD tool", "Container runtime", "Monitoring tool"], c: 0, e: "Bicep is a DSL that compiles to ARM JSON; it has cleaner syntax with modules, loops, and conditions, and is Microsoft-recommended." },
        { q: "What is Azure Virtual Network?", a: ["Private network in Azure", "Public internet backbone", "CDN service", "DNS service"], c: 0, e: "VNets are isolated by default; use VNet peering or VPN Gateway to connect them; NSGs control subnet-level traffic." },
        { q: "What is Azure Service Bus?", a: ["Managed message broker", "Compute service", "Database service", "Storage service"], c: 0, e: "Service Bus queues (point-to-point) and topics with subscriptions (pub/sub) provide enterprise messaging with dead-letter queues." },
        { q: "What is Azure Key Vault?", a: ["Secrets and key management", "Container registry", "Code repository", "CI/CD platform"], c: 0, e: "Key Vault stores secrets, encryption keys, and TLS certificates with HSM backing; apps retrieve them at runtime via managed identity." },
        { q: "What is an Azure Subscription?", a: ["Billing and resource boundary", "Virtual machine type", "Network zone", "Storage tier"], c: 0, e: "Subscriptions are billing units and RBAC boundaries; use separate subscriptions per environment for isolation and cost tracking." },
        { q: "What is Azure Policy?", a: ["Governance rules for resources", "User access management", "Network routing config", "Storage tier selection"], c: 0, e: "Azure Policy evaluates resources at create/update time and can deny, audit, or auto-remediate non-compliant configurations." },
        { q: "What is Azure Logic Apps?", a: ["Workflow automation service", "Container orchestration", "Relational database service", "Monitoring solution"], c: 0, e: "Logic Apps is a low-code integration service with 400+ connectors (Office 365, SAP, Salesforce) for workflow automation." }
    ],
    devsecops: [
        { q: "Which practice best embodies the 'shift left' principle in DevSecOps?", a: ["Running SAST scans on every pull request", "Performing penetration tests before release", "Hiring a dedicated security team", "Adding firewalls at the network boundary"], c: 0, e: "Shift left means moving security to the earliest stage—PR time—so developers fix issues before they enter the main branch." },
        { q: "What is 'shift left'?", a: ["Earlier security testing", "Code formatting", "Left alignment", "Branch merging"], c: 0, e: "On a SDLC timeline (left = design, right = production), shifting left means finding security issues during design and coding, not operations." },
        { q: "What is SAST?", a: ["Static Application Security Testing", "System Admin Security Tool", "Server Authentication", "Storage Access Service"], c: 0, e: "SAST tools (Semgrep, Checkmarx, CodeQL) scan source code without executing it to find injection flaws, XSS, hardcoded secrets, etc." },
        { q: "What is DAST?", a: ["Dynamic Application Security Testing", "Data Admin Security Tool", "Database Access Service", "Deployment Auto Security"], c: 0, e: "DAST tools (OWASP ZAP, Burp Suite) probe a running app from the outside, finding runtime issues SAST can't see." },
        { q: "What is container scanning?", a: ["Checking images for vulnerabilities", "Creating containers", "Running containers", "Deleting containers"], c: 0, e: "Tools like Trivy and Grype scan image layers for CVEs in OS packages and app libraries; run in CI before pushing to registry." },
        { q: "What is secret management?", a: ["Securing sensitive data", "Project management", "Code versioning", "Log management"], c: 0, e: "Never hardcode secrets; use Vault, AWS Secrets Manager, or Azure Key Vault and retrieve them at runtime via managed identity." },
        { q: "What is OWASP Top 10?", a: ["Web security risks list", "Programming languages", "Cloud providers", "CI/CD tools"], c: 0, e: "OWASP Top 10 lists the most critical web risks (Injection, Broken Auth, XSS, IDOR…); it's updated periodically based on industry data." },
        { q: "What is Trivy?", a: ["Vulnerability scanner", "Container runtime", "CI/CD tool", "Monitoring system"], c: 0, e: "Trivy (Aqua Security) scans container images, filesystems, Git repos, and IaC files for CVEs and misconfigurations." },
        { q: "What is dependency scanning?", a: ["Checking libraries for vulnerabilities", "Installing packages", "Updating code", "Building images"], c: 0, e: "Tools like Snyk, Dependabot, and OWASP Dependency-Check flag third-party libraries with known CVEs in your package manifest." },
        { q: "What is a CVE?", a: ["Common Vulnerabilities and Exposures", "Code Version Error", "Container Virtual Environment", "Cloud Vendor Edition"], c: 0, e: "CVEs are public identifiers (e.g., CVE-2021-44228 = Log4Shell) assigned by MITRE; NVD adds CVSS severity scores." },
        { q: "What is threat modeling?", a: ["Identifying security risks early", "Network performance monitoring", "Load testing", "Code review process"], c: 0, e: "STRIDE (Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation of Privilege) is a common threat modeling framework." },
        { q: "What is a security gate in a pipeline?", a: ["Automated security check that blocks failures", "Physical server access control", "Network firewall rule", "Database security policy"], c: 0, e: "Security gates run tools (Trivy, SonarQube, Checkov) and fail the pipeline if thresholds (critical CVEs, coverage) are exceeded." },
        { q: "What is HashiCorp Vault used for?", a: ["Secrets management", "Container orchestration", "CI/CD automation", "Infrastructure monitoring"], c: 0, e: "Vault stores secrets, issues short-lived dynamic credentials (e.g., DB passwords), and provides encryption as a service." },
        { q: "What is SonarQube?", a: ["Code quality and security analyzer", "Container image scanner", "CI/CD orchestrator", "Monitoring platform"], c: 0, e: "SonarQube combines SAST, code smell detection, and code coverage; quality gates block PRs that fail defined thresholds." },
        { q: "What is an SBOM?", a: ["Software Bill of Materials", "Secure Build Output Manifest", "Source Branch Operations Map", "Service Bus Object Model"], c: 0, e: "SBOMs (CycloneDX, SPDX format) list all components with versions; required by US EO 14028 for federal software supply chain." },
        { q: "What is the principle of least privilege?", a: ["Minimal access rights needed", "Admin access for all users", "Shared team credentials", "Public read access"], c: 0, e: "Least privilege limits blast radius: if an account is compromised, attackers can only access what that account was permitted to." },
        { q: "What is MFA?", a: ["Multi-Factor Authentication", "Multi-Function Application", "Main Firewall Application", "Managed Function App"], c: 0, e: "MFA requires something you know (password) + something you have (TOTP, hardware key) or are (biometrics)." },
        { q: "What is Snyk?", a: ["Developer security platform", "Container orchestrator", "CI/CD tool", "Log aggregator"], c: 0, e: "Snyk integrates into IDEs, CI, and Git to scan code, open source dependencies, containers, and IaC for vulnerabilities." },
        { q: "What is IaC security scanning?", a: ["Checking infrastructure code for vulnerabilities", "Monitoring network traffic", "Managing user access rights", "Testing application performance"], c: 0, e: "Tools like Checkov, tfsec, and KICS scan Terraform, CloudFormation, and Kubernetes YAML for misconfigurations before apply." },
        { q: "What is zero trust security?", a: ["Never trust, always verify every request", "Trust all internal network traffic", "Trust verified users indefinitely", "Block all external traffic"], c: 0, e: "Zero trust assumes breach: authenticate and authorize every request, enforce least privilege, and inspect all traffic regardless of network." }
    ],
    networking: [
        { q: "What does DNS do?", a: ["Translates domains to IPs", "Encrypts data", "Routes traffic", "Balances load"], c: 0, e: "DNS resolves human-readable names to IPs via a hierarchy: resolver → root → TLD → authoritative nameserver." },
        { q: "What is a load balancer?", a: ["Distributes traffic", "Stores data", "Encrypts traffic", "Monitors servers"], c: 0, e: "Load balancers improve availability and throughput; algorithms include round-robin, least connections, and IP hash." },
        { q: "What is the key difference between TCP and UDP?", a: ["TCP guarantees delivery and ordering; UDP is connectionless and faster but unreliable", "UDP encrypts all traffic; TCP does not", "TCP works at layer 7; UDP works at layer 3", "UDP supports more concurrent connections than TCP"], c: 0, e: "TCP's reliability overhead adds latency; UDP is preferred for streaming, gaming, and DNS where speed matters more than retransmission." },
        { q: "What does HTTP status code 502 Bad Gateway mean?", a: ["The server acting as a gateway received an invalid response from the upstream server", "The client sent a malformed request", "The requested resource was permanently moved", "The server is temporarily unavailable due to maintenance"], c: 0, e: "502 usually means the upstream app server is crashed or returning garbage; check app logs and health. 503 = up but overloaded." },
        { q: "What is a reverse proxy?", a: ["Forwards requests to backend", "Client-side proxy", "VPN connection", "Firewall rule"], c: 0, e: "Reverse proxies (Nginx, HAProxy, Traefik) handle TLS termination, caching, compression, and backend routing." },
        { q: "What is HTTPS?", a: ["HTTP with encryption", "High-speed HTTP", "HTTP server", "HTTP standard"], c: 0, e: "HTTPS wraps HTTP in a TLS session; the cert authenticates the server and the session key encrypts the payload." },
        { q: "What is mutual TLS (mTLS)?", a: ["Both the client and server authenticate each other using certificates", "TLS where only the server provides a certificate", "A TLS version that requires two separate handshakes", "TLS with automatic key rotation every session"], c: 0, e: "mTLS is used in service meshes (Istio, Linkerd) and zero-trust architectures; both sides present X.509 certificates." },
        { q: "What is NAT?", a: ["Network Address Translation", "Network Admin Tool", "Node Access Terminal", "Network Auto Test"], c: 0, e: "NAT maps private IPs to a public IP; a NAT gateway (AWS, Azure) maintains a translation table for outbound connections." },
        { q: "What is a subnet?", a: ["Network subdivision", "Server type", "Protocol version", "Port range"], c: 0, e: "Subnets subdivide a VPC's CIDR block; public subnets have an internet gateway route, private subnets use NAT." },
        { q: "What is CIDR notation?", a: ["IP address range format", "Security protocol", "Routing algorithm", "DNS record type"], c: 0, e: "192.168.1.0/24 = 256 addresses; /16 = 65,536; /32 = 1 (single host). The prefix length defines the network bits." },
        { q: "What is SSL/TLS?", a: ["Encryption protocols", "Routing protocols", "Transfer protocols", "Authentication protocols"], c: 0, e: "SSL is deprecated; TLS 1.2 and 1.3 are current. TLS 1.3 is faster (1-RTT handshake) and removes weak cipher suites." },
        { q: "What is a CDN?", a: ["Content Delivery Network", "Central Data Node", "Cloud Database Network", "Container Distribution Network"], c: 0, e: "CDNs cache static assets at edge POPs globally, reducing latency and offloading origin servers; also provide DDoS protection." },
        { q: "What is a VLAN?", a: ["Virtual LAN segment", "Very Large Area Network", "Virtual Load Application Network", "Variable Length Area Node"], c: 0, e: "VLANs segment a physical switch into isolated Layer 2 domains, improving security and reducing broadcast domains." },
        { q: "What is BGP?", a: ["Border Gateway Protocol", "Basic Gateway Protocol", "Binary Graph Protocol", "Bridge Gateway Port"], c: 0, e: "BGP is the internet's routing protocol; it exchanges prefixes between autonomous systems (ISPs, cloud providers, enterprises)." },
        { q: "What does MTU stand for?", a: ["Maximum Transmission Unit", "Minimum Transfer Unit", "Maximum Transfer Usage", "Multiple Transmission Unit"], c: 0, e: "Standard Ethernet MTU is 1500 bytes; mismatched MTUs cause silent packet drops. Jumbo frames use 9000 bytes on supported networks." },
        { q: "What is ICMP used for?", a: ["Error messages and diagnostics", "File transfer", "Email delivery", "Web content delivery"], c: 0, e: "ICMP powers ping (echo request/reply) and traceroute (TTL exceeded messages); blocking it can break path MTU discovery." },
        { q: "What is an API Gateway?", a: ["Manages and routes API requests", "Network switch", "DNS server", "Firewall"], c: 0, e: "API gateways (AWS API Gateway, Kong, Apigee) handle auth, rate limiting, request transformation, and routing to backend services." },
        { q: "What is anycast routing?", a: ["One IP, nearest of many servers", "One IP, one fixed server", "Many IPs, one server", "Broadcast to all servers"], c: 0, e: "Anycast routes traffic to the topologically nearest server sharing the same IP; DNS resolvers and CDN edge nodes use it." },
        { q: "Which HTTP status code means the server understood the request but refuses to authorize it?", a: ["403 Forbidden", "401 Unauthorized", "404 Not Found", "429 Too Many Requests"], c: 0, e: "401 means 'not authenticated yet'; 403 means 'authenticated but you don't have permission'—despite its confusing name." },
        { q: "What is a service mesh?", a: ["Infrastructure for service-to-service communication", "Physical network cabling", "DNS management system", "Hardware load balancer"], c: 0, e: "Service meshes (Istio, Linkerd) inject sidecars to add mTLS, retries, circuit breaking, and telemetry without app code changes." }
    ]
};

// Topic configuration
const TOPICS = [
    { id: 'docker', name: 'Docker', icon: '🐳', color: '#0db7ed', desc: 'Build, run & manage containers from basics to Compose' },
    { id: 'kubernetes', name: 'Kubernetes', icon: '☸️', color: '#326ce5', desc: 'Orchestrate containers at scale with K8s objects & patterns' },
    { id: 'cicd', name: 'CI/CD', icon: '🔄', color: '#f97316', desc: 'Automate builds, tests & deployments with modern pipelines' },
    { id: 'aws', name: 'AWS', icon: '☁️', color: '#ff9900', desc: 'Navigate cloud services from EC2 and S3 to Lambda & IAM' },
    { id: 'terraform', name: 'Terraform', icon: '🏗️', color: '#7b42bc', desc: 'Define & provision infrastructure as code with HCL' },
    { id: 'git', name: 'Git', icon: '🌿', color: '#f05032', desc: 'Master version control from commits to complex rebases' },
    { id: 'linux', name: 'Linux', icon: '🐧', color: '#fcc624', desc: 'Navigate the command line, manage systems & write scripts' },
    { id: 'monitoring', name: 'Monitoring', icon: '📊', color: '#00c853', desc: 'Observe systems with metrics, traces, logs & alerting' },
    { id: 'ansible', name: 'Ansible', icon: '🔧', color: '#ee0000', desc: 'Automate configuration & deployments with idempotent playbooks' },
    { id: 'azure', name: 'Azure', icon: '🔷', color: '#0078d4', desc: 'Cloud engineering on Azure from VMs to AKS & Functions' },
    { id: 'devsecops', name: 'DevSecOps', icon: '🔒', color: '#dc2626', desc: 'Shift security left with scanning, hardening & zero trust' },
    { id: 'networking', name: 'Networking', icon: '🌐', color: '#0891b2', desc: 'Master protocols, traffic routing, TLS & service mesh' }
];

// Cached sprite references (populated after asset loading)
const spriteCache = { player: null, enemy: null, background: null };

// Assets Configuration
const ASSETS = {
    images: {
        enemy: 'assets/enemy_ship.png',
        player: 'assets/player_ship.png',
        background: 'assets/background.png',
        // item_health: 'assets/item_health.png', // Uncomment when available
        // item_shield: 'assets/item_shield.png'  // Uncomment when available
    },
    loaded: {}
};

// ... (AssetLoader remains same) ...
const AssetLoader = {
    total: 0,
    loaded: 0,

    loadAll(callback) {
        const sources = ASSETS.images;
        const imageNames = Object.keys(sources);
        this.total = imageNames.length;
        this.loaded = 0;

        if (this.total === 0) {
            callback();
            return;
        }

        imageNames.forEach(name => {
            const img = new Image();
            img.onload = () => {
                this.loaded++;
                ASSETS.loaded[name] = img;
                if (this.loaded === this.total) {
                    callback();
                }
            };
            img.onerror = () => {
                console.warn(`Failed to load asset: ${sources[name]}`);
                this.loaded++; // Count error as handled
                if (this.loaded === this.total) {
                    callback();
                }
            };
            img.src = sources[name];
        });
    },

    getImage(name) {
        return ASSETS.loaded[name];
    }
};

// Cached DOM references (populated in init)
const domCache = {};

// Game State
let game = {
    mode: 'adventure',
    running: false,
    paused: false,
    canvas: null,
    ctx: null,
    animationId: null,

    // Player
    player: {
        x: 0,
        y: 0,
        width: 60,
        height: 60,
        health: 100,
        maxHealth: 100,
        shield: 0,
        speed: CONFIG.PLAYER_SPEED
    },

    // Game stats
    score: 0,
    streak: 0,
    bestStreak: 0,
    multiplier: 1,
    questionsAnswered: 0,
    correctAnswers: 0,

    // Level/Zone
    currentZone: 0,
    currentWave: 1,
    enemiesDefeated: 0,

    // Enemies and objects
    enemies: [],
    projectiles: [],
    particles: [],
    powerups: [],
    stars: [],
    shake: 0, // Canvas shake magnitude

    // Question state
    currentQuestion: null,
    questionActive: false,
    questionTimer: 0,
    selectedAnswer: -1,

    // Input
    keys: {},

    // High score
    highScore: 0,

    // Shooting
    lastFireTime: 0,

    // HUD dirty-check cache (avoids redundant DOM writes every frame)
    _hud: {},

    // Reusable Map for particle color batching (avoids per-frame allocations)
    _particleGroups: new Map()
};

// Initialize game on load
document.addEventListener('DOMContentLoaded', init);

/**
 * Bootstrap the game: load image assets, cache DOM references, wire up event
 * listeners, and render the initial main-menu state.
 * Called once on DOMContentLoaded.
 */
function init() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');

    // Load assets then initialize
    AssetLoader.loadAll(() => {
        // Cache sprite references to avoid per-frame object lookups
        spriteCache.player = AssetLoader.getImage('player');
        spriteCache.enemy = AssetLoader.getImage('enemy');
        spriteCache.background = AssetLoader.getImage('background');

        setupEventListeners();
        renderTopicGrid();
        resizeCanvas();

        // Cache frequently accessed DOM elements
        domCache.healthFill    = document.getElementById('healthFill');
        domCache.healthText    = document.getElementById('healthText');
        domCache.healthBar     = document.getElementById('healthBar');
        domCache.shieldFill    = document.getElementById('shieldFill');
        domCache.shieldBar     = document.getElementById('shieldBar');
        domCache.scoreValue    = document.getElementById('scoreValue');
        domCache.streakValue   = document.getElementById('streakValue');
        domCache.multiplier    = document.getElementById('multiplier');
        domCache.multiplier.addEventListener('animationend', () => {
            domCache.multiplier.classList.remove('pop');
        });
        domCache.levelLabel    = document.getElementById('levelLabel');
        domCache.levelName     = document.getElementById('levelName');
        domCache.waveNumber    = document.getElementById('waveNumber');
        domCache.timerFill     = document.getElementById('timerFill');
        domCache.timerText     = document.getElementById('timerText');
        domCache.questionPanel = document.getElementById('questionPanel');
        domCache.questionTopic = document.getElementById('questionTopic');
        domCache.questionText  = document.getElementById('questionText');
        domCache.answerGrid    = document.getElementById('answerGrid');
        domCache.questionExplanation = document.getElementById('questionExplanation');
        domCache.pauseMenu     = document.getElementById('pauseMenu');
        domCache.gameOver      = document.getElementById('gameOver');
        domCache.levelComplete = document.getElementById('levelComplete');
        domCache.globalMenuBtn  = document.getElementById('globalMenuBtn');
        domCache.newHighScore   = document.getElementById('newHighScore');
        domCache.menuHighScore  = document.getElementById('menuHighScore');
        domCache.ariaAnnouncer  = document.getElementById('ariaAnnouncer');
        domCache.zoneCompleteIcon = document.getElementById('zoneCompleteIcon');
        domCache.zoneCompleteName = document.getElementById('zoneCompleteName');
        domCache.zoneScore      = document.getElementById('zoneScore');
        domCache.zoneAccuracy   = document.getElementById('zoneAccuracy');
        domCache.finalScore     = document.getElementById('finalScore');
        domCache.questionsAnswered = document.getElementById('questionsAnswered');
        domCache.accuracy       = document.getElementById('accuracy');
        domCache.bestStreak     = document.getElementById('bestStreak');
        domCache.gameOverTitle  = document.querySelector('.game-over-title');
        domCache.screens        = Array.from(document.querySelectorAll('.screen'));

        loadHighScore();
        let _resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(_resizeTimer);
            _resizeTimer = setTimeout(resizeCanvas, 100);
        });
    });
}

function announce(message) {
    if (!domCache.ariaAnnouncer) return;
    // Clear first so repeated messages re-trigger screen readers
    domCache.ariaAnnouncer.textContent = '';
    requestAnimationFrame(() => {
        domCache.ariaAnnouncer.textContent = message;
    });
}

function loadHighScore() {
    game.highScore = parseInt(localStorage.getItem('devops-defender-highscore') || '0', 10) || 0;
    if (domCache.menuHighScore) domCache.menuHighScore.textContent = game.highScore;
}

function saveHighScore() {
    if (game.score > game.highScore) {
        game.highScore = game.score;
        localStorage.setItem('devops-defender-highscore', game.highScore);
        return true;
    }
    return false;
}

function setupEventListeners() {
    // Button handlers (replaces inline onclick attributes for CSP compliance)
    document.getElementById('globalMenuBtn').addEventListener('click', togglePause);
    document.getElementById('btnAdventure').addEventListener('click', () => startGame('adventure'));
    document.getElementById('btnEndless').addEventListener('click', () => startGame('endless'));
    document.getElementById('btnSpeedQuiz').addEventListener('click', () => startGame('speedquiz'));
    document.getElementById('btnPractice').addEventListener('click', () => showScreen('topicSelect'));
    document.getElementById('btnHowToPlay').addEventListener('click', () => showScreen('howToPlay'));
    document.getElementById('btnExit').addEventListener('click', () => { window.close(); history.back(); });
    document.getElementById('btnBackFromTopics').addEventListener('click', () => showScreen('mainMenu'));
    document.getElementById('btnBackFromHowToPlay').addEventListener('click', () => showScreen('mainMenu'));
    document.getElementById('btnResume').addEventListener('click', resumeGame);
    document.getElementById('btnRestartPause').addEventListener('click', restartGame);
    document.getElementById('btnQuitFromPause').addEventListener('click', quitToMenu);
    document.getElementById('btnPlayAgain').addEventListener('click', restartGame);
    document.getElementById('btnMainMenu').addEventListener('click', quitToMenu);
    document.getElementById('btnNextZone').addEventListener('click', nextZone);
    const menuIconImg = document.querySelector('.menu-icon-img');
    if (menuIconImg) menuIconImg.addEventListener('error', () => { menuIconImg.style.display = 'none'; });

    document.addEventListener('keydown', (e) => {
        game.keys[e.key.toLowerCase()] = true;

        if (game.running) {
            // Pause toggle works in both directions
            if (e.key.toLowerCase() === 'p') {
                togglePause();
            }

            if (!game.paused) {
                // Answer selection with number keys
                if (game.questionActive && ['1', '2', '3', '4'].includes(e.key)) {
                    selectAnswer(parseInt(e.key) - 1);
                }

                // Shoot with space (when not answering)
                if (e.key === ' ' && !game.questionActive) {
                    shoot();
                }
            }
        }

        // Prevent scrolling
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => {
        game.keys[e.key.toLowerCase()] = false;
    });

    // Auto-pause when user switches tabs or minimises the window
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && game.running && !game.paused) {
            togglePause();
        }
    });
}

function resizeCanvas() {
    game.canvas.width = window.innerWidth;
    game.canvas.height = window.innerHeight;

    // Recompute cached background draw dimensions
    const bg = spriteCache.background;
    if (bg) {
        const scale = Math.max(game.canvas.width / bg.width, game.canvas.height / bg.height);
        game.bgDrawW = bg.width * scale;
        game.bgDrawH = bg.height * scale;
    }
}

function renderTopicGrid() {
    const grid = document.getElementById('topicGrid');
    grid.replaceChildren();

    TOPICS.forEach(topic => {
        const card = document.createElement('div');
        card.className = 'topic-card';
        card.style.setProperty('--topic-color', topic.color);
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `${topic.name} - ${QUESTIONS[topic.id].length} questions`);
        const iconDiv = document.createElement('div');
        iconDiv.className = 'topic-card-icon';
        iconDiv.setAttribute('aria-hidden', 'true');
        iconDiv.textContent = topic.icon;
        const nameDiv = document.createElement('div');
        nameDiv.className = 'topic-card-name';
        nameDiv.textContent = topic.name;
        const descDiv = document.createElement('div');
        descDiv.className = 'topic-card-desc';
        descDiv.textContent = topic.desc;
        const countDiv = document.createElement('div');
        countDiv.className = 'topic-card-count';
        countDiv.textContent = `${QUESTIONS[topic.id].length} questions`;
        card.appendChild(iconDiv);
        card.appendChild(nameDiv);
        card.appendChild(descDiv);
        card.appendChild(countDiv);
        card.onclick = () => startGame('practice', topic.id);
        card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame('practice', topic.id); } };
        grid.appendChild(card);
    });
}

// Screen management
function showScreen(screenId) {
    domCache.screens.forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

/**
 * Reset all game state and begin a new session.
 * @param {'adventure'|'endless'|'speedquiz'|'practice'} mode - Game mode to start.
 * @param {string|null} topicId - Required for 'practice' mode; the TOPICS id to drill.
 */
function startGame(mode, topicId = null) {
    game.mode = mode;
    game.running = true;
    game.paused = false;

    // Reset game state
    game.player.x = game.canvas.width / 2;
    game.player.y = game.canvas.height - 150;
    game.player.health = game.player.maxHealth;
    game.player.shield = 0;

    game.score = 0;
    game.streak = 0;
    game.bestStreak = 0;
    game.multiplier = 1;
    game.questionsAnswered = 0;
    game.correctAnswers = 0;

    game.currentZone = topicId ? TOPICS.findIndex(t => t.id === topicId) : 0;
    game.currentWave = 1;
    game.enemiesDefeated = 0;

    game.enemies = [];
    game.projectiles = [];
    game.particles = [];
    game.powerups = [];
    game.stars = [];

    game.currentQuestion = null;
    game.questionActive = false;

    // Initialize stars
    for (let i = 0; i < 100; i++) {
        game.stars.push({
            x: Math.random() * game.canvas.width,
            y: Math.random() * game.canvas.height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 2 + 0.5
        });
    }

    showScreen('gameScreen');
    hideAllOverlays();
    updateHUD();

    // Show global menu button
    domCache.globalMenuBtn.style.display = 'flex';

    // Start game loop
    if (game.animationId) cancelAnimationFrame(game.animationId);
    gameLoop();

    // Spawn first wave
    setTimeout(() => spawnWave(), 1000);
}

function hideAllOverlays() {
    domCache.pauseMenu.classList.add('hidden');
    domCache.gameOver.classList.add('hidden');
    domCache.levelComplete.classList.add('hidden');
    domCache.questionPanel.classList.add('hidden');
}

/**
 * Main game loop driven by requestAnimationFrame.
 * Calls update() then render() every frame unless the game is paused.
 * Stores the animation frame ID in game.animationId so it can be cancelled.
 */
function gameLoop() {
    if (!game.running) return;

    if (!game.paused) {
        update();
        render();
    }

    game.animationId = requestAnimationFrame(gameLoop);
}

function update() {
    // Update stars (parallax background)
    game.stars.forEach(star => {
        star.y += star.speed;
        if (star.y > game.canvas.height) {
            star.y = 0;
            star.x = Math.random() * game.canvas.width;
        }
    });

    // Player movement
    if (!game.questionActive) {
        if (game.keys['arrowleft'] || game.keys['a']) {
            game.player.x = Math.max(game.player.width / 2, game.player.x - game.player.speed);
        }
        if (game.keys['arrowright'] || game.keys['d']) {
            game.player.x = Math.min(game.canvas.width - game.player.width / 2, game.player.x + game.player.speed);
        }
        if (game.keys['arrowup'] || game.keys['w']) {
            game.player.y = Math.max(game.canvas.height / 2, game.player.y - game.player.speed);
        }
        if (game.keys['arrowdown'] || game.keys['s']) {
            game.player.y = Math.min(game.canvas.height - game.player.height / 2, game.player.y + game.player.speed);
        }
    }

    // Update enemies (pause when question is active)
    if (!game.questionActive) {
        game.enemies.forEach(enemy => {
            enemy.y += enemy.speed;
            enemy.wobble += 0.05;
            enemy.x += Math.sin(enemy.wobble) * 0.5;

            // Check collision between player ship and enemy
            if (!enemy.triggered) {
                const dx = game.player.x - enemy.x;
                const dy = game.player.y - enemy.y;
                const collisionThreshold = 45; // Combined radius of player and enemy

                if (dx * dx + dy * dy < collisionThreshold * collisionThreshold) {
                    enemy.triggered = true;
                    showQuestion(enemy);
                    return; // Stop processing this enemy
                }
            }

            // Check if enemy reached player zone (fallback trigger)
            if (enemy.y > game.canvas.height - 200 && !enemy.triggered) {
                enemy.triggered = true;
                showQuestion(enemy);
            }
        });

        // Update projectiles and check collisions
        for (let i = game.projectiles.length - 1; i >= 0; i--) {
            const p = game.projectiles[i];
            p.y -= p.speed;
            let remove = p.y < 0;

            if (!remove) {
                for (let enemy of game.enemies) {
                    const dx = p.x - enemy.x;
                    const dy = p.y - enemy.y;
                    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) {
                        enemy.health -= CONFIG.SHOOT_DAMAGE;
                        createHitParticles(enemy.x, enemy.y);
                        if (enemy.health <= 0 && !enemy.triggered) {
                            destroyEnemyByShot(enemy);
                        }
                        remove = true;
                        break;
                    }
                }
            }

            if (remove) {
                game.projectiles[i] = game.projectiles[game.projectiles.length - 1];
                game.projectiles.pop();
            }
        }
    }

    // Update particles
    for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.vy += 0.1; // gravity
        if (p.life <= 0) {
            game.particles[i] = game.particles[game.particles.length - 1];
            game.particles.pop();
        }
    }

    // Update powerups
    for (let i = game.powerups.length - 1; i >= 0; i--) {
        const p = game.powerups[i];
        p.y += 1;

        const dx = p.x - game.player.x;
        const dy = p.y - game.player.y;
        const remove = dx * dx + dy * dy < 1600 // 40 * 40
            ? (applyPowerup(p.type), true)
            : p.y >= game.canvas.height;

        if (remove) {
            game.powerups[i] = game.powerups[game.powerups.length - 1];
            game.powerups.pop();
        }
    }

    // Question timer
    if (game.questionActive && game.questionTimer > 0) {
        game.questionTimer -= 1 / 60;
        updateTimerDisplay();

        if (game.questionTimer <= 0) {
            handleTimeout();
        }
    }

    // Decay shake
    if (game.shake > 0) {
        game.shake *= 0.9;
        if (game.shake < 0.5) game.shake = 0;
    }
}

function render() {
    const ctx = game.ctx;

    // Clear canvas
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);

    ctx.save(); // Save before shake

    // Apply shake
    if (game.shake > 0) {
        const dx = (Math.random() - 0.5) * game.shake;
        const dy = (Math.random() - 0.5) * game.shake;
        ctx.translate(dx, dy);
    }

    // Draw Background Asset
    const bg = spriteCache.background;
    if (bg && game.bgDrawW) {
        ctx.globalAlpha = 0.5; // Dim it slightly so game elements pop
        ctx.drawImage(bg, (game.canvas.width - game.bgDrawW) / 2, (game.canvas.height - game.bgDrawH) / 2, game.bgDrawW, game.bgDrawH);
        ctx.globalAlpha = 1.0;
    }

    // Draw stars (keep them as they add nice depth over the background)
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    for (const star of game.stars) {
        const d = star.size * 2;
        ctx.rect(star.x - star.size, star.y - star.size, d, d);
    }
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Draw particles, batched by color to reduce fillStyle changes per frame
    if (game.particles.length > 0) {
        const colorGroups = game._particleGroups;
        colorGroups.forEach(arr => { arr.length = 0; });
        for (const p of game.particles) {
            if (p.life < 0.03) continue; // Skip near-invisible particles
            let group = colorGroups.get(p.color);
            if (!group) { group = []; colorGroups.set(p.color, group); }
            group.push(p);
        }
        colorGroups.forEach((group, color) => {
            ctx.fillStyle = `rgb(${color})`;
            for (const p of group) {
                ctx.globalAlpha = p.life;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1.0;
    }

    // Draw powerups
    if (game.powerups.length > 0) {
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        game.powerups.forEach(p => {
            ctx.fillText(p.type === 'health' ? '❤️' : '🛡️', p.x, p.y);
        });
    }

    // Draw enemies (sprites/shapes)
    game.enemies.forEach(enemy => {
        drawEnemy(enemy);
    });

    // Draw enemy icons in a single batched pass (one font setup for all enemies)
    if (game.enemies.length > 0) {
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        game.enemies.forEach(enemy => {
            ctx.save();
            ctx.translate(enemy.x, enemy.y);
            ctx.fillText(enemy.icon, 0, 50);
            ctx.restore();
        });
    }

    // Draw projectiles (single path + fill for all projectiles)
    if (game.projectiles.length > 0) {
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        for (const p of game.projectiles) {
            ctx.moveTo(p.x + 5, p.y);
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        }
        ctx.fill();
    }

    // Draw player
    drawPlayer();

    ctx.restore(); // Restore after shake
}

function drawPlayer() {
    const ctx = game.ctx;
    const p = game.player;

    ctx.save();
    ctx.translate(p.x, p.y);

    // Check for sprite
    const sprite = spriteCache.player;

    if (sprite) {
        // Draw sprite
        const size = 80;
        ctx.drawImage(sprite, -size / 2, -size / 2, size, size);

        // Shield effect overlay
        if (p.shield > 0) {
            ctx.strokeStyle = `rgba(0, 212, 255, ${p.shield / 100})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 40, 0, Math.PI * 2);
            ctx.stroke();
        }
    } else {
        // Fallback: Code-drawn ship
        // Glow effect
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 20;

        // Ship body
        ctx.fillStyle = '#1a1a3a';
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(-25, 25);
        ctx.lineTo(-10, 15);
        ctx.lineTo(0, 25);
        ctx.lineTo(10, 15);
        ctx.lineTo(25, 25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.ellipse(0, -5, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Engine glow
        if (!game.questionActive) {
            ctx.fillStyle = '#ff6b35';
            ctx.shadowColor = '#ff6b35';
            ctx.beginPath();
            ctx.moveTo(-8, 20);
            ctx.lineTo(0, 35 + Math.random() * 10);
            ctx.lineTo(8, 20);
            ctx.closePath();
            ctx.fill();
        }

        // Shield effect
        if (p.shield > 0) {
            ctx.strokeStyle = `rgba(0, 212, 255, ${p.shield / 100})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 40, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    ctx.restore();
}

function drawEnemy(enemy) {
    const ctx = game.ctx;

    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    // Check for sprite
    const sprite = spriteCache.enemy;

    if (sprite) {
        // Draw sprite
        const size = 60;
        ctx.save();
        ctx.rotate(Math.PI);
        ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
        ctx.restore();
    } else {
        // Fallback drawing
        // Glow
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 15;

        // Enemy ship (inverted triangle)
        ctx.fillStyle = '#1a1a3a';
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, 25);
        ctx.lineTo(-20, -20);
        ctx.lineTo(0, -10);
        ctx.lineTo(20, -20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    ctx.restore();
}

// Question system
/**
 * Display a question panel triggered by the given enemy.
 * Picks a random question from the current zone's pool, Fisher-Yates shuffles
 * the answer choices, and tracks which shuffled index is correct.
 * @param {object} enemy - The enemy object that triggered the question.
 */
function showQuestion(enemy) {
    const topic = TOPICS[game.currentZone];
    const questions = QUESTIONS[topic.id];
    const question = questions[Math.floor(Math.random() * questions.length)];

    // Create shuffled answers with indices
    const answers = question.a.map((text, originalIndex) => ({ text, originalIndex }));
    // Fisher-Yates shuffle
    for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
    }

    // Find where the correct answer ended up after shuffle
    const correctShuffledIndex = answers.findIndex(a => a.originalIndex === question.c);

    game.currentQuestion = { ...question, enemy, correctIndex: correctShuffledIndex, shuffledAnswers: answers };
    game.questionActive = true;
    game.questionTimer = game.mode === 'speedquiz' ? CONFIG.SPEEDQUIZ_QUESTION_TIME : CONFIG.QUESTION_TIME;
    game.selectedAnswer = -1;
    game._lastTimerWidth = 101; // force first timer update
    game._timerDangerAnnounced = false;

    // Show question panel
    domCache.questionPanel.classList.remove('hidden');

    domCache.questionTopic.textContent = topic.name;
    domCache.questionText.textContent = question.q;

    domCache.answerGrid.replaceChildren();
    domCache.answerBtns = [];

    answers.forEach((answer, i) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.setAttribute('aria-label', `${i + 1}: ${answer.text}`);
        const keySpan = document.createElement('span');
        keySpan.className = 'answer-key';
        keySpan.setAttribute('aria-hidden', 'true');
        keySpan.textContent = i + 1;
        const textSpan = document.createElement('span');
        textSpan.className = 'answer-text';
        textSpan.textContent = answer.text;
        btn.appendChild(keySpan);
        btn.appendChild(textSpan);
        btn.onclick = () => selectAnswer(i);
        domCache.answerGrid.appendChild(btn);
        domCache.answerBtns.push(btn);
    });

    // Move focus to first answer so keyboard users can immediately select
    if (domCache.answerBtns.length > 0) {
        domCache.answerBtns[0].focus();
    }
}

/**
 * Register the player's answer selection and schedule answer checking.
 * Idempotent — ignores calls after the first selection.
 * @param {number} index - Zero-based index into the shuffled answer array.
 */
function selectAnswer(index) {
    if (!game.questionActive || game.selectedAnswer !== -1) return;

    game.selectedAnswer = index;
    const btns = domCache.answerBtns;

    btns.forEach((btn, i) => {
        btn.classList.add('disabled');
        btn.disabled = true;
        if (i === index) btn.classList.add('selected');
    });

    // Check answer after short delay
    setTimeout(() => checkAnswer(index), 300);
}

function checkAnswer(index) {
    const correct = index === game.currentQuestion.correctIndex;
    const btns = domCache.answerBtns;
    const enemy = game.currentQuestion.enemy; // Save reference before closeQuestion

    btns[game.currentQuestion.correctIndex].classList.add('correct');
    if (!correct) {
        btns[index].classList.add('incorrect');
    }

    game.questionsAnswered++;

    if (correct) {
        announce('Correct!');
        handleCorrectAnswer();
    } else {
        const correctText = game.currentQuestion.shuffledAnswers[game.currentQuestion.correctIndex].text;
        announce(`Wrong! −${CONFIG.DAMAGE_WRONG} HP. The correct answer is: ${correctText}`);
        handleWrongAnswer();
    }

    // Show explanation if available
    if (domCache.questionExplanation && game.currentQuestion.e) {
        domCache.questionExplanation.textContent = game.currentQuestion.e;
        domCache.questionExplanation.classList.remove('hidden');
    }

    // Close question and destroy enemy — longer delay on wrong answers so the player can read the correct one
    const closeDelay = correct ? 800 : 1500;
    setTimeout(() => {
        closeQuestion();
        destroyEnemy(enemy);
    }, closeDelay);
}

/**
 * Award points for a correct answer.
 * Points = BASE_SCORE [+ SPEED_BONUS if answered in < 5s] × streak multiplier.
 * Streak multiplier increases by STREAK_MULTIPLIER every 3 consecutive correct answers.
 */
function handleCorrectAnswer() {
    game.correctAnswers++;
    game.streak++;
    game.bestStreak = Math.max(game.bestStreak, game.streak);

    // Calculate score
    let points = CONFIG.BASE_SCORE;

    // Speed bonus: answered in first 5 seconds
    const maxTime = game.mode === 'speedquiz' ? CONFIG.SPEEDQUIZ_QUESTION_TIME : CONFIG.QUESTION_TIME;
    if (game.questionTimer > maxTime - 5) {
        points += CONFIG.SPEED_BONUS;
    }

    // Streak multiplier
    game.multiplier = 1 + Math.floor(game.streak / 3) * CONFIG.STREAK_MULTIPLIER;
    points = Math.floor(points * game.multiplier);

    game.score += points;

    // Show floating score
    createScoreParticle(points);

    updateHUD();

    // Play sound effect (if implemented)
    // playSound('correct');
}

function handleWrongAnswer() {
    game.streak = 0;
    game.multiplier = 1;

    // Take damage
    takeDamage(CONFIG.DAMAGE_WRONG);

    updateHUD();
}

function handleTimeout() {
    game.questionsAnswered++;
    game.streak = 0;
    game.multiplier = 1;

    const enemy = game.currentQuestion.enemy; // Save reference before closeQuestion

    // Show correct answer
    const btns = domCache.answerBtns;
    btns[game.currentQuestion.correctIndex].classList.add('correct');

    announce(`Time's up! −${CONFIG.DAMAGE_TIMEOUT} HP.`);
    takeDamage(CONFIG.DAMAGE_TIMEOUT);

    // Show explanation if available
    if (domCache.questionExplanation && game.currentQuestion.e) {
        domCache.questionExplanation.textContent = game.currentQuestion.e;
        domCache.questionExplanation.classList.remove('hidden');
    }

    setTimeout(() => {
        closeQuestion();
        destroyEnemy(enemy);
    }, 1500);

    updateHUD();
}

function closeQuestion() {
    game.questionActive = false;
    game.currentQuestion = null;
    domCache.questionPanel.classList.add('hidden');
    if (domCache.questionExplanation) {
        domCache.questionExplanation.textContent = '';
        domCache.questionExplanation.classList.add('hidden');
    }
}

/**
 * Add a particle to the pool, respecting the MAX_PARTICLES cap.
 * The cap prevents GC pressure from unbounded array growth during heavy combat.
 * @param {object} p - Particle object: {x, y, vx, vy, size, color, life}.
 */
function pushParticle(p) {
    if (game.particles.length < CONFIG.MAX_PARTICLES) game.particles.push(p);
}

function destroyEnemy(enemy) {
    // Create explosion particles
    for (let i = 0; i < 20; i++) {
        pushParticle({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            size: Math.random() * 5 + 2,
            color: '255, 107, 53',
            life: 1
        });
    }

    // Remove enemy
    const _ei = game.enemies.indexOf(enemy); if (_ei !== -1) game.enemies.splice(_ei, 1);
    game.enemiesDefeated++;

    // Maybe spawn powerup
    if (Math.random() < 0.2) {
        spawnPowerup(enemy.x, enemy.y);
    }

    // Check wave completion
    if (game.enemies.length === 0) {
        setTimeout(() => completeWave(), 500);
    }
}

function takeDamage(amount) {
    // Shield absorbs damage first
    if (game.player.shield > 0) {
        const shieldDamage = Math.min(game.player.shield, amount);
        game.player.shield -= shieldDamage;
        amount -= shieldDamage;
    }

    game.player.health = Math.max(0, game.player.health - amount);

    game.shake = 20; // Canvas shake magnitude (handled by render loop translate)

    // Create damage particles
    for (let i = 0; i < 10; i++) {
        pushParticle({
            x: game.player.x,
            y: game.player.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            size: Math.random() * 4 + 2,
            color: '239, 68, 68',
            life: 1
        });
    }

    updateHUD();

    if (game.player.health <= 0) {
        gameOver();
    }
}

function spawnPowerup(x, y) {
    game.powerups.push({
        x,
        y,
        type: Math.random() < 0.5 ? 'health' : 'shield'
    });
}

// Shooting mechanics
function shoot() {
    const now = Date.now();
    if (now - game.lastFireTime < CONFIG.FIRE_RATE) return;
    game.lastFireTime = now;

    game.projectiles.push({
        x: game.player.x,
        y: game.player.y - 30,
        speed: CONFIG.PROJECTILE_SPEED
    });

    // Muzzle flash particles
    for (let i = 0; i < 3; i++) {
        pushParticle({
            x: game.player.x,
            y: game.player.y - 35,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 3 - 1,
            size: Math.random() * 3 + 1,
            color: '0, 212, 255',
            life: 0.3
        });
    }
}

function createHitParticles(x, y) {
    for (let i = 0; i < 5; i++) {
        pushParticle({
            x, y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 3 + 1,
            color: '255, 200, 50',
            life: 0.5
        });
    }
}

function destroyEnemyByShot(enemy) {
    // Explosion particles
    for (let i = 0; i < 15; i++) {
        pushParticle({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            size: Math.random() * 4 + 2,
            color: '0, 212, 255',
            life: 1
        });
    }

    const _ei = game.enemies.indexOf(enemy); if (_ei !== -1) game.enemies.splice(_ei, 1);
    game.enemiesDefeated++;
    game.score += CONFIG.SHOOT_SCORE;
    updateHUD();

    // Maybe spawn powerup
    if (Math.random() < 0.15) {
        spawnPowerup(enemy.x, enemy.y);
    }

    // Check wave completion
    if (game.enemies.length === 0) {
        setTimeout(() => completeWave(), 500);
    }
}

function applyPowerup(type) {
    if (type === 'health') {
        game.player.health = Math.min(game.player.maxHealth, game.player.health + 25);
        announce('Health power-up collected! +25 HP');
    } else {
        game.player.shield = Math.min(100, game.player.shield + 50);
        announce('Shield power-up collected! +50 shield');
    }

    // Sparkle effect
    for (let i = 0; i < 15; i++) {
        pushParticle({
            x: game.player.x,
            y: game.player.y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            size: Math.random() * 3 + 1,
            color: type === 'health' ? '34, 197, 94' : '0, 212, 255',
            life: 1
        });
    }

    updateHUD();
}

function createScoreParticle(points) {
    // This would create floating score text - simplified here
    for (let i = 0; i < 5; i++) {
        pushParticle({
            x: game.player.x + (Math.random() - 0.5) * 50,
            y: game.player.y - 50,
            vx: (Math.random() - 0.5) * 2,
            vy: -2 - Math.random() * 2,
            size: 3,
            color: '245, 158, 11',
            life: 1
        });
    }
}

// Wave management
/**
 * Spawn the next wave of enemies for the current zone.
 * Enemy count grows with wave number: base + floor(wave / 2).
 * Each enemy is staggered 500 ms apart so they enter one at a time.
 */
function spawnWave() {
    if (!game.running || game.paused) return;

    const enemyCount = CONFIG.ENEMIES_PER_WAVE_BASE + Math.floor(game.currentWave / 2);
    const topic = TOPICS[game.currentZone];

    for (let i = 0; i < enemyCount; i++) {
        setTimeout(() => {
            if (!game.running) return;

            game.enemies.push({
                x: 100 + Math.random() * (game.canvas.width - 200),
                y: -50 - i * 100,
                width: 40,
                height: 40,
                speed: CONFIG.ENEMY_SPEED + game.currentWave * 0.1,
                color: topic.color,
                icon: topic.icon,
                triggered: false,
                wobble: Math.random() * Math.PI * 2,
                health: CONFIG.ENEMY_MAX_HEALTH
            });
        }, i * 500);
    }
}

function completeWave() {
    game.currentWave++;

    if (game.currentWave > CONFIG.WAVES_PER_ZONE) {
        if (game.mode === 'adventure') {
            completeZone();
        } else if (game.mode === 'endless') {
            // Rotate to next topic, cycling back to start
            game.currentZone = (game.currentZone + 1) % TOPICS.length;
            game.currentWave = 1;
            updateHUD();
            setTimeout(() => spawnWave(), 2000);
        } else {
            // Next wave
            domCache.waveNumber.textContent = game.currentWave;
            setTimeout(() => spawnWave(), 2000);
        }
    } else {
        // Next wave
        domCache.waveNumber.textContent = game.currentWave;
        announce(`Wave ${game.currentWave}`);
        setTimeout(() => spawnWave(), 2000);
    }
}

function completeZone() {
    const topic = TOPICS[game.currentZone];

    domCache.zoneCompleteIcon.textContent = topic.icon;
    domCache.zoneCompleteName.textContent = topic.name;
    domCache.zoneScore.textContent = game.score;
    domCache.zoneAccuracy.textContent =
        game.questionsAnswered > 0
            ? Math.round(game.correctAnswers / game.questionsAnswered * 100) + '%'
            : '0%';

    domCache.levelComplete.classList.remove('hidden');
    const firstBtn = domCache.levelComplete.querySelector('button');
    if (firstBtn) firstBtn.focus();
    announce(`Zone complete: ${topic.name}!`);
}

function nextZone() {
    game.currentZone++;

    if (game.currentZone >= TOPICS.length) {
        // Game complete!
        gameOver(true);
        return;
    }

    game.currentWave = 1;
    domCache.levelComplete.classList.add('hidden');
    updateHUD();

    setTimeout(() => spawnWave(), 1000);
}

/**
 * Sync the HUD DOM with current game state.
 * Uses a dirty-check cache (game._hud) to skip DOM writes when values haven't
 * changed, avoiding unnecessary layout reflows every animation frame.
 */
function updateHUD() {
    const h = game._hud;
    const health = Math.round(game.player.health);
    if (health !== h.health) {
        h.health = health;
        domCache.healthFill.style.width = `${game.player.health}%`;
        domCache.healthText.textContent = health;
        domCache.healthBar.setAttribute('aria-valuenow', health);
    }
    if (game.player.shield !== h.shield) {
        h.shield = game.player.shield;
        domCache.shieldFill.style.width = `${game.player.shield}%`;
        if (domCache.shieldBar) domCache.shieldBar.setAttribute('aria-valuenow', Math.round(game.player.shield));
    }
    if (game.score !== h.score) {
        h.score = game.score;
        domCache.scoreValue.textContent = game.score;
    }
    if (game.streak !== h.streak) {
        h.streak = game.streak;
        domCache.streakValue.textContent = game.streak;
    }
    const mult = game.multiplier.toFixed(1);
    if (mult !== h.mult) {
        h.mult = mult;
        domCache.multiplier.textContent = `x${mult}`;
        domCache.multiplier.classList.remove('pop');
        void domCache.multiplier.offsetWidth;
        domCache.multiplier.classList.add('pop');
    }
    if (game.currentZone !== h.zone) {
        h.zone = game.currentZone;
        const topic = TOPICS[game.currentZone];
        if (topic) {
            domCache.levelLabel.textContent = `ZONE ${game.currentZone + 1}`;
            domCache.levelName.textContent = topic.name;
        }
    }
    if (game.currentWave !== h.wave) {
        h.wave = game.currentWave;
        domCache.waveNumber.textContent = game.currentWave;
    }
}

function updateTimerDisplay() {
    const maxTime = game.mode === 'speedquiz' ? CONFIG.SPEEDQUIZ_QUESTION_TIME : CONFIG.QUESTION_TIME;
    const pct = game.questionTimer / maxTime;
    const w = Math.round(pct * 100);
    if (w === game._lastTimerWidth) return;
    game._lastTimerWidth = w;
    domCache.timerFill.style.width = `${w}%`;
    const isDanger = pct < 0.3;
    if (isDanger && !game._timerDangerAnnounced) {
        game._timerDangerAnnounced = true;
        announce('Warning: time is running out!');
    }
    domCache.timerFill.classList.toggle('timer-danger', isDanger);
    if (domCache.timerText) {
        domCache.timerText.textContent = `${Math.ceil(game.questionTimer)}s`;
        domCache.timerText.classList.toggle('timer-danger', isDanger);
    }
}

// Game state management
function togglePause() {
    game.paused = !game.paused;
    domCache.pauseMenu.classList.toggle('hidden', !game.paused);
    if (game.paused) {
        // Hide question panel while paused to prevent reading without time pressure
        if (game.questionActive) {
            domCache.questionPanel.classList.add('hidden');
        }
        const firstBtn = domCache.pauseMenu.querySelector('button');
        if (firstBtn) firstBtn.focus();
    } else {
        // Restore question panel if a question was active when paused
        if (game.questionActive) {
            domCache.questionPanel.classList.remove('hidden');
        }
    }
}

function resumeGame() {
    game.paused = false;
    domCache.pauseMenu.classList.add('hidden');
    domCache.globalMenuBtn.focus();
}

function restartGame() {
    hideAllOverlays();
    const zoneIndex = Math.min(game.currentZone, TOPICS.length - 1);
    startGame(game.mode, game.mode === 'practice' ? TOPICS[zoneIndex].id : null);
}

function quitToMenu() {
    game.running = false;
    if (game.animationId) {
        cancelAnimationFrame(game.animationId);
    }
    hideAllOverlays();
    domCache.globalMenuBtn.style.display = 'none';
    showScreen('mainMenu');
    loadHighScore();
}

function gameOver(victory = false) {
    game.running = false;

    const isNewHighScore = saveHighScore();

    domCache.finalScore.textContent = game.score;
    domCache.questionsAnswered.textContent = game.questionsAnswered;
    domCache.accuracy.textContent =
        game.questionsAnswered > 0
            ? Math.round(game.correctAnswers / game.questionsAnswered * 100) + '%'
            : '0%';
    domCache.bestStreak.textContent = game.bestStreak;

    domCache.newHighScore.classList.toggle('hidden', !isNewHighScore);

    if (victory) {
        domCache.gameOverTitle.textContent = 'VICTORY!';
        domCache.gameOverTitle.style.color = '#22c55e';
    } else {
        domCache.gameOverTitle.textContent = 'GAME OVER';
        domCache.gameOverTitle.style.color = '#ef4444';
    }

    domCache.gameOver.classList.remove('hidden');
    const firstBtn = domCache.gameOver.querySelector('button');
    if (firstBtn) firstBtn.focus();
    const resultMsg = victory ? 'Victory!' : 'Game Over.';
    announce(`${resultMsg} Final score: ${game.score}.`);
}

// shake animation defined in styles.css
