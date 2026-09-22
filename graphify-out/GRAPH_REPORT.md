# Graph Report - nexify  (2026-09-20)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 283 nodes · 408 edges · 14 communities (11 shown, 3 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- courseRoutes.js
- App.jsx
- server.js
- affiliateController.js
- backend/package.json
- frontend/package.json
- adminController.js
- authController.js
- courseController.js
- devDependencies
- branding.js
- postcss.config.js

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 15 edges
2. `react` - 13 edges
3. `@prisma/client` - 9 edges
4. `express` - 8 edges
5. `authenticate()` - 7 edges
6. `useCart()` - 7 edges
7. `axios` - 7 edges
8. `scripts` - 7 edges
9. `react-router-dom` - 6 edges
10. `requireRole()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `ProtectedRoute()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/src/App.jsx → frontend/src/context/AuthContext.jsx
- `AdminDashboard()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/src/pages/admin/Dashboard.jsx → frontend/src/context/AuthContext.jsx
- `AffiliateDashboard()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/src/pages/affiliate/Dashboard.jsx → frontend/src/context/AuthContext.jsx
- `Login()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/src/pages/public/Login.jsx → frontend/src/context/AuthContext.jsx
- `Register()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/src/pages/public/Register.jsx → frontend/src/context/AuthContext.jsx

## Import Cycles
- None detected.

## Communities (14 total, 3 thin omitted)

### Community 0 - "courseRoutes.js"
Cohesion: 0.06
Nodes (43): authenticate(), config, jwt, optionalAuth(), { authenticate }, nexaScopeMiddleware(), prisma, { PrismaClient } (+35 more)

### Community 1 - "App.jsx"
Cohesion: 0.09
Nodes (28): AdminDashboard, AffiliateDashboard, App(), CourseDetail, CreatorDashboard, LoginPage, ProtectedRoute(), PublicLanding (+20 more)

### Community 2 - "server.js"
Cohesion: 0.06
Nodes (19): { platform }, envPath, fs, missing, path, backend_src_config_env_platform, required, constants (+11 more)

### Community 3 - "affiliateController.js"
Cohesion: 0.08
Nodes (20): bcrypt, crypto, prisma, { PrismaClient }, constants, crypto, generateAffiliateCode(), generateLink() (+12 more)

### Community 4 - "backend/package.json"
Cohesion: 0.07
Nodes (28): dependencies, bcryptjs, cors, dotenv, express, express-rate-limit, jsonwebtoken, @prisma/client (+20 more)

### Community 5 - "frontend/package.json"
Cohesion: 0.09
Nodes (22): dependencies, axios, react, react-dom, react-router-dom, name, private, scripts (+14 more)

### Community 6 - "adminController.js"
Cohesion: 0.13
Nodes (6): constants, crypto, fs, path, prisma, { PrismaClient }

### Community 7 - "authController.js"
Cohesion: 0.18
Nodes (10): bcrypt, config, constants, generateToken(), generateUuid(), jwt, login(), prisma (+2 more)

### Community 8 - "courseController.js"
Cohesion: 0.20
Nodes (8): constants, createCourse(), generateSlug(), prisma, { PrismaClient }, slugify, updateCourse(), validateTeaserUrl()

### Community 9 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, autoprefixer, postcss, tailwindcss, @types/react, @types/react-dom, vite, @vitejs/plugin-react

### Community 10 - "branding.js"
Cohesion: 0.40
Nodes (4): API_BASE, BRAND_ASSETS, PAYMENT_CHANNELS, PLATFORM_FEES

## Knowledge Gaps
- **133 isolated node(s):** `config`, `jwt`, `{ authenticate }`, `prisma`, `{ PrismaClient }` (+128 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 183 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@prisma/client` connect `affiliateController.js` to `courseRoutes.js`, `server.js`, `backend/package.json`, `adminController.js`, `authController.js`, `courseController.js`?**
  _High betweenness centrality (0.202) - this node is a cross-community bridge._
- **What connects `config`, `jwt`, `{ authenticate }` to the rest of the system?**
  _133 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `courseRoutes.js` be split into smaller, more focused modules?**
  _Cohesion score 0.058069381598793365 - nodes in this community are weakly interconnected._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08897959183673469 - nodes in this community are weakly interconnected._
- **Should `server.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `affiliateController.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07741935483870968 - nodes in this community are weakly interconnected._
- **Should `backend/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._