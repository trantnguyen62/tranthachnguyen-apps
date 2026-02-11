"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Search,
  ExternalLink,
  Github,
  Star,
  GitFork,
  Filter,
  ChevronDown,
  Zap,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const templates = [
  {
    id: "nextjs-commerce",
    name: "Next.js Commerce",
    description: "High-performance, server-rendered ecommerce storefront powered by Next.js",
    framework: "Next.js",
    category: "E-commerce",
    demo: "commerce.cloudify.app",
    repo: "cloudify/commerce",
    stars: 8420,
    forks: 1890,
    image: "https://via.placeholder.com/400x225/000000/FFFFFF?text=Commerce",
    gradient: "from-black to-gray-800",
    featured: true,
  },
  {
    id: "nextjs-blog",
    name: "Next.js Blog Starter",
    description: "Statically generated blog using Next.js, Markdown, and Tailwind CSS",
    framework: "Next.js",
    category: "Blog",
    demo: "blog-starter.cloudify.app",
    repo: "cloudify/blog-starter",
    stars: 4210,
    forks: 980,
    image: "https://via.placeholder.com/400x225/1a1a2e/FFFFFF?text=Blog",
    gradient: "from-indigo-600 to-purple-600",
    featured: true,
  },
  {
    id: "nextjs-saas",
    name: "SaaS Starter Kit",
    description: "Complete SaaS starter with auth, billing, dashboard, and more",
    framework: "Next.js",
    category: "SaaS",
    demo: "saas-starter.cloudify.app",
    repo: "cloudify/saas-starter",
    stars: 6890,
    forks: 1450,
    image: "https://via.placeholder.com/400x225/0f172a/FFFFFF?text=SaaS",
    gradient: "from-blue-600 to-cyan-500",
    featured: true,
  },
  {
    id: "react-dashboard",
    name: "React Admin Dashboard",
    description: "Modern admin dashboard with charts, tables, and authentication",
    framework: "React",
    category: "Dashboard",
    demo: "dashboard.cloudify.app",
    repo: "cloudify/react-dashboard",
    stars: 3420,
    forks: 780,
    image: "https://via.placeholder.com/400x225/1e3a5f/FFFFFF?text=Dashboard",
    gradient: "from-cyan-500 to-blue-500",
    featured: false,
  },
  {
    id: "astro-portfolio",
    name: "Astro Portfolio",
    description: "Beautiful portfolio template built with Astro and Tailwind",
    framework: "Astro",
    category: "Portfolio",
    demo: "portfolio.cloudify.app",
    repo: "cloudify/astro-portfolio",
    stars: 2180,
    forks: 540,
    image: "https://via.placeholder.com/400x225/7c3aed/FFFFFF?text=Portfolio",
    gradient: "from-purple-500 to-pink-500",
    featured: false,
  },
  {
    id: "vue-storefront",
    name: "Vue Storefront",
    description: "Headless commerce frontend built with Vue.js and Nuxt",
    framework: "Vue",
    category: "E-commerce",
    demo: "vue-store.cloudify.app",
    repo: "cloudify/vue-storefront",
    stars: 1890,
    forks: 420,
    image: "https://via.placeholder.com/400x225/42b883/FFFFFF?text=Vue+Store",
    gradient: "from-green-500 to-emerald-500",
    featured: false,
  },
  {
    id: "svelte-app",
    name: "SvelteKit App",
    description: "Full-featured SvelteKit application with authentication",
    framework: "Svelte",
    category: "Web App",
    demo: "svelte-app.cloudify.app",
    repo: "cloudify/sveltekit-app",
    stars: 1560,
    forks: 320,
    image: "https://via.placeholder.com/400x225/ff3e00/FFFFFF?text=Svelte",
    gradient: "from-orange-500 to-red-500",
    featured: false,
  },
  {
    id: "ai-chatbot",
    name: "AI Chatbot",
    description: "GPT-powered chatbot with streaming responses and conversation history",
    framework: "Next.js",
    category: "AI",
    demo: "ai-chat.cloudify.app",
    repo: "cloudify/ai-chatbot",
    stars: 5670,
    forks: 1230,
    image: "https://via.placeholder.com/400x225/6366f1/FFFFFF?text=AI+Chat",
    gradient: "from-indigo-500 to-violet-500",
    featured: true,
  },
  {
    id: "docs-site",
    name: "Documentation Site",
    description: "Modern documentation site with search, dark mode, and MDX",
    framework: "Next.js",
    category: "Documentation",
    demo: "docs-template.cloudify.app",
    repo: "cloudify/docs-template",
    stars: 2340,
    forks: 560,
    image: "https://via.placeholder.com/400x225/374151/FFFFFF?text=Docs",
    gradient: "from-gray-600 to-gray-800",
    featured: false,
  },
];

const frameworks = ["All", "Next.js", "React", "Vue", "Svelte", "Astro", "Nuxt"];
const categories = ["All", "E-commerce", "Blog", "SaaS", "Dashboard", "Portfolio", "AI", "Documentation", "Web App"];

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFramework, setSelectedFramework] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFramework =
      selectedFramework === "All" || template.framework === selectedFramework;
    const matchesCategory =
      selectedCategory === "All" || template.category === selectedCategory;
    return matchesSearch && matchesFramework && matchesCategory;
  });

  const featuredTemplates = filteredTemplates.filter((t) => t.featured);
  const otherTemplates = filteredTemplates.filter((t) => !t.featured);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
                Start with a Template
              </h1>
              <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
                Deploy production-ready applications in seconds. Choose from our
                collection of templates built by the community.
              </p>
            </motion.div>

            {/* Search and Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-12 gap-2">
                    <Filter className="h-4 w-4" />
                    {selectedFramework}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {frameworks.map((framework) => (
                    <DropdownMenuItem
                      key={framework}
                      onClick={() => setSelectedFramework(framework)}
                    >
                      {framework}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-12 gap-2">
                    {selectedCategory}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          </div>
        </section>

        {/* Featured Templates */}
        {featuredTemplates.length > 0 && (
          <section className="py-12">
            <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-foreground mb-8">
                Featured Templates
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {featuredTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative rounded-lg border border-border overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    {/* Preview */}
                    <div
                      className={cn(
                        "aspect-video bg-gradient-to-br flex items-center justify-center relative",
                        template.gradient
                      )}
                    >
                      <span className="text-white text-4xl font-bold opacity-20">
                        {template.framework}
                      </span>
                      <Badge className="absolute top-4 left-4 bg-yellow-500 text-black">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Featured
                      </Badge>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">
                            {template.name}
                          </h3>
                          <Badge variant="secondary" className="mt-1">
                            {template.framework}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            {template.stars.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitFork className="h-4 w-4" />
                            {template.forks.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-4">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-3">
                        <Button variant="default" asChild>
                          <Link href={`/new?template=${template.id}`}>
                            <Zap className="h-4 w-4" />
                            Deploy
                          </Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <a
                            href={`https://${template.demo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Demo
                          </a>
                        </Button>
                        <Button variant="ghost" asChild>
                          <a
                            href={`https://github.com/${template.repo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Github className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Templates */}
        <section className="py-12 bg-background">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              All Templates
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div
                    className={cn(
                      "aspect-video bg-gradient-to-br flex items-center justify-center",
                      template.gradient
                    )}
                  >
                    <span className="text-white text-3xl font-bold opacity-20">
                      {template.framework}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground">
                        {template.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {template.stars.toLocaleString()}
                        </span>
                      </div>
                      <Button size="sm" asChild>
                        <Link href={`/new?template=${template.id}`}>
                          Deploy
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
