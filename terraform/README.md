# Terraform Cloudflare DNS Setup

Manages DNS records for tranthachnguyen.com using Infrastructure as Code.

## Quick Start

### 1. Install Terraform
```bash
brew install terraform
```

### 2. Get Cloudflare Credentials

You need 4 values from Cloudflare:

| Value | Where to Find |
|-------|---------------|
| **API Token** | Dashboard → Profile → API Tokens → Create Token (need DNS:Edit) |
| **Zone ID** | Dashboard → tranthachnguyen.com → Overview → right sidebar |
| **Account ID** | Dashboard → Overview → right sidebar |
| **Tunnel ID** | Zero Trust → Tunnels → click your tunnel → copy UUID |

### 3. Create Config File
```bash
cd terraform/
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 4. Initialize & Apply
```bash
# Download providers
terraform init

# Preview changes
terraform plan

# Apply (creates/updates DNS records)
terraform apply
```

## Adding a New App

1. Edit `variables.tf`:
```hcl
variable "apps" {
  default = {
    # ... existing apps ...
    newapp = {
      subdomain   = "newapp"
      description = "My New App"
    }
  }
}
```

2. Apply:
```bash
terraform apply
```

## Common Commands

| Command | Description |
|---------|-------------|
| `terraform plan` | Preview changes |
| `terraform apply` | Apply changes |
| `terraform destroy` | Remove all resources |
| `terraform state list` | List managed resources |
| `terraform import` | Import existing resources |

## Files

| File | Purpose |
|------|---------|
| `main.tf` | Provider configuration |
| `variables.tf` | Input variables |
| `dns.tf` | DNS record definitions |
| `outputs.tf` | Output values |
| `terraform.tfvars` | Your secret values (gitignored) |
