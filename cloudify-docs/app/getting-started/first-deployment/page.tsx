import { CodeBlock } from "@/components/CodeBlock";
import { Callout } from "@/components/Callout";

export default function FirstDeploymentPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Your First Deployment</h1>

      <p className="lead">
        A detailed walkthrough of deploying a Next.js application to Cloudify.
      </p>

      <h2>Create a New Next.js App</h2>

      <p>
        If you don&apos;t have an existing project, create a new Next.js application:
      </p>

      <CodeBlock
        code={`npx create-next-app@latest my-cloudify-app
cd my-cloudify-app`}
        language="bash"
      />

      <h2>Push to GitHub</h2>

      <p>Create a new repository on GitHub and push your code:</p>

      <CodeBlock
        code={`git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/my-cloudify-app.git
git push -u origin main`}
        language="bash"
      />

      <h2>Import to Cloudify</h2>

      <ol>
        <li>
          Go to your <a href="https://cloudify.tranthachnguyen.com/dashboard">Cloudify Dashboard</a>
        </li>
        <li>Click &quot;New Project&quot;</li>
        <li>Select your GitHub repository from the list</li>
        <li>Click &quot;Import&quot;</li>
      </ol>

      <Callout type="info">
        If you don&apos;t see your repository, make sure you&apos;ve granted Cloudify access
        to it in your GitHub settings.
      </Callout>

      <h2>Configure Project Settings</h2>

      <p>Cloudify automatically detects Next.js and configures the build:</p>

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
              <td className="px-4 py-2 font-medium">Framework</td>
              <td className="px-4 py-2">Next.js</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2 font-medium">Build Command</td>
              <td className="px-4 py-2"><code>npm run build</code></td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2 font-medium">Output Directory</td>
              <td className="px-4 py-2"><code>.next</code></td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2 font-medium">Install Command</td>
              <td className="px-4 py-2"><code>npm install</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Deploy</h2>

      <p>
        Click the &quot;Deploy&quot; button to start your deployment. You&apos;ll see real-time
        build logs as Cloudify:
      </p>

      <ol>
        <li>Clones your repository</li>
        <li>Installs dependencies with <code>npm install</code></li>
        <li>Runs <code>npm run build</code></li>
        <li>Deploys the output to our edge network</li>
      </ol>

      <CodeBlock
        code={`[12:34:56] Cloning repository...
[12:34:58] Installing dependencies...
[12:35:12] Building project...
[12:35:45] Build completed successfully
[12:35:46] Deploying to edge network...
[12:35:52] Deployment complete!

✓ Production: https://my-cloudify-app.cloudify.tranthachnguyen.com`}
        language="text"
      />

      <h2>View Your Deployment</h2>

      <p>
        Once complete, your site is live! Click the deployment URL to view it.
        You can also find all deployments in the &quot;Deployments&quot; tab of your project.
      </p>

      <h2>Making Changes</h2>

      <p>To update your site, simply push changes to your repository:</p>

      <CodeBlock
        code={`# Make changes to your code
git add .
git commit -m "Update homepage"
git push`}
        language="bash"
      />

      <p>
        Cloudify automatically detects the push and triggers a new deployment.
        Your changes will be live in minutes.
      </p>

      <h2>Next Steps</h2>

      <ul>
        <li>
          <a href="/deployments/environment-variables">Configure environment variables</a>
        </li>
        <li>
          <a href="/deployments/domains">Set up a custom domain</a>
        </li>
        <li>
          <a href="/analytics">Enable analytics</a>
        </li>
      </ul>
    </article>
  );
}
