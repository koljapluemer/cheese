Let's make this prototype (see @doc/0_spec.md for initial idea and context) a game about fighting with cheese.

1) remove the score function from the leaderboard page. Instead of showing a score, start tracking how many fights players won (that's the sorting of the table) and as additional column their win %. Remove the stats badges such as "unique cheese types" as well as the text on top. Give this tab a leaderboard icon and move it last on the bottom nav. Make the tab that's currently inventory the "Home" tab and there show 3 stats: games won, winrate, current placement (and a little link to leaderboard). Note: We need to add supabase data for the win tracking.

Next, we need to add a data field to cheese types: Power.
This should be an integer, prominently displayed as big-ish badge overlaying the bottom right of the cheese's image on each cheese card. For now, just default all to 5.


The big thing:
Add a 'Fight' page, accessible via the nav bottom bar.
Note: For the backend functionality here, we need actual realtime, make sure to implement in supabase accordingly.

The fight page should first contain a big button "Offer a Fight" (when fight offer active, change button to "Cancel Fight Offer").
Then, a list of fight offers from other people: A small card with their username, and an "accept" button.

When someone accepts a fight, or starts a fight offer, they first need to define their fighting team.
We show them a list of their cheeses, similar to the input. But:

- We need to show each individual cheese, so we cannot say "owned 3 times", but need to display 3 separate cards
- Do not include license or market info in this view
- Do include the power!
- Each card can be marked/unmarked to be included in the fighting team. Exactly 3 cheese cards have to be selected, then we can continue via a button both below and above the list saying "Start Fight"

If this is a fight offer, send a toast saying "People can fight you now", if this was in context of accepting a fight, go to the fight flow.
If a fight starts, both players are moved to the fighting flow (if that's feasible)

Fights itself works as follows: First player to get two points win. It's an auto battle, players just observe. First, we start in the overview.
Kind of minimal pokemon style, we see in the upper half the opponent's (from each player's perspective) name, and a minimal version of their 3 fighter cheese cards: just image and badge with the power. in the middle a message "picking fighters....", and then in the bottom half the own fighter cards and the own name.
We should have a little animation with an arrow/pointer jumping between each player's cards, coming to rest on one randomly, after 3 seconds. Thus we have picked the first two fighters. We go into the next screen.
Here, we show the opponents fighters mini card on top, own fighter on bottom. 
In the middle, there should be a bar, made from a green part and a red part. This should be adapted to each player's perspective. Green part represents own fighter's power, red opponent's fighter's powers.
The part's width should be represent each card's power, relative to each other.
E.g., if fighter 1 has a power of 5, and fighter 2 has a power of 15, the bar of the second is 75% of the width of the whole bar.
Then, we should randomly pick a position on the bar, accompanied with an animation of again an arrow going back randomly between the edges of the bar, resting at a random point. The resting point belongs to one opponent, at that point, we send a toast like "Edam wins! 1 Point for player Bob!", start spinning the image of the winning cheese quickly, gray out/opacity out the other image, wait 1 second, and then go back to the fighter overview screen, to repeat the process (the two fighters who already fought are now greyed out and cannot be picked again).

One one player reaches 2 points, the game ends.
We move to a screen saying something like "Player Bob won! He will now steal a cheese...".
Below that, we repeat the randomly-picking-arrow-from-cheese-images like in the fighter selection, only this time we choose one of the fighter's from the losing player, this cheese will then removed from the loser's inventory and given to the winner.
Both players get a relevant toasts, and are redirected to the fighting overview screen.


Stick to @agents.md.

---

Line 3 (line 3): the nav restructure is ambiguous. Does the current Inventory tab become Home in place, and if so, where does inventory browsing live afterward? The final bottom-nav order is also not fully specified.

Line 3 (line 3): win tracking semantics need definition. Should games won and win % count only completed fights, and should cancelled/abandoned offers be excluded from the denominator?

Lines 13-16 (line 13) and 24-25 (line 24): the team-selection flow is unclear. Does the offerer pick their 3 cheeses before the offer becomes visible, and does the accepter pick after clicking Accept? Also, can the offerer change their team while waiting?

Line 14 (line 14): the fight-offer lifecycle needs rules. Is only one active offer per user allowed? Do offers expire? If two players accept at nearly the same time, how is the race resolved?

Line 25 (line 25): “move both players to the fighting flow (if that’s feasible)” needs a fallback. If one player is offline or not on the fight page, should the fight still start and sync when they return?

Lines 27-35 (line 27): for fairness and realtime sync, I’d want confirmation that fighter picks and bar outcomes should be server-authoritative, with clients only animating the already-decided result.

Lines 37-39 (line 37): the steal step is ambiguous. Is the stolen cheese chosen only from the loser’s 3 selected fighters, or from their full inventory? “one of the fighter’s from the losing player” suggests the former, but it should be explicit.

Lines 5-6 (line 5): Power is described as a field on cheese types, but the fight system operates on individual owned cheeses. I can implement either, but the schema implication is different.

1)
nav should be: Home icon (including stats AND inventory view), Fight icon (new flow), Trader icon (as is), Wheel icon (as is), Leaderboard icon (just the leaderboard)

