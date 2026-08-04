create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  status text not null check (status in ('Hadir', 'Tidak Hadir', 'Ragu-ragu')),
  message text not null check (char_length(message) between 1 and 1000),
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.rsvps enable row level security;

drop policy if exists "Anyone can submit an RSVP" on public.rsvps;
create policy "Anyone can submit an RSVP"
on public.rsvps
for insert
to anon
with check (
  char_length(name) between 1 and 120
  and status in ('Hadir', 'Tidak Hadir', 'Ragu-ragu')
  and char_length(message) between 1 and 1000
);

drop policy if exists "Anyone can read visible wishes" on public.rsvps;
create policy "Anyone can read visible wishes"
on public.rsvps
for select
to anon
using (is_visible = true);

grant select, insert on public.rsvps to anon;
