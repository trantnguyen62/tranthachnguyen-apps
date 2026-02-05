# Cloudify Docs Frontend Redesign

**Date:** 2026-02-04
**Status:** Approved
**Style:** Apple-inspired (premium, spacious, elegant)

## Overview

A comprehensive redesign of the Cloudify documentation frontend covering visual polish, UX improvements, and new features. The goal is to create a premium, modern documentation experience that matches the quality of the Cloudify platform.

---

## 1. Visual Design System

### Typography
- **Headlines:** SF Pro Display (Inter fallback)
  - h1: 48px, font-weight 600, letter-spacing -0.02em
  - h2: 36px, font-weight 600, letter-spacing -0.02em
  - h3: 24px, font-weight 600
  - h4: 20px, font-weight 600
- **Body:** 18px, line-height 1.7, font-weight 400
- **Code:** 15px, SF Mono or JetBrains Mono

### Spacing
- Content max-width: 720px (narrower for readability)
- Section padding: 80px vertical (desktop), 48px (mobile)
- Card padding: 32px minimum
- Component gaps: 24px standard, 16px compact

### Colors

**Light Mode:**
```css
--background: #FFFFFF
--foreground: #1d1d1f
--muted: #86868b
--border: #d2d2d7
--accent: #0071e3
--accent-hover: #0077ed
--card: #fbfbfd
--code-bg: #1d1d1f
```

**Dark Mode:**
```css
--background: #000000
--foreground: #f5f5f7
--muted: #86868b
--border: #424245
--accent: #2997ff
--accent-hover: #4dacff
--card: #1c1c1e
--code-bg: #1d1d1f
```

### Animations
- Default transition: 300ms ease
- Hover transitions: 200ms ease
- Modal animations: Spring (stiffness: 400, damping: 30)
- Scroll reveal: Fade up, 400ms, staggered 50ms

### Visual Elements
- Border radius: 12px (cards), 8px (buttons), 6px (inputs)
- Shadows: Minimal, soft (0 4px 12px rgba(0,0,0,0.08))
- Frosted glass: backdrop-blur(20px) with semi-transparent background
- Hover lift: translateY(-2px) with enhanced shadow

---

## 2. Layout & Navigation

