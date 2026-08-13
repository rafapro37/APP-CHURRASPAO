create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  public_code text not null,
  customer text default '',
  phone text default '',
  fulfillment text default 'delivery',
  address text default '',
  address_ref text default '',
  payment text default 'pix',
  change_for text default '',
  observation text default '',
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(10,2) default 0,
  delivery_fee numeric(10,2) default 0,
  total numeric(10,2) default 0,
  status text not null default 'new',
  created_at timestamptz default now()
);

alter table public.orders add column if not exists public_code text;
alter table public.orders add column if not exists customer text default '';
alter table public.orders add column if not exists phone text default '';
alter table public.orders add column if not exists fulfillment text default 'delivery';
alter table public.orders add column if not exists address text default '';
alter table public.orders add column if not exists address_ref text default '';
alter table public.orders add column if not exists payment text default 'pix';
alter table public.orders add column if not exists change_for text default '';
alter table public.orders add column if not exists observation text default '';
alter table public.orders add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.orders add column if not exists subtotal numeric(10,2) default 0;
alter table public.orders add column if not exists delivery_fee numeric(10,2) default 0;
alter table public.orders add column if not exists total numeric(10,2) default 0;
alter table public.orders add column if not exists status text not null default 'new';
alter table public.orders add column if not exists created_at timestamptz default now();

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_public_code_idx on public.orders (public_code);
create index if not exists orders_status_idx on public.orders (status);

alter table public.orders enable row level security;

drop policy if exists "orders public insert" on public.orders;
drop policy if exists "orders public read test" on public.orders;
drop policy if exists "orders public update status test" on public.orders;
drop policy if exists "orders admin read" on public.orders;
drop policy if exists "orders admin update" on public.orders;

create policy "orders public insert"
on public.orders
for insert
to anon, authenticated
with check (true);

create policy "orders public read test"
on public.orders
for select
to anon, authenticated
using (true);

create policy "orders public update status test"
on public.orders
for update
to anon, authenticated
using (true)
with check (true);

do $$
begin
  begin
    alter publication supabase_realtime add table public.orders;
  exception
    when duplicate_object then null;
  end;
end $$;
