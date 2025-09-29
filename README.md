# DevSoc Hackathon Monorepo

Stack
- Frontend: Next.js (App Router), React, Tailwind, Framer Motion, D3
- Backend: Node.js, Express, Apollo Server
- Database: PostgreSQL + Prisma
- Auth: NextAuth.js with Prisma Adapter
- Deployment: Vercel (web), Railway/Supabase (server/DB)

Getting Started
1. Ensure Postgres is running and update `DATABASE_URL` in `.env` at the repo root.
2. Install deps and generate Prisma client:
   - `npm install`
   - `npm run -w @devsoc/db generate`
3. Start both apps:
   - `npm run dev`
4. Visit web at `http://localhost:3000` and GraphQL at `http://localhost:4000/graphql`.

Auth
- Sign in via Credentials using any email to create a user.

Notes
- Shared Prisma client lives in `packages/db`.
