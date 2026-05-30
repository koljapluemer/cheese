Let's build the lucky wheel tab.

Here, every 10 minutes (global time like 10:10AM, 10:20AM, etc; not need to be secure or precise, see @doc/0_spec.md for context and project vibes), the player can spin a random wheel with a random outcome.
So we either see the wheel, and a big spin button which we can press, or a timer like "Spin again in 4:32" (counting down).
Outcome should be randomized and wheel should actually be animated to spin, but it ofc doesn't need to be an actual physics simulation. It also doesn't need to be super secure or whatever (early prototype).

The wheel should be a randomized pie chart:

- get the 10 most expensive cheeses, as by last bought from trader or currently available from trader
- 5% or 10% outcome for a cheese from this top 10
- another 5% or 10% outcome for another cheese from this top 10
- 5% or 10% for an amount of cows randomly chosen between 25 and 100, chosen in steps from 5
- 5% chance to destroy one cheese from inventory
- fill the rest with chance to win the cheese that's currently available form the trader for the lowest price

Use toast system for outcomes.
Stick to @agents.md.
For the cheese outcomes, just show a small thumbnail image of the cheese on the wheel.