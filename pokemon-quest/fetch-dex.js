/* Fetch the whole Pokedex from PokeAPI and generate dex-all.js for the game.
   Responses are cached on disk so this can be re-run / resumed cheaply. */
const fs = require('fs');
const path = require('path');
const os = require('os');

/* Cache lives OUTSIDE the repo on purpose: it is ~200 MB of raw API responses
   and has no business in a GitHub Pages site. Delete it any time; re-running
   just refetches. */
const CACHE = path.join(os.tmpdir(), 'pokeapi-cache');
fs.mkdirSync(CACHE, { recursive: true });

const MAX_DEX = 1025;
const CONCURRENCY = 8;

function cacheFile(url) {
  return path.join(CACHE, url.replace(/^https:\/\/pokeapi\.co\/api\/v2\//, '').replace(/[\/]/g, '_') + '.json');
}

async function get(url, tries = 4) {
  const f = cacheFile(url);
  if (fs.existsSync(f)) {
    try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { /* refetch */ }
  }
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'iris-pokemon-quest/1.0 (personal kids project)' } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      fs.writeFileSync(f, JSON.stringify(j));
      return j;
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise(r => setTimeout(r, 400 * (i + 1)));
    }
  }
}

async function pool(items, fn, label) {
  const out = new Array(items.length);
  let next = 0, done = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
      if (++done % 100 === 0 || done === items.length) {
        process.stderr.write(`  ${label}: ${done}/${items.length}\n`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return out;
}

/* PokeAPI slugs lose punctuation, and "nidoran-f" would read as "Nidoran F".
   These are the ones a Pokemon-obsessed reader would notice straight away. */
const NAME_FIX = {
  'nidoran-f': 'Nidoran ♀', 'nidoran-m': 'Nidoran ♂', 'mr-mime': 'Mr. Mime',
  'mime-jr': 'Mime Jr.', 'mr-rime': 'Mr. Rime', 'farfetchd': "Farfetch'd",
  'sirfetchd': "Sirfetch'd", 'ho-oh': 'Ho-Oh', 'porygon-z': 'Porygon-Z',
  'type-null': 'Type: Null', 'jangmo-o': 'Jangmo-o', 'hakamo-o': 'Hakamo-o',
  'kommo-o': 'Kommo-o', 'flabebe': 'Flabébé', 'ting-lu': 'Ting-Lu',
  'chien-pao': 'Chien-Pao', 'wo-chien': 'Wo-Chien', 'chi-yu': 'Chi-Yu',
  'great-tusk': 'Great Tusk', 'tapu-koko': 'Tapu Koko', 'tapu-lele': 'Tapu Lele',
  'tapu-bulu': 'Tapu Bulu', 'tapu-fini': 'Tapu Fini'
};
const title = s => NAME_FIX[s] ||
  s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

/* cut long text at a word boundary, never mid-word */
function trim(s, max) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const at = cut.lastIndexOf(' ');
  return (at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[ ,.;:–-]+$/, '') + '…';
}
/* Pokedex text from the older games SHOUTS names in caps ("POKéMON", "PIKACHU").
   Soften that to sentence case so it reads nicely on the study card. */
const clean = s => (s || '')
  .replace(/[\n\f\r­]+/g, ' ')
  .replace(/POK[ÉéE]MON/g, 'Pokemon')
  .replace(/\b([A-Z]{2,})\b/g, w => w.charAt(0) + w.slice(1).toLowerCase())
  .replace(/é/g, 'e')
  .replace(/\s+/g, ' ')
  .trim();

const GEN_REGION = {
  'generation-i': 'kanto', 'generation-ii': 'johto', 'generation-iii': 'hoenn',
  'generation-iv': 'sinnoh', 'generation-v': 'unova', 'generation-vi': 'kalos',
  'generation-vii': 'alola', 'generation-viii': 'galar', 'generation-ix': 'paldea'
};

/* ---- art recipes generated from the species' own shape + colour ---- */
const SHAPE = {
  ball: 'blob', blob: 'blob', arms: 'blob', tentacles: 'blob', heads: 'blob',
  squiggle: 'serpent', fish: 'fish', wings: 'bird', 'bug-wings': 'bird',
  upright: 'biped', legs: 'biped', quadruped: 'quad', armor: 'quad', humanoid: 'humanoid'
};
const COLOR = {
  black: ['#3f3f52', '#2a2a38', '#5a5a70'], blue: ['#5f8fd8', '#3f6fb8', '#a8c8f0'],
  brown: ['#b08a5c', '#8a6a42', '#e0c8a0'], gray: ['#a8a8b8', '#88889a', '#d0d0dc'],
  green: ['#7ec87e', '#5ca85c', '#c8f0c8'], pink: ['#f7b8d0', '#e898b8', '#ffe0ec'],
  purple: ['#8a6ab0', '#6a4a90', '#d0b8e8'], red: ['#e8553a', '#c43f2a', '#f7b8a8'],
  white: ['#f2f2f7', '#d8d8e4', '#ffffff'], yellow: ['#f7d060', '#e0b840', '#fff2c0']
};
const TAIL_BY_TYPE = {
  fire: 'flame', electric: 'star', grass: 'leaf', water: 'fan', dragon: 'thin',
  flying: 'fan', ice: 'fan', fairy: 'bushy', dark: 'bushy', normal: 'bushy'
};

function makeArt(species, types, legend) {
  const shape = SHAPE[species.shape ? species.shape.name : 'blob'] || 'blob';
  const [body, accent, belly] = COLOR[species.color.name] || COLOR.gray;
  const t0 = types[0], t1 = types[1];
  const art = { shape, body, accent, belly };

  if (shape === 'quad' || shape === 'biped' || shape === 'humanoid') {
    art.ears = (t0 === 'electric' || t0 === 'dark' || t0 === 'fire') ? 'point'
      : (t0 === 'fairy' || t0 === 'normal') ? 'long' : 'round';
    art.earTip = accent;
  } else {
    art.ears = 'none';
  }
  art.tail = shape === 'blob' || shape === 'fish' || shape === 'serpent' ? 'none'
    : (TAIL_BY_TYPE[t0] || TAIL_BY_TYPE[t1] || 'thin');

  const front = [], back = [];
  if (t0 === 'electric' || t1 === 'electric') { front.push('cheeks'); art.cheek = '#ef6b63'; }
  if (t0 === 'bug' || t1 === 'bug') front.push('spots');
  if (t0 === 'rock' || t0 === 'ground' || t0 === 'steel') front.push('plates');
  if (t0 === 'ghost' || t1 === 'ghost') front.push('mask');
  if (shape === 'bird') front.push('beak');
  if (t0 === 'grass' && shape !== 'serpent') front.push('headLeaf');
  if (t0 === 'flying' || t1 === 'flying') back.push('bigWings');
  if (legend) { back.push('aura'); art.auraColor = accent; }
  if (front.length) art.front = front;
  if (back.length) art.back = back;

  art.eyes = (t0 === 'dark' || t0 === 'dragon' || legend) ? 'angry'
    : (t0 === 'psychic' || t0 === 'ghost') ? 'sleepy' : 'round';
  art.mouth = shape === 'bird' ? 'none' : 'smile';
  return art;
}

(async () => {
  console.error('1/5 species + pokemon …');
  const ids = Array.from({ length: MAX_DEX }, (_, i) => i + 1);
  const mons = await pool(ids, id => get(`https://pokeapi.co/api/v2/pokemon/${id}`), 'pokemon');
  const specs = await pool(ids, id => get(`https://pokeapi.co/api/v2/pokemon-species/${id}`), 'species');

  console.error('2/5 moves …');
  const moveNames = new Set();
  mons.forEach(m => m.moves.forEach(mv => moveNames.add(mv.move.name)));
  const moveList = [...moveNames];
  const moveData = await pool(moveList, n => get(`https://pokeapi.co/api/v2/move/${n}`), 'moves');
  const MOVES = {};
  moveData.forEach(m => {
    if (m && m.power && m.power > 0 && m.type) {
      MOVES[m.name] = { name: title(m.name), type: title(m.type.name), power: m.power };
    }
  });

  console.error('3/5 abilities …');
  const abilNames = new Set();
  mons.forEach(m => m.abilities.forEach(a => abilNames.add(a.ability.name)));
  const abilList = [...abilNames];
  const abilData = await pool(abilList, n => get(`https://pokeapi.co/api/v2/ability/${n}`), 'abilities');
  const ABIL = {};
  abilData.forEach(a => {
    if (!a) return;
    const eff = (a.effect_entries || []).find(e => e.language.name === 'en');
    const fla = (a.flavor_text_entries || []).filter(e => e.language.name === 'en').pop();
    let text = clean(eff ? eff.short_effect : (fla ? fla.flavor_text : ''));
    text = trim(text, 120);
    ABIL[a.name] = { name: title(a.name), text: text || 'A special power of its own.' };
  });

  console.error('4/5 evolution chains …');
  const chainUrls = [...new Set(specs.map(s => s.evolution_chain && s.evolution_chain.url).filter(Boolean))];
  const chains = await pool(chainUrls, u => get(u), 'chains');
  const CHAINS = [];
  chains.forEach(c => {
    if (!c) return;
    // walk the tree; each root-to-leaf path is one line
    const walk = (node, acc) => {
      const line = acc.concat([node.species.name]);
      if (!node.evolves_to.length) { if (line.length > 1) CHAINS.push(line); return; }
      node.evolves_to.forEach(n => walk(n, line));
    };
    walk(c.chain, []);
  });

  console.error('5/5 building dex-all.js …');
  const TYPES = ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
    'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'];
  const tIdx = t => TYPES.indexOf(title(t));

  const abilKeys = Object.keys(ABIL);
  const aIdx = {}; abilKeys.forEach((k, i) => aIdx[k] = i);
  const moveKeys = Object.keys(MOVES);
  const mIdx = {}; moveKeys.forEach((k, i) => mIdx[k] = i);

  const entries = [];
  let skipped = 0;
  mons.forEach((m, i) => {
    const s = specs[i];
    if (!m || !s) { skipped++; return; }
    const region = GEN_REGION[s.generation.name];
    if (!region) { skipped++; return; }

    const stat = n => (m.stats.find(x => x.stat.name === n) || { base_stat: 50 }).base_stat;
    const hp = stat('hp');
    const atk = Math.max(stat('attack'), stat('special-attack'));
    const def = Math.round((stat('defense') + stat('special-defense')) / 2);
    const spd = stat('speed');

    const types = m.types.sort((a, b) => a.slot - b.slot).map(t => t.type.name);
    const legend = !!(s.is_legendary || s.is_mythical);

    const abils = m.abilities.map(a => a.ability.name).filter(n => aIdx[n] !== undefined).slice(0, 3);
    /* Its powers. Some Pokemon (Mew!) can legally learn 200+ damaging moves,
       which is an unreadable wall on a study card — so keep up to LEARN_CAP,
       favouring moves of its own types and then spreading the rest across the
       power range so there is always something weak, middling and strong. */
    const LEARN_CAP = 30;
    const all = m.moves.map(mv => mv.move.name).filter(n => mIdx[n] !== undefined);
    const own = all.filter(n => types.indexOf(MOVES[n].type.toLowerCase()) >= 0);
    const rest = all.filter(n => own.indexOf(n) < 0)
      .sort((a, b) => MOVES[a].power - MOVES[b].power);
    let keep = own.slice(0, Math.min(own.length, 20));
    const room = LEARN_CAP - keep.length;
    if (room > 0 && rest.length) {
      const step = rest.length / room;                    // even spread by power
      for (let k = 0; k < room && rest.length; k++) keep.push(rest[Math.min(rest.length - 1, Math.floor(k * step))]);
    }
    keep = [...new Set(keep)];
    const learn = keep.map(n => mIdx[n]);
    // a handful of Pokemon know no damaging move at all — give them Tackle
    if (!learn.length && mIdx['tackle'] !== undefined) learn.push(mIdx['tackle']);
    learn.sort((a, b) => MOVES[moveKeys[a]].power - MOVES[moveKeys[b]].power);

    const flav = (s.flavor_text_entries || []).filter(e => e.language.name === 'en');
    let fact = clean(flav.length ? flav[0].flavor_text : '');
    fact = trim(fact, 190);
    const genus = clean(((s.genera || []).find(g => g.language.name === 'en') || {}).genus);

    /* Use the SPECIES name, not the variant name: /pokemon/745 is called
       "lycanroc-midday" and 877 "morpeko-full-belly", which would show up in
       the Pokedex as "Lycanroc Midday". The species name is the plain one. */
    entries.push({
      id: s.name, name: title(s.name), dex: m.id, region,
      t: types.map(tIdx), hp, atk, def, spd,
      a: abils.map(n => aIdx[n]), f: fact, g: genus,
      l: learn, L: legend ? 1 : 0,
      art: makeArt(s, types, legend)
    });
  });

  entries.sort((a, b) => a.dex - b.dex);

  const out = [];
  out.push('/* ===========================================================================');
  out.push('   dex-all.js — GENERATED FILE, do not hand-edit.');
  out.push('   ---------------------------------------------------------------------------');
  out.push('   Every Pokemon from Kanto through Paldea, so there are no gaps in the');
  out.push('   Pokedex numbers. Built by scratchpad/fetch-dex.js from PokeAPI data');
  out.push('   (stats, types, abilities, Pokedex text, full learnsets, evolution lines),');
  out.push('   with fallback drawing recipes derived from each species\' own shape and');
  out.push('   colour. The hand-written entries in dex-more-*.js override these, because');
  out.push('   their abilities and facts are written in kid language.');
  out.push('');
  out.push(`   Generated ${new Date().toISOString().slice(0, 10)} · ${entries.length} Pokemon ·`);
  out.push(`   ${moveKeys.length} damaging moves · ${abilKeys.length} abilities · ${CHAINS.length} evolution lines`);
  out.push('   =========================================================================== */');
  out.push('window.DEX.loadAll({');
  out.push('T: ' + JSON.stringify(TYPES) + ',');
  out.push('A: ' + JSON.stringify(abilKeys.map(k => [ABIL[k].name, ABIL[k].text])) + ',');
  out.push('M: ' + JSON.stringify(moveKeys.map(k => [MOVES[k].name, TYPES.indexOf(MOVES[k].type), MOVES[k].power])) + ',');
  out.push('C: ' + JSON.stringify(CHAINS) + ',');
  out.push('P: [');
  entries.forEach(e => {
    out.push(JSON.stringify([e.dex, e.id, e.name, e.region, e.t, e.hp, e.atk, e.def, e.spd,
      e.a, e.f, e.g, e.l, e.L, e.art]) + ',');
  });
  out.push(']});');

  const target = path.join(__dirname, 'dex-all.js');
  fs.writeFileSync(target, out.join('\n'));
  const kb = (fs.statSync(target).size / 1024).toFixed(0);
  console.error(`\ndone: ${entries.length} Pokemon (${skipped} skipped), ${moveKeys.length} moves, ${abilKeys.length} abilities, ${CHAINS.length} chains → ${kb} KB`);
})();
