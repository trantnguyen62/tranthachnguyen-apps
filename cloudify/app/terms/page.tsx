"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Terms of Service
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Last updated: January 30, 2024
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Cloudify&apos;s services, you agree to be bound by these
              Terms of Service and all applicable laws and regulations. If you do not agree
              with any of these terms, you are prohibited from using or accessing our services.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Cloudify provides a cloud platform for deploying, hosting, and scaling web
              applications. Our services include but are not limited to:
            </p>
            <ul>
              <li>Web application hosting and deployment</li>
              <li>Serverless functions</li>
              <li>Edge network distribution</li>
              <li>Domain management</li>
              <li>Analytics and monitoring</li>
              <li>CI/CD integration</li>
            </ul>

            <h2>3. Account Registration</h2>
            <p>
              To use our services, you must create an account. You agree to:
            </p>
            <ul>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h2>4. Acceptable Use</h2>
            <p>You agree not to use our services to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Distribute malware or harmful code</li>
              <li>Send spam or unsolicited communications</li>
              <li>Engage in cryptocurrency mining</li>
              <li>Host content that is illegal, harmful, or offensive</li>
              <li>Interfere with or disrupt our services</li>
              <li>Attempt to gain unauthorized access to our systems</li>
            </ul>

            <h2>5. Payment Terms</h2>
            <p>
              Paid services are billed in advance on a monthly or annual basis. You agree to:
            </p>
            <ul>
              <li>Pay all fees associated with your chosen plan</li>
              <li>Provide valid payment information</li>
              <li>Accept automatic renewal unless canceled</li>
              <li>Pay any applicable taxes</li>
            </ul>
            <p>
              Refunds are provided at our discretion. We reserve the right to change our
              pricing with 30 days notice.
            </p>

            <h2>6. Service Level Agreement</h2>
            <p>
              For paid plans, we provide a 99.99% uptime SLA. If we fail to meet this
              commitment, you may be eligible for service credits as described in our
              SLA documentation.
            </p>

            <h2>7. Intellectual Property</h2>
            <p>
              You retain ownership of all content you deploy through our services. By using
              our services, you grant us a license to host, store, and display your content
              as necessary to provide the services.
            </p>
            <p>
              Cloudify and its associated logos, designs, and features are trademarks of
              Cloudify, Inc. You may not use our trademarks without written permission.
            </p>

            <h2>8. Data Protection</h2>
            <p>
              We process your data in accordance with our Privacy Policy. For customers
              subject to GDPR, we offer a Data Processing Agreement upon request.
            </p>

            <h2>9. Termination</h2>
            <p>
              Either party may terminate this agreement at any time. Upon termination:
            </p>
            <ul>
              <li>Your access to services will be revoked</li>
              <li>Your data will be deleted within 30 days</li>
              <li>Outstanding fees remain due</li>
              <li>Provisions that should survive termination will remain in effect</li>
            </ul>
            <p>
              We may suspend or terminate your account immediately if you violate these terms.
            </p>

            <h2>10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Cloudify shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, including
              loss of profits, data, or business opportunities.
            </p>
            <p>
              Our total liability shall not exceed the amount paid by you in the 12 months
              preceding the claim.
            </p>

            <h2>11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Cloudify from any claims, damages,
              or expenses arising from your use of our services or violation of these terms.
            </p>

            <h2>12. Changes to Terms</h2>
            <p>
              We may modify these terms at any time. We will provide notice of material
              changes via email or through our services. Continued use after changes
              constitutes acceptance of the new terms.
            </p>

            <h2>13. Governing Law</h2>
            <p>
              These terms are governed by the laws of the State of California, without
              regard to conflict of law principles. Any disputes shall be resolved in the
              courts of San Francisco County, California.
            </p>

            <h2>14. Contact</h2>
            <p>
              For questions about these terms, contact us at:
            </p>
            <ul>
              <li>Email: legal@cloudify.app</li>
              <li>Address: 123 Cloud Street, San Francisco, CA 94105</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
