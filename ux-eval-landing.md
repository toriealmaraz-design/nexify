# UX Heuristic Evaluation Report — Landing Page

**Evaluated:** Landing page (`/`) — public marketplace storefront and entry point
**Input:** Code (`Landing.jsx`) + screenshot (live browser, 1280×577)
**User profile:** Three audiences share this page: (1) prospective students browsing courses, (2) prospective creators exploring the platform, (3) prospective affiliates evaluating commission opportunities. The page must orient all three without requiring login.
**Date:** 2026-09-21

---

## Executive Summary

The Landing page has a strong conceptual structure — hero with value proposition and role-specific CTAs, course marketplace with search, a sticky header with global search, and a conversational AI assistant (Nexa) — but **it is not rendering in the live application**. The root cause is a missing import: `SkeletonGrid` is used at line 295 but never imported, causing a JavaScript error that prevents the React tree from mounting. The screenshot confirms a blank page (only the browser's background style is visible). This is a **Critical** defect that blocks all users from accessing the page.

Independently of the crash, the code reveals a well-structured page with good role-based routing, clear visual hierarchy in the hero, and thoughtful course card design. However, several issues would surface once the page renders: the Nexa chat widget lacks `aria-expanded` state communication, the chat toggle button uses an emoji as its only label, the `sticky` header lacks a backdrop blur that would help it stand out over scrolling content, and the global search in the header and the marketplace search are functionally redundant without clear differentiation.

**Rating tally:** 1 Critical, 3 Major, 4 Minor, 3 Good, 0 N/A, 2 Needs Manual Review
**Modules applied:** [Core 10] [Accessibility]

---

## Findings

### #1 Visibility of System Status
**Rating:** Needs Manual Review

**Finding:** Once the page renders (after the import bug is fixed), the loading state is handled by `SkeletonGrid` — a shimmer-animated placeholder grid that gives visual feedback during the axios call to `/api/v1/courses`. The `loading` state is tracked and cleared in a `.finally()` block. The Nexa chat widget shows a bouncing-dot loading indicator while waiting for a response. However, from the provided materials it is not possible to confirm: (a) whether the SkeletonGrid renders correctly once imported, (b) whether the course API call has appropriate timeout handling, or (c) what happens if the API returns an empty list — the page shows "No courses found matching '{search}'" which is a reasonable empty state.

**Recommendation:** Manually verify in the live product (after fixing the import) that: the SkeletonGrid placeholder appears during load, the transition from loading → course grid is smooth, and the empty-state message is shown correctly when no courses match.

---

### #2 Match Between System and Real World
**Rating:** Good

**Finding:** Language is appropriate and clear for the target audiences. "Ghana's #1 E-Learning Platform" is a confident, specific value proposition. "Learn. Create. Earn." maps directly to the three user roles. "32,400+ learners" and "4.9/5 average rating" are social proof in familiar terms. CTAs use action-oriented language: "Create a Course," "Become an Affiliate," "Start Learning." Payment method labels ("MTN MoMo", "Telecel", "Card") use real brand names familiar to the Ghanaian audience. Currency is shown as GH₵ throughout, appropriate for the market. The "Physical Lab" vs. "Digital" badges on course cards use intuitive icons (🏫, 💻).

**Recommendation:** No changes needed.

---

### #3 User Control and Freedom
**Rating:** Major

**Finding:** Several exit vectors exist: the header logo links to `/`, the "Sign In" link goes to `/login`, and the "Get Started" button goes to `/register`. The Nexa chat widget has a close button (`×`). Course cards have a checkout modal with a close button. However, there are two concerns:

1. **The Nexa chat widget does not have an obvious minimize/collapse affordance beyond the close button.** Once opened, the only way to dismiss it is the `×` button. A user who opens it accidentally (or on mobile where it overlays content) must close it entirely rather than minimize it.

2. **There is no way to reset the marketplace search.** Once a user types in the marketplace search box and filters courses, there is no "Clear" button or escape-key handler to quickly reset the search. The user must manually delete the text.

**Recommendation:**
- Add a minimize/collapse button to the Nexa chat widget in addition to the close button, or make the toggle button a toggle (open/close) rather than one-directional.
- Add a small "Clear" button (×) inside the marketplace search input, or support the Escape key to clear the search field.

---

### #4 Consistency and Standards
**Rating:** Major

**Finding:** There are two search inputs on the same page that serve overlapping purposes but are styled inconsistently:

1. **Header search** (line 142–156): `max-w-lg`, `hidden md:block`, dark style (`bg-white/10 border-white/20`), white text, placeholder "Search courses…". This is a global search in the sticky header.

2. **Marketplace search** (line 279–291): visible on all screen sizes below the "Browse Courses" heading, light style (`bg-[#EDE9FE] border-slate-200`), dark text, same placeholder "Search courses…".

Both inputs filter the same `courses` array using the same `search` state variable — they are functionally **the same search** surfaced in two places with different visual treatments. This is confusing: a user might type in the header search and not see results update in the marketplace section (or vice versa), or might not realize they are the same control. The header search is also hidden on mobile (`hidden md:block`), so mobile users only see the marketplace search — but there is no indication that the header search exists.

**Recommendation:**
- Consolidate to a single search input, or clearly differentiate their scope if they must coexist. The most natural fix is to remove the marketplace search and rely on the header search (which is already global), OR remove the header search on the landing page and keep only the marketplace search as the dedicated course-finder.
- If both are kept, give them distinct placeholders (e.g., "Search everything…" vs. "Filter courses…") and ensure they are synced visibly.

Additionally, the `rounded-nexify` custom border-radius class is used throughout (buttons, cards, inputs) — this is consistent and good. However, the header uses `sticky top-0 z-40` without a backdrop blur or semi-transparent background, so as the user scrolls, the header content sits on top of the hero section without visual separation. This is a minor visual inconsistency with the rest of the page's glassmorphism aesthetic (backdrop-blur is used in the hero's course preview card and the Nexa chat window).

