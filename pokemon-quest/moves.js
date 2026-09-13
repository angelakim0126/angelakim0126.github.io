/* ===========================================================================
   moves.js — the big list of powers, and every Pokemon's full learnset
   ---------------------------------------------------------------------------
   Iris wanted ALL of a Pokemon's powers, not just four. So:

     * MOVES below is a table of ~290 real moves (name, type, power). Only
       damaging moves are here — status moves like Growl would just do nothing
       in our battles, so they are left out.
     * learnset(p) builds the full list of powers a Pokemon can use: its four
       signature ones, plus moves that match its types, plus the plain Normal
       ones everybody picks up. Stronger Pokemon get access to stronger moves.
     * The list is the same every time (the shuffle is seeded off the Pokedex
       number), so a Pokemon's powers never change between visits.
   =========================================================================== */
(function () {
  "use strict";

  /* [name, power] grouped by type */
  const MOVES = {
    Normal: [
      ['Tackle', 40], ['Scratch', 40], ['Pound', 40], ['Quick Attack', 40], ['Fury Swipes', 45],
      ['Rapid Spin', 50], ['Swift', 60], ['Stomp', 65], ['Headbutt', 70], ['Slash', 70],
      ['Dizzy Punch', 70], ['Facade', 70], ['Tri Attack', 80], ['Hyper Fang', 80], ['Mega Punch', 80],
      ['Body Slam', 85], ['Take Down', 90], ['Egg Bomb', 100], ['Return', 102], ['Mega Kick', 120],
      ['Double-Edge', 120], ['Hyper Beam', 150], ['Giga Impact', 150], ['Boomburst', 140]
    ],
    Fire: [
      ['Ember', 40], ['Fire Spin', 35], ['Flame Charge', 50], ['Incinerate', 60], ['Flame Wheel', 60],
      ['Fire Fang', 65], ['Fire Punch', 75], ['Lava Plume', 80], ['Torch Song', 80], ['Blaze Kick', 85],
      ['Flamethrower', 90], ['Heat Wave', 95], ['Inferno', 100], ['Sacred Fire', 100], ['Fusion Flare', 100],
      ['Fire Blast', 110], ['Flare Blitz', 120], ['Pyro Ball', 120], ['Blue Flare', 130], ['Overheat', 130],
      ['Eruption', 150], ['V-create', 180]
    ],
    Water: [
      ['Water Gun', 40], ['Bubble', 40], ['Aqua Jet', 60], ['Water Pulse', 60], ['Water Shuriken', 60],
      ['Bubble Beam', 65], ['Brine', 65], ['Octazooka', 65], ['Aqua Cutter', 70], ['Razor Shell', 75],
      ['Dive', 80], ['Waterfall', 80], ['Scald', 80], ['Snipe Shot', 80], ['Aqua Step', 80],
      ['Liquidation', 85], ['Surf', 90], ['Aqua Tail', 90], ['Muddy Water', 90], ['Sparkling Aria', 90],
      ['Hydro Pump', 110], ['Origin Pulse', 110], ['Hydro Cannon', 150]
    ],
    Electric: [
      ['Thunder Shock', 40], ['Nuzzle', 40], ['Charge Beam', 50], ['Shock Wave', 60], ['Spark', 65],
      ['Thunder Fang', 65], ['Parabolic Charge', 65], ['Thunder Punch', 75], ['Discharge', 80],
      ['Electro Ball', 80], ['Zing Zap', 80], ['Thunderbolt', 90], ['Wild Charge', 90],
      ['Electro Drift', 100], ['Fusion Bolt', 100], ['Thunder', 110], ['Aura Wheel', 110],
      ['Volt Tackle', 120], ['Zap Cannon', 120], ['Bolt Strike', 130]
    ],
    Grass: [
      ['Absorb', 20], ['Leafage', 40], ['Branch Poke', 40], ['Mega Drain', 40], ['Vine Whip', 45],
      ['Razor Leaf', 55], ['Magical Leaf', 60], ['Flower Trick', 70], ['Giga Drain', 75],
      ['Seed Bomb', 80], ['Drum Beating', 80], ['Apple Acid', 80], ['Energy Ball', 90],
      ['Leaf Blade', 90], ['Petal Blizzard', 90], ['Wood Hammer', 120], ['Solar Beam', 120],
      ['Power Whip', 120], ['Petal Dance', 120], ['Leaf Storm', 130], ['Frenzy Plant', 150]
    ],
    Ice: [
      ['Powder Snow', 40], ['Ice Shard', 40], ['Icy Wind', 55], ['Avalanche', 60], ['Frost Breath', 60],
      ['Triple Axel', 60], ['Ice Fang', 65], ['Aurora Beam', 65], ['Freeze-Dry', 70], ['Ice Punch', 75],
      ['Icicle Crash', 85], ['Ice Beam', 90], ['Blizzard', 110], ['Ice Burn', 140]
    ],
    Fighting: [
      ['Rock Smash', 40], ['Mach Punch', 40], ['Arm Thrust', 45], ['Karate Chop', 50], ['Low Kick', 60],
      ['Double Kick', 60], ['Force Palm', 60], ['Vital Throw', 70], ['Seismic Toss', 70],
      ['Brick Break', 75], ['Drain Punch', 75], ['Aura Sphere', 80], ['Body Press', 80],
      ['Sky Uppercut', 85], ['Sacred Sword', 90], ['Cross Chop', 100], ['Hammer Arm', 100],
      ['Dynamic Punch', 100], ['Collision Course', 100], ['Flying Press', 100], ['Close Combat', 120],
      ['Superpower', 120], ['Focus Blast', 120], ['High Jump Kick', 130]
    ],
    Poison: [
      ['Poison Sting', 40], ['Acid', 40], ['Acid Spray', 40], ['Poison Fang', 50], ['Sludge', 65],
      ['Venoshock', 65], ['Cross Poison', 70], ['Poison Jab', 80], ['Sludge Bomb', 90],
      ['Sludge Wave', 95], ['Gunk Shot', 120]
    ],
    Ground: [
      ['Mud-Slap', 20], ['Sand Tomb', 35], ['Mud Shot', 55], ['Bulldoze', 60], ['Bone Club', 65],
      ['Scorching Sands', 70], ['Stomping Tantrum', 75], ['Dig', 80], ['Drill Run', 80],
      ['Earth Power', 90], ['Land\'s Wrath', 90], ['Thousand Arrows', 90], ['High Horsepower', 95],
      ['Earthquake', 100], ['Precipice Blades', 120]
    ],
    Flying: [
      ['Peck', 35], ['Gust', 40], ['Dual Wingbeat', 40], ['Acrobatics', 55], ['Wing Attack', 60],
      ['Aerial Ace', 60], ['Pluck', 60], ['Air Cutter', 60], ['Air Slash', 75], ['Drill Peck', 80],
      ['Oblivion Wing', 80], ['Bounce', 85], ['Fly', 90], ['Beak Blast', 100], ['Hurricane', 110],
      ['Brave Bird', 120], ['Dragon Ascent', 120], ['Sky Attack', 140]
    ],
    Psychic: [
      ['Confusion', 50], ['Psywave', 50], ['Heart Stamp', 60], ['Psybeam', 65], ['Psycho Cut', 70],
      ['Psyshield Bash', 70], ['Zen Headbutt', 80], ['Extrasensory', 80], ['Psyshock', 80],
      ['Expanding Force', 80], ['Hyperspace Hole', 80], ['Psychic', 90], ['Luster Purge', 95],
      ['Mist Ball', 95], ['Psystrike', 100], ['Dream Eater', 100], ['Future Sight', 120]
    ],
    Bug: [
      ['Fury Cutter', 40], ['Struggle Bug', 50], ['Bug Bite', 60], ['U-turn', 70],
      ['Skitter Smack', 70], ['Signal Beam', 75], ['X-Scissor', 80], ['Leech Life', 80],
      ['Lunge', 80], ['Bug Buzz', 90], ['First Impression', 90], ['Attack Order', 90], ['Megahorn', 120]
    ],
    Rock: [
      ['Rollout', 30], ['Accelerock', 40], ['Rock Throw', 50], ['Smack Down', 50], ['Rock Blast', 50],
      ['Ancient Power', 60], ['Rock Tomb', 60], ['Rock Slide', 75], ['Power Gem', 80],
      ['Stone Edge', 100], ['Diamond Storm', 100], ['Meteor Beam', 120], ['Head Smash', 150],
      ['Rock Wrecker', 150]
    ],
    Ghost: [
      ['Lick', 30], ['Astonish', 30], ['Shadow Sneak', 40], ['Night Shade', 50], ['Infernal Parade', 60],
      ['Shadow Punch', 60], ['Hex', 65], ['Shadow Claw', 70], ['Bitter Malice', 75],
      ['Shadow Ball', 80], ['Spirit Shackle', 80], ['Phantom Force', 90], ['Moongeist Beam', 100],
      ['Poltergeist', 110], ['Shadow Force', 120]
    ],
    Dragon: [
      ['Twister', 40], ['Dual Chop', 40], ['Scale Shot', 50], ['Dragon Darts', 50], ['Dragon Breath', 60],
      ['Dragon Tail', 60], ['Dragon Claw', 80], ['Dragon Pulse', 85], ['Dragon Hammer', 90],
      ['Dragon Rush', 100], ['Spacial Rend', 100], ['Core Enforcer', 100], ['Clanging Scales', 110],
      ['Outrage', 120], ['Draco Meteor', 130], ['Roar of Time', 150], ['Eternabeam', 160]
    ],
    Dark: [
      ['Pursuit', 40], ['Brutal Swing', 60], ['Bite', 60], ['Feint Attack', 60], ['Assurance', 60],
      ['Knock Off', 65], ['Night Slash', 70], ['Sucker Punch', 70], ['Wicked Blow', 75],
      ['Lash Out', 75], ['Crunch', 80], ['Dark Pulse', 80], ['Throat Chop', 80],
      ['Darkest Lariat', 85], ['Night Daze', 85], ['Foul Play', 95]
    ],
    Steel: [
      ['Bullet Punch', 40], ['Metal Claw', 50], ['Gyro Ball', 60], ['Steel Wing', 70],
      ['Smart Strike', 70], ['Iron Head', 80], ['Flash Cannon', 80], ['Heavy Slam', 80],
      ['Anchor Shot', 80], ['Meteor Mash', 90], ['Behemoth Blade', 100], ['Behemoth Bash', 100],
      ['Sunsteel Strike', 100], ['Iron Tail', 100], ['Steel Beam', 140], ['Doom Desire', 140],
      ['Gigaton Hammer', 160]
    ],
    Fairy: [
      ['Fairy Wind', 40], ['Disarming Voice', 40], ['Draining Kiss', 50], ['Spirit Break', 75],
      ['Dazzling Gleam', 80], ['Play Rough', 90], ['Nature\'s Madness', 90], ['Moonblast', 95],
      ['Springtide Storm', 95], ['Magical Torque', 100], ['Misty Explosion', 100],
      ['Fleur Cannon', 130], ['Light of Ruin', 140]
    ]
  };

  /* flat lookup so we can find any move by name */
  const BY_NAME = {};
  Object.keys(MOVES).forEach(type => {
    MOVES[type].forEach(([name, power]) => { BY_NAME[name] = { name, type, power }; });
  });

  /* tiny seeded shuffle so a Pokemon's list is stable between page loads */
  function seeded(n) {
    let s = n * 2654435761 % 4294967296;
    return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  }
  function pickSome(list, count, rnd) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, count);
  }

  /* how strong a Pokemon is decides how strong a move it can handle */
  function powerCap(p) {
    const total = p.hp + p.atk + p.def + p.spd;
    if (p.legend) return 200;
    if (total >= 420) return 130;
    if (total >= 340) return 110;
    if (total >= 280) return 95;
    return 80;
  }

  const cache = {};

  /* Every power this Pokemon can use, weakest first. */
  function learnset(p) {
    if (cache[p.id]) return cache[p.id];
    const cap = powerCap(p);
    const rnd = seeded(p.dex + 7);
    const out = [];
    const seen = {};
    const push = mv => { if (mv && !seen[mv.name]) { seen[mv.name] = 1; out.push(mv); } };

    // its four signature powers always come along, whatever the cap says
    p.moves.forEach(mv => push(mv));

    // moves matching each of its own types
    p.types.forEach(t => {
      const pool = (MOVES[t] || []).filter(([, pow]) => pow <= cap);
      pickSome(pool, p.types.length > 1 ? 5 : 7, rnd)
        .forEach(([name, pow]) => push({ name, type: t, power: pow }));
    });

    // a few plain Normal ones, which nearly everything picks up
    if (p.types.indexOf('Normal') < 0) {
      const pool = MOVES.Normal.filter(([, pow]) => pow <= Math.min(cap, 90));
      pickSome(pool, 3, rnd).forEach(([name, pow]) => push({ name, type: 'Normal', power: pow }));
    }

    out.sort((a, b) => a.power - b.power || a.name.localeCompare(b.name));
    cache[p.id] = out;
    return out;
  }

  window.DEX.MOVES = MOVES;
  window.DEX.moveByName = n => BY_NAME[n] || null;
  window.DEX.learnset = learnset;
})();
