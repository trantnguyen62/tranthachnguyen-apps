import { CodeBlock } from "@/components/CodeBlock";
import { Callout } from "@/components/Callout";

export default function DomainsPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Custom Domains</h1>

      <p className="lead">
        Connect your own domain to your Cloudify project with automatic SSL.
      </p>

      <h2>Adding a Custom Domain</h2>

      <ol>
        <li>Go to your project settings</li>
        <li>Click &quot;Domains&quot;</li>
        <li>Enter your domain (e.g., <code>example.com</code>)</li>
        <li>Click &quot;Add Domain&quot;</li>
      </ol>

      <h2>DNS Configuration</h2>

      <p>
        After adding your domain, configure your DNS records at your domain
        registrar:
      </p>

      <h3>For apex domains (example.com)</h3>

      <CodeBlock
        code={`Type: A
Name: @
Value: 76.76.21.21`}
        language="text"
      />

      <h3>For subdomains (www.example.com)</h3>

      <CodeBlock
        code={`Type: CNAME
Name: www
Value: cname.cloudify.tranthachnguyen.com`}
        language="text"
      />

      <Callout type="info" title="DNS Propagation">
        DNS changes can take up to 48 hours to propagate, though most changes
        take effect within a few minutes.
      </Callout>

      <h2>SSL Certificates</h2>

      <p>
        Cloudify automatically provisions and renews SSL certificates for your
        custom domains using Let&apos;s Encrypt.
      </p>

      <ul>
        <li>Certificates are issued within minutes of domain verification</li>
        <li>All traffic is automatically redirected to HTTPS</li>
        <li>Certificates are renewed automatically before expiration</li>
      </ul>

      <h3>SSL Status</h3>

      <div className="not-prose my-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
            <span>Pending - DNS not yet verified</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
            <span>Issuing - Certificate being generated</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-400 rounded-full"></span>
            <span>Active - Domain is secure and working</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-400 rounded-full"></span>
            <span>Error - Check DNS configuration</span>
          </div>
        </div>
      </div>

      <h2>Multiple Domains</h2>

      <p>
        You can add multiple domains to a single project. One domain should be
        set as the primary domain:
      </p>

      <ul>
        <li>
          <code>example.com</code> - Primary domain
        </li>
        <li>
          <code>www.example.com</code> - Redirects to primary
        </li>
        <li>
          <code>app.example.com</code> - Also serves the project
        </li>
      </ul>

      <h2>Redirects</h2>

      <p>
        Configure how secondary domains behave:
      </p>

      <ul>
        <li>
          <strong>Redirect</strong> - 301 redirect to primary domain
        </li>
        <li>
          <strong>Proxy</strong> - Serve content directly (same as primary)
        </li>
      </ul>

      <h2>Wildcard Domains</h2>

      <p>
        Wildcard domains (<code>*.example.com</code>) are supported for projects
        that need dynamic subdomains:
      </p>

      <CodeBlock
        code={`Type: CNAME
Name: *
Value: cname.cloudify.tranthachnguyen.com`}
        language="text"
      />

      <Callout type="warning">
        Wildcard SSL certificates require DNS verification via TXT record.
        Follow the instructions in your project settings.
      </Callout>

      <h2>Troubleshooting</h2>

      <h3>Domain stuck on &quot;Pending&quot;</h3>

      <ul>
        <li>Verify your DNS records are correct</li>
        <li>Check for conflicting A or CNAME records</li>
        <li>Wait for DNS propagation (use a tool like dnschecker.org)</li>
      </ul>

      <h3>SSL certificate not issuing</h3>

      <ul>
        <li>Ensure the domain resolves to Cloudify&apos;s servers</li>
        <li>Check that port 80 is accessible for HTTP-01 challenge</li>
        <li>Try removing and re-adding the domain</li>
      </ul>
    </article>
  );
}
