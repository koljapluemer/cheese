create table public.trader_price_history (
  id uuid primary key default gen_random_uuid(),
  cheese_name text not null,
  buy_price integer not null check (buy_price >= 3),
  sell_price integer not null check (sell_price >= 1),
  captured_at timestamptz not null default timezone('utc', now()),
  constraint trader_price_history_spread check (sell_price <= buy_price - 2)
);

create index trader_price_history_cheese_name_captured_at_idx
on public.trader_price_history (cheese_name, captured_at desc);

insert into public.trader_price_history (cheese_name, buy_price, sell_price, captured_at)
select
  cheese_name,
  buy_price,
  sell_price,
  updated_at
from public.trader_prices;

alter table public.trader_price_history disable row level security;

grant select, insert, update, delete on public.trader_price_history to anon, authenticated;
