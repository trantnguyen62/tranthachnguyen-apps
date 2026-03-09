/* =====================================================
   Pipeline Runner - DevOps Learning Game Engine
   ===================================================== */

// Polyfill for CanvasRenderingContext2D.roundRect (not available in older browsers)
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radii) {
        const r = typeof radii === 'number' ? radii : (Array.isArray(radii) ? radii[0] : 0);
        const clampedR = Math.min(r, width / 2, height / 2);
        this.moveTo(x + clampedR, y);
        this.lineTo(x + width - clampedR, y);
        this.arcTo(x + width, y, x + width, y + clampedR, clampedR);
        this.lineTo(x + width, y + height - clampedR);
        this.arcTo(x + width, y + height, x + width - clampedR, y + height, clampedR);
        this.lineTo(x + clampedR, y + height);
        this.arcTo(x, y + height, x, y + height - clampedR, clampedR);
        this.lineTo(x, y + clampedR);
        this.arcTo(x, y, x + clampedR, y, clampedR);
        this.closePath();
        return this;
    };
}

// Cached math constants
const TWO_PI = Math.PI * 2;
const DEG_TO_RAD = Math.PI / 180;

// Game Configuration
const CONFIG = {
    GRAVITY: 0.35,          // Downward acceleration applied each frame (px/frame²)
    BOOST_FORCE: -7.5,      // Upward velocity applied on tap/space (negative = up, px/frame)
    OBSTACLE_SPEED: 3,      // Horizontal scroll speed of obstacles (px/frame)
    OBSTACLE_GAP: 180,      // Vertical gap between top and bottom obstacle (px)
    OBSTACLE_SPAWN_RATE: 2200, // Milliseconds between obstacle spawns
    PLAYER_SIZE: 50,        // Player sprite bounding box (px)
    OBSTACLE_WIDTH: 100,    // Width of each obstacle column (px)
    QUESTION_INTERVAL: 5,   // Gates passed before a quiz question is triggered
    QUESTION_TIME: 12       // Seconds allowed to answer a quiz question
};

// DevOps Topics with learnable commands/concepts
const TOPICS = [
    { id: 'docker', name: 'Docker', icon: '🐳', color: '#0db7ed' },
    { id: 'kubernetes', name: 'Kubernetes', icon: '☸️', color: '#326ce5' },
    { id: 'cicd', name: 'CI/CD', icon: '🔄', color: '#22c55e' },
    { id: 'aws', name: 'AWS', icon: '☁️', color: '#ff9900' },
    { id: 'terraform', name: 'Terraform', icon: '🏗️', color: '#7b42bc' },
    { id: 'git', name: 'Git', icon: '📦', color: '#f05032' },
    { id: 'linux', name: 'Linux', icon: '🐧', color: '#fcc624' },
    { id: 'monitoring', name: 'Monitoring', icon: '📊', color: '#00c853' }
];

// Educational content for obstacles - commands and concepts with descriptions
const LEARNABLE_CONTENT = {
    docker: [
        { cmd: 'docker run', desc: 'Creates and starts a container from an image' },
        { cmd: 'docker build', desc: 'Builds an image from a Dockerfile' },
        { cmd: 'docker ps', desc: 'Lists all running containers' },
        { cmd: 'docker pull', desc: 'Downloads an image from a registry' },
        { cmd: 'docker push', desc: 'Uploads an image to a registry' },
        { cmd: 'docker exec', desc: 'Runs a command in a running container' },
        { cmd: 'docker logs', desc: 'Shows container output logs' },
        { cmd: 'docker stop', desc: 'Stops a running container' },
        { cmd: 'docker rm', desc: 'Removes a stopped container' },
        { cmd: 'docker images', desc: 'Lists all local images' },
        { cmd: 'docker-compose up', desc: 'Starts multi-container application' },
        { cmd: 'docker volume', desc: 'Manages persistent data storage' },
        { cmd: 'docker network', desc: 'Manages container networking' },
        { cmd: 'Dockerfile', desc: 'Blueprint for building images' },
        { cmd: '-d flag', desc: 'Runs container in background (detached)' },
        { cmd: 'multi-stage build', desc: 'Reduces final image size by discarding build tools' },
        { cmd: 'COPY vs ADD', desc: 'COPY is preferred; ADD also extracts archives and fetches URLs' },
        { cmd: 'docker stats', desc: 'Shows real-time CPU, memory, and network usage per container' },
        { cmd: 'HEALTHCHECK', desc: 'Dockerfile instruction to test if a container is healthy' }
    ],
    kubernetes: [
        { cmd: 'kubectl apply', desc: 'Creates or updates resources from YAML' },
        { cmd: 'kubectl get pods', desc: 'Lists all pods in namespace' },
        { cmd: 'kubectl describe', desc: 'Shows detailed resource info' },
        { cmd: 'kubectl logs', desc: 'Shows pod container logs' },
        { cmd: 'kubectl exec', desc: 'Runs command in a container' },
        { cmd: 'kubectl delete', desc: 'Removes resources from cluster' },
        { cmd: 'kubectl scale', desc: 'Changes number of pod replicas' },
        { cmd: 'Pod', desc: 'Smallest deployable unit in K8s' },
        { cmd: 'Deployment', desc: 'Manages ReplicaSets and rollouts' },
        { cmd: 'Service', desc: 'Exposes pods to network traffic' },
        { cmd: 'ConfigMap', desc: 'Stores non-sensitive configuration' },
        { cmd: 'Secret', desc: 'Stores sensitive data (base64)' },
        { cmd: 'Ingress', desc: 'HTTP/HTTPS route manager' },
        { cmd: 'Namespace', desc: 'Virtual cluster partition' },
        { cmd: 'HPA', desc: 'Horizontal Pod Autoscaler' },
        { cmd: 'RBAC', desc: 'Role-Based Access Control for cluster permissions' },
        { cmd: 'NetworkPolicy', desc: 'Controls traffic flow between pods' },
        { cmd: 'resource limits', desc: 'Caps CPU/memory a container can consume in a pod' },
        { cmd: 'CronJob', desc: 'Runs a Job on a repeating schedule (like cron)' }
    ],
    cicd: [
        { cmd: 'CI Pipeline', desc: 'Automates build and test on commit' },
        { cmd: 'CD Pipeline', desc: 'Automates deployment to environments' },
        { cmd: 'GitHub Actions', desc: 'CI/CD built into GitHub' },
        { cmd: 'Jenkins', desc: 'Open-source automation server' },
        { cmd: 'GitLab CI', desc: 'Built-in CI/CD for GitLab' },
        { cmd: 'Webhook', desc: 'Triggers pipeline on repository events' },
        { cmd: 'Artifact', desc: 'Output of build process (JAR, image)' },
        { cmd: 'Blue-Green', desc: 'Zero-downtime deployment strategy' },
        { cmd: 'Canary', desc: 'Gradual rollout to subset of users' },
        { cmd: 'Rolling Update', desc: 'Incremental deployment of changes' },
        { cmd: 'Stage Gate', desc: 'Approval checkpoint in pipeline' },
        { cmd: 'Build Matrix', desc: 'Test across multiple configurations' },
        { cmd: 'GitOps', desc: 'Git as source of truth for infra' },
        { cmd: 'Shift Left', desc: 'Test earlier in development cycle' },
        { cmd: 'Feature Flag', desc: 'Toggle features without deploy' },
        { cmd: 'Pipeline cache', desc: 'Stores dependencies between runs to speed up builds' },
        { cmd: 'DAST', desc: 'Dynamic Application Security Testing in pipelines' },
        { cmd: 'SAST', desc: 'Static Application Security Testing on source code before execution' },
        { cmd: 'Smoke test', desc: 'Quick sanity check run immediately after deployment' }
    ],
    aws: [
        { cmd: 'EC2', desc: 'Elastic Compute Cloud - VMs in cloud' },
        { cmd: 'S3', desc: 'Simple Storage Service - object storage' },
        { cmd: 'Lambda', desc: 'Serverless functions, pay per use' },
        { cmd: 'IAM', desc: 'Identity and Access Management' },
        { cmd: 'VPC', desc: 'Virtual Private Cloud - network isolation' },
        { cmd: 'RDS', desc: 'Managed relational databases' },
        { cmd: 'EKS', desc: 'Managed Kubernetes service' },
        { cmd: 'ECS', desc: 'Elastic Container Service' },
        { cmd: 'CloudWatch', desc: 'Monitoring, logging, and alarms' },
        { cmd: 'CloudFormation', desc: 'Infrastructure as Code for AWS' },
        { cmd: 'Route 53', desc: 'DNS and domain management' },
        { cmd: 'ALB', desc: 'Application Load Balancer' },
        { cmd: 'SQS', desc: 'Simple Queue Service - messaging' },
        { cmd: 'SNS', desc: 'Simple Notification Service' },
        { cmd: 'DynamoDB', desc: 'NoSQL database, serverless' },
        { cmd: 'CloudTrail', desc: 'Logs and audits API calls for compliance' },
        { cmd: 'EFS', desc: 'Elastic File System - shared NFS storage for EC2' },
        { cmd: 'Secrets Manager', desc: 'Stores and automatically rotates secrets like DB passwords and API keys' },
        { cmd: 'ACM', desc: 'AWS Certificate Manager - provisions and renews TLS/SSL certificates' }
    ],
    terraform: [
        { cmd: 'terraform init', desc: 'Initialize working directory' },
        { cmd: 'terraform plan', desc: 'Preview infrastructure changes' },
        { cmd: 'terraform apply', desc: 'Create/update infrastructure' },
        { cmd: 'terraform destroy', desc: 'Remove all managed resources' },
        { cmd: 'terraform fmt', desc: 'Format configuration files' },
        { cmd: 'terraform validate', desc: 'Check config syntax' },
        { cmd: 'terraform state', desc: 'Manage state file' },
        { cmd: 'terraform output', desc: 'Show output values' },
        { cmd: '.tf files', desc: 'Terraform configuration files' },
        { cmd: 'tfstate', desc: 'Records managed infrastructure' },
        { cmd: 'Provider', desc: 'Plugin for cloud/service API' },
        { cmd: 'Module', desc: 'Reusable configuration package' },
        { cmd: 'Variable', desc: 'Parameterize configurations' },
        { cmd: 'Backend', desc: 'Where state is stored (S3, etc)' },
        { cmd: 'HCL', desc: 'HashiCorp Configuration Language' },
        { cmd: 'for_each', desc: 'Creates multiple resources from a map or set' },
        { cmd: 'locals', desc: 'Named values computed within a module to reduce repetition' },
        { cmd: 'terraform taint', desc: 'Marks a resource for forced recreation on next apply' },
        { cmd: 'depends_on', desc: 'Declares explicit dependencies between resources' }
    ],
    git: [
        { cmd: 'git clone', desc: 'Copy repository to local machine' },
        { cmd: 'git add', desc: 'Stage changes for commit' },
        { cmd: 'git commit', desc: 'Save staged changes to history' },
        { cmd: 'git push', desc: 'Upload commits to remote repo' },
        { cmd: 'git pull', desc: 'Download and merge remote changes' },
        { cmd: 'git branch', desc: 'Create/list/delete branches' },
        { cmd: 'git checkout', desc: 'Switch branches or restore files' },
        { cmd: 'git merge', desc: 'Combine branch histories' },
        { cmd: 'git rebase', desc: 'Reapply commits on new base' },
        { cmd: 'git stash', desc: 'Temporarily save uncommitted work' },
        { cmd: 'git log', desc: 'View commit history' },
        { cmd: 'git diff', desc: 'Show changes between commits' },
        { cmd: 'git reset', desc: 'Undo commits or unstage files' },
        { cmd: 'Pull Request', desc: 'Request to merge with code review' },
        { cmd: '.gitignore', desc: 'Exclude files from tracking' },
        { cmd: 'git bisect', desc: 'Binary search to find the commit that introduced a bug' },
        { cmd: 'git blame', desc: 'Shows who last modified each line of a file' },
        { cmd: 'git reflog', desc: 'Records all ref updates - lifeline for recovering lost commits' },
        { cmd: 'git hooks', desc: 'Scripts that run automatically on Git events like commit and push' }
    ],
    linux: [
        { cmd: 'ls', desc: 'List directory contents' },
        { cmd: 'cd', desc: 'Change directory' },
        { cmd: 'pwd', desc: 'Print working directory' },
        { cmd: 'mkdir', desc: 'Create new directory' },
        { cmd: 'rm', desc: 'Remove files or directories' },
        { cmd: 'cp', desc: 'Copy files or directories' },
        { cmd: 'mv', desc: 'Move or rename files' },
        { cmd: 'cat', desc: 'Display file contents' },
        { cmd: 'grep', desc: 'Search text with patterns' },
        { cmd: 'chmod', desc: 'Change file permissions' },
        { cmd: 'chown', desc: 'Change file ownership' },
        { cmd: 'sudo', desc: 'Run as superuser' },
        { cmd: 'ps', desc: 'List running processes' },
        { cmd: 'ssh', desc: 'Secure shell remote connection' },
        { cmd: 'curl', desc: 'Transfer data via URLs' },
        { cmd: 'pipe |', desc: 'Passes stdout of one command to stdin of the next' },
        { cmd: 'env / export', desc: 'Sets or displays environment variables in the shell' },
        { cmd: 'journalctl', desc: 'Queries systemd journal for service and kernel logs' },
        { cmd: 'ss', desc: 'Shows active network connections and listening ports (replaces netstat)' }
    ],
    monitoring: [
        { cmd: 'Prometheus', desc: 'Metrics collection and alerting' },
        { cmd: 'Grafana', desc: 'Visualization and dashboards' },
        { cmd: 'ELK Stack', desc: 'Elasticsearch, Logstash, Kibana' },
        { cmd: 'Metrics', desc: 'Numerical measurements over time' },
        { cmd: 'Logs', desc: 'Timestamped event records' },
        { cmd: 'Traces', desc: 'Request path through services' },
        { cmd: 'Alerting', desc: 'Notifications on threshold breach' },
        { cmd: 'Dashboard', desc: 'Visual display of metrics' },
        { cmd: 'SLO', desc: 'Service Level Objective target' },
        { cmd: 'SLI', desc: 'Service Level Indicator metric' },
        { cmd: 'SLA', desc: 'Service Level Agreement contract' },
        { cmd: 'APM', desc: 'Application Performance Monitoring' },
        { cmd: 'Uptime', desc: 'Percentage time service is available' },
        { cmd: 'Latency', desc: 'Response time / delay' },
        { cmd: 'Error Rate', desc: 'Percentage of failed requests' },
        { cmd: 'MTTR', desc: 'Mean Time to Recovery - how quickly incidents are resolved' },
        { cmd: 'cardinality', desc: 'Number of unique label value combinations in metrics' },
        { cmd: 'PromQL', desc: 'Prometheus Query Language for querying time-series metrics' },
        { cmd: 'P95 / P99 latency', desc: '95th/99th percentile response time - reveals worst-case user experience' }
    ]
};

