"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Clock, User, Tag } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const categories = ["All", "Engineering", "Product", "Company", "Tutorials"];

const posts = [
  {
    id: 1,
    title: "Introducing Cloudify v2.0: A New Era of Deployment",
    excerpt: "We're excited to announce Cloudify v2.0, our biggest release yet. Featuring a completely redesigned dashboard, 50% faster builds, and new AI-powered features.",
    category: "Product",
    author: "Sarah Chen",
    date: "January 25, 2024",
    readTime: "5 min read",
    featured: true,
    gradient: "from-blue-600 to-purple-600",
  },
  {
    id: 2,
    title: "How We Reduced Build Times by 50%",
    excerpt: "A deep dive into the engineering work behind our new build system. Learn about incremental builds, smart caching, and parallelization.",
    category: "Engineering",
    author: "Marcus Johnson",
    date: "January 20, 2024",
    readTime: "8 min read",
    featured: true,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    id: 3,
    title: "Getting Started with Edge Functions",
    excerpt: "Learn how to deploy serverless functions at the edge for ultra-low latency. This tutorial covers everything from basics to advanced patterns.",
    category: "Tutorials",
    author: "Emily Rodriguez",
    date: "January 18, 2024",
    readTime: "10 min read",
    featured: false,
    gradient: "from-orange-500 to-red-500",
  },
  {
    id: 4,
    title: "Cloudify Raises $100M Series C",
    excerpt: "We're thrilled to announce our Series C funding round led by Acme Ventures. This investment will help us accelerate product development and global expansion.",
    category: "Company",
    author: "Sarah Chen",
    date: "January 15, 2024",
    readTime: "3 min read",
    featured: false,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: 5,
    title: "Building a Real-time Dashboard with Server-Sent Events",
    excerpt: "Step-by-step guide to building a real-time analytics dashboard using SSE. Includes code examples and best practices.",
    category: "Tutorials",
    author: "David Kim",
    date: "January 12, 2024",
    readTime: "12 min read",
    featured: false,
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    id: 6,
    title: "The Architecture Behind 99.99% Uptime",
    excerpt: "How we built a globally distributed system that handles millions of requests with four nines reliability. Lessons learned and trade-offs made.",
    category: "Engineering",
    author: "Marcus Johnson",
    date: "January 8, 2024",
    readTime: "15 min read",
    featured: false,
    gradient: "from-gray-600 to-gray-800",
  },
];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredPosts = posts.filter(
    (post) => selectedCategory === "All" || post.category === selectedCategory
  );

  const featuredPosts = filteredPosts.filter((p) => p.featured);
  const regularPosts = filteredPosts.filter((p) => !p.featured);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="py-20 bg-secondary/30">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
                Blog
              </h1>
              <p className="mt-6 text-xl text-muted-foreground">
                Insights, tutorials, and updates from the Cloudify team
              </p>
            </motion.div>

            {/* Categories */}
            <div className="flex flex-wrap justify-center gap-2 mt-12">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    selectedCategory === category
                      ? "bg-foreground text-background"
                      : "bg-card text-foreground hover:bg-secondary"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="py-12">
            <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-foreground mb-8">
                Featured
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {featuredPosts.map((post, index) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <Link href={`/blog/${post.id}`}>
                      <div
                        className={cn(
                          "aspect-video rounded-lg bg-gradient-to-br flex items-center justify-center mb-4",
                          post.gradient
                        )}
                      >
                        <span className="text-white text-4xl font-bold opacity-20">
                          Cloudify
                        </span>
                      </div>
                      <Badge className="mb-2">{post.category}</Badge>
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-[#0070f3] dark:group-hover:text-[#0070f3] transition-colors">
                        {post.title}
                      </h3>
                      <p className="mt-2 text-muted-foreground line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {post.readTime}
                        </span>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Posts */}
        <section className="py-12 bg-background">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              All Posts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <Link href={`/blog/${post.id}`}>
                    <div
                      className={cn(
                        "aspect-video bg-gradient-to-br flex items-center justify-center",
                        post.gradient
                      )}
                    >
                      <span className="text-white text-2xl font-bold opacity-20">
                        Cloudify
                      </span>
                    </div>
                    <div className="p-6">
                      <Badge variant="secondary" className="mb-2">
                        {post.category}
                      </Badge>
                      <h3 className="font-semibold text-foreground group-hover:text-[#0070f3] dark:group-hover:text-[#0070f3] transition-colors">
                        {post.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                        <span>{post.date}</span>
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Posts
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-20">
          <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Subscribe to our newsletter
            </h2>
            <p className="text-muted-foreground mb-8">
              Get the latest posts delivered straight to your inbox. No spam, unsubscribe anytime.
            </p>
            <form className="flex gap-3">
              <input
                type="email"
                placeholder="you@example.com"
                className="flex-1 rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground"
              />
              <Button variant="default">Subscribe</Button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
