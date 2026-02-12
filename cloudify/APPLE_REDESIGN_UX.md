# Cloudify Apple-Style UX Redesign Specification

**Author**: Senior Product Owner, 20 years at Apple (Design Systems, Human Interface, Developer Tools)
**Date**: February 12, 2026
**Scope**: Complete frontend/UX audit and redesign specification
**Philosophy**: Every pixel earns its place. Every interaction tells a story. Every transition communicates state.

---

## Table of Contents

1. [Design System Overhaul](#1-design-system-overhaul)
2. [Page-by-Page Redesign](#2-page-by-page-redesign)
3. [Component Library Redesign](#3-component-library-redesign)
4. [Interaction Design](#4-interaction-design)
5. [Landing Page Apple Redesign](#5-landing-page-apple-redesign)

---

## Apple Design Principles Applied

| Principle | How It Applies to Cloudify |
|-----------|---------------------------|
| **Simplicity** | Strip every page to its essential action. Remove visual noise. One primary action per view. |
| **Clarity** | Typography creates hierarchy without decoration. Information is scannable in under 2 seconds. |
| **Deference** | The UI recedes; the user's content (projects, deployments, code) takes center stage. |
| **Depth** | Layering through elevation, blur, and translucency creates spatial understanding. |
| **Consistency** | Every component behaves identically across every page. No one-off styling. |
| **Attention to Detail** | Sub-pixel alignment. Optical balance over mathematical centering. Micro-interactions on every state change. |
| **Performance as UX** | Skeleton states feel intentional, not broken. Transitions never block interaction. Perceived speed through progressive reveal. |
| **Accessibility** | WCAG 2.1 AA minimum. Focus rings that are beautiful, not bolted on. VoiceOver-first navigation architecture. |

---

## 1. Design System Overhaul

### 1.1 Typography Scale

**Current Problem**: The app uses Geist Sans/Mono but has no disciplined type scale. Font sizes are applied ad-hoc across pages (`text-sm`, `text-lg`, `text-4xl`) with no rhythm. Headings on the dashboard use `text-2xl font-bold` while the settings page uses `text-xl font-semibold` for the same hierarchical level.

**Apple Approach**: A modular type scale with exactly 8 sizes, each with a defined role. No size is used outside its role.

```css
/* Type Scale - 1.200 Minor Third ratio */
--text-caption:    11px;   /* Metadata, timestamps, keyboard shortcuts */
--text-footnote:   13px;   /* Secondary labels, helper text, table cells */
--text-body:       15px;   /* Primary body text, form labels, nav items */
--text-callout:    16px;   /* Emphasized body, card titles, tab labels */
--text-headline:   17px;   /* Section headers within a page */
--text-title-3:    20px;   /* Card group headers, sidebar section titles */
--text-title-2:    24px;   /* Page subtitles, dialog titles */
--text-title-1:    28px;   /* Page titles only */
--text-large-title: 34px;  /* Landing page only, never in dashboard */

/* Letter spacing */
--tracking-tight:  -0.022em;  /* title-1, title-2 */
--tracking-normal:  0;         /* body, callout, headline */
--tracking-wide:    0.02em;    /* caption, footnote */
--tracking-widest:  0.06em;    /* ALL-CAPS labels only */

/* Line height */
--leading-tight:   1.2;   /* Titles */
--leading-normal:  1.5;   /* Body text */
--leading-relaxed: 1.6;   /* Long-form content, descriptions */

/* Font weights - only 4 */
--weight-regular:  400;
--weight-medium:   500;
--weight-semibold: 600;
--weight-bold:     700;   /* Reserved for large-title and title-1 only */
```

**Rules**:
- `font-bold` is ONLY used on `title-1` and `large-title`. Every other heading uses `font-semibold`.
- `font-medium` is used for interactive labels (buttons, tabs, nav items).
- Body text is always `font-regular`.
- ALL-CAPS text uses `tracking-widest` and `font-semibold` at `caption` size. Never larger than `footnote`.

### 1.2 Color System

**Current Problem**: The color system is essentially Vercel's palette -- monochrome with `#0070f3` as accent. Status colors (green, yellow, red) are applied inconsistently. Badge variants define their own color palettes outside the design system. Dark mode uses pure `#000000` as background, which creates harsh contrast and eye strain.

**Apple Approach**: A unified semantic color system with optical dark mode adjustments.

```css
:root {
  /* Surfaces - 5 elevation levels */
  --surface-primary:    #FFFFFF;
  --surface-secondary:  #F5F5F7;
  --surface-tertiary:   #E8E8ED;
  --surface-elevated:   #FFFFFF;       /* Cards, dialogs - same as primary but with shadow */
  --surface-recessed:   #F0F0F2;       /* Input fields, code blocks */

  /* Text - 4 levels only */
  --text-primary:       #1D1D1F;
  --text-secondary:     #6E6E73;
  --text-tertiary:      #86868B;
  --text-quaternary:    #AEAEB2;       /* Placeholder text only */

  /* Accent - single hue with 5 shades */
  --accent:             #0071E3;       /* Apple Blue - primary actions */
  --accent-hover:       #0077ED;
  --accent-active:      #006EDB;
  --accent-subtle:      rgba(0, 113, 227, 0.08);   /* Backgrounds */
  --accent-muted:       rgba(0, 113, 227, 0.16);    /* Hover backgrounds */

  /* Semantic - status colors */
  --success:            #34C759;
  --success-subtle:     rgba(52, 199, 89, 0.08);
  --warning:            #FF9F0A;
  --warning-subtle:     rgba(255, 159, 10, 0.08);
  --error:              #FF3B30;
  --error-subtle:       rgba(255, 59, 48, 0.08);

  /* Borders - 3 levels */
  --border-primary:     rgba(0, 0, 0, 0.08);
  --border-secondary:   rgba(0, 0, 0, 0.04);
  --border-focused:     var(--accent);

  /* Separators */
  --separator:          rgba(0, 0, 0, 0.06);
  --separator-opaque:   #C6C6C8;
}

.dark {
  /* Surfaces - NOT pure black */
  --surface-primary:    #1C1C1E;       /* NOT #000000 */
  --surface-secondary:  #2C2C2E;
  --surface-tertiary:   #3A3A3C;
  --surface-elevated:   #2C2C2E;
  --surface-recessed:   #141416;

  /* Text */
  --text-primary:       #F5F5F7;
  --text-secondary:     #98989D;
  --text-tertiary:      #6E6E73;
  --text-quaternary:    #48484A;

  /* Accent - brighter in dark mode for contrast */
  --accent:             #0A84FF;
  --accent-hover:       #409CFF;
  --accent-active:      #0071E3;
  --accent-subtle:      rgba(10, 132, 255, 0.12);
  --accent-muted:       rgba(10, 132, 255, 0.20);

  /* Semantic */
  --success:            #30D158;
  --success-subtle:     rgba(48, 209, 88, 0.12);
  --warning:            #FFD60A;
  --warning-subtle:     rgba(255, 214, 10, 0.12);
  --error:              #FF453A;
  --error-subtle:       rgba(255, 69, 58, 0.12);

  /* Borders */
  --border-primary:     rgba(255, 255, 255, 0.10);
  --border-secondary:   rgba(255, 255, 255, 0.05);
  --border-focused:     var(--accent);

  /* Separators */
  --separator:          rgba(255, 255, 255, 0.08);
  --separator-opaque:   #38383A;
}
```

**Critical Change**: Dark mode background moves from `#000000` to `#1C1C1E`. Pure black is reserved exclusively for OLED-optimized modes, not default dark theme. The current pure black creates excessive contrast ratios that cause eye fatigue during extended dashboard sessions.

### 1.3 Spacing System

**Current Problem**: Inconsistent spacing. Dashboard page uses `p-6` for content, cards use `p-5`, some cards use `p-6`, the sidebar uses a mix of `p-3`, `p-4`, and `px-3 py-2`. No consistent spacing rhythm.

**Apple Approach**: An 8-point grid with exactly 7 spacing tokens.

```css
--space-1:   4px;    /* Inline element gaps, icon-to-text */
--space-2:   8px;    /* Tight element grouping (badge padding, compact lists) */
--space-3:   12px;   /* Default internal padding, form field gaps */
--space-4:   16px;   /* Card internal padding, section gaps */
--space-5:   24px;   /* Between card groups, page sections */
--space-6:   32px;   /* Major section separation */
--space-7:   48px;   /* Page-level vertical rhythm, hero spacing */
--space-8:   64px;   /* Landing page section spacing only */
```

**Rules**:
- Card padding is ALWAYS `--space-4` (16px). Never 20px (`p-5`), never 24px (`p-6`).
- Gap between sibling cards is ALWAYS `--space-3` (12px).
- Page content padding is ALWAYS `--space-5` (24px).
- Sidebar internal padding is ALWAYS `--space-3` (12px) horizontal, `--space-2` (8px) vertical per item.

### 1.4 Border Radius

**Current Problem**: Mixed radii: `rounded-md` (6px), `rounded-lg` (8px), `rounded-xl` (12px), `rounded-full`. Cards use `rounded-xl`, inputs use `rounded-md`, badges use `rounded-full`. No hierarchy.

**Apple Approach**: 4 radii with strict use cases.

```css
--radius-sm:   6px;    /* Inputs, inline badges, code blocks */
--radius-md:   10px;   /* Cards, dropdowns, popovers, notification items */
--radius-lg:   14px;   /* Dialogs, modals, large cards */
--radius-full: 9999px; /* Avatars, pill buttons, status dots */
```

**Rules**:
- Cards: `--radius-md` (10px). Always.
- Dialogs: `--radius-lg` (14px).
- Inputs: `--radius-sm` (6px).
- Buttons: `--radius-sm` (6px) for default, `--radius-full` for pill/CTA.
- Nested elements MUST have smaller radii than their parent. A card at 10px contains inputs at 6px. Never the reverse.

### 1.5 Shadows and Elevation

**Current Problem**: The current design uses `shadow-lg` on dialogs and essentially nothing else. There is no elevation system. Cards are differentiated only by borders, making the page feel flat without spatial hierarchy.

**Apple Approach**: 4 elevation levels that create a clear spatial model.

```css
/* Elevation 0 - Recessed (input fields, code blocks) */
--shadow-inset:   inset 0 1px 2px rgba(0, 0, 0, 0.06);

/* Elevation 1 - Surface (cards at rest) */
--shadow-sm:      0 1px 2px rgba(0, 0, 0, 0.04),
                  0 1px 3px rgba(0, 0, 0, 0.02);

/* Elevation 2 - Raised (cards on hover, dropdowns) */
--shadow-md:      0 4px 12px rgba(0, 0, 0, 0.06),
                  0 1px 3px rgba(0, 0, 0, 0.04);

/* Elevation 3 - Floating (modals, command palette, popovers) */
--shadow-lg:      0 8px 32px rgba(0, 0, 0, 0.10),
                  0 2px 8px rgba(0, 0, 0, 0.04);

/* Elevation 4 - Overlay (full-screen modals, image lightbox) */
--shadow-xl:      0 16px 48px rgba(0, 0, 0, 0.16),
                  0 4px 16px rgba(0, 0, 0, 0.06);

/* Dark mode shadows use increased opacity */
.dark {
  --shadow-sm:    0 1px 2px rgba(0, 0, 0, 0.20),
                  0 1px 3px rgba(0, 0, 0, 0.12);
  --shadow-md:    0 4px 12px rgba(0, 0, 0, 0.28),
                  0 1px 3px rgba(0, 0, 0, 0.16);
  --shadow-lg:    0 8px 32px rgba(0, 0, 0, 0.40),
                  0 2px 8px rgba(0, 0, 0, 0.20);
  --shadow-xl:    0 16px 48px rgba(0, 0, 0, 0.48),
                  0 4px 16px rgba(0, 0, 0, 0.24);
}
```

**Rules**:
- Cards at rest: `--shadow-sm` + border. On hover: transition to `--shadow-md`.
- Dropdowns, popovers: `--shadow-lg`.
- Modals, command palette: `--shadow-xl`.
- Input fields: `--shadow-inset` (subtle inner shadow).
- Shadows ALWAYS transition with `transition: box-shadow 0.2s ease`.

### 1.6 Motion System

**Current Problem**: Heavy use of Framer Motion throughout with inconsistent durations and easings. The hero terminal animation uses `delay: index * 0.6` (600ms per step), which is far too slow. Log entries animate with `x: -10` slide-in, which is distracting at high volume. Every page uses a custom animation approach.

**Apple Approach**: A unified motion system with strict timing curves and a performance budget.

```css
/* Duration tokens - only 4 */
--duration-instant:  100ms;   /* Hover states, focus rings, active states */
--duration-fast:     200ms;   /* Micro-interactions: toggles, checkboxes, tooltips */
--duration-normal:   300ms;   /* Page transitions, card reveals, dialog open/close */
--duration-slow:     500ms;   /* Full-page transitions, onboarding sequences */

/* Easing curves - only 3 */
--ease-default:      cubic-bezier(0.25, 0.1, 0.25, 1.0);    /* Standard ease-out */
--ease-spring:       cubic-bezier(0.34, 1.56, 0.64, 1.0);    /* Overshoot for playful elements */
--ease-decelerate:   cubic-bezier(0.0, 0.0, 0.2, 1.0);       /* Enter animations */

/* Motion guidelines */
/* - NEVER animate more than 6 elements simultaneously */
/* - Stagger delay between siblings: 30ms (NOT 50ms, NOT 100ms) */
/* - Maximum total stagger: 180ms (6 items * 30ms) */
/* - Reduce motion preference: disable transforms, keep opacity */
/* - Log entries: NO animation. They appear instantly. Performance matters more than flourish. */
/* - Hero terminal: total animation 2.5s, not 3.6s */
```

**Critical Change**: Remove Framer Motion `AnimatePresence mode="popLayout"` from build log entries. At high throughput, animating every log line causes jank. Log lines should appear instantly with no animation.

### 1.7 Glassmorphism and Blur

**Current Problem**: The `.glass` utility applies `backdrop-filter: blur(12px)` with 80% opacity. This is used on the dashboard header and some modals. The effect is too heavy and obscures content behind it.

**Apple Approach**: Calibrated translucency that maintains readability.

```css
/* Material layers - inspired by Apple's vibrancy system */
--material-thin:     backdrop-filter: saturate(180%) blur(8px);
                     background: rgba(255, 255, 255, 0.72);

--material-regular:  backdrop-filter: saturate(180%) blur(16px);
                     background: rgba(255, 255, 255, 0.78);

--material-thick:    backdrop-filter: saturate(180%) blur(24px);
                     background: rgba(255, 255, 255, 0.85);

/* Dark mode materials */
.dark --material-thin:     backdrop-filter: saturate(180%) blur(8px);
                           background: rgba(28, 28, 30, 0.72);

.dark --material-regular:  backdrop-filter: saturate(180%) blur(16px);
                           background: rgba(28, 28, 30, 0.78);

.dark --material-thick:    backdrop-filter: saturate(180%) blur(24px);
                           background: rgba(28, 28, 30, 0.85);
```

**Where to apply**:
- Dashboard header: `--material-regular` (currently too opaque at 80%)
- Landing page nav on scroll: `--material-thin`
- Command palette backdrop: `--material-thick`
- Sidebar: NO blur. Solid background. Blur on navigation elements creates visual noise.
- Key addition: `saturate(180%)` boosts underlying color vibrancy through the blur, preventing the washed-out look.

---

## 2. Page-by-Page Redesign

### 2.1 Login Page (`app/(auth)/login/page.tsx`)

**Current State**: A centered Card with email/password fields, icon-prefixed inputs, OAuth buttons (GitHub, Google), and a link to signup. Uses `motion.div` for entrance animation. Has field-level validation with `aria-invalid` and `aria-describedby`.

**What Apple Would Change**:

1. **Remove the Card container entirely**. Apple authentication screens are borderless. The form floats in space on a clean surface. The Card adds unnecessary visual weight.

2. **Logo placement**: Currently missing. Add the Cloudify wordmark at the top center, 48px tall, with `--space-7` (48px) below it.

3. **Remove input icons**. The Mail and Lock icons inside inputs are visual clutter. The label tells the user what the field is. Icons inside inputs create alignment problems with autofill styling.

4. **Input styling changes**:
   ```css
   /* Current */
   h-9 rounded-md border focus:ring-2

   /* Apple approach */
   height: 44px;                    /* Apple's minimum tap target */
   border-radius: var(--radius-sm); /* 6px */
   border: 1px solid var(--border-primary);
   background: var(--surface-recessed);
   font-size: var(--text-body);     /* 15px */
   padding: 0 12px;
   transition: border-color 200ms, box-shadow 200ms;

   /* Focus state */
   border-color: var(--accent);
   box-shadow: 0 0 0 3px var(--accent-subtle);

   /* Error state */
   border-color: var(--error);
   box-shadow: 0 0 0 3px var(--error-subtle);
   ```

5. **Password field**: Add a show/hide toggle (Eye/EyeOff icon) inside the field. Currently missing.

6. **OAuth buttons**: Move to TOP of form, above the email/password fields. Apple always prioritizes the fastest path. Add a visual separator: `--- or continue with email ---` between OAuth and email form.

7. **"Forgot password?" link**: Currently missing. Add between password field and submit button, right-aligned, in `--text-footnote` size.

8. **Submit button**: Full-width, `height: 44px`, `--radius-sm`, `background: var(--accent)`, `color: white`, `font-weight: var(--weight-semibold)`, `font-size: var(--text-body)`.

9. **Error messages**: Use inline error text below each field (already done, good), but change the color from `text-red-500` to `var(--error)` and use `--text-footnote` size with an icon prefix (ExclamationCircle, 12px).

10. **Page background**: Clean `var(--surface-primary)`. Remove any gradients or decorative elements.

11. **Signup link**: Move from inside the card to a standalone line below the form. `"Don't have an account?"` in `--text-secondary`, `"Sign up"` as a text link in `--accent`.

### 2.2 Signup Page (`app/(auth)/signup/page.tsx`)

**Current State**: Name/email/password fields with a password strength indicator (4 colored bars), feature checklist bullets. Uses `motion.div` for entrance animation.

**What Apple Would Change**:

1. **Same structural changes as Login** (remove Card, float the form, OAuth on top).

2. **Password strength indicator redesign**:
   - Current: 4 separate colored bars that fill left-to-right. Uses green/yellow/red.
   - Apple approach: A SINGLE continuous bar that fills proportionally, with color transitioning through the spectrum:
     ```
     0-25%:   var(--error)     /* Weak */
     25-50%:  var(--warning)   /* Fair */
     50-75%:  #A8D08D          /* Good - custom green-yellow */
     75-100%: var(--success)   /* Strong */
     ```
   - Below the bar: a single word label: "Weak", "Fair", "Good", "Strong" in the corresponding color, `--text-footnote` size.
   - Requirements list below: checkmark icons that fill in green as each requirement is met. Use `--text-footnote` size. Requirements: 8+ characters, uppercase letter, number, special character.

3. **Feature checklist**: Remove the feature marketing bullets from the signup form. This is not the place for marketing copy. The user has already decided to sign up. Every piece of non-essential content on this page increases abandonment.

4. **Name field**: Use a single "Full name" field (current approach is correct). Placeholder text: "Your name" in `--text-quaternary`.

5. **Terms checkbox**: Add a checkbox at the bottom: "I agree to the Terms of Service and Privacy Policy" with links. Currently missing.

### 2.3 Dashboard (`app/(dashboard)/dashboard/page.tsx`)

**Current State**: 4 stat cards (Total Projects, Total Deployments, Bandwidth Used, Uptime), recent deployments table, quick actions grid, projects list, quick start guide, usage meters. Full skeleton loading state. GuidedTour for new users.

**What Apple Would Change**:

1. **Page title and greeting**: Replace the generic "Dashboard" heading with a time-aware greeting:
   - `"Good morning, Tran"` (before 12pm)
   - `"Good afternoon, Tran"` (12pm-5pm)
   - `"Good evening, Tran"` (after 5pm)
   - Size: `--text-title-1` (28px), `--weight-bold`.
   - Below: a single-line status summary in `--text-secondary`: "3 projects deployed, 99.99% uptime this month"

2. **Stat cards redesign**:
   - Current: 4 cards in a row, each with icon + title + value + change indicator.
   - Apple approach: Reduce to 3 key metrics displayed as large typography, NOT cards:
     ```
     12          99.99%        847 GB
     Projects    Uptime        Bandwidth
     +2 this week   All systems   +12% vs last month
     ```
   - No card borders. No icons. The NUMBER is the visual element. Size: `--text-title-1` for the number, `--text-footnote` for the label below, `--text-caption` for the change indicator in `--text-tertiary`.
   - Change indicators: use `var(--success)` for positive, `var(--error)` for negative, `var(--text-tertiary)` for neutral.

3. **Recent deployments**: Keep as a list, but simplify each row:
   ```
   [Status dot] project-name    main    abc1234    "Fix header layout"    2m ago    1.2s
   ```
   - Status dot: 8px circle, filled solid. Green (ready), yellow (building), red (error), gray (queued/cancelled).
   - Project name: `--text-body`, `--weight-medium`, clickable.
   - Branch: `--text-footnote`, `--text-tertiary`.
   - Commit SHA: `--text-footnote`, monospace, 7 characters.
   - Commit message: `--text-footnote`, `--text-secondary`, truncated with ellipsis at 40 characters.
   - Time: `--text-footnote`, `--text-tertiary`, right-aligned.
   - Build duration: `--text-footnote`, `--text-tertiary`.
   - NO hover dropdown menus on deployment rows. Add a right-arrow chevron that navigates to the deployment detail page.
   - Maximum 5 rows visible. "View all deployments" link below.

4. **Quick Actions**: Remove entirely. The sidebar already provides navigation. Quick action cards are redundant and take up prime real estate. If we must keep them, reduce to a single row of icon-only buttons with tooltip labels.

5. **Quick Start Guide**: Move into the GuidedTour system. Do not display inline on the dashboard. New users see the tour, returning users see their data. Never show both simultaneously.

6. **Usage Meters**: Move to Settings > Billing tab. Usage meters on the dashboard add anxiety without actionability. The user cannot change their usage from this page.

7. **Projects List on Dashboard**: Remove. Projects have their own dedicated page. Duplicating them on the dashboard creates maintenance burden and confuses the navigation model.

8. **Final dashboard layout** (top to bottom):
   - Greeting + status summary
   - 3 key metrics (no cards)
   - Recent deployments list (5 rows max)
   - That is it. Nothing else. The dashboard should load in under 200ms perceived time.

### 2.4 Projects Page (`app/(dashboard)/projects/page.tsx`)

**Current State**: Grid/list toggle, search input, project cards with framework emoji icons, dropdown menu per project (visit, settings, clone, delete). EmptyState component. Optimistic toast notifications.

**What Apple Would Change**:

1. **Page title**: "Projects" in `--text-title-1`, left-aligned. Right side: search input + "New Project" button.

2. **Search**: Remove the standalone search input. Integrate into the page header. The search input appears inline, same row as the title, right-aligned. Width: 240px. On focus: expands to 320px with a smooth `width` transition (200ms).

3. **Grid/List toggle**: Remove the toggle. Default to list view. Grid view for project cards creates inconsistent card heights (projects have different amounts of metadata) and wastes horizontal space. List view is denser and more scannable.

4. **Project list item redesign**:
   ```
   [Framework icon]  project-name        main branch    *.cloudify.app    12 deployments    Updated 2h ago    [...]
   ```
   - Framework icon: 32x32px, rounded-md (6px), background uses framework brand color at 8% opacity.
   - Project name: `--text-callout`, `--weight-semibold`.
   - Branch: `--text-footnote`, `--text-tertiary`, with GitBranch icon (12px).
   - Domain: `--text-footnote`, `--text-secondary`, clickable, opens in new tab.
   - Deployment count: `--text-footnote`, `--text-tertiary`.
   - Updated time: `--text-footnote`, `--text-tertiary`.
   - Three-dot menu: `--text-tertiary`, 32x32px hit area.
   - Row height: 56px.
   - Hover: `background: var(--surface-secondary)`.
   - Active: `background: var(--accent-subtle)`.
   - Row separator: 1px `var(--separator)` between rows.

5. **Empty state**: Keep the current EmptyState component concept but simplify the illustration. Use a single 48px icon (FolderPlus) in `--text-quaternary`, a headline "No projects yet" in `--text-headline`, and a description in `--text-footnote` / `--text-secondary`. Single CTA button: "New Project".

6. **Framework emoji icons**: Replace emojis with proper SVG framework logos (20x20px, monochrome, using `--text-secondary` color). Emojis render differently across platforms and look unprofessional at small sizes.

### 2.5 Project Detail Page (`app/(dashboard)/projects/[name]/page.tsx`)

**Current State**: Back button, project name, status badge, 3 quick info cards (domain, git, last deployment), 5 tabs (Deployments, Build Logs, Environment, Domains, Analytics). Analytics tab includes tracking script snippet with copy button.

**What Apple Would Change**:

1. **Header structure**:
   ```
   <- Back to Projects
   ═══════════════════════════════════════════════════
   project-name                    [Visit Site]  [Settings]  [Redeploy]
   nextjs  |  main  |  abc1234  |  Updated 2h ago
   ```
   - Back link: `--text-footnote`, `--text-secondary`, with left arrow. Uses `router.back()`.
   - Project name: `--text-title-1`.
   - Metadata line: `--text-footnote`, `--text-secondary`, items separated by middle dots.
   - Action buttons: "Visit Site" (outline), "Settings" (ghost), "Redeploy" (primary accent).

2. **Remove the 3 quick info cards**. The metadata line above already shows domain, git, and last deployment. Cards are visual overhead for single-value information.

3. **Tab redesign**:
   - Current: Radix Tabs with `border-b-2` active indicator.
   - Apple approach: Keep the underline tab pattern, but refine:
     ```css
     tab-indicator {
       height: 2px;
       background: var(--text-primary);
       border-radius: 1px;
       transition: transform 250ms var(--ease-default),
                   width 250ms var(--ease-default);
     }
     ```
   - The active indicator should SLIDE between tabs using CSS transform, not swap between elements. This creates the "tracking" effect Apple uses in its tab bars.
   - Tab label: `--text-body`, `--weight-medium` when active, `--weight-regular` when inactive.
   - Inactive tab: `--text-secondary`.
   - Active tab: `--text-primary`.
   - Tab spacing: `--space-5` (24px) between tabs.

4. **Deployments tab**: Use the same list format as the dashboard recent deployments. Add pagination (cursor-based, not page numbers). Show 20 per page.

5. **Environment tab**: Keep the current env-variables component structure. It is well-designed with encrypted toggle, NEXT_PUBLIC_ detection, and target environment selection. Minor refinements:
   - Input height: 44px (current h-9 is 36px).
   - Use monospace font for variable names and values.
   - "Add Variable" button: ghost style with Plus icon.

6. **Analytics tab**: Remove the tracking script snippet. It belongs in documentation or a dedicated "Setup" tab, not inline with analytics data. Analytics should show data, not setup instructions.

### 2.6 Deployments Page (`app/(dashboard)/deployments/page.tsx`)

**Current State**: Deployment list with status/project filters, refresh button. Each deployment shows status icon, project link, badges, commit info, duration, speed badge. Actions: redeploy, rollback/promote, delete.

**What Apple Would Change**:

1. **Filters**: Replace the dropdown filters with inline segmented controls:
   ```
   Status:  [All]  [Building]  [Ready]  [Error]     Project:  [All Projects v]
   ```
   - Status filter: Segmented control (radio-style buttons), not a dropdown. Maximum 5 options.
   - Project filter: Dropdown select, since projects can be numerous.
   - Remove the "Refresh" button. Deployments should auto-refresh every 10 seconds when the tab is active, with a subtle "Updated just now" indicator.

2. **Deployment list item**: Same format as dashboard recent deployments but with additional detail:
   ```
   [Status]  project-name / deployment-id    main    abc1234    "Commit message"    2m ago    1.2s    [...]
   ```
   - Add deployment ID below project name in `--text-caption`, monospace, `--text-tertiary`.
   - Clicking the row opens the deployment detail view.
   - Three-dot menu: Redeploy, Rollback, View Logs, Delete. Remove "Promote" -- it is confusing for most users.

3. **Speed badge**: Remove. Build duration already communicates speed. A badge saying "Fast" next to "1.2s" is redundant.

4. **Bulk actions**: None. Bulk deployment operations are dangerous. Each deployment action should be deliberate and individual.

### 2.7 Domains Page (`app/(dashboard)/domains/page.tsx`)

**Current State**: Domain list with add dialog, DNS record display for unverified domains, verification flow with error/warning display, SSL status tracking.

**What Apple Would Change**:

1. **Domain list item**:
   ```
   example.com         project-name     [Valid SSL]     [Verified]     Added 3 days ago     [...]
   ```
   - Domain name: `--text-callout`, `--weight-semibold`.
   - Project: `--text-footnote`, `--text-secondary`.
   - SSL badge: Green dot + "Valid" or yellow dot + "Pending" or red dot + "Expired".
   - Verification badge: Green checkmark or yellow warning.
   - Date: `--text-footnote`, `--text-tertiary`.

2. **DNS configuration panel**: When a domain is unverified, show the DNS records in an expandable section below the domain row. DO NOT use a separate modal or dialog.
   ```
   Configure DNS Records
   ─────────────────────
   Add the following records to your DNS provider:

   Type    Name              Value                          TTL     [Copy]
   TXT     _cloudify         cf-verify=abc123               3600    [Copy]
   CNAME   example.com       cname.cloudify.app             3600    [Copy]

   [Check DNS]  Last checked: 2 minutes ago
   ```
   - Use a monospace font for DNS values.
   - "Copy" button on each row copies the value.
   - "Check DNS" button triggers re-verification.
   - Auto-check every 60 seconds when the panel is expanded.

3. **Add domain dialog**: Simplify to a single-field dialog. Domain name input + project dropdown + "Add" button. Remove any explanatory text -- the user knows what a domain is.

### 2.8 Analytics Page (`app/(dashboard)/analytics/page.tsx`)

**Current State**: Time range selector (24h/7d/30d), project filter, 4 stat cards, 3 tabs (Traffic, Performance, Geography), Core Web Vitals display, device/browser breakdowns, TrafficChart component.

**What Apple Would Change**:

1. **Time range**: Replace buttons with a segmented control. Add "90d" and "1y" options.

2. **Stat cards**: Same treatment as dashboard -- remove card containers, display as large typography:
   ```
   12,847        3,421          4m 32s           2.1%
   Page Views    Visitors       Avg. Session     Bounce Rate
   +14% ▲        +8% ▲          -12s ▼           -0.3% ▲
   ```

3. **Traffic chart**: The TrafficChart component is good but needs refinement:
   - Remove the border and card wrapper. The chart should breathe.
   - Use `var(--accent)` for the primary line.
   - Fill under the line with `var(--accent-subtle)` gradient fading to transparent.
   - Y-axis labels: `--text-caption`, `--text-tertiary`.
   - X-axis labels: `--text-caption`, `--text-tertiary`.
   - Tooltip on hover: show exact value in a small bubble with `--shadow-md`.
   - No grid lines. Only subtle horizontal reference lines at key intervals.

4. **Core Web Vitals**: Excellent feature, keep it. Refinements:
   - Each metric should show a gauge/arc visualization, not just numbers.
   - Color coding: Green (Good), Yellow (Needs Improvement), Red (Poor) -- using the CWV thresholds.
   - LCP threshold: Green < 2.5s, Yellow < 4s, Red >= 4s.
   - FID/INP threshold: Green < 100ms, Yellow < 300ms, Red >= 300ms.
   - CLS threshold: Green < 0.1, Yellow < 0.25, Red >= 0.25.

5. **Geography tab**: Use a minimalist dot map instead of a table. Each country gets a dot sized by traffic volume. Hover to see country name and visit count. Below the map: top 10 countries as a horizontal bar chart.

### 2.9 Settings Page (`app/(dashboard)/settings/page.tsx`)

**Current State**: 5 tabs (Profile, Security, Notifications, Billing, Team). Profile has avatar/name edit. Security has password change, 2FA (coming soon), danger zone. Notifications has toggle switches. Billing has plan card with Stripe integration. Team has member list with invite.

**What Apple Would Change**:

1. **Navigation**: Replace horizontal tabs with a LEFT-SIDE vertical navigation list:
   ```
   Settings
   ─────────────
   General            [selected]
   Security
   Notifications
   Billing
   Team
   ─────────────
   Danger Zone
   ```
   - This mirrors Apple's System Preferences / System Settings pattern.
   - The left nav is 200px wide.
   - The content area fills the remaining width.
   - "Danger Zone" is separated at the bottom with a divider.

2. **Profile/General section**:
   - Avatar: 64x64px circle. Click to change. Show a subtle camera icon overlay on hover.
   - Name field: Inline editable. Click the name text to turn it into an input. Save on blur or Enter. Cancel on Escape.
   - Email: Display only, with a "Change email" link that opens a verification flow.
   - Remove any "Save" button that saves all fields at once. Each field saves independently on change. Show a subtle checkmark animation on successful save.

3. **Security section**:
   - Password change: Show current password field, new password field, confirm new password field. All 44px height. "Update password" button below.
   - 2FA: Remove the "Coming Soon" badge. Either implement it or do not show it. Showing unfinished features erodes trust.
   - Active sessions: Add a "Where you're signed in" section showing active sessions with device/browser/location and a "Sign out" button per session.

4. **Notifications**:
   - Group toggles by category (Deployments, Domains, Team, System, Security).
   - Each toggle shows a title and description.
   - Use a custom toggle switch component matching Apple's iOS switch (wider, with green active color).

5. **Billing**:
   - Current plan card with gradient: Replace the gradient with a clean solid card.
   - Plan comparison: Show current plan features with checkmarks. "Upgrade" button for higher tier.
   - Usage meters: Move from dashboard to here. Show bandwidth, build minutes, team members as progress bars against plan limits.
   - Invoice history: Add a table of past invoices with download links.

6. **Team**: Move to its own dedicated page under `/team` (which already exists). Remove from Settings. Having team management in two places (Settings > Team tab AND /team page) is confusing.

### 2.10 Team Page (`app/(dashboard)/team/page.tsx`)

**Current State**: Team member table with avatar, role badges, joined date. Invite dialog with email/role/link. Change role dialog, remove member with confirmation.

**What Apple Would Change**:

1. **Header**: "Team" title + "Invite" button (primary accent).

2. **Member list**:
   ```
   [Avatar]  Tran Nguyen         tran@email.com       Owner      Joined Jan 15, 2026
   [Avatar]  Sarah Wilson        sarah@email.com      Admin      Joined Feb 1, 2026       [...]
   ```
   - Avatar: 36x36px circle.
   - Name: `--text-body`, `--weight-medium`.
   - Email: `--text-footnote`, `--text-secondary`.
   - Role: Badge in `--text-caption`. Owner = no background, just text. Admin = `--accent-subtle` bg. Member = `--surface-secondary` bg.
   - Joined: `--text-footnote`, `--text-tertiary`.
   - Row height: 56px.

3. **Invite flow**: Single dialog with email input + role select + "Send Invite" button. Remove the invite link copy feature from the dialog -- it is a secondary action that belongs in a "Pending Invitations" section.

4. **Pending invitations**: Show a separate section below active members for pending invites with "Resend" and "Revoke" actions.

5. **Role management**: Clicking the role badge opens an inline dropdown to change role. No separate dialog needed.

### 2.11 Storage Page (`app/(dashboard)/storage/page.tsx`)

**Current State**: Blob/KV tabs, usage progress bar, stats grid, create store dialog, store cards.

**What Apple Would Change**:

1. **Tab structure**: Replace tabs with a segmented control: `[Blob Storage] [KV Storage]`.

2. **Usage display**: Show usage as a single line, not a full progress bar:
   ```
   Using 2.4 GB of 10 GB (24%)                                    [Upgrade]
   ```
   - Thin 2px progress bar below the text, `var(--accent)` fill.
   - "Upgrade" link if approaching limit (>80%).

3. **Store list**: Convert cards to rows:
   ```
   store-name      blob     my-project     2.4 GB    142 files    Created 3 days ago    [...]
   ```
   - Clicking a row opens the store detail page (file browser for blob, key browser for KV).

4. **Create store dialog**: Simplified -- name + type (blob/KV) + project. Remove "public" toggle from creation; make it a setting within the store.

### 2.12 Logs Page (`app/(dashboard)/logs/page.tsx`)

**Current State**: Terminal-style viewer (dark bg), 600px height, live mode with 5s auto-refresh, level/source filters, expandable log entries, export to JSON, stats bar.

**What Apple Would Change**:

1. **Full-height log viewer**: Expand the log viewer to fill the available viewport height, not a fixed 600px. Use `calc(100vh - header - filters)`.

2. **Filter bar**: Horizontal bar above the log viewer:
   ```
   Level: [All] [Info] [Warn] [Error]    Source: [All Sources v]    [Search...]    [Live] [Export]
   ```
   - Level filter: Segmented control with colored dots (gray/yellow/red) before each label.
   - Source filter: Dropdown.
   - Search: Inline input that filters log entries in real-time.
   - Live toggle: A pill button with a pulsing green dot when active.
   - Export: Icon button (Download icon).

3. **Log entry format**:
   ```
   14:32:15.123  INFO   [api/deploy]  Deployment abc123 started for project my-portfolio
   ```
   - Timestamp: monospace, `--text-caption`, `var(--text-tertiary)`.
   - Level: monospace, `--text-caption`, uppercase, color-coded.
   - Source: monospace, `--text-caption`, `var(--text-secondary)`, in square brackets.
   - Message: monospace, `--text-footnote`, `var(--text-primary)`.
   - No animation on new entries. Entries appear instantly.
   - Click to expand: Show full metadata (request ID, user, IP, etc.) in an indented section below.

4. **Terminal aesthetic**: Keep the dark background but use `var(--surface-recessed)` in dark mode (`#141416`) instead of `bg-gray-950`. This maintains the terminal feel while being consistent with the dark mode palette.

### 2.13 Pricing Page (`app/pricing/page.tsx`)

**Current State**: 3 plans (Hobby/Pro/Enterprise), monthly/yearly toggle, feature checklists, FAQ accordion. "Most Popular" badge on Pro.

**What Apple Would Change**:

1. **Plan cards**: Remove borders. Use elevation to differentiate the recommended plan:
   - Hobby: Standard elevation, `var(--surface-primary)` background.
   - Pro: Elevated with `--shadow-md`, `var(--surface-elevated)` background, subtle `var(--accent)` top border (2px).
   - Enterprise: Standard elevation, same as Hobby.

2. **Price display**:
   ```
   $0            $20           Custom
   /month        /month

   Hobby         Pro           Enterprise
   ```
   - Price: `--text-large-title`, `--weight-bold`.
   - Period: `--text-body`, `--text-secondary`.
   - Plan name: `--text-headline`, `--weight-semibold`.

3. **Feature list**: Use checkmarks for included features, dashes for excluded. Do not use red X marks -- they create negative visual weight.
   ```
   ✓ Unlimited projects        ✓ Unlimited projects        ✓ Unlimited projects
   ✓ 100 GB bandwidth          ✓ 1 TB bandwidth            ✓ Custom bandwidth
   - Priority support           ✓ Priority support           ✓ Dedicated support
   - Custom domains             ✓ Custom domains             ✓ Custom domains
   ```

4. **Monthly/yearly toggle**: Use a segmented control with the savings displayed:
   ```
   [Monthly]  [Yearly (Save 17%)]
   ```

5. **FAQ**: Replace the accordion with a clean list. Questions in `--text-body`, `--weight-semibold`. Answers in `--text-body`, `--text-secondary`. Click to expand/collapse with a smooth height animation (300ms).

6. **"Most Popular" badge**: Replace with a subtle "Recommended" label above the Pro plan in `--text-caption`, `--accent` color, `--tracking-widest`.

### 2.14 Welcome/Onboarding Page (`app/(dashboard)/welcome/page.tsx`)

**Current State**: Gradient background, animated orbs, 3-step progress indicator, CTA to start wizard, skip option.

**What Apple Would Change**:

1. **Remove animated orbs and gradient background**. These are decorative noise. Onboarding should be clean and focused.

2. **Full-screen centered layout**:
   ```
   Welcome to Cloudify

   Let's get your first project deployed in under 2 minutes.

   Step 1 of 3: Complete your profile
   ──────────────────────────────────── ■■□□□□□□□□

   [Full Name input]
   [Company/Organization input (optional)]

                                              [Continue ->]
                                              Skip setup
   ```

3. **Progress**: A single thin progress bar (2px) spanning the full width. Not step dots. The bar fills proportionally.

4. **Steps**:
   - Step 1: Complete profile (name, optional org).
   - Step 2: Connect GitHub (OAuth flow with a single button).
   - Step 3: Import or create first project (show repo list or template picker).

5. **Skip**: Always available, but as a subtle text link, not a prominent button.

### 2.15 New Project Page (`app/new/page.tsx`)

**Current State**: 3-step flow (Source > Configure > Deploy), GitHub repo list, template grid, Git URL import, branch/name/framework config, deploy success screen.

**What Apple Would Change**:

1. **Step indicator**: Replace the numbered steps with a breadcrumb-style indicator:
   ```
   Source  >  Configure  >  Deploy
   ```
   - Active step: `--text-primary`, `--weight-semibold`.
   - Completed step: `--accent`, with checkmark.
   - Future step: `--text-tertiary`.

2. **Source selection** (Step 1):
   - Two large cards, side by side:
     ```
     [Import Git Repository]          [Start from Template]
     Connect your GitHub, GitLab,     Choose a pre-built template
     or Bitbucket repository          to get started quickly
     ```
   - Card dimensions: 50% width each, 160px height.
   - On click: the selected card expands, the other fades out.

3. **Repository list**:
   - Search input at top.
   - Each repo row: `[icon] owner/repo-name    last pushed 2 days ago    [Import]`
   - Already-imported repos: show "Imported" badge instead of Import button. `--text-tertiary`.
   - Refresh button: subtle, icon-only, top-right of the list.

4. **Configuration** (Step 2):
   - Project name: auto-generated from repo name, editable.
   - Framework: auto-detected, shown as a read-only badge. "Override" link to change.
   - Build settings: collapsed by default under an "Advanced" disclosure. Auto-detection should handle most cases.
   - Root directory, build command, output directory, install command: shown in Advanced section with sensible defaults.

5. **Deploy** (Step 3):
   - Use the DeploymentStream component.
   - Success state: Large checkmark icon (48px, green), "Deployed successfully" heading, deployment URL as a clickable link, "Visit Site" and "Go to Project" buttons.

---

## 3. Component Library Redesign

### 3.1 Button Component (`components/ui/button.tsx`)

**Current State**: CVA variants (default, destructive, outline, secondary, ghost, link). Sizes: default (h-9), sm (h-8), lg (h-10), xl (h-11 rounded-full), icon (h-9 w-9).

**Apple Redesign**:

```
Variants: 4 (not 6)
  - primary:     bg: var(--accent), text: white, shadow: 0 1px 2px rgba(0,0,0,0.1)
  - secondary:   bg: var(--surface-secondary), text: var(--text-primary), border: none
  - ghost:       bg: transparent, text: var(--text-secondary)
  - destructive: bg: var(--error), text: white

Remove:
  - "outline" variant: merge into secondary (secondary already has sufficient visual weight)
  - "link" variant: use plain <a> tags styled with --accent color

Sizes: 3 (not 5)
  - sm:    height: 32px, padding: 0 12px, font-size: --text-footnote
  - md:    height: 36px, padding: 0 16px, font-size: --text-body     (default)
  - lg:    height: 44px, padding: 0 20px, font-size: --text-body

Remove:
  - "xl" variant: use lg with rounded-full for CTAs
  - "icon" variant: use sm with equal width/height (32x32) and remove padding

States:
  - hover:    filter: brightness(1.08) for filled buttons, bg: var(--surface-secondary) for ghost
  - active:   filter: brightness(0.95), transform: scale(0.98)
  - disabled: opacity: 0.4, pointer-events: none
  - focus:    box-shadow: 0 0 0 3px var(--accent-subtle), outline: none
  - loading:  show spinner (16px), disable pointer events, maintain width (no layout shift)

Transitions:
  - background-color: var(--duration-instant)
  - transform: var(--duration-instant) var(--ease-spring)
  - box-shadow: var(--duration-fast)
```

### 3.2 Card Component (`components/ui/card.tsx`)

**Current State**: `rounded-lg border bg-card text-card-foreground`, padding p-5.

**Apple Redesign**:

```css
.card {
  background: var(--surface-primary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-md);    /* 10px */
  padding: var(--space-4);            /* 16px */
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--duration-fast) var(--ease-default),
              border-color var(--duration-fast) var(--ease-default);
}

.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-primary);
}

/* Interactive card variant (clickable) */
.card-interactive {
  cursor: pointer;
}

.card-interactive:active {
  transform: scale(0.99);
  transition: transform var(--duration-instant) var(--ease-spring);
}
```

Remove `CardHeader`, `CardFooter`, `CardTitle`, `CardDescription` sub-components. They over-abstract simple HTML structure. A card is a container with padding. Its content is composed freely inside it.

### 3.3 Input Component (`components/ui/input.tsx`)

**Current State**: `h-9 rounded-md border`, focus uses `ring-2` with `--ring` variable, error state with red border.

**Apple Redesign**:

```css
.input {
  height: 44px;
  padding: 0 12px;
  font-size: var(--text-body);
  background: var(--surface-recessed);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-inset);
  color: var(--text-primary);
  transition: border-color var(--duration-fast),
              box-shadow var(--duration-fast);
}

.input::placeholder {
  color: var(--text-quaternary);
}

.input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-subtle);
  outline: none;
}

.input[aria-invalid="true"] {
  border-color: var(--error);
  box-shadow: 0 0 0 3px var(--error-subtle);
}

.input:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

Key changes:
- Height increases from 36px to 44px (Apple's minimum tap target).
- Use `var(--surface-recessed)` background instead of transparent.
- Inner shadow (`--shadow-inset`) creates a subtle recessed feel.
- Focus ring is a soft 3px box-shadow glow, not a hard 2px ring.

### 3.4 Badge Component (`components/ui/badge.tsx`)

**Current State**: CVA variants (default, secondary, success, warning, error, outline). `rounded-full px-2.5 py-0.5`.

**Apple Redesign**:

```
Variants: 4 (remove outline and default)
  - neutral:  bg: var(--surface-secondary), text: var(--text-secondary)
  - success:  bg: var(--success-subtle), text: #1B7A3D (dark green)
  - warning:  bg: var(--warning-subtle), text: #8A6914 (dark amber)
  - error:    bg: var(--error-subtle), text: #C1291E (dark red)

Dark mode:
  - success:  bg: var(--success-subtle), text: var(--success)
  - warning:  bg: var(--warning-subtle), text: var(--warning)
  - error:    bg: var(--error-subtle), text: var(--error)

Sizing:
  height: 22px;
  padding: 0 8px;
  font-size: var(--text-caption);    /* 11px */
  font-weight: var(--weight-medium);
  border-radius: var(--radius-sm);   /* 6px, NOT rounded-full */
  line-height: 22px;

Status dots (alternative to text badges for deployment status):
  width: 8px;
  height: 8px;
  border-radius: 50%;
  /* Pulsing animation for "building" state */
  animation: pulse 2s ease-in-out infinite;
```

Key change: Badges use `--radius-sm` (6px), NOT `rounded-full`. Pill badges look informal and take up more horizontal space. Apple uses small rounded rectangles.

### 3.5 Tabs Component (`components/ui/tabs.tsx`)

**Current State**: Radix Tabs with `border-b` container, `border-b-2` active indicator on each trigger, `-mb-px` offset.

**Apple Redesign**:

```css
.tabs-list {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--separator);
}

.tabs-trigger {
  position: relative;
  padding: 10px 16px;
  font-size: var(--text-body);
  font-weight: var(--weight-regular);
  color: var(--text-secondary);
  transition: color var(--duration-fast);
  cursor: pointer;
}

.tabs-trigger[data-state="active"] {
  color: var(--text-primary);
  font-weight: var(--weight-medium);
}

/* Sliding indicator - managed via JavaScript to animate between tabs */
.tabs-indicator {
  position: absolute;
  bottom: -1px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 1px;
  transition: left var(--duration-normal) var(--ease-default),
              width var(--duration-normal) var(--ease-default);
}

.tabs-trigger:hover:not([data-state="active"]) {
  color: var(--text-primary);
}

.tabs-content {
  padding-top: var(--space-5);       /* 24px */
}
```

Key change: A SINGLE sliding indicator element that moves between tabs via CSS transform. This requires a small amount of JavaScript to measure tab positions and update the indicator's `left` and `width` properties. The visual effect is dramatically more polished than swapping `border-b-2` between elements.

### 3.6 Dialog Component (`components/ui/dialog.tsx`)

**Current State**: Radix Dialog with `bg-black/80` overlay, content uses `rounded-lg`, `shadow-lg`, slide-in animation, close button at top-right.

**Apple Redesign**:

```css
/* Overlay */
.dialog-overlay {
  background: rgba(0, 0, 0, 0.4);   /* Not 0.8 - too dark */
  backdrop-filter: blur(4px);
  animation: fadeIn var(--duration-normal) var(--ease-decelerate);
}

/* Content */
.dialog-content {
  max-width: 480px;
  border-radius: var(--radius-lg);   /* 14px */
  background: var(--surface-elevated);
  border: 1px solid var(--border-secondary);
  box-shadow: var(--shadow-xl);
  padding: var(--space-5);           /* 24px */

  /* Enter animation */
  animation: dialogEnter var(--duration-normal) var(--ease-spring);
}

@keyframes dialogEnter {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Close button */
.dialog-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--surface-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: background var(--duration-instant);
}

.dialog-close:hover {
  background: var(--surface-tertiary);
}
```

Key changes:
- Overlay opacity reduced from 0.8 to 0.4. The Apple aesthetic lets the underlying content remain partially visible.
- Add `backdrop-filter: blur(4px)` to the overlay.
- Entry animation: scale(0.96) to scale(1) with spring easing, not slide-in-from-top.
- Close button: circular, with `--surface-secondary` background instead of transparent.
- Border radius: 14px (up from 8px).

### 3.7 Skeleton Component (`components/ui/skeleton.tsx`)

**Current State**: `animate-pulse rounded-md bg-gray-200 dark:bg-gray-800`. Multiple specialized variants (SkeletonCard, SkeletonTable, SkeletonStats, etc.).

**Apple Redesign**:

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface-secondary) 25%,
    var(--surface-tertiary) 50%,
    var(--surface-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

Key change: Replace `animate-pulse` (opacity fade) with a `shimmer` animation (horizontal gradient sweep). The shimmer effect is more refined and communicates "loading" more clearly than a blinking opacity change. Apple uses this pattern in Apple Music, App Store, and Xcode.

Keep the specialized skeleton variants (SkeletonCard, SkeletonTable, etc.) -- they provide excellent layout stability during loading. But ensure each variant uses the correct spacing tokens from the redesigned system.

### 3.8 Empty State Component (`components/ui/empty-state.tsx`)

**Current State**: Animated with Framer Motion staggered entrance. Icon + title + description + primary/secondary actions.

**Apple Redesign**:

```
Layout:
  - Centered vertically and horizontally in the available space.
  - Maximum width: 320px.
  - No animation on load. The empty state IS the content; it should not "enter" the page.

Icon:
  - 48px x 48px.
  - color: var(--text-quaternary).
  - Use a thin-stroke icon style (1.5px stroke width).

Title:
  - font-size: var(--text-headline).
  - font-weight: var(--weight-semibold).
  - color: var(--text-primary).
  - margin-top: var(--space-4).

Description:
  - font-size: var(--text-footnote).
  - color: var(--text-secondary).
  - text-align: center.
  - margin-top: var(--space-2).
  - max-width: 280px.

Action:
  - Single primary button only. Remove secondary action.
  - margin-top: var(--space-5).
  - Use the "primary" button variant.
```

### 3.9 Notification Center (`components/notifications/notification-center.tsx`)

**Current State**: Dropdown from bell icon, notification list with type/status icons, read/unread states, mark all read, clear all, inline delete.

**Apple Redesign**:

1. **Bell icon**: Remove the red badge count circle. Replace with a simple red dot (6px) at the top-right of the bell icon. The dot indicates "there are unread notifications" without displaying a count. Counts create anxiety.

2. **Dropdown panel**:
   - Width: 380px.
   - Max height: 480px with scroll.
   - Header: "Notifications" in `--text-headline`, `--weight-semibold`. "Mark all read" as a text link.
   - No "Clear all" button. Notifications should auto-clear after 30 days.

3. **Notification item**:
   ```
   [Status dot]  Deployment Successful                    2m ago
                 my-portfolio deployed to production
   ```
   - Status dot: 8px, color-coded (green/red/yellow/blue).
   - Title: `--text-body`, `--weight-medium` (unread) or `--weight-regular` (read).
   - Message: `--text-footnote`, `--text-secondary`.
   - Time: `--text-caption`, `--text-tertiary`, right-aligned.
   - Remove the type icon (GitBranch, Globe, etc.). The status dot and title text communicate the type.
   - Unread indicator: left border 2px `var(--accent)` instead of a separate dot.
   - Delete on swipe-left (touch) or hover X button (desktop).

4. **Empty state**: "All caught up" in `--text-footnote`, `--text-tertiary`. Centered. No icon.

### 3.10 Global Search / Command Palette (`components/search/global-search.tsx`)

**Current State**: Uses CommandPalette component. Groups: Recent, Actions, Projects, Pages, Documentation. Triggered by Cmd+K.

**Apple Redesign**:

1. **Trigger**: The search input in the dashboard header should act as the trigger. Clicking it or pressing Cmd+K opens the command palette.

2. **Palette design**:
   ```css
   .command-palette {
     position: fixed;
     top: 20%;                        /* NOT centered vertically -- biased toward top */
     left: 50%;
     transform: translateX(-50%);
     width: 560px;
     max-height: 420px;
     border-radius: var(--radius-lg);
     background: var(--surface-elevated);
     border: 1px solid var(--border-secondary);
     box-shadow: var(--shadow-xl);
     overflow: hidden;
   }
   ```

3. **Search input**: Full-width, no border, 48px height, `--text-callout` size. Magnifying glass icon (20px) on the left. "Esc" badge on the right.

4. **Results**: Grouped by category with group headers in `--text-caption`, `--tracking-widest`, `--text-tertiary`. Each result item: 40px height, icon (16px) + title + optional shortcut badge. Keyboard navigation with arrow keys. Active item: `var(--accent-subtle)` background.

5. **Overlay**: `rgba(0, 0, 0, 0.25)` with `blur(2px)`. Lighter than dialog overlay since the command palette is for quick interactions.

6. **Animations**:
   - Open: `opacity 0->1` (200ms) + `scale 0.98->1` (200ms, spring easing).
   - Close: `opacity 1->0` (150ms).
   - Results: No stagger animation. All results appear instantly.

### 3.11 Sidebar (`components/dashboard/sidebar.tsx`)

**Current State**: 220px wide, 16 nav items with icons and count badges, team selector, Cmd+K search trigger, recent projects section, user menu at bottom, active state uses left accent bar.

**Apple Redesign**:

1. **Width**: Reduce to 240px (slightly wider for better readability).

2. **Background**: Solid `var(--surface-secondary)`. No transparency, no blur.

3. **Structure** (top to bottom):
   ```
   [Cloudify Logo]               (32px height, 16px from top)
   ─────────────────
   [Search trigger]              (Cmd+K hint, 36px height)
   ─────────────────
   Dashboard
   Projects                      12
   Deployments
   Domains                       3
   Analytics
   Storage
   Logs
   ─────────────────
   Functions
   Feature Flags
   Edge Config
   Integrations
   ─────────────────
   Team                          5
   Settings
   ─────────────────
   [User Avatar] Tran Nguyen     (bottom, 48px from bottom edge)
                 Pro Plan
   ```

4. **Navigation items**:
   - Remove ALL icons. Text-only navigation. The labels are unambiguous. Icons add visual noise without improving recognition speed (users scan text, not icons, in vertical nav lists).
   - If icons MUST stay (stakeholder requirement), use 16px monochrome icons with `--text-tertiary` color. Active icon: `--text-primary`.
   - Item height: 32px.
   - Padding: `--space-3` left, `--space-2` top/bottom.
   - Font: `--text-body`, `--weight-regular`.
   - Active item: `background: var(--accent-subtle)`, `color: var(--accent)`, `font-weight: var(--weight-medium)`, `border-radius: var(--radius-sm)`. Remove the left accent bar -- it is a Vercel pattern.
   - Hover: `background: var(--surface-tertiary)`.
   - Count badges: `--text-caption`, `--text-tertiary`, no background. Just the number, right-aligned.

5. **Section dividers**: 1px `var(--separator)` with `--space-3` vertical margin.

6. **Recent Projects section**: Remove entirely. Projects are one click away via the Projects nav item. The sidebar should not duplicate page content.

7. **User menu**: At the bottom. Show avatar (28px circle) + name in `--text-footnote`. Click to show popover with: Theme toggle, Account settings, Sign out.

8. **Team selector**: Remove from sidebar. If the user has multiple teams, add a team switcher in the user popover.

### 3.12 Dashboard Header (`components/dashboard/header.tsx`)

**Current State**: Breadcrumb navigation, search trigger with Cmd+K, NotificationCenter, GlobalSearch, keyboard shortcuts modal. Sticky with backdrop blur, h-12 height.

**Apple Redesign**:

1. **Height**: Increase to 48px.

2. **Structure**:
   ```
   Breadcrumb / Page Title                      [Search]  [Notifications]  [New Project]
   ```

3. **Breadcrumb**: Remove nested breadcrumbs for simple pages. Just show the current page title in `--text-headline`, `--weight-semibold`. For nested pages (e.g., Projects > my-portfolio > Deployments), show a simplified breadcrumb: `Projects / my-portfolio` with the project name clickable.

4. **Sticky behavior**: Use `--material-thin` (translucent) on scroll. When at the top of the page, use solid `var(--surface-primary)` with 1px bottom border.

5. **Remove the keyboard shortcuts button from the header**. It is discoverable via the command palette (type "?" or "keyboard shortcuts"). The header should only contain primary-frequency actions.

### 3.13 DeploymentStream Component (`components/dashboard/deployment-stream.tsx`)

**Current State**: Progress header with status icon, progress bar, step indicators (Clone/Install/Build/Optimize/Deploy), deployment URL on success, build logs in terminal-style viewer.

**Apple Redesign**:

1. **Progress visualization**: Replace the linear step indicators with a circular progress ring:
   ```
   ┌──────────────────────────┐
   │      ╭───────╮           │
   │    /    72%    \          │
   │   |   Building  |        │
   │    \           /          │
   │      ╰───────╯           │
   │   Installing dependencies │
   │   1.2s elapsed            │
   └──────────────────────────┘
   ```
   - Circular progress: 120px diameter, 4px stroke, `var(--accent)` color.
   - Percentage: `--text-title-2`, `--weight-bold`, centered.
   - Current step: `--text-body`, below the ring.
   - Elapsed time: `--text-footnote`, `--text-secondary`.

2. **Step indicators**: Keep as a horizontal row below the ring, but use dots instead of text:
   ```
   ● ● ● ○ ○
   ```
   - Completed: solid `var(--success)`.
   - Current: solid `var(--accent)`, with pulse animation.
   - Pending: outline `var(--text-quaternary)`.

3. **Success state**: Replace the green banner with a full-width success card:
   ```
   ✓ Deployed successfully in 12.3s

   https://my-portfolio.cloudify.app         [Copy]  [Visit Site]
   ```
   - Green checkmark: 32px, `var(--success)`.
   - URL: monospace, `--text-body`, clickable.
   - Buttons: side by side, "Copy" (secondary), "Visit Site" (primary).

4. **Build logs**: Below the progress section, collapsed by default. "View build logs" disclosure to expand. When expanded, use the same terminal styling as the Logs page.

### 3.14 BuildLogs Component (`components/dashboard/build-logs.tsx`)

**Current State**: Full-featured with search, auto-scroll, copy/download, expandable, status badge, stream + REST fallback.

**What Apple Would Change**:

1. The component is well-engineered. Keep the dual stream/REST fallback architecture.

2. **Visual changes only**:
   - Remove the `motion.div` animation on each log line. Performance > flourish.
   - Header height: 40px (current is 48px via `p-4`).
   - Search input: 32px height, integrated into the header row.
   - Footer: Remove. The "X lines" count and "Auto-scroll" checkbox are low-value chrome.
   - Auto-scroll: Enable by default, disable when the user scrolls up manually. Re-enable when they scroll to the bottom.

3. **Log line formatting**: Match the Logs page format for consistency.

---

## 4. Interaction Design

### 4.1 Loading States

**Hierarchy of loading indicators** (use the lightest possible):

| Duration | Indicator | Example |
|----------|-----------|---------|
| <200ms | None. Do not show any loading state. | Inline saves, toggle switches |
| 200ms-1s | Button spinner (16px, replace button text) | Form submissions, API calls |
| 1s-3s | Skeleton screen | Page loads, data fetches |
| 3s+ | Progress indicator with status text | Deployments, builds |

**Rules**:
- NEVER show a full-page loading spinner. Always use skeleton screens or component-level loading.
- Skeleton screens should match the EXACT layout of the loaded content. No generic skeleton shapes.
- Loading states should not cause layout shift when content arrives.
- Add a `200ms` delay before showing any loading indicator to prevent flash-of-loading for fast operations.

### 4.2 Error States

**Hierarchy of error display**:

| Severity | Display | Example |
|----------|---------|---------|
| Field validation | Inline text below field | "Email is required" |
| Action failure | Toast notification (bottom-right) | "Failed to delete project" |
| Page load failure | Inline error card with retry | "Could not load deployments" |
| System error | Full-page error boundary | 500, network down |

**Error card design**:
```
  ⚠ Something went wrong
  We could not load your deployments.

  [Try Again]
```
- Icon: 24px, `var(--warning)`.
- Title: `--text-headline`, `--weight-semibold`.
- Description: `--text-body`, `--text-secondary`.
- Button: secondary variant.
- Card: `var(--surface-primary)`, `var(--border-primary)`, centered in the content area.

**Toast notifications**:
- Position: bottom-right, 24px from edges.
- Width: 360px.
- Duration: 5s for success, 8s for errors (errors need more reading time).
- Animation: slide up from bottom + fade in (200ms).
- Close: click X or swipe right.
- Stack: maximum 3 visible. New toasts push older ones up.
- Style:
  ```css
  .toast {
    background: var(--surface-elevated);
    border: 1px solid var(--border-secondary);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    padding: 12px 16px;
  }
  ```

### 4.3 Transitions Between Pages

**Current State**: Uses a `PageTransition` wrapper with Framer Motion in the dashboard layout.

**Apple Approach**:
- Remove the page transition wrapper entirely.
- Use the browser's native View Transitions API for cross-page transitions.
- Transition: simple `opacity` crossfade, 200ms.
- NO slide animations between dashboard pages. Sliding implies spatial hierarchy (going deeper or back). Most dashboard pages are siblings.
- The ONLY slide transition allowed: navigating from a list to a detail page (e.g., Projects list -> Project detail). Use a right-to-left slide (200ms, ease-out). Going back: left-to-right slide.

### 4.4 Focus Management

**Current State**: Focus rings use `ring-2 ring-ring ring-offset-2`.

**Apple Approach**:
```css
/* Remove ring utilities. Use box-shadow instead. */
*:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-subtle);
}

/* For elements on dark backgrounds */
.dark *:focus-visible {
  box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.4);
}

/* Inputs already have their own focus style -- skip the generic one */
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  box-shadow: none; /* Uses the input-specific focus style instead */
}
```

Focus order should follow visual order. Ensure all interactive elements are reachable via Tab. Trap focus within modals and dialogs.

### 4.5 Keyboard Shortcuts

**Current State**: Custom `useKeyboardShortcuts` hook with navigation shortcuts. `useNavigationShortcuts` provides G/P/D/Cmd+D/Cmd+N/Cmd+Shift+S mappings.

**What Apple Would Change**:

1. **Reduce shortcuts to essentials**:
   - `Cmd+K`: Open command palette (the PRIMARY shortcut).
   - `Cmd+N`: New project.
   - `Esc`: Close any open modal/dialog/popover.
   - `?`: Show keyboard shortcuts help.
   - Remove single-letter shortcuts (G, P, D) -- they conflict with browser behavior (e.g., "D" bookmarks in some browsers, text input in search fields).

2. **Discoverability**: Show shortcut hints in the command palette results, not in a separate modal. Remove the dedicated keyboard shortcuts modal.

3. **Platform awareness**: Show `Cmd` on macOS, `Ctrl` on Windows/Linux. Current implementation shows the Mac symbol. Use `navigator.platform` or `navigator.userAgentData` to detect.

### 4.6 Hover and Micro-interactions

**Guidelines for all interactive elements**:

| Element | Hover Effect | Active/Press Effect |
|---------|-------------|-------------------|
| Button (primary) | `brightness(1.08)` | `scale(0.98)` + `brightness(0.95)` |
| Button (ghost) | `bg: var(--surface-secondary)` | `bg: var(--surface-tertiary)` |
| Card | `shadow: var(--shadow-md)` + `border-color: var(--border-primary)` | `scale(0.995)` |
| Table row | `bg: var(--surface-secondary)` | N/A |
| Link | `opacity: 0.8` | `opacity: 0.6` |
| Nav item | `bg: var(--surface-tertiary)` | `bg: var(--accent-subtle)` |
| Toggle switch | N/A | Thumb slides with spring easing (150ms) |
| Checkbox | border-color darkens | Checkmark draws in with spring animation (150ms) |
| Icon button | `bg: var(--surface-secondary)`, circular | `scale(0.92)` |

**Timing**: All hover transitions use `--duration-instant` (100ms). All press/active transitions use `--duration-instant` with `--ease-spring`.

### 4.7 Scrolling Behavior

1. **Dashboard header**: Sticky on scroll with `--material-thin` backdrop.
2. **Sidebar**: Fixed. Does not scroll with page content. If sidebar content overflows, the nav items scroll independently within the sidebar.
3. **Build logs**: Smooth scroll to bottom for new entries. Scroll lock when user scrolls up.
4. **Lists**: Native browser scroll. No custom scrollbars on macOS. On Windows/Linux:
   ```css
   ::-webkit-scrollbar {
     width: 6px;
   }
   ::-webkit-scrollbar-track {
     background: transparent;
   }
   ::-webkit-scrollbar-thumb {
     background: var(--text-quaternary);
     border-radius: 3px;
   }
   ::-webkit-scrollbar-thumb:hover {
     background: var(--text-tertiary);
   }
   ```

### 4.8 Responsive Design

**Current State**: The dashboard uses a sidebar-based layout with mobile nav. The sidebar hides below `lg` breakpoint, replaced by a hamburger menu.

**Apple Approach**:

| Breakpoint | Layout |
|-----------|--------|
| < 640px (mobile) | Full-width content. Bottom tab bar navigation (5 items: Dashboard, Projects, Deploy, Search, Settings). No sidebar. |
| 640px-1024px (tablet) | Collapsible sidebar (icon-only, 56px wide). Expand on hover to full 240px. |
| > 1024px (desktop) | Full sidebar (240px) + content area. |

**Bottom tab bar for mobile**:
```
   Dashboard    Projects    +New    Search    Settings
      ●           ○          ○        ○         ○
