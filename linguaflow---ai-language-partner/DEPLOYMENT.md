# AWS Deployment Guide for LinguaFlow

This guide covers deploying your React + Vite application to AWS with a custom domain.

## Prerequisites

- AWS Account
- AWS CLI installed and configured
- Node.js installed locally
- Your domain (registered in AWS Route 53 or elsewhere)

---

## Option 1: AWS Amplify (Recommended - Easiest)

AWS Amplify provides automated builds, deployments, and hosting with built-in CI/CD.

### Step 1: Push Code to Git Repository

If not already done, push your code to GitHub, GitLab, or Bitbucket:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 2: Deploy with AWS Amplify

1. **Go to AWS Amplify Console**
   - Navigate to https://console.aws.amazon.com/amplify/
   - Click "New app" → "Host web app"

2. **Connect Repository**
   - Select your Git provider (GitHub/GitLab/Bitbucket)
   - Authorize AWS Amplify
   - Select your repository and branch

3. **Configure Build Settings**
   
   Amplify should auto-detect Vite. Verify the build settings:
   
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

4. **Add Environment Variables**
   - In Amplify Console → App settings → Environment variables
   - Add: `GEMINI_API_KEY` = `your-api-key-here`

5. **Deploy**
   - Click "Save and deploy"
   - Wait for build to complete (~2-5 minutes)

### Step 3: Configure Custom Domain

1. **In Amplify Console → Domain management**
   - Click "Add domain"
   - Enter your domain name
   
2. **If domain is in Route 53:**
   - Amplify will automatically configure DNS records
   - SSL certificate will be provisioned automatically
   
3. **If domain is external:**
   - Amplify will provide DNS records (CNAME/ANAME)
   - Add these records to your domain registrar
   - SSL certificate will be provisioned automatically

4. **Wait for DNS propagation** (can take up to 48 hours, usually much faster)

---

## Option 2: AWS S3 + CloudFront (More Control)

This option gives you more control and is cost-effective for static sites.

### Step 1: Build the Application

```bash
npm install
npm run build
```

This creates a `dist/` folder with your production build.

### Step 2: Create S3 Bucket

```bash
# Replace 'your-domain.com' with your actual domain
aws s3 mb s3://your-domain.com

# Enable static website hosting
aws s3 website s3://your-domain.com --index-document index.html --error-document index.html
```

### Step 3: Configure Bucket Policy

Create a file `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-domain.com/*"
    }
  ]
}
```

Apply the policy:

```bash
aws s3api put-bucket-policy --bucket your-domain.com --policy file://bucket-policy.json
```

### Step 4: Upload Files

```bash
aws s3 sync dist/ s3://your-domain.com --delete
```

### Step 5: Create CloudFront Distribution

1. **Go to CloudFront Console**
   - https://console.aws.amazon.com/cloudfront/

2. **Create Distribution**
   - Origin Domain: Select your S3 bucket
   - Origin Path: Leave empty
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Allowed HTTP Methods: GET, HEAD, OPTIONS
   - Compress Objects Automatically: Yes
   - Alternate Domain Names (CNAMEs): your-domain.com, www.your-domain.com
   
3. **Request SSL Certificate**
   - Click "Request certificate" (opens AWS Certificate Manager)
   - Add domain names: your-domain.com and www.your-domain.com
   - Choose DNS validation
   - Add CNAME records to your DNS (Route 53 or external)
   - Wait for validation (5-30 minutes)
   - Select the certificate in CloudFront

4. **Configure Error Pages**
   - Error Pages tab → Create Custom Error Response
   - HTTP Error Code: 403
   - Customize Error Response: Yes
   - Response Page Path: /index.html
   - HTTP Response Code: 200
   - Repeat for 404 error

5. **Create Distribution** (takes 10-20 minutes)

### Step 6: Configure DNS

**If using Route 53:**

