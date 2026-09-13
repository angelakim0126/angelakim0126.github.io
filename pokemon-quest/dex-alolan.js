/* ===========================================================================
   dex-alolan.js — the Alolan forms
   ---------------------------------------------------------------------------
   Regional variants: the same Pokemon, but raised in Alola and changed by it.
   Alolan Vulpix is Ice instead of Fire, Alolan Exeggutor grew into a Dragon,
   and so on. Types, stats and abilities are the real ones.

   Two fields matter here:
     form: 'alola'  — marks it as a regional form, so it keeps its original
                      Pokedex number without pushing the original out, and
                      sorts directly behind it.
     spriteId       — PokeAPI files forms under separate ids (Alolan Rattata
                      is #19 but its picture is 10091).
   =========================================================================== */
(function () {
  "use strict";
  const m = (name, type, power) => ({ name, type, power });
  const A = (id, name, dex, spriteId, extra) =>
    Object.assign({ id, name, dex, spriteId, region: 'alola', form: 'alola' }, extra);

  window.DEX.add([
    A('rattata-alola', 'Alolan Rattata', 19, 10091, {
      types: ['Dark', 'Normal'], hp: 30, atk: 56, def: 35, spd: 72,
      abilities: ['Gluttony — it eats its berry early when it gets peckish', 'Hustle — it swings harder even if it misses more'],
      fact: 'It turned nocturnal to hide from Yungoos, so in Alola you only meet it after dark.',
      moves: [m('Tackle', 'Normal', 40), m('Bite', 'Dark', 60), m('Hyper Fang', 'Normal', 80), m('Crunch', 'Dark', 80)],
      art: { shape: 'quad', body: '#3a3a48', accent: '#22222e', belly: '#d8d0c0', ears: 'point', earTip: '#22222e', tail: 'thin', front: ['whiskers'], eyes: 'angry', mouth: 'none' }
    }),

    A('raticate-alola', 'Alolan Raticate', 20, 10092, {
      types: ['Dark', 'Normal'], hp: 75, atk: 71, def: 75, spd: 77,
      abilities: ['Gluttony — it eats its berry early when it gets peckish', 'Thick Fat — fire and ice attacks hurt it only half as much'],
      fact: 'It sends a whole gang of Rattata out to find food, then eats the best bits itself.',
      moves: [m('Bite', 'Dark', 60), m('Hyper Fang', 'Normal', 80), m('Crunch', 'Dark', 80), m('Body Slam', 'Normal', 85)],
      art: { shape: 'quad', body: '#3f3a44', accent: '#f5e8c8', belly: '#f5e8c8', ears: 'point', earTip: '#22222e', tail: 'thin', front: ['whiskers', 'fangsBig'], eyes: 'angry', mouth: 'none' }
    }),

    A('raichu-alola', 'Alolan Raichu', 26, 10100, {
      types: ['Electric', 'Psychic'], hp: 60, atk: 95, def: 68, spd: 110,
      abilities: ['Surge Surfer — it doubles its speed when the ground is electrified'],
      fact: 'It floats on its own tail like a surfboard, riding along on psychic power.',
      moves: [m('Thunder Shock', 'Electric', 40), m('Psybeam', 'Psychic', 65), m('Thunderbolt', 'Electric', 90), m('Psychic', 'Psychic', 90)],
      art: { shape: 'biped', body: '#f5a83a', accent: '#e0882a', belly: '#fff0c8', cheek: '#f5d060', ears: 'long', earTip: '#e0882a', tail: 'fan', front: ['cheeks'], eyes: 'happy', mouth: 'w' }
    }),

    A('sandshrew-alola', 'Alolan Sandshrew', 27, 10101, {
      types: ['Ice', 'Steel'], hp: 50, atk: 75, def: 63, spd: 40,
      abilities: ['Snow Cloak — it is hard to hit in a snowstorm', 'Slush Rush — it doubles its speed in hail'],
      fact: 'It moved up to the snowy mountains, and its hide froze into armour as hard as steel.',
      moves: [m('Ice Shard', 'Ice', 40), m('Metal Claw', 'Steel', 50), m('Iron Head', 'Steel', 80), m('Ice Beam', 'Ice', 90)],
      art: { shape: 'quad', body: '#a8d8f0', accent: '#7fb8d8', belly: '#f0faff', ears: 'none', tail: 'thin', back: ['plates'], eyes: 'round', mouth: 'smile' }
    }),

    A('sandslash-alola', 'Alolan Sandslash', 28, 10102, {
      types: ['Ice', 'Steel'], hp: 75, atk: 100, def: 93, spd: 65,
      abilities: ['Snow Cloak — it is hard to hit in a snowstorm', 'Slush Rush — it doubles its speed in hail'],
      fact: 'Its spikes are icicles. It skates over the snow and slices straight through drifts.',
      moves: [m('Metal Claw', 'Steel', 50), m('Iron Head', 'Steel', 80), m('Icicle Crash', 'Ice', 85), m('Blizzard', 'Ice', 110)],
      art: { shape: 'quad', body: '#7fb8e0', accent: '#f0faff', belly: '#d8f0ff', ears: 'none', tail: 'none', back: ['spikes', 'plates'], front: ['fangsBig'], eyes: 'angry', mouth: 'none' }
    }),

    A('vulpix-alola', 'Alolan Vulpix', 37, 10103, {
      types: ['Ice'], hp: 38, atk: 50, def: 53, spd: 65,
      abilities: ['Snow Cloak — it is hard to hit in a snowstorm', 'Snow Warning — it starts a hailstorm the moment it appears'],
      fact: 'It came down from the snowy peaks. Its breath is cold enough to freeze you solid.',
      moves: [m('Powder Snow', 'Ice', 40), m('Ice Shard', 'Ice', 40), m('Aurora Beam', 'Ice', 65), m('Ice Beam', 'Ice', 90)],
      art: { shape: 'quad', body: '#f2f6fa', accent: '#c8dcf0', belly: '#ffffff', ears: 'point', earTip: '#c8dcf0', tail: 'bushy', front: ['headTuft'], eyes: 'sparkle', mouth: 'smile' }
    }),

    A('ninetales-alola', 'Alolan Ninetales', 38, 10104, {
      types: ['Ice', 'Fairy'], hp: 73, atk: 81, def: 88, spd: 109,
      abilities: ['Snow Cloak — it is hard to hit in a snowstorm', 'Snow Warning — it starts a hailstorm the moment it appears'],
      fact: 'It makes ice crystals with its fur, and it guides lost climbers back down the mountain.',
      moves: [m('Ice Shard', 'Ice', 40), m('Dazzling Gleam', 'Fairy', 80), m('Ice Beam', 'Ice', 90), m('Blizzard', 'Ice', 110)],
      art: { shape: 'quad', body: '#f2f6fa', accent: '#a8d8f0', belly: '#ffffff', mane: '#d8f0ff', auraColor: '#a8d8f0', ears: 'point', earTip: '#a8d8f0', tail: 'bushy', front: ['mane'], back: ['aura'], eyes: 'sleepy', mouth: 'none' }
    }),

    A('diglett-alola', 'Alolan Diglett', 50, 10105, {
      types: ['Ground', 'Steel'], hp: 10, atk: 55, def: 38, spd: 90,
      abilities: ['Sand Veil — it is hard to hit in a sandstorm', 'Tangling Hair — its hair tangles attackers up and slows them down'],
      fact: 'The metal whiskers on its head feel everything happening around it.',
      moves: [m('Mud-Slap', 'Ground', 20), m('Metal Claw', 'Steel', 50), m('Bulldoze', 'Ground', 60), m('Dig', 'Ground', 80)],
      art: { shape: 'blob', body: '#c8a878', accent: '#8a6a48', belly: '#e8d0b0', ears: 'none', tail: 'none', front: ['quiff', 'snout'], eyes: 'happy', mouth: 'none' }
    }),

    A('dugtrio-alola', 'Alolan Dugtrio', 51, 10106, {
      types: ['Ground', 'Steel'], hp: 35, atk: 100, def: 65, spd: 110,
      abilities: ['Sand Veil — it is hard to hit in a sandstorm', 'Tangling Hair — its hair tangles attackers up and slows them down'],
      fact: 'Its long golden hair is treasured in Alola, and it will not let anyone trim it.',
      moves: [m('Metal Claw', 'Steel', 50), m('Dig', 'Ground', 80), m('Iron Head', 'Steel', 80), m('Earthquake', 'Ground', 100)],
      art: { shape: 'blob', body: '#c8a878', accent: '#f5d060', belly: '#e8d0b0', ears: 'none', tail: 'none', front: ['quiff', 'whiskers'], eyes: 'angry', mouth: 'none' }
    }),

    A('meowth-alola', 'Alolan Meowth', 52, 10107, {
      types: ['Dark'], hp: 40, atk: 50, def: 38, spd: 90,
      abilities: ['Pickup — it finds items other Pokemon drop', 'Technician — its weaker moves hit surprisingly hard'],
      fact: 'Alolan royalty spoiled it for so long that it grew proud, crafty and rather vain.',
      moves: [m('Scratch', 'Normal', 40), m('Bite', 'Dark', 60), m('Feint Attack', 'Dark', 60), m('Night Slash', 'Dark', 70)],
      art: { shape: 'quad', body: '#5a6a8a', accent: '#3f4a68', belly: '#8a9ab8', cheek: '#f5b700', ears: 'point', earTip: '#3f4a68', tail: 'curl', front: ['whiskers', 'gem'], eyes: 'smirk', mouth: 'smirk' }
    }),

    A('persian-alola', 'Alolan Persian', 53, 10108, {
      types: ['Dark'], hp: 65, atk: 75, def: 63, spd: 115,
      abilities: ['Fur Coat — its thick fur halves the damage from being hit', 'Technician — its weaker moves hit surprisingly hard'],
      fact: 'Its big round face is prized in Alola. It is so proud that it sulks if you ignore it.',
      moves: [m('Bite', 'Dark', 60), m('Night Slash', 'Dark', 70), m('Crunch', 'Dark', 80), m('Dark Pulse', 'Dark', 80)],
      art: { shape: 'quad', body: '#6a7a9a', accent: '#4a5a78', belly: '#9aaac8', cheek: '#e8434f', ears: 'point', earTip: '#4a5a78', tail: 'curl', front: ['whiskers', 'gem'], eyes: 'smirk', mouth: 'smirk' }
    }),

    A('geodude-alola', 'Alolan Geodude', 74, 10109, {
      types: ['Rock', 'Electric'], hp: 40, atk: 80, def: 65, spd: 20,
      abilities: ['Magnet Pull — steel Pokemon cannot get away from it', 'Galvanize — its normal moves turn into electric moves'],
      fact: 'Iron filings stick to its body like eyebrows, and touching it gives you a shock.',
      moves: [m('Rock Throw', 'Rock', 50), m('Spark', 'Electric', 65), m('Rock Slide', 'Rock', 75), m('Discharge', 'Electric', 80)],
      art: { shape: 'blob', body: '#6a6a7a', accent: '#3a3a48', belly: '#8a8a9a', ears: 'none', tail: 'none', front: ['plates', 'hornPair'], eyes: 'angry', mouth: 'none' }
    }),

    A('graveler-alola', 'Alolan Graveler', 75, 10110, {
      types: ['Rock', 'Electric'], hp: 55, atk: 95, def: 80, spd: 35,
      abilities: ['Magnet Pull — steel Pokemon cannot get away from it', 'Sturdy — it can never be knocked out in one hit'],
      fact: 'It eats rocks with magnetism in them, and crunching them up makes sparks fly.',
      moves: [m('Rock Throw', 'Rock', 50), m('Spark', 'Electric', 65), m('Rock Slide', 'Rock', 75), m('Thunderbolt', 'Electric', 90)],
      art: { shape: 'blob', body: '#5a5a6a', accent: '#2a2a38', belly: '#7a7a8a', ears: 'none', tail: 'none', front: ['plates', 'hornPair', 'fangsBig'], eyes: 'angry', mouth: 'none' }
    }),

    A('golem-alola', 'Alolan Golem', 76, 10111, {
      types: ['Rock', 'Electric'], hp: 80, atk: 120, def: 98, spd: 45,
      abilities: ['Magnet Pull — steel Pokemon cannot get away from it', 'Galvanize — its normal moves turn into electric moves'],
      fact: 'It launches rocks from its back like a railgun, firing them with magnetic power.',
      moves: [m('Rock Slide', 'Rock', 75), m('Thunder Punch', 'Electric', 75), m('Wild Charge', 'Electric', 90), m('Stone Edge', 'Rock', 100)],
      art: { shape: 'bigblob', body: '#5a5a6a', accent: '#2a2a38', belly: '#7a7a8a', ears: 'none', tail: 'none', back: ['plates'], front: ['hornPair', 'fangsBig'], eyes: 'angry', mouth: 'none' }
    }),

    A('grimer-alola', 'Alolan Grimer', 88, 10112, {
      types: ['Poison', 'Dark'], hp: 80, atk: 80, def: 50, spd: 25,
      abilities: ['Poison Touch — touching it can poison you', 'Gluttony — it eats its berry early when it gets peckish'],
      fact: 'It was brought to Alola to eat the rubbish, and the crystals on it are hardened toxins.',
      moves: [m('Poison Sting', 'Poison', 40), m('Bite', 'Dark', 60), m('Sludge', 'Poison', 65), m('Crunch', 'Dark', 80)],
      art: { shape: 'blob', body: '#3f7f5a', accent: '#f5d060', belly: '#5f9f7a', ears: 'none', tail: 'none', front: ['jawTeeth'], eyes: 'angry', mouth: 'open' }
    }),

    A('muk-alola', 'Alolan Muk', 89, 10113, {
      types: ['Poison', 'Dark'], hp: 105, atk: 105, def: 88, spd: 50,
      abilities: ['Poison Touch — touching it can poison you', 'Power of Alchemy — it borrows the ability of a fallen team-mate'],
      fact: 'Its colours keep changing as it eats, and it gets grumpy and bitey when it is hungry.',
      moves: [m('Bite', 'Dark', 60), m('Crunch', 'Dark', 80), m('Sludge Bomb', 'Poison', 90), m('Gunk Shot', 'Poison', 120)],
      art: { shape: 'blob', body: '#6a4a9a', accent: '#f5d060', belly: '#3f9f7a', ears: 'none', tail: 'none', front: ['jawTeeth', 'fangsBig'], eyes: 'angry', mouth: 'open' }
    }),

    A('marowak-alola', 'Alolan Marowak', 105, 10115, {
      types: ['Fire', 'Ghost'], hp: 60, atk: 80, def: 95, spd: 45,
      abilities: ['Cursed Body — the move that hits it might break', 'Lightning Rod — it soaks up electric attacks instead of being hurt'],
      fact: 'It dances with a burning bone to calm the spirits of friends it has lost.',
      moves: [m('Bone Club', 'Ground', 65), m('Flame Wheel', 'Fire', 60), m('Shadow Bone', 'Ghost', 85), m('Flare Blitz', 'Fire', 120)],
      art: { shape: 'biped', body: '#8a7a6a', accent: '#e8553a', belly: '#d8c8b0', ears: 'none', tail: 'thin', back: ['backFlames'], front: ['mask'], eyes: 'angry', mouth: 'none' }
    }),

    A('exeggutor-alola', 'Alolan Exeggutor', 103, 10114, {
      types: ['Grass', 'Dragon'], hp: 95, atk: 125, def: 80, spd: 45,
      abilities: ['Frisk — it can see what the other Pokemon is holding', 'Harvest — it grows its berry back after eating it'],
      fact: 'Alola\'s fierce sunshine made it grow enormously tall — and gave its tail a mind of its own.',
      moves: [m('Seed Bomb', 'Grass', 80), m('Psyshock', 'Psychic', 80), m('Dragon Hammer', 'Dragon', 90), m('Wood Hammer', 'Grass', 120)],
      art: { shape: 'biped', body: '#d8b070', accent: '#a88850', belly: '#e8c890', ears: 'none', tail: 'thin', front: ['headLeaf'], eyes: 'happy', mouth: 'smile' }
    })
  ]);

  /* How the Alolan ones evolve. Pikachu becomes Alolan Raichu in Alola,
     and Cubone/Exeggcute become the Alolan forms there too. */
  window.DEX.addChains([
    ['rattata-alola', 'raticate-alola'],
    ['pikachu', 'raichu-alola'],
    ['sandshrew-alola', 'sandslash-alola'],
    ['vulpix-alola', 'ninetales-alola'],
    ['diglett-alola', 'dugtrio-alola'],
    ['meowth-alola', 'persian-alola'],
    ['geodude-alola', 'graveler-alola', 'golem-alola'],
    ['grimer-alola', 'muk-alola'],
    ['cubone', 'marowak-alola'],
    ['exeggcute', 'exeggutor-alola']
  ]);
})();