```
- 5 items maximum.
- Active: `var(--accent)`.
- Inactive: `var(--text-tertiary)`.
- Height: 83px (safe area included).
- "+New" is a centered primary action button (48x48px circle, `var(--accent)` background, white plus icon).

This replaces the current hamburger menu pattern, which requires TWO taps to navigate (open menu + select item). The bottom tab bar provides ONE-TAP navigation to the 4 most common destinations plus the primary creation action.

---

## 5. Landing Page Apple Redesign

### 5.1 Global Landing Page Principles

**Current State**: The landing page follows Vercel's layout pattern: Hero > HowItWorks > Features > Templates > Comparison > Testimonials > CTA. It is information-dense, with large sections and heavy animation.

**Apple Approach**:
- Each section occupies the FULL viewport height (100vh minimum).
- Scroll-triggered animations reveal content as the user scrolls.
- Maximum content width: 980px (Apple standard, down from current 1100px).
- Copy is dramatically reduced. Every word earns its place.
- No auto-playing animations. Everything triggers on scroll intersection.

### 5.2 Header/Navigation (`components/layout/header.tsx`)

**Current State**: Fixed header with scroll-triggered blur. Mega menu for Products (3-column grid), dropdown for Solutions. 6 nav items + theme toggle + auth buttons.

**Apple Redesign**:

```
   Cloudify      Products    Solutions    Enterprise    Pricing    Docs       [Sign In]  [Get Started]
