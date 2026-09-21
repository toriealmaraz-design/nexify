# Dashboard UI Polish Findings

**Scope:** Admin, Creator, Student, Affiliate dashboards
**Reference:** emil-design-eng skill (Emil Kowalski's design engineering philosophy)
**Date:** 2026-09-21

---

## Summary of Issues

All four dashboards share a common Grodital dark-theme shell. The most pervasive problems are:

1. **Button press scale is 0.98 everywhere** — should be 0.97 per Emil's spec.
2. **`transition-all duration-150` on primary buttons** — replaces with explicit `transform` + `background` transitions; `all` is wasteful and imprecise.
3. **No custom easing curves** defined — everything falls back to default ease, which is too weak.
4. **No `@media (hover: hover)` guard** on any hover state — touch devices trigger hover on tap.
5. **No stagger animations** on any list (stat cards, course rows, link rows) — everything appears simultaneously.
6. **Admin dashboard has zero press feedback** on any button.

---

## Polish Table

| Before | After | Why |
| --- | --- | --- |
| `active:scale-[0.98]` on Creator buttons (lines 68, 90, 125, 149, 179) | `active:scale-[0.97]` | 0.97 is the spec; 0.98 is too subtle to register as press feedback |
| `active:scale-[0.98]` on Student buttons (lines 119, 177, 267) | `active:scale-[0.97]` | Same — 0.97 gives a crisp, perceptible press confirmation |
| `active:scale-[0.98]` on Affiliate buttons (lines 127, 156, 216, 258) | `active:scale-[0.97]` | Consistent 0.97 across all dashboards builds platform feel |
| `transition-all duration-150` on Creator primary buttons | `transition: transform 120ms cubic-bezier(0.23, 1, 0.32, 1), background 150ms ease` (plus inline `style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}`) | `all` animates every property including ones that don't change — wasteful; custom ease-out curve gives punch the default lacks |
| `transition-all duration-150` on Student primary buttons | `transition: transform 120ms cubic-bezier(0.23, 1, 0.32, 1), background 150ms ease` | Same — explicit properties + custom curve |
| `transition-all duration-150` on Affiliate primary buttons | `transition: transform 120ms cubic-bezier(0.23, 1, 0.32, 1), background 150ms ease` | Same |
| `transition-colors` only on Admin "Sign Out" button (line 134) | Add `transform 120ms cubic-bezier(0.23, 1, 0.32, 1)` + `:active { transform: scale(0.97) }` | Admin has zero press feedback; this is the only interactive button on the page |
| No global CSS custom easing variables defined | Add to global CSS: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1); --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);` | Emil specifies custom curves — built-in `ease`, `ease-in`, `ease-out` are too weak; reuse across all dashboards |
| All 4 stat-card grids (`grid grid-cols-2 lg:grid-cols-4 gap-4`) render simultaneously with no stagger | Add `opacity: 0; transform: translateY(8px)` base state + staggered `animation-delay: 0ms, 50ms, 100ms, 150ms` via nth-child; animate to `opacity: 1; transform: translateY(0)` over 300ms ease-out | Stagger creates a cascading entrance that feels intentional rather than dumped on screen all at once |
| Creator "My Courses" list rows (line 95, `space-y-3`) appear simultaneously | Stagger each row 40ms apart: `opacity: 0; transform: translateY(6px)` → `opacity: 1; transform: translateY(0)` | Emil: stagger delays 30-80ms between items; longer delays feel slow |
| Affiliate "My Affiliate Links" rows (line 184, `space-y-3`) appear simultaneously | Same stagger pattern, 40ms between rows | Same reasoning |
| Student "Browse Marketplace" course cards (line 90, `grid grid-cols-1 md:grid-cols-2 gap-4`) appear simultaneously | Stagger cards 60ms apart (grid items, not linear list) using nth-child | Grid stagger needs slightly wider gaps so the cascade reads as a reveal not a flicker |
| Student "Order Receipts" rows (line 223, `space-y-2`) appear simultaneously | Stagger rows 30ms apart — receipts is a fast-scrolling list so keep stagger short | Short stagger on dense lists; longer stagger on sparse lists |
| `hover:border-white/20 transition-colors` on stat cards and course rows (all dashboards) with no media query guard | Wrap hover styles in `@media (hover: hover) and (pointer: fine) { ... }` | Touch devices fire `:hover` on tap, causing a sticky hover state that never clears; the media query gates hover-only effects to devices that actually have a hover capability |
| `hover:brightness-110` on primary buttons with no media query guard | Same — wrap in `@media (hover: hover) and (pointer: fine)` | Brightness shift on tap feels broken on touch; press feedback (scale 0.97) is the correct touch affordance |
| Student seat-fill bar uses `transition-all` (line 133) for width change | `transition: width 400ms ease-out` — only animate `width`, not all properties | `all` is imprecise; the bar only changes width so animate only width |
| Admin "Upload Override" button (line 115) has `hover:brightness-110 transition-colors` but no `:active` state | Add `active:scale-[0.97]` + `transition: transform 120ms cubic-bezier(0.23, 1, 0.32, 1), filter 150ms ease` | Admin is the most-used dashboard; buttons must feel responsive; currently zero press feedback on any Admin control |
| Creator "New Course" CTA (line 68) uses `transition-all duration-150` with `active:scale-[0.98]` | Split into `transition: transform 120ms var(--ease-out), background 150ms ease` + `active:scale-[0.97]` | The CTA is the most prominent action on the Creator dashboard; it deserves the best press feedback in the system |
| Nexa "Ask" buttons (Creator line 179, Student line 267, Affiliate line 258) use `transition-all duration-150` | `transition: transform 120ms var(--ease-out), background 150ms ease` + `active:scale-[0.97]` | Input-adjacent action buttons need snappy feedback; `transition-all` is overkill for a button that only changes background and scale |
| Affiliate "Generate Link" button disabled state uses `disabled:opacity-50 disabled:cursor-not-allowed` but transition still runs | Add `disabled { transition: none }` or gate transition behind `:not(:disabled)` | A disabled button shouldn't animate; the transition property still applies and can cause visual noise on state change |
| No `@media (prefers-reduced-motion: reduce)` anywhere | Add global reduced-motion block: disable transform animations, keep opacity/color transitions | Required for accessibility; Emil's checklist flags this explicitly |

---

## Quick-Win Global CSS to Add

```css
/* === Emil-style custom easing curves === */
:root {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
}

