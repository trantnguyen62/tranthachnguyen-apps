/**
 * Centralised security-aware logger shared by the WebSocket proxy and API server.
 *
 * Writes timestamped entries to stdout/stderr with four levels:
 *   INFO, WARN, ERROR, SECURITY
 *
 * Entries are also kept in an in-memory circular buffer (last 1 000 entries) so
 * that recent logs can be inspected at runtime without reading disk files.
 * A singleton instance is exported; import it as `import logger from './logger.js'`.
 */
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

    /**
     * Core log method. Writes to console and appends to the in-memory buffer.
     * @param {string} level    - One of the LOG_LEVELS values.
     * @param {string} message  - Human-readable log message.
     * @param {object} metadata - Optional structured context (e.g. ip, userId).
     */
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

    /** Returns the most recent `limit` SECURITY-level log entries. */
    getSecurityLogs(limit = 100) {
        return this.logs
            .filter(log => log.level === LOG_LEVELS.SECURITY)
            .slice(-limit);
    }

    /** Returns the most recent `limit` log entries across all levels. */
    getRecentLogs(limit = 100) {
        return this.logs.slice(-limit);
    }
}

// Singleton instance
const logger = new Logger();

export default logger;
