-- VYORA: helper functions, triggers, and server-side RPCs

-- updated_at maintenance
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_posts_touch on public.posts;
create trigger trg_posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- Auto-create profile + preferences when an auth user is created.
-- Username/full_name come from signup metadata; fall back to a safe default.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  uname text;
  fname text;
begin
  uname := lower(coalesce(new.raw_user_meta_data->>'username',
           'user_' || substr(new.id::text, 1, 8)));
  fname := coalesce(new.raw_user_meta_data->>'full_name', 'New member');
  insert into public.profiles (id, username, full_name, avatar_url, gender)
    values (new.id, uname, fname,
            new.raw_user_meta_data->>'avatar_url',
            new.raw_user_meta_data->>'gender')
    on conflict (id) do nothing;
  insert into public.user_preferences (user_id) values (new.id)
    on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Block helpers -----------------------------------------------------------
create or replace function public.is_blocked(a uuid, b uuid) returns boolean
language sql stable as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

-- Can the current user view target profile's content?
create or replace function public.can_view(target uuid) returns boolean
language sql stable as $$
  select case
    when auth.uid() = target then true
    when public.is_blocked(auth.uid(), target) then false
    when not (select is_private from public.profiles where id = target) then true
    else exists (select 1 from public.follows
                 where follower_id = auth.uid() and followee_id = target
                 and status = 'accepted')
  end;
$$;

-- Notification helper triggers ---------------------------------------------
create or replace function public.notify_like() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select author_id into owner from public.posts where id = new.post_id;
  if owner is not null and owner <> new.user_id and not public.is_blocked(owner, new.user_id) then
    insert into public.notifications(user_id, actor_id, type, post_id)
      values (owner, new.user_id, 'like', new.post_id);
  end if;
  return new;
end $$;
drop trigger if exists trg_notify_like on public.likes;
create trigger trg_notify_like after insert on public.likes
  for each row execute function public.notify_like();

create or replace function public.notify_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select author_id into owner from public.posts where id = new.post_id;
  if owner is not null and owner <> new.author_id and not public.is_blocked(owner, new.author_id) then
    insert into public.notifications(user_id, actor_id, type, post_id)
      values (owner, new.author_id, 'comment', new.post_id);
  end if;
  return new;
end $$;
drop trigger if exists trg_notify_comment on public.comments;
create trigger trg_notify_comment after insert on public.comments
  for each row execute function public.notify_comment();

create or replace function public.notify_follow() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_blocked(new.followee_id, new.follower_id) then
    insert into public.notifications(user_id, actor_id, type)
      values (new.followee_id, new.follower_id,
              case when new.status = 'pending' then 'follow_request' else 'follow' end);
  end if;
  return new;
end $$;
drop trigger if exists trg_notify_follow on public.follows;
create trigger trg_notify_follow after insert on public.follows
  for each row execute function public.notify_follow();

create or replace function public.notify_message() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  insert into public.notifications(user_id, actor_id, type, conversation_id)
    select cm.user_id, new.sender_id, 'message', new.conversation_id
    from public.conversation_members cm
    where cm.conversation_id = new.conversation_id
      and cm.user_id <> new.sender_id
      and not public.is_blocked(cm.user_id, new.sender_id);
  return new;
end $$;
drop trigger if exists trg_notify_message on public.messages;
create trigger trg_notify_message after insert on public.messages
  for each row execute function public.notify_message();

-- Find-or-create a 1:1 conversation between the caller and another user.
create or replace function public.get_or_create_dm(other uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if public.is_blocked(auth.uid(), other) then
    raise exception 'blocked';
  end if;
  select c.id into cid
  from public.conversations c
  join public.conversation_members a on a.conversation_id = c.id and a.user_id = auth.uid()
  join public.conversation_members b on b.conversation_id = c.id and b.user_id = other
  where (select count(*) from public.conversation_members m where m.conversation_id = c.id) = 2
  limit 1;
  if cid is null then
    insert into public.conversations(created_by) values (auth.uid()) returning id into cid;
    insert into public.conversation_members(conversation_id, user_id)
      values (cid, auth.uid()), (cid, other);
  end if;
  return cid;
end $$;

-- Secure account deletion. Requires an authenticated caller; removes the
-- auth user which cascades to all owned rows via FK on delete cascade.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- Purge expired stories (invoke via scheduled job / pg_cron).
create or replace function public.purge_expired_stories() returns void
language sql security definer set search_path = public as $$
  delete from public.stories where expires_at < now();
$$;
