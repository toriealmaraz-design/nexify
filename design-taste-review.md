# Nexify Design-Taste Review

**Date:** 2026-09-21 | **Pages reviewed:** `/login` (Login.jsx), `/` (Landing.jsx)
**Design system:** Midnight Neon — `#0F172A` bg, `#7C3AED` accent, Inter typeface, Tailwind v3 + custom config
**Screenshots captured:** login page rendered cleanly; landing page was blank in browser due to a runtime crash (missing `SkeletonGrid` import — see Issue 6)

---

## Design Read

Reading this as: **SaaS marketplace landing + auth gateway for a West African e-learning audience**, with a **dark-tech / midnight-neon** language, leaning toward a **custom Tailwind utility system** with a single purple accent. The brief is not minimalist, not premium-consumer, not editorial — it's a functional marketplace with a branded dark surface.

---

## 1. Color Usage

### Findings

**What works:**
- Single-accent discipline is strong. `#7C3AED` (neon-purple-500) appears on the logo, primary buttons, focus rings, link hovers, demo-account role labels, and the hero badge. No color drift.
- The dark base (`#0F172A` / midnight-950) is consistent across the login page and the landing hero + footer. Neutral hierarchy is clean: white → white/70 → white/40 → white/30, no warm/cool gray mixing.
- Cyan (`#22D3EE`) and lavender (`#A78BFA`) appear only in the avatar stack on the hero visual panel — used as tiny surface accents, not as competing CTAs. Acceptable.

**What fails:**
- **Theme flip mid-page (CRITICAL):** The landing page hero is `bg-[#0F172A]` (dark), then the course marketplace section is `bg-white` (pure light), then the footer returns to `bg-[#0F172A]`. This is a hard Page Theme Lock violation — the user walks from a dark surface into a white dashboard and back to dark. The marketplace search input also shifts to `bg-[#EDE9FE]` (canvas-100, a light lavender) on the white section, reinforcing the flip.
- **Two different input styles for the same component:** The hero search input uses dark translucent styling (`bg-white/10 border-white/20 placeholder-white/40`), while the marketplace search input uses a light lavender fill (`bg-[#EDE9FE] placeholder-slate-400`). Same page, same component type, two different visual registers. The marketplace variant also sits on white, where the lavender fill has weak contrast against the white background for the placeholder text.
- **AI-purple adjacency:** The skill's LILA RULE discourages defaulting to purple glows, but Nexify *owns* purple as its brand color, so the override applies. Execution is mostly disciplined — however the `pulseGlow` keyframe on the login logo (`box-shadow: 0 0 22px 6px rgba(124,58,237,0.30)` infinite loop) edges toward the "generic AI purple glow" tell. It's subtle, but it loops forever on a static brand mark.

### Before / After

| Before | After |
|---|---|
| Hero dark → marketplace white → footer dark | Pick one theme for the whole page. If keeping dark, make the marketplace `bg-[#0F172A]` or `bg-[#1E1B4B]` with light text. If going light, make the hero and footer light. Do not invert mid-scroll. |
| Hero search: dark glass (`bg-white/10`); marketplace search: light lavender (`bg-[#EDE9FE]`) | Unify input styling. On a dark page: `bg-white/10 border-white/20 placeholder-white/40` everywhere. On a light page: `bg-white border-slate-200 placeholder-slate-400` everywhere. Same component, same tokens. |
| `pulseGlow` infinite loop on the N logo | Replace with a single entrance animation (fade-in + subtle scale) that collapses to static. Remove the perpetual glow. |

---

## 2. Spacing Consistency

### Findings

**What works:**
- Login page: `space-y-4` on the form gives a clear 16px rhythm between label+input blocks. Card padding `p-6` (24px) is consistent. Gap between inputs and button reads well.
- Landing hero: `gap-12` between the two-column split, `gap-6` between CTAs, `gap-2` between feature badges — all Tailwind-standard, no custom math.
- Header: `py-3` (12px vertical) with `px-6` horizontal — compact, within the 80px nav-height cap.

