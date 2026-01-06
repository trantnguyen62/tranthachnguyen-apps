# LinguaFlow Troubleshooting Guide

## Quick Debugging Checklist

When "Start Conversation" doesn't work, check in this order:

### 1. 🔑 API Quota (MOST COMMON ISSUE)
**Symptoms:** 
- Connection opens then immediately closes
- Server logs show: `code: 1011, reason: 'quota exceeded'`
- Console shows: `Connection opened successfully` then `Connection closed`

**Solution:**
- Check quota at https://aistudio.google.com/ → Settings → API Keys
- Wait for daily quota reset OR add billing

**How to verify:**
```bash
# Check server logs for quota error
tail -f /path/to/logs | grep -i quota
```

---

### 2. 🌐 WebSocket Origin Rejection (403 Error)
**Symptoms:**
- Console shows: `WebSocket error`, `readyState: 3`
- Server logs show: `Connection rejected: invalid origin`

**Solution:**
Edit `server/websocket-proxy.js`, add origin to `ALLOWED_ORIGINS`:
```javascript
const ALLOWED_ORIGINS = [
  'https://linguaflow.tranthachnguyen.com',
  'http://localhost:3000',
  // Add new origins here
];
```

For development, localhost on any port is allowed automatically.

---

### 3. 🔌 Services Not Running
**Required services:**
- Frontend (Vite): Port 3000
- WebSocket Proxy: Port 3001  
- API Server: Port 3002

**Check status:**
```bash
lsof -i :3000 -i :3001 -i :3002 | grep LISTEN
```

**Start services:**
```bash
cd linguaflow
npm run dev -- --host                    # Frontend :3000
node server/websocket-proxy.js           # WebSocket :3001
node server/api-server.js                # API :3002
```

---

### 4. 🔧 Environment Variables
**Required in `.env.local`:**
```
GEMINI_API_KEY=your_api_key_here
VITE_PROXY_URL=ws://localhost:3001
```

**For production (`.env.production`):**
```
VITE_PROXY_URL=/ws
```

---

### 5. 🎤 Microphone Access
**Symptoms:**
- Error: "Microphone access denied"
- No audio input visualization

**Solution:**
- Use HTTPS or localhost (required for mic access)
- Check browser permissions
- Try a different browser

---

## Server Log Locations

Check WebSocket proxy output for detailed error messages:
```bash
node server/websocket-proxy.js 2>&1 | tee ws-proxy.log
```

## Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 1011 | Server Error | Usually **quota exceeded** - check billing |
| 1006 | Abnormal Close | Network issue - check connectivity |
| 1008 | Policy Violation | Check API key permissions |
| 403 | Forbidden | Origin not allowed - update ALLOWED_ORIGINS |

## Testing Connectivity

```bash
# Test WebSocket server directly
node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3001', { headers: { 'Origin': 'http://localhost:3000' }});
ws.on('open', () => { console.log('✓ WebSocket OK'); ws.close(); });
ws.on('error', (e) => console.log('✗ Error:', e.message));
"

# Test Gemini API key
curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"
```
