"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-foreground mb-8">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground mb-8">
            Last updated: January 30, 2024
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2>Introduction</h2>
            <p>
              Cloudify, Inc. (&quot;Cloudify,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy and is
              committed to protecting it through our compliance with this policy. This privacy
              policy describes the types of information we may collect from you or that you may
              provide when you visit our website or use our services.
            </p>

            <h2>Information We Collect</h2>
            <h3>Information You Provide</h3>
            <ul>
              <li>Account information (name, email address, password)</li>
              <li>Profile information (company name, job title)</li>
              <li>Payment information (processed securely through our payment provider)</li>
              <li>Communications (support tickets, feedback, surveys)</li>
              <li>Content you deploy through our platform</li>
            </ul>

            <h3>Information Collected Automatically</h3>
            <ul>
              <li>Usage data (pages visited, features used, actions taken)</li>
              <li>Device information (browser type, operating system, device type)</li>
              <li>Log data (IP address, access times, referring URLs)</li>
              <li>Cookies and similar technologies</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent fraudulent transactions</li>
              <li>Personalize and improve your experience</li>
            </ul>

            <h2>Information Sharing</h2>
            <p>
              We do not sell your personal information. We may share information with:
            </p>
            <ul>
              <li>Service providers who assist in our operations</li>
              <li>Professional advisors (lawyers, accountants, auditors)</li>
              <li>Law enforcement when required by law</li>
              <li>Other parties in connection with a company transaction</li>
            </ul>

            <h2>Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your
              personal information, including:
            </p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and penetration testing</li>
              <li>Access controls and authentication requirements</li>
              <li>Employee training on data protection</li>
              <li>SOC 2 Type II compliance</li>
            </ul>

            <h2>Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the
              purposes for which it was collected, including to satisfy legal, accounting,
              or reporting requirements. When you delete your account, we will delete or
              anonymize your personal information within 30 days.
            </p>

            <h2>Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your personal information</li>
              <li>Object to processing of your information</li>
              <li>Port your data to another service</li>
              <li>Withdraw consent</li>
            </ul>

            <h2>Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to collect and track information
              about your browsing activities. You can control cookies through your browser
              settings and other tools. For more information, see our Cookie Policy.
            </p>

            <h2>International Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than
              your own. We ensure appropriate safeguards are in place to protect your
              information in accordance with this privacy policy.
            </p>

            <h2>Children&apos;s Privacy</h2>
            <p>
              Our services are not intended for children under 16 years of age. We do not
              knowingly collect personal information from children under 16.
            </p>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any
              changes by posting the new policy on this page and updating the &quot;Last updated&quot;
              date.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have questions about this privacy policy or our privacy practices,
              please contact us at:
            </p>
            <ul>
              <li>Email: privacy@cloudify.app</li>
              <li>Address: 123 Cloud Street, San Francisco, CA 94105</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