```

1. **Simplify to 5 nav items**: Products, Solutions, Enterprise, Pricing, Docs. Remove "Resources" (fold into Docs).

2. **Mega menu**: Keep for Products, but redesign as a 2-column layout:
   ```
   Hosting                    Storage
   Deploy any framework       Blob and KV storage

   Functions                  Analytics
   Serverless compute         Traffic and performance

   Domains                    Edge Config
   Custom domain management   Runtime configuration
   ```
   - Each item: icon (24px) + name (`--text-body`, `--weight-medium`) + description (`--text-footnote`, `--text-secondary`).
   - Menu background: `--material-thick` (translucent with blur).
   - Entry animation: `opacity 0->1` + `translateY(-4px) -> 0`, 200ms.

3. **Header background**:
   - At top of page: fully transparent, no border.
   - After 20px scroll: `--material-thin` with 1px bottom border at `var(--separator)`.
   - Transition: 200ms.

4. **Auth buttons**:
   - "Sign In": ghost button, `--text-body`.
   - "Get Started": primary button, `--radius-full` (pill), `var(--accent)` background.

5. **Mobile header**: Logo left, hamburger right. Menu slides down as a full-width panel with solid background.

### 5.3 Hero Section (`components/landing/hero.tsx`)

**Current State**: Announcement badge, gradient-text headline, subtitle, 2 CTA buttons, animated terminal with build steps, stats row, trust badges.

**Apple Redesign**:

The hero should communicate ONE message in under 3 seconds.

```
                      Deploy at the Speed of Push

   Ship your frontend to production with zero configuration.
   Every git push triggers a build. Every build gets a URL.

              [Start Deploying]       View Demo ->


                    ┌──────────────────────────┐
                    │  $ cloudify deploy       │
                    │  ✓ Cloned repository     │
                    │  ✓ Installed deps (2.1s) │
                    │  ✓ Built project (4.3s)  │
                    │  ✓ Deployed to edge      │
                    │                          │
                    │  ● Live at:              │
                    │  my-app.cloudify.app     │
                    └──────────────────────────┘
