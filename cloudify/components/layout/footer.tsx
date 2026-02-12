"use client";

import Link from "next/link";
import { Github } from "lucide-react";

const footerLinks = {
  products: [
    { name: "Hosting", href: "/products/deployments" },
    { name: "Functions", href: "/products/functions" },
    { name: "Storage", href: "/products/storage" },
    { name: "Analytics", href: "/products/analytics" },
    { name: "Domains", href: "/domains" },
  ],
  resources: [
    { name: "Documentation", href: "/docs" },
    { name: "Guides", href: "/guides" },
    { name: "Blog", href: "/blog" },
    { name: "Changelog", href: "/changelog" },
    { name: "Status", href: "/status" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Careers", href: "/careers" },
    { name: "Contact", href: "/contact" },
    { name: "Partners", href: "/partners" },
  ],
  legal: [
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
    { name: "Cookies", href: "/cookies" },
  ],
};

function FooterLinkSection({
  title,
  links,
}: {
  title: string;
  links: Array<{ name: string; href: string }>;
}) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold text-[var(--text-primary,theme(colors.foreground))]">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.name}>
            <Link
              href={link.href}
              className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))] hover:text-[var(--text-primary,theme(colors.foreground))] transition-colors"
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[var(--separator,theme(colors.border))] bg-[var(--surface-primary,theme(colors.background))]">
      <div className="mx-auto max-w-[980px] px-4 py-12 sm:px-6 lg:px-8">
        {/* 4 columns */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <FooterLinkSection title="Products" links={footerLinks.products} />
          <FooterLinkSection title="Resources" links={footerLinks.resources} />
          <FooterLinkSection title="Company" links={footerLinks.company} />
          <FooterLinkSection title="Legal" links={footerLinks.legal} />
        </div>

        {/* Bottom section */}
        <div className="mt-12 border-t border-[var(--separator,theme(colors.border))] pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-[11px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))]">
              &copy; {new Date().getFullYear()} Cloudify. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/cloudify"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-tertiary,theme(colors.muted.foreground/70))] hover:text-[var(--text-secondary,theme(colors.muted.foreground))] transition-colors"
              >
                <Github className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </a>
              <a
                href="https://twitter.com/cloudify"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-tertiary,theme(colors.muted.foreground/70))] hover:text-[var(--text-secondary,theme(colors.muted.foreground))] transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span className="sr-only">X (Twitter)</span>
              </a>
              <a
                href="https://discord.gg/cloudify"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-tertiary,theme(colors.muted.foreground/70))] hover:text-[var(--text-secondary,theme(colors.muted.foreground))] transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                </svg>
                <span className="sr-only">Discord</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
