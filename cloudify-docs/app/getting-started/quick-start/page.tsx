import { CodeBlock } from "@/components/CodeBlock";
import { Callout } from "@/components/Callout";

export default function QuickStartPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Quick Start</h1>

      <p className="lead">
        Get your first project deployed to Cloudify in under 5 minutes.
      </p>

      <h2>Prerequisites</h2>

      <ul>
        <li>A GitHub account</li>
        <li>A web application (Next.js, React, Vue, or static site)</li>
      </ul>

      <h2>Step 1: Create an Account</h2>

      <p>
        Visit{" "}
        <a
          href="https://cloudify.tranthachnguyen.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          cloudify.tranthachnguyen.com
        </a>{" "}
        and sign up using your GitHub account. This allows Cloudify to access
        your repositories for deployment.
      </p>

      <h2>Step 2: Import Your Project</h2>

      <ol>
        <li>From your dashboard, click &quot;New Project&quot;</li>
        <li>Select the GitHub repository you want to deploy</li>
        <li>Cloudify will automatically detect your framework</li>
      </ol>

      <Callout type="info" title="Framework Detection">
        Cloudify automatically detects Next.js, React, Vue, and other popular
        frameworks. You can override the build settings if needed.
      </Callout>

      <h2>Step 3: Configure Build Settings</h2>

      <p>
        Review the auto-detected build settings. For most projects, the defaults
        work out of the box:
      </p>

      <CodeBlock
        code={`# Build Command (auto-detected)
npm run build

# Output Directory (framework-specific)
.next          # Next.js
dist           # Vite/React
build          # Create React App
out            # Static export`}
        language="bash"
      />

      <h2>Step 4: Add Environment Variables</h2>

      <p>
        If your project requires environment variables, add them in the project
        settings:
      </p>

      <CodeBlock
        code={`DATABASE_URL=postgresql://...
NEXT_PUBLIC_API_URL=https://api.example.com
SECRET_KEY=your-secret-key`}
        language="bash"
      />

      <Callout type="warning" title="Sensitive Data">
        Environment variables are encrypted and never exposed in build logs.
        Use them for API keys, database URLs, and other sensitive configuration.
      </Callout>

      <h2>Step 5: Deploy</h2>

      <p>
        Click &quot;Deploy&quot; to start your first deployment. Cloudify will:
      </p>

      <ol>
        <li>Clone your repository</li>
        <li>Install dependencies</li>
        <li>Run the build command</li>
        <li>Deploy to our global edge network</li>
      </ol>

      <p>
        Your site will be live at{" "}
        <code>your-project.cloudify.tranthachnguyen.com</code> within minutes.
      </p>

      <h2>Step 6: Automatic Deployments</h2>

      <p>
        Once connected, every push to your repository automatically triggers a
        new deployment:
      </p>

      <ul>
        <li>
          <strong>Production</strong> - Pushes to <code>main</code> or{" "}
          <code>master</code> deploy to production
        </li>
        <li>
          <strong>Preview</strong> - Pull requests get unique preview URLs
        </li>
      </ul>

      <CodeBlock
        code={`# Push changes to trigger deployment
git add .
git commit -m "Update homepage"
git push origin main`}
        language="bash"
      />

      <h2>What&apos;s Next?</h2>

      <p>Now that your project is deployed, explore more features:</p>

      <ul>
        <li>
          <a href="/deployments/domains">Add a custom domain</a>
        </li>
        <li>
          <a href="/functions">Create Edge Functions</a>
        </li>
        <li>
          <a href="/analytics">Set up analytics</a>
        </li>
        <li>
          <a href="/storage">Use Blob Storage</a>
        </li>
      </ul>
    </article>
  );
}
