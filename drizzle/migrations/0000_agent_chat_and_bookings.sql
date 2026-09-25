create table public.agent_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.agent_threads to authenticated;
grant all on public.agent_threads to service_role;
alter table public.agent_threads enable row level security;
create policy "own threads" on public.agent_threads for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.agent_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message jsonb not null,
  created_at timestamptz not null default now()
);
create index on public.agent_messages(thread_id, created_at);
grant select, insert, update, delete on public.agent_messages to authenticated;
grant all on public.agent_messages to service_role;
alter table public.agent_messages enable row level security;
create policy "own messages" on public.agent_messages for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid references public.agent_threads(id) on delete set null,
  kind text not null default 'flight',
  duffel_offer_id text,
  duffel_order_id text,
  booking_reference text,
  passengers jsonb not null default '[]'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  amount numeric not null,
  currency text not null default 'USD',
  status text not null default 'awaiting_approval',
  stripe_session_id text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;
create policy "own bookings read" on public.bookings for select to authenticated using (user_id = auth.uid());