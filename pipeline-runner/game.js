/* =====================================================
   Pipeline Runner - DevOps Learning Game Engine
   ===================================================== */

// Game Configuration
const CONFIG = {
    GRAVITY: 0.35,
    BOOST_FORCE: -7.5,
    OBSTACLE_SPEED: 3,
    OBSTACLE_GAP: 180,
    OBSTACLE_SPAWN_RATE: 2200,
    PLAYER_SIZE: 50,
    OBSTACLE_WIDTH: 100,
    QUESTION_INTERVAL: 5,
    QUESTION_TIME: 12
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
        { cmd: '-d flag', desc: 'Runs container in background (detached)' }
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
        { cmd: 'HPA', desc: 'Horizontal Pod Autoscaler' }
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
        { cmd: 'Feature Flag', desc: 'Toggle features without deploy' }
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
        { cmd: 'DynamoDB', desc: 'NoSQL database, serverless' }
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
        { cmd: 'HCL', desc: 'HashiCorp Configuration Language' }
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
        { cmd: '.gitignore', desc: 'Exclude files from tracking' }
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
        { cmd: 'curl', desc: 'Transfer data via URLs' }
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
        { cmd: 'Error Rate', desc: 'Percentage of failed requests' }
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
        { q: "What is a Docker volume?", a: ["Persistent data storage", "Network interface", "CPU allocation", "Memory limit"], c: 0, fact: "Volumes persist data even when containers are deleted." }
    ],
    kubernetes: [
        { q: "What is a Kubernetes Pod?", a: ["Smallest deployable unit", "A cluster", "A service", "A volume"], c: 0, fact: "A Pod can contain one or more containers that share resources." },
        { q: "Which object manages Pod replicas?", a: ["Deployment", "Service", "ConfigMap", "Secret"], c: 0, fact: "Deployments enable declarative updates and rollbacks." },
        { q: "What exposes Pods to network traffic?", a: ["Service", "Deployment", "ReplicaSet", "Namespace"], c: 0, fact: "Services provide stable networking for ephemeral Pods." },
        { q: "Which command applies a YAML configuration?", a: ["kubectl apply -f", "kubectl create", "kubectl run", "kubectl start"], c: 0, fact: "kubectl apply is idempotent - safe to run multiple times." },
        { q: "What is a Kubernetes Namespace?", a: ["Virtual cluster partition", "Physical server", "Container runtime", "Storage class"], c: 0, fact: "Namespaces help organize resources in large clusters." },
        { q: "What does HPA stand for?", a: ["Horizontal Pod Autoscaler", "High Performance Architecture", "Host Port Allocation", "Hybrid Pod Application"], c: 0, fact: "HPA automatically scales pods based on CPU/memory usage." },
        { q: "Which object stores sensitive data?", a: ["Secret", "ConfigMap", "PersistentVolume", "Deployment"], c: 0, fact: "Secrets are base64 encoded (not encrypted by default!)." },
        { q: "What is an Ingress?", a: ["HTTP route manager", "Container runtime", "Pod scheduler", "Volume provisioner"], c: 0, fact: "Ingress provides SSL termination and virtual hosting." }
    ],
    cicd: [
        { q: "What does CI stand for?", a: ["Continuous Integration", "Code Inspection", "Container Instance", "Cloud Infrastructure"], c: 0, fact: "CI automates building and testing code on every commit." },
        { q: "What does CD stand for?", a: ["Continuous Delivery/Deployment", "Code Deployment", "Container Distribution", "Cloud Development"], c: 0, fact: "CD automates releasing code to production environments." },
        { q: "What triggers a CI pipeline?", a: ["Code commit/push", "Server restart", "User login", "Database query"], c: 0, fact: "Webhooks notify CI systems of repository changes." },
        { q: "What is a build artifact?", a: ["Output of build process", "Source code", "Configuration file", "Log file"], c: 0, fact: "Artifacts are stored for deployment or later use." },
        { q: "What is blue-green deployment?", a: ["Two identical environments", "Color-coded logs", "Branch naming", "Error highlighting"], c: 0, fact: "Blue-green enables instant rollback by switching traffic." },
        { q: "What is a canary deployment?", a: ["Gradual rollout to subset", "Fast deployment", "Rollback strategy", "Testing approach"], c: 0, fact: "Canary releases test changes on a small user percentage first." },
        { q: "What is GitHub Actions?", a: ["CI/CD platform", "Code review tool", "Issue tracker", "Wiki system"], c: 0, fact: "GitHub Actions uses YAML workflows in .github/workflows/." },
        { q: "What is GitOps?", a: ["Git as source of truth for infrastructure", "Git hosting service", "Git GUI tool", "Git branching strategy"], c: 0, fact: "GitOps uses pull requests to manage infrastructure changes." }
    ],
    aws: [
        { q: "What is EC2?", a: ["Elastic Compute Cloud", "Elastic Container Cloud", "Enterprise Cloud Computing", "Easy Cloud Creation"], c: 0, fact: "EC2 provides resizable virtual servers in the cloud." },
        { q: "What is S3 used for?", a: ["Object storage", "Compute instances", "Database hosting", "Network routing"], c: 0, fact: "S3 offers 99.999999999% (11 9s) durability!" },
        { q: "What is Lambda?", a: ["Serverless compute", "Database service", "Storage service", "Network service"], c: 0, fact: "Lambda scales automatically and charges per millisecond." },
        { q: "What does IAM manage?", a: ["Identity and Access", "Internet and Media", "Infrastructure and Monitoring", "Integration and Migration"], c: 0, fact: "IAM follows the principle of least privilege." },
        { q: "What is VPC?", a: ["Virtual Private Cloud", "Virtual Public Cloud", "Very Private Container", "Virtual Pod Cluster"], c: 0, fact: "VPC isolates your resources in a virtual network." },
        { q: "What is CloudFormation?", a: ["Infrastructure as Code", "Monitoring service", "Storage service", "Compute service"], c: 0, fact: "CloudFormation templates define AWS resources in YAML/JSON." },
        { q: "What is EKS?", a: ["Elastic Kubernetes Service", "Elastic Key Storage", "Enterprise Kubernetes System", "Easy Kubernetes Setup"], c: 0, fact: "EKS is a managed Kubernetes service by AWS." },
        { q: "What is CloudWatch?", a: ["Monitoring and logging", "Storage service", "Compute service", "Database service"], c: 0, fact: "CloudWatch collects metrics, logs, and can trigger alarms." }
    ],
    terraform: [
        { q: "What is Terraform?", a: ["Infrastructure as Code tool", "Container runtime", "CI/CD platform", "Monitoring tool"], c: 0, fact: "Terraform works with 1000+ providers (AWS, Azure, GCP, etc)." },
        { q: "What language does Terraform use?", a: ["HCL", "YAML", "JSON", "Python"], c: 0, fact: "HCL (HashiCorp Configuration Language) is human-readable." },
        { q: "What does 'terraform init' do?", a: ["Initializes working directory", "Creates resources", "Destroys resources", "Shows plan"], c: 0, fact: "terraform init downloads provider plugins." },
        { q: "What does 'terraform plan' show?", a: ["Preview of changes", "Current state", "Provider list", "Variable values"], c: 0, fact: "Always run plan before apply to review changes!" },
        { q: "What does 'terraform apply' do?", a: ["Applies changes", "Shows plan", "Initializes directory", "Validates config"], c: 0, fact: "Apply creates, updates, or deletes infrastructure." },
        { q: "What is Terraform state?", a: ["Record of managed infrastructure", "Configuration file", "Variable definition", "Provider plugin"], c: 0, fact: "State is critical - store it securely (e.g., S3 + DynamoDB)." },
        { q: "What is a Terraform module?", a: ["Reusable configuration", "State file", "Provider", "Resource type"], c: 0, fact: "Modules promote DRY (Don't Repeat Yourself) principles." },
        { q: "What does 'terraform destroy' do?", a: ["Removes all resources", "Shows plan", "Applies changes", "Validates config"], c: 0, fact: "Destroy removes all resources managed by the configuration." }
    ],
    git: [
        { q: "What does 'git clone' do?", a: ["Copies a repository", "Creates a branch", "Merges branches", "Pushes changes"], c: 0, fact: "Clone copies the entire repository history." },
        { q: "What does 'git commit' do?", a: ["Saves changes to local repo", "Uploads to remote", "Downloads changes", "Creates branch"], c: 0, fact: "Commits create a snapshot of your staged changes." },
        { q: "What does 'git push' do?", a: ["Uploads commits to remote", "Downloads changes", "Creates branch", "Merges branches"], c: 0, fact: "Push shares your local commits with the team." },
        { q: "What is a Git branch?", a: ["Parallel version of code", "Remote server", "Commit message", "File backup"], c: 0, fact: "Branches enable parallel development and feature isolation." },
        { q: "What does 'git merge' do?", a: ["Combines branches", "Creates branch", "Deletes branch", "Shows differences"], c: 0, fact: "Merge integrates changes from one branch into another." },
        { q: "What is a merge conflict?", a: ["Competing changes to same lines", "Network error", "Authentication failure", "File corruption"], c: 0, fact: "Conflicts happen when Git can't auto-merge changes." },
        { q: "What does 'git rebase'?", a: ["Reapplies commits on new base", "Creates backup", "Deletes history", "Merges repositories"], c: 0, fact: "Rebase creates a cleaner, linear commit history." },
        { q: "What is a pull request?", a: ["Request to merge changes", "Download request", "Access request", "Delete request"], c: 0, fact: "PRs enable code review before merging to main." }
    ],
    linux: [
        { q: "What does 'ls' command do?", a: ["Lists directory contents", "Creates file", "Deletes file", "Moves file"], c: 0, fact: "ls -la shows hidden files and detailed info." },
        { q: "What does 'grep' do?", a: ["Searches text patterns", "Creates files", "Compresses files", "Lists processes"], c: 0, fact: "grep supports regex for powerful pattern matching." },
        { q: "What does 'chmod' modify?", a: ["File permissions", "File owner", "File name", "File size"], c: 0, fact: "chmod 755 gives owner full access, others read+execute." },
        { q: "What does 'sudo' do?", a: ["Runs as superuser", "Shuts down system", "Shows disk usage", "Searches files"], c: 0, fact: "sudo = 'superuser do' - runs commands with elevated privileges." },
        { q: "What does 'ps' show?", a: ["Running processes", "File permissions", "Network connections", "Disk space"], c: 0, fact: "ps aux shows all processes with detailed info." },
        { q: "What is systemd?", a: ["System and service manager", "File system", "Network manager", "Package manager"], c: 0, fact: "systemd is the init system for most modern Linux distros." },
        { q: "What does 'ssh' do?", a: ["Secure remote connection", "File transfer", "Service start", "System shutdown"], c: 0, fact: "SSH encrypts all traffic between client and server." },
        { q: "What does 'curl' do?", a: ["Transfers data via URLs", "Creates users", "Compresses files", "Lists processes"], c: 0, fact: "curl supports HTTP, HTTPS, FTP, and many more protocols." }
    ],
    monitoring: [
        { q: "What is Prometheus?", a: ["Monitoring system", "Container runtime", "CI/CD tool", "Load balancer"], c: 0, fact: "Prometheus uses a pull model to scrape metrics." },
        { q: "What is Grafana used for?", a: ["Data visualization", "Data storage", "Data processing", "Data backup"], c: 0, fact: "Grafana can visualize data from 50+ data sources." },
        { q: "What are metrics?", a: ["Numerical measurements over time", "Log messages", "Error codes", "Configuration files"], c: 0, fact: "Metrics help identify trends and detect anomalies." },
        { q: "What is alerting?", a: ["Notifications for threshold breaches", "Log aggregation", "Metric collection", "Dashboard creation"], c: 0, fact: "Good alerts are actionable and avoid alert fatigue." },
        { q: "What does ELK stand for?", a: ["Elasticsearch, Logstash, Kibana", "Easy Linux Kit", "Enterprise Log Keeper", "Elastic Load Kit"], c: 0, fact: "ELK Stack is the most popular log management solution." },
        { q: "What is an SLO?", a: ["Service Level Objective", "System Log Output", "Server Load Optimizer", "Service Launch Order"], c: 0, fact: "SLOs define target reliability levels for services." },
        { q: "What is APM?", a: ["Application Performance Monitoring", "Automated Process Manager", "Advanced Package Manager", "Application Process Memory"], c: 0, fact: "APM tracks response times, errors, and bottlenecks." },
        { q: "What is tracing?", a: ["Following request paths", "Logging errors", "Measuring latency", "Counting requests"], c: 0, fact: "Distributed tracing follows requests across microservices." }
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
let game = {
    running: false,
    paused: false,
    canvas: null,
    ctx: null,
    animationId: null,
    obstacleInterval: null,

    selectedTopic: 'docker',
    usedContentIndices: [],

    player: {
        x: 100,
        y: 0,
        velocity: 0,
        rotation: 0
    },

    obstacles: [],
    particles: [],
    stars: [],
    learnedItems: [],
    floatingTexts: [],

    score: 0,
    bestScore: 0,
    streak: 0,
    bestStreak: 0,
    lives: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    totalLearned: 0,

    lastLearnedFact: '',
    respawnInvincible: false,

    currentQuestion: null,
    questionActive: false,
    questionTimer: 0,

    width: 0,
    height: 0
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');

    loadProgress();
    renderTopicButtons();
    setupEventListeners();
    resizeCanvas();
    initStars();

    window.addEventListener('resize', resizeCanvas);
}

function loadProgress() {
    game.bestScore = parseInt(localStorage.getItem('pipeline-runner-best') || '0');
    game.totalLearned = parseInt(localStorage.getItem('pipeline-runner-learned') || '0');
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

    TOPICS.forEach(topic => {
        const btn = document.createElement('button');
        btn.className = `topic-btn ${topic.id === game.selectedTopic ? 'selected' : ''}`;
        btn.innerHTML = `${topic.icon} ${topic.name}`;
        btn.onclick = () => selectTopic(topic.id);
        container.appendChild(btn);
    });
}

function selectTopic(topicId) {
    game.selectedTopic = topicId;
    renderTopicButtons();

    const topic = TOPICS.find(t => t.id === topicId);
    document.querySelector('.icon-preview').textContent = topic.icon;
}

function initStars() {
    game.stars = [];
    for (let i = 0; i < 100; i++) {
        game.stars.push({
            x: Math.random() * (game.width || 600),
            y: Math.random() * (game.height || 800),
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 1.5 + 0.5,
            brightness: Math.random() * 0.5 + 0.3
        });
    }
}

function getNextLearnableContent() {
    const content = LEARNABLE_CONTENT[game.selectedTopic];
    if (game.usedContentIndices.length >= content.length) {
        game.usedContentIndices = [];
    }

    let index;
    do {
        index = Math.floor(Math.random() * content.length);
    } while (game.usedContentIndices.includes(index));

    game.usedContentIndices.push(index);
    return content[index];
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
    });
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

    initStars();
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
    game.usedContentIndices = [];
    game.questionActive = false;
    game.currentQuestion = null;
    game.lastLearnedFact = '';

    game.player.x = game.width * 0.12;
    game.player.y = game.height / 2;
    game.player.velocity = 0;
    game.player.rotation = 0;

    const topic = TOPICS.find(t => t.id === game.selectedTopic);
    document.getElementById('currentTopicBadge').textContent = `${topic.icon} ${topic.name}`;
    document.getElementById('currentScore').textContent = '0';
    document.getElementById('streakCount').textContent = '0';
    document.getElementById('livesCount').textContent = '0';

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

    if (!game.paused && !game.questionActive) {
        update();
    }
    render();

    game.animationId = requestAnimationFrame(gameLoop);
}

