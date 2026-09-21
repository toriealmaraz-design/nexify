# Vercel Web Interface Guidelines Audit — Nexify Frontend

**Audited files:** Login.jsx, Landing.jsx, admin/Dashboard.jsx, creator/Dashboard.jsx, student/Dashboard.jsx, affiliate/Dashboard.jsx, tailwind.config.js  
**Guidelines source:** vercel-labs/web-interface-guidelines (command.md)  
**Date:** 2026-09-21

---

## Login.jsx

**login.jsx:141,153** - input missing `autocomplete` attribute (email should be `autocomplete="email"`, password `autocomplete="current-password"`)

**login.jsx:203-211** - demo account buttons: `<div>` with `onClick` for navigation-like action (sets email/password). Not a pure navigation, but the click target is a `<button>` so acceptable. However, missing keyboard-visible focus ring — relies on browser default.

**login.jsx:141,153** - `transition-all duration-200` — `transition-all` is an anti-pattern; list properties explicitly (e.g. `transition-colors duration-200`).

**login.jsx:35-46** - custom animation classes injected via `<style>`. No `prefers-reduced-motion` guard. The `animate-fade-slide-up`, `animate-pulse-glow`, `animate-float`, `animate-shimmer` all run regardless of user preference.

**login.jsx:22** - `pulseGlow` animation uses `box-shadow` which is not compositor-friendly; should animate `filter` or use a `transform`-based alternative.

**login.jsx:175-177** - submit button arrow icon: decorative SVG, should have `aria-hidden="true"`.

**login.jsx:187-189** - link arrow icon: decorative, should have `aria-hidden="true"`.

**login.jsx:128-129** - error banner SVG icon: decorative inline with text, should have `aria-hidden="true"`.

**login.jsx:94,114** - logo `<div>` with `<span className="text-black font-bold text-2xl">N</span>`: not an icon-only button (text inside), acceptable.

✅ **Pass:** form labels present (line 136, 148), heading hierarchy (h1), error state inline, loading spinner during submit, placeholders end with example pattern.

---

## Landing.jsx

**landing.jsx:40-46** - chat toggle button: `aria-label="Open Nexa chat"` present ✓. But missing `onKeyDown` handler — keyboard users can't activate via Enter/Space (button relies on onClick only).

**landing.jsx:58** - close button (`&times;`): text button, acceptable. Missing `onKeyDown`.

**landing.jsx:92-98** - chat input: `focus:outline-none focus:ring-2 focus:ring-[#7C3AED]` ✓. Missing `autocomplete`, `name`, `aria-label` (placeholder "Ask Nexa..." is descriptive enough but explicit label preferred).

**landing.jsx:144-155** - header search input: `focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent` ✓. Missing `name` attribute, `autocomplete="off"` (search field, not auth).

**landing.jsx:280-291** - marketplace search input: same focus pattern ✓. Missing `name`.

**landing.jsx:298** - `"..."` should be `"…"` (ellipsis character, not three dots) per typography rules.

**landing.jsx:176-179** - hero h1: `text-4xl md:text-5xl`. Should add `text-wrap: balance` to prevent widow/orphan on the two-line heading.

**landing.jsx:134** - header `sticky top-0 z-40`: no `scroll-margin-top` on in-page anchors (not applicable here since no anchor links, but note for future).

**landing.jsx:331** - course cover `<img>`: has `alt={course.title}` ✓. But missing explicit `width` and `height` — causes CLS. Add `loading="lazy"` for below-fold cards.

**landing.jsx:157-163** - nav links use `<a>` tags instead of `<Link>` from react-router-dom. This causes full page reloads instead of client-side navigation. Should be `<Link to="/login">` and `<Link to="/register">`.

**landing.jsx:207-218** - CTA buttons: `<a>` tags with `href` — these are navigation links styled as buttons, acceptable pattern. But also use plain `<a>` not `<Link>`.

**landing.jsx:570-574** - radio button labels: label wraps input ✓ (single hit target). Good.

**landing.jsx:480-483** - error msg in checkout: `"Checkout failed. Please try again."` — error should include fix/next step, not just problem statement.

**landing.jsx:516,526,536** - checkout form inputs: missing `name` attributes and `autocomplete` values (`name="name" autocomplete="name"`, `name="email" autocomplete="email"`, `name="phone" autocomplete="tel" inputmode="tel"`).

**landing.jsx:40-46** - chat toggle: `touch-action: manipulation` not set (prevents double-tap zoom delay on mobile).

**landing.jsx:80-83** - loading dots bounce animation: no `prefers-reduced-motion` guard.

**landing.jsx:22-31** - shimmer `ANIM_STYLES` injected globally: no `prefers-reduced-motion` media query.

✅ **Pass:** form labels in checkout (line 515, 525, 535), semantic button usage, empty states handled, keyboard-accessible `<button>` for CTAs.

---

## admin/Dashboard.jsx

**admin/Dashboard.jsx:132-137** - Sign Out button: `<button onClick={logout}>` with no `focus-visible` ring. Relies on browser default outline. Should add `focus-visible:ring-2 focus-visible:ring-[#7C3AED]`.

