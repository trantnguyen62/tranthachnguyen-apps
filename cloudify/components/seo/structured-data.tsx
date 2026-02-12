/**
 * Structured Data (JSON-LD) component for SEO.
 * Renders schema.org structured data for search engine optimization.
 */

interface FAQItem {
  question: string;
  answer: string;
}

interface StructuredDataProps {
  type: "software" | "organization" | "faq";
  faqItems?: FAQItem[];
}

function getSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Cloudify",
    description:
      "Self-hosted deployment platform for modern web applications. A Vercel alternative with Git-based deployments, serverless functions, and edge network.",
    url: "https://cloudify.tranthachnguyen.com",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Linux, Docker",
    offers: [
      {
        "@type": "Offer",
        name: "Hobby",
        price: "0",
        priceCurrency: "USD",
        description: "Free plan for personal projects and experiments",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "20",
        priceCurrency: "USD",
        description: "For professionals and growing teams",
      },
    ],
    featureList: [
      "Git-based deployments",
      "Serverless functions",
      "Edge network",
      "Preview deployments",
      "Custom domains with SSL",
      "Environment variable management",
      "Real-time build logs",
      "Team collaboration",
      "Docker & Kubernetes builds",
      "Self-hosted option",
    ],
    screenshot:
      "https://cloudify.tranthachnguyen.com/api/og?title=Cloudify&description=The+Cloud+Platform+for+Developers",
    softwareVersion: "2.4.0",
    datePublished: "2024-01-30",
    author: {
      "@type": "Organization",
      name: "Cloudify",
      url: "https://cloudify.tranthachnguyen.com",
    },
  };
}

function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Cloudify",
    url: "https://cloudify.tranthachnguyen.com",
    logo: "https://cloudify.tranthachnguyen.com/favicon.ico",
    description:
      "Building the future of web deployment. Cloudify is a self-hosted cloud platform that makes deploying web applications as easy as pushing code to Git.",
    foundingDate: "2019",
    sameAs: ["https://github.com/cloudify"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: "https://cloudify.tranthachnguyen.com/support",
    },
  };
}

function getFAQSchema(items: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function StructuredData({ type, faqItems }: StructuredDataProps) {
  let schema;

  switch (type) {
    case "software":
      schema = getSoftwareApplicationSchema();
      break;
    case "organization":
      schema = getOrganizationSchema();
      break;
    case "faq":
      schema = getFAQSchema(faqItems || []);
      break;
    default:
      return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