**What fails:**
- **Inconsistent radius scale across pages:** Login uses `rounded-2xl` (16px) for the card and `rounded-xl` (12px) for inputs/buttons. Landing uses `rounded-nexify` (8px, custom `0.5rem`) for course cards, buttons, and search inputs. These are two different shape systems. The login page is soft (16/12px); the landing page is sharp (8px). A user moving from login to the app gets a visual radius shift.
- **Hero sub-element spacing crowding:** Inside the hero text column, the stats row (`gap-6`), feature badges (`gap-2`), and CTAs (`gap-3`) stack with shrinking gaps — 24px → 8px → 12px. The feature badges (three pill badges in a row) sit between the body text and the CTAs with no breathing room, making the hero feel bottom-heavy and busy.
- **Marketplace section padding too tight for a light section:** `py-16` (64px) on a white background reads as cramped compared to the hero's `py-24` (96px) on dark. A light section needs *more* padding, not less, to feel airy.

### Before / After

| Before | After |
|---|---|
| Login: `rounded-2xl` / `rounded-xl`; Landing: `rounded-nexify` (8px) | Pick one radius system. Recommended: `rounded-xl` (12px) for cards/panels, `rounded-lg` (8px) for inputs/buttons, full-pill for pills. Apply identically on both pages. Remove the custom `rounded-nexify` token or re-map it to `rounded-lg`. |
| Hero feature badges squeezed between subtext and CTAs | Add `mb-4` or `mb-6` above the CTA row so the badge row has visual separation. Or move the badges into the subtext paragraph as inline mention. |
| Marketplace `py-16` on white | If the page stays light in that section, increase to `py-20` or `py-24` to balance the density shift. |

---

## 3. Typography Hierarchy

### Findings

**What works:**
- Three-level hierarchy is present on both pages: display/headline (bold, large), label/body (medium, smaller), meta/placeholder (muted, small).
- Login headline "Welcome Back" at `text-2xl` (28px) above the form is appropriately sized — not oversized.
- Landing headline "Learn. Create. Earn." at `text-4xl md:text-5xl` (32/48px) splits across a `<br />` with the purple accent on the second line — the accent color carries the hierarchy, not raw size alone. This is the right call.

**What fails:**
- **Inter as default font:** The Tailwind config and `index.css` both declare `font-family: 'Inter', system-ui, ...`. The design-taste skill discourages Inter as the default sans — it's the most common AI-default font and makes the brand invisible. For a West African ed-tech platform with a neon-purple identity, a more characterful sans (Geist, Outfit, Cabinet Grotesk, Satoshi) would give the brand a distinct voice without changing the layout.
- **Sub-text contrast on login:** "Sign in to your account" renders at `text-white/40` (40% white = `#6b6b6b`-ish) on `#0F172A`. That's roughly a 4.0:1 contrast ratio — below WCAG AA for body text (4.5:1). The caption is legible but borders on failing.
- **Landing headline line-length:** The subtext paragraph ("Discover expert-led courses...") is `max-w-xl` (480px) at `text-lg` — that's about 75 characters per line, which is too long for comfortable reading. Body text should max out at 65ch. The paragraph is 33 words, which is under the 20-word guideline for hero subtext, but the line length still hurts readability.
- **No type scale tokens:** Every font size is inline Tailwind (`text-2xl`, `text-sm`, etc.) with no design-token abstraction. Adding a type scale in `tailwind.config.js` (or CSS variables) would let the team converge on consistent heading/body sizes across all five portal shells.

### Before / After

| Before | After |
|---|---|
| `font-family: 'Inter', ...` in `index.css` and `tailwind.config.js` | Replace with a brand-appropriate sans: Geist (free, Google Fonts), Outfit, or Cabinet Grotesk. Keep `system-ui` as the fallback stack. Self-host with `@font-face` + `font-display: swap`; do not `<link>` Google Fonts in production. |
| `"Sign in to your account"` at `text-white/40` | Raise to `text-white/50` or `text-white/55` to clear 4.5:1 on `#0F172A`. Or move the caption to `text-sm text-white/50` with a slightly lighter weight. |
| Hero subtext `max-w-xl` at `text-lg` | Tighten to `max-w-lg` (320px) or `max-w-2xl` with `text-base` to keep line length under 65ch. |
| Inline font sizes everywhere | Add a type-scale extension in `tailwind.config.js` under `extend.fontSize` (e.g. `display: ['2.5rem', { lineHeight: '1.1', fontWeight: '700' }]`) and use semantic classes. |