function update() {
    game.player.velocity += CONFIG.GRAVITY;
    game.player.y += game.player.velocity;
    game.player.rotation = Math.min(Math.max(game.player.velocity * 2.5, -20), 60);

    game.stars.forEach(star => {
        star.x -= star.speed;
        if (star.x < 0) {
            star.x = game.width;
            star.y = Math.random() * game.height;
        }
    });

    game.obstacles.forEach(obs => {
        obs.x -= CONFIG.OBSTACLE_SPEED;

        if (!obs.passed && obs.x + CONFIG.OBSTACLE_WIDTH < game.player.x) {
            obs.passed = true;
            game.score++;
            document.getElementById('currentScore').textContent = game.score;

            // Show learned content as floating text
            game.learnedItems.push(obs.content);
            showLearnedContent(obs.content);

            if (game.score % CONFIG.QUESTION_INTERVAL === 0) {
                showQuestion();
            }
        }
    });

    game.obstacles = game.obstacles.filter(obs => obs.x > -CONFIG.OBSTACLE_WIDTH * 2);

    // Update floating texts
    game.floatingTexts = game.floatingTexts.filter(ft => {
        ft.y -= 1;
        ft.life -= 0.015;
        return ft.life > 0;
    });

    game.particles = game.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.vy += 0.1;
        return p.life > 0;
    });

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

    const gradient = ctx.createLinearGradient(0, 0, 0, game.height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(0.5, '#1e293b');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.width, game.height);

    game.stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });

    drawPipelineBackground(ctx);

    game.particles.forEach(p => {
        ctx.fillStyle = `rgba(${p.color}, ${p.life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    });

    game.obstacles.forEach(obs => drawObstacle(ctx, obs));

    // Draw floating learned texts
    game.floatingTexts.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = ft.life;
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 14px Outfit';
        ctx.textAlign = 'left';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
    });

    drawPlayer(ctx);
}

function drawPipelineBackground(ctx) {
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);

    for (let i = 1; i < 4; i++) {
        const y = (game.height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(game.width, y);
        ctx.stroke();
    }

    ctx.setLineDash([]);
}

function drawObstacle(ctx, obs) {
    const topic = TOPICS.find(t => t.id === game.selectedTopic);
    const gateWidth = CONFIG.OBSTACLE_WIDTH;
    const gateColor = topic ? topic.color : '#3b82f6';

    // Top gate
    const topGradient = ctx.createLinearGradient(obs.x, 0, obs.x + gateWidth, 0);
    topGradient.addColorStop(0, gateColor);
    topGradient.addColorStop(0.5, lightenColor(gateColor, 20));
    topGradient.addColorStop(1, gateColor);

    ctx.fillStyle = topGradient;
    ctx.fillRect(obs.x, 0, gateWidth, obs.gapY);

    // Top gate cap with command
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(obs.x - 8, obs.gapY - 35, gateWidth + 16, 35);
    ctx.strokeStyle = gateColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(obs.x - 8, obs.gapY - 35, gateWidth + 16, 35);

    // Command text on top gate
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(obs.content.cmd, obs.x + gateWidth / 2, obs.gapY - 17);

    // Bottom gate
    const bottomY = obs.gapY + CONFIG.OBSTACLE_GAP;
    ctx.fillStyle = topGradient;
    ctx.fillRect(obs.x, bottomY, gateWidth, game.height - bottomY);

    // Bottom gate cap with description hint
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(obs.x - 8, bottomY, gateWidth + 16, 35);
    ctx.strokeStyle = gateColor;
    ctx.strokeRect(obs.x - 8, bottomY, gateWidth + 16, 35);

    // Topic icon on bottom
    ctx.font = '18px Arial';
    ctx.fillText(topic.icon, obs.x + gateWidth / 2, bottomY + 18);
}

function drawPlayer(ctx) {
    const p = game.player;
    const topic = TOPICS.find(t => t.id === game.selectedTopic);

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation * Math.PI / 180);

    ctx.shadowColor = topic.color;
    ctx.shadowBlur = 20;

    const gradient = ctx.createLinearGradient(-25, -20, 25, 20);
    gradient.addColorStop(0, lightenColor(topic.color, 30));
    gradient.addColorStop(0.5, topic.color);
    gradient.addColorStop(1, darkenColor(topic.color, 20));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(-25, -18, 50, 36, 8);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(topic.icon, 0, 0);

    if (p.velocity < 0) {
        ctx.fillStyle = `rgba(255, 200, 100, 0.8)`;
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
    const maxGapY = game.height - CONFIG.OBSTACLE_GAP - 120;
    const gapY = Math.random() * (maxGapY - minGapY) + minGapY;

    const content = getNextLearnableContent();

    game.obstacles.push({
        x: game.width + 50,
        gapY: gapY,
        passed: false,
        content: content
    });
}

function checkCollision() {
    const p = game.player;
    const playerRadius = 20;

    if (p.y - playerRadius < 0 || p.y + playerRadius > game.height) {
        return true;
    }

    for (let obs of game.obstacles) {
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

    const topic = TOPICS.find(t => t.id === game.selectedTopic);
    document.getElementById('questionTopic').textContent = `${topic.icon} ${topic.name}`;
    document.getElementById('questionText').textContent = question.q;
    document.getElementById('questionTimer').textContent = CONFIG.QUESTION_TIME;

    const answerGrid = document.getElementById('answerGrid');
    answerGrid.innerHTML = '';

    answers.forEach((answer, i) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.innerHTML = `
            <span class="answer-key">${i + 1}</span>
            <span class="answer-text">${answer.text}</span>
        `;
        btn.onclick = () => selectAnswer(i);
        answerGrid.appendChild(btn);
    });

    document.getElementById('questionModal').classList.remove('hidden');
    startQuestionTimer();
}

function startQuestionTimer() {
    const timerInterval = setInterval(() => {
        if (!game.questionActive) {
            clearInterval(timerInterval);
            return;
        }

        game.questionTimer--;
        document.getElementById('questionTimer').textContent = game.questionTimer;

        if (game.questionTimer <= 0) {
            clearInterval(timerInterval);
            handleTimeout();
        }
    }, 1000);
}

function selectAnswer(index) {
    if (!game.questionActive || game.currentQuestion.answered) return;

    game.currentQuestion.answered = true;
    const btns = document.querySelectorAll('.answer-btn');

    btns.forEach((btn, i) => {
        btn.classList.add('disabled');
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

    game.questionsAnswered++;

    if (correct) {
        game.correctAnswers++;
        game.streak++;
        game.bestStreak = Math.max(game.bestStreak, game.streak);
        document.getElementById('streakCount').textContent = game.streak;

        game.score += 5;
        document.getElementById('currentScore').textContent = game.score;

        // Award a life for correct answer!
        game.lives++;
        document.getElementById('livesCount').textContent = game.lives;
        showTip(`+1 Life! ❤️ You now have ${game.lives} lives!`);

        game.lastLearnedFact = game.currentQuestion.fact || "Great job! Keep learning!";
    } else {
        game.streak = 0;
        document.getElementById('streakCount').textContent = '0';
        game.lastLearnedFact = game.currentQuestion.fact || "Remember this for next time!";
    }

    setTimeout(closeQuestion, 1200);
}

function handleTimeout() {
    game.questionsAnswered++;
    game.streak = 0;
    document.getElementById('streakCount').textContent = '0';

    const btns = document.querySelectorAll('.answer-btn');
    btns[game.currentQuestion.correctIndex].classList.add('correct');

    game.lastLearnedFact = game.currentQuestion.fact || "Time's up! Try to answer faster.";

    setTimeout(closeQuestion, 1200);
}

function closeQuestion() {
    game.questionActive = false;
    game.paused = false;
    game.currentQuestion = null;
    document.getElementById('questionModal').classList.add('hidden');
}

// Tips
function showTip(text) {
    const banner = document.getElementById('tipBanner');
    document.getElementById('tipText').textContent = text;
    banner.classList.remove('hidden');

    setTimeout(() => hideTipBanner(), 3000);
}

function hideTipBanner() {
    document.getElementById('tipBanner').classList.add('hidden');
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
    game.gameOverTimeout = setTimeout(() => showScreen('gameOverScreen'), 500);
}

// Use a life to respawn
function useLife() {
    game.lives--;
    document.getElementById('livesCount').textContent = game.lives;

    game.respawnInvincible = true;
    showTip(`❤️ Used 1 life! ${game.lives} remaining. Keep going!`);

    // Reset player position to safe spot
    game.player.y = game.height / 2;
    game.player.velocity = 0;
    game.player.rotation = 0;

    // Clear nearby obstacles
    game.obstacles = game.obstacles.filter(obs => obs.x > game.player.x + 150 || obs.x < game.player.x - 100);

    // Invincibility for 1.5 seconds
    setTimeout(() => {
        game.respawnInvincible = false;
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
        document.getElementById('livesCount').textContent = game.lives;

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
        console.log('[AdManager] Continuing game after reward...');

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

            console.log('[AdManager] Player tapped to resume');

            // Enable invincibility for 3 seconds (longer to give player time)
            game.respawnInvincible = true;
            setTimeout(() => {
                game.respawnInvincible = false;
                showTip('⚠️ Invincibility ended - stay alert!');
            }, 3000);

            // Unpause the game
            game.paused = false;

            // Give initial boost
            game.player.velocity = CONFIG.BOOST_FORCE;

            // Start spawning obstacles after a delay
            setTimeout(() => {
                if (game.running) {
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

        console.log('[AdManager] Waiting for player tap to resume...');
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