// DevOps Questions Database
const QUESTIONS = {
    docker: [
        { q: "What command creates a new container from an image?", a: ["docker run", "docker start", "docker create", "docker build"], c: 0, fact: "docker run combines 'create' and 'start' in one command!" },
        { q: "Which file defines a Docker image's build instructions?", a: ["Dockerfile", "docker-compose.yml", "config.json", "image.yaml"], c: 0, fact: "Dockerfiles use a layered caching system for faster builds." },
        { q: "What is a Docker container?", a: ["A lightweight isolated environment", "A virtual machine", "A programming language", "A database"], c: 0, fact: "Containers share the host OS kernel, making them much lighter than VMs." },
        { q: "Which command lists all running containers?", a: ["docker ps", "docker list", "docker show", "docker containers"], c: 0, fact: "Add -a flag to see all containers including stopped ones." },
        { q: "What does 'docker pull' do?", a: ["Downloads an image from a registry", "Uploads an image", "Creates a container", "Removes a container"], c: 0, fact: "Docker Hub is the default public registry for images." },
        { q: "What is Docker Compose used for?", a: ["Multi-container applications", "Building images", "Network configuration", "Security scanning"], c: 0, fact: "Docker Compose uses YAML to define multi-container apps." },
        { q: "What does the -d flag do in 'docker run -d'?", a: ["Runs container in detached mode", "Enables debugging", "Downloads image", "Deletes after exit"], c: 0, fact: "Detached mode runs the container in the background." },
        { q: "What is a Docker volume?", a: ["Persistent data storage", "Network interface", "CPU allocation", "Memory limit"], c: 0, fact: "Volumes persist data even when containers are deleted." },
        { q: "What does 'docker images' list?", a: ["All local images", "Running containers", "Network interfaces", "Volume mounts"], c: 0, fact: "Use 'docker images -a' to include intermediate build layers." },
        { q: "What is the purpose of .dockerignore?", a: ["Exclude files from build context", "Block network access", "Ignore container errors", "Skip health checks"], c: 0, fact: ".dockerignore speeds up builds by reducing the context sent to the daemon." },
        { q: "What does ENTRYPOINT do in a Dockerfile?", a: ["Sets the container's main process", "Exposes a port", "Sets environment variables", "Copies files into the image"], c: 0, fact: "Unlike CMD, ENTRYPOINT arguments are not overridden by docker run arguments." },
        { q: "What does 'docker inspect' return?", a: ["Detailed JSON metadata", "Container logs", "Image layers", "Network stats"], c: 0, fact: "docker inspect reveals IP addresses, mounts, env vars, and more." },
        { q: "What is a multi-stage Docker build?", a: ["Build that discards intermediate layers to reduce final image size", "A build with multiple Dockerfiles", "Running multiple builds in parallel", "A build using multiple base images"], c: 0, fact: "Multi-stage builds can shrink images from gigabytes to just megabytes!" },
        { q: "When should you use ADD instead of COPY in a Dockerfile?", a: ["When you need to extract a tarball or fetch a URL", "When copying local files", "Always - ADD is more modern", "When copying directories only"], c: 0, fact: "Best practice: use COPY for simple file copies; ADD only when extraction or URL fetching is needed." },
        { q: "What does 'docker stats' display?", a: ["Real-time CPU, memory, and network usage per container", "Container environment variables", "Image build history", "Volume mount points"], c: 0, fact: "docker stats is ideal for spotting memory leaks and CPU hogs in running containers." },
        { q: "What does HEALTHCHECK do in a Dockerfile?", a: ["Tests whether the container process is healthy", "Checks the image for vulnerabilities", "Validates environment variables", "Scans the network configuration"], c: 0, fact: "Docker marks containers as healthy/unhealthy based on HEALTHCHECK exit codes, enabling automated restarts." }
    ],
    kubernetes: [
        { q: "What is a Kubernetes Pod?", a: ["Smallest deployable unit", "A cluster", "A service", "A volume"], c: 0, fact: "A Pod can contain one or more containers that share resources." },
        { q: "Which object manages Pod replicas?", a: ["Deployment", "Service", "ConfigMap", "Secret"], c: 0, fact: "Deployments enable declarative updates and rollbacks." },
        { q: "What exposes Pods to network traffic?", a: ["Service", "Deployment", "ReplicaSet", "Namespace"], c: 0, fact: "Services provide stable networking for ephemeral Pods." },
        { q: "Which command applies a YAML configuration?", a: ["kubectl apply -f", "kubectl create", "kubectl run", "kubectl start"], c: 0, fact: "kubectl apply is idempotent - safe to run multiple times." },
        { q: "What is a Kubernetes Namespace?", a: ["Virtual cluster partition", "Physical server", "Container runtime", "Storage class"], c: 0, fact: "Namespaces help organize resources in large clusters." },
        { q: "What does HPA stand for?", a: ["Horizontal Pod Autoscaler", "High Performance Architecture", "Host Port Allocation", "Hybrid Pod Application"], c: 0, fact: "HPA automatically scales pods based on CPU/memory usage." },
        { q: "Which object stores sensitive data?", a: ["Secret", "ConfigMap", "PersistentVolume", "Deployment"], c: 0, fact: "Secrets are base64 encoded (not encrypted by default!)." },
        { q: "What is an Ingress?", a: ["HTTP route manager", "Container runtime", "Pod scheduler", "Volume provisioner"], c: 0, fact: "Ingress provides SSL termination and virtual hosting." },
        { q: "What is a DaemonSet?", a: ["Runs a pod on every node", "Manages stateful apps", "Schedules batch jobs", "Routes internal traffic"], c: 0, fact: "DaemonSets are ideal for cluster-wide services like log collectors." },
        { q: "What is a StatefulSet?", a: ["Manages stateful applications", "Balances pod load", "Stores secrets", "Routes external traffic"], c: 0, fact: "StatefulSets give pods stable network identities and persistent storage." },
        { q: "What is a PersistentVolumeClaim?", a: ["Request for storage by a pod", "A type of Service", "A network policy", "A pod scheduling rule"], c: 0, fact: "PVCs decouple storage requests from the underlying infrastructure." },
        { q: "What does 'kubectl rollout undo' do?", a: ["Reverts to previous Deployment version", "Pauses a rollout", "Scales down pods", "Deletes a Deployment"], c: 0, fact: "Kubernetes keeps rollout history so you can roll back instantly." },
        { q: "What does RBAC stand for in Kubernetes?", a: ["Role-Based Access Control", "Resource Binding and Config", "Runtime Behavior Checks", "Replica Balancing Algorithm"], c: 0, fact: "RBAC lets you control who can perform which actions on which K8s resources." },
        { q: "What is a Kubernetes NetworkPolicy?", a: ["Controls traffic flow between pods", "Scales network bandwidth", "Manages DNS resolution", "Load balances ingress traffic"], c: 0, fact: "Without NetworkPolicies, all pods can communicate with each other by default." },
        { q: "What is a Kubernetes CronJob?", a: ["Runs a Job on a repeating schedule", "A pod that runs continuously", "A recurring deployment update", "A scheduled node drain"], c: 0, fact: "CronJobs are ideal for periodic tasks like database backups and cleanup jobs." },
        { q: "What happens when a container exceeds its memory limit in Kubernetes?", a: ["It is killed by the OOMKiller", "It is throttled slowly", "It gets more memory automatically", "The pod is rescheduled"], c: 0, fact: "Setting memory limits prevents a single container from starving other pods on the same node." }
    ],
    cicd: [
        { q: "What does CI stand for?", a: ["Continuous Integration", "Code Inspection", "Container Instance", "Cloud Infrastructure"], c: 0, fact: "CI automates building and testing code on every commit." },
        { q: "What does CD stand for?", a: ["Continuous Delivery/Deployment", "Code Deployment", "Container Distribution", "Cloud Development"], c: 0, fact: "CD automates releasing code to production environments." },
        { q: "What triggers a CI pipeline?", a: ["Code commit/push", "Server restart", "User login", "Database query"], c: 0, fact: "Webhooks notify CI systems of repository changes." },
        { q: "What is a build artifact?", a: ["Output of build process", "Source code", "Configuration file", "Log file"], c: 0, fact: "Artifacts are stored for deployment or later use." },
        { q: "What is blue-green deployment?", a: ["Two identical environments", "Color-coded logs", "Branch naming", "Error highlighting"], c: 0, fact: "Blue-green enables instant rollback by switching traffic." },
        { q: "What is a canary deployment?", a: ["Gradual rollout to subset", "Fast deployment", "Rollback strategy", "Testing approach"], c: 0, fact: "Canary releases test changes on a small user percentage first." },
        { q: "What is GitHub Actions?", a: ["CI/CD platform", "Code review tool", "Issue tracker", "Wiki system"], c: 0, fact: "GitHub Actions uses YAML workflows in .github/workflows/." },
        { q: "What is GitOps?", a: ["Git as source of truth for infrastructure", "Git hosting service", "Git GUI tool", "Git branching strategy"], c: 0, fact: "GitOps uses pull requests to manage infrastructure changes." },
        { q: "What is a Jenkinsfile?", a: ["Pipeline definition checked into source control", "Jenkins config file", "Plugin manifest", "Deployment script"], c: 0, fact: "Storing Jenkinsfiles in the repo enables pipeline-as-code." },
        { q: "What is ArgoCD?", a: ["GitOps continuous delivery tool for Kubernetes", "A code review platform", "A secrets manager", "A container registry"], c: 0, fact: "ArgoCD continuously syncs cluster state with Git repository state." },
        { q: "What is a staging environment?", a: ["Pre-production environment for testing", "The production server", "A build server", "A developer's laptop"], c: 0, fact: "Staging mirrors production to catch issues before they reach users." },
        { q: "What does 'shift-left' mean in CI/CD?", a: ["Testing earlier in the development cycle", "Deploying to the left region", "Shifting traffic gradually", "Moving jobs to earlier pipeline stages"], c: 0, fact: "Shift-left reduces the cost of bugs by catching them sooner." },
        { q: "What is pipeline caching used for?", a: ["Stores dependencies to speed up subsequent runs", "Saves pipeline configuration permanently", "Caches production traffic", "Stores test results across teams"], c: 0, fact: "Caching node_modules or Maven's .m2 can cut build times by 50% or more." },
        { q: "What is DAST in a security pipeline?", a: ["Dynamic Application Security Testing against a running app", "Docker Automated Scan Tool", "Deployment Audit and Status Tracker", "Data Access Security Token"], c: 0, fact: "DAST tests the live application and complements SAST static code analysis." },
        { q: "What is SAST in a CI pipeline?", a: ["Static code analysis for security vulnerabilities", "A server-side automated scaling test", "A syntax audit of shell scripts", "A sequential artifact storage tool"], c: 0, fact: "SAST runs without executing code, making it fast enough to include in every pull request check." },
        { q: "What is a smoke test in CI/CD?", a: ["Quick sanity check after deployment", "A load test that stresses the system", "A test that checks for memory leaks", "A full regression test suite"], c: 0, fact: "Smoke tests verify core functionality in under a minute — catching obvious failures before deeper testing." }
    ],
    aws: [
        { q: "What is EC2?", a: ["Elastic Compute Cloud", "Elastic Container Cloud", "Enterprise Cloud Computing", "Easy Cloud Creation"], c: 0, fact: "EC2 provides resizable virtual servers in the cloud." },
        { q: "What is S3 used for?", a: ["Object storage", "Compute instances", "Database hosting", "Network routing"], c: 0, fact: "S3 offers 99.999999999% (11 9s) durability!" },
        { q: "What is Lambda?", a: ["Serverless compute", "Database service", "Storage service", "Network service"], c: 0, fact: "Lambda scales automatically and charges per millisecond." },
        { q: "What does IAM manage?", a: ["Identity and Access", "Internet and Media", "Infrastructure and Monitoring", "Integration and Migration"], c: 0, fact: "IAM follows the principle of least privilege." },
        { q: "What is VPC?", a: ["Virtual Private Cloud", "Virtual Public Cloud", "Very Private Container", "Virtual Pod Cluster"], c: 0, fact: "VPC isolates your resources in a virtual network." },
        { q: "What is CloudFormation?", a: ["Infrastructure as Code", "Monitoring service", "Storage service", "Compute service"], c: 0, fact: "CloudFormation templates define AWS resources in YAML/JSON." },
        { q: "What is EKS?", a: ["Elastic Kubernetes Service", "Elastic Key Storage", "Enterprise Kubernetes System", "Easy Kubernetes Setup"], c: 0, fact: "EKS is a managed Kubernetes service by AWS." },
        { q: "What is CloudWatch?", a: ["Monitoring and logging", "Storage service", "Compute service", "Database service"], c: 0, fact: "CloudWatch collects metrics, logs, and can trigger alarms." },
        { q: "What is AWS ECR?", a: ["Elastic Container Registry", "Elastic Compute Runtime", "Enterprise Cloud Router", "Elastic Cache Repository"], c: 0, fact: "ECR integrates natively with ECS and EKS for seamless image pulls." },
        { q: "What is an AWS Security Group?", a: ["Virtual firewall for resources", "IAM permission set", "VPC subnet rule", "Network load balancer"], c: 0, fact: "Security groups are stateful — return traffic is automatically allowed." },
        { q: "What is AWS SQS used for?", a: ["Decoupling services via message queues", "Storing objects", "Running serverless code", "Managing DNS records"], c: 0, fact: "SQS can buffer millions of messages to prevent service overload." },
        { q: "What does AWS Auto Scaling do?", a: ["Adjusts capacity to meet demand", "Balances DNS queries", "Replicates databases", "Manages IAM roles"], c: 0, fact: "Auto Scaling can scale both up and down to optimize cost." },
        { q: "What is AWS CloudTrail?", a: ["Logs and audits all API calls across your AWS account", "Monitors EC2 CPU performance", "Manages SSL/TLS certificates", "Routes DNS queries"], c: 0, fact: "CloudTrail is essential for security auditing, compliance, and incident investigation." },
        { q: "What is Amazon EFS?", a: ["Elastic File System - shared NFS storage mountable by multiple instances", "Elastic Firewall Service", "Event Forwarding System", "Encrypted File Storage bucket"], c: 0, fact: "EFS automatically scales capacity and can be mounted simultaneously by many EC2 instances." },
        { q: "What is AWS Secrets Manager used for?", a: ["Storing and automatically rotating secrets like API keys and passwords", "Managing IAM user accounts", "Encrypting S3 bucket objects", "Storing CloudFormation templates"], c: 0, fact: "Secrets Manager can automatically rotate credentials for RDS, Redshift, and third-party services." },
        { q: "What is AWS Certificate Manager (ACM)?", a: ["Provisions and auto-renews TLS/SSL certificates for AWS services", "Manages IAM certificates and roles", "Issues code-signing certificates for Lambda", "Stores SSH keys for EC2 instances"], c: 0, fact: "ACM certificates are free and renew automatically, eliminating manual certificate management." }
    ],
    terraform: [
        { q: "What is Terraform?", a: ["Infrastructure as Code tool", "Container runtime", "CI/CD platform", "Monitoring tool"], c: 0, fact: "Terraform works with 1000+ providers (AWS, Azure, GCP, etc)." },
        { q: "What language does Terraform use?", a: ["HCL", "YAML", "JSON", "Python"], c: 0, fact: "HCL (HashiCorp Configuration Language) is human-readable." },
        { q: "What does 'terraform init' do?", a: ["Initializes working directory", "Creates resources", "Destroys resources", "Shows plan"], c: 0, fact: "terraform init downloads provider plugins." },
        { q: "What does 'terraform plan' show?", a: ["Preview of changes", "Current state", "Provider list", "Variable values"], c: 0, fact: "Always run plan before apply to review changes!" },
        { q: "What does 'terraform apply' do?", a: ["Applies changes", "Shows plan", "Initializes directory", "Validates config"], c: 0, fact: "Apply creates, updates, or deletes infrastructure." },
        { q: "What is Terraform state?", a: ["Record of managed infrastructure", "Configuration file", "Variable definition", "Provider plugin"], c: 0, fact: "State is critical - store it securely (e.g., S3 + DynamoDB)." },
        { q: "What is a Terraform module?", a: ["Reusable configuration", "State file", "Provider", "Resource type"], c: 0, fact: "Modules promote DRY (Don't Repeat Yourself) principles." },
        { q: "What does 'terraform destroy' do?", a: ["Removes all resources", "Shows plan", "Applies changes", "Validates config"], c: 0, fact: "Destroy removes all resources managed by the configuration." },
        { q: "What is a Terraform data source?", a: ["Reads existing infrastructure info", "Creates a new resource", "Defines an output value", "Stores the state file"], c: 0, fact: "Data sources let you reference resources not managed by your config." },
        { q: "What is 'terraform import' used for?", a: ["Brings existing resources under Terraform management", "Imports provider plugins", "Downloads modules", "Loads variable files"], c: 0, fact: "terraform import lets you manage infrastructure created outside Terraform." },
        { q: "What is a Terraform workspace?", a: ["Isolated state environment", "A module directory", "A provider configuration", "A backend type"], c: 0, fact: "Workspaces let you manage multiple environments (dev/staging/prod) from one config." },
        { q: "Where should Terraform state be stored in teams?", a: ["Remote backend like S3", "Local filesystem", "Git repository", "Environment variable"], c: 0, fact: "Never commit tfstate to Git — it can contain sensitive values in plaintext." },
        { q: "What does 'for_each' do in Terraform?", a: ["Creates multiple resource instances from a map or set", "Loops through all state files", "Iterates provider configurations", "Repeats plan operations"], c: 0, fact: "for_each assigns each instance a unique key, making it easier to manage than count." },
        { q: "What are Terraform 'locals'?", a: ["Named values computed within a module", "Local state files on disk", "Variables passed from the CLI", "Provider-specific settings"], c: 0, fact: "Locals reduce repetition by naming complex expressions once and reusing them throughout a module." },
        { q: "What does 'terraform taint' do?", a: ["Marks a resource for forced recreation on next apply", "Marks a resource as read-only", "Skips a resource during plan", "Locks a resource in the state file"], c: 0, fact: "terraform taint is useful when a resource is degraded but Terraform doesn't detect it automatically." },
        { q: "What is 'depends_on' used for in Terraform?", a: ["Declaring explicit dependencies between resources", "Setting resource creation order globally", "Specifying provider version constraints", "Defining module output order"], c: 0, fact: "Terraform usually infers dependencies automatically; use depends_on only when implicit references are insufficient." }
    ],
    git: [
        { q: "What does 'git clone' do?", a: ["Copies a repository", "Creates a branch", "Merges branches", "Pushes changes"], c: 0, fact: "Clone copies the entire repository history." },
        { q: "What does 'git commit' do?", a: ["Saves changes to local repo", "Uploads to remote", "Downloads changes", "Creates branch"], c: 0, fact: "Commits create a snapshot of your staged changes." },
        { q: "What does 'git push' do?", a: ["Uploads commits to remote", "Downloads changes", "Creates branch", "Merges branches"], c: 0, fact: "Push shares your local commits with the team." },
        { q: "What is a Git branch?", a: ["Parallel version of code", "Remote server", "Commit message", "File backup"], c: 0, fact: "Branches enable parallel development and feature isolation." },
        { q: "What does 'git merge' do?", a: ["Combines branches", "Creates branch", "Deletes branch", "Shows differences"], c: 0, fact: "Merge integrates changes from one branch into another." },
        { q: "What is a merge conflict?", a: ["Competing changes to same lines", "Network error", "Authentication failure", "File corruption"], c: 0, fact: "Conflicts happen when Git can't auto-merge changes." },
        { q: "What does 'git rebase'?", a: ["Reapplies commits on new base", "Creates backup", "Deletes history", "Merges repositories"], c: 0, fact: "Rebase creates a cleaner, linear commit history." },
        { q: "What is a pull request?", a: ["Request to merge changes", "Download request", "Access request", "Delete request"], c: 0, fact: "PRs enable code review before merging to main." },
        { q: "What does 'git fetch' do?", a: ["Downloads remote changes without merging", "Downloads and merges changes", "Uploads commits", "Creates a branch"], c: 0, fact: "git fetch is safe — it never modifies your working directory." },
        { q: "What does 'git stash' do?", a: ["Temporarily saves uncommitted work", "Deletes a branch", "Merges two branches", "Creates a tag"], c: 0, fact: "git stash pop restores your stashed changes when you're ready." },
        { q: "What is 'git cherry-pick'?", a: ["Applies a specific commit to current branch", "Picks files to stage", "Selects a merge strategy", "Chooses a remote"], c: 0, fact: "Cherry-pick is useful for backporting fixes to release branches." },
        { q: "What does 'git tag' do?", a: ["Marks a specific commit", "Creates a branch", "Stages all files", "Pushes to remote"], c: 0, fact: "Tags are commonly used to mark release versions like v1.0.0." },
        { q: "What is 'git bisect' used for?", a: ["Binary search to find the commit that introduced a bug", "Split a large repository into two", "Bisect a merge conflict", "Divide commit history evenly"], c: 0, fact: "git bisect finds a bad commit in O(log n) steps even across thousands of commits." },
        { q: "What does 'git blame' show?", a: ["Who last modified each line of a file", "Which commits have bugs", "Files untracked by Git", "Blame messages in commit logs"], c: 0, fact: "git blame is invaluable for understanding when and why a specific change was made." },
        { q: "What is 'git reflog' used for?", a: ["Recovering lost commits by viewing all ref history", "Viewing the remote repository log", "Listing all git references in a repo", "Auditing repository access logs"], c: 0, fact: "git reflog is your safety net — even after a reset --hard, commits remain recoverable for ~90 days." },
        { q: "What are Git hooks?", a: ["Scripts that run automatically on Git events", "Git's plugin system for extensions", "Remote server callbacks for pushes", "Aliases for complex git commands"], c: 0, fact: "Pre-commit hooks are widely used to run linters and tests before a commit is recorded." }
    ],
    linux: [
        { q: "What does 'ls' command do?", a: ["Lists directory contents", "Creates file", "Deletes file", "Moves file"], c: 0, fact: "ls -la shows hidden files and detailed info." },
        { q: "What does 'grep' do?", a: ["Searches text patterns", "Creates files", "Compresses files", "Lists processes"], c: 0, fact: "grep supports regex for powerful pattern matching." },
        { q: "What does 'chmod' modify?", a: ["File permissions", "File owner", "File name", "File size"], c: 0, fact: "chmod 755 gives owner full access, others read+execute." },
        { q: "What does 'sudo' do?", a: ["Runs as superuser", "Shuts down system", "Shows disk usage", "Searches files"], c: 0, fact: "sudo = 'superuser do' - runs commands with elevated privileges." },
        { q: "What does 'ps' show?", a: ["Running processes", "File permissions", "Network connections", "Disk space"], c: 0, fact: "ps aux shows all processes with detailed info." },
        { q: "What is systemd?", a: ["System and service manager", "File system", "Network manager", "Package manager"], c: 0, fact: "systemd is the init system for most modern Linux distros." },
        { q: "What does 'ssh' do?", a: ["Secure remote connection", "File transfer", "Service start", "System shutdown"], c: 0, fact: "SSH encrypts all traffic between client and server." },
        { q: "What does 'curl' do?", a: ["Transfers data via URLs", "Creates users", "Compresses files", "Lists processes"], c: 0, fact: "curl supports HTTP, HTTPS, FTP, and many more protocols." },
        { q: "What does 'tail -f' do?", a: ["Follows a file as it grows", "Shows last 10 lines", "Deletes a file", "Compresses a file"], c: 0, fact: "tail -f is the go-to tool for watching live log output." },
        { q: "What does 'df -h' show?", a: ["Disk space usage in human-readable form", "Directory file listing", "Default filesystem", "Daemon file handles"], c: 0, fact: "Use 'df -h' to quickly spot full disks before they cause issues." },
        { q: "What is cron used for?", a: ["Scheduling recurring tasks", "Compressing files", "Managing users", "Monitoring processes"], c: 0, fact: "Cron expressions have 5 fields: minute, hour, day, month, weekday." },
        { q: "What does 'top' display?", a: ["Real-time process and resource usage", "Network topology", "File system tree", "Open ports"], c: 0, fact: "Press 'q' to quit top, or try 'htop' for a friendlier interface." },
        { q: "What does the pipe (|) operator do in Linux?", a: ["Sends stdout of one command to stdin of the next", "Creates a named pipe file", "Combines two text files", "Redirects output to a log file"], c: 0, fact: "Pipes enable powerful one-liners like: cat access.log | grep ERROR | wc -l" },
        { q: "What does 'export' do in a Linux shell?", a: ["Makes a variable available to child processes", "Exports files to a remote server", "Backs up environment settings", "Installs a package"], c: 0, fact: "Variables without export are local to the current shell and invisible to spawned processes." },
        { q: "What does 'journalctl' do?", a: ["Queries systemd logs for services and the kernel", "Manages journal disk quota", "Monitors journal network traffic", "Lists all installed services"], c: 0, fact: "journalctl -u nginx -f follows live nginx log output — equivalent to tail -f for systemd services." },
        { q: "What does 'ss -tlnp' show?", a: ["TCP listening ports with the associated process", "All active SSH sessions", "System socket buffer sizes", "TLS certificate details"], c: 0, fact: "ss is the modern replacement for netstat and is faster because it reads directly from the kernel." }
    ],
    monitoring: [
        { q: "What is Prometheus?", a: ["Monitoring system", "Container runtime", "CI/CD tool", "Load balancer"], c: 0, fact: "Prometheus uses a pull model to scrape metrics." },
        { q: "What is Grafana used for?", a: ["Data visualization", "Data storage", "Data processing", "Data backup"], c: 0, fact: "Grafana can visualize data from 50+ data sources." },
        { q: "What are metrics?", a: ["Numerical measurements over time", "Log messages", "Error codes", "Configuration files"], c: 0, fact: "Metrics help identify trends and detect anomalies." },
        { q: "What is alerting?", a: ["Notifications for threshold breaches", "Log aggregation", "Metric collection", "Dashboard creation"], c: 0, fact: "Good alerts are actionable and avoid alert fatigue." },
        { q: "What does ELK stand for?", a: ["Elasticsearch, Logstash, Kibana", "Easy Linux Kit", "Enterprise Log Keeper", "Elastic Load Kit"], c: 0, fact: "ELK Stack is the most popular log management solution." },
        { q: "What is an SLO?", a: ["Service Level Objective", "System Log Output", "Server Load Optimizer", "Service Launch Order"], c: 0, fact: "SLOs define target reliability levels for services." },
        { q: "What is APM?", a: ["Application Performance Monitoring", "Automated Process Manager", "Advanced Package Manager", "Application Process Memory"], c: 0, fact: "APM tracks response times, errors, and bottlenecks." },
        { q: "What is tracing?", a: ["Following request paths", "Logging errors", "Measuring latency", "Counting requests"], c: 0, fact: "Distributed tracing follows requests across microservices." },
        { q: "What is observability?", a: ["Ability to understand system state from outputs", "A monitoring tool", "A logging format", "A deployment strategy"], c: 0, fact: "Observability is built on three pillars: metrics, logs, and traces." },
        { q: "What is an error budget?", a: ["Allowed amount of downtime for an SLO", "Cost of fixing bugs", "Number of retries allowed", "Alert threshold setting"], c: 0, fact: "When your error budget is exhausted, new features should pause for reliability work." },
        { q: "What is Jaeger used for?", a: ["Distributed tracing", "Log aggregation", "Metrics collection", "Alert routing"], c: 0, fact: "Jaeger is a CNCF project for end-to-end distributed transaction monitoring." },
        { q: "What is a health check endpoint?", a: ["API endpoint reporting service status", "A monitoring dashboard", "A log aggregator", "An alert rule"], c: 0, fact: "Kubernetes uses health checks (liveness/readiness probes) to manage pod lifecycle." },
        { q: "What does MTTR stand for?", a: ["Mean Time to Recovery", "Maximum Threshold for Retries", "Monthly Tracking and Reporting Rate", "Metric Threshold for Risk Rating"], c: 0, fact: "Reducing MTTR is a core SRE goal — fast recovery matters as much as preventing outages." },
        { q: "What is high cardinality in metrics?", a: ["Many unique label value combinations", "High metric collection frequency", "Large number of dashboards", "High alert sensitivity"], c: 0, fact: "Using user IDs or request IDs as Prometheus labels can cause memory issues at scale." },
        { q: "What is PromQL?", a: ["Prometheus Query Language for querying time-series metrics", "A protocol for log forwarding", "A query language for Grafana dashboards only", "A plugin for alerting rules"], c: 0, fact: "PromQL functions like rate(), sum(), and histogram_quantile() are essential for writing useful dashboards and alerts." },
        { q: "What do P95 and P99 latency represent?", a: ["95th and 99th percentile response times", "Probability of 95% and 99% uptime", "Peak load at 95% and 99% capacity", "Error rates below 5% and 1%"], c: 0, fact: "P99 latency reveals the worst 1% of user experiences — often more meaningful than average response time." }
    ]
};

