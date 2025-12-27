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
    BASE_SCORE: 100,
    SPEED_BONUS: 50,
    STREAK_MULTIPLIER: 0.5,
    DAMAGE_WRONG: 20,
    DAMAGE_TIMEOUT: 15,
    WAVES_PER_ZONE: 5,
    ENEMIES_PER_WAVE_BASE: 3
};

// DevOps Questions Database
const QUESTIONS = {
    docker: [
        { q: "What command creates a new container from an image?", a: ["docker run", "docker start", "docker create", "docker build"], c: 0 },
        { q: "Which file defines a Docker image's build instructions?", a: ["Dockerfile", "docker-compose.yml", "config.json", "image.yaml"], c: 0 },
        { q: "What is a Docker container?", a: ["A lightweight isolated environment", "A virtual machine", "A programming language", "A database"], c: 0 },
        { q: "Which command lists all running containers?", a: ["docker ps", "docker list", "docker show", "docker containers"], c: 0 },
        { q: "What does 'docker pull' do?", a: ["Downloads an image from a registry", "Uploads an image", "Creates a container", "Removes a container"], c: 0 },
        { q: "What is Docker Compose used for?", a: ["Multi-container applications", "Building images", "Network configuration", "Security scanning"], c: 0 },
        { q: "Which command stops a running container?", a: ["docker stop", "docker kill", "docker end", "docker halt"], c: 0 },
        { q: "What is a Docker volume?", a: ["Persistent data storage", "Network interface", "CPU allocation", "Memory limit"], c: 0 },
        { q: "What does the -d flag do in 'docker run -d'?", a: ["Runs container in detached mode", "Enables debugging", "Downloads image", "Deletes after exit"], c: 0 },
        { q: "Which port mapping is correct?", a: ["-p 8080:80", "-p 80-8080", "-port 8080:80", "--port=8080,80"], c: 0 },
        { q: "What is a multi-stage build?", a: ["Build with multiple FROM statements", "Building multiple containers", "Parallel builds", "Sequential deployments"], c: 0 },
        { q: "What does ENTRYPOINT do in a Dockerfile?", a: ["Sets the main executable", "Defines environment variables", "Copies files", "Exposes ports"], c: 0 }
    ],
    kubernetes: [
        { q: "What is a Kubernetes Pod?", a: ["Smallest deployable unit", "A cluster", "A service", "A volume"], c: 0 },
        { q: "Which object manages Pod replicas?", a: ["Deployment", "Service", "ConfigMap", "Secret"], c: 0 },
        { q: "What exposes Pods to network traffic?", a: ["Service", "Deployment", "ReplicaSet", "Namespace"], c: 0 },
        { q: "Which command applies a YAML configuration?", a: ["kubectl apply -f", "kubectl create", "kubectl run", "kubectl start"], c: 0 },
        { q: "What is a Kubernetes Namespace?", a: ["Virtual cluster partition", "Physical server", "Container runtime", "Storage class"], c: 0 },
        { q: "What does HPA stand for?", a: ["Horizontal Pod Autoscaler", "High Performance Architecture", "Host Port Allocation", "Hybrid Pod Application"], c: 0 },
        { q: "Which object stores sensitive data?", a: ["Secret", "ConfigMap", "PersistentVolume", "Deployment"], c: 0 },
        { q: "What is an Ingress?", a: ["HTTP route manager", "Container runtime", "Pod scheduler", "Volume provisioner"], c: 0 },
        { q: "What does 'kubectl get pods' show?", a: ["List of Pods", "Pod logs", "Pod description", "Pod metrics"], c: 0 },
        { q: "What is a StatefulSet used for?", a: ["Stateful applications", "Stateless services", "Network policies", "Resource quotas"], c: 0 },
        { q: "What is a DaemonSet?", a: ["Runs Pod on every node", "Manages secrets", "Handles ingress", "Schedules jobs"], c: 0 },
        { q: "What does kubelet do?", a: ["Runs containers on nodes", "Manages the API", "Stores cluster state", "Routes traffic"], c: 0 }
    ],
    cicd: [
        { q: "What does CI stand for?", a: ["Continuous Integration", "Code Inspection", "Container Instance", "Cloud Infrastructure"], c: 0 },
        { q: "What does CD stand for?", a: ["Continuous Delivery/Deployment", "Code Deployment", "Container Distribution", "Cloud Development"], c: 0 },
        { q: "What is a pipeline?", a: ["Automated workflow stages", "Network connection", "Data stream", "Code repository"], c: 0 },
        { q: "Which is a popular CI/CD tool?", a: ["Jenkins", "Photoshop", "Excel", "Notepad"], c: 0 },
        { q: "What triggers a CI pipeline?", a: ["Code commit/push", "Server restart", "User login", "Database query"], c: 0 },
        { q: "What is a build artifact?", a: ["Output of build process", "Source code", "Configuration file", "Log file"], c: 0 },
        { q: "What is GitOps?", a: ["Git as source of truth for infrastructure", "Git hosting service", "Git GUI tool", "Git branching strategy"], c: 0 },
        { q: "What is a deployment environment?", a: ["Where application runs", "Code editor", "Build tool", "Testing framework"], c: 0 },
        { q: "What does 'shift left' mean?", a: ["Earlier testing in pipeline", "Code formatting", "Branch merging", "Log rotation"], c: 0 },
        { q: "What is blue-green deployment?", a: ["Two identical environments", "Color-coded logs", "Branch naming", "Error highlighting"], c: 0 },
        { q: "What is a canary deployment?", a: ["Gradual rollout to subset", "Fast deployment", "Rollback strategy", "Testing approach"], c: 0 },
        { q: "What is GitHub Actions?", a: ["CI/CD platform", "Code review tool", "Issue tracker", "Wiki system"], c: 0 }
    ],
    aws: [
        { q: "What is EC2?", a: ["Elastic Compute Cloud", "Elastic Container Cloud", "Enterprise Cloud Computing", "Easy Cloud Creation"], c: 0 },
        { q: "What is S3 used for?", a: ["Object storage", "Compute instances", "Database hosting", "Network routing"], c: 0 },
        { q: "What is Lambda?", a: ["Serverless compute", "Database service", "Storage service", "Network service"], c: 0 },
        { q: "What does IAM manage?", a: ["Identity and Access", "Internet and Media", "Infrastructure and Monitoring", "Integration and Migration"], c: 0 },
        { q: "What is VPC?", a: ["Virtual Private Cloud", "Virtual Public Cloud", "Very Private Container", "Virtual Pod Cluster"], c: 0 },
        { q: "What is CloudFormation?", a: ["Infrastructure as Code", "Monitoring service", "Storage service", "Compute service"], c: 0 },
        { q: "What is EKS?", a: ["Elastic Kubernetes Service", "Elastic Key Storage", "Enterprise Kubernetes System", "Easy Kubernetes Setup"], c: 0 },
        { q: "What is RDS?", a: ["Relational Database Service", "Remote Data Storage", "Rapid Deployment Service", "Resource Distribution System"], c: 0 },
        { q: "What is CloudWatch?", a: ["Monitoring and logging", "Storage service", "Compute service", "Database service"], c: 0 },
        { q: "What is an AWS Region?", a: ["Geographic location of data centers", "Pricing tier", "Account type", "Service category"], c: 0 },
        { q: "What is Route 53?", a: ["DNS service", "Routing table", "VPC component", "Load balancer"], c: 0 },
        { q: "What is ELB?", a: ["Elastic Load Balancer", "Enterprise Linux Box", "Easy Lambda Builder", "Elastic Log Buffer"], c: 0 }
    ],
    terraform: [
        { q: "What is Terraform?", a: ["Infrastructure as Code tool", "Container runtime", "CI/CD platform", "Monitoring tool"], c: 0 },
        { q: "What language does Terraform use?", a: ["HCL", "YAML", "JSON", "Python"], c: 0 },
        { q: "What does 'terraform init' do?", a: ["Initializes working directory", "Creates resources", "Destroys resources", "Shows plan"], c: 0 },
        { q: "What does 'terraform plan' show?", a: ["Preview of changes", "Current state", "Provider list", "Variable values"], c: 0 },
        { q: "What does 'terraform apply' do?", a: ["Applies changes", "Shows plan", "Initializes directory", "Validates config"], c: 0 },
        { q: "What is Terraform state?", a: ["Record of managed infrastructure", "Configuration file", "Variable definition", "Provider plugin"], c: 0 },
        { q: "What is a Terraform module?", a: ["Reusable configuration", "State file", "Provider", "Resource type"], c: 0 },
        { q: "What is a Terraform provider?", a: ["Plugin for API interaction", "State backend", "Module source", "Variable type"], c: 0 },
        { q: "What does 'terraform destroy' do?", a: ["Removes all resources", "Shows plan", "Applies changes", "Validates config"], c: 0 },
        { q: "What file extension does Terraform use?", a: [".tf", ".yaml", ".json", ".xml"], c: 0 },
        { q: "What is a Terraform workspace?", a: ["Isolated state environment", "Configuration file", "Module directory", "Provider setting"], c: 0 },
        { q: "What is terraform.tfvars?", a: ["Variable values file", "State file", "Plan output", "Lock file"], c: 0 }
    ],
    git: [
        { q: "What does 'git clone' do?", a: ["Copies a repository", "Creates a branch", "Merges branches", "Pushes changes"], c: 0 },
        { q: "What does 'git commit' do?", a: ["Saves changes to local repo", "Uploads to remote", "Downloads changes", "Creates branch"], c: 0 },
        { q: "What does 'git push' do?", a: ["Uploads commits to remote", "Downloads changes", "Creates branch", "Merges branches"], c: 0 },
        { q: "What does 'git pull' do?", a: ["Fetches and merges changes", "Uploads commits", "Creates branch", "Shows history"], c: 0 },
        { q: "What is a Git branch?", a: ["Parallel version of code", "Remote server", "Commit message", "File backup"], c: 0 },
        { q: "What does 'git merge' do?", a: ["Combines branches", "Creates branch", "Deletes branch", "Shows differences"], c: 0 },
        { q: "What is a merge conflict?", a: ["Competing changes to same lines", "Network error", "Authentication failure", "File corruption"], c: 0 },
        { q: "What does 'git stash' do?", a: ["Temporarily saves changes", "Deletes changes", "Commits changes", "Pushes changes"], c: 0 },
        { q: "What is 'git rebase'?", a: ["Reapplies commits on new base", "Creates backup", "Deletes history", "Merges repositories"], c: 0 },
        { q: "What does HEAD refer to?", a: ["Current commit reference", "Remote server", "Branch list", "Commit history"], c: 0 },
        { q: "What is a pull request?", a: ["Request to merge changes", "Download request", "Access request", "Delete request"], c: 0 },
        { q: "What does 'git log' show?", a: ["Commit history", "Current changes", "Branch list", "Remote URLs"], c: 0 }
    ],
    linux: [
        { q: "What does 'ls' command do?", a: ["Lists directory contents", "Creates file", "Deletes file", "Moves file"], c: 0 },
        { q: "What does 'cd' command do?", a: ["Changes directory", "Creates directory", "Copies directory", "Deletes directory"], c: 0 },
        { q: "What does 'grep' do?", a: ["Searches text patterns", "Creates files", "Compresses files", "Lists processes"], c: 0 },
        { q: "What does 'chmod' modify?", a: ["File permissions", "File owner", "File name", "File size"], c: 0 },
        { q: "What does 'sudo' do?", a: ["Runs as superuser", "Shuts down system", "Shows disk usage", "Searches files"], c: 0 },
        { q: "What does 'ps' show?", a: ["Running processes", "File permissions", "Network connections", "Disk space"], c: 0 },
        { q: "What does 'kill' command do?", a: ["Terminates processes", "Deletes files", "Stops services", "Ends sessions"], c: 0 },
        { q: "What is systemd?", a: ["System and service manager", "File system", "Network manager", "Package manager"], c: 0 },
        { q: "What does 'cat' command do?", a: ["Displays file contents", "Creates files", "Concatenates commands", "Copies files"], c: 0 },
        { q: "What does 'df' show?", a: ["Disk space usage", "Directory files", "Data format", "Device info"], c: 0 },
        { q: "What does 'top' display?", a: ["System processes", "File contents", "Network status", "User list"], c: 0 },
        { q: "What does 'ssh' do?", a: ["Secure remote connection", "File transfer", "Service start", "System shutdown"], c: 0 }
    ],
    monitoring: [
        { q: "What is Prometheus?", a: ["Monitoring system", "Container runtime", "CI/CD tool", "Load balancer"], c: 0 },
        { q: "What is Grafana used for?", a: ["Data visualization", "Data storage", "Data processing", "Data backup"], c: 0 },
        { q: "What are metrics?", a: ["Numerical measurements over time", "Log messages", "Error codes", "Configuration files"], c: 0 },
        { q: "What is alerting?", a: ["Notifications for threshold breaches", "Log aggregation", "Metric collection", "Dashboard creation"], c: 0 },
        { q: "What does ELK stand for?", a: ["Elasticsearch, Logstash, Kibana", "Easy Linux Kit", "Enterprise Log Keeper", "Elastic Load Kit"], c: 0 },
        { q: "What is an SLO?", a: ["Service Level Objective", "System Log Output", "Server Load Optimizer", "Service Launch Order"], c: 0 },
        { q: "What is APM?", a: ["Application Performance Monitoring", "Automated Process Manager", "Advanced Package Manager", "Application Process Memory"], c: 0 },
        { q: "What is tracing?", a: ["Following request paths", "Logging errors", "Measuring latency", "Counting requests"], c: 0 },
        { q: "What is a dashboard?", a: ["Visual display of metrics", "Configuration file", "Log aggregator", "Alert manager"], c: 0 },
        { q: "What is log aggregation?", a: ["Collecting logs centrally", "Deleting old logs", "Compressing logs", "Encrypting logs"], c: 0 }
    ],
    ansible: [
        { q: "What is Ansible?", a: ["Configuration management tool", "Container runtime", "CI/CD platform", "Monitoring system"], c: 0 },
        { q: "What is an Ansible Playbook?", a: ["YAML file with tasks", "Python script", "Shell script", "JSON config"], c: 0 },
        { q: "What is Ansible inventory?", a: ["List of managed hosts", "Task definitions", "Variable storage", "Module library"], c: 0 },
        { q: "What is an Ansible role?", a: ["Reusable task collection", "User account", "Network config", "Container image"], c: 0 },
        { q: "How does Ansible connect to hosts?", a: ["SSH", "HTTP", "FTP", "RDP"], c: 0 },
        { q: "What is Ansible Vault?", a: ["Encrypts sensitive data", "Stores variables", "Manages inventory", "Runs tasks"], c: 0 },
        { q: "What is an Ansible module?", a: ["Reusable task unit", "Playbook section", "Inventory group", "Variable file"], c: 0 },
        { q: "What is idempotency?", a: ["Same result on repeated runs", "Parallel execution", "Sequential tasks", "Error handling"], c: 0 },
        { q: "What is Ansible Galaxy?", a: ["Role sharing platform", "Monitoring dashboard", "Log aggregator", "Container registry"], c: 0 },
        { q: "What does a handler do?", a: ["Runs when notified", "Always runs", "Never runs", "Runs first"], c: 0 }
    ],
    azure: [
        { q: "What is Azure?", a: ["Microsoft's cloud platform", "AWS service", "Google product", "Linux distro"], c: 0 },
        { q: "What is Azure DevOps?", a: ["Development tools suite", "Virtual machine", "Database service", "Storage account"], c: 0 },
        { q: "What is AKS?", a: ["Azure Kubernetes Service", "Azure Key Storage", "Azure Knowledge System", "Azure Kernel Service"], c: 0 },
        { q: "What is Azure Functions?", a: ["Serverless compute", "Virtual machines", "Container instances", "Database service"], c: 0 },
        { q: "What is Azure Blob Storage?", a: ["Object storage", "Block storage", "File storage", "Queue storage"], c: 0 },
        { q: "What is ARM?", a: ["Azure Resource Manager", "Azure Runtime Module", "Azure Region Manager", "Azure Role Manager"], c: 0 },
        { q: "What is Azure AD?", a: ["Identity management", "Application deployment", "Network configuration", "Storage management"], c: 0 },
        { q: "What is an Azure Resource Group?", a: ["Container for resources", "Virtual network", "Storage account", "Compute instance"], c: 0 },
        { q: "What is Azure CLI?", a: ["Command-line tool", "GUI application", "Mobile app", "Web portal"], c: 0 },
        { q: "What is Azure Pipelines?", a: ["CI/CD service", "Data pipeline", "Network route", "Storage tier"], c: 0 }
    ],
    devsecops: [
        { q: "What is DevSecOps?", a: ["Security integrated in DevOps", "Development operations", "Security department", "Operations security"], c: 0 },
        { q: "What is 'shift left'?", a: ["Earlier security testing", "Code formatting", "Left alignment", "Branch merging"], c: 0 },
        { q: "What is SAST?", a: ["Static Application Security Testing", "System Admin Security Tool", "Server Authentication", "Storage Access Service"], c: 0 },
        { q: "What is DAST?", a: ["Dynamic Application Security Testing", "Data Admin Security Tool", "Database Access Service", "Deployment Auto Security"], c: 0 },
        { q: "What is container scanning?", a: ["Checking images for vulnerabilities", "Creating containers", "Running containers", "Deleting containers"], c: 0 },
        { q: "What is secret management?", a: ["Securing sensitive data", "Project management", "Code versioning", "Log management"], c: 0 },
        { q: "What is OWASP Top 10?", a: ["Web security risks list", "Programming languages", "Cloud providers", "CI/CD tools"], c: 0 },
        { q: "What is Trivy?", a: ["Vulnerability scanner", "Container runtime", "CI/CD tool", "Monitoring system"], c: 0 },
        { q: "What is dependency scanning?", a: ["Checking libraries for vulnerabilities", "Installing packages", "Updating code", "Building images"], c: 0 },
        { q: "What is a CVE?", a: ["Common Vulnerabilities and Exposures", "Code Version Error", "Container Virtual Environment", "Cloud Vendor Edition"], c: 0 }
    ],
    networking: [
        { q: "What does DNS do?", a: ["Translates domains to IPs", "Encrypts data", "Routes traffic", "Balances load"], c: 0 },
        { q: "What is a load balancer?", a: ["Distributes traffic", "Stores data", "Encrypts traffic", "Monitors servers"], c: 0 },
        { q: "What is TCP?", a: ["Reliable transport protocol", "File transfer protocol", "Email protocol", "Web protocol"], c: 0 },
        { q: "What is HTTP?", a: ["Web transfer protocol", "File protocol", "Email protocol", "Database protocol"], c: 0 },
        { q: "What is a reverse proxy?", a: ["Forwards requests to backend", "Client-side proxy", "VPN connection", "Firewall rule"], c: 0 },
        { q: "What is HTTPS?", a: ["HTTP with encryption", "High-speed HTTP", "HTTP server", "HTTP standard"], c: 0 },
        { q: "What is a firewall?", a: ["Network security filter", "Load balancer", "DNS server", "Web server"], c: 0 },
        { q: "What is NAT?", a: ["Network Address Translation", "Network Admin Tool", "Node Access Terminal", "Network Auto Test"], c: 0 },
        { q: "What is a subnet?", a: ["Network subdivision", "Server type", "Protocol version", "Port range"], c: 0 },
        { q: "What is CIDR notation?", a: ["IP address range format", "Security protocol", "Routing algorithm", "DNS record type"], c: 0 },
        { q: "What is SSL/TLS?", a: ["Encryption protocols", "Routing protocols", "Transfer protocols", "Authentication protocols"], c: 0 },
        { q: "What is a CDN?", a: ["Content Delivery Network", "Central Data Node", "Cloud Database Network", "Container Distribution Network"], c: 0 }
    ]
};