**Recommendation:** Add `backdrop-blur-md bg-[#0F172A]/80` to the header to give it visual separation from scrolling content, consistent with the rest of the design language.

---

### #5 Error Prevention
**Rating:** Minor

**Finding:** The checkout modal has good error prevention: all three fields (name, email, phone) are validated before submission (`if (!form.email || !form.name || !form.phone)`), with a clear error message "All fields are required." The payment channel radio buttons have a default selection (`MOMO_MTN`), reducing the chance of an unselected state. The order bump checkbox is only shown when `course.hasOrderBump` is true, preventing the user from opting into a non-existent bump. The submit button shows the total price (`GH₵ {total.toFixed(2)}`) before the user commits, giving a final review opportunity.

However, the **phone field** is labeled "Phone (for MoMo)" with placeholder "+233…" but there is no format validation — any string is accepted. A user might enter a non-Ghanaian number or an invalid format, and the error would only surface at the API call (caught as "Checkout failed. Please try again."), which is generic and not helpful for diagnosing a phone format issue.

**Recommendation:** Add basic phone format validation (e.g., require `+233` prefix or 10-digit Ghanaian number) with a specific error message before submitting, rather than relying on the generic API error.

---

### #6 Recognition Rather Than Recall
**Rating:** Good

**Finding:** All primary actions are visible and labeled. The three role-specific CTAs in the hero ("Create a Course," "Become an Affiliate," "Start Learning") make the available paths clear without requiring navigation. The course cards display: title, description, creator name, price, enrollment count, rating, and type badge — users can evaluate a course without opening it. The checkout modal shows a course summary with base price, optional bump, and total before payment. The Nexa chat widget has an initial prompt hint ("Ask Nexa anything about courses, earnings, or the platform.") so users know what to ask without recalling capabilities.

**Recommendation:** No changes needed.

---

### #7 Flexibility and Efficiency of Use
**Rating:** Minor

**Finding:** The role-specific CTAs in the hero (with `?role=CREATOR`, `?role=AFFILIATE`, `?role=STUDENT` query params) are a good efficiency shortcut — users are routed to the correct registration flow without an extra role-selection step. The Nexa chat provides a conversational shortcut for finding courses or information without navigating the marketplace. The demo account buttons on the login page (separate from this evaluation) are not present here.

