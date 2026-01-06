# Cloudflare DNS Records
# ======================
# All DNS records point to the Cloudflare Tunnel

# Root domain - tranthachnguyen.com
resource "cloudflare_record" "root" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  value   = "${var.tunnel_id}.cfargotunnel.com"
  type    = "CNAME"
  proxied = true
  comment = "Landing page - managed by Terraform"
}

# WWW redirect
resource "cloudflare_record" "www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  value   = "${var.tunnel_id}.cfargotunnel.com"
  type    = "CNAME"
  proxied = true
  comment = "WWW redirect - managed by Terraform"
}

# App subdomains - dynamically created from variables
resource "cloudflare_record" "apps" {
  for_each = var.apps

  zone_id = var.cloudflare_zone_id
  name    = each.value.subdomain
  value   = "${var.tunnel_id}.cfargotunnel.com"
  type    = "CNAME"
  proxied = true
  comment = "${each.value.description} - managed by Terraform"
}
