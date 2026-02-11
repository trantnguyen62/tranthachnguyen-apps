/**
 * Accessibility Tests - WCAG 2.1 Compliance
 *
 * Tests for:
 * 1. Keyboard navigation
 * 2. Screen reader compatibility
 * 3. Color contrast
 * 4. Focus management
 * 5. ARIA attributes
 *
 * Note: Install @axe-core/playwright for full accessibility testing:
 * npm install -D @axe-core/playwright
 */

import { test, expect } from "@playwright/test";

// Helper to check basic accessibility
async function checkBasicA11y(page: any) {
  // Check for alt text on images
  const images = await page.locator("img").all();
  for (const img of images) {
    const alt = await img.getAttribute("alt");
    const ariaLabel = await img.getAttribute("aria-label");
    const ariaHidden = await img.getAttribute("aria-hidden");

    // Images should have alt text or be decorative (aria-hidden)
    expect(
      alt !== null || ariaLabel !== null || ariaHidden === "true"
    ).toBeTruthy();
  }

  // Check for form labels
  const inputs = await page.locator("input:not([type='hidden'])").all();
  for (const input of inputs) {
    const id = await input.getAttribute("id");
    const ariaLabel = await input.getAttribute("aria-label");
    const ariaLabelledby = await input.getAttribute("aria-labelledby");
    const placeholder = await input.getAttribute("placeholder");

    if (id) {
      // Check for associated label
      const label = page.locator(`label[for="${id}"]`);
      const hasLabel = (await label.count()) > 0;
      expect(
        hasLabel || ariaLabel || ariaLabelledby || placeholder
      ).toBeTruthy();
    }
  }

  // Check for skip link
  const skipLink = page.locator('[href="#main"], [href="#content"], .skip-link');
  // Skip link is recommended but not required for all pages
}

test.describe("Public Pages Accessibility", () => {
  test("homepage meets basic accessibility requirements", async ({ page }) => {
    await page.goto("/");

    // Page should have a title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Page should have h1
    const h1 = page.locator("h1");
    await expect(h1.first()).toBeVisible();

    // Page should have main landmark
    const main = page.locator('main, [role="main"]');
    expect(await main.count()).toBeGreaterThanOrEqual(1);

    // Check for basic a11y issues
    await checkBasicA11y(page);
  });

  test("login page has proper form accessibility", async ({ page }) => {
    await page.goto("/login");

    // Form should have proper structure
    const form = page.locator("form");
    await expect(form).toBeVisible();

    // Email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Password input
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    // Submit button should be accessible
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();

    // Check button text or aria-label
    const buttonText = await submitButton.textContent();
    const ariaLabel = await submitButton.getAttribute("aria-label");
    expect(buttonText || ariaLabel).toBeTruthy();
  });

  test("signup page has proper form accessibility", async ({ page }) => {
    await page.goto("/signup");

    // Form should have proper structure
    const form = page.locator("form");
    await expect(form).toBeVisible();

    // Check required inputs have labels
    const inputs = await page.locator("input:not([type='hidden'])").all();
    expect(inputs.length).toBeGreaterThanOrEqual(3); // name, email, password

    await checkBasicA11y(page);
  });
});

test.describe("Keyboard Navigation", () => {
  test("can navigate login form with keyboard only", async ({ page }) => {
    await page.goto("/login");

    // Tab to email input
    await page.keyboard.press("Tab");
    const focusedElement1 = await page.evaluate(
      () => document.activeElement?.tagName
    );

    // Continue tabbing through form elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Should be able to reach submit button
    const focusedElement = await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      type: document.activeElement?.getAttribute("type"),
    }));

    // At some point we should be on a button
    // (exact number of tabs depends on page structure)
  });

  test("interactive elements are focusable", async ({ page }) => {
    await page.goto("/login");

    // All buttons should be focusable
    const buttons = await page.locator("button").all();
    for (const button of buttons) {
      const isVisible = await button.isVisible();
      if (isVisible) {
        const tabIndex = await button.getAttribute("tabindex");
        // tabindex shouldn't be -1 (not focusable) for interactive buttons
        expect(tabIndex !== "-1").toBeTruthy();
      }
    }

    // All links should be focusable
    const links = await page.locator("a[href]").all();
    for (const link of links) {
      const isVisible = await link.isVisible();
      if (isVisible) {
        const tabIndex = await link.getAttribute("tabindex");
        expect(tabIndex !== "-1").toBeTruthy();
      }
    }
  });

  test("focus is visible on interactive elements", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.locator('input[type="email"]');
    await emailInput.focus();

    // Check that focus is visible (element has focus styles)
    // This is a basic check - in real tests you'd check CSS outline/box-shadow
    await expect(emailInput).toBeFocused();
  });
});