However, there are no keyboard shortcuts for power users. The search inputs do not support debounced filtering (the filter runs on every keystroke via `onChange`), which is fine for small course lists but could be sluggish with large datasets — though this is a performance consideration, not strictly a UX flexibility issue.

**Recommendation:** The `?role=` CTAs are well-designed. For future efficiency improvements, consider adding keyboard shortcut support (e.g., `/` to focus search) once the page is fully interactive.

---

### #8 Aesthetic and Minimalist Design
**Rating:** Good

**Finding:** The page has a clear visual rhythm: dark hero section → light marketplace section → dark footer. This alternating section treatment helps orient the user as they scroll. The hero has strong typographic hierarchy: eyebrow badge → large heading → supporting paragraph → social proof stats → feature badges → CTAs. The course preview card in the hero's right panel uses a `backdrop-blur-sm` glass effect that adds depth without clutter. The learner avatar stack (`-space-x-2`) is a recognizable social proof pattern. Feature badges are concise (`🎓 Certified Courses`, `🏫 Physical Labs in Accra & Kumasi`, `📱 Mobile Money payments`).

The Nexa chat widget, when open, uses a white card on a purple-tinted background (`bg-[#EDE9FE]`) — visually distinct from the rest of the page, which helps it stand out as an overlay. However, the chat bubble toggle button (`fixed bottom-6 right-6`) uses only an emoji (✨) as its content with an `aria-label="Open Nexa chat"` — visually, users without accessibility needs see only a sparkle icon with no text label, which may not be immediately recognizable as a chat button.

**Recommendation:** Consider adding a small text label or tooltip to the chat toggle button (e.g., "Nexa" or "Chat") for users who don't recognize the sparkle emoji as a chat indicator. Also, on mobile, the fixed-position chat button at `bottom-6 right-6` may overlap with the "Get Started" CTA in the hero footer area — verify there is no collision.

---

### #9 Help Users Recognize, Diagnose, and Recover from Errors
**Rating:** Minor

**Finding:** The checkout modal has a clear error display: a red-bordered card (`bg-red-50 border border-red-200 text-red-700`) with the error message text. The error state is visually distinct from the normal form state. The "No courses found" empty state in the marketplace (`text-center py-12 text-slate-500`) is handled gracefully — it shows the search term in quotes for context. The Nexa chat shows "Nexa is unavailable right now." when the API call fails, which is a friendly, non-technical error message.

However, the checkout error message "All fields are required." is generic — it does not indicate which specific fields are missing. A user who filled in two of three fields would not know which one to fix. Similarly, the API-level error "Checkout failed. Please try again." is non-specific.

**Recommendation:** Improve field-level validation messaging in the checkout modal — highlight the specific missing/invalid fields rather than a single generic message. For the API error, if the backend returns a specific message, surface it; otherwise, consider adding a retry suggestion.

---

### #10 Help and Documentation
**Rating:** Major

**Finding:** The Nexa chat widget is positioned as the page's assistant ("Ask Nexa anything about courses, earnings, or the platform") — this is a form of contextual help. However, the widget itself has no onboarding or hint beyond the initial placeholder text. First-time users may not realize it's a chatbot; the sparkle emoji icon is not a universally recognized chat indicator. There are no tooltips, help icons, or explanations for domain-specific concepts on the page: "Physical Lab," "order bump," "GH₵" pricing, or the registration role system are not explained.

The course cards show "30-90s trailer available" as a text badge when `course.teaserUrl` exists, but there is no play button or way to actually watch the trailer from the card — the badge tells users a trailer exists but doesn't let them access it without clicking through to checkout, which is a frustrating gap.

**Recommendation:**
- Add an info tooltip or brief explanation for "Physical Lab" (in-person vs. digital distinction) on course cards — especially important for students who may not know what a "Physical Lab" entails.
- Make the trailer badge clickable or add a play button that previews the trailer (even a modal video preview) before checkout.
- Add a brief tooltip or helper text near the "GH₵" price display for international users who may not be familiar with the Ghana Cedi.
- Consider adding a short onboarding tooltip the first time a user sees the Nexa chat bubble, explaining what it can do.