---

## 4. Visual Density

### Findings

**What works:**
- Login page density is well-judged: one card, two fields, one button, one secondary link, one utility strip. No feature bloat on a login screen.
- Landing hero: the two-column split (text + visual panel) keeps the top of the page focused. The stats row and badge row are compact and scannable.
- Course card density on the marketplace: title + description (2-line clamp) + price + social proof + CTA — that's a reasonable information package per card without overcrowding.

**What fails:**
- **Hero exceeds the 4-element stack cap:** The hero text column contains: (1) eyebrow badge ("Ghana's #1..."), (2) H1 headline (2 lines), (3) subtext paragraph, (4) stats row (2 stats), (5) feature badge row (3 pills), (6) CTA row (3 buttons). That's 6 visual blocks, well over the 4-element maximum. The stats row and badge row are "trust micro-strip" and "feature bullet list" — both banned inside the hero by the skill. They belong in dedicated sections below the hero.
- **Feature badge row is filler:** "Certified Courses", "Physical Labs in Accra & Kumasi", "Mobile Money payments" — these are real features but they're presented as emoji-pill badges in the hero, which reads as a templated "feature strip" AI default. Each of these deserves its own section or a single inline sentence in the subtext.
- **Div-based fake screenshot in the hero visual panel:** The right-hand panel of the hero contains a CSS-constructed "course preview card" (initials avatar, fake course title "High-Ticket Sales", fake instructor "Kofi Mensah", fake price GH₵ 800) plus a fake avatar stack ("A", "K", "M", "E"). This is a div-based fake product preview — explicitly banned by the skill. It's not a real course, not a real screenshot, not a generated image. It's CSS filler pretending to be a product shot. For a marketplace landing page, this is the #1 LLM-design tell.
- **Stats use fake-precise numbers:** "32,400+ learners" — if this is real data, fine. If it's invented for visual fill, it's a fake-precision tell. Same for "4.9/5 average rating" as a generic star-rating without a source. Flag and verify.

### Before / After

| Before | After |
|---|---|
| Hero contains eyebrow + headline + subtext + stats row + badge row + 3 CTAs (6 blocks) | Cut to 4 blocks: eyebrow (or drop it), headline, subtext (≤ 20 words), CTAs (1 primary + 1 secondary). Move stats row to a "Trusted by / Used by" section directly below the hero. Move feature badges into the subtext as a single sentence or into a dedicated "Features" section. |
| Hero right panel: CSS-constructed fake course card + avatar stack | Replace with a real course cover image (generated image or real URL). If no image is available yet, leave a labeled placeholder slot: `<!-- TODO: hero course photo, 1600x900 -->`. Do not build fake UI out of styled divs. |
| "32,400+ learners" / "4.9/5" without source | Verify against real data. If not real, replace with qualitative social proof (logo wall of real companies, or remove the stats row entirely). |

---

## 5. Motion Quality

### Findings

**What works:**
- Login page has a controlled entrance sequence: `fadeSlideUp` with staggered delays (`delay-100` through `delay-700`) on the logo, headline, card, inputs, button, and demo buttons. The stagger reads as intentional, not random. The easing `cubic-bezier(0.22,1,0.36,1)` is a standard ease-out curve — smooth.
- The login button has `active:scale-[0.98]` — tactile press feedback. Good.
- Demo account buttons have `hover:scale-[1.02]` + `active:scale-[0.98]` — light hover lift + press. Appropriate for secondary actions.
- The landing page CTAs have `hover:bg-[#6D28D9]` (darker purple on hover) — clear state change.
- The Nexa chat bubble FAB (`✨` emoji button) has `hover:bg-[#6D28D9]` and a shadow — functional micro-interaction.