// Topic configuration
const TOPICS = [
    { id: 'docker', name: 'Docker', icon: '🐳', color: '#0db7ed' },
    { id: 'kubernetes', name: 'Kubernetes', icon: '☸️', color: '#326ce5' },
    { id: 'cicd', name: 'CI/CD', icon: '🔄', color: '#f97316' },
    { id: 'aws', name: 'AWS', icon: '☁️', color: '#ff9900' },
    { id: 'terraform', name: 'Terraform', icon: '🏗️', color: '#7b42bc' },
    { id: 'git', name: 'Git', icon: '📦', color: '#f05032' },
    { id: 'linux', name: 'Linux', icon: '🐧', color: '#fcc624' },
    { id: 'monitoring', name: 'Monitoring', icon: '📊', color: '#00c853' },
    { id: 'ansible', name: 'Ansible', icon: '🔧', color: '#ee0000' },
    { id: 'azure', name: 'Azure', icon: '🔷', color: '#0078d4' },
    { id: 'devsecops', name: 'DevSecOps', icon: '🔒', color: '#dc2626' },
    { id: 'networking', name: 'Networking', icon: '🌐', color: '#0891b2' }
];

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
    
    // Question state
    currentQuestion: null,
    questionActive: false,
    questionTimer: 0,
    selectedAnswer: -1,
    
    // Input
    keys: {},
    
    // High score
    highScore: 0
};

