import { CodeBlock } from "@/components/CodeBlock";

export default function StaticSitesGuidePage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Deploy Static Sites</h1>

      <p className="lead">
        Deploy HTML, Astro, Hugo, Jekyll, and other static site generators.
      </p>

      <h2>Plain HTML</h2>

      <p>
        For simple HTML sites with no build step:
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
              <td className="px-4 py-2"><em>(leave empty)</em></td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2">Output Directory</td>
              <td className="px-4 py-2"><code>.</code> or <code>public</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Astro</h2>

      <h3>Create an Astro Project</h3>

      <CodeBlock
        code={`npm create astro@latest my-site
cd my-site`}
        language="bash"
      />

      <h3>Build Settings</h3>

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

      <p>
        For Astro SSR mode, the output directory is <code>dist/client</code>.
      </p>

      <h2>Hugo</h2>

      <h3>Create a Hugo Site</h3>

      <CodeBlock
        code={`hugo new site my-site
cd my-site
git init
git submodule add https://github.com/theNewDynamic/gohugo-theme-ananke themes/ananke
echo "theme = 'ananke'" >> hugo.toml`}
        language="bash"
      />

      <h3>Build Settings</h3>

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
              <td className="px-4 py-2"><code>hugo --minify</code></td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2">Output Directory</td>
              <td className="px-4 py-2"><code>public</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Jekyll</h2>

      <h3>Create a Jekyll Site</h3>

      <CodeBlock
        code={`gem install jekyll bundler
jekyll new my-site
cd my-site`}
        language="bash"
      />

      <h3>Build Settings</h3>

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
              <td className="px-4 py-2"><code>bundle exec jekyll build</code></td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2">Output Directory</td>
              <td className="px-4 py-2"><code>_site</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>11ty (Eleventy)</h2>

      <h3>Create an 11ty Site</h3>

      <CodeBlock
        code={`mkdir my-site && cd my-site
npm init -y
npm install @11ty/eleventy`}
        language="bash"
      />

      <h3>Build Settings</h3>

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
              <td className="px-4 py-2"><code>npx @11ty/eleventy</code></td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2">Output Directory</td>
              <td className="px-4 py-2"><code>_site</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Custom 404 Page</h2>

      <p>
        Create a <code>404.html</code> file in your output directory for custom
        error pages:
      </p>

      <CodeBlock
        code={`<!DOCTYPE html>
<html>
<head>
  <title>Page Not Found</title>
</head>
<body>
  <h1>404 - Page Not Found</h1>
  <p>Sorry, the page you're looking for doesn't exist.</p>
  <a href="/">Go Home</a>
</body>
</html>`}
        language="html"
        filename="404.html"
      />

      <h2>Redirects</h2>

      <p>
        Create a <code>_redirects</code> file for URL redirects:
      </p>

      <CodeBlock
        code={`# Redirect old URLs
/old-page    /new-page     301
/blog/*      /posts/:splat 301

# SPA fallback
/*           /index.html   200`}
        language="text"
        filename="_redirects"
      />

      <h2>Headers</h2>

      <p>
        Create a <code>_headers</code> file for custom HTTP headers:
      </p>

      <CodeBlock
        code={`# Cache static assets
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Security headers
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff`}
        language="text"
        filename="_headers"
      />
    </article>
  );
}