```

**Specific Changes**:

1. **Remove the announcement badge**. If there is a product announcement, use a thin banner ABOVE the header, not inside the hero.

2. **Headline**: "Deploy at the Speed of Push". NOT gradient text. `--text-large-title` (34px) on mobile, 56px on desktop. `--weight-bold`. `color: var(--text-primary)`. Pure, clean typography. No gradients, no text effects.

3. **Subtitle**: Two lines maximum. `--text-title-3` (20px). `--text-secondary`. `max-width: 600px`.

4. **CTAs**: Two buttons.
   - Primary: "Start Deploying" -- `var(--accent)`, `--radius-full`, height 48px, `padding: 0 28px`.
   - Secondary: "View Demo ->" -- text link style, no button chrome.

5. **Terminal demo**: Keep the animated terminal but reduce it:
   - Total animation duration: 2.5 seconds (not 3.6s).
   - 5 steps with 500ms between each.
   - Font: Geist Mono, `--text-footnote`.
   - Background: `var(--surface-recessed)`.
   - Border: 1px `var(--border-primary)`.
   - Border-radius: `var(--radius-md)`.
   - Remove the animated typing effect. Each line APPEARS (opacity 0->1, 100ms) with its checkmark.
   - The URL at the bottom should be a real clickable link.

6. **Stats row**: Remove entirely. Social proof numbers without context ("10B+ requests") mean nothing to a new visitor. They cannot verify these claims.

7. **Trust badges**: Remove the text-only company logos. They add clutter without credibility (text logos are not recognizable). If social proof is needed, add it to the testimonials section.

### 5.4 Features Section (`components/landing/features.tsx`)

**Current State**: 8 feature cards in a 4-column grid, plus a large highlight feature with terminal mockup. All cards have the same `bg-secondary text-foreground` icon styling.

**Apple Redesign**:

**Layout**: 3 feature highlights, each taking the full viewport width, revealed on scroll.

```
Feature 1: Zero-Config Deploys
───────────────────────────────
[Left: text content]     [Right: browser mockup showing deploy flow]

