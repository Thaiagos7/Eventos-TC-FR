create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  message text not null,
  type text not null check (type in ('approval', 'rejection', 'registration', 'event_update', 'event_cancel')),
  read boolean not null default false,
  created_at timestamptz not null default now(),
  event_id uuid references public.events(id) on delete cascade
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
drop policy if exists "Authenticated users can create notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;
drop policy if exists "Users can delete own notifications" on public.notifications;

create policy "Users can read own notifications"
  on public.notifications
  for select
  using (
    auth.role() = 'authenticated'
    and (
      user_id = auth.uid()::text
      or lower(user_id) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

create policy "Authenticated users can create notifications"
  on public.notifications
  for insert
  with check (auth.role() = 'authenticated');

create policy "Users can update own notifications"
  on public.notifications
  for update
  using (
    auth.role() = 'authenticated'
    and (
      user_id = auth.uid()::text
      or lower(user_id) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
  with check (
    auth.role() = 'authenticated'
    and (
      user_id = auth.uid()::text
      or lower(user_id) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

create policy "Users can delete own notifications"
  on public.notifications
  for delete
  using (
    auth.role() = 'authenticated'
    and (
      user_id = auth.uid()::text
      or lower(user_id) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

grant select, insert, update, delete on public.notifications to authenticated;
