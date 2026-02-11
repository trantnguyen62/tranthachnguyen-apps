"use client";

import { Cpu, Zap, Globe, Clock, Code } from "lucide-react";

export default function FunctionsPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <h1>Serverless Functions</h1>

      <p className="lead">
        Run backend code without managing servers. Cloudify Serverless Functions scale
        automatically from zero to millions of requests.
      </p>

      <h2>Overview</h2>

      <p>
        Serverless Functions allow you to write backend code that runs on-demand. Perfect for:
      </p>

      <ul>
        <li>API endpoints</li>
        <li>Form submissions</li>
        <li>Database queries</li>
        <li>Authentication</li>
        <li>Webhooks</li>
        <li>Scheduled tasks</li>
      </ul>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        <div className="p-6 rounded-xl border border-border bg-background">
          <Zap className="h-8 w-8 text-yellow-500 mb-4" />
          <h3 className="font-semibold text-foreground">Instant Scale</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Functions scale automatically based on traffic. Handle 1 or 1 million requests.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-background">
          <Globe className="h-8 w-8 text-[#0070f3] mb-4" />
          <h3 className="font-semibold text-foreground">Global Deployment</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Functions run in multiple regions worldwide for low latency.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-background">
          <Clock className="h-8 w-8 text-green-500 mb-4" />
          <h3 className="font-semibold text-foreground">Pay Per Use</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Only pay for the compute time you use. No idle costs.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-background">
          <Code className="h-8 w-8 text-purple-500 mb-4" />
          <h3 className="font-semibold text-foreground">Multiple Runtimes</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Support for Node.js, Python, Go, Ruby, and more.
          </p>
        </div>
      </div>

      <h2>Creating a Function</h2>

      <h3>With Next.js (App Router)</h3>

      <p>
        Create a <code>route.ts</code> file in your <code>app/api</code> directory:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// app/api/hello/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello, World!' });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ received: body });
}`}</code>
      </pre>

      <h3>With Next.js (Pages Router)</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// pages/api/hello.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json({ message: 'Hello, World!' });
}`}</code>
      </pre>

      <h3>Standalone Functions</h3>

      <p>
        Create functions in the <code>/api</code> directory at your project root:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// api/hello.js
export default function handler(req, res) {
  res.json({ message: 'Hello, World!' });
}`}</code>
      </pre>

      <h2>Supported Runtimes</h2>

      <table>
        <thead>
          <tr>
            <th>Runtime</th>
            <th>Version</th>
            <th>File Extension</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Node.js</td>
            <td>18.x, 20.x</td>
            <td><code>.js</code>, <code>.ts</code></td>
          </tr>
          <tr>
            <td>Python</td>
            <td>3.9, 3.10, 3.11</td>
            <td><code>.py</code></td>
          </tr>
          <tr>
            <td>Go</td>
            <td>1.21</td>
            <td><code>.go</code></td>
          </tr>
          <tr>
            <td>Ruby</td>
            <td>3.2</td>
            <td><code>.rb</code></td>
          </tr>
        </tbody>
      </table>

      <h2>Configuration</h2>

      <p>
        Configure function behavior in your <code>cloudify.json</code>:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "functions": {
    "api/hello.js": {
      "memory": 1024,
      "maxDuration": 30,
      "regions": ["iad1", "sfo1", "cdg1"]
    }
  }
}`}</code>
      </pre>

      <h3>Options</h3>

      <ul>
        <li><strong>memory</strong> - Memory allocation in MB (128-3008)</li>
        <li><strong>maxDuration</strong> - Maximum execution time in seconds (1-300)</li>
        <li><strong>regions</strong> - Deploy to specific regions</li>
      </ul>

      <h2>Environment Variables</h2>

      <p>
        Access environment variables in your functions:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`export default function handler(req, res) {
  const apiKey = process.env.API_KEY;
  // Use apiKey...
}`}</code>
      </pre>

      <h2>Limits</h2>

      <table>
        <thead>
          <tr>
            <th>Limit</th>
            <th>Hobby</th>
            <th>Pro</th>
            <th>Enterprise</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Invocations</td>
            <td>100K/month</td>
            <td>1M/month</td>
            <td>Custom</td>
          </tr>
          <tr>
            <td>Max Duration</td>
            <td>10 seconds</td>
            <td>60 seconds</td>
            <td>300 seconds</td>
          </tr>
          <tr>
            <td>Memory</td>
            <td>1024 MB</td>
            <td>3008 MB</td>
            <td>Custom</td>
          </tr>
          <tr>
            <td>Payload Size</td>
            <td>4.5 MB</td>
            <td>4.5 MB</td>
            <td>Custom</td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}
