"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function CookiePolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-foreground mb-8">
            Cookie Policy
          </h1>
          <p className="text-muted-foreground mb-8">
            Last updated: January 30, 2025
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2>What Are Cookies</h2>
            <p>
              Cookies are small text files that are stored on your computer or mobile device
              when you visit our website. They help us provide you with a better experience
              by remembering your preferences and understanding how you use our services.
            </p>

            <h2>Types of Cookies We Use</h2>

            <h3>Essential Cookies</h3>
            <p>
              These cookies are necessary for the website to function properly. They enable
              core functionality such as security, network management, and accessibility.
              You cannot opt out of these cookies.
            </p>
            <ul>
              <li><strong>Session cookies:</strong> Keep you logged in during your visit</li>
              <li><strong>Security cookies:</strong> Protect against CSRF attacks</li>
              <li><strong>Load balancing cookies:</strong> Ensure consistent performance</li>
            </ul>

            <h3>Analytics Cookies</h3>
            <p>
              These cookies help us understand how visitors interact with our website by
              collecting and reporting information anonymously.
            </p>
            <ul>
              <li><strong>Google Analytics:</strong> Tracks page views, session duration, and user behavior</li>
              <li><strong>Performance monitoring:</strong> Measures page load times and errors</li>
            </ul>

            <h3>Functional Cookies</h3>
            <p>
              These cookies enable enhanced functionality and personalization, such as
              remembering your preferences.
            </p>
            <ul>
              <li><strong>Theme preference:</strong> Remembers your dark/light mode choice</li>
              <li><strong>Language preference:</strong> Stores your preferred language</li>
              <li><strong>Feature flags:</strong> Enables beta features you&apos;ve opted into</li>
            </ul>

            <h3>Marketing Cookies</h3>
            <p>
              These cookies track your online activity to help advertisers deliver more
              relevant advertising or to limit how many times you see an ad.
            </p>
            <ul>
              <li><strong>Attribution tracking:</strong> Helps us understand how you found us</li>
              <li><strong>Retargeting:</strong> Shows relevant ads on other websites</li>
            </ul>

            <h2>How to Control Cookies</h2>
            <p>
              You can control and/or delete cookies as you wish. You can delete all cookies
              that are already on your computer and you can set most browsers to prevent
              them from being placed.
            </p>
            <p>
              To modify your cookie settings, you can:
            </p>
            <ul>
              <li>Use your browser settings to block or delete cookies</li>
              <li>Use browser extensions that manage cookies</li>
              <li>Contact us to request deletion of your data</li>
            </ul>

            <h2>Browser Settings</h2>
            <p>
              Most web browsers allow some control of cookies through browser settings.
              To find out more about cookies, including how to see what cookies have been
              set and how to manage and delete them, visit:
            </p>
            <ul>
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">Apple Safari</a></li>
              <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
            </ul>

            <h2>Third-Party Cookies</h2>
            <p>
              Some of our pages may contain content from third parties, such as YouTube
              videos or social media widgets. These third parties may set their own cookies.
              We do not control these cookies and recommend reviewing the privacy policies
              of these third parties.
            </p>

            <h2>Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time. We will notify you of
              any changes by posting the new policy on this page and updating the
              &quot;Last updated&quot; date.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have any questions about our use of cookies, please contact us at:
            </p>
            <ul>
              <li>Email: <a href="mailto:privacy@cloudify.app">privacy@cloudify.app</a></li>
              <li>Address: 123 Cloud Street, Suite 400, San Francisco, CA 94105</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