// DevOps Ranks
const RANKS = [
    { minScore: 0, icon: '🔧', title: 'Junior DevOps' },
    { minScore: 10, icon: '⚙️', title: 'DevOps Engineer' },
    { minScore: 25, icon: '🛠️', title: 'Senior DevOps' },
    { minScore: 50, icon: '🚀', title: 'DevOps Lead' },
    { minScore: 75, icon: '🌟', title: 'Platform Engineer' },
    { minScore: 100, icon: '👑', title: 'DevOps Architect' }
];

// Game State
// Properties prefixed with _ or set dynamically by init/resize are not listed here
// but are documented at their point of assignment.
let game = {
    // Loop control
    running: false,          // True while a game session is in progress
    paused: false,           // True when waiting for player input (e.g. after extra life)
    canvas: null,
    ctx: null,
    animationId: null,       // rAF handle; null when loop is not running
    obstacleInterval: null,  // setInterval handle for obstacle spawning

    // Topic & content rotation
    selectedTopic: 'docker',
    contentQueue: [], // Pre-shuffled indices for LEARNABLE_CONTENT; refills when empty

    // Player physics
    player: {
        x: 100,
        y: 0,
        velocity: 0,   // Vertical velocity (negative = upward)
        rotation: 0    // Visual tilt angle in degrees, clamped to [-20, 60]
    },

    // Active game objects
    obstacles: [],       // Array of { x, gapY, passed, content }
    particles: [],       // Boost/collision particle effects
    stars: [],           // Background parallax stars
    learnedItems: [],    // Content items passed this session (used on game-over screen)
    floatingTexts: [],   // Transient "+cmd" labels shown near the player

    // Scoring
    score: 0,
    bestScore: 0,
    streak: 0,
    bestStreak: 0,
    lives: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    totalLearned: 0,  // Cumulative across all sessions (persisted to localStorage)

    // Session state
    lastLearnedFact: '',     // Fact shown on game-over when learnedItems is empty
    respawnInvincible: false, // True during the brief grace period after losing a life
    // respawnInvincibleTimeout: <set by useLife/AdManager.continueGame>
    // gameOverTimeout: <setTimeout handle set in gameOver(); cancelled on extra-life continue>
    // _loopSuspended: <set by visibilitychange handler to resume loop on tab focus>

    // Question modal state
    currentQuestion: null,   // Active question object (shuffled answers + correctIndex)
    questionActive: false,
    questionTimer: 0,        // Seconds remaining on the countdown
    questionTimerInterval: null,

    // Canvas dimensions (logical pixels, updated on resize)
    width: 0,
    height: 0
    // Dynamically set by init/resizeCanvas/updateTopicCache:
    //   elScore, elLives, elStreak, elTipBanner, elTipText, elTimer  — cached DOM nodes
    //   cachedBgGradient   — LinearGradient rebuilt on resize
    //   pipelineCanvas     — offscreen canvas with static lane lines
    //   starGroups         — Map<fillStyle, star[]> for batched star drawing
    //   topicCache         — { topic, obstacleCanvas, playerCanvas, playerOX, playerOY, … }
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');

    // Cache frequently accessed DOM elements to avoid repeated lookups
    game.elScore   = document.getElementById('currentScore');
    game.elLives   = document.getElementById('livesCount');
    game.elStreak  = document.getElementById('streakCount');
    game.elTipBanner = document.getElementById('tipBanner');
    game.elTipText   = document.getElementById('tipText');
    game.elTimer     = document.getElementById('questionTimer');

    loadProgress();
    renderTopicButtons();
    setupEventListeners();
    resizeCanvas();
    initStars();
    updateTopicCache();

    // Debounce resize to avoid repeatedly recreating offscreen canvases
    let _resizeTimer = null;
    window.addEventListener('resize', () => {
        if (_resizeTimer) clearTimeout(_resizeTimer);
        _resizeTimer = setTimeout(() => { _resizeTimer = null; resizeCanvas(); }, 150);
    });

    // Suspend the rAF loop when the tab is hidden to save CPU
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (game.animationId) {
                cancelAnimationFrame(game.animationId);
                game.animationId = null;
                game._loopSuspended = true;
            }
        } else if (game._loopSuspended) {
            game._loopSuspended = false;
            if (game.running && !game.questionActive) gameLoop();
        }
    });
}

