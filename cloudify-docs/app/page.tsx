import Link from "next/link";
import {
  Rocket,
  Code2,
  Database,
  BarChart3,
  Zap,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: Rocket,
    title: "Instant Deployments",
    description: "Deploy your applications in seconds with automatic builds and preview URLs.",
    href: "/deployments",
  },
  {
    icon: Code2,
    title: "Edge Functions",
    description: "Run serverless functions at the edge for low-latency responses worldwide.",
    href: "/functions",
  },
  {
    icon: Database,
    title: "Storage Solutions",
    description: "Blob storage and KV store for all your data persistence needs.",
    href: "/storage",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Track Web Vitals and visitor analytics to optimize performance.",
    href: "/analytics",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized infrastructure for the fastest possible load times.",
    href: "/monitoring",
  },
  {
    icon: Globe,
    title: "Custom Domains",
    description: "Connect your own domains with automatic SSL certificates.",
    href: "/deployments/domains",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome to Cloudify
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          The modern deployment platform for frontend applications. Deploy, scale,
          and monitor your projects with ease.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link
            href="/getting-started/quick-start"
            className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/api-reference"
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            API Reference
          </Link>
        </div>
      </div>

      {/* Features grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link
              key={feature.title}
              href={feature.href}
              className="block p-6 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all group"
            >
              <Icon className="w-8 h-8 text-primary-600 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="border-t border-gray-200 pt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Popular Topics
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/getting-started/first-deployment"
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="text-2xl">🚀</span>
            <div>
              <p className="font-medium text-gray-900">Deploy your first project</p>
              <p className="text-sm text-gray-600">
                Step-by-step guide to deploying your application
              </p>
            </div>
          </Link>
          <Link
            href="/guides/nextjs"
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="text-2xl">⚡</span>
            <div>
              <p className="font-medium text-gray-900">Deploy Next.js</p>
              <p className="text-sm text-gray-600">
                Optimized setup for Next.js applications
              </p>
            </div>
          </Link>
          <Link
            href="/functions/writing-functions"
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="text-2xl">⚙️</span>
            <div>
              <p className="font-medium text-gray-900">Write Edge Functions</p>
              <p className="text-sm text-gray-600">
                Create serverless functions for your backend
              </p>
            </div>
          </Link>
          <Link
            href="/analytics/web-vitals"
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="text-2xl">📊</span>
            <div>
              <p className="font-medium text-gray-900">Track Web Vitals</p>
              <p className="text-sm text-gray-600">
                Monitor LCP, FID, CLS, and more metrics
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