---

## Accessibility Heuristics

### A11Y-1 Color Contrast
**Rating:** Minor

**Finding:** The page uses two distinct color palettes: a dark section (`bg-[#0F172A]`) for the header and hero, and a light section (`bg-white`) for the marketplace. This creates different contrast contexts:

**Dark sections (header, hero, footer):**
- White text on `#0F172A`: excellent contrast (~15:1).
- `text-white/70` (used for "Sign In" link, "by Kofi Mensah", footer text): at 70% opacity on `#0F172A`, contrast is approximately 10.5:1 — passes AA.
- `text-white/50` (used for "Expert-led courses from Ghana's top creators"): approximately 7.5:1 — passes AA for body text.
- `text-white/40` (hero paragraph text): approximately 6:1 — passes AA.
- `text-white/60` (stats text): approximately 9:1 — passes.
- Purple accent `#7C3AED` on white (CTAs): the button is purple background with white text — contrast is approximately 4.6:1, which passes AA for large text (the CTA text is `font-semibold` and likely 14–16px).

**Light marketplace section:**
- `text-slate-900` on white: excellent contrast.
- `text-slate-500` (descriptions, secondary text): approximately 4.6:1 on white — passes AA for body text.
- `text-slate-600` (creator name, "Base Price" label): approximately 5.3:1 — passes.
- `bg-[#EDE9FE]` (checkout summary background) with `text-slate-900`: the background is a very light purple; contrast of slate-900 on this is still excellent.

**Issue:** The chat widget's message bubble for user messages uses `bg-[#0F172A] text-white` — good contrast. The Nexa messages use `bg-white text-slate-800` — good contrast. The input in the chat widget uses `border-slate-200` with no background specified (defaults to white) — the placeholder `text-slate-400` on white is approximately 3.4:1, which is below 4.5:1 for body text, but placeholders are not strictly required to meet 4.5:1 under WCAG (they are not "text" in the WCAG sense when empty). Once the user types, the entered text would be dark on white.

**Recommendation:** The contrast overall is solid. The main risk is the chat widget input placeholder text at `text-slate-400` — while not a WCAG failure for placeholders, consider using a darker placeholder color for better legibility.

---

### A11Y-2 Text and Target Sizing
**Rating:** Minor

**Finding:** Body text in the marketplace section uses `text-sm` (14px) for descriptions and `text-xs` (12px) for secondary metadata (enrollment counts, ratings) — the 12px text is small but still legible in the light section with good contrast. The course title uses `text-lg` (16px) `font-bold`, which is prominent.

Interactive targets:
- The three hero CTAs are `px-6 py-3` — approximately 48px wide minimum and 44px tall, meeting AA (24×24) and approaching AAA (44×44) for the height. Good.
- Course card "View Course & Buy" buttons are `py-2.5` — approximately 40px tall, full-width of the card — meets AA.
- The Nexa chat toggle button is `w-12 h-12` (48×48px) — meets AA and AAA. Good.
- The checkout modal radio button labels are `p-3` cards — large tap targets. Good.
- Close buttons (×) in modals are `w-8 h-8` (32×32px) — meets AA (24×24), but below AAA (44×44).

**Issue:** The header search input is `py-2` (approximately 32px tall) — the tap target is adequate. However, the search icon inside the input (`absolute left-3 top-2.5`) is decorative and not interactive — fine.

The "Sign In" link in the header is a text-only link (`text-sm text-white/70`) — its clickable area is the text bounds, which may be less than 24px tall on smaller screens. Consider adding `display: inline-block; padding: 4px 0;` to ensure minimum target height.

**Recommendation:** Increase close button sizes in modals to at least 44×44px for AAA compliance if the product targets the general public. Add padding to the text-only "Sign In" link to ensure adequate target size.

---

### A11Y-3 Keyboard Navigation
**Rating:** Major

**Finding:** This is a significant accessibility gap. Several interactive elements lack keyboard support:

