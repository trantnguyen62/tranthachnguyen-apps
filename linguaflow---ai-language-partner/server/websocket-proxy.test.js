// Security tests for WebSocket proxy server
import WebSocket from 'ws';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { spawn } from 'child_process';

const PROXY_URL = 'ws://localhost:3001';
const VALID_ORIGIN = 'https://linguaflow.tranthachnguyen.com';
const INVALID_ORIGIN = 'https://malicious-site.com';

let serverProcess;

function startServer(rateLimit, done) {
    console.log(`Starting WebSocket proxy with rate limit ${rateLimit}...`);
    serverProcess = spawn('node', ['server/websocket-proxy.js'], {
        stdio: 'inherit',
        env: {
            ...process.env,
            PORT: '3001',
            RATE_LIMIT_MAX_CONNECTIONS: rateLimit.toString()
        }
    });
    // Give it a moment to start
    setTimeout(done, 2000);
}

function stopServer(done) {
    if (serverProcess) {
        console.log('Stopping WebSocket proxy...');
        serverProcess.kill();
        serverProcess = null;
        // Give it a moment to release the port
        setTimeout(done, 1000);
    } else {
        done();
    }
}

describe('WebSocket Proxy Security Tests', () => {

    describe('General Security (High Rate Limit)', () => {
        beforeAll((done) => startServer(100, done));
        afterAll((done) => stopServer(done));

        // Test 1: Origin Validation
        describe('Origin Validation', () => {
            test('should reject connections from unauthorized origins', (done) => {
                const ws = new WebSocket(PROXY_URL, {
                    headers: {
                        'Origin': INVALID_ORIGIN
                    }
                });

                ws.on('error', (error) => {
                    expect(error.message).toContain('403');
                    done();
                });

                ws.on('open', () => {
                    ws.close();
                    done(new Error('Connection should have been rejected'));
                });
            });

            test('should accept connections from authorized origins', (done) => {
                const ws = new WebSocket(PROXY_URL, {
                    headers: {
                        'Origin': VALID_ORIGIN
                    }
                });

                ws.on('open', () => {
                    ws.close();
                    done();
                });

                ws.on('error', (error) => {
                    done(error);
                });
            });
        });

        // Test 3: Input Validation
        describe('Input Validation', () => {
            test('should reject invalid message types', (done) => {
                const ws = new WebSocket(PROXY_URL, {
                    headers: { 'Origin': VALID_ORIGIN }
                });

                ws.on('open', () => {
                    ws.send(JSON.stringify({ type: 'invalid_type' }));
                });

                ws.on('message', (data) => {
                    const response = JSON.parse(data.toString());
                    if (response.type === 'error') {
                        expect(response.error).toBeTruthy();
                        ws.close();
                        done();
                    }
                });

                ws.on('error', (error) => {
                    done(error);
                });
            });

            test('should reject malformed JSON', (done) => {
                const ws = new WebSocket(PROXY_URL, {
                    headers: { 'Origin': VALID_ORIGIN }
                });

                ws.on('open', () => {
                    ws.send('not valid json');
                });

                ws.on('message', (data) => {
                    const response = JSON.parse(data.toString());
                    if (response.type === 'error') {
                        expect(response.error).toBeTruthy();
                        ws.close();
                        done();
                    }
                });

                ws.on('error', (error) => {
                    done(error);
                });
            });

            test('should reject connect message without config', (done) => {
                const ws = new WebSocket(PROXY_URL, {
                    headers: { 'Origin': VALID_ORIGIN }
                });

                ws.on('open', () => {
                    ws.send(JSON.stringify({ type: 'connect' }));
                });

                ws.on('message', (data) => {
                    const response = JSON.parse(data.toString());
                    if (response.type === 'error') {
                        expect(response.error).toBeTruthy();
                        ws.close();
                        done();
                    }
                });

                ws.on('error', (error) => {
                    done(error);
                });
            });
        });

        // Test 4: Message Size Limit
        describe('Message Size Limit', () => {
            test('should reject messages larger than 1MB', (done) => {
                const ws = new WebSocket(PROXY_URL, {
                    headers: { 'Origin': VALID_ORIGIN }
                });

                ws.on('open', () => {
                    // Create a message larger than 1MB
                    const largeMessage = JSON.stringify({
                        type: 'connect',
                        config: {
                            data: 'x'.repeat(2 * 1024 * 1024) // 2MB of data
                        }
                    });
                    ws.send(largeMessage);
                });

                ws.on('message', (data) => {
                    const response = JSON.parse(data.toString());
                    if (response.type === 'error') {
                        expect(response.error).toBeTruthy();
                        ws.close();
                        done();
                    }
                });

                ws.on('error', (error) => {
                    done(error);
                });
            });
        });

        // Test 5: Error Message Sanitization
        describe('Error Message Sanitization', () => {
            test('should not expose internal error details', (done) => {
                const ws = new WebSocket(PROXY_URL, {
                    headers: { 'Origin': VALID_ORIGIN }
                });

                ws.on('open', () => {
                    ws.send(JSON.stringify({ type: 'invalid' }));
                });

                ws.on('message', (data) => {
                    const response = JSON.parse(data.toString());
                    if (response.type === 'error') {
                        // Error message should be generic, not expose internals
                        expect(response.error).not.toContain('stack');
                        expect(response.error).not.toContain('API key');
                        expect(response.error).not.toContain('GEMINI_API_KEY');
                        ws.close();
                        done();
                    }
                });

                ws.on('error', (error) => {
                    done(error);
                });
            });
        });
    });

    describe('Rate Limiting (Low Rate Limit)', () => {
        beforeAll((done) => startServer(5, done));
        afterAll((done) => stopServer(done));

        // Test 2: Rate Limiting
        describe('Rate Limiting', () => {
            test('should reject 6th connection within 1 minute from same IP', async () => {
                const connections = [];
                let rejectedCount = 0;

                // Attempt 6 rapid connections
                for (let i = 0; i < 6; i++) {
                    try {
                        const ws = new WebSocket(PROXY_URL, {
                            headers: { 'Origin': VALID_ORIGIN }
                        });

                        await new Promise((resolve, reject) => {
                            ws.on('open', () => {
                                connections.push(ws);
                                resolve(true);
                            });
                            ws.on('error', (error) => {
                                if (error.message.includes('429')) {
                                    rejectedCount++;
                                }
                                resolve(false);
                            });
                        });
                    } catch (error) {
                        rejectedCount++;
                    }
                }

                // Clean up connections
                connections.forEach(ws => ws.close());

                // Should have rejected at least one connection
                expect(rejectedCount).toBeGreaterThan(0);
            });
        });
    });
});
