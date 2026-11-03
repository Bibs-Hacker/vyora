# VYORA

**A world made for connection.**

VYORA is a full-stack, installable social-network **PWA**. It is a real application — real email/password authentication, a persistent Postgres database, direct messaging, notifications, 24-hour stories, editable profiles, multi-account switching, and account deletion. Nothing on screen is mocked or faked; every piece of data comes from your own Supabase backend.

- **Frontend:** React 18 + TypeScript + Vite
- **PWA:** `vite-plugin-pwa` (installable, offline shell, service worker)
- **Backend:** Supabase (Postgres, Auth, Storage, Row Level Security, RPCs)
- **Deploy:** Vercel (static SPA) + hosted Supabase project

*Created by Dev Brian.*

---

## 1. What you need

1. [Node.js](https://nodejs.org/) 18+ and npm.
2. A free [Supabase](https://supabase.com/) account (one project).
3. (Optional) A [Vercel](https://vercel.com/) account for deployment.

---

## 2. Set up the backend (Supabase)

1. Create a new project at [app.supabase.com](https://app.supabase.com).
2. Open the project's **SQL Editor** and run the migration files in order, top to bottom:
   - `supabase/migrations/0001_schema.sql` — tables (profiles, posts, likes, comments, follows, conversations, messages, notifications, stories).
   - `supabase/migrations/0002_functions.sql` — triggers + RPCs (`get_or_create_dm`, `delete_my_account`, `purge_expired_stories`, and the profile/counter triggers).
   - `supabase/migrations/0003_rls.sql` — Row Level Security policies so each user can only touch data they are allowed to.
   - `supabase/migrations/0004_storage.sql` — storage buckets + policies for avatars, post media, and story media.
3. (Optional) Run `supabase/seed.sql` only if you want a couple of demo rows to look at. You can skip it entirely — the app works from an empty database.
4. In **Authentication → Providers**, make sure **Email** is enabled. For the smoothest local testing, turn **"Confirm email"** off (Authentication → Sign In / Providers → Email) so new signups can log in immediately. Leave it on in production if you want verified emails.
5. In **Project Settings → API**, copy:
   - the **Project URL**, and
   - the **anon / public** key.

> ⚠️ **Never** copy the `service_role` key into the frontend or commit it anywhere. The app only uses the public anon key; security is enforced by RLS.

---

## 3. Run it locally

```bash
# from the project root
cp .env.example .env.local
# then edit .env.local with your values
npm install
npm run dev
```

Your `.env.local` must contain:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Open the printed local URL (usually `http://localhost:5173`). Sign up, and you're in.

To check the production build / type-check:

```bash
npm run build
npm run preview
```

---

## 4. Deploy to Vercel

1. Push this project to a Git repository (GitHub/GitLab/Bitbucket).
2. In Vercel, **New Project → Import** that repo.
3. Framework preset: **Vite**. Build command `npm run build`, output `dist`. (`vercel.json` already configures SPA routing fallback.)
4. Add the two environment variables in **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. Then in Supabase **Authentication → URL Configuration**, add your Vercel domain to the **Site URL** / redirect allow-list.
6. Visit the site on a phone and use **"Add to Home Screen"** to install it as a PWA.

---

## 5. What actually works (real, not mocked)

- **Authentication** — email + password sign-up and sign-in via Supabase Auth, persistent sessions, sign-out.
- **Profiles** — auto-created on first login; edit display name, username, bio, and avatar (uploaded to Supabase Storage).
- **Posts** — create text + image posts; images stored in Storage; a real feed rendered from the database.
- **Likes & comments** — persisted, with live counts maintained by triggers.
- **Follow / unfollow** — real follow graph; follower/following counts.
- **Discover** — search people and browse posts.
- **Direct messages** — 1:1 conversations created on demand via the `get_or_create_dm` RPC; messages persisted; realtime updates.
- **Notifications** — generated for likes, comments, follows, and messages; mark-as-read supported.
- **Stories** — 24-hour stories with media upload; expired ones are cleaned up by `purge_expired_stories`.
- **Settings** — 8 selectable themes (persisted), preferences, legal pages.
- **Account switching** — keep several signed-in accounts and switch between them (stores session tokens locally, **not** passwords).
- **Account deletion** — the `delete_my_account` RPC removes the user's data.
- **PWA** — installable, has an offline app shell and cached media.

---

## 6. Honest limitations

- **You must supply your own Supabase project.** The app cannot run without `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. There is no bundled backend.
- **Realtime** depends on Supabase Realtime being enabled for the relevant tables (messages/notifications). Enable it in the Supabase dashboard if you want instant updates without a refresh.
- **Login is by email + password**, not username. This is deliberate — looking up accounts by username before auth would leak which usernames exist (account enumeration).
- **Push notifications** are in-app only. True OS-level push (Web Push) is not wired up; notifications appear inside the app.
- **Email confirmation**: if you leave "Confirm email" on in Supabase, new users must click the emailed link before they can sign in.
- **Account deletion** removes application data via RPC. Fully erasing the `auth.users` row may also require a server-side admin call depending on your Supabase settings.
- No automated test suite is included.

---

## 7. Project structure

```text
vyora/
├─ index.html
├─ vite.config.ts
├─ vercel.json
├─ .env.example
├─ public/
├─ src/
│  ├─ lib/
│  ├─ context/
│  ├─ components/
│  ├─ screens/
│  ├─ styles/
│  ├─ App.tsx
│  └─ main.tsx
└─ supabase/
   ├─ migrations/
   └─ seed.sql
```

---

**VYORA — A world made for connection. Created by Dev Brian.**