**What fails:**
- **`pulseGlow` is a perpetual glow on a static logo:** The keyframe `pulseGlow` runs `infinite` on the login logo and the mounted logo. A brand mark should not breathe forever — it's a decorative loop with no functional purpose (no hierarchy change, no feedback, no storytelling). Under `prefers-reduced-motion` this should collapse to static, but the keyframes are injected via a `<style>` tag with no reduced-motion guard. (See `ANIM_STYLES` in Login.jsx — no `@media (prefers-reduced-motion: reduce)` block.)
- **No reduced-motion guards anywhere:** Neither Login.jsx nor Landing.jsx checks `prefers-reduced-motion`. The skill requires any motion above intensity 3 to honor it. The infinite `pulseGlow`, `float`, and `shimmer` animations all need reduced-motion fallbacks.
- **Landing page is almost entirely static:** Compared to the login page's staggered entrance, the landing page has only CSS `:hover` transitions (color, opacity, shadow). No scroll-reveal, no entrance stagger on the course cards, no motion on the hero visual panel. If the design claim is " Midnight Neon with animated entrances" (as the Login.jsx docstring states), the landing page doesn't carry that identity.
- **`float` animation on Demo Account buttons?:** The `animate-float` keyframe (translateY 0 → -6px → 0, 3s loop) is defined in `ANIM_STYLES` but doesn't appear to be applied to any element in the current render. If it's unused, remove it. If it's intended for the demo buttons, it would be a perpetual float on interactive elements — not recommended.
- **Shimmer on the button?** The `animate-shimmer` keyframe is defined but not applied to any visible element. Dead code.

### Before / After

| Before | After |
|---|---|
| `pulseGlow` infinite on N logo, no reduced-motion guard | Replace with a one-time entrance animation (`fadeSlideUp` with `delay-100`) that plays once on mount. Add `@media (prefers-reduced-motion: reduce)` to disable all keyframe animations. |
| No reduced-motion handling in Login.jsx or Landing.jsx | Wrap the `ANIM_STYLES` injection with a `prefers-reduced-motion` media query, or use Motion's `useReducedMotion()` to skip animations conditionally. At minimum, strip infinite loops (`pulseGlow`, `float`, `shimmer`) under reduced motion. |
| Landing page: static course cards, no entrance motion | Add a `whileInView` stagger on the course grid (Motion `motion.li` with `initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}`). This gives the marketplace a "content appears as you scroll" rhythm without heavy GSAP. |
| Unused `animate-float` and `animate-shimmer` keyframes | Remove from `ANIM_STYLES` if not applied to any element. Keep the animation library lean. |

---

## 6. Cross-Cutting Issues (Beyond the Five Dimensions)

### 6a. Missing import crashes the landing page

`Landing.jsx` line 295 uses `<SkeletonGrid cols={3} count={3} ... />` but `SkeletonGrid` is never imported. The component lives in `src/components/Skeleton.jsx` but is not pulled into Landing.jsx's scope. This causes a runtime `SkeletonGrid is not defined` error and renders the page blank. **Fix:** add `import { SkeletonGrid } from '../../components/Skeleton'` at the top of Landing.jsx (adjust the relative path to match the file's location under `src/pages/public/`).

### 6b. Shape Consistency Lock

Two radius systems coexist: login page uses `rounded-2xl`/`rounded-xl` (12-16px), landing page uses `rounded-nexify` (8px). The custom `rounded-nexify` token in `tailwind.config.js` (`0.5rem` = 8px) is the landing page's default, but the login page never uses it. Pick one system and apply it everywhere. Recommended: 8px for inputs/buttons/pills, 12px for cards/panels, 16px for modals/follout surfaces.

### 6c. Button contrast check

- Login primary button: `bg-[#7C3AED] text-black` — purple background with black text. Contrast ratio is very high (well above WCAG AA). Passes.
- Landing CTAs: `bg-[#7C3AED] text-white` — white on purple. Contrast ratio is approximately 5.5:1. Passes AA for large text. Good.
- Landing secondary CTAs: `border border-white/30 text-white` on dark hero — white text on a translucent white border with no fill. The text reads against the dark background, not the border. Acceptable, but on a lighter section this ghost-button pattern would fail. Since the CTAs live only in the dark hero, they're safe.