### Sidebar (260px fixed)
- Frosted glass background
- Logo with subtle hover glow
- Navigation items:
  - 15px font size
  - 44px touch targets
  - No background default state
  - Active: Subtle pill background (#f5f5f5 / #2a2a2a)
- Section headers: 11px uppercase, muted, 32px top margin
- Collapse arrows: 200ms rotation animation
- Sticky "Go to Dashboard" button at bottom

### Top Bar (56px)
- Frosted glass, appears on scroll
- Left: Breadcrumb navigation
- Right: Search trigger (⌘K), dark mode toggle, GitHub link
- Mobile: Hamburger menu

### Content Area
- 720px max-width, centered
- Right margin for "On This Page" TOC
- Smooth scroll with fixed header offset

### Mobile
- Full-width, 24px horizontal padding
- Bottom navigation bar (Search, Menu, Dark Mode)
- Swipe gestures for sidebar
- 48px minimum touch targets

---

## 3. Command Palette (⌘K Search)

### Trigger
- Keyboard: ⌘K (Mac) / Ctrl+K (Windows)
- Visual: Search bar in top bar with ⌘K badge
- Modal: Centered, frosted glass backdrop

### Modal Design
- Width: 560px
- Large input: 18px font, no border, bottom divider
- Placeholder: "Search documentation..."
- Debounced search: 150ms

### Results
- Grouped by section
- Shows: Title, excerpt with highlight, section badge
- Keyboard nav: Arrows, Enter, Esc
- Focus: Blue left border indicator
- Max 8 visible, scrollable

### Implementation
- **Library:** Flexsearch
- **Index:** Built at build time from page content
- **Features:** Fuzzy matching, recent searches (localStorage)

### Quick Actions
- Toggle dark mode
- Go to Dashboard
- View API Reference

---

## 4. Code Blocks & Interactive Examples

### Code Block Redesign
- Full-width, 16px padding
- Dark theme in both modes
- Language badge: Top-left, 11px uppercase
- Syntax highlighting: Shiki (activate existing dependency)

### Copy Button
- Position: Top-right, hover reveal (always on mobile)
- States: Copy icon → Check icon → "Copied!" tooltip
- Auto-dismiss: 2 seconds

### Playground Component (New)
```tsx
<Playground
  code={initialCode}
  language="typescript"
  preview={true}
/>
```
- Two-pane: Editor left, preview right
- Edit button: Transforms to editable
- Run button: Executes code
- Reset button: Restores original
- Sandbox: iframe for safe execution

### API Try-It Panel
- Expandable "Try it" section on API pages
- Pre-filled example requests
- Input fields for parameters
- Send button with loading state
- Response: Syntax highlighted with timing
- Optional: Real API integration with auth

---

## 5. Dark Mode & Theme

### Toggle
- Location: Top bar, icon button
- Icons: Sun (light) / Moon (dark) with rotation animation
- Transition: 300ms on all colors
- Persistence: localStorage
- Default: Respects system preference

### Implementation
```tsx
// lib/theme.tsx
const ThemeContext = createContext<{
  theme: 'light' | 'dark'
  toggle: () => void
}>()

// Apply class to <html> element
// CSS variables handle all color changes
```

---

## 6. Feedback System

### Page Feedback
- Location: Bottom of page content
- Question: "Was this page helpful?"
- Buttons: Thumbs up / Thumbs down
- On click: "Thanks for your feedback!"
- Thumbs down: Optional textarea "How can we improve?"
- Storage: localStorage (backend integration later)

### Additional UX

**Table of Contents (Right Sidebar)**
- Width: 200px on desktop
- Auto-highlights current section on scroll
- Smooth scroll on click

**Edit Link**
- "Edit this page on GitHub"
- Links to source file in repo

**Page Navigation**
- Previous / Next at page bottom
- Large click targets
- Shows page title + section label

---

## 7. Component Architecture

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CommandPalette.tsx` | `/components/navigation` | ⌘K search modal |
| `ThemeToggle.tsx` | `/components/ui` | Dark/light switcher |
| `ThemeProvider.tsx` | `/components/providers` | Theme context |
| `TopBar.tsx` | `/components/navigation` | Sticky header |
| `Breadcrumbs.tsx` | `/components/navigation` | Path display |
| `Playground.tsx` | `/components/content` | Interactive code |
| `ApiTryIt.tsx` | `/components/content` | API testing |
| `Feedback.tsx` | `/components/content` | Page rating |
| `TableOfContents.tsx` | `/components/layout` | Right sidebar TOC |
| `PageNav.tsx` | `/components/layout` | Prev/Next links |
| `SearchProvider.tsx` | `/components/providers` | Search context |

### Updated Components

| Component | Changes |
|-----------|---------|
| `Sidebar.tsx` | Frosted glass, new styling, animations |
| `CodeBlock.tsx` | Shiki integration, copy button redesign |
| `Callout.tsx` | Updated styling to match system |
| `APIReference.tsx` | Add Try-It integration |

### File Structure
```
/components
  /ui
    Button.tsx
    Modal.tsx
    Input.tsx
    ThemeToggle.tsx
  /navigation
    Sidebar.tsx
    TopBar.tsx
    Breadcrumbs.tsx
    CommandPalette.tsx
  /content
    CodeBlock.tsx
    Playground.tsx
    ApiTryIt.tsx
    Callout.tsx
    Feedback.tsx
  /layout
    PageWrapper.tsx
    TableOfContents.tsx
    PageNav.tsx
  /providers
    ThemeProvider.tsx
    SearchProvider.tsx
/lib
  /search
    index.ts        # Search index builder
    useSearch.ts    # Search hook
  /theme
    context.ts      # Theme context
    utils.ts        # Theme utilities
/styles
  globals.css       # CSS variables, base styles
```

---

## 8. Dependencies

### New
```json
{
  "flexsearch": "^0.7.43",
  "framer-motion": "^11.0.0",
  "@uiw/react-textarea-code-editor": "^3.0.0"
}
```

### Existing (to activate)
- `shiki` - Already installed, needs integration

---

## 9. Implementation Order

### Phase 1: Foundation
1. Set up CSS variables and theme system
2. Create ThemeProvider and ThemeToggle
3. Update Tailwind config with new design tokens
4. Create base UI components (Button, Modal, Input)

### Phase 2: Layout
5. Redesign Sidebar with new styling
6. Create TopBar with breadcrumbs
7. Implement responsive mobile navigation
8. Add TableOfContents component

### Phase 3: Search
9. Set up Flexsearch and build index
10. Create CommandPalette component
11. Add keyboard shortcuts
12. Implement recent searches

### Phase 4: Content
13. Upgrade CodeBlock with Shiki
14. Improve copy button UX
15. Create Playground component
16. Add ApiTryIt panel

### Phase 5: Polish
17. Add Feedback component
18. Create PageNav (prev/next)
19. Add scroll animations with Framer Motion
20. Final responsive testing and fixes

---

## 10. Success Criteria

- [ ] Apple-style visual aesthetic achieved
- [ ] Dark mode works flawlessly with smooth transitions
- [ ] ⌘K search finds content instantly with fuzzy matching
- [ ] Code blocks have syntax highlighting and easy copy
- [ ] At least one interactive Playground example works
- [ ] Feedback system captures user input
- [ ] Mobile experience is fully functional
- [ ] Lighthouse performance score > 90
- [ ] All existing pages render correctly with new design
