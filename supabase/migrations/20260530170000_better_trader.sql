alter table public.trader_prices
add column offer_starts_at timestamptz not null default timezone('utc', now());
