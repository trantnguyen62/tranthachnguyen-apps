import { CodeBlock } from "@/components/CodeBlock";
import { Callout } from "@/components/Callout";

export default function ReactGuidePage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Deploy React (Vite)</h1>

      <p className="lead">
        Deploy React single-page applications built with Vite or Create React App.
      </p>

      <h2>Vite + React</h2>

      <h3>1. Create a Vite App</h3>

      <CodeBlock
        code={`npm create vite@latest my-react-app -- --template react-ts
cd my-react-app
npm install`}
        language="bash"
      />

      <h3>2. Push to GitHub</h3>

      <CodeBlock
        code={`git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/you/my-react-app.git
git push -u origin main`}
        language="bash"
      />

      <h3>3. Deploy on Cloudify</h3>

      <p>
        Cloudify automatically detects Vite and configures:
      </p>

      <div className="not-prose my-6 border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Setting</th>
              <th className="px-4 py-2 text-left">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-2">Build Command</td>
              <td className="px-4 py-2"><code>npm run build</code></td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2">Output Directory</td>
              <td className="px-4 py-2"><code>dist</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Environment Variables</h2>

      <p>
        Vite uses the <code>VITE_</code> prefix for client-side variables:
      </p>

      <CodeBlock
        code={`# .env
VITE_API_URL=https://api.example.com
VITE_APP_TITLE=My React App`}
        language="bash"
      />

      <p>
        Access them in your code:
      </p>

      <CodeBlock
        code={`const apiUrl = import.meta.env.VITE_API_URL;`}
        language="typescript"
      />

      <Callout type="warning">
        All <code>VITE_</code> variables are exposed to the browser. Don&apos;t use
        them for secrets!
      </Callout>

      <h2>Client-Side Routing</h2>

      <p>
        For React Router or other client-side routing, you need to configure
        redirects so all routes serve <code>index.html</code>:
      </p>

      <CodeBlock
        code={`// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
  },
});`}
        language="typescript"
        filename="vite.config.ts"
      />

      <p>
        Create a <code>_redirects</code> file in your <code>public</code> folder:
      </p>

      <CodeBlock
        code={`/*    /index.html   200`}
        language="text"
        filename="public/_redirects"
      />

      <h2>Create React App</h2>

      <p>
        For CRA projects, Cloudify detects these settings:
      </p>

      <div className="not-prose my-6 border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Setting</th>
              <th className="px-4 py-2 text-left">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-2">Build Command</td>
              <td className="px-4 py-2"><code>npm run build</code></td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2">Output Directory</td>
              <td className="px-4 py-2"><code>build</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        CRA uses the <code>REACT_APP_</code> prefix for environment variables:
      </p>

      <CodeBlock
        code={`REACT_APP_API_URL=https://api.example.com`}
        language="bash"
      />

      <h2>Optimization Tips</h2>

      <h3>Code Splitting</h3>

      <CodeBlock
        code={`// Use React.lazy for route-based code splitting
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./pages/Dashboard"));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
}`}
        language="tsx"
      />

      <h3>Image Optimization</h3>

      <p>
        For large images, consider using a CDN or compression:
      </p>

      <CodeBlock
        code={`npm install sharp vite-plugin-image-optimizer`}
        language="bash"
      />

      <h2>Adding API Endpoints</h2>

      <p>
        Since React SPAs are static, you&apos;ll need a backend. Options:
      </p>

      <ul>
        <li>
          <strong>Edge Functions</strong> - Create functions in the{" "}
          <code>functions/</code> directory
        </li>
        <li>
          <strong>External API</strong> - Point to your existing backend
        </li>
        <li>
          <strong>BaaS</strong> - Use Supabase, Firebase, or similar
        </li>
      </ul>
    </article>
  );
}