Feature 2: Edge Network
───────────────────────────────
[Left: world map with dots]     [Right: text content]

Feature 3: Instant Rollback
───────────────────────────────
[Left: text content]     [Right: timeline showing rollback UI]
```

**Each feature section**:
- Full viewport height (100vh), centered content.
- Alternating layout: text-left/visual-right, then visual-left/text-right.
- Section label: `--text-caption`, `--tracking-widest`, `--accent`, ALL-CAPS. e.g., "INFRASTRUCTURE".
- Headline: `--text-title-1`, `--weight-bold`.
- Description: `--text-body`, `--text-secondary`, `max-width: 400px`, `--leading-relaxed`.
- Visual: A realistic UI mockup or illustration, NOT an icon.

**Remove the 8-card grid**. Apple never presents 8 features in a grid. That is a data dump, not a narrative. Select the TOP 3 features and tell a story about each one.

**Remove the "Learn more" hover effect**. If there is more to learn, link to documentation. Do not hide content behind hover states.

### 5.5 Templates Section (`components/landing/templates.tsx`)

**Current State**: Category filter tabs, 9 template cards with gradient previews, framework emoji icons, deploy time badges, demo links.

**Apple Redesign**:

1. **Reduce to 6 templates**: Next.js, React, Vue, Svelte, Astro, Nuxt. Remove AI Chatbot, Shopify Hydrogen, and Blog Starter -- they are niche use cases that clutter the primary message.

2. **Remove category filters**. With 6 templates, filtering is unnecessary.

3. **Template card redesign**:
   ```
   ┌───────────────────────┐
   │                       │
   │     [Framework Logo]  │   <- SVG logo, not emoji, 48px, centered
   │       Next.js         │   <- name, --text-headline, --weight-semibold
   │                       │
   │  The React framework  │   <- description, --text-footnote, --text-secondary
   │  for the web          │
   │                       │
   │      [Deploy]         │   <- button, primary, sm
   │                       │
   └───────────────────────┘
   ```
   - Card height: 240px.
   - Background: solid `var(--surface-primary)`, NOT gradient.
   - Border: 1px `var(--border-secondary)`.
   - On hover: `var(--shadow-md)`.
   - Remove deploy time badges. They are meaningless without context.
   - Remove demo links. Demo links lead to 404s during development and are maintenance-heavy.
   - Use proper SVG framework logos, not emoji icons.

4. **Grid**: 3 columns on desktop, 2 on tablet, 1 on mobile.

### 5.6 How It Works Section (`components/landing/how-it-works.tsx`)

**Current State**: 3-step process with numbered cards, connector lines, code snippets.

**Apple Redesign**:

```
                        How It Works

     1                       2                       3
   Connect               Push Code              Go Live
   Link your GitHub      Every commit triggers   Your site is live
   repository in         a build on our          on a global edge
   one click.            infrastructure.         network.

   [GitHub auth UI]      [Terminal: build]       [Globe with dots]
