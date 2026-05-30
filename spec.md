STICK TO @agents.md!!!!!!!!

Let's build a gamejam style prototype for a cheese "card" trading game.

This vue+daisy+tailwind+lucide skeleton is taken over from another project, you may need to remove some garbage.

The core point of the game is that anyone can access this game in the web, give their nickname, and start getting, trading and selling cheese, with a global scoreboard.

Note that this is just a fun proof of concept between friends.
As such, database security, data security, fairness, and millisecond sync issues, low-stakes data overwrites, etc., DO NOT MATTER.
Use the simplest possible implementation.

The multiplayer data should be hosted in supabase.
Follow best practices to sync a supabase with local development.
I do not want to manually click around in supabase if it can be avoided.
The supabase project is added, tell me which commands to run when to hook it up; local CLI is also installed.

I will describe the game in screens.

### Name Screen

The first screen a new player sees.
Says "You're about to enter the race to become the Cheese Mogul. What should we call you?" And then a "your name" input field, and a "confirm" button.

This name must be unique (check supase).
It is saved in localstorage on device, and this is the "auth" (remember: game jam prototype!!).
If a player hard refreshes their browser, tough luck.
My intuition is that this is so stupid that we will want to put this info into a simple vanilla db table instead of hacking it into supabase's auth system, but you decide.

### Choose Cheese

Next, the player enters a special flow to build their initial inventory.
3 times (have a little progress bar, double check that you get daisy progress bars (CURRENT DAISY!!) formatted correctly) they get a simple choice "Which cheese do you want?" with two cheeses randomly chosen, and they can tab on one, which is added to their inventory.

Cheese should be displayed as an image card, with the cheese name, and in very small font if needed license stuff like "image from Wikipedia contributors", linking to the correct image.

Source of truth for the generally available cheeses is @src/db/cheeses.json.

We also, at this point, start showing the top bar and give the player an initial currency value (cows) of 100 cows.

### Leaderboard

After choose-cheese, we redirect to the leaderboard page.
Here, we show all signed up players (no pagination needed, it's not that many players) and their score (explained below).
The top player gets a badge `Cheese Mogul`. The position of the signed-in player is highlighted.
Above this tabular view, we say
"You are 57th. You probably want to buy more cheese:" (or whichever position). Below that, we link to the marketplace and the trader.

### Stats

One of the pages available via the bottom nav.
It should show some stats, and how these are calculated into the final score.

- Number of cheeses (x1 in the score)
- Number of unique types of cheese (x5 in the score)

### Inventory

### Trader

This is an "NPC" buying and selling cheese, for a whole-number price of cows.
The view should have a filter/search bar on top (to filter the list of cheeses).
Then, every existing type of cheese should be listed, with name and little pictures.

For each, there should be a buy and a sell button with a number (price) and the cow symbol

- If the player does not have this type of cheese, grey out the 'sell' button
- Store the trader prices in supabase of course, but simply fill/refresh whenever relevant FROM THE FRONTEND, if a random player visits (again, prototype. no cron jobs.)
    - Initially, set a `buy` price (=the players from the computer) between 3 and 100. Use a log scale and random picking, so `3` is very common and `100` is exceedingly rare. Then, set the `sell` price (=the players sells to the computer). Randomly pick it between `buy price minus two` and 1. Whole numbers only.
    - Every minute (again, when a player visits, check if refresh is warranted) move all prices randomly between +3 and -3 (whole numbers). Make sure everything is 1 or above always, and that `sell` is always clamped at two less than `buy` (lower is fine of course)

## Global UI

- We want a global top bar, showing the user's name, their money (with the @src/assets/cow.svg as currency icon) and the number of cheeses they have
- We want a global bottom bar, with icon-only nav buttons leading to: home, inventory, offers, marketplace, trader, wheel, score

## Various

- Force a light theme
- Keep the UI simple. Do NOT!!!!!!!! add extraneous wrapper or cute copy I didn't ask for or fancy UI features I didn't asked for
- Optimize for smartphone portrait format, everything else is very secondary
- Install and use vue-router for page routing
- STICK TO @agents.md!!!!!!!!
- Add a daisy-based toast system and use this liberally to give MEANINGFUL feedback to the player, e.g. "1 Edamer sold for 34" or "Order cancelled" etc.