// Initialize game on load
document.addEventListener('DOMContentLoaded', init);

function init() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');
    
    loadHighScore();
    setupEventListeners();
    renderTopicGrid();
    resizeCanvas();
    
    window.addEventListener('resize', resizeCanvas);
}

function loadHighScore() {
    game.highScore = parseInt(localStorage.getItem('devops-defender-highscore') || '0');
    document.getElementById('menuHighScore').textContent = game.highScore;
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
    document.addEventListener('keydown', (e) => {
        game.keys[e.key.toLowerCase()] = true;
        
        if (game.running && !game.paused) {
            // Answer selection with number keys
            if (game.questionActive && ['1', '2', '3', '4'].includes(e.key)) {
                selectAnswer(parseInt(e.key) - 1);
            }
            
            // Pause
            if (e.key.toLowerCase() === 'p') {
                togglePause();
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
}

function resizeCanvas() {
    const container = document.getElementById('gameScreen');
    game.canvas.width = window.innerWidth;
    game.canvas.height = window.innerHeight;
}

function renderTopicGrid() {
    const grid = document.getElementById('topicGrid');
    grid.innerHTML = '';
    
    TOPICS.forEach(topic => {
        const card = document.createElement('div');
        card.className = 'topic-card';
        card.style.setProperty('--topic-color', topic.color);
        card.innerHTML = `
            <div class="topic-card-icon">${topic.icon}</div>
            <div class="topic-card-name">${topic.name}</div>
            <div class="topic-card-count">${QUESTIONS[topic.id].length} questions</div>
        `;
        card.onclick = () => startGame('practice', topic.id);
        grid.appendChild(card);
    });
}

// Screen management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

// Start game
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
    
    // Start game loop
    if (game.animationId) cancelAnimationFrame(game.animationId);
    gameLoop();
    
    // Spawn first wave
    setTimeout(() => spawnWave(), 1000);
}

function hideAllOverlays() {
    document.getElementById('pauseMenu').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('levelComplete').classList.add('hidden');
    document.getElementById('questionPanel').classList.add('hidden');
}

// Main game loop
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
    
    // Update enemies
    game.enemies.forEach(enemy => {
        enemy.y += enemy.speed;
        enemy.wobble += 0.05;
        enemy.x += Math.sin(enemy.wobble) * 0.5;
        
        // Check if enemy reached player zone
        if (enemy.y > game.canvas.height - 200 && !enemy.triggered) {
            enemy.triggered = true;
            showQuestion(enemy);
        }
    });
    
    // Update projectiles
    game.projectiles = game.projectiles.filter(p => {
        p.y -= p.speed;
        return p.y > 0;
    });
    
    // Update particles
    game.particles = game.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.vy += 0.1; // gravity
        return p.life > 0;
    });
    
    // Update powerups
    game.powerups = game.powerups.filter(p => {
        p.y += 1;
        
        // Check collision with player
        const dx = p.x - game.player.x;
        const dy = p.y - game.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 40) {
            applyPowerup(p.type);
            return false;
        }
        
        return p.y < game.canvas.height;
    });
    
    // Question timer
    if (game.questionActive && game.questionTimer > 0) {
        game.questionTimer -= 1/60;
        updateTimerDisplay();
        
        if (game.questionTimer <= 0) {
            handleTimeout();
        }
    }
}

