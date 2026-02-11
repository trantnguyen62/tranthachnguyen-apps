"use client";

import Link from "next/link";
import { Cloud, Github, Twitter, Linkedin, Youtube, ArrowUpRight } from "lucide-react";

const footerLinks = {
  products: [
    { name: "Deployments", href: "/products/deployments" },
    { name: "Edge Network", href: "/products/edge-network" },
    { name: "Serverless Functions", href: "/products/functions" },
    { name: "AI SDK", href: "/products/ai" },
    { name: "Analytics", href: "/products/analytics" },
    { name: "Storage", href: "/products/storage" },
  ],
  resources: [
    { name: "Documentation", href: "/docs" },
    { name: "Guides", href: "/guides" },
    { name: "Templates", href: "/templates" },
    { name: "Changelog", href: "/changelog" },
    { name: "Support", href: "/support" },
    { name: "Status", href: "/status", external: true },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Careers", href: "/careers" },
    { name: "Contact", href: "/contact" },
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
  ],
  solutions: [
    { name: "Enterprise", href: "/solutions/enterprise" },
    { name: "AI Apps", href: "/solutions/ai-apps" },
    { name: "Web Apps", href: "/solutions/web-apps" },
    { name: "E-commerce", href: "/solutions/ecommerce" },
    { name: "Platforms", href: "/solutions/platforms" },
  ],
};

const socialLinks = [
  { name: "GitHub", href: "https://github.com/cloudify", icon: Github },
  { name: "Twitter", href: "https://twitter.com/cloudify", icon: Twitter },
  { name: "LinkedIn", href: "https://linkedin.com/company/cloudify", icon: Linkedin },
  { name: "YouTube", href: "https://youtube.com/@cloudify", icon: Youtube },
];

function FooterLinkSection({
  title,
  links,
}: {
  title: string;
  links: Array<{ name: string; href: string; external?: boolean }>;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">
        {title}
      </h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.name}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.name}
                <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 transition-all group-hover:opacity-100 group-hover:translate-y-0" />
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.name}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      {/* Status bar */}
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            All systems operational
          </div>
          <Link
            href="/status"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Status page
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Logo and description */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
                <Cloud className="h-4 w-4 text-background" />
              </div>
              <span className="text-sm font-semibold text-foreground">
                Cloudify
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The platform for deploying and scaling modern web applications.
              Built for developers, trusted by enterprises.
            </p>
            {/* Social Links */}
            <div className="mt-6 flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <social.icon className="h-4 w-4" />
                  <span className="sr-only">{social.name}</span>
                </a>
              ))}
            </div>
          </div>

          <FooterLinkSection title="Products" links={footerLinks.products} />
          <FooterLinkSection title="Resources" links={footerLinks.resources} />
          <FooterLinkSection title="Company" links={footerLinks.company} />
          <FooterLinkSection title="Solutions" links={footerLinks.solutions} />
        </div>

        {/* Bottom section */}
        <div className="mt-12 border-t border-border pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Cloudify. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
