# Terraform Configuration for tranthachnguyen.com
# =============================================
# This manages Cloudflare DNS records for all apps

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
  
  # Optional: Store state remotely (uncomment for team use)
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "tranthachnguyen/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
