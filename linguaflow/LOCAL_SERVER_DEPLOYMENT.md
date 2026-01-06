# Running LinguaFlow on Your Local Mac with AWS Route 53 Domain

This guide shows you how to run the app on your Mac and make it accessible via your AWS Route 53 domain.

## Overview

Since you want your Mac to be the server, you have two main options:

1. **Cloudflare Tunnel** (Recommended - Free, Easy, Secure)
2. **ngrok** (Popular alternative)
3. **Direct Port Forwarding** (Requires static IP and router configuration)

---

## Option 1: Cloudflare Tunnel (Recommended)

Cloudflare Tunnel creates a secure connection from your Mac to Cloudflare's network without opening ports.

### Step 1: Install Cloudflare Tunnel (cloudflared)

```bash
# Install via Homebrew
brew install cloudflare/cloudflare/cloudflared

# Verify installation
cloudflared --version
```

### Step 2: Authenticate with Cloudflare

```bash
# Login to Cloudflare
cloudflared tunnel login
```

This opens a browser where you'll:
1. Log in to your Cloudflare account
2. Select your domain
3. Authorize the tunnel

### Step 3: Create a Tunnel

```bash
# Create a tunnel named 'linguaflow'
cloudflared tunnel create linguaflow

# Note the Tunnel ID that's displayed (you'll need it)
```

### Step 4: Configure the Tunnel

Create a config file at `~/.cloudflared/config.yml`:

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /Users/YOUR_USERNAME/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: your-domain.com
    service: https://localhost:3000
  - hostname: www.your-domain.com
    service: https://localhost:3000
  - service: http_status:404
```

Replace:
- `YOUR_TUNNEL_ID` with the tunnel ID from step 3
- `YOUR_USERNAME` with your Mac username
- `your-domain.com` with your actual domain

### Step 5: Route DNS to the Tunnel

```bash
# Route your domain to the tunnel
cloudflared tunnel route dns linguaflow your-domain.com
cloudflared tunnel route dns linguaflow www.your-domain.com
```

### Step 6: Transfer Domain to Cloudflare (One-time setup)

Since your domain is in Route 53, you need to point it to Cloudflare nameservers:

1. **Get Cloudflare Nameservers:**
   - Go to https://dash.cloudflare.com
   - Add your domain (free plan is fine)
   - Cloudflare will show you 2 nameservers (e.g., `ns1.cloudflare.com`, `ns2.cloudflare.com`)

2. **Update Route 53:**
   - Go to Route 53 console
   - Select your hosted zone
   - Update the NS records to point to Cloudflare's nameservers
   - Or update at your domain registrar if domain is registered elsewhere

3. **Wait for DNS propagation** (can take up to 48 hours, usually 1-2 hours)

### Step 7: Start Your App

```bash
# In your project directory
npm run dev
```

### Step 8: Start the Tunnel

In a new terminal:

```bash
# Run the tunnel
cloudflared tunnel run linguaflow
```

Or run as a background service:

```bash
# Install as a service
sudo cloudflared service install

# Start the service
sudo launchctl start com.cloudflare.cloudflared
```

### Step 9: Access Your App

Visit `https://your-domain.com` - your local app should now be accessible!

---

## Option 2: ngrok (Alternative)

ngrok is another popular tunneling service.

### Step 1: Install ngrok

```bash
# Install via Homebrew
brew install ngrok/ngrok/ngrok

# Or download from https://ngrok.com/download
```

### Step 2: Sign Up and Get Auth Token

1. Sign up at https://ngrok.com
2. Get your auth token from the dashboard
3. Configure ngrok:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Step 3: Start Your App

```bash
npm run dev
```

### Step 4: Start ngrok Tunnel

```bash
# Create tunnel to port 3000
ngrok http 3000
```

ngrok will display a URL like: `https://abc123.ngrok.io`

### Step 5: Configure Custom Domain (Paid Plan Required)

For custom domains with ngrok, you need a paid plan ($8-20/month):

```bash
ngrok http 3000 --domain=your-domain.com
```

### Step 6: Configure Route 53

Add a CNAME record in Route 53:
- Name: `your-domain.com`
- Type: `CNAME`
- Value: `your-tunnel-id.ngrok.io`

---

## Option 3: Direct Port Forwarding (Advanced)

This requires a static IP and router configuration. **Not recommended** for production.