**admin/Dashboard.jsx:103** - SVG placeholder icon: decorative, should have `aria-hidden="true"`.

**admin/Dashboard.jsx:20-22** - logo `<div>` with text "N": not icon-only, acceptable.

**admin/Dashboard.jsx:48-50,60-63,72-75,84-87** - section headings use emoji prefix (📋, 📈, 👥, 🎨) in `<h2>`. Emoji in headings is acceptable but may cause screen reader verbosity ("graphic 별세…"). Consider `aria-hidden="true"` on emojis.

**admin/Dashboard.jsx:30-43** - stat cards: emoji icons (💰, 🔒, 📋, 👥) as text content. Not `<img>`, so no alt needed, but screen readers will announce the emoji Unicode name.

✅ **Pass:** consistent dark card pattern, heading hierarchy (h1 → h2), stat card pattern consistent with other dashboards, form-free page (no input issues).

---

## creator/Dashboard.jsx

**creator/Dashboard.jsx:174-178** - Nexa analytics input: `focus:outline-none focus:ring-2 focus:ring-[#7C3AED]` ✓. Missing `name`, `autocomplete="off"` (not an auth field), `aria-label` (placeholder is descriptive).

**creator/Dashboard.jsx:194-196** - Sign Out button: `<button>` with no `focus-visible` ring.

**creator/Dashboard.jsx:68-73** - New Course button: has SVG icon + text ✓. Good button pattern.

**creator/Dashboard.jsx:90-92** - Create Course button: text-only ✓.

**creator/Dashboard.jsx:69-71** - New Course button SVG: decorative, should have `aria-hidden="true"`.

**creator/Dashboard.jsx:19** - `useState(() => {...}, [])` — this is a bug; should be `useEffect`. Not a design guidelines issue but a functional bug.

✅ **Pass:** stat card pattern consistent (matches admin/student/affiliate), dark card style consistent, course list empty state handled, status badges use consistent pattern.

---

## student/Dashboard.jsx

**student/Dashboard.jsx:261-265** - Nexa input: `focus:outline-none focus:ring-2 focus:ring-[#7C3AED]` ✓. Missing `name`, `autocomplete="off"`, `aria-label`.

**student/Dashboard.jsx:281-283** - Sign Out button: no `focus-visible` ring.

**student/Dashboard.jsx:95-96** - course thumb `<img>`: has `alt={course.title}` ✓. Missing `width` and `height` (CLS risk). Should add `loading="lazy"`.

**student/Dashboard.jsx:145-147** - trailer icon SVG: decorative, should have `aria-hidden="true"`.

**student/Dashboard.jsx:196** - progress bar: `style={{ width: '0%' }}` hardcoded — this is a static placeholder, acceptable for skeleton state.

**student/Dashboard.jsx:229** - date display: `new Date(order.createdAt).toLocaleDateString()` ✓ — uses `Intl.DateTimeFormat` under the hood. Good.

**student/Dashboard.jsx:60** - currency: `(orders.reduce(...)).toFixed(2)` — manual formatting. Should use `Intl.NumberFormat` for locale-aware currency.

**student/Dashboard.jsx:114,188** - currency values: `.toFixed(2)` throughout — consistent but not locale-aware.

✅ **Pass:** order status badges use consistent color semantics (emerald/amber/red), enrolled courses empty state handled, progress bar pattern, receipt list pattern.

---

## affiliate/Dashboard.jsx

**affiliate/Dashboard.jsx:252-256** - Nexa input: `focus:outline-none focus:ring-2 focus:ring-[#7C3AED]` ✓. Missing `name`, `autocomplete="off"`, `aria-label`.

**affiliate/Dashboard.jsx:272-273** - Sign Out button: no `focus-visible` ring.

**affiliate/Dashboard.jsx:138-140** - Generate Link button spinner SVG: decorative during loading, should have `aria-hidden="true"`.

**affiliate/Dashboard.jsx:154-158** - Copy button: `<button>` with no `aria-label` (icon-less, has text "Copy" ✓).

**affiliate/Dashboard.jsx:64-67** - stat cards: blue-400 for "Total Clicks" — introduces a 4th accent color. The palette is otherwise disciplined (purple primary, emerald success, amber warning). Blue-400 for clicks is a minor deviation; consider using purple-400 for consistency.

**affiliate/Dashboard.jsx:162** - `font-mono font-medium` on affiliate code: good use of monospace for code/token display.

✅ **Pass:** commission ledger cards use consistent rounded-xl pattern, link generator empty state, affiliate links list pattern, tracking link display with copy button.

---

## tailwind.config.js

**tailwind.config.js:61** - `fontFamily.sans`: `['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']` ✓ — Inter is Vercel's recommended font. Good.

**tailwind.config.js:72** - `borderRadius.nexify: '0.5rem'` — custom radius token. Used in Landing.jsx (`rounded-nexify`) but inconsistently: some components use `rounded-xl` (0.75rem) or `rounded-2xl` (1rem). The `rounded-nexify` token should be the single source of truth for card/button rounding.

