import { CodeBlock } from "@/components/CodeBlock";
import { Callout } from "@/components/Callout";

export default function BuildSettingsPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Build Settings</h1>

      <p className="lead">
        Configure how Cloudify builds your project with custom commands and
        settings.
      </p>

      <h2>Auto-Detection</h2>

      <p>
        Cloudify automatically detects your framework by checking for
        configuration files:
      </p>

      <div className="not-prose my-6 border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Framework</th>
              <th className="px-4 py-2 text-left">Detection</th>
              <th className="px-4 py-2 text-left">Build Command</th>
              <th className="px-4 py-2 text-left">Output</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-2">Next.js</td>
              <td className="px-4 py-2"><code>next.config.js</code></td>
              <td className="px-4 py-2"><code>npm run build</code></td>
              <td className="px-4 py-2"><code>.next</code></td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2">Vite</td>
              <td className="px-4 py-2"><code>vite.config.ts</code></td>
              <td className="px-4 py-2"><code>npm run build</code></td>
              <td className="px-4 py-2"><code>dist</code></td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2">Create React App</td>
              <td className="px-4 py-2"><code>react-scripts</code></td>
              <td className="px-4 py-2"><code>npm run build</code></td>
              <td className="px-4 py-2"><code>build</code></td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2">Astro</td>
              <td className="px-4 py-2"><code>astro.config.mjs</code></td>
              <td className="px-4 py-2"><code>npm run build</code></td>
              <td className="px-4 py-2"><code>dist</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Custom Build Settings</h2>

      <p>Override the defaults in your project settings:</p>

      <h3>Build Command</h3>

      <p>The command that builds your project:</p>

      <CodeBlock
        code={`# Default
npm run build

# Custom examples
npm run build:production
yarn build
pnpm build
turbo run build`}
        language="bash"
      />

      <h3>Install Command</h3>

      <p>The command that installs dependencies:</p>

      <CodeBlock
        code={`# Default (auto-detected from lockfile)
npm install     # package-lock.json
yarn install    # yarn.lock
pnpm install    # pnpm-lock.yaml

# Custom
npm ci --legacy-peer-deps`}
        language="bash"
      />

      <h3>Output Directory</h3>

      <p>The directory containing your built files:</p>

      <CodeBlock
        code={`# Framework defaults
.next           # Next.js
dist            # Vite, Astro
build           # Create React App
out             # Next.js static export
public          # Hugo, Jekyll`}
        language="bash"
      />

      <h2>Node.js Version</h2>

      <p>
        Specify the Node.js version for your build. Cloudify supports Node.js
        18.x, 20.x, and 22.x:
      </p>

      <CodeBlock
        code={`# In project settings
Node.js Version: 20.x

# Or via .nvmrc file
20.10.0`}
        language="text"
      />

      <Callout type="info">
        We recommend using Node.js 20.x for most projects. It&apos;s the current LTS
        version with the best compatibility.
      </Callout>

      <h2>Build Environment</h2>

      <p>Each build runs in an isolated environment with:</p>

      <ul>
        <li>4 GB RAM</li>
        <li>2 CPU cores</li>
        <li>10 GB disk space</li>
        <li>45 minute timeout</li>
      </ul>

      <h2>Build Caching</h2>

      <p>
        Cloudify caches <code>node_modules</code> and other build dependencies
        between deployments to speed up builds. The cache is automatically
        invalidated when your lockfile changes.
      </p>

      <h2>Troubleshooting</h2>

      <h3>Build fails with &quot;Out of memory&quot;</h3>

      <p>
        Try adding <code>NODE_OPTIONS=--max_old_space_size=4096</code> to your
        environment variables.
      </p>

      <h3>Build fails with missing dependencies</h3>

      <p>
        Make sure all dependencies are listed in <code>package.json</code>. Dev
        dependencies are installed by default.
      </p>
    </article>
  );
}
