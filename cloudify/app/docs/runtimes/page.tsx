"use client";

import Link from "next/link";
import { ArrowRight, Check, Cpu, Zap, Clock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RuntimesDocsPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <h1>Runtimes</h1>

      <p className="lead">
        Cloudify supports multiple runtimes for your serverless functions.
        Choose the runtime that best fits your application&apos;s needs.
      </p>

      <h2>Available Runtimes</h2>

      <div className="not-prose grid grid-cols-1 gap-4 my-8">
        {[
          { name: "Node.js 20", version: "20.x (LTS)", status: "Recommended", desc: "Latest LTS with modern ES features" },
          { name: "Node.js 18", version: "18.x (LTS)", status: "Supported", desc: "Stable LTS release" },
          { name: "Python 3.12", version: "3.12.x", status: "Supported", desc: "Latest Python with performance improvements" },
          { name: "Python 3.11", version: "3.11.x", status: "Supported", desc: "Stable Python release" },
          { name: "Go 1.21", version: "1.21.x", status: "Supported", desc: "Fast compilation and execution" },
          { name: "Ruby 3.3", version: "3.3.x", status: "Supported", desc: "Latest Ruby with YJIT" },
        ].map((runtime) => (
          <div key={runtime.name} className="flex items-start gap-4 p-4 rounded-lg bg-[var(--surface-primary)] border border-[var(--border-primary)]">
            <Check className="h-5 w-5 text-green-500 shrink-0 mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--text-primary)]">{runtime.name}</span>
                {runtime.status === "Recommended" && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    {runtime.status}
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{runtime.version} - {runtime.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h2>Configuring Runtimes</h2>

      <h3>Using cloudify.json</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "functions": {
    "runtime": "nodejs20.x",
    "memory": 1024,
    "maxDuration": 30
  }
}`}</code>
      </pre>

      <h3>Per-Function Configuration</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "functions": {
    "api/heavy-compute.js": {
      "runtime": "nodejs20.x",
      "memory": 3008,
      "maxDuration": 60
    },
    "api/python-ml.py": {
      "runtime": "python3.12",
      "memory": 1024,
      "maxDuration": 30
    }
  }
}`}</code>
      </pre>

      <h2>Node.js Runtime</h2>

      <h3>Entry Point</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// api/hello.js
export default function handler(req, res) {
  res.json({ message: 'Hello from Node.js!' });
}

// Or with async/await
export default async function handler(req, res) {
  const data = await fetchData();
  res.json(data);
}`}</code>
      </pre>

      <h3>Using npm Packages</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// api/with-deps.js
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const users = await prisma.user.findMany();
  res.json(users);
}`}</code>
      </pre>

      <h2>Python Runtime</h2>

      <h3>Entry Point</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`# api/hello.py
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write('{"message": "Hello from Python!"}'.encode())
        return`}</code>
      </pre>

      <h3>Using pip Packages</h3>

      <p>
        Create a <code>requirements.txt</code> file in your project root:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`# requirements.txt
requests==2.31.0
numpy==1.26.0
pandas==2.1.0`}</code>
      </pre>

      <h2>Go Runtime</h2>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// api/hello.go
package handler

import (
    "encoding/json"
    "net/http"
)

type Response struct {
    Message string \`json:"message"\`
}

func Handler(w http.ResponseWriter, r *http.Request) {
    response := Response{Message: "Hello from Go!"}
    json.NewEncoder(w).Encode(response)
}`}</code>
      </pre>

      <h2>Ruby Runtime</h2>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`# api/hello.rb
require 'json'

Handler = Proc.new do |req, res|
  res.status = 200
  res['Content-Type'] = 'application/json'
  res.body = JSON.generate({ message: 'Hello from Ruby!' })
end`}</code>
      </pre>

      <h2>Runtime Limits</h2>

      <div className="not-prose my-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-primary)]">
              <th className="text-left py-3 px-4 font-semibold text-[var(--text-primary)]">Plan</th>
              <th className="text-left py-3 px-4 font-semibold text-[var(--text-primary)]">Max Duration</th>
              <th className="text-left py-3 px-4 font-semibold text-[var(--text-primary)]">Memory</th>
              <th className="text-left py-3 px-4 font-semibold text-[var(--text-primary)]">Payload</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[var(--border-primary)]">
              <td className="py-3 px-4 text-[var(--text-secondary)]">Hobby</td>
              <td className="py-3 px-4 text-[var(--text-secondary)]">10 seconds</td>
              <td className="py-3 px-4 text-[var(--text-secondary)]">1024 MB</td>
              <td className="py-3 px-4 text-[var(--text-secondary)]">4.5 MB</td>
            </tr>
            <tr className="border-b border-[var(--border-primary)]">
              <td className="py-3 px-4 text-[var(--text-secondary)]">Pro</td>
              <td className="py-3 px-4 text-[var(--text-secondary)]">60 seconds</td>
              <td className="py-3 px-4 text-[var(--text-secondary)]">3008 MB</td>
              <td className="py-3 px-4 text-[var(--text-secondary)]">4.5 MB</td>
            </tr>
            <tr className="border-b border-[var(--border-primary)]">
              <td className="py-3 px-4 text-[var(--text-secondary)]">Enterprise</td>
              <td className="py-3 px-4 text-[var(--text-secondary)]">900 seconds</td>
              <td className="py-3 px-4 text-[var(--text-secondary)]">3008 MB</td>
              <td className="py-3 px-4 text-[var(--text-secondary)]">4.5 MB</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Cold Starts</h2>

      <div className="not-prose p-6 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/30 my-8">
        <div className="flex items-start gap-4">
          <Clock className="h-8 w-8 text-yellow-500 shrink-0" />
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] text-lg mb-2">
              Minimizing Cold Starts
            </h3>
            <p className="text-[var(--text-secondary)] mb-4">
              Cold starts occur when a function is invoked after being idle. Here are tips to reduce cold start times:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-1">
              <li>Keep your function bundle size small</li>
              <li>Use Node.js for fastest cold starts</li>
              <li>Lazy-load heavy dependencies</li>
              <li>Consider Edge Functions for latency-sensitive routes</li>
            </ul>
          </div>
        </div>
      </div>

      <h2>Environment Variables</h2>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// Accessing environment variables in Node.js
const apiKey = process.env.API_KEY;

# Accessing environment variables in Python
import os
api_key = os.environ.get('API_KEY')

// Accessing environment variables in Go
apiKey := os.Getenv("API_KEY")`}</code>
      </pre>

      <div className="not-prose mt-12">
        <Button variant="default" asChild>
          <Link href="/docs/edge-functions">
            Explore Edge Functions
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
