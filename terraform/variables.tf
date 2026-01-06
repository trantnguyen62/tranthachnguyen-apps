# Variables for Terraform Configuration
# ======================================

variable "cloudflare_api_token" {
  description = "Cloudflare API token with DNS edit permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Zone ID for tranthachnguyen.com (found in Cloudflare dashboard)"
  type        = string
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "tunnel_id" {
  description = "Cloudflare Tunnel ID (from existing tunnel)"
  type        = string
}

# App configuration - easy to add new apps
variable "apps" {
  description = "Map of app subdomains to manage"
  type = map(object({
    subdomain   = string
    description = string
  }))
  default = {
    linguaflow = {
      subdomain   = "linguaflow"
      description = "AI Language Learning Partner"
    }
    photoedit = {
      subdomain   = "photoedit"
      description = "NanoEdit AI Photo Editor"
    }
    passportphoto = {
      subdomain   = "passportphoto"
      description = "Passport Photo AI"
    }
    illinoisdriverstudy = {
      subdomain   = "illinoisdriverstudy"
      description = "Illinois Driver Study Guide"
    }
    comicnews = {
      subdomain   = "comicnews"
      description = "Comic News Reader"
    }
    devopsstudy = {
      subdomain   = "devopsstudy"
      description = "DevOps Mastery Study App"
    }
    devopsgame = {
      subdomain   = "devopsgame"
      description = "DevOps Defender Game"
    }
  }
}