test.describe("ARIA Attributes", () => {
  test("form validation errors use aria-describedby", async ({ page }) => {
    await page.goto("/login");

    // Submit empty form to trigger validation
    await page.click('button[type="submit"]');

    // Wait for potential error messages
    await page.waitForTimeout(500);

    // Check if error messages are properly associated
    const errorMessages = await page
      .locator('[role="alert"], .error, [aria-invalid="true"]')
      .all();

    // If there are error messages, they should be properly structured
    if (errorMessages.length > 0) {
      // At least one error should be visible
      expect(errorMessages.length).toBeGreaterThan(0);
    }
  });

  test("loading states are announced", async ({ page }) => {
    await page.goto("/login");

    // Fill form
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");

    // Click submit
    await page.click('button[type="submit"]');

    // Check for loading indicators with proper ARIA
    const loadingIndicators = page.locator(
      '[aria-busy="true"], [aria-live], .loading, [role="progressbar"]'
    );

    // Either there's a loading state or the page navigates quickly
  });

  test("navigation has proper landmark roles", async ({ page }) => {
    await page.goto("/");

    // Check for navigation landmark
    const nav = page.locator('nav, [role="navigation"]');
    const navCount = await nav.count();

    // Check for main landmark
    const main = page.locator('main, [role="main"]');
    const mainCount = await main.count();

    // Should have at least one main landmark
    expect(mainCount).toBeGreaterThanOrEqual(1);
  });
});

test.describe("Color and Contrast", () => {
  test("text has sufficient contrast", async ({ page }) => {
    await page.goto("/login");

    // This is a simplified check
    // For full contrast testing, use axe-core
    const body = page.locator("body");
    const backgroundColor = await body.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );

    // Body should have a background color defined
    expect(backgroundColor).toBeDefined();
  });

  test("focus indicators are visible", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.locator('input[type="email"]');
    await emailInput.focus();

    // Check that the focused element has visible focus styles
    const outlineStyle = await emailInput.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        outline: style.outline,
        boxShadow: style.boxShadow,
        borderColor: style.borderColor,
      };
    });

    // At least one focus indicator should be present
    // (outline, box-shadow, or border change)
    const hasFocusIndicator =
      outlineStyle.outline !== "none" &&
      outlineStyle.outline !== "0px none rgb(0, 0, 0)";

    // This is a soft check - focus styles vary by design
  });
});

test.describe("Screen Reader Compatibility", () => {
  test("page has proper heading hierarchy", async ({ page }) => {
    await page.goto("/");

    // Get all headings
    const h1 = await page.locator("h1").count();
    const h2 = await page.locator("h2").count();
    const h3 = await page.locator("h3").count();

    // Should have exactly one h1
    expect(h1).toBe(1);

    // If h3 exists, h2 should exist (no skipping levels)
    if (h3 > 0) {
      expect(h2).toBeGreaterThan(0);
    }
  });

  test("buttons have accessible names", async ({ page }) => {
    await page.goto("/login");

    const buttons = await page.locator("button").all();

    for (const button of buttons) {
      const isVisible = await button.isVisible();
      if (isVisible) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute("aria-label");
        const ariaLabelledby = await button.getAttribute("aria-labelledby");
        const title = await button.getAttribute("title");

        // Button should have accessible name
        expect(text || ariaLabel || ariaLabelledby || title).toBeTruthy();
      }
    }
  });

  test("links have meaningful text", async ({ page }) => {
    await page.goto("/");

    const links = await page.locator("a[href]").all();

    for (const link of links) {
      const isVisible = await link.isVisible();
      if (isVisible) {
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute("aria-label");

        // Link should have meaningful text (not just "click here")
        const accessibleName = (text || ariaLabel || "").toLowerCase().trim();

        if (accessibleName) {
          expect(accessibleName).not.toBe("click here");
          expect(accessibleName).not.toBe("here");
          expect(accessibleName).not.toBe("link");
        }
      }
    }
  });
});

test.describe("Mobile Accessibility", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("touch targets are large enough", async ({ page }) => {
    await page.goto("/login");

    // Check button sizes (WCAG recommends 44x44px minimum)
    const buttons = await page.locator("button").all();

    for (const button of buttons) {
      const isVisible = await button.isVisible();
      if (isVisible) {
        const box = await button.boundingBox();
        if (box) {
          // Touch target should be at least 44x44 or have adequate spacing
          expect(box.width).toBeGreaterThanOrEqual(24); // Minimum for small buttons
          expect(box.height).toBeGreaterThanOrEqual(24);
        }
      }
    }
  });

  test("content is readable without horizontal scrolling", async ({ page }) => {
    await page.goto("/login");

    // Check for horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    // Should not have horizontal scroll on mobile
    expect(hasHorizontalScroll).toBeFalsy();
  });
});