```

- 3 columns, equal width.
- Step number: 48px circle, `var(--surface-secondary)` background, `--text-title-2` size.
- Step title: `--text-headline`, `--weight-semibold`.
- Step description: `--text-body`, `--text-secondary`, 3 lines max.
- Visual below each step: Simple illustration, NOT a screenshot.
- Remove connector lines between steps. The numbered sequence is sufficient.
- Scroll-triggered reveal: each step fades in with 100ms stagger (left to right).

### 5.7 Comparison Section (`components/landing/comparison.tsx`)

**Current State**: Feature comparison table against Vercel, Netlify, AWS Amplify. Uses checkmarks and X marks.

**Apple Redesign**:

**Remove this section entirely**.

Competitive comparison tables are a B2B SaaS pattern, not an Apple pattern. Apple never compares itself to competitors on its marketing pages. Instead, the features section should implicitly communicate superiority through the quality of the presentation.

If competitive positioning is absolutely required for business reasons, move it to a separate `/compare` page linked from the footer, not the landing page.

### 5.8 Testimonials Section (`components/landing/testimonials.tsx`)

**Current State**: 6 testimonial cards with quotes, names, roles, company, and quantified metrics.

**Apple Redesign**:

```
                     Loved by developers


   "Cloudify reduced our deployment time from 15 minutes to 45 seconds.
    It is the fastest CI/CD pipeline we have ever used."

                    Sarah Chen
                    CTO, Acme Corp


              <  1 of 4  >