### Requirements:
- Static public IP address (or dynamic DNS service)
- Router access for port forwarding
- SSL certificate setup

### Steps:

1. **Get Static IP or Use Dynamic DNS**
   - Check with your ISP for static IP
   - Or use services like DuckDNS, No-IP, or Dynu

2. **Configure Router Port Forwarding**
   - Forward port 443 (HTTPS) to your Mac's local IP
   - Forward port 80 (HTTP) to your Mac's local IP

3. **Setup Nginx as Reverse Proxy**

```bash
# Install Nginx
brew install nginx

# Configure Nginx
sudo nano /usr/local/etc/nginx/nginx.conf
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass https://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **Get SSL Certificate**

Use Let's Encrypt with Certbot:

```bash
brew install certbot

# Get certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com
```

5. **Configure Route 53**

Add A record pointing to your public IP:
- Name: `your-domain.com`
- Type: `A`
- Value: `YOUR_PUBLIC_IP`

6. **Start Services**

```bash
# Start Nginx
brew services start nginx

# Start your app
npm run dev
```

---

## Recommended Setup Script (Cloudflare Tunnel)

Create `start-server.sh`:

```bash
#!/bin/bash

echo "🚀 Starting LinguaFlow Server..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local not found"
    echo "Please create .env.local with your GEMINI_API_KEY"
    exit 1
fi

# Start the app in the background
echo "📦 Starting Vite dev server..."
npm run dev &
APP_PID=$!

# Wait for app to start
sleep 3

# Start Cloudflare tunnel
echo "🌐 Starting Cloudflare tunnel..."
cloudflared tunnel run linguaflow &
TUNNEL_PID=$!

echo "✅ Server is running!"
echo "📱 Local: https://localhost:3000"
echo "🌍 Public: https://your-domain.com"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for Ctrl+C
trap "kill $APP_PID $TUNNEL_PID; exit" INT
wait
```

Make it executable:

```bash
chmod +x start-server.sh
```

Run it:

```bash
./start-server.sh
```

---

## Auto-Start on Mac Boot (Optional)

To make your server start automatically when your Mac boots:

### For Cloudflare Tunnel:

```bash
# Install as system service
sudo cloudflared service install

# Start on boot
sudo launchctl load /Library/LaunchDaemons/com.cloudflare.cloudflared.plist
```

### For Your App:

Create `~/Library/LaunchAgents/com.linguaflow.app.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.linguaflow.app</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/npm</string>
        <string>run</string>
        <string>dev</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/trannguyen/Downloads/linguaflow---ai-language-partner</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/linguaflow.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/linguaflow.error.log</string>
</dict>
</plist>
```

Load it:

```bash
launchctl load ~/Library/LaunchAgents/com.linguaflow.app.plist
```

---

## Important Considerations

### ⚠️ Keep Your Mac Running
- Your Mac must be powered on and awake for the server to be accessible
- Consider disabling sleep mode for the display and hard drive
- System Preferences → Energy Saver → Prevent computer from sleeping

### 🔒 Security
- Cloudflare Tunnel is secure (no open ports)
- ngrok is also secure
- Direct port forwarding exposes your network - use with caution

### 📊 Performance
- Your internet upload speed affects response times
- Consider your ISP's bandwidth limits
- Cloudflare provides caching and DDoS protection

### 💰 Cost Comparison
- **Cloudflare Tunnel**: Free
- **ngrok**: Free for random URLs, $8-20/month for custom domains
- **Direct Port Forwarding**: Free (but requires static IP, may cost extra from ISP)

---

## My Recommendation

**Use Cloudflare Tunnel** because:
1. ✅ Completely free
2. ✅ No port forwarding needed
3. ✅ Automatic SSL/HTTPS
4. ✅ DDoS protection
5. ✅ Works with Route 53 domains
6. ✅ Easy to set up
7. ✅ Secure (no exposed ports)

---

## Quick Start Commands

```bash
# 1. Install Cloudflare Tunnel
brew install cloudflare/cloudflare/cloudflared

# 2. Login
cloudflared tunnel login

# 3. Create tunnel
cloudflared tunnel create linguaflow

# 4. Configure DNS
cloudflared tunnel route dns linguaflow your-domain.com

# 5. Start your app
npm run dev

# 6. In another terminal, start tunnel
cloudflared tunnel run linguaflow
```

That's it! Your app will be live at your domain.

---

Let me know if you need help with any of these steps!