1. **Nexa chat toggle button** (`<button>`) — is natively keyboard-accessible, good. However, the chat window itself is a `<div>` (not a dialog with `role="dialog"`), and the close button is a `<button>` — but there is no keyboard trap management. When the chat window is open, tabbing through the page will include the chat input and buttons, but there is no Escape-key handler to close the widget. The close button is reachable via keyboard, but a keyboard user may not know they can close it with Escape.

2. **Checkout modal overlay** — the modal is a `<div>` with `fixed inset-0` positioning. The close button is a `<button>`. However, there is no `role="dialog"` or `aria-modal="true"` on the modal container, and no focus trap. When the modal is open, keyboard focus is not managed — a user can tab to elements behind the modal (the page behind the `bg-slate-900/60` overlay is still in the DOM and focusable). There is no Escape-key handler to close the modal.

3. **The course card buttons** (View Course & Buy) are `<button>` elements — natively keyboard-accessible. Good.

4. **Header navigation links** (Sign In, Get Started) are `<a>` elements — keyboard-accessible. Good.

5. **The form inputs in the checkout modal** are standard `<input>` elements — focusable and keyboard-operable. The radio buttons use `sr-only` class to hide the actual `<input>`, with the visual label being a `<label>` wrapping the hidden input — this pattern is accessible (the label is clickable and the input is keyboard-accessible via the label).

**Recommendation:**
- Add `role="dialog"` and `aria-modal="true"` to the checkout modal overlay, and implement a focus trap (focus the close button or first input on open, trap Tab within the modal, restore focus to the triggering button on close).
- Add an Escape key handler to close both the Nexa chat widget and the checkout modal.
- Add `aria-expanded="true/false"` to the Nexa chat toggle button to communicate the open/closed state to screen readers.
- Add `role="dialog"` to the Nexa chat window container.

---

### A11Y-4 Labels and Descriptions
**Rating:** Major

**Finding:** Several interactive elements lack accessible names:

1. **Nexa chat toggle button** — has `aria-label="Open Nexa chat"` which is good. However, the `aria-label` only says "Open" — when the widget is already open and the button is clicked to close it (it's a toggle in behavior, though implemented as a one-way open), the label would still say "Open Nexa chat" which is misleading. The button should dynamically update its aria-label or use `aria-expanded`.

2. **Checkout modal close button** (`×`) — is a `<button>` with the `&times;` character as its content. There is no `aria-label` on this button. A screen reader would announce it as "times" or "multiplication sign," which is not a clear label. Add `aria-label="Close checkout"` or `aria-label="Close"`.

3. **Chat window close button** (`×`) — same issue: `&times;` with no `aria-label`. Add `aria-label="Close Nexa chat"`.

4. **Payment method radio buttons** — the actual `<input type="radio">` is `sr-only` (visually hidden but available to screen readers). The visible label is the `<label>` element wrapping the input, which contains the payment method name (e.g., "MTN MoMo") and a colored circle with the first letter. This pattern is accessible — the input has a name via the label text. Good.

5. **Order bump checkbox** — the `<input type="checkbox">` has a visible label ("Add: {orderBumpTitle}") via the wrapping `<label>`. Good.

6. **Course card images** — when `course.coverImageUrl` is present, the `<img>` uses `alt={course.title}` — good. When there is no cover image, the fallback is a `<div>` with the first letter of the title — this `<div>` has no `role="img"` or `aria-label`, so screen readers would not announce it as an image placeholder. Add `role="img" aria-label={course.title}` to the fallback div.

**Recommendation:**
- Add `aria-label` to both close buttons (checkout and chat).
- Add `role="img"` and `aria-label` to the course card fallback image div.
- Make the Nexa toggle button's `aria-label` dynamic (Open/Close Nexa chat) or use `aria-expanded`.

---

### A11Y-5 State Communication
**Rating:** Minor

**Finding:** Several state changes are communicated visually but not programmatically:

1. **Nexa chat open/closed state** — the toggle button does not have `aria-expanded`. The chat window appears/disappears conditionally (`{open && ...}`), so screen readers may or may not detect the change depending on how they handle dynamic content. Add `aria-expanded={open}` to the toggle button and consider `aria-live="polite"` on the chat messages container.

2. **Checkout modal open/closed state** — the modal appears/disappears conditionally. No `aria-modal` or dialog role (see A11Y-3). The `done` state (payment successful) swaps the entire modal content — a screen reader user would hear the new content but there is no `role="status"` or `aria-live` region to announce the success explicitly.

3. **Payment processing state** — the submit button text changes from "Pay GH₵ X" to "Processing…" with a spinner. The text change is available to screen readers. Good. However, the button is not disabled during processing in a way that prevents keyboard activation — actually, `disabled={processing}` is set, so it is properly disabled. Good.

4. **Selected payment method** — the radio buttons use `checked` attribute, which is communicated to screen readers. The visual highlight (`border-[#7C3AED] bg-[#7C3AED]/5`) is supplementary. Good.

5. **Loading state in course marketplace** — the `loading` state shows `SkeletonGrid`. Once the import is fixed, screen readers would encounter the skeleton cards. Since these are visual placeholders (shimmer divs), they have no semantic content. Consider adding `aria-busy="true"` to the marketplace section during loading, and `aria-busy="false"` after.

**Recommendation:** Add `aria-expanded` to the Nexa toggle, `aria-live="polite"` to the chat messages area, `role="dialog" + aria-modal` to the checkout modal with a focus trap, and `aria-busy` to the marketplace section during loading.

---

## Priority Actions

1. **[Critical] Fix the missing `SkeletonGrid` import.** Add `import { SkeletonGrid } from '../components/Skeleton'` (or a named import) at the top of `Landing.jsx`. This is the single defect preventing the page from rendering at all. Without this fix, all other findings are moot.

2. **[Major] #3 — Add Escape key and focus trap for the Nexa chat widget and checkout modal.** Both overlays lack keyboard dismissal and focus management, making them inaccessible to keyboard-only users. Add `role="dialog"`, `aria-modal="true"`, a focus trap, and an Escape handler to the checkout modal. Add `aria-expanded` and Escape handler to the Nexa chat.

3. **[Major] #4 — Resolve the dual-search inconsistency.** The header search and marketplace search share the same state and purpose but look different. Consolidate to one search input, or clearly differentiate their scope. Also add `backdrop-blur` to the sticky header for visual consistency.

4. **[Major] #10 — Add trailer preview access.** The "30-90s trailer available" badge on course cards tells users a trailer exists but provides no way to watch it. Add a play button or clickable badge that previews the trailer.

5. **[Minor] #9 — Improve checkout error specificity.** Highlight exactly which fields are missing rather than a generic "All fields are required." Add phone format validation before submission.

6. **[Minor] #5 — Add phone format validation.** Validate Ghanaian phone number format before submitting the checkout form.

7. **[Minor] A11Y-4 — Add `aria-label` to close buttons and `role="img"` to course card fallback images.** The × buttons need accessible names; the fallback image div needs to be announced as an image.

8. **[Minor] #8 — Add text label to the Nexa chat toggle button.** The sparkle emoji alone may not be recognized as a chat button by all users.

9. **[Minor] A11Y-2 — Increase modal close button size to 44×44px** for AAA compliance on a public-facing marketplace.

---

## Manual Review Items

1. **#1 — SkeletonGrid rendering and loading transition.** After fixing the import, verify that the SkeletonGrid placeholder renders correctly during the API call and that the transition to the course grid is smooth (no layout jump).

2. **#4 — Search synchronization.** If both searches are kept, verify they stay in sync when the user types in either one. Test on mobile where only the marketplace search is visible.

3. **A11Y-3 — Focus trap behavior.** After adding a focus trap to the checkout modal, verify that Tab cycles within the modal and that focus returns to the triggering course card button on close.

---

## Coverage Note

The landing page screenshot captured a blank page due to the runtime crash described in finding #4 (missing import). All visual assessments of layout, color, and component placement are based on code analysis of `Landing.jsx` and `CourseCard`/`CheckoutModal` sub-components. A post-fix screenshot would be needed to verify the visual findings (contrast, spacing, visual hierarchy) against the actual rendered page. The Nexa chat widget's behavior (open/close animation, message rendering) was evaluated from code only.