```

- Single testimonial visible at a time. NOT a grid.
- Quote: `--text-title-3` (20px), `--weight-regular`, `--text-primary`, `font-style: italic`.
- Name: `--text-body`, `--weight-semibold`, `--text-primary`.
- Role + Company: `--text-footnote`, `--text-secondary`.
- Navigation: Subtle left/right arrows. Auto-advance every 8 seconds.
- NO headshot photos (they are usually low quality and inconsistent).
- Maximum 4 testimonials. Quality over quantity.
- Center-aligned, `max-width: 640px`.
- Remove quantified metrics from the cards. The quote IS the metric. "Reduced from 15 minutes to 45 seconds" is more powerful than a separate "95% faster" badge.

### 5.9 CTA Section (`components/landing/cta.tsx`)

**Current State**: Gradient background, trust indicators, "Start Deploying Free" headline, two buttons.

**Apple Redesign**:

```
                     Start building today.
                     It is free.

                     [Get Started Free]

          No credit card required. Deploy in 60 seconds.
```

- Background: `var(--surface-primary)`. NO gradient. The CTA should be confident in its simplicity.
- Headline: `--text-title-1`, `--weight-bold`, 2 lines.
- Button: Single button, `var(--accent)`, `--radius-full`, 48px height.
- Trust line: `--text-footnote`, `--text-tertiary`.
- Remove the second CTA button ("Contact Sales"). Enterprise inquiries are handled by the Enterprise nav link.
- Remove trust indicators (company logos, stats). They were already not adding value in the hero.
- Vertical spacing: `--space-8` (64px) above and below.

### 5.10 Footer (`components/layout/footer.tsx`)

**Current State**: Status bar with green dot, 5-column link grid, social icons, legal links. Max-width 1100px.

**Apple Redesign**:

```
───────────────────────────────────────────────────────────────
Products        Resources       Company         Legal
Hosting         Documentation   About           Privacy
Functions       Guides          Careers         Terms
Storage         Blog            Contact         Cookies
Analytics       Changelog       Partners
Domains         Status

