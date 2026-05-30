Let's make the trader a bit more interesting:

- as the first ui element below "Trader", show when new offers will come in, with a m:ss countdown (interval should be two minutes). If it's run to 0:00, show a refresh icon button. This should either run the actual refresh or fetch inventory from the server (see @doc/0_spec.md for context on our lazy refresh)
- limit the trader's inventory to 10 randomly chosen cheeses.
- Whenever any player buys a cheese from the trader, raise the `buy` price by one. With a chance of 50%, also raise the `sell` price.
- Whenever any player sells a cheese to the trader, lower `sell` price by one. With a chance of 50%, also lower the `buy` price.
- Make sure `sell` price is capped as to be at least two lower than `buy`, and that `sell` never falls below 1