/* ===========================================================================
   game.js — Iris's Secret Pokemon Quest
   ---------------------------------------------------------------------------
   Three parts, in the order Iris drew them:
     1. a secret word to get in
     2. a Pokedex you study (powers + abilities) and a quiz on what you studied
     3. a battle against a rival, using only the Pokemon you actually learned
   =========================================================================== */
(function () {
  "use strict";

  const $ = id => document.getElementById(id);
  const DEX = window.DEX, Art = window.Art;
  const { REGIONS, TYPE_COLOR, effectiveness, POKEMON, byId, byRegion } = DEX;

  /* =======================================================================
     little helpers
     ======================================================================= */
  const choice = a => a[Math.floor(Math.random() * a.length)];
  const rand = (a, b) => Math.random() * (b - a) + a;
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function sample(arr, n) { return shuffle(arr.slice()).slice(0, n); }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function typeChip(t, big) {
    return `<span class="type-chip${big ? ' lg' : ''}" style="background:${TYPE_COLOR[t] || '#999'}">${t}</span>`;
  }
  function typeChips(p, big) { return `<div class="types">${p.types.map(t => typeChip(t, big)).join('')}</div>`; }

  /* -----------------------------------------------------------------------
     One picture of a Pokemon.
     We show the official sprite from PokeAPI when it loads, and quietly fall
     back to the hand-drawn SVG in art.js if there is no internet (or that
     server ever stops answering). Either way the box is the same size, so
     nothing jumps around.
     --------------------------------------------------------------------- */
  function pic(p, opts) {
    opts = opts || {};
    const cls = 'critter-box' +
      (opts.className ? ' ' + opts.className : '') +
      (opts.silhouette ? ' is-silhouette' : '') +
      (opts.flip ? ' flip' : '');
    const label = opts.silhouette ? 'mystery Pokemon' : p.name;
    return `<span class="${cls}">` +
      `<img class="sprite" src="${DEX.SPRITE(p.spriteId || p.dex)}" alt="${label}" loading="lazy" decoding="async"` +
      ` onerror="this.classList.add('failed');this.nextElementSibling.classList.add('showing')">` +
      `<span class="drawn">${Art.svg(p, { silhouette: false })}</span></span>`;
  }

  let toastTimer = 0;
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1900);
  }

  function show(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === 'screen-' + name));
    window.scrollTo(0, 0);
  }

  /* ---- one overlay, used for study cards, results and little prompts ---- */
  function modal(html) { $('detail-card').innerHTML = html; $('overlay-detail').classList.add('active'); }
  function closeModal() { $('overlay-detail').classList.remove('active'); }
  $('overlay-detail').addEventListener('click', e => { if (e.target.id === 'overlay-detail') closeModal(); });

  /* =======================================================================
     sound (tiny WebAudio blips — same trick as Isa's Typing Quest)
     ======================================================================= */
  let actx = null, muted = false;
  function tone(freq, dur, type, vol) {
    if (muted) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq; g.gain.value = vol || .05;
      o.connect(g); g.connect(actx.destination);
      const t = actx.currentTime; o.start(t);
      g.gain.exponentialRampToValueAtTime(.0001, t + (dur || .12)); o.stop(t + (dur || .12));
    } catch (e) { }
  }
  const sClick = () => tone(680 + Math.random() * 120, .05, 'square', .03);
  const sGood = () => [660, 880, 1100].forEach((f, i) => setTimeout(() => tone(f, .13, 'triangle', .06), i * 80));
  const sBad = () => tone(165, .2, 'sawtooth', .05);
  const sHit = () => { tone(220, .1, 'square', .05); setTimeout(() => tone(150, .16, 'sawtooth', .05), 60); };
  const sSuper = () => { tone(330, .08, 'square', .06); setTimeout(() => tone(520, .1, 'square', .06), 70); setTimeout(() => tone(760, .18, 'square', .06), 140); };
  const sFaint = () => [400, 330, 260, 190].forEach((f, i) => setTimeout(() => tone(f, .2, 'triangle', .06), i * 110));
  const sWin = () => [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => tone(f, .24, 'triangle', .07), i * 130));
  const sLearn = () => [523, 784].forEach((f, i) => setTimeout(() => tone(f, .18, 'sine', .07), i * 120));

  /* =======================================================================
     save file
     ======================================================================= */
  const KEY = 'ipq_save_v1';
  const blank = () => ({ learned: {}, quiz: {}, wins: 0, losses: 0, secret: null, chosen: {} });
  let S = blank();
  function load() {
    try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); }
    catch (e) { S = blank(); }
  }
  /* Save by MERGING with what is already stored, rather than overwriting it.
     Iris's progress is the thing we least want to lose, and a plain overwrite
     can throw it away: if the page is open in a second tab, or was left open
     while she played in another one, that older copy would otherwise stamp its
     out-of-date list of learned Pokemon over the newer one. Un-learning is
     therefore recorded as `false`, not by deleting the key, so that a deliberate
     "I forgot this one" still survives the merge. */
  function save() {
    try {
      let disk = {};
      try { disk = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { }
      const merged = Object.assign({}, disk, S);
      merged.learned = Object.assign({}, disk.learned, S.learned);
      merged.chosen = Object.assign({}, disk.chosen, S.chosen);
      merged.quiz = Object.assign({}, disk.quiz);
      Object.keys(S.quiz || {}).forEach(k => {
        merged.quiz[k] = Math.max(merged.quiz[k] || 0, S.quiz[k] || 0);   // keep the best score
      });
      merged.wins = Math.max(disk.wins || 0, S.wins || 0);
      merged.losses = Math.max(disk.losses || 0, S.losses || 0);
      localStorage.setItem(KEY, JSON.stringify(merged));
      S = merged;
    } catch (e) { }
  }
  load();

  const learnedList = () => POKEMON.filter(p => S.learned[p.id]);
  const learnedIn = r => byRegion(r).filter(p => S.learned[p.id]);

  /* -----------------------------------------------------------------------
     Powers. Every Pokemon knows a long list (see moves.js) but can only take
     four into a battle — so Iris picks which four on the study card, and we
     remember her choice. If she hasn't chosen, it uses the four it came with.
     --------------------------------------------------------------------- */
  const BATTLE_SLOTS = 4;
  function battleMoves(p) {
    const names = S.chosen[p.id];
    if (names && names.length) {
      const all = DEX.learnset(p);
      const picked = names.map(n => all.find(mv => mv.name === n)).filter(Boolean);
      if (picked.length) return picked.slice(0, BATTLE_SLOTS);
    }
    return p.moves;
  }
  function toggleMove(p, name) {
    const current = battleMoves(p).map(mv => mv.name);
    const at = current.indexOf(name);
    if (at >= 0) {
      if (current.length === 1) { toast('Keep at least one power!'); return false; }
      current.splice(at, 1);
    } else {
      if (current.length >= BATTLE_SLOTS) { toast('Only 4 powers fit in a battle'); return false; }
      current.push(name);
    }
    S.chosen[p.id] = current;
    save();
    return true;
  }

  /* =======================================================================
     1. THE SECRET DOOR
     ---------------------------------------------------------------------
     This is a friendly lock, not real security: it keeps a little brother
     out of the page, and the word is stored scrambled so it is not sitting
     in the source code in plain sight. The door re-locks every time the
     page is loaded, which is the whole point.
     ======================================================================= */
  const SECRET_DEFAULT = '864xy8';   // the word Iris chose
  const SECRET_MOM = 'udtg5b';       // Mom's spare key, in case she forgets

  function scramble(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }
  const normWord = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  function secretOk(v) {
    const h = scramble(normWord(v));
    return h === (S.secret || SECRET_DEFAULT) || h === SECRET_MOM;
  }

  let gateTries = 0;
  function tryGate() {
    const v = $('gate-input').value;
    if (secretOk(v)) {
      sGood();
      $('gate-input').value = '';
      $('gate-msg').textContent = '';
      renderHome();
      show('home');
    } else {
      gateTries++;
      sBad();
      $('gate-msg').textContent = gateTries > 2 ? 'Still nope. Only Iris gets in here!' : 'That is not the secret word.';
      $('gate-card').classList.remove('shake');
      void $('gate-card').offsetWidth;
      $('gate-card').classList.add('shake');
      $('gate-input').select();
    }
  }
  $('gate-btn').onclick = tryGate;
  $('gate-input').addEventListener('keydown', e => { if (e.key === 'Enter') tryGate(); });
  setTimeout(() => { try { $('gate-input').focus(); } catch (e) { } }, 300);

  function changeSecret() {
    modal(`
      <h2>Change the secret word</h2>
      <p class="sub">Type a brand new secret word. Don't tell George. 🤫</p>
      <input id="new-secret" type="text" autocomplete="off" autocapitalize="off" spellcheck="false"
             style="width:100%;margin:14px 0 4px;padding:12px;border-radius:14px;border:2.5px solid var(--line);font-size:1.05rem;text-align:center">
      <p class="gate-msg" id="new-secret-msg"></p>
      <button class="big-btn" id="new-secret-save">Save it</button>
      <button class="text-btn" id="new-secret-cancel">Never mind</button>
      <p class="gate-hint">Letters and numbers only. Mom's spare key still works if you forget.</p>`);
    $('new-secret-cancel').onclick = closeModal;
    $('new-secret-save').onclick = () => {
      const w = normWord($('new-secret').value);
      if (w.length < 3) { $('new-secret-msg').textContent = 'Make it at least 3 letters.'; return; }
      S.secret = scramble(w); save(); closeModal(); sLearn();
      toast('New secret word saved 🔒');
    };
    setTimeout(() => { try { $('new-secret').focus(); } catch (e) { } }, 100);
  }

  /* =======================================================================
     2. HOME — pick a region
     ======================================================================= */
  function renderHome() {
    const grid = $('region-grid');
    grid.innerHTML = '';
    REGIONS.forEach(r => {
      const all = byRegion(r.id), got = learnedIn(r.id).length;
      const card = document.createElement('button');
      card.className = 'region-card' + (got === all.length ? ' done' : '');
      card.innerHTML = `
        <span class="rc-emoji">${r.emoji}</span>
        <span class="rc-name">${r.name}</span>
        <span class="rc-count">${got}/${all.length} learned</span>
        <span class="rc-bar"><i style="width:${(got / all.length) * 100}%"></i></span>`;
      card.onclick = () => { sClick(); openDex(r.id); };
      grid.appendChild(card);
    });

    const total = learnedList().length;
    $('home-total').textContent = `${total} of ${POKEMON.length} learned`;

    const badges = [];
    REGIONS.forEach(r => { if (learnedIn(r.id).length === byRegion(r.id).length) badges.push(r.emoji); });
    $('home-badges').innerHTML = badges.length
      ? badges.join(' ') + ' <span style="font-size:.8rem;color:var(--ink-soft);font-weight:800">region badges!</span>'
      : '';

    const canBattle = total >= 3;
    $('home-battle-btn').disabled = !canBattle;
    $('home-quiz-all-btn').disabled = total < 4;
    $('home-battle-note').innerHTML = canBattle
      ? `<p class="sub">Record: <b>${S.wins}</b> wins · ${S.losses} losses</p>`
      : `<p class="sub">Learn <b>${3 - total}</b> more Pokemon to unlock battles.</p>`;
  }

  $('home-battle-btn').onclick = () => { sClick(); openTeamPick(); };
  $('home-quiz-all-btn').onclick = () => { sClick(); startQuiz(null); };
  $('home-secret-btn').onclick = changeSecret;
  $('home-reset-btn').onclick = () => {
    modal(`<h2>Start all over?</h2>
      <p class="sub">This forgets every Pokemon you learned, your quiz scores and your battle record. Your secret word stays.</p>
      <button class="big-btn" id="reset-yes">Yes, wipe it</button>
      <button class="text-btn" id="reset-no">No way</button>`);
    $('reset-no').onclick = closeModal;
    $('reset-yes').onclick = () => {
      const keep = S.secret;
      S = blank(); S.secret = keep;
      // a wipe has to bypass the merge in save(), or the old progress
      // would simply merge straight back in
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
      closeModal(); renderHome(); toast('Fresh start! 🌱');
    };
  };

  /* =======================================================================
     3. POKEDEX — a region's Pokemon
     ======================================================================= */
  let curRegion = 'kanto';

  function openDex(rid) {
    curRegion = rid;
    const r = REGIONS.find(x => x.id === rid);
    $('dex-title').textContent = r.emoji + ' ' + r.name;
    renderDex();
    show('dex');
  }

  function monCard(p, opts) {
    opts = opts || {};
    const b = document.createElement('button');
    b.className = 'mon-card' + (S.learned[p.id] ? ' learned' : '') + (opts.cls || '');
    b.innerHTML =
      `<span class="mc-dex">#${p.dex}${p.legend ? ' ✨' : ''}</span>` +
      (S.learned[p.id] ? '<span class="mc-learned">⭐</span>' : '') +
      pic(p) +
      `<span class="mc-name">${p.name}</span>` +
      typeChips(p);
    return b;
  }

  function renderDex() {
    const list = byRegion(curRegion), got = learnedIn(curRegion).length;
    const grid = $('dex-grid'); grid.innerHTML = '';
    list.forEach(p => {
      const c = monCard(p);
      c.onclick = () => { sClick(); openDetail(p.id); };
      grid.appendChild(c);
    });
    $('dex-count').textContent = `${got}/${list.length} ⭐`;
    const r = REGIONS.find(x => x.id === curRegion);
    const best = S.quiz[curRegion] || 0;
    $('dex-quiz-btn').textContent = `📋 Quiz me on ${r.name}`;
    $('dex-quiz-btn').disabled = got < 4;
    $('dex-quiz-note').innerHTML = got < 4
      ? `<p class="sub">Learn <b>${4 - got}</b> more here and the quiz unlocks.</p>`
      : (best ? `<p class="sub">Your best: <b>${best}/10</b></p>` : '');
  }
  $('dex-back').onclick = () => { sClick(); renderHome(); show('home'); };
  $('dex-quiz-btn').onclick = () => { sClick(); startQuiz(curRegion); };

  /* ---------------- the study card for one Pokemon ---------------- */
  function statRow(label, val, color) {
    return `<div class="stat-row">
      <span class="sr-label">${label}</span>
      <span class="sr-bar"><i style="width:${clamp(val / 110 * 100, 6, 100)}%;background:${color}"></i></span>
      <span class="sr-num">${val}</span></div>`;
  }

  /* the evolution family, with the one you're looking at highlighted */
  function evoBlock(p) {
    const line = DEX.evoLine(p.id);
    if (!line) return '';
    const steps = line.steps.map(s =>
      `<span class="evo-step${s.id === p.id ? ' here' : ''}${s.have ? '' : ' missing'}">${s.name}</span>`);
    const joined = line.label ? steps.join(' ') : steps.join('<span class="evo-arrow">→</span>');
    return `<div class="info-block">
      <h3>🔄 ${line.label || 'Evolution'}</h3>
      <div class="evo-line">${joined}</div>
    </div>`;
  }

  /* all of a Pokemon's powers; the four with a ⚔️ are the ones it battles with */
  function powersHtml(p) {
    const all = DEX.learnset(p);
    const chosen = battleMoves(p).map(mv => mv.name);
    return `<h3>⚡ Powers <span style="font-weight:700;color:var(--ink-soft);font-size:.76rem">
        — ${all.length} of them, tap to pick your ${BATTLE_SLOTS} for battle (${chosen.length}/${BATTLE_SLOTS})</span></h3>
      <div class="move-list">
        ${all.map(mv => `<button class="move-row selectable${chosen.indexOf(mv.name) >= 0 ? ' chosen' : ''}" data-mv="${mv.name}">
          <span class="mv-name">${chosen.indexOf(mv.name) >= 0 ? '⚔️ ' : ''}${mv.name}</span>
          <span class="mv-meta">${typeChip(mv.type)}<span class="mv-power">${mv.power}</span></span>
        </button>`).join('')}
      </div>`;
  }

  function wirePowers(p) {
    $('powers-block').querySelectorAll('.move-row.selectable').forEach(b => {
      b.onclick = () => {
        if (toggleMove(p, b.dataset.mv)) {
          sClick();
          $('powers-block').innerHTML = powersHtml(p);
          wirePowers(p);
        }
      };
    });
  }

  function openDetail(id) {
    const p = byId[id], learned = !!S.learned[id];
    modal(`
      <div class="detail-hero">
        ${pic(p, { className: "bob" })}
        <div>
          <div class="dh-dex">#${p.dex} · ${p.form === 'alola' ? 'Alolan form' : REGIONS.find(r => r.id === p.region).name}${p.legend ? ' · <span class="legend-star">✨ legendary</span>' : ''}</div>
          <div class="dh-name">${p.name}</div>
          ${p.genus ? `<div class="dh-genus">${p.genus}</div>` : ''}
          ${typeChips(p, true)}
        </div>
      </div>

      ${evoBlock(p)}

      <div class="info-block">
        ${statRow('HP', p.hp, '#34b66a')}
        ${statRow('Attack', p.atk, '#e2555a')}
        ${statRow('Defense', p.def, '#3b5bd0')}
        ${statRow('Speed', p.spd, '#f5b700')}
      </div>

      <div class="info-block" id="powers-block">
        ${powersHtml(p)}
      </div>

      <div class="info-block">
        <h3>✨ Abilities</h3>
        ${p.abilities.map(a => {
          const i = a.indexOf('—');
          return `<div class="ability"><b>${i > 0 ? a.slice(0, i).trim() : a}</b>${i > 0 ? ' — ' + a.slice(i + 1).trim() : ''}</div>`;
        }).join('')}
      </div>

      <div class="info-block">
        <h3>💡 Remember this</h3>
        <div class="fact">${p.fact}</div>
      </div>

      <div style="margin-top:16px">
        ${learned
          ? `<p class="sub"><b style="color:var(--good)">⭐ Learned!</b> You can battle with ${p.name}.</p>
             <button class="text-btn" id="detail-unlearn">I forgot this one</button>`
          : `<button class="big-btn green" id="detail-learn">⭐ I learned ${p.name}!</button>`}
        <button class="text-btn" id="detail-close">Close</button>
      </div>`);

    wirePowers(p);
    $('detail-close').onclick = closeModal;
    const learnBtn = $('detail-learn');
    if (learnBtn) learnBtn.onclick = () => {
      S.learned[id] = true; save(); sLearn(); closeModal();
      renderDex(); toast(`${p.name} learned! ⭐`);
    };
    /* asks first — a mis-tap here would quietly throw away real progress */
    const un = $('detail-unlearn');
    if (un) un.onclick = () => {
      un.textContent = 'Really forget ' + p.name + '? Tap again';
      un.style.color = 'var(--bad)';
      un.onclick = () => {
        S.learned[id] = false; save(); closeModal(); renderDex(); toast(`${p.name} un-learned`);
      };
    };
  }

  /* =======================================================================
     4. QUIZ
     ======================================================================= */
  const Q = { pool: [], region: null, list: [], idx: 0, right: 0, streak: 0, best: 0, locked: false };
  const QN = 10;

  function startQuiz(region) {
    const pool = region ? learnedIn(region) : learnedList();
    if (pool.length < 4) { toast('Learn at least 4 Pokemon first!'); return; }
    Q.pool = pool; Q.region = region; Q.idx = 0; Q.right = 0; Q.streak = 0; Q.best = 0; Q.locked = false;
    Q.list = [];
    for (let i = 0; i < QN; i++) Q.list.push(makeQuestion(pool, i));
    $('quiz-title').textContent = region
      ? '📋 ' + REGIONS.find(r => r.id === region).name + ' quiz'
      : '📋 Everything quiz';
    show('quiz');
    renderQuestion();
  }

  const KINDS = ['pic2name', 'name2pic', 'typeName', 'whichType', 'ability', 'silhouette'];

  /* who does this Pokemon turn into next? only asked when we know the answer */
  function nextEvo(p) {
    const line = DEX.evoLine(p.id);
    if (!line || line.label) return null;          // Eevee's branching set doesn't count
    const i = line.steps.findIndex(s => s.id === p.id);
    const nxt = line.steps[i + 1];
    return nxt ? nxt.name : null;
  }

  function makeQuestion(pool, i) {
    let kinds = KINDS.slice();
    if (pool.length >= 6) kinds.push('matchup');
    if (pool.some(nextEvo)) kinds.push('evolve');
    // always start gently, then mix it up
    const kind = i === 0 ? 'pic2name' : choice(kinds);
    const p = choice(pool);
    const others = pool.filter(x => x.id !== p.id);

    if (kind === 'whichType') {
      const right = choice(p.types);
      const wrongTypes = shuffle(Object.keys(TYPE_COLOR).filter(t => p.types.indexOf(t) < 0)).slice(0, 3);
      return { kind, p, answer: right, options: shuffle([right].concat(wrongTypes)) };
    }
    if (kind === 'matchup') {
      const defender = choice(pool);
      const atkTypes = Object.keys(TYPE_COLOR);
      const supers = atkTypes.filter(t => effectiveness(t, defender.types) >= 2);
      const meh = atkTypes.filter(t => effectiveness(t, defender.types) < 2);
      if (!supers.length) return makeQuestion(pool, 1);
      const right = choice(supers);
      return { kind, p: defender, answer: right, options: shuffle([right].concat(sample(meh, 3))) };
    }
    if (kind === 'evolve') {
      const canEvolve = pool.filter(nextEvo);
      const who = choice(canEvolve);
      const right = nextEvo(who);
      // wrong answers: other Pokemon names, never the right one
      const wrong = sample(POKEMON.filter(x => x.name !== right && x.id !== who.id), 3).map(x => x.name);
      return { kind, p: who, answer: right, options: shuffle([right].concat(wrong)) };
    }
    if (kind === 'ability') {
      const ab = choice(p.abilities);
      const name = ab.indexOf('—') > 0 ? ab.slice(0, ab.indexOf('—')).trim() : ab;
      const desc = ab.indexOf('—') > 0 ? ab.slice(ab.indexOf('—') + 1).trim() : '';
      return { kind, p, answer: p.name, abName: name, abDesc: desc, options: shuffle([p].concat(sample(others, 3))) };
    }
    if (kind === 'typeName') return { kind, p, answer: p.name };
    return { kind, p, answer: p.name, options: shuffle([p].concat(sample(others, 3))) };
  }

  function quizHud() {
    $('quiz-qnum').textContent = Math.min(Q.idx + 1, QN) + '/' + QN;
    $('quiz-right').textContent = Q.right;
    $('quiz-best').textContent = Q.best;
    $('quiz-streak').textContent = Q.streak > 1 ? '🔥 ' + Q.streak : '';
    $('quiz-progress').style.width = (Q.idx / QN * 100) + '%';
  }

  function renderQuestion() {
    quizHud();
    if (Q.idx >= QN) { endQuiz(); return; }
    const q = Q.list[Q.idx];
    Q.locked = false;
    const card = $('quiz-card');

    if (q.kind === 'pic2name' || q.kind === 'silhouette') {
      card.innerHTML = `
        <p class="q-prompt">${q.kind === 'silhouette' ? "Who's that Pokemon?" : 'Who is this?'}</p>
        <div class="q-art">${pic(q.p, { silhouette: q.kind === "silhouette" })}</div>
        <div class="q-options two-col">${q.options.map(o => `<button class="opt-btn" data-v="${o.name}">${o.name}</button>`).join('')}</div>
        <div class="q-feedback" id="q-fb"></div>`;
    } else if (q.kind === 'name2pic') {
      card.innerHTML = `
        <p class="q-prompt">Which one is <span style="color:var(--accent)">${q.p.name}</span>?</p>
        <div class="q-options two-col">${q.options.map(o =>
          `<button class="opt-btn pic" data-v="${o.name}">${pic(o)}</button>`).join('')}</div>
        <div class="q-feedback" id="q-fb"></div>`;
    } else if (q.kind === 'typeName') {
      card.innerHTML = `
        <p class="q-prompt">Type this Pokemon's name</p>
        <div class="q-art">${pic(q.p)}</div>
        <div class="type-input">
          <input id="q-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="name…" aria-label="Pokemon name">
          <button class="small-btn" id="q-submit">Go</button>
        </div>
        <div class="q-feedback" id="q-fb"></div>`;
      setTimeout(() => { try { $('q-input').focus(); } catch (e) { } }, 60);
      $('q-submit').onclick = () => answerTyped();
      $('q-input').addEventListener('keydown', e => { if (e.key === 'Enter') answerTyped(); });
    } else if (q.kind === 'whichType') {
      card.innerHTML = `
        <p class="q-prompt">What type is <span style="color:var(--accent)">${q.p.name}</span>?</p>
        <div class="q-art">${pic(q.p)}</div>
        <div class="q-options two-col">${q.options.map(t =>
          `<button class="opt-btn" data-v="${t}" style="border-color:${TYPE_COLOR[t]}">${t}</button>`).join('')}</div>
        <div class="q-feedback" id="q-fb"></div>`;
    } else if (q.kind === 'matchup') {
      card.innerHTML = `
        <p class="q-prompt">Which type is <b>super effective</b> against ${q.p.name}?</p>
        <div class="q-art">${pic(q.p)}</div>
        ${typeChips(q.p, true)}
        <div class="q-options two-col" style="margin-top:10px">${q.options.map(t =>
          `<button class="opt-btn" data-v="${t}" style="border-color:${TYPE_COLOR[t]}">${t}</button>`).join('')}</div>
        <div class="q-feedback" id="q-fb"></div>`;
    } else if (q.kind === 'evolve') {
      card.innerHTML = `
        <p class="q-prompt">What does <span style="color:var(--accent)">${q.p.name}</span> evolve into?</p>
        <div class="q-art">${pic(q.p)}</div>
        <div class="q-options two-col">${q.options.map(n =>
          `<button class="opt-btn" data-v="${n}">${n}</button>`).join('')}</div>
        <div class="q-feedback" id="q-fb"></div>`;
    } else if (q.kind === 'ability') {
      card.innerHTML = `
        <p class="q-prompt">Which Pokemon has the ability<br><span style="color:var(--accent)">${q.abName}</span>?</p>
        <p class="sub" style="margin-bottom:10px">“${q.abDesc}”</p>
        <div class="q-options two-col">${q.options.map(o => `<button class="opt-btn" data-v="${o.name}">${o.name}</button>`).join('')}</div>
        <div class="q-feedback" id="q-fb"></div>`;
    }

    card.querySelectorAll('.opt-btn').forEach(b => { b.onclick = () => answerPicked(b); });
  }

  /* forgiving name matching — one typo is fine */
  function nameMatches(typed, name) {
    const a = normWord(typed), b = normWord(name);
    if (!a) return false;
    if (a === b) return true;
    if (b.length >= 6 && lev(a, b) <= 1) return true;
    return false;
  }
  function lev(a, b) {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i].concat(new Array(b.length).fill(0)));
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    return dp[a.length][b.length];
  }

  function answerTyped() {
    if (Q.locked) return;
    const q = Q.list[Q.idx], v = $('q-input').value;
    if (!normWord(v)) return;
    const ok = nameMatches(v, q.answer);
    $('q-input').disabled = true; $('q-submit').disabled = true;
    finishAnswer(ok, q);
  }

  function answerPicked(btn) {
    if (Q.locked) return;
    const q = Q.list[Q.idx];
    const ok = btn.dataset.v === q.answer;
    const card = $('quiz-card');
    card.querySelectorAll('.opt-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.v === q.answer) b.classList.add('right');
      else if (b === btn) b.classList.add('wrong');
    });
    finishAnswer(ok, q);
  }

  function finishAnswer(ok, q) {
    Q.locked = true;
    const fb = $('q-fb');
    if (ok) {
      Q.right++; Q.streak++; Q.best = Math.max(Q.best, Q.streak); sGood();
      fb.className = 'q-feedback good';
      fb.innerHTML = choice(['Yes! 🎉', 'Nailed it! ⭐', 'Correct! 🔥', 'You knew it! 💫']) +
        `<small>${q.kind === 'matchup' ? `${q.answer} beats ${q.p.types.join('/')}.` : q.p.fact}</small>`;
    } else {
      Q.streak = 0; sBad();
      fb.className = 'q-feedback bad';
      fb.innerHTML = `Not quite — it was <b>${q.answer}</b>.` +
        `<small>${q.kind === 'matchup' ? `${q.answer} is super effective against ${q.p.types.join('/')}.` : q.p.fact}</small>`;
    }
    quizHud();
    setTimeout(() => { Q.idx++; renderQuestion(); }, ok ? 1250 : 2400);
  }

  function endQuiz() {
    $('quiz-progress').style.width = '100%';
    const key = Q.region || 'all';
    const prev = S.quiz[key] || 0;
    const isBest = Q.right > prev;
    if (isBest) { S.quiz[key] = Q.right; save(); }
    if (Q.right >= 8) sWin(); else sGood();

    const stars = Q.right >= 10 ? '⭐⭐⭐⭐⭐' : Q.right >= 8 ? '⭐⭐⭐⭐' : Q.right >= 6 ? '⭐⭐⭐' : Q.right >= 4 ? '⭐⭐' : '⭐';
    $('quiz-card').innerHTML = `
      <p class="q-prompt">Quiz finished!</p>
      <div style="font-size:2.6rem;font-weight:800;color:var(--accent)">${Q.right}/${QN}</div>
      <div style="font-size:1.4rem;letter-spacing:3px;margin:6px 0">${stars}</div>
      <p class="sub">Longest streak: <b>${Q.best}</b>${isBest ? ' · <b style="color:var(--good)">New best score!</b>' : ` · best is ${S.quiz[key]}/10`}</p>
      <div style="margin-top:14px">
        <button class="big-btn" id="quiz-again">Again! 🔁</button>
        <button class="text-btn" id="quiz-home">Back</button>
      </div>`;
    $('quiz-again').onclick = () => startQuiz(Q.region);
    $('quiz-home').onclick = quizExit;
  }

  function quizExit() {
    sClick();
    if (Q.region) { renderDex(); show('dex'); }
    else { renderHome(); show('home'); }
  }
  $('quiz-quit').onclick = quizExit;

  /* =======================================================================
     5. BATTLE
     ======================================================================= */
  const TEAM_MAX = 3;
  let picks = [];

  function openTeamPick() {
    const pool = learnedList();
    if (pool.length < 3) { toast('Learn 3 Pokemon first!'); return; }
    picks = [];
    const grid = $('team-grid'); grid.innerHTML = '';
    pool.forEach(p => {
      const c = monCard(p);
      c.onclick = () => {
        sClick();
        const i = picks.indexOf(p.id);
        if (i >= 0) picks.splice(i, 1);
        else if (picks.length < TEAM_MAX) picks.push(p.id);
        else { toast('Three is the limit!'); return; }
        c.classList.toggle('selected', picks.indexOf(p.id) >= 0);
        $('team-count').textContent = picks.length + '/' + TEAM_MAX;
        $('team-go').disabled = picks.length === 0;
      };
      grid.appendChild(c);
    });
    $('team-count').textContent = '0/' + TEAM_MAX;
    $('team-go').disabled = true;
    show('team');
  }
  $('team-back').onclick = () => { sClick(); renderHome(); show('home'); };
  $('team-go').onclick = () => { sClick(); startBattle(); };

  /* ---- battle state ---- */
  const B = { mine: [], foe: [], mi: 0, fi: 0, busy: false, berry: true, over: false };

  const maxHpOf = p => p.hp + 40;
  function makeFighter(p) { return { p, hp: maxHpOf(p), max: maxHpOf(p) }; }
  const myActive = () => B.mine[B.mi];
  const foeActive = () => B.foe[B.fi];

  const power = p => p.hp + p.atk + p.def + p.spd;

  /* Can my team actually hurt this Pokemon at all? A rival that is immune to
     every move you brought is not a fun battle, so we never pick one. */
  function canHarm(team, foe) {
    return team.some(f => battleMoves(f.p).some(mv => effectiveness(mv.type, foe.types) > 0));
  }

  /* The rival picks from the same Pokemon Iris has learned (that's how she drew
     it), but we aim for a team of similar strength to hers rather than simply
     grabbing the strongest legendaries she happens to have studied. */
  function pickRivalTeam(pool, myTeam) {
    const mine = myTeam.map(f => f.p.id);
    let options = pool.filter(p => canHarm(myTeam, p));
    if (!options.length) options = pool.slice();           // shouldn't happen, but stay safe

    /* Pair each of her Pokemon with a rival of about the same strength, rather
       than matching the team average. Averaging looked fair but wasn't: a team
       of Caterpie plus something decent averages out in the middle, and then
       one middling rival walks through the Caterpie. */
    const used = {};
    return myTeam.map(f => {
      const target = power(f.p);
      const ranked = options.filter(p => !used[p.id])
        .sort((a, b) => Math.abs(power(a) - target) - Math.abs(power(b) - target));
      if (!ranked.length) return choice(options);
      // prefer not to mirror her own pick
      const fresh = ranked.filter(p => mine.indexOf(p.id) < 0);
      const list = fresh.length ? fresh : ranked;
      /* Variety, but only among genuinely comparable Pokemon. Picking freely
         from "the closest four" sounds harmless and isn't: with a small pool
         the fourth-closest can be twice the strength of the first. */
      const band = list.filter(p => Math.abs(power(p) - target) <= Math.max(45, target * 0.2));
      const from = band.length ? band.slice(0, 3) : list.slice(0, 1);
      const pick = choice(from);
      used[pick.id] = 1;
      return pick;
    });
  }

  function startBattle() {
    const pool = learnedList();
    B.mine = picks.map(id => makeFighter(byId[id]));
    B.foe = pickRivalTeam(pool, B.mine).map(makeFighter);
    B.mi = 0; B.fi = 0; B.busy = false; B.berry = true; B.over = false;
    $('battle-record').textContent = `${S.wins}W · ${S.losses}L`;
    renderBattle();
    log(`Your rival sent out <span class="log-hit">${foeActive().p.name}</span>! Go, ${myActive().p.name}!`);
    show('battle');
  }

  function hpClass(f) { const r = f.hp / f.max; return r > .5 ? '' : r > .2 ? ' mid' : ' low'; }

  function hpBox(f, team, idx) {
    const dots = team.map((t, i) => t.hp > 0 ? (i === idx ? '🟢' : '⚪') : '💤').join('');
    return `<div class="hp-name">${f.p.name} ${typeChips(f.p)}</div>
      <div class="hp-track"><i class="hp-fill${hpClass(f)}" style="width:${(f.hp / f.max) * 100}%"></i></div>
      <div class="hp-num">${Math.max(0, Math.round(f.hp))} / ${f.max} HP</div>
      <div class="hp-team">${dots}</div>`;
  }

  function renderBattle() {
    const me = myActive(), foe = foeActive();
    $('my-hp').innerHTML = hpBox(me, B.mine, B.mi);
    $('foe-hp').innerHTML = hpBox(foe, B.foe, B.fi);
    $('my-fighter').innerHTML = pic(me.p, { className: "bob" }) + '<span class="platform"></span>';
    $('foe-fighter').innerHTML = pic(foe.p, { className: "bob", flip: true }) + '<span class="platform"></span>';
    renderMoves();
    $('berry-btn').disabled = !B.berry || B.busy || B.over;
  }

  function renderMoves() {
    const me = myActive();
    $("move-grid").innerHTML = battleMoves(me.p).map((mv, i) =>
      `<button class="move-btn" data-i="${i}" style="background:${TYPE_COLOR[mv.type]}" ${B.busy || B.over ? 'disabled' : ''}>
        <span class="mb-name">${mv.name}</span>
        <span class="mb-meta">${mv.type} · power ${mv.power}</span>
      </button>`).join('');
    $('move-grid').querySelectorAll('.move-btn').forEach(b => {
      b.onclick = () => playerMove(+b.dataset.i);
    });
  }

  function log(html) { $('battle-log').innerHTML = html; }

  function damage(atkF, defF, mv) {
    const eff = effectiveness(mv.type, defF.p.types);
    if (eff === 0) return { dmg: 0, eff, crit: false };
    const crit = Math.random() < 1 / 16;
    // the real games' formula, scaled up so a battle lasts ~4-6 turns
    // instead of dragging on for a dozen
    let d = Math.floor((22 * mv.power * (atkF.p.atk / defF.p.def)) / 50) + 2;
    d = Math.floor(d * eff * rand(.86, 1) * (crit ? 1.5 : 1));
    return { dmg: Math.max(1, d), eff, crit };
  }

  function effWord(eff) {
    if (eff === 0) return ` It doesn't affect it at all…`;
    if (eff >= 4) return ` <span class="log-hit">Massively effective!!</span>`;
    if (eff >= 2) return ` <span class="log-hit">Super effective!</span>`;
    if (eff <= .25) return ` It barely tickled.`;
    if (eff <= .5) return ` Not very effective…`;
    return '';
  }

  function animate(who, cls, ms) {
    const n = $(who === 'mine' ? 'my-fighter' : 'foe-fighter');
    n.classList.add(cls);
    setTimeout(() => n.classList.remove(cls), ms || 420);
  }

  function playerMove(i) {
    if (B.busy || B.over) return;
    B.busy = true; renderMoves(); $('berry-btn').disabled = true;
    const mv = battleMoves(myActive().p)[i];
    const iFirst = myActive().p.spd >= foeActive().p.spd;
    if (iFirst) { doTurn('mine', mv, () => { if (!B.over) doTurn('foe', foeChoice(), endTurn); }); }
    else { doTurn('foe', foeChoice(), () => { if (!B.over) doTurn('mine', mv, endTurn); }); }
  }

  function endTurn() { B.busy = false; renderBattle(); }

  /* the rival is a bit clever: it likes moves that are strong against you */
  function foeChoice() {
    const foe = foeActive(), me = myActive();
    const scored = foe.p.moves.map(mv => {
      const eff = effectiveness(mv.type, me.p.types);
      return { mv, score: mv.power * (eff || .1) + rand(0, 25) };
    }).sort((a, b) => b.score - a.score);
    // not always optimal, so Iris can win
    return (Math.random() < .7 ? scored[0] : choice(scored)).mv;
  }

  function doTurn(side, mv, next) {
    const atkF = side === 'mine' ? myActive() : foeActive();
    const defF = side === 'mine' ? foeActive() : myActive();
    const who = side === 'mine' ? 'You' : 'Rival';

    animate(side, side === 'mine' ? 'attack-mine' : 'attack-foe');
    log(`${who}: <b>${atkF.p.name}</b> used <span class="log-hit">${mv.name}</span>!`);

    setTimeout(() => {
      const r = damage(atkF, defF, mv);
      defF.hp = clamp(defF.hp - r.dmg, 0, defF.max);
      if (r.dmg > 0) {
        animate(side === 'mine' ? 'foe' : 'mine', 'hurt');
        if (r.eff >= 2) sSuper(); else sHit();
      }
      log(`${who}: <b>${atkF.p.name}</b> used <span class="log-hit">${mv.name}</span>!` +
        (r.crit ? ' <span class="log-hit">A critical hit!</span>' : '') + effWord(r.eff));
      renderBattle();

      setTimeout(() => {
        if (defF.hp <= 0) { faint(side === 'mine' ? 'foe' : 'mine', next); }
        else next();
      }, 650);
    }, 420);
  }

  function faint(side, next) {
    const f = side === 'mine' ? myActive() : foeActive();
    sFaint();
    $(side === 'mine' ? 'my-fighter' : 'foe-fighter').classList.add('fainted');
    log(`<b>${f.p.name}</b> is too tired to battle! 💤`);

    setTimeout(() => {
      const team = side === 'mine' ? B.mine : B.foe;
      const nextIdx = team.findIndex(t => t.hp > 0);
      if (nextIdx < 0) { finishBattle(side === 'mine' ? 'lose' : 'win'); return; }
      if (side === 'mine') B.mi = nextIdx; else B.fi = nextIdx;
      $(side === 'mine' ? 'my-fighter' : 'foe-fighter').classList.remove('fainted');
      renderBattle();
      log(side === 'mine'
        ? `Go, <span class="log-hit">${myActive().p.name}</span>!`
        : `Your rival sent out <span class="log-hit">${foeActive().p.name}</span>!`);
      B.busy = false; renderBattle();
    }, 1200);
  }

  $('berry-btn').onclick = () => {
    if (!B.berry || B.busy || B.over) return;
    B.berry = false; B.busy = true; renderMoves();
    const me = myActive();
    const heal = Math.round(me.max * .4);
    me.hp = clamp(me.hp + heal, 0, me.max);
    log(`You gave <b>${me.p.name}</b> an Oran Berry. It recovered <span class="log-hit">${heal} HP</span>!`);
    sLearn(); renderBattle();
    setTimeout(() => { if (!B.over) doTurn('foe', foeChoice(), endTurn); }, 900);
  };

  function finishBattle(result) {
    B.over = true; B.busy = false;
    renderMoves();
    if (result === 'win') { S.wins++; sWin(); } else { S.losses++; sFaint(); }
    save();
    $('battle-record').textContent = `${S.wins}W · ${S.losses}L`;

    const survivors = (result === 'win' ? B.mine : B.foe).filter(f => f.hp > 0);
    modal(`
      <div style="font-size:3rem">${result === 'win' ? '🏆' : '💪'}</div>
      <h2>${result === 'win' ? 'You win!' : 'Your rival won this one'}</h2>
      <p class="sub">${result === 'win'
        ? `${survivors.length} of your Pokemon ${survivors.length === 1 ? 'was' : 'were'} still standing. Record: <b>${S.wins}W · ${S.losses}L</b>`
        : `Try a different team, or learn a Pokemon whose type beats theirs. Record: <b>${S.wins}W · ${S.losses}L</b>`}</p>
      <div style="margin-top:14px">
        <button class="big-btn blue" id="bt-again">Battle again ⚔️</button>
        <button class="text-btn" id="bt-team">Pick a new team</button>
        <button class="text-btn" id="bt-home">Home</button>
      </div>`);
    $('bt-again').onclick = () => { closeModal(); startBattle(); };
    $('bt-team').onclick = () => { closeModal(); openTeamPick(); };
    $('bt-home').onclick = () => { closeModal(); renderHome(); show('home'); };
  }

  $('battle-quit').onclick = () => {
    sClick();
    if (!B.over) { B.over = true; }
    renderHome(); show('home');
  };

  /* =======================================================================
     boot
     ======================================================================= */
  renderHome();
})();
