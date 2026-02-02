"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Terminal,
  Copy,
  Check,
  ChevronRight,
  Download,
  Command,
  Folder,
  GitBranch,
  Globe,
  Settings,
  Key,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface CLICommand {
  command: string;
  description: string;
  usage: string;
  options?: { flag: string; description: string }[];
  example?: string;
}

const commands: CLICommand[] = [
  {
    command: "cloudify",
    description: "Deploy your project to Cloudify",
    usage: "cloudify [options]",
    options: [
      { flag: "--prod", description: "Deploy to production" },
      { flag: "--preview", description: "Create a preview deployment" },
      { flag: "--force", description: "Force deploy without confirmation" },
    ],
    example: "cloudify --prod",
  },
  {
    command: "cloudify init",
    description: "Initialize a new Cloudify project",
    usage: "cloudify init [name]",
    options: [
      { flag: "--template", description: "Use a specific template" },
      { flag: "--yes", description: "Skip prompts with defaults" },
    ],
    example: "cloudify init my-project --template next",
  },
  {
    command: "cloudify dev",
    description: "Start local development server",
    usage: "cloudify dev [options]",
    options: [
      { flag: "--port", description: "Port to run on (default: 3000)" },
      { flag: "--listen", description: "Network interface to listen on" },
    ],
    example: "cloudify dev --port 8080",
  },
  {
    command: "cloudify env",
    description: "Manage environment variables",
    usage: "cloudify env [command]",
    options: [
      { flag: "pull", description: "Download environment variables" },
      { flag: "add", description: "Add an environment variable" },
      { flag: "rm", description: "Remove an environment variable" },
      { flag: "ls", description: "List all environment variables" },
    ],
    example: "cloudify env pull",
  },
  {
    command: "cloudify domains",
    description: "Manage custom domains",
    usage: "cloudify domains [command]",
    options: [
      { flag: "add", description: "Add a custom domain" },
      { flag: "rm", description: "Remove a domain" },
      { flag: "ls", description: "List all domains" },
    ],
    example: "cloudify domains add example.com",
  },
  {
    command: "cloudify logs",
    description: "View deployment logs",
    usage: "cloudify logs [deployment-url]",
    options: [
      { flag: "--follow", description: "Stream logs in real-time" },
      { flag: "--since", description: "Show logs since timestamp" },
    ],
    example: "cloudify logs --follow",
  },
];

const quickLinks = [
  { icon: Download, label: "Installation", href: "#installation" },
  { icon: Folder, label: "Project Setup", href: "#setup" },
  { icon: GitBranch, label: "Deployments", href: "#deployments" },
  { icon: Globe, label: "Domains", href: "#domains" },
  { icon: Settings, label: "Configuration", href: "#config" },
  { icon: Key, label: "Authentication", href: "#auth" },
];

export default function CLIDocsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Documentation
        </Link>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-8 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Quick Links
                </h3>
                <nav className="space-y-1">
                  {quickLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 rounded-lg"
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="lg:col-span-3 space-y-12">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900">
                  <Terminal className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    CLI Reference
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400">
                    Command line tools for Cloudify
                  </p>
                </div>
              </div>
            </div>

            {/* Installation */}
            <section id="installation">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Installation
              </h2>
              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <Tabs defaultValue="npm">
                  <TabsList>
                    <TabsTrigger value="npm">npm</TabsTrigger>
                    <TabsTrigger value="yarn">yarn</TabsTrigger>
                    <TabsTrigger value="pnpm">pnpm</TabsTrigger>
                  </TabsList>
                  <TabsContent value="npm" className="mt-4">
                    <div className="flex items-center gap-2 p-3 bg-gray-950 rounded-lg">
                      <code className="flex-1 text-sm text-gray-300 font-mono">
                        npm install -g cloudify-cli
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard("npm install -g cloudify-cli", "npm")}
                      >
                        {copied === "npm" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="yarn" className="mt-4">
                    <div className="flex items-center gap-2 p-3 bg-gray-950 rounded-lg">
                      <code className="flex-1 text-sm text-gray-300 font-mono">
                        yarn global add cloudify-cli
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard("yarn global add cloudify-cli", "yarn")}
                      >
                        {copied === "yarn" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="pnpm" className="mt-4">
                    <div className="flex items-center gap-2 p-3 bg-gray-950 rounded-lg">
                      <code className="flex-1 text-sm text-gray-300 font-mono">
                        pnpm add -g cloudify-cli
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard("pnpm add -g cloudify-cli", "pnpm")}
                      >
                        {copied === "pnpm" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </section>

            {/* Authentication */}
            <section id="auth">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Authentication
              </h2>
              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Login to your Cloudify account to deploy projects:
                </p>
                <div className="flex items-center gap-2 p-3 bg-gray-950 rounded-lg">
                  <code className="flex-1 text-sm text-gray-300 font-mono">
                    cloudify login
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("cloudify login", "login")}
                  >
                    {copied === "login" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  This will open a browser window for authentication.
                </p>
              </div>
            </section>

            {/* Commands */}
            <section id="commands">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Commands
              </h2>
              <div className="space-y-4">
                {commands.map((cmd, index) => (
                  <motion.div
                    key={cmd.command}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono">
                          {cmd.command}
                        </code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(cmd.command, cmd.command)}
                      >
                        {copied === cmd.command ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {cmd.description}
                    </p>

                    <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded-lg mb-4">
                      <code className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                        {cmd.usage}
                      </code>
                    </div>

                    {cmd.options && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Options
                        </h4>
                        <div className="space-y-1">
                          {cmd.options.map((opt) => (
                            <div key={opt.flag} className="flex items-start gap-3 text-sm">
                              <code className="text-purple-600 dark:text-purple-400 font-mono shrink-0">
                                {opt.flag}
                              </code>
                              <span className="text-gray-600 dark:text-gray-400">
                                {opt.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {cmd.example && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Example
                        </h4>
                        <div className="p-3 bg-gray-950 rounded-lg">
                          <code className="text-sm text-green-400 font-mono">
                            $ {cmd.example}
                          </code>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Need help */}
            <section className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
              <div className="flex items-start gap-4">
                <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Need help?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Run <code className="font-mono bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded">cloudify --help</code> for a list of all commands, or visit our documentation for detailed guides.
                  </p>
                  <Button variant="primary" size="sm" asChild>
                    <Link href="/docs">
                      View Full Documentation
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