function loadProgress() {
    const rawBest = parseInt(localStorage.getItem('pipeline-runner-best') || '0', 10);
    const rawLearned = parseInt(localStorage.getItem('pipeline-runner-learned') || '0', 10);
    game.bestScore = (isNaN(rawBest) || rawBest < 0) ? 0 : Math.min(rawBest, 1e7);
    game.totalLearned = (isNaN(rawLearned) || rawLearned < 0) ? 0 : Math.min(rawLearned, 1e7);
    document.getElementById('bestScore').textContent = game.bestScore;
    document.getElementById('totalLearned').textContent = game.totalLearned;
}

function saveProgress() {
    if (game.score > game.bestScore) {
        game.bestScore = game.score;
        localStorage.setItem('pipeline-runner-best', game.bestScore);
    }
    game.totalLearned += game.learnedItems.length;
    localStorage.setItem('pipeline-runner-learned', game.totalLearned);
}

function renderTopicButtons() {
    const container = document.getElementById('topicButtons');
    container.innerHTML = '';

    TOPICS.forEach((topic, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `topic-btn ${topic.id === game.selectedTopic ? 'selected' : ''}`;
        btn.setAttribute('aria-pressed', topic.id === game.selectedTopic ? 'true' : 'false');
        btn.setAttribute('aria-label', `${topic.name} topic`);
        // Roving tabindex: only the selected button is in the tab order
        btn.tabIndex = topic.id === game.selectedTopic ? 0 : -1;
        btn.innerHTML = `${topic.icon} ${topic.name}`;
        btn.onclick = () => selectTopic(topic.id);
        btn.addEventListener('keydown', handleTopicKeydown);
        container.appendChild(btn);
    });
}