/* === Button press feedback (all dashboards) === */
.btn-primary:active {
  transform: scale(0.97);
  transition: transform 120ms var(--ease-out), background 150ms ease;
}

/* === Touch device hover guard === */
@media (hover: hover) and (pointer: fine) {
  .hover-border-focus:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }
  .hover-brightness:hover {
    filter: brightness(1.1);
  }
}

/* === Reduced motion === */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## File-Specific Notes

**Admin/Dashboard.jsx** — Lowest polish baseline. Only one interactive button ("Sign Out", line 134) with `transition-colors` and no active state. Four stat cards (lines 30-43), six branding asset cards (lines 88-119) with "Upload Override" buttons (line 115) that have hover but no press feedback. All sections are static placeholder panels with no stagger.

**Creator/Dashboard.jsx** — Most button-dense. `active:scale-[0.98]` appears on five buttons (lines 68, 90, 125, 149, 179). All use `transition-all duration-150`. Stat cards (lines 44-57), course rows (lines 95-130), and CTA sections need stagger. The "New Course" CTA is the primary action and should get the strongest press treatment.

**Student/Dashboard.jsx** — Most complex layout. `active:scale-[0.98]` on three buttons (lines 119, 177, 267). Marketplace cards grid (lines 90-161) is a prime candidate for stagger. Seat-fill progress bar (line 133) uses `transition-all` unnecessarily. Enrolled course rows (lines 182-211) and order receipts (lines 223-244) both need short stagger.

**Affiliate/Dashboard.jsx** — `active:scale-[0.98]` on four buttons (lines 127, 156, 216, 258). Link generator buttons (lines 126-142) have a disabled state that should have `transition: none`. Affiliate links list (lines 184-207) and stats cards (lines 63-77) need stagger. The generated-link "Copy" button (line 156) is a secondary action that still needs press feedback.
