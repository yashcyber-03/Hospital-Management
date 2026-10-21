# Hospital Management System (Phase 1)

## Local setup
1. Install Node.js 18+ and run `npm install`
2. Copy `.env.example` to `.env` and add your Supabase URL and anon key (optional for Phase 1)
3. `npm run dev` -> http://localhost:5173

## Database
Supabase Dashboard -> SQL Editor -> paste `supabase/migrations/0001_core_schema.sql` -> Run.
Then Authentication -> URL Configuration: add your Vercel URL as Site URL and Redirect URL.

## Deploy to Vercel
1. Push this folder to a GitHub repo
2. vercel.com -> Add New Project -> import the repo
3. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`
4. Settings -> Environment Variables: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
5. After changing env vars: Deployments -> Redeploy (Vite bakes them in at build time)

## Phase 2: demo accounts (safe setup)
1. Run `supabase/migrations/0002_policies_and_seed.sql` in the SQL Editor.
2. Register 2 users in the app (e.g. a patient and `doctor1@example.com`).
3. Make the doctor: `select make_demo_doctor('doctor1@example.com','Cardiology','Cardiologist',500);`
4. Make yourself admin: `update profiles set role='admin' where id=(select id from auth.users where email='YOU@example.com');`
5. Log in as the patient -> Find doctors -> book a slot.
