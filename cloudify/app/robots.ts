import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/pricing",
          "/changelog",
          "/blog",
          "/docs",
          "/guides",
          "/templates",
          "/products",
          "/solutions",
          "/careers",
          "/contact",
          "/support",
          "/partners",
          "/status",
          "/resources",
        ],
        disallow: [
          "/dashboard",
          "/dashboard/*",
          "/api",
          "/api/*",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/onboarding",
          "/onboarding/*",
          "/settings",
          "/settings/*",
          "/new",
          "/new/*",
          "/import",
          "/import/*",
          "/invitations",
          "/invitations/*",
        ],
      },
    ],
    sitemap: "https://cloudify.tranthachnguyen.com/sitemap.xml",
  };
}
