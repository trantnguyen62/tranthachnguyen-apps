# Terraform Outputs
# =================

output "dns_records" {
  description = "All DNS records created"
  value = {
    root = cloudflare_record.root.hostname
    www  = cloudflare_record.www.hostname
    apps = { for k, v in cloudflare_record.apps : k => v.hostname }
  }
}

output "app_urls" {
  description = "Full URLs for all apps"
  value = {
    landing     = "https://tranthachnguyen.com"
    linguaflow  = "https://linguaflow.tranthachnguyen.com"
    photoedit   = "https://photoedit.tranthachnguyen.com"
    passportphoto = "https://passportphoto.tranthachnguyen.com"
    illinoisdriver = "https://illinoisdriverstudy.tranthachnguyen.com"
    comicnews   = "https://comicnews.tranthachnguyen.com"
    devopsstudy = "https://devopsstudy.tranthachnguyen.com"
    devopsgame  = "https://devopsgame.tranthachnguyen.com"
  }
}