function render() {
    const ctx = game.ctx;
    
    // Clear canvas
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    
    // Draw stars
    game.stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + star.size / 3})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw particles
    game.particles.forEach(p => {
        ctx.fillStyle = `rgba(${p.color}, ${p.life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw powerups
    game.powerups.forEach(p => {
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(p.type === 'health' ? '❤️' : '🛡️', p.x, p.y);
    });
    
    // Draw enemies
    game.enemies.forEach(enemy => {
        drawEnemy(enemy);
    });
    
    // Draw projectiles
    game.projectiles.forEach(p => {
        ctx.fillStyle = '#00d4ff';
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
    
    // Draw player
    drawPlayer();
}

function drawPlayer() {
    const ctx = game.ctx;
    const p = game.player;
    
    ctx.save();
    ctx.translate(p.x, p.y);
    
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
    
    ctx.restore();
}

function drawEnemy(enemy) {
    const ctx = game.ctx;
    
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    
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
    
    // Topic icon
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(enemy.icon, 0, 5);
    
    ctx.restore();
}

// Question system
function showQuestion(enemy) {
    const topic = TOPICS[game.currentZone];
    const questions = QUESTIONS[topic.id];
    const question = questions[Math.floor(Math.random() * questions.length)];
    
    game.currentQuestion = { ...question, enemy };
    game.questionActive = true;
    game.questionTimer = CONFIG.QUESTION_TIME;
    game.selectedAnswer = -1;
    
    // Show question panel
    const panel = document.getElementById('questionPanel');
    panel.classList.remove('hidden');
    
    document.getElementById('questionTopic').textContent = topic.name;
    document.getElementById('questionText').textContent = question.q;
    
    const answerGrid = document.getElementById('answerGrid');
    answerGrid.innerHTML = '';
    
    question.a.forEach((answer, i) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.innerHTML = `
            <span class="answer-key">${i + 1}</span>
            <span class="answer-text">${answer}</span>
        `;
        btn.onclick = () => selectAnswer(i);
        answerGrid.appendChild(btn);
    });
}

function selectAnswer(index) {
    if (!game.questionActive || game.selectedAnswer !== -1) return;
    
    game.selectedAnswer = index;
    const btns = document.querySelectorAll('.answer-btn');
    
    btns.forEach((btn, i) => {
        btn.classList.add('disabled');
        if (i === index) btn.classList.add('selected');
    });
    
    // Check answer after short delay
    setTimeout(() => checkAnswer(index), 300);
}

function checkAnswer(index) {
    const correct = index === game.currentQuestion.c;
    const btns = document.querySelectorAll('.answer-btn');
    
    btns[game.currentQuestion.c].classList.add('correct');
    if (!correct) {
        btns[index].classList.add('incorrect');
    }
    
    game.questionsAnswered++;
    
    if (correct) {
        handleCorrectAnswer();
    } else {
        handleWrongAnswer();
    }
    
    // Close question and continue
    setTimeout(() => {
        closeQuestion();
        if (correct) {
            destroyEnemy(game.currentQuestion.enemy);
        }
    }, 1000);
}

function handleCorrectAnswer() {
    game.correctAnswers++;
    game.streak++;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
    
    // Calculate score
    let points = CONFIG.BASE_SCORE;
    
    // Speed bonus
    if (game.questionTimer > CONFIG.QUESTION_TIME - 5) {
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
    
    // Show correct answer
    const btns = document.querySelectorAll('.answer-btn');
    btns[game.currentQuestion.c].classList.add('correct');
    
    takeDamage(CONFIG.DAMAGE_TIMEOUT);
    
    setTimeout(() => {
        closeQuestion();
    }, 1000);
    
    updateHUD();
}

function closeQuestion() {
    game.questionActive = false;
    game.currentQuestion = null;
    document.getElementById('questionPanel').classList.add('hidden');
}

function destroyEnemy(enemy) {
    // Create explosion particles
    for (let i = 0; i < 20; i++) {
        game.particles.push({
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
    game.enemies = game.enemies.filter(e => e !== enemy);
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
    
    // Screen shake effect
    game.canvas.style.animation = 'none';
    game.canvas.offsetHeight; // Trigger reflow
    game.canvas.style.animation = 'shake 0.3s ease';
    
    // Create damage particles
    for (let i = 0; i < 10; i++) {
        game.particles.push({
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

function applyPowerup(type) {
    if (type === 'health') {
        game.player.health = Math.min(game.player.maxHealth, game.player.health + 25);
    } else {
        game.player.shield = Math.min(100, game.player.shield + 50);
    }
    
    // Sparkle effect
    for (let i = 0; i < 15; i++) {
        game.particles.push({
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
        game.particles.push({
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
                wobble: Math.random() * Math.PI * 2
            });
        }, i * 500);
    }
}

function completeWave() {
    game.currentWave++;
    
    if (game.currentWave > CONFIG.WAVES_PER_ZONE && game.mode === 'adventure') {
        completeZone();
    } else {
        // Next wave
        document.getElementById('waveNumber').textContent = game.currentWave;
        setTimeout(() => spawnWave(), 2000);
    }
}

function completeZone() {
    const topic = TOPICS[game.currentZone];
    
    document.getElementById('zoneCompleteIcon').textContent = topic.icon;
    document.getElementById('zoneCompleteName').textContent = topic.name;
    document.getElementById('zoneScore').textContent = game.score;
    document.getElementById('zoneAccuracy').textContent = 
        game.questionsAnswered > 0 
            ? Math.round(game.correctAnswers / game.questionsAnswered * 100) + '%' 
            : '0%';
    
    document.getElementById('levelComplete').classList.remove('hidden');
}

function nextZone() {
    game.currentZone++;
    
    if (game.currentZone >= TOPICS.length) {
        // Game complete!
        gameOver(true);
        return;
    }
    
    game.currentWave = 1;
    document.getElementById('levelComplete').classList.add('hidden');
    updateHUD();
    
    setTimeout(() => spawnWave(), 1000);
}

// HUD updates
function updateHUD() {
    document.getElementById('healthFill').style.width = `${game.player.health}%`;
    document.getElementById('healthText').textContent = Math.round(game.player.health);
    document.getElementById('shieldFill').style.width = `${game.player.shield}%`;
    document.getElementById('scoreValue').textContent = game.score;
    document.getElementById('streakValue').textContent = game.streak;
    document.getElementById('multiplier').textContent = `x${game.multiplier.toFixed(1)}`;
    
    const topic = TOPICS[game.currentZone];
    document.getElementById('levelLabel').textContent = `ZONE ${game.currentZone + 1}`;
    document.getElementById('levelName').textContent = topic.name;
    document.getElementById('waveNumber').textContent = game.currentWave;
}

function updateTimerDisplay() {
    const fill = document.getElementById('timerFill');
    fill.style.width = `${(game.questionTimer / CONFIG.QUESTION_TIME) * 100}%`;
}

// Game state management
function togglePause() {
    game.paused = !game.paused;
    document.getElementById('pauseMenu').classList.toggle('hidden', !game.paused);
}

function resumeGame() {
    game.paused = false;
    document.getElementById('pauseMenu').classList.add('hidden');
}

function restartGame() {
    hideAllOverlays();
    startGame(game.mode, game.mode === 'practice' ? TOPICS[game.currentZone].id : null);
}

function quitToMenu() {
    game.running = false;
    if (game.animationId) {
        cancelAnimationFrame(game.animationId);
    }
    hideAllOverlays();
    showScreen('mainMenu');
    loadHighScore();
}

function gameOver(victory = false) {
    game.running = false;
    
    const isNewHighScore = saveHighScore();
    
    document.getElementById('finalScore').textContent = game.score;
    document.getElementById('questionsAnswered').textContent = game.questionsAnswered;
    document.getElementById('accuracy').textContent = 
        game.questionsAnswered > 0 
            ? Math.round(game.correctAnswers / game.questionsAnswered * 100) + '%' 
            : '0%';
    document.getElementById('bestStreak').textContent = game.bestStreak;
    
    document.getElementById('newHighScore').classList.toggle('hidden', !isNewHighScore);
    
    if (victory) {
        document.querySelector('.game-over-title').textContent = 'VICTORY!';
        document.querySelector('.game-over-title').style.color = '#22c55e';
    } else {
        document.querySelector('.game-over-title').textContent = 'GAME OVER';
        document.querySelector('.game-over-title').style.color = '#ef4444';
    }
    
    document.getElementById('gameOver').classList.remove('hidden');
}

// Add CSS for shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-5px); }
        40%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);