function handleTopicKeydown(e) {
    const btns = Array.from(document.querySelectorAll('.topic-btn'));
    const currentIndex = btns.indexOf(e.currentTarget);
    let nextIndex = -1;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % btns.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextIndex = (currentIndex - 1 + btns.length) % btns.length;
    } else if (e.key === 'Home') {
        nextIndex = 0;
    } else if (e.key === 'End') {
        nextIndex = btns.length - 1;
    }

    if (nextIndex >= 0) {
        e.preventDefault();
        const topic = TOPICS[nextIndex];
        selectTopic(topic.id);
    }
}

function selectTopic(topicId) {
    if (!TOPICS.some(t => t.id === topicId)) return;
    game.selectedTopic = topicId;
    game.contentQueue = []; // reset queue so it refills for the new topic
    updateTopicCache();
    renderTopicButtons();
    document.querySelector('.icon-preview').textContent = game.topicCache.topic.icon;
    const selectedBtn = document.querySelector('.topic-btn.selected');
    if (selectedBtn) selectedBtn.focus();
}

function initStars() {
    game.stars = [];
    for (let i = 0; i < 100; i++) {
        const brightness = Math.random() * 0.5 + 0.3;
        // Quantize brightness to 0.1 steps so stars can be grouped by fillStyle
        const quantized = Math.round(brightness * 10) / 10;
        game.stars.push({
            x: Math.random() * (game.width || 600),
            y: Math.random() * (game.height || 800),
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 1.5 + 0.5,
            brightness,
            fillStyle: `rgba(255, 255, 255, ${quantized})`
        });
    }

    // Group stars by fillStyle to batch canvas draw calls
    const groups = new Map();
    for (const star of game.stars) {
        let group = groups.get(star.fillStyle);
        if (!group) { group = []; groups.set(star.fillStyle, group); }
        group.push(star);
    }
    game.starGroups = Array.from(groups);
}

