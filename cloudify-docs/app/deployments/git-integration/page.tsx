import { CodeBlock } from "@/components/CodeBlock";
import { Callout } from "@/components/Callout";

export default function GitIntegrationPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Git Integration</h1>

      <p className="lead">
        Connect your GitHub repository for automatic deployments on every push.
      </p>

      <h2>Connecting GitHub</h2>

      <p>
        Cloudify uses OAuth to connect to your GitHub account. When you first
        sign in or create a project, you&apos;ll be asked to authorize Cloudify to
        access your repositories.
      </p>

      <h3>Required Permissions</h3>

      <ul>
        <li>
          <strong>Read access to code</strong> - To clone and build your
          repository
        </li>
        <li>
          <strong>Read access to metadata</strong> - To list your repositories
        </li>
        <li>
          <strong>Webhooks</strong> - To trigger deployments on push events
        </li>
      </ul>

      <Callout type="info" title="Private Repositories">
        You can deploy from private repositories. Cloudify only accesses
        repositories you explicitly select.
      </Callout>

      <h2>Automatic Deployments</h2>

      <p>
        Once connected, Cloudify automatically creates a webhook in your
        repository. This triggers deployments when:
      </p>

      <ul>
        <li>You push to the production branch (main/master)</li>
        <li>You push to any other branch</li>
        <li>A pull request is opened or updated</li>
      </ul>

      <h2>Branch Configuration</h2>

      <p>
        By default, Cloudify treats <code>main</code> or <code>master</code> as
        your production branch. You can change this in project settings.
      </p>

      <CodeBlock
        code={`# Production branch (default)
main

# Alternative production branches
master
production
release`}
        language="text"
      />

      <h2>Monorepo Support</h2>

      <p>
        If your repository contains multiple projects, you can specify a root
        directory:
      </p>

      <CodeBlock
        code={`# Example monorepo structure
my-monorepo/
├── apps/
│   ├── web/        ← Deploy this
│   └── admin/
├── packages/
└── package.json

# Set root directory in project settings
Root Directory: apps/web`}
        language="text"
      />

      <h2>Ignoring Deployments</h2>

      <p>
        You can skip deployments for specific commits by including{" "}
        <code>[skip ci]</code> or <code>[ci skip]</code> in your commit message:
      </p>

      <CodeBlock
        code={`git commit -m "Update README [skip ci]"`}
        language="bash"
      />

      <h2>Troubleshooting</h2>

      <h3>Repository not showing?</h3>

      <ul>
        <li>
          Make sure you&apos;ve granted Cloudify access in GitHub Settings →
          Applications
        </li>
        <li>Try disconnecting and reconnecting your GitHub account</li>
        <li>Check if the repository is in an organization that requires
          approval</li>
      </ul>

      <h3>Deployments not triggering?</h3>

      <ul>
        <li>Check the webhook in your repository settings</li>
        <li>Verify the webhook URL is active and delivering</li>
        <li>Ensure you&apos;re pushing to a tracked branch</li>
      </ul>
    </article>
  );
}