**tailwind.config.js:9-58** - color system: well-organized with `midnight` (dark neutrals), `neon` (purple/cyan/lavender accents), `canvas` (light bg), `momo` (brand payment colors). The neon purple `#7c3aed` is the primary accent — disciplined usage.

**tailwind.config.js:64-70** - boxShadow: custom `card-sm`, `card-md`, `card-lg`, `bump-glow`, `nexa-fab`. Good design tokens. But `card-lg` is defined and used in Landing.jsx; the dashboards don't use shadow tokens consistently (they rely on border-only cards).

**Spacingscale:** No custom spacing tokens defined. The codebase uses Tailwind's default scale (`p-4`, `p-6`, `mb-8`, `gap-4`, etc.) — this is acceptable since Tailwind's 4px base grid is already a consistent scale. However, `px-3` (12px) appears in some inputs vs `px-4` (16px) in others — minor inconsistency.

---

## Cross-Cutting Findings

### Sign Out buttons (all 4 dashboards)
- **admin/Dashboard.jsx:132**, **creator/Dashboard.jsx:194**, **student/Dashboard.jsx:281**, **affiliate/Dashboard.jsx:272**
- All use `<button onClick={logout}>` with `text-white/40 hover:text-white` but no `focus-visible:ring-*` — fails Focus States rule. Add `focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:outline-none`.

### `prefers-reduced-motion` (all animated files)
- **login.jsx:11-47** - all custom animations (fadeSlideUp, fadeIn, pulseGlow, float, shimmer)
- **landing.jsx:29-31** - shimmer gradient animation
- **landing.jsx:80-83** - bounce loading dots
- No `@media (prefers-reduced-motion: reduce)` guards anywhere. Animations >5s (pulseGlow at 2.8s infinite, float at 3s infinite, shimmer at 2.5s infinite) are decorative loops that should stop or reduce under reduced motion.

### `transition: all` anti-pattern
- **login.jsx:141,153** - `transition-all duration-200`
- Should be `transition-colors duration-200` (only `border` and `ring` colors change on focus).

### Link vs Button for navigation
- **landing.jsx:157-163** - header nav uses `<a>` not `<Link>` — causes full page reloads. Should use `<Link>` from react-router-dom.
- **landing.jsx:207-218** - CTA buttons use `<a>` with `href` — same issue. Should be `<Link>`.

### Images without dimensions
- **landing.jsx:331-332** - course cover img: no `width`/`height`, no `loading="lazy"`
- **student/Dashboard.jsx:95-96** - course thumb img: no `width`/`height`, no `loading="lazy"`

### Input `autocomplete` / `name` attributes (checkout modal)
- **landing.jsx:516** - name input: no `name`, no `autocomplete="name"`
- **landing.jsx:526** - email input: no `name`, no `autocomplete="email"`
- **landing.jsx:536** - phone input: no `name`, no `autocomplete="tel"`, no `inputmode="tel"`

### Form inputs missing labels (search fields)
- **landing.jsx:144** - header search: no `<label>` or `aria-label` (placeholder only)
- **landing.jsx:280** - marketplace search: same
- **creator/Dashboard.jsx:174** - Nexa input: placeholder only
- **student/Dashboard.jsx:261** - Nexa input: placeholder only
- **affiliate/Dashboard.jsx:252** - Nexa input: placeholder only

### Hardcoded currency formatting
- Multiple files use `.toFixed(2)` for GH₵ values. Should use `Intl.NumberFormat('en-GH', { style: 'currency', currency: ' GHS' })` or similar for locale-aware formatting. Not critical since all users are Ghanaian, but not future-proof.

### Ellipsis character
- **landing.jsx:298** - `"..."` → should be `"…"`

---

## Summary

| Category | Status |
|---|---|
| Typography system | ✅ Inter font, consistent heading hierarchy |
| Color discipline | ✅ Purple primary, emerald/amber/red semantic — minor blue-400 in affiliate stats |
| Spacing scale | ⚠️ Tailwind default scale used; `rounded-nexify` token defined but inconsistently applied vs `rounded-xl`/`rounded-2xl` |
| Component patterns | ✅ Stat cards, dark cards, form inputs, buttons all follow consistent patterns across dashboards |
| Responsive behavior | ✅ `max-w-6xl`, `lg:grid-cols-4`, `md:grid-cols-2` breakpoints used consistently |
| Accessibility | ⚠️ 4 sign-out buttons missing focus-visible; multiple inputs missing labels/autocomplete; link vs button navigation issues in Landing |
| Animation | ❌ No `prefers-reduced-motion` guards anywhere |
| Performance | ⚠️ Images missing dimensions (CLS risk); `transition-all` anti-pattern |
| Forms | ⚠️ Checkout inputs missing `name`/`autocomplete`; search/Nexa inputs missing labels |

**Bottom line:** Nexify's frontend has a strong, disciplined design system — consistent dark theme, purple accent, Inter typography, reusable component patterns. The main gaps vs Vercel guidelines are: (1) no reduced-motion handling, (2) focus-visible missing on sign-out buttons, (3) form inputs lacking proper autocomplete/name/label attributes, and (4) `<a>` used where `<Link>` should be for client-side routing.