// Returns the next learnable content item for the current topic.
// Cycles through all items without repetition using a pre-shuffled queue.
function getNextLearnableContent() {
    const content = LEARNABLE_CONTENT[game.selectedTopic];
    if (game.contentQueue.length === 0) {
        const indices = Array.from({ length: content.length }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
        }
        game.contentQueue = indices;
    }
    return content[game.contentQueue.pop()];
}

function setupEventListeners() {
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            if (game.running && !game.questionActive) {
                boost();
            }
        }

        if (game.questionActive && ['1', '2', '3', '4'].includes(e.key)) {
            selectAnswer(parseInt(e.key) - 1);
        }
    });

    document.addEventListener('click', (e) => {
        if (game.running && !game.questionActive && !e.target.closest('button')) {
            boost();
        }
    });

    document.addEventListener('touchstart', (e) => {
        if (game.running && !game.questionActive && !e.target.closest('button')) {
            e.preventDefault();
            boost();
        }
    }, { passive: false });
}

function resizeCanvas() {
    const container = document.querySelector('.game-container');
    const dpr = window.devicePixelRatio || 1;

    game.width = container.clientWidth;
    game.height = container.clientHeight;

    // Set canvas size for high-DPI displays
    game.canvas.width = game.width * dpr;
    game.canvas.height = game.height * dpr;

    // Scale canvas CSS size to match container
    game.canvas.style.width = game.width + 'px';
    game.canvas.style.height = game.height + 'px';

    // Scale context to account for DPI
    game.ctx.scale(dpr, dpr);

    // Cache background gradient (re-create on resize since height changed)
    const bgGrad = game.ctx.createLinearGradient(0, 0, 0, game.height);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e293b');
    bgGrad.addColorStop(1, '#0f172a');
    game.cachedBgGradient = bgGrad;

    initStars();
    cachePipelineBackground();
    if (game.topicCache) updateTopicCache();
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

function showStartScreen() {
    loadProgress();
    showScreen('startScreen');
}

function startGame() {
    game.running = true;
    game.paused = false;
    game.score = 0;
    game.streak = 0;
    game.bestStreak = 0;
    game.lives = 0;
    game.respawnInvincible = false;
    game.questionsAnswered = 0;
    game.correctAnswers = 0;
    game.obstacles = [];
    game.particles = [];
    game.floatingTexts = [];
    game.learnedItems = [];
    game.contentQueue = [];
    game.questionActive = false;
    game.currentQuestion = null;
    if (game.questionTimerInterval) {
        clearInterval(game.questionTimerInterval);
        game.questionTimerInterval = null;
    }
    game.lastLearnedFact = '';

    game.player.x = game.width * 0.12;
    game.player.y = game.height / 2;
    game.player.velocity = 0;
    game.player.rotation = 0;

    updateTopicCache();
    const topic = game.topicCache.topic;
    document.getElementById('currentTopicBadge').textContent = `${topic.icon} ${topic.name}`;
    game.elScore.textContent = '0';
    game.elStreak.textContent = '0';
    game.elLives.textContent = '0';

    showScreen('gameScreen');
    hideTipBanner();
    document.getElementById('questionModal').classList.add('hidden');

    if (game.animationId) cancelAnimationFrame(game.animationId);
    if (game.obstacleInterval) clearInterval(game.obstacleInterval);

    game.obstacleInterval = setInterval(spawnObstacle, CONFIG.OBSTACLE_SPAWN_RATE);
    setTimeout(spawnObstacle, 800);

    gameLoop();
}

function gameLoop() {
    if (!game.running) return;

    // When a question is active the modal fully covers the canvas.
    // Stop the loop here; closeQuestion() will restart it.
    if (game.questionActive) {
        game.animationId = null;
        return;
    }

    if (!game.paused) {
        update();
    }
    render();

    game.animationId = requestAnimationFrame(gameLoop);
}

function update() {
    game.player.velocity += CONFIG.GRAVITY;
    game.player.y += game.player.velocity;
    game.player.rotation = Math.min(Math.max(game.player.velocity * 2.5, -20), 60);

    const stars = game.stars;
    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.x -= star.speed;
        if (star.x < 0) {
            star.x = game.width;
            star.y = Math.random() * game.height;
        }
    }

    const obstacles = game.obstacles;
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= CONFIG.OBSTACLE_SPEED;

        if (!obs.passed && obs.x + CONFIG.OBSTACLE_WIDTH < game.player.x) {
            obs.passed = true;
            game.score++;
            game.elScore.textContent = game.score;

            // Show learned content as floating text
            game.learnedItems.push(obs.content);
            showLearnedContent(obs.content);

            if (game.score % CONFIG.QUESTION_INTERVAL === 0) {
                showQuestion();
            }
        }

        if (obs.x <= -CONFIG.OBSTACLE_WIDTH * 2) obstacles.splice(i, 1);
    }

    // Update floating texts
    for (let i = game.floatingTexts.length - 1; i >= 0; i--) {
        const ft = game.floatingTexts[i];
        ft.y -= 1;
        ft.life -= 0.015;
        if (ft.life <= 0) game.floatingTexts.splice(i, 1);
    }

    for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.vy += 0.1;
        if (p.life <= 0) game.particles.splice(i, 1);
    }

    // Check collision (skip if invincible after respawn)
    if (!game.respawnInvincible && checkCollision()) {
        if (game.lives > 0) {
            useLife();
        } else {
            gameOver();
        }
    }
}

function showLearnedContent(content) {
    game.floatingTexts.push({
        text: `✅ ${content.cmd}`,
        desc: content.desc,
        x: game.player.x + 50,
        y: game.player.y,
        life: 1
    });

    // Also show in tip banner
    showTip(`${content.cmd}: ${content.desc}`);
}

function render() {
    const ctx = game.ctx;

    ctx.fillStyle = game.cachedBgGradient;
    ctx.fillRect(0, 0, game.width, game.height);

    // Batch stars by pre-grouped fillStyle to minimise canvas state changes
    const starGroups = game.starGroups;
    for (let g = 0; g < starGroups.length; g++) {
        const [fillStyle, group] = starGroups[g];
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        for (let i = 0; i < group.length; i++) {
            const star = group[i];
            ctx.moveTo(star.x + star.size, star.y);
            ctx.arc(star.x, star.y, star.size, 0, TWO_PI);
        }
        ctx.fill();
    }

    drawPipelineBackground(ctx);

    const particles = game.particles;
    if (particles.length > 0) {
        // All particles share the same color; set fillStyle once and vary globalAlpha
        ctx.save();
        ctx.fillStyle = 'rgb(255, 200, 100)';
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, TWO_PI);
            ctx.fill();
        }
        ctx.restore();
    }

    const obstacles = game.obstacles;
    if (obstacles.length > 0) {
        // Set shared obstacle state once per frame
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < obstacles.length; i++) {
            drawObstacle(ctx, obstacles[i]);
        }
    }

    // Draw floating learned texts with a single save/restore block
    const floatingTexts = game.floatingTexts;
    if (floatingTexts.length > 0) {
        ctx.save();
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 14px Outfit';
        ctx.textAlign = 'left';
        for (let i = 0; i < floatingTexts.length; i++) {
            const ft = floatingTexts[i];
            ctx.globalAlpha = ft.life;
            ctx.fillText(ft.text, ft.x, ft.y);
        }
        ctx.restore();
    }

    drawPlayer(ctx);
}

function cachePipelineBackground() {
    const offscreen = document.createElement('canvas');
    offscreen.width = game.canvas.width;
    offscreen.height = game.canvas.height;
    const offCtx = offscreen.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    offCtx.scale(dpr, dpr);

    offCtx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
    offCtx.lineWidth = 2;
    offCtx.setLineDash([20, 20]);

    for (let i = 1; i < 4; i++) {
        const y = (game.height / 4) * i;
        offCtx.beginPath();
        offCtx.moveTo(0, y);
        offCtx.lineTo(game.width, y);
        offCtx.stroke();
    }

    game.pipelineCanvas = offscreen;
}

function drawPipelineBackground(ctx) {
    ctx.drawImage(game.pipelineCanvas, 0, 0, game.width, game.height);
}

function drawObstacle(ctx, obs) {
    const { topic, obstacleCanvas } = game.topicCache;
    const gateWidth = CONFIG.OBSTACLE_WIDTH;
    const gateColor = topic.color;

    // Top gate - blit from prerendered obstacle canvas
    if (obs.gapY > 0) {
        ctx.drawImage(obstacleCanvas, 0, 0, gateWidth, obs.gapY, obs.x, 0, gateWidth, obs.gapY);
    }

    // Top gate cap with command
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(obs.x - 8, obs.gapY - 35, gateWidth + 16, 35);
    ctx.strokeStyle = gateColor;
    ctx.strokeRect(obs.x - 8, obs.gapY - 35, gateWidth + 16, 35);

    // Command text on top gate
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(obs.content.cmd, obs.x + gateWidth / 2, obs.gapY - 17);

    // Bottom gate - blit from prerendered obstacle canvas
    const bottomY = obs.gapY + CONFIG.OBSTACLE_GAP;
    const bottomH = game.height - bottomY;
    if (bottomH > 0) {
        ctx.drawImage(obstacleCanvas, 0, 0, gateWidth, bottomH, obs.x, bottomY, gateWidth, bottomH);
    }

    // Bottom gate cap with topic icon
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(obs.x - 8, bottomY, gateWidth + 16, 35);
    ctx.strokeStyle = gateColor;
    ctx.strokeRect(obs.x - 8, bottomY, gateWidth + 16, 35);
    ctx.font = '18px Arial';
    ctx.fillText(topic.icon, obs.x + gateWidth / 2, bottomY + 18);
}

