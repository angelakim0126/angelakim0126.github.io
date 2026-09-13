/* ===========================================================================
   pokedex.js — regions, types, the type-matchup chart, and the roster
   ---------------------------------------------------------------------------
   Every entry has:
     id / name / region / types / dex        — who they are
     hp / atk / def / spd                    — battle numbers
     abilities[]                             — the passive powers you "learn"
     fact                                    — one thing to remember
     moves[]                                 — the four powers you attack with
     art{}                                   — drawing recipe for art.js
   =========================================================================== */
window.DEX = (function () {
  "use strict";

  const REGIONS = [
    { id: 'kanto',  name: 'Kanto',  emoji: '🏙️', color: '#f7d02c' },
    { id: 'johto',  name: 'Johto',  emoji: '🎏', color: '#a0d8a0' },
    { id: 'hoenn',  name: 'Hoenn',  emoji: '🌊', color: '#6390f0' },
    { id: 'sinnoh', name: 'Sinnoh', emoji: '⛰️', color: '#b8b8d8' },
    { id: 'unova',  name: 'Unova',  emoji: '🌉', color: '#d8a0c8' },
    { id: 'kalos',  name: 'Kalos',  emoji: '🗼', color: '#f0a0b8' },
    { id: 'alola',  name: 'Alola',  emoji: '🌺', color: '#f7b060' },
    { id: 'galar',  name: 'Galar',  emoji: '🏰', color: '#9bb0d8' },
    { id: 'paldea', name: 'Paldea', emoji: '🍊', color: '#f0c060' }
  ];

  const TYPE_COLOR = {
    Normal: '#a8a77a', Fire: '#ee8130', Water: '#6390f0', Electric: '#e8c018',
    Grass: '#7ac74c', Ice: '#7fcfcc', Fighting: '#c22e28', Poison: '#a33ea1',
    Ground: '#d6ac4f', Flying: '#a98ff3', Psychic: '#f95587', Bug: '#98a818',
    Rock: '#a89430', Ghost: '#735797', Dragon: '#6f35fc', Dark: '#6b5346',
    Steel: '#8f8fa8', Fairy: '#d685ad'
  };

  /* Attacking type -> what it is strong / weak / useless against */
  const CHART = {
    Normal:   { x2: [],                                         half: ['Rock', 'Steel'],                                                        zero: ['Ghost'] },
    Fire:     { x2: ['Grass', 'Ice', 'Bug', 'Steel'],            half: ['Fire', 'Water', 'Rock', 'Dragon'],                                     zero: [] },
    Water:    { x2: ['Fire', 'Ground', 'Rock'],                  half: ['Water', 'Grass', 'Dragon'],                                            zero: [] },
    Electric: { x2: ['Water', 'Flying'],                         half: ['Electric', 'Grass', 'Dragon'],                                         zero: ['Ground'] },
    Grass:    { x2: ['Water', 'Ground', 'Rock'],                 half: ['Fire', 'Grass', 'Poison', 'Flying', 'Bug', 'Dragon', 'Steel'],         zero: [] },
    Ice:      { x2: ['Grass', 'Ground', 'Flying', 'Dragon'],     half: ['Fire', 'Water', 'Ice', 'Steel'],                                       zero: [] },
    Fighting: { x2: ['Normal', 'Ice', 'Rock', 'Dark', 'Steel'],  half: ['Poison', 'Flying', 'Psychic', 'Bug', 'Fairy'],                         zero: ['Ghost'] },
    Poison:   { x2: ['Grass', 'Fairy'],                          half: ['Poison', 'Ground', 'Rock', 'Ghost'],                                   zero: ['Steel'] },
    Ground:   { x2: ['Fire', 'Electric', 'Poison', 'Rock', 'Steel'], half: ['Grass', 'Bug'],                                                    zero: ['Flying'] },
    Flying:   { x2: ['Grass', 'Fighting', 'Bug'],                half: ['Electric', 'Rock', 'Steel'],                                           zero: [] },
    Psychic:  { x2: ['Fighting', 'Poison'],                      half: ['Psychic', 'Steel'],                                                    zero: ['Dark'] },
    Bug:      { x2: ['Grass', 'Psychic', 'Dark'],                half: ['Fire', 'Fighting', 'Poison', 'Flying', 'Ghost', 'Steel', 'Fairy'],     zero: [] },
    Rock:     { x2: ['Fire', 'Ice', 'Flying', 'Bug'],            half: ['Fighting', 'Ground', 'Steel'],                                         zero: [] },
    Ghost:    { x2: ['Psychic', 'Ghost'],                        half: ['Dark'],                                                                zero: ['Normal'] },
    Dragon:   { x2: ['Dragon'],                                  half: ['Steel'],                                                               zero: ['Fairy'] },
    Dark:     { x2: ['Psychic', 'Ghost'],                        half: ['Fighting', 'Dark', 'Fairy'],                                           zero: [] },
    Steel:    { x2: ['Ice', 'Rock', 'Fairy'],                    half: ['Fire', 'Water', 'Electric', 'Steel'],                                  zero: [] },
    Fairy:    { x2: ['Fighting', 'Dragon', 'Dark'],              half: ['Fire', 'Poison', 'Steel'],                                             zero: [] }
  };

  /* How much damage does `atkType` do to a critter with `defTypes`? */
  function effectiveness(atkType, defTypes) {
    const c = CHART[atkType];
    if (!c) return 1;
    let mult = 1;
    defTypes.forEach(t => {
      if (c.zero.indexOf(t) >= 0) mult *= 0;
      else if (c.x2.indexOf(t) >= 0) mult *= 2;
      else if (c.half.indexOf(t) >= 0) mult *= 0.5;
    });
    return mult;
  }

  /* ---------- shorthand so the roster below stays readable ---------- */
  const m = (name, type, power) => ({ name, type, power });

  const POKEMON = [
    /* ======================= KANTO ======================= */
    { id: 'pikachu', name: 'Pikachu', region: 'kanto', dex: 25, types: ['Electric'],
      hp: 60, atk: 55, def: 40, spd: 90,
      abilities: ['Static — anyone who touches it might get zapped', 'Lightning Rod — it soaks up electric attacks instead of being hurt'],
      fact: 'It stores electricity in the little pouches in its cheeks.',
      moves: [m('Thunder Shock', 'Electric', 40), m('Quick Attack', 'Normal', 40), m('Iron Tail', 'Steel', 75), m('Thunderbolt', 'Electric', 85)],
      art: { shape: 'biped', body: '#f7d02c', accent: '#e0a600', belly: '#ffe97a', cheek: '#ef6b63', ears: 'point', earTip: '#2b2b3a', tail: 'zigzag', front: ['cheeks'], eyes: 'round', mouth: 'w' } },

    { id: 'charmander', name: 'Charmander', region: 'kanto', dex: 4, types: ['Fire'],
      hp: 58, atk: 60, def: 45, spd: 70,
      abilities: ['Blaze — when it is hurt, its fire moves get stronger', 'Solar Power — sunshine makes its attacks fiercer'],
      fact: 'The flame on its tail shows how it feels — it flickers when it is sad.',
      moves: [m('Ember', 'Fire', 40), m('Scratch', 'Normal', 40), m('Dragon Breath', 'Dragon', 60), m('Flamethrower', 'Fire', 85)],
      art: { shape: 'biped', body: '#f0863a', accent: '#d06a25', belly: '#ffd6a0', ears: 'none', tail: 'flame', eyes: 'round', mouth: 'smile' } },

    { id: 'squirtle', name: 'Squirtle', region: 'kanto', dex: 7, types: ['Water'],
      hp: 62, atk: 50, def: 70, spd: 55,
      abilities: ['Torrent — when it is hurt, its water moves get stronger', 'Rain Dish — rain slowly heals it'],
      fact: 'It hides in its shell and shoots water from its mouth with amazing aim.',
      moves: [m('Water Gun', 'Water', 40), m('Tackle', 'Normal', 40), m('Bite', 'Dark', 60), m('Aqua Tail', 'Water', 80)],
      art: { shape: 'biped', body: '#8ecfe8', accent: '#6bb0d0', belly: '#f7e9b0', shell: '#b0742f', shell2: '#e0a860', ears: 'none', tail: 'curl', back: ['shell'], eyes: 'round', mouth: 'smile' } },

    { id: 'bulbasaur', name: 'Bulbasaur', region: 'kanto', dex: 1, types: ['Grass', 'Poison'],
      hp: 65, atk: 55, def: 55, spd: 50,
      abilities: ['Overgrow — when it is hurt, its grass moves get stronger', 'Chlorophyll — sunshine makes it super speedy'],
      fact: 'The seed on its back grows bigger by drinking sunlight.',
      moves: [m('Vine Whip', 'Grass', 45), m('Tackle', 'Normal', 40), m('Seed Bomb', 'Grass', 80), m('Take Down', 'Normal', 75)],
      art: { shape: 'quad', body: '#8fd4b0', accent: '#5fae8c', belly: '#cdf0da', ears: 'none', tail: 'none', back: ['bulb'], front: ['spots'], eyes: 'round', mouth: 'smile' } },

    { id: 'eevee', name: 'Eevee', region: 'kanto', dex: 133, types: ['Normal'],
      hp: 60, atk: 55, def: 50, spd: 60,
      abilities: ['Adaptability — its normal-type moves hit extra hard', 'Run Away — it can always escape a battle'],
      fact: 'Its body can change in many different directions — it has the most evolutions of all.',
      moves: [m('Tackle', 'Normal', 40), m('Quick Attack', 'Normal', 40), m('Bite', 'Dark', 60), m('Swift', 'Normal', 65)],
      art: { shape: 'quad', body: '#c9a267', accent: '#a87d45', belly: '#f5e7c8', ears: 'point', earTip: '#a87d45', tail: 'bushy', eyes: 'sparkle', mouth: 'smile' } },

    { id: 'jigglypuff', name: 'Jigglypuff', region: 'kanto', dex: 39, types: ['Normal', 'Fairy'],
      hp: 80, atk: 45, def: 30, spd: 35,
      abilities: ['Cute Charm — attackers can fall in love and freeze up', 'Competitive — being teased makes it try harder'],
      fact: 'It sings a lullaby until everyone listening falls fast asleep.',
      moves: [m('Pound', 'Normal', 40), m('Double Slap', 'Normal', 45), m('Dazzling Gleam', 'Fairy', 80), m('Play Rough', 'Fairy', 70)],
      art: { shape: 'blob', body: '#f7b8d0', accent: '#eb9cbb', belly: '#ffd9e8', ears: 'none', tail: 'none', front: ['curl'], eyes: 'big', mouth: 'smile' } },

    { id: 'dratini', name: 'Dratini', region: 'kanto', dex: 147, types: ['Dragon'],
      hp: 58, atk: 60, def: 45, spd: 50,
      abilities: ['Shed Skin — it can shed its skin to heal itself', 'Marvel Scale — its scales harden when it feels ill'],
      fact: 'Hardly anyone ever sees one — it was called a mirage Pokemon for years.',
      moves: [m('Twister', 'Dragon', 40), m('Slam', 'Normal', 70), m('Aqua Tail', 'Water', 80), m('Dragon Rush', 'Dragon', 95)],
      art: { shape: 'serpent', body: '#a8d8f0', accent: '#7fbde0', belly: '#ffffff', cheek: '#ef6b63', ears: 'fin', earTip: '#ffffff', tail: 'none', front: ['gem'], eyes: 'sparkle', mouth: 'smile' } },

    /* ======================= JOHTO ======================= */
    { id: 'chikorita', name: 'Chikorita', region: 'johto', dex: 152, types: ['Grass'],
      hp: 62, atk: 50, def: 60, spd: 48,
      abilities: ['Overgrow — when it is hurt, its grass moves get stronger', 'Leaf Guard — sunshine keeps it from getting sick'],
      fact: 'The leaf on its head gives off a sweet smell that calms everyone down.',
      moves: [m('Tackle', 'Normal', 40), m('Razor Leaf', 'Grass', 55), m('Magical Leaf', 'Grass', 60), m('Body Slam', 'Normal', 85)],
      art: { shape: 'quad', body: '#a8e6a0', accent: '#7fc87f', belly: '#d8f5cc', ears: 'none', tail: 'none', front: ['headLeaf'], eyes: 'happy', mouth: 'smile' } },

    { id: 'cyndaquil', name: 'Cyndaquil', region: 'johto', dex: 155, types: ['Fire'],
      hp: 58, atk: 58, def: 45, spd: 65,
      abilities: ['Blaze — when it is hurt, its fire moves get stronger', 'Flash Fire — fire attacks make it stronger, not weaker'],
      fact: 'It is timid, and when it gets startled the flames on its back shoot up.',
      moves: [m('Ember', 'Fire', 40), m('Quick Attack', 'Normal', 40), m('Flame Wheel', 'Fire', 60), m('Flamethrower', 'Fire', 85)],
      art: { shape: 'quad', body: '#3f6fa8', accent: '#2f5688', belly: '#f5e0a8', ears: 'none', tail: 'thin', back: ['backFlames'], eyes: 'sleepy', mouth: 'smile' } },

    { id: 'totodile', name: 'Totodile', region: 'johto', dex: 158, types: ['Water'],
      hp: 60, atk: 65, def: 52, spd: 48,
      abilities: ['Torrent — when it is hurt, its water moves get stronger', 'Sheer Force — it ignores luck and just hits harder'],
      fact: 'It nips at anything that moves — not meanly, it just likes to chomp.',
      moves: [m('Water Gun', 'Water', 40), m('Bite', 'Dark', 60), m('Aqua Jet', 'Water', 60), m('Crunch', 'Dark', 80)],
      art: { shape: 'biped', body: '#4fb8e8', accent: '#2f96c8', belly: '#f5d76e', ears: 'none', tail: 'thin', back: ['spikes'], front: ['jawTeeth'], eyes: 'round', mouth: 'open' } },

    { id: 'marill', name: 'Marill', region: 'johto', dex: 183, types: ['Water', 'Fairy'],
      hp: 70, atk: 45, def: 50, spd: 40,
      abilities: ['Thick Fat — fire and ice attacks hurt it only half as much', 'Huge Power — its little arms are twice as strong as they look'],
      fact: 'The ball on its tail floats, so it never sinks while swimming.',
      moves: [m('Water Gun', 'Water', 40), m('Tackle', 'Normal', 40), m('Bubble Beam', 'Water', 65), m('Play Rough', 'Fairy', 70)],
      art: { shape: 'blob', body: '#7fd0f0', accent: '#5fb0d8', belly: '#ffffff', ears: 'round', earTip: '#ffffff', tail: 'swirl', eyes: 'round', mouth: 'smile' } },

    { id: 'togepi', name: 'Togepi', region: 'johto', dex: 175, types: ['Fairy'],
      hp: 60, atk: 40, def: 62, spd: 30,
      abilities: ['Serene Grace — lucky things happen twice as often for it', 'Hustle — it swings harder even if it misses more'],
      fact: 'It is filled with happiness, and it shares that luck with kind people.',
      moves: [m('Pound', 'Normal', 40), m('Fairy Wind', 'Fairy', 40), m('Zen Headbutt', 'Psychic', 75), m('Dazzling Gleam', 'Fairy', 80)],
      art: { shape: 'blob', body: '#fff6d8', accent: '#f0e0b0', belly: '#fffdf0', cheek: '#ef6b63', ears: 'none', tail: 'none', front: ['eggShell'], eyes: 'happy', mouth: 'smile' } },

    { id: 'umbreon', name: 'Umbreon', region: 'johto', dex: 197, types: ['Dark'],
      hp: 70, atk: 55, def: 85, spd: 60,
      abilities: ['Synchronize — whatever bad thing happens to it happens to the attacker too', 'Inner Focus — it never flinches'],
      fact: 'It evolved from Eevee under moonlight, and its rings glow in the dark.',
      moves: [m('Bite', 'Dark', 60), m('Quick Attack', 'Normal', 40), m('Crunch', 'Dark', 80), m('Shadow Ball', 'Ghost', 80)],
      art: { shape: 'quad', body: '#3b3a5c', accent: '#2a2942', belly: '#4a4870', cheek: '#f7d02c', ears: 'point', earTip: '#2a2942', tail: 'thin', front: ['rings'], eyes: 'round', mouth: 'none' } },

    /* ======================= HOENN ======================= */
    { id: 'treecko', name: 'Treecko', region: 'hoenn', dex: 252, types: ['Grass'],
      hp: 55, atk: 58, def: 45, spd: 78,
      abilities: ['Overgrow — when it is hurt, its grass moves get stronger', 'Unburden — it gets twice as fast once it drops its item'],
      fact: 'Tiny hooks on its feet let it walk straight up walls and ceilings.',
      moves: [m('Pound', 'Normal', 40), m('Absorb', 'Grass', 40), m('Quick Attack', 'Normal', 40), m('Leaf Blade', 'Grass', 90)],
      art: { shape: 'biped', body: '#7ec87e', accent: '#5ba85b', belly: '#f08080', ears: 'none', tail: 'fan', eyes: 'smirk', mouth: 'smirk' } },

    { id: 'torchic', name: 'Torchic', region: 'hoenn', dex: 255, types: ['Fire'],
      hp: 58, atk: 60, def: 40, spd: 45,
      abilities: ['Blaze — when it is hurt, its fire moves get stronger', 'Speed Boost — it gets faster every single turn'],
      fact: 'There is a fire inside its belly, so cuddling one feels wonderfully warm.',
      moves: [m('Scratch', 'Normal', 40), m('Ember', 'Fire', 40), m('Flame Charge', 'Fire', 50), m('Fire Blast', 'Fire', 90)],
      art: { shape: 'bird', body: '#f7a83a', accent: '#f0772b', belly: '#ffd9a0', beak: '#f0c040', ears: 'none', tail: 'fan', front: ['beak', 'headTuft'], eyes: 'round', mouth: 'none' } },

    { id: 'mudkip', name: 'Mudkip', region: 'hoenn', dex: 258, types: ['Water'],
      hp: 62, atk: 62, def: 50, spd: 42,
      abilities: ['Torrent — when it is hurt, its water moves get stronger', 'Damp — it soaks the ground so explosions cannot happen'],
      fact: 'The fin on its head senses movement in the water and even in the air.',
      moves: [m('Water Gun', 'Water', 40), m('Tackle', 'Normal', 40), m('Mud Shot', 'Ground', 55), m('Surf', 'Water', 90)],
      art: { shape: 'quad', body: '#86d0e8', accent: '#5fb0cf', belly: '#d8f0f5', cheek: '#f0772b', ears: 'none', tail: 'fan', front: ['cheekFins'], eyes: 'happy', mouth: 'smile' } },

    { id: 'ralts', name: 'Ralts', region: 'hoenn', dex: 280, types: ['Psychic', 'Fairy'],
      hp: 52, atk: 45, def: 40, spd: 50,
      abilities: ['Synchronize — it shares whatever it is feeling with everyone nearby', 'Trace — it copies the ability of the Pokemon it is facing'],
      fact: 'It senses feelings with the horns on its head and hides if someone feels mean.',
      moves: [m('Confusion', 'Psychic', 50), m('Pound', 'Normal', 40), m('Dazzling Gleam', 'Fairy', 80), m('Psychic', 'Psychic', 90)],
      art: { shape: 'biped', body: '#f4f4f8', accent: '#dcdce6', belly: '#ffffff', cheek: '#ef6b63', ears: 'leaf', earTip: '#7ec87e', tail: 'none', front: ['gem'], eyes: 'sleepy', mouth: 'none' } },

    { id: 'skitty', name: 'Skitty', region: 'hoenn', dex: 300, types: ['Normal'],
      hp: 58, atk: 48, def: 42, spd: 55,
      abilities: ['Cute Charm — attackers can fall in love and freeze up', 'Normalize — every single move it uses becomes normal type'],
      fact: 'It chases its own tail in circles until it makes itself dizzy.',
      moves: [m('Tackle', 'Normal', 40), m('Double Slap', 'Normal', 45), m('Play Rough', 'Fairy', 70), m('Body Slam', 'Normal', 85)],
      art: { shape: 'quad', body: '#f7c0c8', accent: '#f09ba8', belly: '#ffffff', ears: 'point', earTip: '#f09ba8', tail: 'bushy', front: ['whiskers'], eyes: 'happy', mouth: 'smile' } },

    { id: 'absol', name: 'Absol', region: 'hoenn', dex: 359, types: ['Dark'],
      hp: 65, atk: 85, def: 50, spd: 75,
      abilities: ['Pressure — the Pokemon facing it gets tired faster', 'Super Luck — it lands critical hits much more often'],
      fact: 'It can feel disasters coming and appears to warn people — so people blame it unfairly.',
      moves: [m('Scratch', 'Normal', 40), m('Bite', 'Dark', 60), m('Psycho Cut', 'Psychic', 70), m('Night Slash', 'Dark', 75)],
      art: { shape: 'quad', body: '#f0f0f5', accent: '#4a4a66', belly: '#dcdce8', ears: 'point', earTip: '#4a4a66', tail: 'curl', front: ['hornSingle'], eyes: 'round', mouth: 'none' } },

    /* ======================= SINNOH ======================= */
    { id: 'turtwig', name: 'Turtwig', region: 'sinnoh', dex: 387, types: ['Grass'],
      hp: 66, atk: 60, def: 68, spd: 35,
      abilities: ['Overgrow — when it is hurt, its grass moves get stronger', 'Shell Armor — it can never be hit by a critical hit'],
      fact: 'Its shell is made of soil, and the soil gets harder when it drinks water.',
      moves: [m('Tackle', 'Normal', 40), m('Razor Leaf', 'Grass', 55), m('Bite', 'Dark', 60), m('Seed Bomb', 'Grass', 80)],
      art: { shape: 'quad', body: '#a8d878', accent: '#88b858', belly: '#f5e0a8', shell: '#9a7a4a', shell2: '#c8a868', ears: 'none', tail: 'none', back: ['shell'], front: ['headLeaf'], eyes: 'round', mouth: 'smile' } },

    { id: 'chimchar', name: 'Chimchar', region: 'sinnoh', dex: 390, types: ['Fire'],
      hp: 56, atk: 58, def: 44, spd: 61,
      abilities: ['Blaze — when it is hurt, its fire moves get stronger', 'Iron Fist — all its punching moves hit harder'],
      fact: 'It burns gas in its belly to make the flame on its behind — rain never puts it out.',
      moves: [m('Scratch', 'Normal', 40), m('Ember', 'Fire', 40), m('Flame Wheel', 'Fire', 60), m('Flamethrower', 'Fire', 85)],
      art: { shape: 'biped', body: '#e8a85c', accent: '#c08540', belly: '#f5d0a0', ears: 'round', earTip: '#c08540', tail: 'flame', eyes: 'happy', mouth: 'smile' } },

    { id: 'piplup', name: 'Piplup', region: 'sinnoh', dex: 393, types: ['Water'],
      hp: 60, atk: 52, def: 53, spd: 40,
      abilities: ['Torrent — when it is hurt, its water moves get stronger', 'Defiant — being pushed around makes it attack harder'],
      fact: 'It is very proud and hates being taken care of, even when it needs help.',
      moves: [m('Pound', 'Normal', 40), m('Bubble Beam', 'Water', 65), m('Drill Peck', 'Flying', 80), m('Surf', 'Water', 90)],
      art: { shape: 'bird', body: '#4fa8e0', accent: '#2f80b8', belly: '#ffffff', beak: '#f0c040', ears: 'none', tail: 'fan', front: ['beak'], eyes: 'round', mouth: 'none' } },

    { id: 'shinx', name: 'Shinx', region: 'sinnoh', dex: 403, types: ['Electric'],
      hp: 58, atk: 60, def: 44, spd: 55,
      abilities: ['Rivalry — it fights harder against Pokemon of the same gender', 'Intimidate — it scares the other Pokemon into hitting softer'],
      fact: 'Its fur makes electricity when its muscles flex — it blinks to blind enemies and run.',
      moves: [m('Tackle', 'Normal', 40), m('Spark', 'Electric', 65), m('Bite', 'Dark', 60), m('Wild Charge', 'Electric', 90)],
      art: { shape: 'quad', body: '#4a78c8', accent: '#2f5ba8', belly: '#7ba0e0', ears: 'point', earTip: '#f7d02c', tail: 'star', eyes: 'round', mouth: 'none' } },

    { id: 'buneary', name: 'Buneary', region: 'sinnoh', dex: 427, types: ['Normal'],
      hp: 55, atk: 58, def: 45, spd: 80,
      abilities: ['Run Away — it can always escape a battle', 'Klutz — it is too clumsy to use held items'],
      fact: 'It rolls up its ears and springs them open to jump enormous distances.',
      moves: [m('Pound', 'Normal', 40), m('Quick Attack', 'Normal', 40), m('Dizzy Punch', 'Normal', 70), m('Bounce', 'Flying', 85)],
      art: { shape: 'blob', body: '#c9a878', accent: '#a8875c', belly: '#f5e7d0', ears: 'long', earTip: '#f5e7d0', tail: 'bushy', eyes: 'happy', mouth: 'smile' } },

    { id: 'riolu', name: 'Riolu', region: 'sinnoh', dex: 447, types: ['Fighting'],
      hp: 58, atk: 70, def: 40, spd: 60,
      abilities: ['Steadfast — every time it flinches it gets faster', 'Inner Focus — it never flinches at all'],
      fact: 'It reads the feelings of people and Pokemon by sensing waves of aura.',
      moves: [m('Quick Attack', 'Normal', 40), m('Force Palm', 'Fighting', 60), m('Bite', 'Dark', 60), m('Aura Sphere', 'Fighting', 80)],
      art: { shape: 'biped', body: '#4a78c8', accent: '#2a2942', belly: '#f7d060', ears: 'point', earTip: '#2a2942', tail: 'thin', front: ['mask'], eyes: 'round', mouth: 'none' } },

    /* ======================= UNOVA ======================= */
    { id: 'snivy', name: 'Snivy', region: 'unova', dex: 495, types: ['Grass'],
      hp: 56, atk: 55, def: 55, spd: 63,
      abilities: ['Overgrow — when it is hurt, its grass moves get stronger', 'Contrary — attacks meant to weaken it make it stronger instead'],
      fact: 'It soaks up sunlight with its tail — when it is unwell, the tail droops.',
      moves: [m('Tackle', 'Normal', 40), m('Vine Whip', 'Grass', 45), m('Slam', 'Normal', 80), m('Leaf Blade', 'Grass', 90)],
      art: { shape: 'biped', body: '#8ad08a', accent: '#5ca85c', belly: '#f5e0a8', ears: 'leaf', earTip: '#5ca85c', tail: 'leaf', eyes: 'smirk', mouth: 'smirk' } },

    { id: 'tepig', name: 'Tepig', region: 'unova', dex: 498, types: ['Fire'],
      hp: 65, atk: 63, def: 45, spd: 45,
      abilities: ['Blaze — when it is hurt, its fire moves get stronger', 'Thick Fat — fire and ice attacks hurt it only half as much'],
      fact: 'It blows fire out of its nose, and roasted berries are its favourite snack.',
      moves: [m('Tackle', 'Normal', 40), m('Ember', 'Fire', 40), m('Flame Charge', 'Fire', 50), m('Take Down', 'Normal', 90)],
      art: { shape: 'quad', body: '#e8704a', accent: '#2a2942', belly: '#f5a86e', ears: 'point', earTip: '#2a2942', tail: 'curl', front: ['snout'], eyes: 'happy', mouth: 'none' } },

    { id: 'oshawott', name: 'Oshawott', region: 'unova', dex: 501, types: ['Water'],
      hp: 60, atk: 58, def: 48, spd: 45,
      abilities: ['Torrent — when it is hurt, its water moves get stronger', 'Shell Armor — it can never be hit by a critical hit'],
      fact: 'The shell on its belly is not just armour — it pops it off and uses it as a blade.',
      moves: [m('Tackle', 'Normal', 40), m('Water Gun', 'Water', 40), m('Aqua Jet', 'Water', 60), m('Razor Shell', 'Water', 75)],
      art: { shape: 'biped', body: '#b8dcf0', accent: '#8fbdd8', belly: '#f7f7fa', ears: 'none', tail: 'fan', front: ['scalchop', 'whiskers'], eyes: 'round', mouth: 'smile' } },

    { id: 'axew', name: 'Axew', region: 'unova', dex: 610, types: ['Dragon'],
      hp: 60, atk: 75, def: 55, spd: 50,
      abilities: ['Rivalry — it fights harder against Pokemon of the same gender', 'Mold Breaker — the other Pokemon cannot use its ability to block'],
      fact: 'It marks its territory by scratching trees with its tusks — which grow right back.',
      moves: [m('Scratch', 'Normal', 40), m('Dual Chop', 'Dragon', 50), m('Bite', 'Dark', 60), m('Dragon Claw', 'Dragon', 80)],
      art: { shape: 'biped', body: '#8ad8b8', accent: '#5fb896', belly: '#d0f0e0', ears: 'point', earTip: '#5fb896', tail: 'thin', front: ['tusks'], eyes: 'round', mouth: 'smile' } },

    { id: 'zorua', name: 'Zorua', region: 'unova', dex: 570, types: ['Dark'],
      hp: 58, atk: 65, def: 40, spd: 65,
      abilities: ['Illusion — it looks exactly like another Pokemon until it gets hit', 'Sneaky Step — it moves without making a single sound'],
      fact: 'It makes itself look like a person or another Pokemon to hide from danger.',
      moves: [m('Scratch', 'Normal', 40), m('Pursuit', 'Dark', 40), m('Feint Attack', 'Dark', 60), m('Night Daze', 'Dark', 85)],
      art: { shape: 'quad', body: '#4a4a66', accent: '#e8704a', belly: '#6a6a8a', ears: 'point', earTip: '#e8704a', tail: 'bushy', front: ['mask'], eyes: 'smirk', mouth: 'smirk' } },

    { id: 'deerling', name: 'Deerling', region: 'unova', dex: 585, types: ['Normal', 'Grass'],
      hp: 60, atk: 60, def: 50, spd: 75,
      abilities: ['Chlorophyll — sunshine makes it super speedy', 'Sap Sipper — grass attacks make it stronger instead of hurting it'],
      fact: 'Its colour and smell change with the season — pink in spring, orange in autumn.',
      moves: [m('Tackle', 'Normal', 40), m('Double Kick', 'Fighting', 60), m('Energy Ball', 'Grass', 80), m('Take Down', 'Normal', 90)],
      art: { shape: 'quad', body: '#f7a8b8', accent: '#7ec87e', belly: '#ffffff', ears: 'point', earTip: '#e08898', tail: 'bushy', front: ['spots'], eyes: 'happy', mouth: 'smile' } },

    /* ======================= KALOS ======================= */
    { id: 'chespin', name: 'Chespin', region: 'kalos', dex: 650, types: ['Grass'],
      hp: 66, atk: 62, def: 58, spd: 40,
      abilities: ['Overgrow — when it is hurt, its grass moves get stronger', 'Bulletproof — balls and bombs bounce right off it'],
      fact: 'The soft spikes on its head can harden into points sharp enough to pierce stone.',
      moves: [m('Tackle', 'Normal', 40), m('Vine Whip', 'Grass', 45), m('Seed Bomb', 'Grass', 80), m('Body Slam', 'Normal', 85)],
      art: { shape: 'quad', body: '#a8c878', accent: '#8a5c3a', belly: '#f5e0b8', ears: 'round', earTip: '#8a5c3a', tail: 'thin', back: ['spikes'], eyes: 'happy', mouth: 'smile' } },

    { id: 'fennekin', name: 'Fennekin', region: 'kalos', dex: 653, types: ['Fire'],
      hp: 56, atk: 55, def: 44, spd: 62,
      abilities: ['Blaze — when it is hurt, its fire moves get stronger', 'Magician — it swipes the item of whoever it hits'],
      fact: 'It snacks on twigs to fuel the hot air it puffs out of its big ears.',
      moves: [m('Scratch', 'Normal', 40), m('Ember', 'Fire', 40), m('Psybeam', 'Psychic', 65), m('Flamethrower', 'Fire', 85)],
      art: { shape: 'quad', body: '#f7c060', accent: '#f0772b', belly: '#fff6d8', ears: 'long', earTip: '#f0772b', tail: 'bushy', eyes: 'sparkle', mouth: 'smile' } },

    { id: 'froakie', name: 'Froakie', region: 'kalos', dex: 656, types: ['Water'],
      hp: 54, atk: 56, def: 40, spd: 71,
      abilities: ['Torrent — when it is hurt, its water moves get stronger', 'Protean — it changes into the type of whatever move it uses'],
      fact: 'The bubbles on its back and chest cushion every blow it takes.',
      moves: [m('Pound', 'Normal', 40), m('Water Gun', 'Water', 40), m('Water Pulse', 'Water', 60), m('Bubble Beam', 'Water', 65)],
      art: { shape: 'biped', body: '#7ec0e8', accent: '#4a90c8', belly: '#f7f7fa', ears: 'none', tail: 'none', front: ['whiskers'], eyes: 'big', mouth: 'smile' } },

    { id: 'pancham', name: 'Pancham', region: 'kalos', dex: 674, types: ['Fighting'],
      hp: 67, atk: 72, def: 55, spd: 45,
      abilities: ['Iron Fist — all its punching moves hit harder', 'Mold Breaker — the other Pokemon cannot use its ability to block'],
      fact: 'It glares hard to look tough, but everyone just thinks it is adorable.',
      moves: [m('Tackle', 'Normal', 40), m('Arm Thrust', 'Fighting', 45), m('Karate Chop', 'Fighting', 55), m('Body Slam', 'Normal', 85)],
      art: { shape: 'biped', body: '#d8d0c8', accent: '#4a4a66', belly: '#f5f0e8', ears: 'round', earTip: '#4a4a66', tail: 'none', front: ['mask'], eyes: 'smirk', mouth: 'smirk' } },

    { id: 'sylveon', name: 'Sylveon', region: 'kalos', dex: 700, types: ['Fairy'],
      hp: 70, atk: 65, def: 65, spd: 60,
      abilities: ['Cute Charm — attackers can fall in love and freeze up', 'Pixilate — its normal moves turn into fairy moves'],
      fact: 'It wraps its ribbon feelers around people to calm down any fight.',
      moves: [m('Quick Attack', 'Normal', 40), m('Fairy Wind', 'Fairy', 40), m('Draining Kiss', 'Fairy', 50), m('Moonblast', 'Fairy', 95)],
      art: { shape: 'quad', body: '#f7d8e8', accent: '#e8b8d0', belly: '#ffffff', cheek: '#6390f0', ears: 'long', earTip: '#e8b8d0', tail: 'bushy', front: ['ribbons'], eyes: 'sparkle', mouth: 'smile' } },

    { id: 'dedenne', name: 'Dedenne', region: 'kalos', dex: 702, types: ['Electric', 'Fairy'],
      hp: 57, atk: 58, def: 43, spd: 101,
      abilities: ['Cheek Pouch — eating a berry heals it extra', 'Pickup — it finds items other Pokemon drop'],
      fact: 'It uses its whiskers like antennas to send and pick up electric signals.',
      moves: [m('Tackle', 'Normal', 40), m('Nuzzle', 'Electric', 40), m('Play Rough', 'Fairy', 70), m('Discharge', 'Electric', 80)],
      art: { shape: 'quad', body: '#f7c860', accent: '#e8704a', belly: '#fff6d8', cheek: '#ef6b63', ears: 'round', earTip: '#e8704a', tail: 'thin', front: ['cheeks', 'whiskers'], eyes: 'round', mouth: 'w' } },

    /* ======================= ALOLA ======================= */
    { id: 'rowlet', name: 'Rowlet', region: 'alola', dex: 722, types: ['Grass', 'Flying'],
      hp: 60, atk: 58, def: 50, spd: 42,
      abilities: ['Overgrow — when it is hurt, its grass moves get stronger', 'Long Reach — it attacks without ever touching the other Pokemon'],
      fact: 'It flies so silently that its prey never hears it coming, and it can turn its head all the way around.',
      moves: [m('Tackle', 'Normal', 40), m('Leafage', 'Grass', 40), m('Pluck', 'Flying', 60), m('Air Slash', 'Flying', 75)],
      art: { shape: 'bird', body: '#b08a5c', accent: '#8f6d45', belly: '#f5efe0', beak: '#f0a63a', ears: 'none', tail: 'fan', front: ['faceRing', 'beak', 'leafBow'], eyes: 'round', mouth: 'none' } },

    { id: 'litten', name: 'Litten', region: 'alola', dex: 725, types: ['Fire'],
      hp: 58, atk: 65, def: 45, spd: 70,
      abilities: ['Blaze — when it is hurt, its fire moves get stronger', 'Intimidate — it scares the other Pokemon into hitting softer'],
      fact: 'It grooms itself constantly, then sets the collected fur alight as a fireball.',
      moves: [m('Scratch', 'Normal', 40), m('Ember', 'Fire', 40), m('Bite', 'Dark', 60), m('Fire Fang', 'Fire', 65)],
      art: { shape: 'quad', body: '#2f2e42', accent: '#e8704a', belly: '#46445c', ears: 'point', earTip: '#e8704a', tail: 'thin', front: ['stripes'], eyes: 'round', mouth: 'none' } },

    { id: 'popplio', name: 'Popplio', region: 'alola', dex: 728, types: ['Water'],
      hp: 60, atk: 54, def: 54, spd: 40,
      abilities: ['Torrent — when it is hurt, its water moves get stronger', 'Liquid Voice — its singing moves become water moves'],
      fact: 'It blows balloons out of its nose and bounces on them to jump higher.',
      moves: [m('Pound', 'Normal', 40), m('Water Gun', 'Water', 40), m('Disarming Voice', 'Fairy', 40), m('Bubble Beam', 'Water', 65)],
      art: { shape: 'blob', body: '#7fc8e8', accent: '#5aa8cf', belly: '#ffffff', cheek: '#f090b8', ears: 'none', tail: 'none', front: ['nose', 'whiskers'], back: ['flippers'], eyes: 'round', mouth: 'none' } },

    { id: 'mimikyu', name: 'Mimikyu', region: 'alola', dex: 778, types: ['Ghost', 'Fairy'],
      hp: 55, atk: 70, def: 60, spd: 60,
      abilities: ['Disguise — its rag costume takes the first hit for it', 'Spooky Cuddle — it just wants a friend, honestly'],
      fact: 'It wears a homemade Pikachu costume because it is lonely and wants to be loved.',
      moves: [m('Astonish', 'Ghost', 40), m('Shadow Sneak', 'Ghost', 40), m('Shadow Claw', 'Ghost', 70), m('Play Rough', 'Fairy', 70)],
      art: { shape: 'ghost', body: '#f7e0a8', accent: '#e8c880', belly: '#f0d090', ears: 'point', earTip: '#2b2b3a', tail: 'none', front: ['clothEyes', 'cheeks'], back: ['stickTail'], cheek: '#ef6b63', eyes: 'none', mouth: 'none' } },

    { id: 'rockruff', name: 'Rockruff', region: 'alola', dex: 744, types: ['Rock'],
      hp: 60, atk: 68, def: 50, spd: 60,
      abilities: ['Keen Eye — its aim can never be lowered', 'Vital Spirit — it is far too excited to fall asleep'],
      fact: 'The rocks around its neck are sharp — it rubs them on you when it likes you.',
      moves: [m('Tackle', 'Normal', 40), m('Rock Throw', 'Rock', 50), m('Bite', 'Dark', 60), m('Rock Slide', 'Rock', 75)],
      art: { shape: 'quad', body: '#c8a878', accent: '#a88858', belly: '#f0e0c8', ears: 'point', earTip: '#a88858', tail: 'bushy', front: ['collarRocks'], eyes: 'happy', mouth: 'smile' } },

    { id: 'togedemaru', name: 'Togedemaru', region: 'alola', dex: 777, types: ['Electric', 'Steel'],
      hp: 60, atk: 68, def: 55, spd: 65,
      abilities: ['Iron Barbs — anyone who touches it gets poked', 'Lightning Rod — it soaks up electric attacks instead of being hurt'],
      fact: 'The spines on its back are a lightning rod — it loves to be struck by lightning.',
      moves: [m('Tackle', 'Normal', 40), m('Spark', 'Electric', 65), m('Iron Head', 'Steel', 80), m('Zing Zap', 'Electric', 80)],
      art: { shape: 'blob', body: '#d8d0c8', accent: '#2a2942', belly: '#f0ece4', cheek: '#ef6b63', ears: 'round', earTip: '#2a2942', tail: 'thin', back: ['spikes'], front: ['cheeks'], eyes: 'round', mouth: 'w' } },

    /* ======================= GALAR ======================= */
    { id: 'grookey', name: 'Grookey', region: 'galar', dex: 810, types: ['Grass'],
      hp: 60, atk: 65, def: 50, spd: 65,
      abilities: ['Overgrow — when it is hurt, its grass moves get stronger', 'Grassy Surge — it turns the whole field into soft healing grass'],
      fact: 'When it drums with its stick, the beat makes plants wake up and grow.',
      moves: [m('Scratch', 'Normal', 40), m('Branch Poke', 'Grass', 40), m('Razor Leaf', 'Grass', 55), m('Wood Hammer', 'Grass', 90)],
      art: { shape: 'biped', body: '#7ec87e', accent: '#c9a878', belly: '#d0f0d0', ears: 'round', earTip: '#c9a878', tail: 'curl', eyes: 'happy', mouth: 'open' } },

    { id: 'scorbunny', name: 'Scorbunny', region: 'galar', dex: 813, types: ['Fire'],
      hp: 58, atk: 71, def: 40, spd: 89,
      abilities: ['Blaze — when it is hurt, its fire moves get stronger', 'Libero — it changes into the type of whatever move it uses'],
      fact: 'It runs to get its fire going — the hotter it gets, the faster it runs.',
      moves: [m('Tackle', 'Normal', 40), m('Ember', 'Fire', 40), m('Quick Attack', 'Normal', 40), m('Pyro Ball', 'Fire', 95)],
      art: { shape: 'biped', body: '#f7f7fa', accent: '#e8704a', belly: '#ffffff', cheek: '#ef6b63', ears: 'long', earTip: '#e8704a', tail: 'bushy', front: ['nose'], eyes: 'sparkle', mouth: 'smile' } },

    { id: 'sobble', name: 'Sobble', region: 'galar', dex: 816, types: ['Water'],
      hp: 55, atk: 55, def: 42, spd: 72,
      abilities: ['Torrent — when it is hurt, its water moves get stronger', 'Sniper — its critical hits do even more damage'],
      fact: 'When it is scared it cries, and its tears make everyone nearby cry too.',
      moves: [m('Pound', 'Normal', 40), m('Water Gun', 'Water', 40), m('Water Pulse', 'Water', 60), m('Liquidation', 'Water', 85)],
      art: { shape: 'biped', body: '#7ec0d8', accent: '#5aa0b8', belly: '#d8f0f5', ears: 'none', tail: 'curl', front: ['tear'], eyes: 'sleepy', mouth: 'none' } },

    { id: 'wooloo', name: 'Wooloo', region: 'galar', dex: 831, types: ['Normal'],
      hp: 72, atk: 60, def: 60, spd: 48,
      abilities: ['Fluffy — hits hurt half as much, but fire hurts double', 'Run Away — it can always escape a battle'],
      fact: 'Its wool is so springy it can roll down a hill and bounce right back up.',
      moves: [m('Tackle', 'Normal', 40), m('Double Kick', 'Fighting', 60), m('Headbutt', 'Normal', 70), m('Body Slam', 'Normal', 85)],
      art: { shape: 'blob', body: '#2a2942', accent: '#2a2942', belly: '#f7f2e4', ears: 'round', earTip: '#3a3852', tail: 'none', back: ['fluff'], front: ['hooves'], eyes: 'happy', mouth: 'smile' } },

    { id: 'yamper', name: 'Yamper', region: 'galar', dex: 835, types: ['Electric'],
      hp: 62, atk: 60, def: 50, spd: 45,
      abilities: ['Ball Fetch — it brings back the ball you threw', 'Static — anyone who touches it might get zapped'],
      fact: 'Running makes electricity in its hips, so it sparks when it chases you.',
      moves: [m('Tackle', 'Normal', 40), m('Nuzzle', 'Electric', 40), m('Spark', 'Electric', 65), m('Wild Charge', 'Electric', 90)],
      art: { shape: 'quad', body: '#f7d060', accent: '#f7f7fa', belly: '#ffffff', ears: 'point', earTip: '#f7f7fa', tail: 'bushy', front: ['spots'], eyes: 'happy', mouth: 'open' } },

    { id: 'morpeko', name: 'Morpeko', region: 'galar', dex: 877, types: ['Electric', 'Dark'],
      hp: 58, atk: 75, def: 45, spd: 97,
      abilities: ['Hunger Switch — it flips between Full Belly and Hangry mode each turn', 'Snack Stash — it keeps seeds in its pockets for later'],
      fact: 'It makes its own electricity from the seeds it eats — and it gets grumpy when hungry.',
      moves: [m('Quick Attack', 'Normal', 40), m('Spark', 'Electric', 65), m('Bite', 'Dark', 60), m('Aura Wheel', 'Electric', 100)],
      art: { shape: 'biped', body: '#f7d060', accent: '#2a2942', belly: '#fff6d8', cheek: '#ef6b63', ears: 'round', earTip: '#2a2942', tail: 'thin', front: ['mask', 'cheeks'], eyes: 'smirk', mouth: 'smirk' } },

    /* ======================= PALDEA ======================= */
    { id: 'sprigatito', name: 'Sprigatito', region: 'paldea', dex: 906, types: ['Grass'],
      hp: 58, atk: 61, def: 44, spd: 71,
      abilities: ['Overgrow — when it is hurt, its grass moves get stronger', 'Protean — it changes into the type of whatever move it uses'],
      fact: 'Its fur smells sweet like flowers, and the smell calms everyone around it.',
      moves: [m('Scratch', 'Normal', 40), m('Leafage', 'Grass', 40), m('Magical Leaf', 'Grass', 60), m('Leaf Blade', 'Grass', 90)],
      art: { shape: 'quad', body: '#7ec87e', accent: '#5ca85c', belly: '#d8f0c8', ears: 'point', earTip: '#f5e0a8', tail: 'leaf', front: ['whiskers'], eyes: 'sparkle', mouth: 'smile' } },

    { id: 'fuecoco', name: 'Fuecoco', region: 'paldea', dex: 909, types: ['Fire'],
      hp: 67, atk: 60, def: 50, spd: 36,
      abilities: ['Blaze — when it is hurt, its fire moves get stronger', 'Unaware — it is too laid back to notice stat changes'],
      fact: 'It lies around soaking up heat, then sends the energy out as fire from its mouth.',
      moves: [m('Tackle', 'Normal', 40), m('Ember', 'Fire', 40), m('Bite', 'Dark', 60), m('Flamethrower', 'Fire', 85)],
      art: { shape: 'blob', body: '#e8704a', accent: '#c85a38', belly: '#f5c060', ears: 'none', tail: 'thin', front: ['jawTeeth'], eyes: 'happy', mouth: 'open' } },

    { id: 'quaxly', name: 'Quaxly', region: 'paldea', dex: 912, types: ['Water'],
      hp: 60, atk: 65, def: 46, spd: 50,
      abilities: ['Torrent — when it is hurt, its water moves get stronger', 'Moxie — every time it wins it gets stronger'],
      fact: 'It keeps its hair gelled with its own gel, and it hates getting dirty.',
      moves: [m('Pound', 'Normal', 40), m('Water Gun', 'Water', 40), m('Wing Attack', 'Flying', 60), m('Aqua Cutter', 'Water', 70)],
      art: { shape: 'bird', body: '#7fc8e8', accent: '#2f6f9f', belly: '#ffffff', beak: '#f0c040', ears: 'none', tail: 'fan', front: ['beak', 'quiff'], eyes: 'smirk', mouth: 'none' } },

    { id: 'pawmi', name: 'Pawmi', region: 'paldea', dex: 921, types: ['Electric'],
      hp: 55, atk: 68, def: 40, spd: 60,
      abilities: ['Static — anyone who touches it might get zapped', 'Volt Absorb — electric attacks heal it instead of hurting'],
      fact: 'The pads on its cheeks make electricity — it rubs them together to spark.',
      moves: [m('Scratch', 'Normal', 40), m('Nuzzle', 'Electric', 40), m('Spark', 'Electric', 65), m('Wild Charge', 'Electric', 90)],
      art: { shape: 'biped', body: '#f7d060', accent: '#e8a060', belly: '#fff6d8', cheek: '#ef6b63', ears: 'round', earTip: '#e8a060', tail: 'thin', front: ['cheeks'], eyes: 'round', mouth: 'w' } },

    { id: 'lechonk', name: 'Lechonk', region: 'paldea', dex: 915, types: ['Normal'],
      hp: 72, atk: 58, def: 54, spd: 35,
      abilities: ['Aroma Veil — its smell protects the whole team from scary moves', 'Gluttony — it eats its berry early when it gets peckish'],
      fact: 'It eats herbs all day, so it smells lovely — which bug Pokemon really hate.',
      moves: [m('Tackle', 'Normal', 40), m('Headbutt', 'Normal', 70), m('Dig', 'Ground', 80), m('Take Down', 'Normal', 90)],
      art: { shape: 'quad', body: '#c8a890', accent: '#8a6a58', belly: '#e8d0c0', ears: 'point', earTip: '#8a6a58', tail: 'curl', front: ['snout'], eyes: 'sleepy', mouth: 'none' } },

    { id: 'tinkatink', name: 'Tinkatink', region: 'paldea', dex: 957, types: ['Fairy', 'Steel'],
      hp: 60, atk: 60, def: 50, spd: 58,
      abilities: ['Mold Breaker — the other Pokemon cannot use its ability to block', 'Own Tempo — nothing can confuse it'],
      fact: 'It gathers scrap metal and builds itself a hammer that gets bigger and bigger.',
      moves: [m('Pound', 'Normal', 40), m('Fairy Wind', 'Fairy', 40), m('Metal Claw', 'Steel', 50), m('Play Rough', 'Fairy', 70)],
      art: { shape: 'biped', body: '#f7b8d8', accent: '#8f8fa8', belly: '#ffffff', cheek: '#ef6b63', ears: 'point', earTip: '#8f8fa8', tail: 'thin', front: ['bow'], eyes: 'round', mouth: 'smile' } }
  ];

  /* -------------------------------------------------------------------------
     The rest of the roster lives in dex-more-*.js so no single file gets
     unreadable. They call DEX.add([...]) and DEX.addChains([...]).
     ------------------------------------------------------------------------- */
  const byId = {};
  const CHAINS = [];       // e.g. ['charmander','charmeleon','charizard']
  const chainOf = {};      // id -> the chain it belongs to

  function reindex() {
    POKEMON.forEach(p => { byId[p.id] = p; });
    POKEMON.sort((a, b) => a.dex - b.dex);
  }
  function add(list) { list.forEach(p => POKEMON.push(p)); reindex(); }

  /* -------------------------------------------------------------------------
     loadAll — unpacks the generated dex-all.js (every Pokemon, Kanto through
     Paldea, so there are no gaps in the numbers). It is stored as compact
     arrays with shared tables for types, abilities and moves, which keeps the
     file about a quarter of the size it would otherwise be.

     Anything already hand-written in this file or dex-more-*.js is kept as-is:
     those have abilities and facts written in kid language, so they win.
     ------------------------------------------------------------------------- */
  let ALL_MOVES = [];
  function loadAll(d) {
    ALL_MOVES = d.M.map(([name, t, power]) => ({ name, type: d.T[t], power }));
    const abilities = d.A;

    const byDex = {};
    POKEMON.forEach(p => { byDex[p.dex] = p; });

    d.P.forEach(row => {
      const [dex, id, name, region, t, hp, atk, def, spd, a, fact, genus, l, legend, art] = row;
      // A hand-written version wins. Match on the Pokedex number as well as
      // the id, because a few of ours are spelled differently from PokeAPI's
      // (we wrote "hooh" and "tapukoko", it says "ho-oh" and "tapu-koko").
      const mine = byId[id] || byDex[dex];
      if (mine) {
        if (!mine.genus) mine.genus = genus;   // but take the genus, we never wrote those
        if (!mine.learn) mine.learn = l;       // and its real learnset
        return;
      }
      POKEMON.push({
        id, name, dex, region,
        types: t.map(i => d.T[i]),
        hp, atk, def, spd,
        abilities: a.map(i => abilities[i][0] + ' — ' + abilities[i][1]),
        fact, genus,
        learn: l,                           // indices into ALL_MOVES
        get moves() {                       // the four it brings to a battle
          if (!this._m) this._m = defaultFour(this);
          return this._m;
        },
        legend: !!legend,
        art
      });
    });

    if (d.C) addChains(d.C);
    reindex();
  }

  /* Pick a sensible four from a learnset: keep its own types where possible and
     spread them over the power range, so nothing turns up with four weak moves
     or four near-identical ones. */
  function defaultFour(p) {
    const all = (p.learn || []).map(i => ALL_MOVES[i]).filter(Boolean);
    if (!all.length) return [{ name: 'Tackle', type: 'Normal', power: 40 }];
    const own = all.filter(mv => p.types.indexOf(mv.type) >= 0);
    const from = own.length >= 3 ? own : all;
    const sorted = from.slice().sort((a, b) => a.power - b.power);
    const at = f => sorted[Math.min(sorted.length - 1, Math.floor(f * sorted.length))];
    const out = [];
    [0, .45, .75, .99].forEach(f => { const mv = at(f); if (out.indexOf(mv) < 0) out.push(mv); });
    // top up from the rest if the spread produced duplicates
    for (const mv of sorted) { if (out.length >= 4) break; if (out.indexOf(mv) < 0) out.push(mv); }
    return out.sort((a, b) => a.power - b.power);
  }

  const moveAt = i => ALL_MOVES[i];
  const fullLearnset = p => (p.learn || []).map(i => ALL_MOVES[i]).filter(Boolean);
  /* Accepts a plain chain  ['charmander','charmeleon','charizard']
     or a labelled set     { label:'Eevee can become', ids:[...] }  */
  function addChains(list) {
    list.forEach(c => {
      const entry = Array.isArray(c) ? { label: null, ids: c } : c;
      CHAINS.push(entry);
      entry.ids.forEach(id => { if (!chainOf[id]) chainOf[id] = entry; });
    });
  }
  /* the evolution line a Pokemon belongs to; ones we don't have are flagged */
  function evoLine(id) {
    const c = chainOf[id];
    if (!c) return null;
    return {
      label: c.label,
      steps: c.ids.map(cid => ({ id: cid, name: byId[cid] ? byId[cid].name : capital(cid), have: !!byId[cid] }))
    };
  }
  const capital = s => s.charAt(0).toUpperCase() + s.slice(1);
  const byRegion = r => POKEMON.filter(p => p.region === r);

  reindex();

  return {
    REGIONS, TYPE_COLOR, CHART, effectiveness, POKEMON, byId, byRegion,
    add, addChains, CHAINS, evoLine, loadAll, moveAt, fullLearnset, SPRITE:
      dex => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dex}.png`
  };
})();
