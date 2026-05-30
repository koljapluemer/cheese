create extension if not exists pgcrypto;

create table public.players (
  id uuid primary key default gen_random_uuid(),
  nickname text not null unique,
  cows integer not null default 100 check (cows >= 0),
  starter_picks_completed integer not null default 0 check (
    starter_picks_completed >= 0
    and starter_picks_completed <= 3
  ),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint players_nickname_length check (char_length(btrim(nickname)) between 1 and 24)
);

create table public.player_inventory (
  player_id uuid not null references public.players(id) on delete cascade,
  cheese_name text not null,
  quantity integer not null default 1 check (quantity >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (player_id, cheese_name)
);

create table public.trader_prices (
  cheese_name text primary key,
  buy_price integer not null check (buy_price >= 3),
  sell_price integer not null check (sell_price >= 1),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint trader_prices_spread check (sell_price <= buy_price - 2)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger players_set_updated_at
before update on public.players
for each row
execute procedure public.set_updated_at();

create trigger player_inventory_set_updated_at
before update on public.player_inventory
for each row
execute procedure public.set_updated_at();

create trigger trader_prices_set_updated_at
before update on public.trader_prices
for each row
execute procedure public.set_updated_at();

create view public.leaderboard_rows as
select
  p.id as player_id,
  p.nickname,
  p.cows,
  p.starter_picks_completed,
  coalesce(sum(pi.quantity), 0)::integer as cheese_count,
  coalesce(count(*) filter (where pi.quantity > 0), 0)::integer as unique_types,
  (
    coalesce(sum(pi.quantity), 0)
    + (coalesce(count(*) filter (where pi.quantity > 0), 0) * 5)
  )::integer as score
from public.players p
left join public.player_inventory pi on pi.player_id = p.id
group by p.id;

alter table public.players disable row level security;
alter table public.player_inventory disable row level security;
alter table public.trader_prices disable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.players to anon, authenticated;
grant select, insert, update, delete on public.player_inventory to anon, authenticated;
grant select, insert, update, delete on public.trader_prices to anon, authenticated;
grant select on public.leaderboard_rows to anon, authenticated;
