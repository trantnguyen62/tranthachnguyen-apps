// Centralized logging for security events
const LOG_LEVELS = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    SECURITY: 'SECURITY'
};

class Logger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000; // Keep last 1000 logs in memory
    }

    log(level, message, metadata = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...metadata
        };

        // Console output with color coding
        const prefix = `[${logEntry.timestamp}] [${level}]`;
        switch (level) {
            case LOG_LEVELS.ERROR:
            case LOG_LEVELS.SECURITY:
                console.error(prefix, message, metadata);
                break;
            case LOG_LEVELS.WARN:
                console.warn(prefix, message, metadata);
                break;
            default:
                console.log(prefix, message, metadata);
        }

        // Store in memory (circular buffer)
        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
    }

    info(message, metadata) {
        this.log(LOG_LEVELS.INFO, message, metadata);
    }

    warn(message, metadata) {
        this.log(LOG_LEVELS.WARN, message, metadata);
    }

    error(message, metadata) {
        this.log(LOG_LEVELS.ERROR, message, metadata);
    }

    security(message, metadata) {
        this.log(LOG_LEVELS.SECURITY, message, metadata);
    }

    // Get recent security events
    getSecurityLogs(limit = 100) {
        return this.logs
            .filter(log => log.level === LOG_LEVELS.SECURITY)
            .slice(-limit);
    }

    // Get all recent logs
    getRecentLogs(limit = 100) {
        return this.logs.slice(-limit);
    }
}

// Singleton instance
const logger = new Logger();

export default logger;
