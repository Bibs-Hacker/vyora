-- VYORA: Row Level Security. Every table is locked down; access is granted
-- only through explicit policies. Authorization is enforced here, never only
-- in the frontend.

alter table public.profiles             enable row level security;
alter table public.posts                enable row level security;
alter table public.post_media           enable row level security;
alter table public.likes                enable row level security;
alter table public.comments             enable row level security;
alter table public.bookmarks            enable row level security;
alter table public.follows              enable row level security;
alter table public.stories              enable row level security;
alter table public.story_views          enable row level security;
alter table public.conversations        enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages             enable row level security;
alter table public.notifications        enable row level security;
alter table public.blocks               enable row level security;
alter table public.reports              enable row level security;
alter table public.user_preferences     enable row level security;

-- profiles ---------------------------------------------------------------
create policy profiles_read on public.profiles for select
  using (not public.is_blocked(auth.uid(), id));
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_insert_self on public.profiles for insert
  with check (id = auth.uid());

-- posts ------------------------------------------------------------------
create policy posts_read on public.posts for select
  using (public.can_view(author_id));
create policy posts_insert_own on public.posts for insert
  with check (author_id = auth.uid());
create policy posts_update_own on public.posts for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy posts_delete_own on public.posts for delete
  using (author_id = auth.uid());

-- post_media (tied to parent post ownership / visibility) ----------------
create policy media_read on public.post_media for select
  using (exists (select 1 from public.posts p where p.id = post_id and public.can_view(p.author_id)));
create policy media_write on public.post_media for all
  using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()))
  with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

-- likes ------------------------------------------------------------------
create policy likes_read on public.likes for select
  using (exists (select 1 from public.posts p where p.id = post_id and public.can_view(p.author_id)));
create policy likes_insert_own on public.likes for insert
  with check (user_id = auth.uid());
create policy likes_delete_own on public.likes for delete
  using (user_id = auth.uid());

-- comments ---------------------------------------------------------------
create policy comments_read on public.comments for select
  using (exists (select 1 from public.posts p where p.id = post_id and public.can_view(p.author_id)));
create policy comments_insert_own on public.comments for insert
  with check (author_id = auth.uid());
create policy comments_delete_own on public.comments for delete
  using (author_id = auth.uid());

-- bookmarks (strictly private) -------------------------------------------
create policy bookmarks_own on public.bookmarks for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- follows ----------------------------------------------------------------
create policy follows_read on public.follows for select
  using (follower_id = auth.uid() or followee_id = auth.uid()
         or (status = 'accepted' and public.can_view(followee_id)));
create policy follows_insert_own on public.follows for insert
  with check (follower_id = auth.uid() and not public.is_blocked(follower_id, followee_id));
create policy follows_update_target on public.follows for update
  using (followee_id = auth.uid()) with check (followee_id = auth.uid());
create policy follows_delete_own on public.follows for delete
  using (follower_id = auth.uid() or followee_id = auth.uid());

-- stories ----------------------------------------------------------------
create policy stories_read on public.stories for select
  using (expires_at > now() and public.can_view(author_id));
create policy stories_insert_own on public.stories for insert
  with check (author_id = auth.uid());
create policy stories_delete_own on public.stories for delete
  using (author_id = auth.uid());

create policy story_views_read on public.story_views for select
  using (viewer_id = auth.uid()
         or exists (select 1 from public.stories s where s.id = story_id and s.author_id = auth.uid()));
create policy story_views_insert_own on public.story_views for insert
  with check (viewer_id = auth.uid());

-- conversations & members ------------------------------------------------
create policy conv_read on public.conversations for select
  using (exists (select 1 from public.conversation_members m
                 where m.conversation_id = id and m.user_id = auth.uid()));
create policy conv_insert on public.conversations for insert
  with check (created_by = auth.uid());

create policy members_read on public.conversation_members for select
  using (exists (select 1 from public.conversation_members m
                 where m.conversation_id = conversation_id and m.user_id = auth.uid()));
create policy members_update_self on public.conversation_members for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy members_delete_self on public.conversation_members for delete
  using (user_id = auth.uid());

-- messages: only members may read; sender must be a member and not blocked --
create policy messages_read on public.messages for select
  using (exists (select 1 from public.conversation_members m
                 where m.conversation_id = conversation_id and m.user_id = auth.uid()));
create policy messages_insert_member on public.messages for insert
  with check (sender_id = auth.uid()
    and exists (select 1 from public.conversation_members m
                where m.conversation_id = conversation_id and m.user_id = auth.uid())
    and not exists (select 1 from public.conversation_members m
                    join public.blocks b on b.blocker_id = m.user_id
                    where m.conversation_id = conversation_id
                      and m.user_id <> auth.uid() and b.blocked_id = auth.uid()));

-- notifications ----------------------------------------------------------
create policy notif_read_own on public.notifications for select
  using (user_id = auth.uid());
create policy notif_update_own on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notif_delete_own on public.notifications for delete
  using (user_id = auth.uid());

-- blocks -----------------------------------------------------------------
create policy blocks_own on public.blocks for all
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- reports ----------------------------------------------------------------
create policy reports_insert_own on public.reports for insert
  with check (reporter_id = auth.uid());
create policy reports_read_own on public.reports for select
  using (reporter_id = auth.uid());

-- user_preferences -------------------------------------------------------
create policy prefs_own on public.user_preferences for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
