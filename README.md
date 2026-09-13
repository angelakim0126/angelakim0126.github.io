# angelakim0126.github.io

User-level GitHub Pages site — serves at https://angelakim0126.github.io/

Landing page for personal projects I've built with Claude for my kids:

- 🎨 [Wings of Fire Coloring](https://angelakim0126.github.io/wings-of-fire-coloring/) — for Iris
- 🐉 [Dragon Math Quest](https://angelakim0126.github.io/dragon-math-quest/) — for Iris
- 🦄 [Iris's Pi Quest](https://angelakim0126.github.io/pi-iris/) — for Iris
- 🦁 [Lion King Math Quest](https://angelakim0126.github.io/lion-king-math/) — for Iris
- ⌨️ [Isa's Typing Quest](https://angelakim0126.github.io/typing-quest/) — for Iris (touch-typing practice, starring her dragon Isa)
- π [Pi Digits Challenge](https://angelakim0126.github.io/pi/) — for George
- 🔴 [Iris's Secret Pokemon Quest](https://angelakim0126.github.io/pokemon-quest/) — for Iris (learn → quiz → battle, all 1025 Pokemon)

### Iris's Secret Pokemon Quest

Linked from the landing page, and gated by a secret word that it asks for on every load.
(It started out unlinked, on the grounds that Iris wanted it secret from her brother — she
asked for the card later. He can see the card exists; he just can't get in.)

- Secret word: `Dratini` (case doesn't matter). Stored only as a scrambled hash in
  `pokemon-quest/game.js`, so it isn't sitting in the source in plain text.
- Mom's spare key, if she ever forgets it: `momrules`.
- She can change her own word from the "Change my secret word" link on the home screen.
- It's a friendly lock, not real security — anyone determined could read the code. It's there
  to keep a little brother out.

Pictures come from PokeAPI's official-artwork sprites, with hand-drawn SVG fallbacks
(`pokemon-quest/art.js`) that appear automatically if there's no internet.

**Where the Pokemon data comes from**

- `pokedex.js` + `dex-more-*.js` — 166 hand-written entries with abilities and facts in
  kid language, and proper hand-drawn art. These take priority.
- `dex-all.js` — generated, all 1025 Pokemon so there are no gaps in the numbers.
  Don't hand-edit it. Regenerate with `node pokemon-quest/fetch-dex.js`, which pulls
  stats, types, abilities, Pokedex text, learnsets and evolution lines from PokeAPI
  (responses are cached under the scratch dir, so re-runs are cheap).
