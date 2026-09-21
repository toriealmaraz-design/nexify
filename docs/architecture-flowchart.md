flowchart TB
    subgraph FRONTEND["🎨 Frontend (React + Vite + Tailwind) — :5173"]
        direction LR
        A1[PublicLanding] -->|Browse courses| API
        A2[LoginPage] -->|POST /auth/login| AUTH
        A3[RegisterPage] -->|POST /auth/register| AUTH
        A4[CourseDetail] -->|GET /courses/:id| COURSES
        A5[AdminDashboard] -->|Admin routes| ADMIN
        A6[CreatorDashboard] -->|Creator routes| COURSES
        A7[AffiliateDashboard] -->|Affiliate routes| AFFILIATE
        A8[StudentDashboard] -->|Student routes| ORDERS
        
        context1[AuthContext] -.->|useAuth()| A1
        context1 -.->|useAuth()| A2
        context1 -.->|useAuth()| A5
        context2[CartContext] -.->|useCart()| A4
        context2 -.->|useCart()| A1
        
        NEXA_FAB((Nexa FAB)) -->|POST /nexa/chat| NEXA_API
    end
    
    subgraph PROX["Vite Proxy (:5173 → :5000)"]
        VITE[Dev Server]
    end
    
    subgraph BACKEND["⚙️ Backend (Express + Prisma + SQLite) — :5000"]
        direction TB
        
        MIDDLEWARE["Middleware Stack"]
        MIDDLEWARE --> CORS[CORS Guard]
        MIDDLEWARE --> AUTH_MW[authenticate()]
        MIDDLEWARE --> RBAC[requirePermission/requireRole]
        MIDDLEWARE --> NEXA_SCOPE[nexaScopeMiddleware]
        
        ROUTES["Routes /api/v1"]
        ROUTES --> AUTH_Routes[authRoutes]
        ROUTES --> COURSE_Routes[courseRoutes]
        ROUTES --> ORDER_Routes[orderRoutes]
        ROUTES --> AFFILIATE_Routes[affiliateRoutes]
        ROUTES --> NEXA_Routes[nexaRoutes]
        ROUTES --> ADMIN_Routes[adminRoutes]
        
        AUTH_Routes --> AUTH_C[authController]
        COURSE_Routes --> COURSE_C[courseController]
        ORDER_ROUTES --> ORDER_C[orderController]
        AFFILIATE_Routes --> AFFILIATE_C[affiliateController]
        NEXA_Routes --> NEXA_C[nexaController]
        ADMIN_ROUTES --> ADMIN_C[adminController]
        
        UTILS["Utils"]
        UTILS --> REVENUE[revenueSplitter.js]
        UTILS --> SEAT[seatManager.js]
        
        PRISMA["Prisma ORM"]
        PRISMA --> DB[("SQLite dev.db")]
        
        AUTH_C --> PRISMA
        COURSE_C --> PRISMA
        ORDER_C --> PRISMA
        AFFILIATE_C --> PRISMA
        ADMIN_C --> PRISMA
        NEXA_C --> PRISMA
    end
    
    API <-->|HTTPS/REST JSON| VITE
    AUTH <-->|JWT Bearer| AUTH_MW
    COURSES <-->|Scoped queries| COURSE_C
    ORDERS <-->|Checkout + Revenue Split| ORDER_C
    AFFILIATE <-->|Link gen + tracking| AFFILIATE_C
    ADMIN <-->|Staging + Metrics| ADMIN_C
    NEXA_API <-->|Scoped chat| NEXA_C
    
    style FRONTEND fill:#f3efe6,stroke:#0D223A,stroke-width:2px
    style BACKEND fill:#0D223A,stroke:#C59B27,stroke-width:2px,color:#fff
    style PROX fill:#e8e2d5,stroke:#C59B27,stroke-width:1px
    style MIDDLEWARE fill:#C59B27,stroke:#0D223A,stroke-width:1px,color:#fff
    style PRISMA fill:#e8e2d5,stroke:#0D223A,stroke-width:1px
    style DB fill:#1c5062,stroke:#0D223A,stroke-width:2px,color:#fff
    style NEXA_FAB fill:#C59B27,stroke:none,color:#fff