```bash
# Get CloudFront distribution domain name (e.g., d111111abcdef8.cloudfront.net)
# Then create Route 53 records:

# For root domain
aws route53 change-resource-record-sets --hosted-zone-id YOUR_ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "your-domain.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z2FDTNDATAQYW2",
        "DNSName": "d111111abcdef8.cloudfront.net",
        "EvaluateTargetHealth": false
      }
    }
  }]
}'

# For www subdomain
aws route53 change-resource-record-sets --hosted-zone-id YOUR_ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "www.your-domain.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z2FDTNDATAQYW2",
        "DNSName": "d111111abcdef8.cloudfront.net",
        "EvaluateTargetHealth": false
      }
    }
  }]
}'
```

**If using external DNS provider:**
- Add CNAME record: `www` → `d111111abcdef8.cloudfront.net`
- Add ALIAS or ANAME record: `@` → `d111111abcdef8.cloudfront.net`

---

## Option 3: AWS EC2 (Full Server Control)

For running the app on a server with Node.js.

### Step 1: Launch EC2 Instance

1. Go to EC2 Console
2. Launch Instance:
   - AMI: Amazon Linux 2023 or Ubuntu 22.04
   - Instance Type: t2.micro (free tier) or t3.small
   - Security Group: Allow HTTP (80), HTTPS (443), SSH (22)
   - Create/select key pair for SSH access

### Step 2: Connect and Setup

```bash
# Connect to instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Update system
sudo yum update -y  # Amazon Linux
# or
sudo apt update && sudo apt upgrade -y  # Ubuntu

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs  # Amazon Linux
# or
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs  # Ubuntu

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx
sudo yum install -y nginx  # Amazon Linux
# or
sudo apt install -y nginx  # Ubuntu
```

### Step 3: Deploy Application

```bash
# Clone or upload your code
git clone <your-repo-url> /home/ec2-user/linguaflow
cd /home/ec2-user/linguaflow

# Install dependencies
npm install

# Create .env.local file
echo "GEMINI_API_KEY=your-api-key-here" > .env.local

# Build the app
npm run build

# Serve with a simple HTTP server
sudo npm install -g serve
pm2 start "serve -s dist -l 3000" --name linguaflow
pm2 save
pm2 startup
```

### Step 4: Configure Nginx

Create `/etc/nginx/conf.d/linguaflow.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 5: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx  # Amazon Linux
# or
sudo apt install -y certbot python3-certbot-nginx  # Ubuntu

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is configured automatically
```

### Step 6: Configure DNS

Point your domain's A record to your EC2 instance's Elastic IP:
- Create Elastic IP in AWS Console
- Associate with your EC2 instance
- Add A record in your DNS: `your-domain.com` → `Elastic IP`

---

## Continuous Deployment Scripts

### For S3 + CloudFront

Create `deploy.sh`:

```bash
#!/bin/bash

# Build the app
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-domain.com --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

echo "Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

Run deployment:
```bash
./deploy.sh
```

---

## Environment Variables

Remember to set your `GEMINI_API_KEY` in:
- **Amplify**: App settings → Environment variables
- **S3/CloudFront**: Build locally with env vars, or use Lambda@Edge
- **EC2**: `.env.local` file on the server

---

## Cost Estimates

- **Amplify**: ~$0.01 per build minute + ~$0.15/GB served (~$5-20/month for small apps)
- **S3 + CloudFront**: ~$0.50-5/month for low traffic
- **EC2 t2.micro**: Free tier eligible, then ~$8-10/month

---

## Troubleshooting

### Blank page after deployment
- Check browser console for errors
- Verify `GEMINI_API_KEY` is set correctly
- Check build output in `dist/` folder

### 404 errors on refresh
- Ensure error pages redirect to `index.html` (for SPA routing)
- CloudFront: Configure custom error responses
- S3: Set error document to `index.html`
- Nginx: Configure try_files directive

### SSL certificate issues
- Wait for DNS propagation (up to 48 hours)
- Verify DNS records are correct
- Check certificate status in AWS Certificate Manager

---

## Recommended Approach

**For your use case, I recommend AWS Amplify** because:
1. ✅ Easiest setup and deployment
2. ✅ Automatic SSL certificates
3. ✅ Built-in CI/CD from Git
4. ✅ Automatic builds on code push
5. ✅ Easy custom domain configuration
6. ✅ Good for React/Vite apps

Let me know which option you'd like to proceed with, and I can provide more specific guidance!
