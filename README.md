# Nexify

> Digital Course Marketplace & Hybrid Education Platform for West Africa

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Express + Prisma + SQLite
- **Auth**: JWT (localStorage)

## Quick Start

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && npm install && npx prisma db push && npx prisma db seed && npm start
```

## Port Map

| Service   | Port |
|-----------|------|
| Frontend  | 5173 |
| Backend   | 5000 |
| Preview   | 4173 |

## Roles

Admin · Creator · Affiliate · Student

## Note

Payment, commission, and revenue-split logic needs review before production use.