2) only completed

3) offerer must pick before publishing the fight offer, yes. Person who accepts picks after accepting. No changes, but I guess you can just cancel your offer and make a new one
4) one offer per player. no expiry. if both accept, do some very crude resolve. it's just a prototype.
5) simplest possible implementation. we can assume players look at their phones. we should be resilient when it's reasonable, but mostly make sure we get a happy path prototype
6) either server authority, or we declare the offering player as host and allow him to push values. It's just a prototype, pick the implementation that's simpler and less brittle. slight delays are also totally acceptable
7) chosen randomly from the loser's fighters
8) power is per cheese TYPE. individual cheeses have always the power of their parent CheeseType.



---

# Plan: Fight Prototype, Home Merge, and Win-Based Leaderboard

## Summary
- Replace the current `Inventory` page/route with a new `Home` page that combines the existing inventory list with three fight stats: games won, win rate, and current placement, plus a small link to the leaderboard.
- Add a new `Fight` page and make it the only place for offers and the fight flow. Bottom nav becomes: `Home`, `Fight`, `Trader`, `Wheel`, `Leaderboard`.
- Remove score-based ranking entirely. Leaderboard ranking becomes completed-fight wins only, with win rate as a displayed column and secondary sort.
- Implement fights as a Supabase-backed happy-path state machine with realtime subscriptions. The offerer is the coordinator/host for fight progression; both clients observe the same persisted state and animate locally from it.
- Keep to `agents.md`: shared DB/types live in `entities`, page-only fight flow logic/components live in `pages/fight`, global auto-navigation/subscription logic lives in `meta`, and reusable visual cheese pieces stay in `dumb`.

## Key Changes
- Data model and player interfaces:
  - Add `fights_won integer not null default 0` and `fights_played integer not null default 0` to `players`.
  - Replace `leaderboard_rows` so it still exposes `cheese_count`, `unique_types`, `cows`, and `starter_picks_completed`, but removes `score` and adds `fights_won`, `fights_played`, and derived `win_rate`.
  - Update `PlayerSummary`/`LeaderboardEntry` to remove `score` and add `fightsWon`, `fightsPlayed`, and `winRate`.
  - Sort leaderboard by `fights_won desc`, `win_rate desc`, `nickname asc`. Rank is the array index after that sort.
  - Treat win rate as `0` when `fights_played = 0`, and display it as a rounded whole percent for a compact UI.
- Cheese data and card rendering:
  - Add `power` to the cheese entity model with a default value of `5` for every cheese type.
  - No Supabase schema is needed for power in v1; power comes from the cheese catalog/type layer and is inherited by every owned copy of that cheese.
  - Show the power badge on cheese cards and thumbnails wherever a cheese card is already shown, with the badge over the image at bottom-right.
- Home and leaderboard UI:
  - Change `/` to `Home`; move leaderboard to `/leaderboard`.
  - `Home` shows the three requested stats first, then the current inventory list below. Reuse the existing inventory loading logic rather than inventing a new store.
  - Remove leaderboard intro copy, marketplace/trader CTA buttons, and stat badges from the leaderboard page. Keep only the table, current-player highlight, and first-place badge.
  - Remove `Offers` and `Marketplace` from the bottom nav. They can remain as unused routes if cleanup is not necessary for this scope.
- Fight offer schema and lifecycle:
  - Add `fight_offers` with: `id`, `host_player_id`, `host_team text[]`, `status`, `accepted_by_player_id`, `created_at`, `updated_at`.
  - `status` is one of `open`, `matched`, `cancelled`.
  - Enforce one open offer per player with a partial unique index on `host_player_id where status = 'open'`.
  - The offerer must choose exactly three fighters before the offer is inserted. Changing the team means cancelling and creating a new offer.
  - Offer list on the fight page shows only other players’ `open` offers with host nickname and an `Accept` button.
  - Accept uses a conditional update from `open` to `matched`; if two guests race, one succeeds and the loser gets a toast that the offer is gone.
