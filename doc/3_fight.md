Let's make this prototype (see @doc/0_spec.md for initial idea and context) a game about fighting with cheese.

1) remove the score function from the leaderboard page. Instead of showing a score, start tracking how many fights players won (that's the sorting of the table) and as additional column their win %. Remove the stats badges such as "unique cheese types" as well as the text on top. Give this tab a leaderboard icon and move it last on the bottom nav. Make the tab that's currently inventory the "Home" tab and there show 3 stats: games won, winrate, current placement (and a little link to leaderboard)

The big thing:
Add a 'Fight' page, accessible via the nav bottom bar.
Note: For the backend functionality here, we need actual realtime, make sure to implement in supabase accordingly.