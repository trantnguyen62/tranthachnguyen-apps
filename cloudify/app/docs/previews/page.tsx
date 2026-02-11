"use client";

import { Eye, GitPullRequest, MessageSquare, Shield, Share2 } from "lucide-react";

export default function PreviewsPage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <h1>Preview Deployments</h1>

      <p className="lead">
        Every pull request and branch automatically gets its own preview URL.
        Review changes in a production-like environment before merging.
      </p>

      <div className="not-prose p-6 rounded-xl border border-border bg-secondary my-8">
        <div className="flex items-start gap-4">
          <Eye className="h-8 w-8 text-[#0070f3] shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground text-lg mb-2">
              Preview Every Change
            </h3>
            <p className="text-muted-foreground">
              Cloudify creates a unique URL for every push to a non-production branch.
              Share with your team for instant feedback.
            </p>
          </div>
        </div>
      </div>

      <h2>How It Works</h2>

      <ol>
        <li>
          <strong>Push to a branch</strong> - Make changes and push to any branch except your production branch
        </li>
        <li>
          <strong>Automatic build</strong> - Cloudify detects the push and starts building
        </li>
        <li>
          <strong>Preview URL generated</strong> - A unique URL is created for this deployment
        </li>
        <li>
          <strong>Status posted to PR</strong> - The preview URL is added as a comment and status check
        </li>
      </ol>

      <h2>Preview URLs</h2>

      <p>
        Preview URLs follow a consistent pattern that includes your project name and branch:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`# Pattern
https://<project>-git-<branch>-<team>.cloudify.app

# Examples
https://my-app-git-feature-login-acme.cloudify.app
https://my-app-git-fix-bug-123-acme.cloudify.app
https://my-app-abc123def.cloudify.app  # Commit-based`}</code>
      </pre>

      <h2>GitHub Integration</h2>

      <p>
        When connected to GitHub, Cloudify automatically:
      </p>

      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        <div className="p-4 rounded-lg border border-border bg-background">
          <GitPullRequest className="h-6 w-6 text-green-500 mb-2" />
          <h4 className="font-semibold text-foreground">Status Checks</h4>
          <p className="text-sm text-muted-foreground">
            Adds deployment status to your PR with a link to the preview
          </p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-background">
          <MessageSquare className="h-6 w-6 text-[#0070f3] mb-2" />
          <h4 className="font-semibold text-foreground">PR Comments</h4>
          <p className="text-sm text-muted-foreground">
            Posts a comment with the preview URL and deployment details
          </p>
        </div>
      </div>

      <h2>Preview Features</h2>

      <h3>Instant Updates</h3>
      <p>
        Push again to the same branch and the preview URL updates automatically.
        No need to share a new link - your reviewers always see the latest version.
      </p>

      <h3>Environment Variables</h3>
      <p>
        Previews use Preview environment variables by default. Configure separate
        values for preview deployments to:
      </p>
      <ul>
        <li>Use test API keys instead of production</li>
        <li>Point to staging databases</li>
        <li>Enable debug features</li>
      </ul>

      <h3>Branch-Specific Variables</h3>
      <p>
        Override environment variables for specific branches:
      </p>
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`# In dashboard: Settings → Environment Variables
Variable: API_URL
Value: https://staging-api.example.com
Branch: feature/*`}</code>
      </pre>

      <h2>Protecting Previews</h2>

      <div className="not-prose p-6 rounded-xl border border-border bg-background my-8">
        <div className="flex items-start gap-4">
          <Shield className="h-8 w-8 text-orange-500 shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground text-lg mb-2">
              Password Protection
            </h3>
            <p className="text-muted-foreground mb-4">
              Add a password to your preview deployments to prevent unauthorized access.
              Available on Pro and Enterprise plans.
            </p>
            <p className="text-sm text-muted-foreground">
              Settings → General → Password Protection
            </p>
          </div>
        </div>
      </div>

      <h3>Cloudify Authentication</h3>
      <p>
        Require viewers to log in with Cloudify to access previews. Useful for:
      </p>
      <ul>
        <li>Internal tools that shouldn&apos;t be publicly accessible</li>
        <li>Projects with sensitive data</li>
        <li>Limiting access to team members only</li>
      </ul>

      <h2>Preview Comments</h2>

      <p>
        Enable comments on preview deployments to collect feedback directly on the page:
      </p>

      <ol>
        <li>Navigate to Settings → Comments</li>
        <li>Enable &quot;Preview Comments&quot;</li>
        <li>Reviewers can click anywhere on the preview to leave a comment</li>
        <li>Comments are synced back to your GitHub PR</li>
      </ol>

      <h2>Sharing Previews</h2>

      <div className="not-prose p-4 rounded-lg border border-border bg-background my-8">
        <div className="flex items-center gap-3">
          <Share2 className="h-6 w-6 text-purple-500" />
          <div>
            <p className="text-foreground font-medium">
              Share preview URLs with anyone
            </p>
            <p className="text-sm text-muted-foreground">
              Stakeholders, designers, and clients can review without needing a Cloudify account
            </p>
          </div>
        </div>
      </div>

      <h2>Configuration</h2>

      <h3>Disable Previews for Specific Branches</h3>

      <p>
        In your project settings, you can configure which branches trigger preview deployments:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "preview": true
    }
  },
  "ignoreCommand": "git diff --quiet HEAD^ HEAD ./packages/app"
}`}</code>
      </pre>

      <h3>Skip Builds</h3>

      <p>
        Include <code>[skip ci]</code> or <code>[cloudify skip]</code> in your commit message
        to skip the preview deployment:
      </p>

      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
        <code>{`git commit -m "Update README [skip ci]"`}</code>
      </pre>

      <h2>Preview Limits</h2>

      <table>
        <thead>
          <tr>
            <th>Plan</th>
            <th>Active Previews</th>
            <th>Preview Retention</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Hobby</td>
            <td>Unlimited</td>
            <td>7 days after branch deletion</td>
          </tr>
          <tr>
            <td>Pro</td>
            <td>Unlimited</td>
            <td>30 days after branch deletion</td>
          </tr>
          <tr>
            <td>Enterprise</td>
            <td>Unlimited</td>
            <td>Custom retention</td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}