- Fight schema and progression:
  - Add `fights` with: `id`, `offer_id`, `host_player_id`, `guest_player_id`, `host_team text[]`, `guest_team text[] null`, `host_points`, `guest_points`, `used_host_fighter_indexes integer[]`, `used_guest_fighter_indexes integer[]`, `state`, `phase_payload jsonb`, `phase_started_at`, `phase_ends_at`, `winner_player_id`, `loser_player_id`, `stolen_cheese_name`, `created_at`, `updated_at`.
  - `state` is one of `waiting_for_guest_team`, `round_overview`, `round_resolution`, `loot_reveal`, `completed`.
  - `phase_payload` carries the authoritative details for the active animation phase.
  - Team arrays store only cheese names. No per-item inventory table is added; duplicate owned cheeses are expanded into synthetic per-copy cards only in the UI.
  - After accept, insert the fight row immediately with `guest_team = null`. The guest then picks exactly three fighters and updates `guest_team`.
  - Once both teams exist, only the host client advances the fight state. The guest client never resolves rounds; it only observes and submits its team.
  - Each round:
    - Host randomly picks one unused fighter index from each side and writes `round_overview` with a 3-second window and payload containing both fighter indexes, names, and powers.
    - When that window expires, host writes `round_resolution` with payload extended by `rollPosition`, computed power shares, winning player, and winning cheese, and a short end timestamp for the duel/result animation.
    - Win chance is determined by picking a random point on a bar whose green/red widths are proportional to the two powers.
    - When `round_resolution` ends, host updates points and used fighter indexes. If nobody reached 2 points, host starts the next `round_overview`; otherwise host writes `loot_reveal`.
  - Loot and completion:
    - `loot_reveal` payload contains one random fighter index from the loser’s selected team and the chosen cheese name.
    - After the loot animation window ends, host decrements loser inventory by 1 for that cheese name, increments winner inventory by 1 for that cheese name, increments both players’ `fights_played`, increments the winner’s `fights_won`, then marks the fight `completed`.
    - Because inventory is quantity-based, stealing a duplicate fighter still just moves one unit of that cheese type.
- Fight page structure and syncing:
  - Build one `/fight` page with internal subviews driven by current DB state: idle, team selection for offering, team selection for accepting, waiting for opponent, live fight, and post-fight redirect handling.
  - Add a realtime subscription for the current player’s active offer/fight rows. The page should resume correctly after refresh by loading current DB state first, then subscribing.
  - Add a small global meta-level listener so that if a fight involving the current player becomes active while they are elsewhere in the app, the app routes them to `/fight` when practical. Do not interrupt the name or choose-cheese flows.
  - Use simple fixed-duration client animations based on persisted `phase_started_at`/`phase_ends_at`. Slight delay is acceptable; the DB payload is the source of truth.
- Page-local implementation boundaries:
  - Put Supabase fight reads/writes and fight types in `src/entities/fight`.
  - Put fight selection helpers, live-state interpretation, and UI components in `src/pages/fight`.
  - Keep `Home` page composition in a dedicated `src/pages/home` folder instead of growing the current inventory page into a single file.
  - Keep reusable cheese-card presentation concerns in `src/dumb/ui`.

## Verification
- Run `npm run lint:fix` and `npm run build`.
- Validate leaderboard ordering with players who have: no completed fights, tied wins with different win rates, and tied wins/win rates.
- Validate Home shows inventory plus the three requested stats and the leaderboard link.
- Validate fight offer flow: create offer, cancel offer, recreate offer, accept offer, and failed second accept.
- Validate team selection with duplicates: a player owning three of the same cheese can select all three, but not more copies than owned.
- Validate round flow: selected fighters are never reused, first to 2 points wins, both clients see the same winner for each round, and the losing team’s random fighter is the only source of stolen cheese.
- Validate reload/resume: reloading on the fight page during `waiting_for_guest_team`, `round_overview`, `round_resolution`, and `loot_reveal` resumes the correct state from Supabase.
- Validate post-fight effects: inventory quantities change by exactly one on each side, leaderboard stats update only after completion, and both players can return to idle fight state afterward.

## Assumptions and Defaults
- The first-place `Cheese Mogul` badge stays on the leaderboard because it is still part of the leaderboard itself.
- `winRate` is derived from completed fights only and rounded to a whole percent in the UI.
- The host/offering player is the sole coordinator for fight progression because it is the simplest prototype approach with the least client-to-client conflict.
- If the host disappears mid-fight, the fight may stall; that is acceptable for this prototype.
- Existing inventory storage remains quantity-based; the app fakes “individual cards” for team selection by expanding quantities client-side.
- Supabase workflow for implementation:
  - Local: `npx supabase start`, `npx supabase db reset`, `npx supabase gen types typescript --local > src/db/database.types.ts`
  - After linking the remote project: `npx supabase db push`, then regenerate linked types before shipping
