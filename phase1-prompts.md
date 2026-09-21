# Nexify Platform — Phase 1: Fix What's Broken

> **Instructions for the agent:** Each prompt below is independent. Read the relevant files, make the fix, verify it works. Do NOT refactor beyond what's asked. Do NOT touch files not mentioned. Keep the existing design system (Midnight Neon theme, Tailwind, `#7C3AED` purple, `#0F172A` dark bg, `#1E1B4B` card bg).

---

## PROMPT 1: Fix Login Redirect by Role

**File:** `/home/toriealmaraz/nexify/frontend/src/pages/public/Login.jsx`

**Problem:** After login, the page always redirects to `/admin` regardless of the user's role. A student, creator, or affiliate all get sent to `/admin` and then bounced back by the ProtectedRoute.

**Fix:** After `login()` returns the user object, read `user.role` and redirect to the correct portal:
- `ADMIN` → `/admin`
- `CREATOR` → `/creator`
- `AFFILIATE` → `/affiliate`
- `STUDENT` → `/student`
- Anything else → `/`

Replace the hardcoded `navigate('/admin')` with a role-based switch. Keep everything else exactly as-is.

---

## PROMPT 2: Fix Creator Dashboard API Call Bug

**File:** `/home/toriealmaraz/nexify/frontend/src/pages/creator/Dashboard.jsx`

**Problem:** Lines 19-24 use `useState(() => { ... })` to make an API call. This is wrong — `useState` initializer only runs once on mount and doesn't support async side effects. The API call effectively never fires. It should be `useEffect(() => { ... }, [])`.

**Fix:**
1. Change `useState(() => { ... })` to `useEffect(() => { ... }, [])` on lines 19-24.
2. Also fix the API URL on line 20: change `http://localhost:5000/api/v1/courses/stats/creator` to `/api/v1/courses/stats/creator` (use the Vite proxy, not hardcoded localhost).
3. Add the `useEffect` import if not already present (it should be since `useState` is imported from React — verify the import line).

---

## PROMPT 3: Replace `<a href>` with `<Link>` in NavItem

**File:** `/home/toriealmaraz/nexify/frontend/src/App.jsx`

**Problem:** The `NavItem` component (line 214) uses `<a href={href}>` for navigation. This causes a full page reload on every click, defeating React Router's SPA behavior. All 4 portal layouts (Admin, Creator, Affiliate, Student) use this component.

**Fix:**
1. Import `Link` from `react-router-dom` (it's already imported — verify).
2. Replace `<a href={href} ...>` with `<Link to={href} ...>` in the `NavItem` function.
3. Replace the closing `</a>` with `</Link>`.
4. Keep all existing classes, styling, and the active-state logic exactly the same.

---

## PROMPT 4: Replace XMLHttpRequest with fetch in AuthContext

**File:** `/home/toriealmaraz/nexify/frontend/src/context/AuthContext.jsx`

**Problem:** The `login` function (lines 63-91) uses raw `XMLHttpRequest` while the rest of the codebase uses `fetch` via the `apiCall()` helper. This is inconsistent and harder to maintain.

**Fix:**
1. Replace the entire `login` function body (lines 63-91) with a `fetch`-based implementation that:
   - POSTs to `/api/v1/auth/login` with `{ email, password }` as JSON
   - On success: extracts `token` and `user` from `response.data`, calls `setToken(token)` and `setUser(user)`, returns the user
   - On failure: throws an Error with the server's message
2. Keep the function signature: `const login = useCallback(async (email, password) => { ... }, [])`
3. Do NOT change `register`, `logout`, `updateProfile`, or `apiCall` — only `login`.

---

## PROMPT 5: Remove Dead CartContext or Wire It Up

**Files:**
- `/home/toriealmaraz/nexify/frontend/src/context/CartContext.jsx`
- `/home/toriealmaraz/nexify/frontend/src/pages/public/Landing.jsx`

**Problem:** `CartContext` was built to manage checkout state globally, but `Landing.jsx` has its own inline `CheckoutModal` component with local state. The context is imported in `App.jsx` (wrapping everything in `<CartProvider>`) but never actually used by any component.

**Fix — Option A (recommended for now): Remove the dead code**
1. Remove `<CartProvider>` wrapper from `App.jsx` (lines 234, 361)
2. Remove the `import { CartProvider } from './context/CartContext'` line from `App.jsx`
3. Delete the file `/home/toriealmaraz/nexify/frontend/src/context/CartContext.jsx`
4. Verify the app still builds and the checkout modal on Landing still works (it has its own local state)

**Note:** CartContext can be rebuilt later when we have a proper cart/multi-course checkout flow. For now it's dead weight.

---

## Verification Checklist (after all prompts are done)

Run these to confirm everything works:
```bash
cd /home/toriealmaraz/nexify/frontend && npm run build
```

- [ ] Login redirects to the correct portal for each role
- [ ] Creator Dashboard makes the API call on mount
- [ ] Sidebar navigation doesn't cause full page reloads
- [ ] Login works with `fetch` (test with admin@nexify.app / admin123)
- [ ] App builds without errors
- [ ] Checkout modal on Landing page still works
