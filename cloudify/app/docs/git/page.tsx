"use client";

import { Github, GitBranch, GitPullRequest, Eye, Rocket, Settings } from "lucide-react";

export default function GitIntegrationPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <h1>Git Integration</h1>

      <p className="lead">
        Cloudify integrates seamlessly with GitHub, GitLab, and Bitbucket to provide
        automatic deployments, preview URLs, and collaborative workflows.
      </p>

      <h2>Connecting Your Repository</h2>

      <p>
        When you create a new project on Cloudify, you can connect it to a Git repository.
        This enables:
      </p>

      <ul>
        <li><strong>Automatic deployments</strong> - Every push to your production branch triggers a new deployment</li>
        <li><strong>Preview deployments</strong> - Every pull request gets its own preview URL</li>
        <li><strong>Deployment status checks</strong> - See deployment status directly in your pull requests</li>
        <li><strong>Commit-based rollbacks</strong> - Roll back to any previous deployment instantly</li>
      </ul>

      <h2>Supported Git Providers</h2>

      <div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
        <div className="p-6 rounded-xl border border-border bg-background text-center">
          <Github className="h-12 w-12 mx-auto mb-4 text-foreground" />
          <h3 className="font-semibold text-foreground">GitHub</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Full integration with GitHub Actions, Checks, and Deployments API
          </p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-background text-center">
          <svg className="h-12 w-12 mx-auto mb-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.845.904c-1.297 0-2.41.753-2.926 1.846l8.08 8.08-8.08 8.08a3.2 3.2 0 002.927 1.846h14.31c1.297 0 2.41-.753 2.926-1.846L13.002 9.83l8.08-8.08A3.2 3.2 0 0019.155.904H4.845z"/>
          </svg>
          <h3 className="font-semibold text-foreground">GitLab</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Support for GitLab.com and self-hosted instances
          </p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-background text-center">
          <svg className="h-12 w-12 mx-auto mb-4 text-[#0070f3]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891H.778zM14.52 15.53H9.522L8.17 8.466h7.561l-1.211 7.064z"/>
          </svg>
          <h3 className="font-semibold text-foreground">Bitbucket</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Integration with Bitbucket Cloud and Pipelines
          </p>
        </div>
      </div>

      <h2>Production Branch</h2>

      <p>
        By default, Cloudify deploys from the <code>main</code> branch (or <code>master</code>
        for older repositories). You can configure a different production branch in your
        project settings.
      </p>

      <p>
        Every push to your production branch triggers a new production deployment. The deployment
        will be automatically promoted to your production domains once the build succeeds.
      </p>

      <h2>Preview Deployments</h2>

      <div className="not-prose p-6 rounded-xl border border-border bg-secondary my-8">
        <div className="flex items-start gap-4">
          <Eye className="h-8 w-8 text-[#0070f3] shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Preview Every Change
            </h3>
            <p className="text-muted-foreground">
              Every pull request automatically gets a unique preview URL. Share with your team
              to review changes before merging to production.
            </p>
          </div>
        </div>
      </div>

      <p>
        Preview deployments are created for:
      </p>

      <ul>
        <li>Pull requests / Merge requests</li>
        <li>Pushes to non-production branches</li>
        <li>Manual deployments from the CLI</li>
      </ul>

      <p>
        Preview URLs follow the pattern: <code>project-name-git-branch-name.cloudify.app</code>
      </p>

      <h2>Deployment Workflow</h2>

      <ol>
        <li>
          <strong>Push to Git</strong> - Make changes and push to your repository
        </li>
        <li>
          <strong>Build triggered</strong> - Cloudify detects the push and starts a build
        </li>
        <li>
          <strong>Status check posted</strong> - A pending status is posted to your PR
        </li>
        <li>
          <strong>Build completes</strong> - Your app is built and deployed to the edge
        </li>
        <li>
          <strong>Status updated</strong> - The status check is updated with the preview URL
        </li>
      </ol>

      <h2>Branch Protection</h2>

      <p>
        Cloudify works with GitHub branch protection rules. You can require:
      </p>

      <ul>
        <li>Successful deployment before merging</li>
        <li>Preview deployment review</li>
        <li>Specific environment approvals</li>
      </ul>

      <h2>Monorepo Support</h2>

      <p>
        For monorepos, you can configure which directory changes should trigger deployments.
        Cloudify supports:
      </p>

      <ul>
        <li><strong>Turborepo</strong> - Automatic detection of affected packages</li>
        <li><strong>Nx</strong> - Integration with Nx affected commands</li>
        <li><strong>Lerna</strong> - Support for Lerna workspaces</li>
        <li><strong>pnpm workspaces</strong> - Native pnpm workspace support</li>
      </ul>

      <h2>Ignored Files</h2>

      <p>
        By default, Cloudify respects your <code>.gitignore</code> file. Additionally, you can
        create a <code>.cloudifyignore</code> file to exclude files specifically from deployments.
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`# .cloudifyignore
node_modules
.env.local
.env.*.local
*.log
.cache`}</code>
      </pre>
    </article>
  );
}
