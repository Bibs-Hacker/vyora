# VYORA — One-Page Deployment Checklist

> Work top to bottom. Each box is a hard gate — don't move on until it's true.

## A. Prerequisites
- [ ] Node.js **18+** and npm installed (`node -v`).
- [ ] Supabase account + **one new project** created.
- [ ] (For deploy) Vercel account connected to your Git provider.

## B. Backend — Supabase
- [ ] Open **SQL Editor** and run migrations **in order**:
      `0001_schema.sql` → `0002_functions.sql` → `0003_rls.sql` → `0004_storage.sql`.
- [ ] Confirm tables exist (profiles, posts, likes, comments, follows,
      conversations, messages, notifications, stories).
- [ ] Confirm storage buckets exist (avatars, post-media, story-media).
- [ ] **Authentication → Providers**: Email enabled.
- [ ] Decide on **Confirm email**: OFF for quick testing, ON for production.
- [ ] (Optional) Enable **Realtime** on `messages` + `notifications` for instant
      updates.
- [ ] (Optional) Run `seed.sql` only if you want demo rows.
- [ ] **Project Settings → API**: copy **Project URL** + **anon/public** key.
- [ ] ⚠️ Confirm you did **NOT** copy the `service_role` key anywhere client-side.

## C. Local verification
- [ ] `cp .env.example .env.local` and paste your URL + anon key.
- [ ] `npm install` completes without errors.
- [ ] `npm run build` passes (type-check + production bundle).
- [ ] `npm run dev` → open local URL, **sign up**, create a post, send a DM.
- [ ] Avatar/image upload lands in Supabase Storage (check the dashboard).

## D. Deploy — Vercel
- [ ] Push the repo to GitHub/GitLab/Bitbucket.
- [ ] Vercel → **New Project → Import** the repo (preset: **Vite**).
- [ ] Build command `npm run build`, output dir `dist`.
- [ ] Add env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
      (Production + Preview).
- [ ] Trigger deploy; wait for green build.

## E. Post-deploy wiring
- [ ] Supabase → **Authentication → URL Configuration**: add the Vercel domain
      to **Site URL** and redirect allow-list.
- [ ] Visit the live site; sign up with a fresh account end-to-end.
- [ ] On a phone: **Add to Home Screen** → app installs as a PWA.
- [ ] Offline test: reload with network off — app shell still loads.

## F. Production hardening (recommended)
- [ ] Turn **Confirm email** ON and verify the confirmation flow.
- [ ] Review RLS policies in `0003_rls.sql` match your expectations.
- [ ] Set Storage bucket size/type limits if desired.
- [ ] Add a custom domain in Vercel + update Supabase Site URL again.

---
### Rollback / emergency
- Vercel → **Deployments** → promote a previous green build.
- Keep a SQL snapshot/backup before re-running or altering migrations.

_VYORA — Created by Dev Brian._
