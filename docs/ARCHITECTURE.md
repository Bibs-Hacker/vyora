# VYORA — High-Level Architecture Overview

**VYORA** is a client-heavy PWA that talks directly to a Supabase backend. There
is no custom server in between — the browser is the app, Supabase is the
platform, and security lives in the database (Row Level Security) rather than in
middleware.

```
            ┌───────────────────────────────────────────────┐
            │                  THE BROWSER                   │
            │        React 18 + TypeScript + Vite PWA        │
            │                                               │
            │  UI layer      Screens / Components / Icons    │
            │  State         Auth · Theme · Toast contexts    │
            │  Data layer    src/lib/* (api, social,         │
            │                messages, notifications,          │
            │                stories, accounts, prefs, upload)  │
            │  Client        supabase-js (single instance)    │
            │  PWA           service worker + manifest         │
            └───────────────────────┬───────────────────────┘
                   HTTPS (anon key) │  JWT per signed-in user
            ┌───────────────────────▼───────────────────────┐
            │                   SUPABASE                      │
            │                                               │
            │  Auth        Email/password, JWT sessions      │
            │  Postgres    Tables + triggers + RPCs          │
            │  RLS         Per-row access control (the gate) │
            │  Storage     avatars / post-media / story-media│
            │  Realtime    messages + notifications channels │
            └───────────────────────────────────────────────┘
```

## 1. Frontend layers

**Screens** (`src/screens`) are the routed pages: Intro, Auth, Home feed,
Create, Discover, Messages (+ Chat), Profile, Notifications, Settings, Legal.
Routing is handled by `react-router-dom` in `App.tsx`.

**Components** (`src/components`) are reusable UI: SVG `Icons`, `ui` primitives,
`PostCard`, `StoriesRail`, `EditProfile`, and the `Layout` shell (top bar +
bottom nav / side nav).

**Contexts** (`src/context`) hold cross-cutting state:
- `AuthContext` — current session + profile, sign-in/up/out.
- `ThemeContext` — 8 themes, persisted to local storage.
- `ToastContext` — transient notifications.

**Data layer** (`src/lib`) is the only place that speaks to Supabase. Screens
never call the database directly; they call these typed helpers:
| Module | Responsibility |
|---|---|
| `supabase.ts` | Creates the single supabase-js client from env vars |
| `types.ts` | Shared TypeScript row/DTO types |
| `api.ts` | Posts, feed, comments, likes |
| `social.ts` | Follow graph, profiles, discover/search |
| `messages.ts` | Conversations + messages (uses `get_or_create_dm`) |
| `notifications.ts` | Read/list/mark-read notifications |
| `stories.ts` | Create/list 24h stories |
| `accounts.ts` | Multi-account session switching (tokens, not passwords) |
| `prefs.ts` | User preferences |
| `upload.ts` | File uploads to Storage buckets |

This keeps a clean seam: swap or refactor the backend behind `src/lib` without
touching screens.

## 2. Backend: Supabase as the whole platform

**Auth.** Email + password through Supabase Auth. A JWT accompanies every
request; Postgres reads the caller's `auth.uid()` from it. Login is email-based
on purpose — resolving usernames before auth would leak which accounts exist.

**Database** (`0001_schema.sql`). Normalized tables for profiles, posts, likes,
comments, follows, conversations, messages, notifications, and stories, with
foreign keys and indexes.

**Functions & triggers** (`0002_functions.sql`).
- Triggers auto-create a profile on signup and keep denormalized counters
  (likes, followers, comments) accurate.
- RPCs encapsulate multi-step logic safely server-side:
  `get_or_create_dm` (idempotent 1:1 conversation), `delete_my_account`
  (removes the caller's data), `purge_expired_stories` (housekeeping).

**Row Level Security** (`0003_rls.sql`) is the real security boundary. Every
table has policies so a user can only read/write rows they're entitled to —
this is what makes it safe to ship only the public anon key to the browser.

**Storage** (`0004_storage.sql`). Three buckets (avatars, post media, story
media) with policies mirroring the table permissions. The client uploads via
`upload.ts` and stores returned URLs on the rows.

**Realtime.** When enabled, `messages` and `notifications` push changes over
websocket channels so chats and the notification badge update without polling.

## 3. Key request flows

**Send a DM:** Messages screen → `messages.ts` calls `get_or_create_dm(peer)` →
RPC returns a conversation id → insert message row (RLS checks membership) →
Realtime fans out to the recipient → a notification row triggers their badge.

**Create a post with an image:** Create screen → `upload.ts` puts the file in
the `post-media` bucket → `api.ts` inserts the post row with the media URL →
feed query (RLS-filtered) renders it via `PostCard`.

**Switch accounts:** `accounts.ts` keeps each session's tokens in local storage
(never passwords) and re-hydrates the supabase client when you switch — no
re-login required.

## 4. PWA & deployment shape

`vite-plugin-pwa` generates the manifest and a Workbox service worker:
installable to the home screen, an offline app shell via navigation fallback,
and cache-first handling for media. The whole frontend builds to static files
(`dist`) served by Vercel's CDN; `vercel.json` rewrites all routes to
`index.html` for client-side routing. Supabase is a separate hosted service the
client reaches over HTTPS.

## 5. Design principles
- **No middle server** — fewer moving parts; the DB enforces the rules.
- **Security in the database** — RLS + RPCs, never trust the client.
- **Thin screens, typed data layer** — one seam between UI and backend.
- **Public key only in the browser** — the `service_role` key never ships.
- **Honest state** — everything rendered comes from real rows; nothing mocked.

_VYORA — A world made for connection. Created by Dev Brian._