function drawPlayer(ctx) {
    const p = game.player;
    const { playerCanvas, playerOX, playerOY } = game.topicCache;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation * DEG_TO_RAD);

    ctx.drawImage(playerCanvas, -playerOX, -playerOY);

    if (p.velocity < 0) {
        ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
        ctx.beginPath();
        ctx.moveTo(-25, -5);
        ctx.lineTo(-40 - Math.random() * 15, 0);
        ctx.lineTo(-25, 5);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

function boost() {
    game.player.velocity = CONFIG.BOOST_FORCE;
    createBoostParticles();
}

function createBoostParticles() {
    const p = game.player;
    for (let i = 0; i < 5; i++) {
        game.particles.push({
            x: p.x - 25,
            y: p.y + (Math.random() - 0.5) * 10,
            vx: -Math.random() * 3 - 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 4 + 2,
            life: 1,
            color: '255, 200, 100'
        });
    }
}

function spawnObstacle() {
    if (!game.running || game.questionActive) return;

    const minGapY = 120;
    const maxGapY = Math.max(minGapY + 1, game.height - CONFIG.OBSTACLE_GAP - 120);
    const gapY = Math.random() * (maxGapY - minGapY) + minGapY;

    const content = getNextLearnableContent();

    game.obstacles.push({
        x: game.width + 50,
        gapY: gapY,
        passed: false,
        content: content
    });
}

// Circular hitbox collision: treats the player as a circle of radius 20 px.
// Checks screen boundary first, then axis-aligned bounding-box overlap with each
// obstacle gate (top column: y < gapY, bottom column: y > gapY + GAP).
function checkCollision() {
    const p = game.player;
    const playerRadius = 20;

    if (p.y - playerRadius < 0 || p.y + playerRadius > game.height) {
        return true;
    }

    const obstacles = game.obstacles;
    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        if (p.x + playerRadius > obs.x && p.x - playerRadius < obs.x + CONFIG.OBSTACLE_WIDTH) {
            if (p.y - playerRadius < obs.gapY || p.y + playerRadius > obs.gapY + CONFIG.OBSTACLE_GAP) {
                return true;
            }
        }
    }

    return false;
}

// Question System
function showQuestion() {
    const questions = QUESTIONS[game.selectedTopic];
    const question = questions[Math.floor(Math.random() * questions.length)];

    const answers = question.a.map((text, originalIndex) => ({ text, originalIndex }));
    for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
    }

    const correctShuffledIndex = answers.findIndex(a => a.originalIndex === question.c);

    game.currentQuestion = { ...question, correctIndex: correctShuffledIndex, shuffledAnswers: answers };
    game.questionActive = true;
    game.questionTimer = CONFIG.QUESTION_TIME;
    game.paused = true;

    const topic = TOPICS.find(t => t.id === game.selectedTopic) || TOPICS[0];
    document.getElementById('questionTopic').textContent = `${topic.icon} ${topic.name}`;
    document.getElementById('questionText').textContent = question.q;
    document.getElementById('questionTimer').textContent = CONFIG.QUESTION_TIME;

    const answerGrid = document.getElementById('answerGrid');
    const fragment = document.createDocumentFragment();

    answers.forEach((answer, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'answer-btn';
        const keySpan = document.createElement('span');
        keySpan.className = 'answer-key';
        keySpan.setAttribute('aria-hidden', 'true');
        keySpan.textContent = i + 1;
        const textSpan = document.createElement('span');
        textSpan.className = 'answer-text';
        textSpan.textContent = answer.text;
        btn.appendChild(keySpan);
        btn.appendChild(textSpan);
        btn.setAttribute('aria-label', `Option ${i + 1}: ${answer.text}`);
        btn.onclick = () => selectAnswer(i);
        fragment.appendChild(btn);
    });

    answerGrid.innerHTML = '';
    answerGrid.appendChild(fragment);

    document.getElementById('questionModal').classList.remove('hidden');
    startQuestionTimer();

    // Move focus to the first answer button for keyboard/screen reader users
    const firstAnswer = document.querySelector('#answerGrid .answer-btn');
    if (firstAnswer) firstAnswer.focus();
}

function startQuestionTimer() {
    if (game.questionTimerInterval) {
        clearInterval(game.questionTimerInterval);
    }
    game.questionTimerInterval = setInterval(() => {
        if (!game.questionActive) {
            clearInterval(game.questionTimerInterval);
            game.questionTimerInterval = null;
            return;
        }

        game.questionTimer--;
        game.elTimer.textContent = game.questionTimer;
        game.elTimer.setAttribute('aria-label', `${game.questionTimer} seconds remaining`);

        // Announce only at key thresholds to avoid flooding screen readers
        if (game.questionTimer === 5 || game.questionTimer === 3) {
            const feedbackEl = document.getElementById('answerFeedback');
            if (feedbackEl) feedbackEl.textContent = `${game.questionTimer} seconds remaining`;
        }

        if (game.questionTimer <= 0) {
            clearInterval(game.questionTimerInterval);
            game.questionTimerInterval = null;
            handleTimeout();
        }
    }, 1000);
}

// Handles answer selection: disables all buttons and highlights the chosen one,
// then defers the correctness check by 300ms to let the selection animation play.
function selectAnswer(index) {
    if (!game.questionActive || game.currentQuestion.answered) return;

    game.currentQuestion.answered = true;
    const btns = document.querySelectorAll('.answer-btn');

    btns.forEach((btn, i) => {
        btn.classList.add('disabled');
        btn.setAttribute('aria-disabled', 'true');
        if (i === index) btn.classList.add('selected');
    });

    setTimeout(() => checkAnswer(index), 300);
}

function checkAnswer(index) {
    const correct = index === game.currentQuestion.correctIndex;
    const btns = document.querySelectorAll('.answer-btn');

    btns[game.currentQuestion.correctIndex].classList.add('correct');
    if (!correct) {
        btns[index].classList.add('incorrect');
    }

    const feedbackEl = document.getElementById('answerFeedback');
    if (feedbackEl) {
        const correctText = game.currentQuestion.shuffledAnswers[game.currentQuestion.correctIndex].text;
        feedbackEl.textContent = correct
            ? 'Correct!'
            : `Incorrect. The correct answer was: ${correctText}`;
    }

    game.questionsAnswered++;

    if (correct) {
        game.correctAnswers++;
        game.streak++;
        game.bestStreak = Math.max(game.bestStreak, game.streak);
        game.elStreak.textContent = game.streak;

        game.score += 5;
        game.elScore.textContent = game.score;

        // Award a life for correct answer!
        game.lives++;
        game.elLives.textContent = game.lives;
        showTip(`+1 Life! ❤️ You now have ${game.lives} lives!`);

        game.lastLearnedFact = game.currentQuestion.fact || "Great job! Keep learning!";
    } else {
        game.streak = 0;
        game.elStreak.textContent = '0';
        game.lastLearnedFact = game.currentQuestion.fact || "Remember this for next time!";
    }

    setTimeout(closeQuestion, 1200);
}

function handleTimeout() {
    game.questionsAnswered++;
    game.streak = 0;
    game.elStreak.textContent = '0';

    const btns = document.querySelectorAll('.answer-btn');
    btns[game.currentQuestion.correctIndex].classList.add('correct');

    const feedbackEl = document.getElementById('answerFeedback');
    if (feedbackEl) {
        const correctText = game.currentQuestion.shuffledAnswers[game.currentQuestion.correctIndex].text;
        feedbackEl.textContent = `Time's up! The correct answer was: ${correctText}`;
    }

    game.lastLearnedFact = game.currentQuestion.fact || "Time's up! Try to answer faster.";

    setTimeout(closeQuestion, 1200);
}

function closeQuestion() {
    if (game.questionTimerInterval) {
        clearInterval(game.questionTimerInterval);
        game.questionTimerInterval = null;
    }
    game.questionActive = false;
    game.paused = false;
    game.currentQuestion = null;
    document.getElementById('questionModal').classList.add('hidden');
    // Restart the render loop that was suspended during the question
    if (game.running) gameLoop();
}

// Tips
let _tipHideTimer = null;
function showTip(text) {
    if (_tipHideTimer) { clearTimeout(_tipHideTimer); _tipHideTimer = null; }
    game.elTipText.textContent = text;
    game.elTipBanner.classList.remove('hidden');
    _tipHideTimer = setTimeout(() => { hideTipBanner(); _tipHideTimer = null; }, 3000);
}

function hideTipBanner() {
    game.elTipBanner.classList.add('hidden');
}

// Game Over
function gameOver() {
    game.running = false;

    if (game.animationId) cancelAnimationFrame(game.animationId);
    if (game.obstacleInterval) clearInterval(game.obstacleInterval);

    saveProgress();

    document.getElementById('finalScore').textContent = game.score;
    document.getElementById('questionsCorrect').textContent = `${game.correctAnswers}/${game.questionsAnswered}`;
    document.getElementById('bestStreak').textContent = game.bestStreak;

    const rank = [...RANKS].reverse().find(r => game.score >= r.minScore) || RANKS[0];
    document.getElementById('rankIcon').textContent = rank.icon;
    document.getElementById('rankTitle').textContent = rank.title;

    // Show what was learned
    if (game.learnedItems.length > 0) {
        const randomLearned = game.learnedItems[Math.floor(Math.random() * game.learnedItems.length)];
        document.getElementById('factText').textContent = `${randomLearned.cmd}: ${randomLearned.desc}`;
    } else {
        document.getElementById('factText').textContent = game.lastLearnedFact || "Keep practicing to learn more DevOps commands!";
    }

    // Store the timeout so it can be cancelled if user continues with extra life
    game.gameOverTimeout = setTimeout(() => {
        showScreen('gameOverScreen');
        const retryBtn = document.querySelector('.retry-btn');
        if (retryBtn) retryBtn.focus();
    }, 500);
}

