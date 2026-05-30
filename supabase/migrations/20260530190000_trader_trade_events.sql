create table public.trader_trade_events (
  id uuid primary key default gen_random_uuid(),
  cheese_name text not null,
  price integer not null check (price >= 1),
  trade_kind text not null check (trade_kind in ('buy', 'sell')),
  traded_at timestamptz not null default timezone('utc', now())
);

create index trader_trade_events_cheese_name_traded_at_idx
on public.trader_trade_events (cheese_name, traded_at desc);

alter table public.trader_trade_events disable row level security;

grant select, insert, update, delete on public.trader_trade_events to anon, authenticated;
