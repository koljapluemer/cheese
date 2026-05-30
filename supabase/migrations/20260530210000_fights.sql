alter table public.players
add column fights_won integer not null default 0 check (fights_won >= 0),
add column fights_played integer not null default 0 check (fights_played >= fights_won);

create table public.fight_offers (
  id uuid primary key default gen_random_uuid(),
  host_player_id uuid not null references public.players(id) on delete cascade,
  host_nickname text not null,
  host_team text[] not null,
  status text not null default 'open' check (status in ('open', 'matched', 'cancelled')),
  accepted_by_player_id uuid references public.players(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint fight_offers_host_team_size check (cardinality(host_team) = 3)
);

create unique index fight_offers_one_open_per_host_idx
on public.fight_offers (host_player_id)
where status = 'open';

create table public.fights (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null unique references public.fight_offers(id) on delete cascade,
  host_player_id uuid not null references public.players(id) on delete cascade,
  host_nickname text not null,
  guest_player_id uuid not null references public.players(id) on delete cascade,
  guest_nickname text not null,
  host_team text[] not null,
  guest_team text[],
  host_points integer not null default 0 check (host_points between 0 and 2),
  guest_points integer not null default 0 check (guest_points between 0 and 2),
  used_host_fighter_indexes integer[] not null default '{}',
  used_guest_fighter_indexes integer[] not null default '{}',
  state text not null default 'waiting_for_guest_team' check (
    state in ('waiting_for_guest_team', 'round_overview', 'round_resolution', 'loot_reveal', 'completed')
  ),
  phase_payload jsonb not null default '{}'::jsonb,
  phase_started_at timestamptz,
  phase_ends_at timestamptz,
  winner_player_id uuid references public.players(id) on delete set null,
  loser_player_id uuid references public.players(id) on delete set null,
  stolen_cheese_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint fights_host_team_size check (cardinality(host_team) = 3),
  constraint fights_guest_team_size check (guest_team is null or cardinality(guest_team) = 3),
  constraint fights_distinct_players check (host_player_id <> guest_player_id)
);

create unique index fights_one_active_host_idx
on public.fights (host_player_id)
where state <> 'completed';

create unique index fights_one_active_guest_idx
on public.fights (guest_player_id)
where state <> 'completed';

create trigger fight_offers_set_updated_at
before update on public.fight_offers
for each row
execute procedure public.set_updated_at();

create trigger fights_set_updated_at
before update on public.fights
for each row
execute procedure public.set_updated_at();

drop view if exists public.leaderboard_rows;

create view public.leaderboard_rows as
select
  p.id as player_id,
  p.nickname,
  p.cows,
  p.starter_picks_completed,
  p.fights_won,
  p.fights_played,
  case
    when p.fights_played = 0 then 0
    else round((p.fights_won::numeric / p.fights_played::numeric) * 100)
  end::integer as win_rate,
  coalesce(sum(pi.quantity), 0)::integer as cheese_count,
  coalesce(count(*) filter (where pi.quantity > 0), 0)::integer as unique_types
from public.players p
left join public.player_inventory pi on pi.player_id = p.id
group by p.id;

alter table public.fight_offers disable row level security;
alter table public.fights disable row level security;

grant select, insert, update, delete on public.fight_offers to anon, authenticated;
grant select, insert, update, delete on public.fights to anon, authenticated;
grant select on public.leaderboard_rows to anon, authenticated;

alter publication supabase_realtime add table public.fight_offers;
alter publication supabase_realtime add table public.fights;