───────────────────────────────────────────────────────────────
Copyright 2026 Cloudify. All rights reserved.    [GitHub] [X] [Discord]
```

1. **4 columns** (not 5). Reduce to the essential link categories.
2. **Remove the status bar** with the green dot. Status belongs on a `/status` page, not in the global footer.
3. **Font**: `--text-footnote`, `--text-secondary` for links. `--text-caption`, `--text-tertiary` for copyright.
4. **Link hover**: `color: var(--text-primary)`, 100ms transition.
5. **Social icons**: 16px, `--text-tertiary`, hover `--text-secondary`.
6. **Column header**: `--text-footnote`, `--weight-semibold`, `--text-primary`.
7. **Max-width**: 980px (matching landing page content width).
8. **Separator**: 1px `var(--separator)` above the footer.

---

## Appendix: Priority Implementation Order

### Phase 1: Foundation (Week 1-2)
1. Design system CSS variables (colors, typography, spacing, radii, shadows)
2. Dark mode palette adjustment (#000000 -> #1C1C1E)
3. Input component height increase (36px -> 44px)
4. Button variant consolidation (6 -> 4)
5. Skeleton shimmer animation
6. Focus ring standardization

### Phase 2: Core Dashboard (Week 3-4)
1. Sidebar redesign (remove icons, active state change)
2. Dashboard page simplification (greeting, 3 metrics, recent deployments)
3. Header redesign (48px height, simplified breadcrumbs)
4. Settings page vertical navigation
5. Tab sliding indicator

### Phase 3: Detail Pages (Week 5-6)
1. Project detail header and metadata
2. Deployment list refinement
3. Analytics stat display (cardless typography)
4. Domain DNS configuration inline panel
5. Log viewer full-height

### Phase 4: Landing Page (Week 7-8)
1. Hero section simplification
2. Features narrative redesign (3 full-viewport sections)
3. Templates card redesign (SVG logos, no gradients)
4. Testimonials carousel
5. CTA simplification
6. Footer consolidation

### Phase 5: Interaction Polish (Week 9-10)
1. Motion system unification (4 durations, 3 easings)
2. Loading state hierarchy implementation
3. Error state standardization
4. Mobile bottom tab bar
5. View Transitions API integration
6. Accessibility audit (WCAG 2.1 AA)

---

## Key Metrics for Success

| Metric | Current (Estimated) | Target |
|--------|-------------------|--------|
| Lighthouse Performance | ~75 | 95+ |
| First Contentful Paint | ~1.8s | <1.0s |
| Cumulative Layout Shift | ~0.15 | <0.05 |
| Color contrast ratio (min) | ~3.5:1 | 4.5:1+ (AA) |
| Interactive elements without focus style | ~30% | 0% |
| Pages with custom animation systems | 12+ | 0 (unified) |
| CSS custom properties defined | ~20 | ~60 (complete system) |
| Component variants (buttons) | 6 | 4 |
| Font sizes in use | 15+ | 8 |
| Spacing values in use | 20+ | 7 |