### 6d. No duplicate CTA intent

The landing page has three CTAs in the hero: "Create a Course" (creator intent), "Become an Affiliate" (affiliate intent), "Start Learning" (student intent). Three distinct intents, no duplicates. The nav has "Sign In" + "Get Started" — sign-in vs sign-up, distinct intents. Passes.

### 6e. Emoji in UI

The Nexa chat FAB uses `✨` as its icon, and the feature badges use emoji (`🎓`, `🏫`, `📱`). The skill discourages emoji in code/visible text by default, allowing it only for playful/social-native vibes. For an ed-tech marketplace, the emoji pills read as casual filler. Replace with icon-library glyphs (Phosphor/Tabler) or plain text labels. The `✨` FAB icon is especially weak — a chat bubble SVG would be clearer.

### 6f. Eyebrow count

The landing page hero has one eyebrow ("Ghana's #1 E-Learning Platform" — small purple pill, uppercase tracking implied). That's 1 eyebrow for 2 visible sections (hero + marketplace) = 1 ≤ ceil(2/3) = 1. Passes mechanically. But the eyebrow itself is a pill badge, not a small uppercase tracking label — it's a "feature badge" dressed as an eyebrow. The skill's eyebrow discipline (small mono-caps label above a headline) doesn't strictly apply here because this is a branded badge, not a section label. Acceptable.

---

## 7. Summary Scores

| Dimension | Score (1-10) | Notes |
|---|---|---|
| Color usage | 7 | Single-accent discipline is good, but the mid-page theme flip (dark → white → dark) is a hard failure. Two input styles on one page. |
| Spacing consistency | 7 | Rhythm is clean within each page, but radius systems differ across pages and hero bottom crowding is real. |
| Typography hierarchy | 6 | Three levels present but Inter is the default AI font, sub-text contrast is borderline, line-length is too long, no type-scale tokens. |
| Visual density | 6 | Login page is well-judged; landing hero is overstuffed (6 blocks vs 4 max), fake div-based course preview in hero is a critical tell. |
| Motion quality | 5 | Login page has nice staggered entrance + tactile button feedback, but perpetual glow on logo, no reduced-motion guards, and landing page is nearly static. |

**Overall: 6.2 / 10** — A functional dark-neon identity with real strengths (consistent accent, good login-page density, tactile button states), held back by a mid-page theme flip, an overstuffed hero, a fake div-based product preview, Inter as the default font, and no reduced-motion safeguards.

---

## 8. Prioritized Fix List

1. **Fix the landing page crash** — import `SkeletonGrid` from `src/components/Skeleton.jsx` (blocks the page from rendering at all).
2. **Resolve the theme flip** — make the entire landing page one theme (dark throughout, or light throughout). The marketplace section cannot be `bg-white` sandwiched between dark sections.
3. **Unify input styles** — one input style per theme, applied to both the hero search and the marketplace search.
4. **Strip the fake course preview from the hero** — replace the CSS-constructed course card + avatar stack with a real image or a labeled placeholder.
5. **De-clutter the hero** — move stats row and feature badge row out of the hero into sections below. Keep hero to 4 blocks max.
6. **Replace Inter with a brand-appropriate sans** — Geist, Outfit, or similar; self-host with `@font-face`.
7. **Add reduced-motion guards** — wrap infinite keyframes (`pulseGlow`, `float`, `shimmer`) in `@media (prefers-reduced-motion: reduce)` or gate with `useReducedMotion()`.
8. **Stop the perpetual logo glow** — replace `pulseGlow` infinite with a one-time entrance animation.
9. **Unify the radius system** — pick one scale (8px / 12px / 16px) and apply it on both pages; remove or re-map `rounded-nexify`.
10. **Raise sub-text contrast** on the login caption to clear 4.5:1.
11. **Tighten hero subtext line-length** to ≤ 65ch.
12. **Remove emoji from feature badges and FAB icon** — use icon glyphs or plain text.
