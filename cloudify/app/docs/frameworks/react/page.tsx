"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReactDocsPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <div className="not-prose flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-lg bg-[#61DAFB] flex items-center justify-center">
          <svg className="h-10 w-10 text-[#20232a]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground m-0">React on Cloudify</h1>
          <p className="text-muted-foreground m-0 mt-1">Deploy React applications with zero configuration</p>
        </div>
      </div>

      <p className="lead">
        Deploy any React application to Cloudify with automatic optimization,
        global CDN distribution, and instant cache invalidation.
      </p>

      <h2>Supported React Setups</h2>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        {[
          { name: "Create React App", desc: "Classic CRA projects" },
          { name: "Vite + React", desc: "Fast, modern React development" },
          { name: "React Router", desc: "Client-side routing support" },
          { name: "React + TypeScript", desc: "Full TypeScript support" },
        ].map((item) => (
          <div key={item.name} className="flex items-center gap-3 p-4 rounded-lg bg-background border border-border">
            <Check className="h-5 w-5 text-green-500 shrink-0" />
            <div>
              <span className="font-medium text-foreground">{item.name}</span>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h2>Quick Start</h2>

      <h3>Create React App</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`npx create-react-app my-app
cd my-app
cloudify deploy`}</code>
      </pre>

      <h3>Vite + React</h3>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`npm create vite@latest my-app -- --template react
cd my-app
npm install
cloudify deploy`}</code>
      </pre>

      <h2>Build Settings</h2>

      <h3>Create React App</h3>

      <table>
        <thead>
          <tr>
            <th>Setting</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Build Command</td>
            <td><code>npm run build</code></td>
          </tr>
          <tr>
            <td>Output Directory</td>
            <td><code>build</code></td>
          </tr>
          <tr>
            <td>Install Command</td>
            <td><code>npm install</code></td>
          </tr>
        </tbody>
      </table>

      <h3>Vite</h3>

      <table>
        <thead>
          <tr>
            <th>Setting</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Build Command</td>
            <td><code>npm run build</code></td>
          </tr>
          <tr>
            <td>Output Directory</td>
            <td><code>dist</code></td>
          </tr>
          <tr>
            <td>Install Command</td>
            <td><code>npm install</code></td>
          </tr>
        </tbody>
      </table>

      <h2>Client-Side Routing</h2>

      <p>
        For single-page applications with client-side routing (React Router),
        configure rewrites to serve <code>index.html</code> for all routes:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// cloudify.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}`}</code>
      </pre>

      <h2>Environment Variables</h2>

      <h3>Create React App</h3>

      <p>
        CRA requires environment variables to be prefixed with <code>REACT_APP_</code>:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// In Cloudify dashboard
REACT_APP_API_URL=https://api.example.com

// In your React code
const apiUrl = process.env.REACT_APP_API_URL;`}</code>
      </pre>

      <h3>Vite</h3>

      <p>
        Vite uses the <code>VITE_</code> prefix:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// In Cloudify dashboard
VITE_API_URL=https://api.example.com

// In your React code
const apiUrl = import.meta.env.VITE_API_URL;`}</code>
      </pre>

      <h2>Adding a Backend</h2>

      <p>
        Add serverless API routes to your React app:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`// api/hello.js
export default function handler(req, res) {
  res.json({ message: 'Hello from the API!' });
}

// In your React component
fetch('/api/hello')
  .then(res => res.json())
  .then(data => console.log(data.message));`}</code>
      </pre>

      <h2>Performance Optimization</h2>

      <p>Cloudify automatically optimizes your React app:</p>

      <ul>
        <li><strong>Code splitting</strong> - Automatically splits bundles for faster loading</li>
        <li><strong>Asset compression</strong> - Gzip and Brotli compression</li>
        <li><strong>CDN caching</strong> - Static assets cached at the edge</li>
        <li><strong>Image optimization</strong> - Automatic WebP conversion (with plugins)</li>
      </ul>

      <h2>Common Issues</h2>

      <h3>Blank page after deployment</h3>

      <ul>
        <li>Check the <code>homepage</code> field in <code>package.json</code></li>
        <li>Ensure routing is configured for SPAs</li>
        <li>Check browser console for errors</li>
      </ul>

      <h3>API calls failing</h3>

      <ul>
        <li>Verify environment variables are set correctly</li>
        <li>Check for CORS issues if calling external APIs</li>
        <li>Use relative paths for same-origin API calls</li>
      </ul>

      <div className="not-prose mt-12">
        <Button variant="default" asChild>
          <Link href="/new">
            Deploy Your React App
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