// Use a life to respawn
function useLife() {
    game.lives--;
    game.elLives.textContent = game.lives;

    game.respawnInvincible = true;
    showTip(`❤️ Used 1 life! ${game.lives} remaining. Keep going!`);

    // Reset player position to safe spot
    game.player.y = game.height / 2;
    game.player.velocity = 0;
    game.player.rotation = 0;

    // Clear nearby obstacles
    game.obstacles = game.obstacles.filter(obs => obs.x > game.player.x + 150 || obs.x < game.player.x - 100);

    // Invincibility for 1.5 seconds
    if (game.respawnInvincibleTimeout) clearTimeout(game.respawnInvincibleTimeout);
    game.respawnInvincibleTimeout = setTimeout(() => {
        game.respawnInvincible = false;
        game.respawnInvincibleTimeout = null;
    }, 1500);
}

// Utility functions
function lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `rgb(${R}, ${G}, ${B})`;
}

function darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `rgb(${R}, ${G}, ${B})`;
}

// Rebuilds the topic-specific offscreen canvases for the player sprite and
// obstacle columns. Call this whenever the selected topic or canvas size changes.
// Pre-rendering avoids expensive per-frame gradient and shadow operations.
// Prerenders per-topic graphics (obstacle column and player sprite) to offscreen
// canvases so the hot render path can blit with drawImage instead of recomputing
// gradients and shadows each frame.  Must be called whenever selectedTopic changes
// or after a canvas resize (height change invalidates the obstacle canvas height).
function updateTopicCache() {
    const topic = TOPICS.find(t => t.id === game.selectedTopic);
    const lightColor20 = lightenColor(topic.color, 20);
    const lightColor30 = lightenColor(topic.color, 30);
    const darkColor20 = darkenColor(topic.color, 20);

    // Prerender obstacle column to offscreen canvas (avoids createLinearGradient per frame)
    const gateWidth = CONFIG.OBSTACLE_WIDTH;
    const obstacleCanvas = document.createElement('canvas');
    obstacleCanvas.width = gateWidth;
    obstacleCanvas.height = game.height || 800;
    const oc = obstacleCanvas.getContext('2d');
    const oGrad = oc.createLinearGradient(0, 0, gateWidth, 0);
    oGrad.addColorStop(0, topic.color);
    oGrad.addColorStop(0.5, lightColor20);
    oGrad.addColorStop(1, topic.color);
    oc.fillStyle = oGrad;
    oc.fillRect(0, 0, gateWidth, obstacleCanvas.height);

    // Prerender player sprite to offscreen canvas (avoids shadowBlur + gradient per frame)
    const PAD = 24;
    const ox = PAD + 25;
    const oy = PAD + 18;
    const playerCanvas = document.createElement('canvas');
    playerCanvas.width = 50 + PAD * 2;
    playerCanvas.height = 36 + PAD * 2;
    const pc = playerCanvas.getContext('2d');
    pc.shadowColor = topic.color;
    pc.shadowBlur = 20;
    const pGrad = pc.createLinearGradient(PAD, PAD - 2, PAD + 50, PAD + 38);
    pGrad.addColorStop(0, lightColor30);
    pGrad.addColorStop(0.5, topic.color);
    pGrad.addColorStop(1, darkColor20);
    pc.fillStyle = pGrad;
    pc.beginPath();
    pc.roundRect(PAD, PAD, 50, 36, 8);
    pc.fill();
    pc.shadowBlur = 0;
    pc.strokeStyle = 'rgba(255,255,255,0.5)';
    pc.lineWidth = 2;
    pc.stroke();
    pc.font = '22px Arial';
    pc.textAlign = 'center';
    pc.textBaseline = 'middle';
    pc.fillText(topic.icon, ox, oy);

    game.topicCache = {
        topic,
        lightColor20,
        lightColor30,
        darkColor20,
        obstacleCanvas,
        playerCanvas,
        playerOX: ox,
        playerOY: oy
    };
}

/* =====================================================
   Ad Manager - Handles Banner & Rewarded Ads
   ===================================================== */

const AdManager = {
    // Configuration
    adWatchedThisSession: false,
    rewardedAdTimer: null,
    remainingTime: 5,

    // Show banner ad (on menus only)
    showBanner: function () {
        const banner = document.getElementById('adBannerTop');
        if (banner) {
            banner.classList.remove('hidden');
        }
    },

    // Hide banner ad (during gameplay)
    hideBanner: function () {
        const banner = document.getElementById('adBannerTop');
        if (banner) {
            banner.classList.add('hidden');
        }
    },

    // Show rewarded ad (with countdown)
    showRewardedAd: function () {
        // Only allow one rewarded ad per game session
        if (this.adWatchedThisSession) {
            return;
        }

        const modal = document.getElementById('rewardedAdModal');
        const timerDisplay = document.getElementById('rewardedAdTimer');
        const skipBtn = document.getElementById('skipAdBtn');

        modal.classList.remove('hidden');
        this.remainingTime = 5;
        timerDisplay.textContent = this.remainingTime;
        skipBtn.disabled = true;
        skipBtn.textContent = `Skip in ${this.remainingTime}s`;

        // Countdown timer
        this.rewardedAdTimer = setInterval(() => {
            this.remainingTime--;
            timerDisplay.textContent = this.remainingTime;
            skipBtn.textContent = `Skip in ${this.remainingTime}s`;

            if (this.remainingTime <= 0) {
                clearInterval(this.rewardedAdTimer);
                skipBtn.disabled = false;
                skipBtn.textContent = '✓ Claim Reward';
            }
        }, 1000);
    },

    // Skip/claim reward from ad
    skipAd: function () {
        if (this.remainingTime > 0) return;

        clearInterval(this.rewardedAdTimer);
        const modal = document.getElementById('rewardedAdModal');
        modal.classList.add('hidden');

        // Mark ad as watched and grant reward
        this.adWatchedThisSession = true;
        this.grantExtraLife();
    },

    // Grant extra life and continue game
    grantExtraLife: function () {
        game.lives++;
        game.elLives.textContent = game.lives;

        // Disable the watch ad button
        const watchAdBtn = document.getElementById('watchAdBtn');
        watchAdBtn.classList.add('disabled');
        watchAdBtn.textContent = '✓ Reward Claimed';
        watchAdBtn.onclick = null;

        // Continue the game
        this.continueGame();
    },

    // Continue game after rewarded ad
    continueGame: function () {
        // Reset player position to center of screen
        game.player.x = game.width * 0.12;
        game.player.y = game.height / 2;
        game.player.velocity = 0;
        game.player.rotation = 0;

        // Clear ALL obstacles to give player a fresh start
        game.obstacles = [];

        // CRITICAL: Cancel the pending gameOver screen display
        if (game.gameOverTimeout) {
            clearTimeout(game.gameOverTimeout);
            game.gameOverTimeout = null;
        }

        // Cancel any existing animation/intervals first
        if (game.animationId) {
            cancelAnimationFrame(game.animationId);
            game.animationId = null;
        }
        if (game.obstacleInterval) {
            clearInterval(game.obstacleInterval);
            game.obstacleInterval = null;
        }

        // Set game state - USE PAUSED STATE until player taps
        game.running = true;
        game.paused = true;  // PAUSED until player taps
        game.questionActive = false;

        // EXPLICITLY hide game over screen and rewarded modal
        const gameOverScreen = document.getElementById('gameOverScreen');
        const rewardedModal = document.getElementById('rewardedAdModal');
        if (gameOverScreen) gameOverScreen.classList.add('hidden');
        if (rewardedModal) rewardedModal.classList.add('hidden');

        // Show game screen using the standard function
        showScreen('gameScreen');

        // Hide the ad banner during gameplay
        AdManager.hideBanner();

        // Start the render loop (but paused - no physics)
        gameLoop();

        // Show "Tap to Continue" tip that stays until tap
        showTip('👆 Tap to continue! You\'ll have 3s of invincibility.');

        // Set up one-time tap handler to resume gameplay
        const resumeHandler = (e) => {
            if (!game.running || !game.paused) return;

            // Enable invincibility for 3 seconds (longer to give player time)
            game.respawnInvincible = true;
            if (game.respawnInvincibleTimeout) clearTimeout(game.respawnInvincibleTimeout);
            game.respawnInvincibleTimeout = setTimeout(() => {
                game.respawnInvincible = false;
                game.respawnInvincibleTimeout = null;
                showTip('⚠️ Invincibility ended - stay alert!');
            }, 3000);

            // Unpause the game
            game.paused = false;

            // Give initial boost
            game.player.velocity = CONFIG.BOOST_FORCE;

            // Start spawning obstacles after a delay
            setTimeout(() => {
                if (game.running) {
                    if (game.obstacleInterval) clearInterval(game.obstacleInterval);
                    game.obstacleInterval = setInterval(spawnObstacle, CONFIG.OBSTACLE_SPAWN_RATE);
                }
            }, 1500);

            showTip('❤️ Extra life granted! 3s invincibility active!');

            // Remove this handler
            game.canvas.removeEventListener('click', resumeHandler);
            game.canvas.removeEventListener('touchstart', resumeHandler);
        };

        game.canvas.addEventListener('click', resumeHandler);
        game.canvas.addEventListener('touchstart', resumeHandler);
    },

    // Reset for new game
    reset: function () {
        this.adWatchedThisSession = false;
        const watchAdBtn = document.getElementById('watchAdBtn');
        if (watchAdBtn) {
            watchAdBtn.classList.remove('disabled');
            watchAdBtn.textContent = '📺 Watch Ad for Extra Life';
            watchAdBtn.onclick = () => AdManager.showRewardedAd();
        }
    }
};

// Modify startGame to reset ad state and hide banner during gameplay
const originalStartGame = startGame;
startGame = function () {
    AdManager.reset();
    AdManager.hideBanner();
    originalStartGame();
};

// Modify showStartScreen to show banner
const originalShowStartScreen = showStartScreen;
showStartScreen = function () {
    AdManager.showBanner();
    originalShowStartScreen();
};

// Initialize - show banner on load
document.addEventListener('DOMContentLoaded', () => {
    AdManager.showBanner();
});
