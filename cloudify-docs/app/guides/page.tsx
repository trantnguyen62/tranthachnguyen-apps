import Link from "next/link";

export default function GuidesPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Framework Guides</h1>

      <p className="lead">
        Step-by-step guides for deploying popular frameworks on Cloudify.
      </p>

      <div className="not-prose my-8 grid gap-6">
        <Link
          href="/guides/nextjs"
          className="block p-6 border rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center bg-black rounded-lg">
              <span className="text-white text-xl font-bold">N</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Next.js</h3>
              <p className="text-gray-600 text-sm">
                Deploy Next.js with full SSR, API routes, and ISR support
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/guides/react"
          className="block p-6 border rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center bg-[#61DAFB] rounded-lg">
              <span className="text-black text-xl font-bold">⚛</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">React (Vite)</h3>
              <p className="text-gray-600 text-sm">
                Deploy React SPAs built with Vite or Create React App
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/guides/static-sites"
          className="block p-6 border rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center bg-gray-800 rounded-lg">
              <span className="text-white text-xl">📄</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Static Sites</h3>
              <p className="text-gray-600 text-sm">
                Deploy HTML, Astro, Hugo, Jekyll, and other static generators
              </p>
            </div>
          </div>
        </Link>
      </div>

      <h2>Common Configuration</h2>

      <p>
        All frameworks share these common configuration options:
      </p>

      <ul>
        <li>Environment variables</li>
        <li>Custom build commands</li>
        <li>Output directory specification</li>
        <li>Node.js version selection</li>
        <li>Install command customization</li>
      </ul>

      <h2>Not Finding Your Framework?</h2>

      <p>
        Cloudify supports any framework that outputs static files or has a Node.js
        server. Configure the build command and output directory manually in your
        project settings.
      </p>

      <p>
        Popular frameworks not listed here that work great:
      </p>

      <ul>
        <li>Vue.js / Nuxt</li>
        <li>Svelte / SvelteKit</li>
        <li>Angular</li>
        <li>Remix</li>
        <li>Gatsby</li>
        <li>11ty</li>
      </ul>
    </article>
  );
}
