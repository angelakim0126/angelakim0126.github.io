/* ===========================================================================
   fx.js — what every attack LOOKS like in a battle
   ---------------------------------------------------------------------------
   Iris's note: "the battle needs to look like it — like for Vine Whip, vines
   hit the other Pokemon." And then: "all the attacks".

   So there are two halves here:

     1. A small set of drawing pieces (PIECES below): growing vines, lightning
        bolts, beams, things that fly across, things that fall from the sky,
        claw slashes, chomping jaws, fists, the ground cracking, swirls,
        sparkles, and the attacker itself charging in, flying up or digging.
     2. A big list (RECIPES) that says, for every move in the game by name,
        which pieces it uses and in what colour. Vine Whip grows two vines that
        whip the target; Ember spits three little flames; Earthquake cracks the
        ground and shakes the screen; and so on.

   A move that somehow isn't in the list still gets a look from its type.

   FX.play() returns { hit, end } in milliseconds: when the attack lands (the
   game takes HP away then) and when the whole animation is finished.
   =========================================================================== */
(function () {
  "use strict";

  const NS = 'http://www.w3.org/2000/svg';
  const PI = Math.PI;
  const rnd = (a, b) => Math.random() * (b - a) + a;
  const pick = a => Array.isArray(a) ? a[Math.floor(Math.random() * a.length)] : a;
  let sound = () => { };

  /* ---------------- colours ---------------- */
  const C = {
    fire: '#ff6a1a', water: '#3a9bff', elec: '#ffd400', grass: '#36a845', leaf: '#8fe07a',
    ice: '#8ee6ff', fight: '#d9432b', poison: '#a24fd8', ground: '#c4934a', mud: '#7a5230',
    fly: '#b8d8ff', psy: '#ff58a6', bug: '#9cc32a', rock: '#a88f5a', ghost: '#7a4ad8',
    dragon: '#6c4cff', dark: '#3d2f4a', steel: '#b9c6d8', fairy: '#ff8fd0', white: '#ffffff',
    gold: '#ffd84a', red: '#ff3b3b', wood: '#8a5a2b'
  };
  /* emoji re-coloured with a CSS filter */
  const TINT = {
    blue: 'hue-rotate(190deg) saturate(1.4)', purple: 'hue-rotate(250deg) saturate(1.3)',
    mud: 'sepia(1) saturate(2.4) hue-rotate(-20deg) brightness(.75)', poison: 'hue-rotate(70deg) saturate(1.6)',
    pink: 'hue-rotate(300deg) saturate(1.2)', dark: 'brightness(.35) saturate(.6)', gold: 'sepia(1) saturate(3) brightness(1.1)'
  };

  /* =======================================================================
     tiny DOM helpers
     ======================================================================= */
  function svgEl(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(k => e.setAttribute(k, attrs[k]));
    return e;
  }
  function own(c, el) { c.layer.appendChild(el); c.els.push(el); return el; }
  /* an anchor at (x, y); whatever is inside is centred on that point */
  function spawn(c, p, html) {
    const o = document.createElement('div');
    o.className = 'fx-o';
    o.style.left = p.x + 'px'; o.style.top = p.y + 'px';
    o.innerHTML = html;
    return own(c, o);
  }
  function svgLayer(c) {
    const s = svgEl('svg', { class: 'fx-svg', width: c.W, height: c.H, viewBox: `0 0 ${c.W} ${c.H}` });
    return own(c, s);
  }
  function go(el, frames, dur, opt) {
    opt = opt || {};
    const a = el.animate(frames, { duration: dur, delay: opt.delay || 0, easing: opt.ease || 'ease-out', fill: 'both' });
    if (!opt.keep) a.onfinish = () => el.remove();
    return a;
  }
  function later(c, ms, fn) { c.timers.push(setTimeout(() => { try { fn(); } catch (e) { } }, ms)); }
  function rotPivot(el, p) { el.style.transformBox = 'view-box'; el.style.transformOrigin = `${p.x}px ${p.y}px`; }

  function emojiHTML(e, px, filter) {
    return `<span class="fx-i fx-e" style="font-size:${px}px${filter ? ';filter:' + filter : ''}">${pick(e)}</span>`;
  }
  function orbHTML(col, px) {
    return `<span class="fx-i fx-orb" style="width:${px}px;height:${px}px;--c:${col}"></span>`;
  }
  /* what a flying thing looks like: an emoji, a glowing ball, a spike or a crescent */
  function inner(c, o) {
    const px = (o.px || 34) * (o.sz || 1) * c.s;
    if (o.orb) return orbHTML(o.orb, px * .8);
    if (o.spike) {
      const L = px * 1.5, H = px * .42;
      return `<svg class="fx-i" width="${L}" height="${H}" viewBox="0 0 30 10" style="filter:drop-shadow(0 0 3px ${o.spike})">` +
        `<polygon points="0,1.5 30,5 0,8.5" fill="${o.spike}" stroke="#fff" stroke-width=".8"/></svg>`;
    }
    if (o.cres) {
      return `<svg class="fx-i" width="${px * 1.3}" height="${px * 1.3}" viewBox="0 0 40 40" style="filter:drop-shadow(0 0 5px ${o.cres})">` +
        `<path d="M14 3 A18 18 0 0 1 14 37 A13 15 0 0 0 14 3Z" fill="${o.cres}" stroke="#fff" stroke-width="1.5"/></svg>`;
    }
    return emojiHTML(o.e || '⭐', px, o.filter);
  }
  /* a copy of the attacker's own picture, used when it swoops or pops up */
  function monCopy(c, px, filter) {
    const box = c.aEl.querySelector('.critter-box');
    const html = box ? box.outerHTML.replace(/\bbob\b/, '') : '';
    return `<span class="fx-i fx-copy" style="width:${px}px;height:${px}px${filter ? ';filter:' + filter : ''}">${html}</span>`;
  }

  /* points along a curve from p0 to p1 that bulges up by `arc` pixels */
  function curve(p0, p1, arc, n) {
    const mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2 - arc, pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      pts.push({ x: u * u * p0.x + 2 * u * t * mx + t * t * p1.x, y: u * u * p0.y + 2 * u * t * my + t * t * p1.y });
    }
    return pts;
  }
  /* a zig-zag line, for lightning */
  function zig(a, b, seg, amp) {
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, pts = [a];
    for (let i = 1; i < seg; i++) {
      const t = i / seg, j = rnd(-amp, amp);
      pts.push({ x: a.x + dx * t + nx * j, y: a.y + dy * t + ny * j });
    }
    pts.push(b);
    return pts;
  }

  /* the "pow!" star where something lands */
  function pop(c, p, o) {
    o = o || {};
    const S = 48 * c.s * (o.big ? 1.45 : 1) * (o.sm ? .62 : 1), pts = [];
    for (let i = 0; i < 20; i++) {
      const r = i % 2 ? .42 : 1, a = i / 20 * 2 * PI;
      pts.push((Math.cos(a) * r).toFixed(3) + ',' + (Math.sin(a) * r).toFixed(3));
    }
    const col = o.popc && o.popc !== C.white ? o.popc : '#fff6a8';
    const el = spawn(c, p, `<svg class="fx-i" width="${S}" height="${S}" viewBox="-1.1 -1.1 2.2 2.2">` +
      `<polygon points="${pts.join(' ')}" fill="${col}" stroke="#fff" stroke-width=".1" opacity=".95"/></svg>`);
    go(el, [{ transform: 'scale(.2) rotate(0deg)', opacity: 1 }, { transform: 'scale(1.1) rotate(20deg)', opacity: 1, offset: .35 },
      { transform: 'scale(1.3) rotate(30deg)', opacity: 0 }], 320);
  }
  /* little bits flying out from a point */
  function bits(c, p, o) {
    const k = o.k || 7, R = (o.r || 46) * c.s;
    for (let i = 0; i < k; i++) {
      const a = i / k * 2 * PI + rnd(-.3, .3), r = R * rnd(.7, 1.3);
      const el = spawn(c, p, o.e ? emojiHTML(o.e, (o.px || 18) * c.s, o.filter) : orbHTML(o.c, 9 * c.s));
      go(el, [{ transform: 'translate(0,0) scale(.4)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r}px) scale(1)`, opacity: 1, offset: .6 },
        { transform: `translate(${Math.cos(a) * r * 1.15}px,${Math.sin(a) * r * 1.15 + 12}px) scale(.7)`, opacity: 0 }], o.dur || 560);
    }
  }
  function shakeStage(c, amp, dur) {
    const f = [];
    for (let i = 0; i <= 8; i++) f.push({ transform: i === 0 || i === 8 ? 'none' : `translate(${rnd(-amp, amp)}px,${rnd(-amp * .6, amp * .6)}px)` });
    c.stage.animate(f, { duration: dur });
  }
  function flash(c, col, alpha, dur) {
    const el = document.createElement('div');
    el.className = 'fx-flash';
    el.style.background = col || '#fff';
    own(c, el);
    go(el, [{ opacity: 0 }, { opacity: alpha || .55, offset: .25 }, { opacity: 0 }], dur || 320);
  }
  function glowFighter(el, col, dur) {
    el.animate([{ filter: 'none' }, { filter: `drop-shadow(0 0 12px ${col}) drop-shadow(0 0 4px ${col}) brightness(1.25)`, offset: .4 },
      { filter: 'none' }], { duration: dur || 450 });
  }

  /* =======================================================================
     THE PIECES
     Each one is given the battle layout `c` and its options `o`, and returns
     { hit, end, run }: when it lands, when it is done, and how to draw it.
     ======================================================================= */
  const PIECES = {};

  /* things that fly from the attacker to the target (Ember, Water Gun, Rock
     Throw, Swift...). Lots of them close together make a stream (Flamethrower). */
  PIECES.proj = (c, o) => {
    const n = o.n || 1, gap = o.gap || 110, dur = (o.dur || 430) * (o.fast ? .6 : 1);
    const hit = (n - 1) * gap + dur;
    return {
      hit, end: hit + (o.boom ? dur : 0) + 120, run() {
        sound(o.snd || 'whoosh');
        const auto = !!(o.spike || o.cres);
        for (let i = 0; i < n; i++) {
          const j = o.jit || 0;
          const src = o.from === 'top' ? { x: c.d.x + rnd(-50, 50), y: -40 } : { x: c.a.x + rnd(-j, j) * .4, y: c.a.y + rnd(-j, j) * .4 };
          const dst = { x: c.d.x + rnd(-j, j), y: c.d.y + rnd(-j, j) };
          const el = spawn(c, src, inner(c, o));
          let pts = curve(src, dst, o.arc ? o.arc * (o.n > 1 && !o.fade ? rnd(.6, 1.2) : 1) : 0, 14);
          if (o.boom) pts = pts.concat(curve(dst, src, -(o.arc || 50), 14).slice(1));
          const face = o.face && dst.x > src.x ? ' scaleX(-1)' : '';
          const ang = Math.atan2(dst.y - src.y, dst.x - src.x) * 180 / PI;
          const last = pts.length - 1;
          const fr = pts.map((p, k) => {
            const f = k / last;
            const sc = (o.grow ? .45 + f * .95 : 1) * (o.fade ? 1 + f * .5 : 1);
            const op = k === 0 ? 0 : (o.fade && f > .75 ? Math.max(0, 1 - (f - .75) * 3.2) : 1);
            return { transform: `translate(${p.x - src.x}px,${p.y - src.y}px) rotate(${(auto || o.orient ? ang : 0) + (o.spin || 0) * f}deg) scale(${sc})${face}`, opacity: op };
          });
          go(el, fr, o.boom ? dur * 2 : dur, { delay: i * gap, ease: 'linear' });
          if (!o.fade ? !o.quiet : i === n - 1) later(c, i * gap + dur, () => pop(c, dst, { sm: n > 2, popc: o.popc }));
        }
      }
    };
  };

  /* a straight beam from attacker to target (Hyper Beam, Ice Beam, Psybeam) */
  PIECES.beam = (c, o) => {
    const grow = 200, hold = o.hold || 400, T = grow + hold + 250, w = (o.w || 18) * c.s;
    return {
      hit: grow + 40, end: T, run() {
        sound(o.snd || 'beam');
        const ux = (c.d.x - c.a.x) / c.dist, uy = (c.d.y - c.a.y) / c.dist, off = 26 * c.s;
        const start = { x: c.a.x + ux * off, y: c.a.y + uy * off }, len = Math.max(20, c.dist - off);
        const bg = o.rainbow
          ? 'linear-gradient(180deg,transparent,#ff5a5a 12%,#ffb03a 28%,#fff35a 44%,#5ae07a 58%,#5ab4ff 74%,#b45aff 88%,transparent)'
          : `linear-gradient(180deg,transparent 0%,${o.c} 16%,${o.c2 || '#fff'} 50%,${o.c} 84%,transparent 100%)`;
        const b = document.createElement('div');
        b.className = 'fx-beam';
        b.style.cssText = `left:${start.x}px;top:${start.y - w / 2}px;width:${len}px;height:${w}px;background:${bg};` +
          `box-shadow:0 0 ${w * .8}px ${o.rainbow ? '#fff' : o.c};border-radius:${w}px;transform-origin:0 50%;`;
        own(c, b);
        const R = `rotate(${c.angDeg}deg)`;
        go(b, [{ transform: `${R} scale(0,1)`, opacity: 1 }, { transform: `${R} scale(1,1)`, offset: grow / T },
          { transform: `${R} scale(1,1.3)`, offset: .45 }, { transform: `${R} scale(1,.8)`, offset: .58 },
          { transform: `${R} scale(1,1.15)`, offset: .72, opacity: 1 }, { transform: `${R} scale(1,.1)`, opacity: 0 }], T, { ease: 'linear' });
        const glowAt = (p, sz, d) => {
          const g = spawn(c, p, `<span class="fx-i fx-disc" style="width:${sz}px;height:${sz}px;--c:${o.rainbow ? '#fff' : o.c}"></span>`);
          go(g, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: .2 },
            { transform: 'scale(1.15)', opacity: 1, offset: .8 }, { transform: 'scale(.6)', opacity: 0 }], d);
        };
        glowAt(start, w * 2.2, grow + hold);
        later(c, grow, () => {
          glowAt(c.d, w * 3.2, hold + 100);
          pop(c, c.d, { popc: o.c2 || '#fff' });
          if (o.bits) bits(c, c.d, { e: o.bits, k: 7 });
          if (o.big) shakeStage(c, 6, 300);
        });
      }
    };
  };

  /* VINES — Iris's example. Two vines grow out of the attacker, wind back,
     and whip the target, then pull back in. */
  PIECES.vines = (c, o) => {
    const n = o.n || 2, T = 950, HIT = 500;
    return {
      hit: HIT, end: T + n * 40, run() {
        sound('whoosh');
        later(c, HIT - 40, () => sound('whip'));
        const svg = svgLayer(c);
        const ux = (c.d.x - c.a.x) / c.dist, uy = (c.d.y - c.a.y) / c.dist, px = -uy, py = ux;
        const s0 = { x: c.a.x + ux * 28 * c.s, y: c.a.y + uy * 28 * c.s };
        const thick = (o.thick || 1) * c.s;
        for (let i = 0; i < n; i++) {
          const side = (i % 2 ? -1 : 1) * (1 + Math.floor(i / 2) * .55);
          const bend = Math.min(80, c.dist * .3) * side;
          const tip = { x: c.d.x - ux * 6 + px * side * 10, y: c.d.y - uy * 6 + py * side * 10 };
          const cx = (s0.x + tip.x) / 2 + px * bend, cy = (s0.y + tip.y) / 2 + py * bend;
          const d = `M${s0.x},${s0.y} Q${cx},${cy} ${tip.x},${tip.y}`;
          const g = svgEl('g');
          rotPivot(g, s0);
          g.style.filter = `drop-shadow(0 2px 2px rgba(0,0,0,.25))`;
          const p1 = svgEl('path', { d, fill: 'none', stroke: o.c || '#2b7a30', 'stroke-width': 10 * thick, 'stroke-linecap': 'round' });
          const p2 = svgEl('path', { d, fill: 'none', stroke: o.c2 || '#79d062', 'stroke-width': 3.5 * thick, 'stroke-linecap': 'round' });
          g.appendChild(p1); g.appendChild(p2); svg.appendChild(g);
          const L = p1.getTotalLength();
          const delay = i * 40;
          [p1, p2].forEach(p => {
            p.setAttribute('stroke-dasharray', L + ' ' + L);
            p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0, offset: .38 }, { strokeDashoffset: 0, offset: .72 },
              { strokeDashoffset: L }], { duration: T, delay, easing: 'ease-out', fill: 'both' });
          });
          /* wind up, then SNAP into the target */
          /* how far to swing depends on how long the vine is, so the tip
             always wobbles about the same few pixels around the target */
          const swing = Math.min(10, 1400 / c.dist);
          g.animate([{ transform: 'rotate(0deg)' }, { transform: `rotate(${-swing * side}deg)`, offset: .34 },
            { transform: `rotate(${swing * .35 * side}deg)`, offset: HIT / T }, { transform: 'rotate(0deg)', offset: .64 },
            { transform: 'rotate(0deg)' }], { duration: T, delay, fill: 'both' });
          /* little leaves along the vine, appearing as it grows */
          if (o.leaf !== '') [.3, .55, .8].forEach(t => {
            const pt = p1.getPointAtLength(L * t);
            const lf = svgEl('text', { x: pt.x, y: pt.y, 'font-size': 17 * c.s, 'text-anchor': 'middle', 'dominant-baseline': 'central' });
            lf.textContent = o.leaf || '🍃';
            g.appendChild(lf);
            const on = .38 * t, off = .72 + .28 * (1 - t);
            lf.animate([{ opacity: 0 }, { opacity: 0, offset: on }, { opacity: 1, offset: Math.min(on + .05, .99) },
              { opacity: 1, offset: off - .02 }, { opacity: 0, offset: off }, { opacity: 0 }], { duration: T, delay, fill: 'both' });
          });
        }
        later(c, HIT, () => { pop(c, c.d, { popc: o.popc || '#eaffc8' }); if (o.bits) bits(c, c.d, { e: o.bits, k: 6 }); });
      }
    };
  };

  /* LIGHTNING — from the sky onto the target, or zapping out of the attacker */
  PIECES.bolt = (c, o) => {
    const n = o.n || 1, T = 520, big = o.big || 1;
    return {
      hit: 110, end: T + (n - 1) * 110, run() {
        sound('zap');
        const svg = svgLayer(c);
        const col = o.c || C.elec;
        for (let i = 0; i < n; i++) {
          let from, to;
          if (o.from === 'a') {
            from = { x: c.a.x, y: c.a.y };
            to = o.spread && i > 0
              ? { x: c.a.x + Math.cos(i * 2.2) * 150, y: c.a.y + Math.sin(i * 2.2) * 110 }
              : { x: c.d.x, y: c.d.y };
          } else {
            to = { x: c.d.x + (i ? rnd(-35, 35) : 0), y: c.d.y + (i ? rnd(-20, 20) : 0) };
            from = { x: to.x + rnd(-30, 30), y: Math.min(-10, to.y - 170) };
          }
          const pts = zig(from, to, 8, 15 * c.s * big).map(p => p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
          const g = svgEl('g');
          g.appendChild(svgEl('polyline', { points: pts, fill: 'none', stroke: col, 'stroke-width': 8 * c.s * big, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
          g.appendChild(svgEl('polyline', { points: pts, fill: 'none', stroke: '#fff', 'stroke-width': 2.6 * c.s * big, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
          g.style.filter = `drop-shadow(0 0 7px ${col})`;
          svg.appendChild(g);
          g.animate([{ opacity: 0 }, { opacity: 1, offset: .06 }, { opacity: .15, offset: .18 }, { opacity: 1, offset: .28 },
            { opacity: .4, offset: .48 }, { opacity: 1, offset: .58 }, { opacity: 0 }], { duration: T, delay: i * 110, fill: 'both' });
        }
        if (big > 1.2) flash(c, '#fff8c0', .5, 260);
        later(c, 110, () => { pop(c, c.d, { popc: '#fff7a0', big: big > 1.2 }); bits(c, c.d, { e: '⚡', k: 5, px: 16, r: 50 }); });
      }
    };
  };

  /* things falling from the sky onto the target (Rock Slide, Draco Meteor) */
  PIECES.rain = (c, o) => {
    const n = o.n || 6, gap = o.gap || 75, fall = o.dur || 380;
    return {
      hit: fall, end: (n - 1) * gap + fall + 320, run() {
        sound(o.snd || 'whoosh');
        for (let i = 0; i < n; i++) {
          const land = { x: c.d.x + rnd(-48, 48) * (o.spread || 1), y: c.d.y + rnd(-22, 26) };
          const src = { x: land.x + (o.slant ? -150 * c.dir : rnd(-10, 10)), y: -60 };
          const el = spawn(c, src, inner(c, o));
          const dx = land.x - src.x, dy = land.y - src.y, spin = o.spin != null ? o.spin : rnd(-50, 50);
          go(el, [{ transform: 'translate(0,0) rotate(0deg)', opacity: 1, easing: 'ease-in' },
            { transform: `translate(${dx}px,${dy}px) rotate(${spin}deg)`, opacity: 1, offset: .72 },
            { transform: `translate(${dx}px,${dy - 10}px) rotate(${spin}deg) scale(1.1)`, opacity: 1, offset: .84 },
            { transform: `translate(${dx}px,${dy}px) rotate(${spin}deg) scale(.85)`, opacity: 0 }], fall / .72, { delay: i * gap, ease: 'linear' });
          later(c, i * gap + fall, () => pop(c, land, { sm: 1, popc: o.popc }));
        }
        if (o.shake) later(c, fall, () => shakeStage(c, 6, (n - 1) * gap + 200));
      }
    };
  };

  /* an explosion of colour and bits on the target (or on the attacker) */
  PIECES.burst = (c, o) => {
    return {
      hit: 60, end: 640, run() {
        sound(o.snd || 'boom');
        const p = o.at === 'a' ? c.a : c.d, big = o.big || 1, R = 62 * c.s * big;
        const disc = spawn(c, p, `<span class="fx-i fx-disc" style="width:${R}px;height:${R}px;--c:${o.c}"></span>`);
        go(disc, [{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(1.5)', opacity: .9, offset: .35 },
          { transform: 'scale(2.2)', opacity: 0 }], 560);
        bits(c, p, { e: o.e, c: o.c, k: o.k || (o.e ? 8 : 10), r: 52 * big, px: 20 * Math.min(big, 1.4), filter: o.filter, dur: 600 });
        if (big >= 1.5) { flash(c, o.c, .3, 300); shakeStage(c, 7, 320); }
      }
    };
  };

  /* claw marks across the target (Scratch, Slash, X-Scissor, Leaf Blade). With
     `arc` it is one big curved swipe instead — tails and wings. */
  PIECES.slash = (c, o) => {
    const n = o.x ? 2 : (o.n || 3), rep = o.rep || 1, step = 60, T = 420;
    return {
      hit: 150, end: (rep - 1) * 210 + n * step + T, run() {
        for (let r = 0; r < rep; r++) later(c, r * 210, () => {
          sound('slash');
          const svg = svgLayer(c);
          const L = (o.len || 96) * c.s * (o.big ? 1.3 : 1);
          for (let i = 0; i < n; i++) {
            const deg = o.x ? (i ? 45 : -45) : 52 * c.dir * (r % 2 ? -1 : 1);
            const rad = deg * PI / 180, off = o.x ? 0 : (i - (n - 1) / 2) * 17 * c.s;
            const dx = Math.cos(rad) * L / 2, dy = Math.sin(rad) * L / 2, nx = -Math.sin(rad) * off, ny = Math.cos(rad) * off;
            const x1 = c.d.x - dx + nx, y1 = c.d.y - dy + ny, x2 = c.d.x + dx + nx, y2 = c.d.y + dy + ny;
            let d = `M${x1},${y1} L${x2},${y2}`;
            if (o.arc) {
              const mx = (x1 + x2) / 2 + Math.sin(rad) * L * .38, my = (y1 + y2) / 2 - Math.cos(rad) * L * .38;
              d = `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
            }
            const col = o.c || '#fff';
            const g = svgEl('g');
            const p1 = svgEl('path', { d, fill: 'none', stroke: col, 'stroke-width': (o.arc ? 11 : 6) * c.s * (o.big ? 1.35 : 1), 'stroke-linecap': 'round' });
            const p2 = svgEl('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': 2.2 * c.s, 'stroke-linecap': 'round' });
            g.appendChild(p1); g.appendChild(p2);
            g.style.filter = `drop-shadow(0 0 5px ${col === '#fff' ? '#9cf' : col})`;
            svg.appendChild(g);
            const len = p1.getTotalLength();
            [p1, p2].forEach(p => {
              p.setAttribute('stroke-dasharray', len + ' ' + len);
              p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0, offset: .32 }, { strokeDashoffset: 0, offset: .68 },
                { strokeDashoffset: -len }], { duration: T, delay: i * step, fill: 'both', easing: 'ease-out' });
            });
          }
          later(c, 150, () => { pop(c, c.d, { sm: 1, popc: o.c }); if (o.bits) bits(c, c.d, { e: o.bits, k: 5 }); });
        });
      }
    };
  };

  /* the attacker itself charges into the target (Tackle, Quick Attack,
     Flame Wheel). `e` rides along with it: flames, sparks, water. */
  PIECES.dash = (c, o) => {
    const T = o.fast ? 300 : (o.big ? 540 : 440), frac = o.frac != null ? o.frac : .62;
    return {
      hit: T * .5, end: T + 80, moves: true, run() {
        sound('whoosh');
        const dx = (c.d.x - c.a.x) * frac, dy = (c.d.y - c.a.y) * frac, hop = o.hop ? -70 : 0, spin = o.spin ? 360 * c.dir : 0;
        const glow = o.c ? `drop-shadow(0 0 9px ${o.c}) drop-shadow(0 0 3px ${o.c})` : 'none';
        c.aEl.animate([{ transform: 'translate(0,0)', filter: 'none' },
          { transform: `translate(${-dx * .1}px,${-dy * .1}px)`, filter: glow, offset: .2 },
          { transform: `translate(${dx * .55}px,${dy * .55 + hop}px) rotate(${spin / 2}deg)`, filter: glow, offset: .38 },
          { transform: `translate(${dx}px,${dy}px) rotate(${spin}deg)`, filter: glow, offset: .5 },
          { transform: 'translate(0,0)', filter: 'none' }], { duration: T, easing: 'ease-in-out' });
        if (o.e) for (let k = 0; k < 6; k++) {
          const ox = rnd(-38, 38), oy = rnd(-38, 38);
          const el = spawn(c, c.a, emojiHTML(o.e, 22 * c.s, o.filter));
          go(el, [{ transform: `translate(${ox}px,${oy}px) scale(.4)`, opacity: 0 },
            { transform: `translate(${ox * .6}px,${oy * .6}px) scale(1)`, opacity: 1, offset: .2 },
            { transform: `translate(${dx * .55 + ox}px,${dy * .55 + hop + oy}px)`, opacity: 1, offset: .38 },
            { transform: `translate(${dx + ox}px,${dy + oy}px) scale(1.2)`, opacity: 1, offset: .5 },
            { transform: `translate(${dx + ox * 1.6}px,${dy + oy * 1.6 - 20}px) scale(.6)`, opacity: 0, offset: .8 },
            { transform: `translate(${dx}px,${dy}px) scale(.1)`, opacity: 0 }], T, { ease: 'ease-in-out' });
        }
        later(c, T * .5, () => {
          pop(c, c.d, { popc: o.c, big: o.big });
          sound('punch');
          if (o.big) shakeStage(c, 6, 240);
        });
      }
    };
  };

  /* a fist / foot / hand / hammer slams onto the target */
  PIECES.hit = (c, o) => {
    const n = o.n || 1, gap = o.gap || (o.fast ? 90 : 150), T = o.fast ? 260 : 360;
    return {
      hit: T * .6, end: (n - 1) * gap + T + 120, run() {
        for (let i = 0; i < n; i++) {
          const e = Array.isArray(o.e) ? o.e[i % o.e.length] : o.e;
          const tgt = { x: c.d.x + (n > 1 ? rnd(-24, 24) : 0), y: c.d.y + (n > 1 ? rnd(-20, 20) : 0) };
          let from;
          if (o.from === 'top') from = { x: tgt.x - 10 * c.dir, y: tgt.y - 95 };
          else if (o.from === 'bottom') from = { x: tgt.x - 20 * c.dir, y: tgt.y + 85 };
          else if (o.low) from = { x: tgt.x - 80 * c.dir, y: tgt.y + 40 };
          else from = { x: tgt.x - (c.d.x - c.a.x) * .3, y: tgt.y - (c.d.y - c.a.y) * .3 };
          const px = 48 * c.s * (o.big || 1);
          const fx = from.x - tgt.x, fy = from.y - tgt.y, sp = o.spin ? -220 : 0;
          const el = spawn(c, tgt, emojiHTML(e, px, o.filter));
          go(el, [{ transform: `translate(${fx}px,${fy}px) scale(1.6) rotate(${sp}deg)`, opacity: 0 },
            { transform: `translate(${fx * .5}px,${fy * .5}px) scale(1.4) rotate(${sp / 2}deg)`, opacity: 1, offset: .3 },
            { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1, offset: .6 },
            { transform: 'translate(0,0) scale(1.15) rotate(0deg)', opacity: 1, offset: .76 },
            { transform: 'translate(0,0) scale(.9) rotate(0deg)', opacity: 0 }], T, { delay: i * gap, ease: 'ease-in' });
          later(c, i * gap + T * .6, () => { pop(c, tgt, { popc: o.c, big: o.big > 1.2, sm: n > 2 }); sound('punch'); });
        }
        if (o.big > 1.3) later(c, T * .6, () => shakeStage(c, 7, 260));
      }
    };
  };

  /* JAWS — top and bottom teeth chomp shut on the target (Bite, Crunch, the Fangs) */
  PIECES.jaws = (c, o) => {
    const n = o.n || 1, T = 460, gap = 280;
    return {
      hit: T * .45, end: (n - 1) * gap + T + 80, run() {
        for (let i = 0; i < n; i++) later(c, i * gap, () => {
          sound('chomp');
          const W = 98 * c.s * (o.big ? 1.3 : 1), H = W * .42, k = 5, tw = W / k;
          const teeth = up => {
            let d = up ? `M0,0 H${W} V${H * .35}` : `M0,${H} H${W} V${H * .65}`;
            for (let j = k; j > 0; j--) {
              const x1 = j * tw, xm = x1 - tw / 2, x0 = x1 - tw;
              d += up ? ` L${xm},${H} L${x0},${H * .35}` : ` L${xm},0 L${x0},${H * .65}`;
            }
            const stroke = o.c && o.c !== C.white ? o.c : '#6b6b80';
            return `<svg class="fx-i" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="filter:drop-shadow(0 0 6px ${o.c || '#fff'})">` +
              `<path d="${d}Z" fill="#fff" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/></svg>`;
          };
          const top = spawn(c, { x: c.d.x, y: c.d.y - H * .55 }, teeth(true));
          const bot = spawn(c, { x: c.d.x, y: c.d.y + H * .55 }, teeth(false));
          const close = H * .34;
          go(top, [{ transform: 'translateY(-40px)', opacity: 0 }, { transform: 'translateY(-40px)', opacity: 1, offset: .22 },
            { transform: `translateY(${close}px)`, opacity: 1, offset: .45 }, { transform: `translateY(${close - 3}px)`, opacity: 1, offset: .75 },
            { transform: `translateY(${close - 3}px)`, opacity: 0 }], T, { ease: 'ease-in' });
          go(bot, [{ transform: 'translateY(40px)', opacity: 0 }, { transform: 'translateY(40px)', opacity: 1, offset: .22 },
            { transform: `translateY(${-close}px)`, opacity: 1, offset: .45 }, { transform: `translateY(${-close + 3}px)`, opacity: 1, offset: .75 },
            { transform: `translateY(${-close + 3}px)`, opacity: 0 }], T, { ease: 'ease-in' });
          later(c, T * .45, () => {
            pop(c, c.d, { popc: o.c, sm: 1 });
            if (o.bits) bits(c, c.d, { e: o.bits, k: 6, filter: o.filter });
          });
        });
      }
    };
  };

  /* the ground cracks under the target and the screen shakes (Earthquake).
     `erupt` throws things up out of the ground (Earth Power, Stone Edge). */
  PIECES.quake = (c, o) => {
    const T = o.big ? 820 : 660;
    return {
      hit: 230, end: T + 120, run() {
        sound('rumble');
        shakeStage(c, o.big ? 11 : 6, T);
        const gy = c.d.y + c.dh * .36;
        const svg = svgLayer(c);
        for (let k = 0; k < (o.big ? 5 : 3); k++) {
          const dir = k % 2 ? -1 : 1, len = rnd(55, 110) * c.s;
          const a = { x: c.d.x + rnd(-10, 10), y: gy }, b = { x: a.x + dir * len, y: gy + rnd(-10, 10) };
          const pl = svgEl('polyline', { points: zig(a, b, 6, 6).map(p => p.x + ',' + p.y).join(' '), fill: 'none', stroke: '#4a3218', 'stroke-width': 3.5, 'stroke-linejoin': 'round' });
          svg.appendChild(pl);
          const L = len * 1.3;
          pl.setAttribute('stroke-dasharray', L + ' ' + L);
          pl.animate([{ strokeDashoffset: L, opacity: 1 }, { strokeDashoffset: 0, opacity: 1, offset: .3 }, { strokeDashoffset: 0, opacity: 1, offset: .8 },
            { strokeDashoffset: 0, opacity: 0 }], { duration: T, fill: 'both' });
        }
        for (let k = 0; k < 7; k++) {
          const sz = rnd(26, 44) * c.s;
          const el = spawn(c, { x: c.d.x + rnd(-60, 60), y: gy + rnd(-6, 6) },
            `<span class="fx-i fx-puff" style="width:${sz}px;height:${sz}px;--c:${o.dust || '#c9a46a'}"></span>`);
          go(el, [{ transform: 'translateY(0) scale(.3)', opacity: 0 }, { transform: 'translateY(-14px) scale(1)', opacity: .9, offset: .4 },
            { transform: 'translateY(-30px) scale(1.4)', opacity: 0 }], T, { delay: k * 30 });
        }
        if (o.erupt) {
          const n = o.n || 6;
          for (let k = 0; k < n; k++) {
            const x = c.d.x + rnd(-55, 55), up = rnd(70, 120) * c.s;
            const html = o.e ? emojiHTML(o.e, 26 * c.s, o.filter)
              : o.spikes ? inner(c, { spike: o.erupt, px: 30 }) : orbHTML(o.erupt, 16 * c.s);
            const el = spawn(c, { x, y: gy }, html);
            const rot = o.spikes ? -90 : 0;
            go(el, [{ transform: `translateY(10px) rotate(${rot}deg) scale(.4)`, opacity: 0 },
              { transform: `translateY(${-up}px) rotate(${rot}deg) scale(1.1)`, opacity: 1, offset: .45 },
              { transform: `translateY(${-up * .8}px) rotate(${rot}deg) scale(.9)`, opacity: 0 }], 560, { delay: 120 + k * 45 });
          }
        }
        later(c, 230, () => pop(c, c.d, { sm: 1, popc: o.erupt }));
      }
    };
  };

  /* swirling wind around the target; `tornado` adds a whirlwind (Hurricane, Twister) */
  PIECES.wind = (c, o) => {
    const T = o.big ? 920 : 720;
    return {
      hit: 260, end: T + 60, run() {
        sound('wind');
        const p = o.at === 'a' ? c.a : c.d;
        if (o.tornado) {
          const el = spawn(c, { x: p.x, y: p.y + 8 }, emojiHTML(typeof o.tornado === 'string' ? o.tornado : '🌪️', 74 * c.s * (o.big || 1), o.filter));
          go(el, [{ transform: 'scale(.3) translateX(0)', opacity: 0 }, { transform: 'scale(1) translateX(-9px)', opacity: 1, offset: .25 },
            { transform: 'scale(1.05) translateX(9px)', opacity: 1, offset: .5 }, { transform: 'scale(1) translateX(-9px)', opacity: 1, offset: .75 },
            { transform: 'scale(1.25) translateX(0)', opacity: 0 }], T);
        }
        const svg = svgLayer(c);
        [26, 39, 52].forEach((r0, k) => {
          const r = r0 * c.s * (o.big || 1);
          const ci = svgEl('circle', { cx: p.x, cy: p.y, r, fill: 'none', stroke: o.c || '#fff', 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-dasharray': `${r * 2.3} ${r * 4}` });
          ci.style.filter = 'drop-shadow(0 0 3px rgba(255,255,255,.8))';
          rotPivot(ci, p);
          svg.appendChild(ci);
          const sgn = k % 2 ? -1 : 1;
          ci.animate([{ transform: `rotate(${k * 120}deg) scale(.6)`, opacity: 0 }, { transform: `rotate(${k * 120 + 130 * sgn}deg) scale(.85)`, opacity: .95, offset: .2 },
            { transform: `rotate(${k * 120 + 470 * sgn}deg) scale(1)`, opacity: .95, offset: .75 },
            { transform: `rotate(${k * 120 + 620 * sgn}deg) scale(1.15)`, opacity: 0 }], { duration: T, fill: 'both' });
        });
        if (o.bits) bits(c, p, { e: o.bits, k: 8, r: 60 });
        later(c, 260, () => pop(c, p, { sm: 1, popc: '#fff' }));
      }
    };
  };

  /* rings: psychic waves and sound waves. They travel from the attacker to the
     target, or pulse on the target (`at:'d'`), or squeeze in on it (`squeeze`). */
  PIECES.rings = (c, o) => {
    const n = o.n || 3, gap = o.gap || 120, T = 540;
    const travel = !o.at && !o.squeeze;
    const hit = travel ? T * .8 : 160;
    return {
      hit, end: (n - 1) * gap + T + 80, run() {
        sound(o.snd || (o.sym ? 'sound' : 'psy'));
        for (let i = 0; i < n; i++) {
          const sz = (o.big ? 46 : 34) * c.s;
          const html = `<span class="fx-i fx-ring" style="width:${sz}px;height:${sz}px;--c:${o.c}"></span>`;
          if (travel) {
            const el = spawn(c, c.a, html);
            const dx = c.d.x - c.a.x, dy = c.d.y - c.a.y;
            go(el, [{ transform: 'translate(0,0) scale(.5)', opacity: 0 }, { transform: `translate(${dx * .15}px,${dy * .15}px) scale(.8)`, opacity: 1, offset: .12 },
              { transform: `translate(${dx}px,${dy}px) scale(2.1)`, opacity: .8, offset: .8 }, { transform: `translate(${dx}px,${dy}px) scale(2.6)`, opacity: 0 }],
              T, { delay: i * gap, ease: 'linear' });
            if (o.sym) {
              const s = spawn(c, c.a, emojiHTML(o.sym, 22 * c.s, o.filter));
              const wob = rnd(-30, 30);
              go(s, [{ transform: 'translate(0,0)', opacity: 0 }, { transform: `translate(${dx * .4}px,${dy * .4 + wob}px)`, opacity: 1, offset: .35 },
                { transform: `translate(${dx * .85}px,${dy * .85 - wob}px)`, opacity: 1, offset: .8 }, { transform: `translate(${dx}px,${dy}px) scale(1.3)`, opacity: 0 }],
                T, { delay: i * gap + 40 });
            }
          } else {
            const el = spawn(c, c.d, html);
            const [a, b] = o.squeeze ? [3.2, .5] : [.4, 3];
            go(el, [{ transform: `scale(${a})`, opacity: 0 }, { transform: `scale(${(a + b) / 2})`, opacity: 1, offset: .4 },
              { transform: `scale(${b})`, opacity: 0 }], T, { delay: i * gap });
            if (o.sym && i === 0) bits(c, c.d, { e: o.sym, k: 5, r: 55 });
          }
        }
        later(c, hit, () => pop(c, c.d, { sm: 1, popc: o.c }));
      }
    };
  };

  /* sparkles, stars, hearts popping around the target */
  PIECES.sparkle = (c, o) => {
    const k = o.k || 8, T = 580;
    return {
      hit: 120, end: T + k * 45, run() {
        sound(o.snd || 'sparkle');
        const p = o.at === 'a' ? c.a : c.d, R = (o.r || 50) * c.s;
        for (let i = 0; i < k; i++) {
          const a = rnd(0, 2 * PI), r = k === 1 ? 0 : rnd(.3, 1) * R;
          const el = spawn(c, { x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r - (k === 1 ? 55 * c.s : 0) },
            emojiHTML(o.e || '✨', (o.px || 22) * c.s * (o.big || 1), o.filter));
          go(el, [{ transform: 'scale(0) rotate(-40deg)', opacity: 0 }, { transform: 'scale(1.3) rotate(0deg)', opacity: 1, offset: .35 },
            { transform: 'scale(1) rotate(10deg)', opacity: 1, offset: .7 }, { transform: 'scale(.6) translateY(-12px)', opacity: 0 }],
            k === 1 ? T + 300 : T, { delay: i * 45 });
        }
      }
    };
  };

  /* little glowing balls float from the target back to the attacker (Absorb, Giga Drain) */
  PIECES.drain = (c, o) => {
    const k = o.k || 7, T = 640, gap = 55;
    return {
      hit: 90, end: k * gap + T + 260, run() {
        sound('sparkle');
        pop(c, c.d, { sm: 1, popc: o.c });
        for (let i = 0; i < k; i++) {
          const src = { x: c.d.x + rnd(-25, 25), y: c.d.y + rnd(-25, 25) };
          const pts = curve(src, c.a, rnd(-70, 70), 12);
          const el = spawn(c, src, orbHTML(o.c, (o.big ? 16 : 12) * c.s));
          go(el, pts.map((p, j) => ({ transform: `translate(${p.x - src.x}px,${p.y - src.y}px)`, opacity: j === 0 ? 0 : (j === pts.length - 1 ? 0 : 1) })),
            T, { delay: i * gap, ease: 'ease-in-out' });
        }
        later(c, k * gap + T - 120, () => glowFighter(c.aEl, o.c, 420));
      }
    };
  };

  /* things spiralling around the target (Fire Spin, Whirlpool, Sand Tomb) */
  PIECES.vortex = (c, o) => {
    const k = o.k || 8, T = o.big ? 980 : 820;
    return {
      hit: 320, end: T + 80, run() {
        sound(o.snd || 'wind');
        const p = o.at === 'a' ? c.a : c.d, R0 = (o.r || 60) * c.s * (o.big ? 1.2 : 1);
        for (let i = 0; i < k; i++) {
          const ph = i / k * 2 * PI, fr = [];
          for (let s = 0; s <= 18; s++) {
            const f = s / 18, ang = ph + f * 3 * PI, r = R0 * (1 - .5 * f);
            fr.push({ transform: `translate(${Math.cos(ang) * r}px,${Math.sin(ang) * r * .5 - (o.rise ? f * 40 : 0)}px) scale(${.7 + .5 * Math.sin(f * PI)})`,
              opacity: s === 0 ? 0 : (f > .85 ? (1 - f) * 6 : 1) });
          }
          const el = spawn(c, p, inner(c, { e: o.e, orb: o.orb, px: o.px || 24, filter: o.filter }));
          go(el, fr, T, { ease: 'linear', delay: i * 18 });
        }
        later(c, 320, () => pop(c, p, { sm: 1, popc: o.orb }));
      }
    };
  };

  /* puffs of smoke or gas around the target (Smog, Clear Smog) */
  PIECES.cloud = (c, o) => {
    const k = o.k || 7, T = 780;
    return {
      hit: 200, end: T + k * 40, run() {
        sound('wind');
        const p = o.at === 'a' ? c.a : c.d;
        for (let i = 0; i < k; i++) {
          const sz = rnd(36, 60) * c.s;
          const el = spawn(c, { x: p.x + rnd(-42, 42), y: p.y + rnd(-30, 30) },
            `<span class="fx-i fx-puff" style="width:${sz}px;height:${sz}px;--c:${o.c}"></span>`);
          go(el, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1)', opacity: .9, offset: .35 },
            { transform: 'scale(1.45) translateY(-12px)', opacity: 0 }], T, { delay: i * 40 });
        }
      }
    };
  };

  /* the attacker glows (powering up); with `charge`, light gathers into it first */
  PIECES.glow = (c, o) => {
    const T = o.charge ? 600 : 420;
    return {
      hit: T, end: T, run() {
        const el = o.at === 'd' ? c.dEl : c.aEl, p = o.at === 'd' ? c.d : c.a;
        glowFighter(el, o.c, T + 160);
        if (o.charge) {
          sound('charge');
          for (let i = 0; i < 9; i++) {
            const a = i / 9 * 2 * PI, r = 75 * c.s;
            const b = spawn(c, p, orbHTML(o.c, 10 * c.s));
            go(b, [{ transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r}px) scale(.6)`, opacity: 0 },
              { transform: `translate(${Math.cos(a) * r * .7}px,${Math.sin(a) * r * .7}px) scale(1)`, opacity: 1, offset: .3 },
              { transform: 'translate(0,0) scale(.3)', opacity: 0 }], T * .9, { delay: i * 15, ease: 'ease-in' });
          }
        }
      }
    };
  };

  /* something pointy stabs the target, again and again (horns, beaks, stingers) */
  PIECES.jab = (c, o) => {
    const n = o.n || 3, gap = o.gap || 130, T = 300;
    return {
      hit: T * .55, end: (n - 1) * gap + T + 80, run() {
        const ux = (c.d.x - c.a.x) / c.dist, uy = (c.d.y - c.a.y) / c.dist;
        const px = (o.big ? 46 : 34);
        const half = px * c.s * .75;
        for (let i = 0; i < n; i++) {
          const tip = { x: c.d.x + rnd(-14, 14), y: c.d.y + rnd(-14, 14) };
          const ctr = { x: tip.x - ux * half, y: tip.y - uy * half };
          const el = spawn(c, ctr, inner(c, { spike: o.c || '#fff', px }));
          const back = 70, R = `rotate(${c.angDeg}deg)`;
          go(el, [{ transform: `translate(${-ux * back}px,${-uy * back}px) ${R}`, opacity: 0 },
            { transform: `translate(${-ux * back * .6}px,${-uy * back * .6}px) ${R}`, opacity: 1, offset: .25 },
            { transform: `translate(0,0) ${R}`, opacity: 1, offset: .55 },
            { transform: `translate(${-ux * 12}px,${-uy * 12}px) ${R}`, opacity: 0 }], T, { delay: i * gap, ease: 'ease-in' });
          later(c, i * gap + T * .55, () => { pop(c, tip, { sm: 1, popc: o.c }); sound('punch'); });
        }
      }
    };
  };

  /* the attacker disappears — up into the sky (Fly), down into the ground
     (Dig, Dive) or into the shadows (Phantom Force) — and strikes from there */
  PIECES.vanish = (c, o) => {
    const m = o.m || 'fade', T = 1150, HIT = m === 'up' ? 730 : m === 'down' ? 650 : 620;
    return {
      hit: HIT, end: T, moves: true, run() {
        sound('whoosh');
        const fr = m === 'up'
          ? [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-260px)', opacity: 1, offset: .25 },
            { transform: 'translateY(-260px)', opacity: 0, offset: .26 }, { transform: 'translateY(0)', opacity: 0, offset: .85 },
            { transform: 'translateY(0)', opacity: 1 }]
          : m === 'down'
            ? [{ transform: 'translateY(0) scaleY(1)', opacity: 1 }, { transform: 'translateY(34px) scaleY(.2)', opacity: 0, offset: .22 },
              { transform: 'translateY(0) scaleY(1)', opacity: 0, offset: .85 }, { transform: 'translateY(0) scaleY(1)', opacity: 1 }]
            : [{ opacity: 1, filter: 'none' }, { opacity: 0, filter: 'brightness(0)', offset: .2 }, { opacity: 0, filter: 'brightness(0)', offset: .85 },
              { opacity: 1, filter: 'none' }];
        c.aEl.animate(fr, { duration: T, easing: 'ease-in-out' });
        const sz = 86 * c.s;
        if (m === 'up') {
          const el = spawn(c, c.d, monCopy(c, sz));
          go(el, [{ transform: `translate(${-50 * c.dir}px,-260px) rotate(${20 * c.dir}deg)`, opacity: 1, easing: 'ease-in' },
            { transform: 'translate(0,0) rotate(0deg) scale(1.1)', opacity: 1, offset: .62 },
            { transform: `translate(${30 * c.dir}px,-220px)`, opacity: 0 }], 560, { delay: HIT - 350, ease: 'linear' });
        } else if (m === 'down') {
          later(c, HIT - 120, () => shakeStage(c, 6, 260));
          const el = spawn(c, { x: c.d.x, y: c.d.y + 10 }, monCopy(c, sz, o.filter));
          go(el, [{ transform: 'translateY(80px) scale(.8)', opacity: 0 }, { transform: 'translateY(-26px) scale(1.05)', opacity: 1, offset: .5 },
            { transform: 'translateY(60px) scale(.8)', opacity: 0 }], 520, { delay: HIT - 260 });
          later(c, HIT, () => bits(c, { x: c.d.x, y: c.d.y + c.dh * .3 }, { e: o.e || '🪨', k: 6, px: 16, r: 55, filter: o.filter }));
        } else {
          const el = spawn(c, { x: c.d.x + 55 * c.dir, y: c.d.y - 10 }, monCopy(c, sz, 'brightness(.35) drop-shadow(0 0 8px ' + (o.c || C.ghost) + ')'));
          go(el, [{ transform: 'translateX(0) scale(.8)', opacity: 0 }, { transform: 'translateX(0) scale(1)', opacity: .9, offset: .4 },
            { transform: `translateX(${-50 * c.dir}px) scale(1.05)`, opacity: 1, offset: .65 },
            { transform: `translateX(${-30 * c.dir}px) scale(.9)`, opacity: 0 }], 600, { delay: HIT - 390 });
        }
        later(c, HIT, () => { pop(c, c.d, { big: 1, popc: o.c }); sound('punch'); });
      }
    };
  };

  /* the TARGET gets lifted: floats and wobbles (Psychic) or is thrown (Seismic Toss) */
  PIECES.lift = (c, o) => {
    const T = o.toss ? 950 : 720, HIT = o.toss ? T * .8 : T * .45;
    return {
      hit: HIT, end: T + 40, run() {
        sound(o.toss ? 'whoosh' : 'psy');
        const glow = `drop-shadow(0 0 10px ${o.c}) drop-shadow(0 0 4px ${o.c})`;
        const fr = o.toss
          ? [{ transform: 'none', filter: 'none' }, { transform: `translateY(-70px) rotate(${180 * c.dir}deg)`, filter: glow, offset: .42 },
            { transform: `translateY(-95px) rotate(${360 * c.dir}deg)`, filter: glow, offset: .6 },
            { transform: `translateY(6px) rotate(${360 * c.dir}deg)`, filter: 'none', offset: .8 }, { transform: `rotate(${360 * c.dir}deg)`, filter: 'none' }]
          : [{ transform: 'none', filter: 'none' }, { transform: 'translateY(-24px) rotate(-6deg)', filter: glow, offset: .3 },
            { transform: 'translateY(-28px) rotate(6deg)', filter: glow, offset: .5 }, { transform: 'translateY(-22px) rotate(-4deg)', filter: glow, offset: .7 },
            { transform: 'none', filter: 'none' }];
        c.dEl.animate(fr, { duration: T, easing: 'ease-in-out' });
        if (o.toss) later(c, HIT, () => { pop(c, c.d, { big: 1 }); shakeStage(c, 7, 260); sound('boom'); });
      }
    };
  };

  /* the whole screen lights up for a moment */
  PIECES.flash = (c, o) => ({ hit: 0, end: 320, run() { flash(c, o.c, o.a || .55, 320); } });

  /* =======================================================================
     RECIPES — every move in the game, by name
     ======================================================================= */
  const st = (p, o) => Object.assign({ p }, o || {});
  const P = (e, o) => st('proj', Object.assign({ e }, o));                  // throw an emoji
  const O = (col, o) => st('proj', Object.assign({ orb: col }, o));         // throw a glowing ball
  const SPK = (col, o) => st('proj', Object.assign({ spike: col }, o));     // fire spikes / needles
  const CR = (col, o) => st('proj', Object.assign({ cres: col }, o));       // air blades
  const S = (e, o) => st('proj', Object.assign({ e, n: 12, gap: 42, jit: 18, fade: 1, dur: 400, sz: .85, quiet: 1 }, o));  // stream
  const SO = (col, o) => st('proj', Object.assign({ orb: col, n: 12, gap: 40, jit: 16, fade: 1, dur: 380, sz: .55, quiet: 1 }, o));
  const BM = (col, o) => st('beam', Object.assign({ c: col }, o));
  const VN = o => st('vines', o);
  const BO = o => st('bolt', o);
  const RA = (e, o) => st('rain', Object.assign({ e }, o));
  const RO = (col, o) => st('rain', Object.assign({ orb: col }, o));
  const BU = (col, o) => st('burst', Object.assign({ c: col }, o));
  const SL = (col, o) => st('slash', Object.assign({ c: col }, o));
  const DA = (col, o) => st('dash', Object.assign({ c: col }, o));
  const HI = (e, o) => st('hit', Object.assign({ e }, o));
  const JA = (col, o) => st('jaws', Object.assign({ c: col }, o));
  const QU = o => st('quake', o);
  const WV = o => st('proj', Object.assign({ e: '🌊', px: 60, grow: 1, dur: 620, arc: -10, face: 1, snd: 'splash', popc: '#dff4ff' }, o));
  const WI = (col, o) => st('wind', Object.assign({ c: col }, o));
  const RI = (col, o) => st('rings', Object.assign({ c: col }, o));
  const SP = (e, o) => st('sparkle', Object.assign({ e }, o));
  const DR = (col, o) => st('drain', Object.assign({ c: col }, o));
  const VX = (e, o) => st('vortex', Object.assign({ e }, o));
  const VXO = (col, o) => st('vortex', Object.assign({ orb: col }, o));
  const CL = (col, o) => st('cloud', Object.assign({ c: col }, o));
  const GL = (col, o) => st('glow', Object.assign({ c: col }, o));
  const CH = col => st('glow', { c: col, charge: 1 });
  const JB = (col, o) => st('jab', Object.assign({ c: col }, o));
  const VA = (m, o) => st('vanish', Object.assign({ m }, o));
  const LI = (col, o) => st('lift', Object.assign({ c: col }, o));
  const FL = (col, a) => st('flash', { c: col, a });
  const W = s => Object.assign(s, { par: 1 });   // start at the same time as the step before

  const PSY = [W(LI(C.psy)), RI(C.psy, { at: 'd', n: 3 })];

  const RECIPES = {
    /* ---------------- Grass ---------------- */
    'Vine Whip': [VN({ n: 2 })],
    'Power Whip': [VN({ n: 3, thick: 1.5 })],
    'Absorb': [DR(C.leaf, { k: 5 })],
    'Mega Drain': [DR(C.leaf, { k: 8 })],
    'Giga Drain': [GL(C.grass, { at: 'd' }), DR(C.leaf, { k: 12, big: 1 })],
    'Apple Acid': [P('🍏', { arc: 60 }), BU('#9be03a', { e: '💧', filter: TINT.poison })],
    'Branch Poke': [JB(C.wood, { n: 2 })],
    'Bullet Seed': [P('🌰', { n: 6, gap: 70, dur: 300, sz: .6, jit: 10 })],
    'Drum Beating': [RI(C.grass, { sym: '🥁', n: 3 }), VN({ n: 2, c: '#6b4a2b', c2: '#b98a55', leaf: '' })],
    'Energy Ball': [O(C.leaf, { sz: 1.3 }), BU(C.leaf)],
    'Flower Trick': [P('💐', { arc: 40, spin: 360 }), BU(C.fairy, { e: '🌸' })],
    'Frenzy Plant': [QU({ big: 1, erupt: C.grass, e: '🌿' }), VN({ n: 4, thick: 1.7 })],
    'Grass Pledge': [QU({ erupt: C.grass, e: '🌿', n: 8 })],
    'Grassy Glide': [DA(C.grass, { fast: 1, e: '🌿' })],
    'Grav Apple': [RA('🍎', { n: 1, sz: 2, shake: 1 })],
    'Horn Leech': [JB(C.grass, { n: 1, big: 1 }), DR(C.leaf)],
    'Ivy Cudgel': [VN({ n: 3, thick: 1.3 })],
    'Leaf Blade': [SL(C.leaf, { n: 1, big: 1, bits: '🍃' })],
    'Leaf Storm': [S('🍃', { n: 20, jit: 32, spin: 540 }), WI(C.leaf)],
    'Leaf Tornado': [VX('🍃', { k: 10 }), W(WI(C.leaf, { tornado: 1 }))],
    'Leafage': [P('🍃', { n: 3, gap: 90, spin: 360 })],
    'Magical Leaf': [P('🍃', { n: 4, gap: 90, spin: 720, arc: -40 }), SP('✨', { k: 5 })],
    'Matcha Gotcha': [SO('#7cc24f', { n: 14 }), DR(C.leaf)],
    'Needle Arm': [HI('🌵')],
    'Petal Blizzard': [S('🌸', { n: 18, jit: 34, spin: 400 })],
    'Petal Dance': [VX('🌸', { at: 'a', k: 8 }), S('🌸', { n: 14, spin: 300 })],
    'Razor Leaf': [P('🍃', { n: 5, gap: 70, spin: 900, dur: 340, jit: 12 })],
    'Seed Bomb': [P('🌰', { n: 3, gap: 120, arc: 70 }), BU(C.grass, { e: '🍃' })],
    'Seed Flare': [CH(C.leaf), BU(C.leaf, { big: 2, e: '✨' })],
    'Solar Beam': [CH('#ffe14d'), BM('#fff27a', { w: 26, c2: '#fff', hold: 480 })],
    'Solar Blade': [CH('#ffe14d'), SL('#fff27a', { n: 1, big: 1 })],
    'Syrup Bomb': [P('🍯', { arc: 60 }), BU('#d08a2a', { e: '💧', filter: TINT.gold })],
    'Trailblaze': [DA(C.grass, { e: '🌿' })],
    'Trop Kick': [HI('🦶'), BU(C.fairy, { e: '🌸' })],
    'Wood Hammer': [DA(C.wood, { big: 1 }), HI('🪵', { big: 1.3 })],

    /* ---------------- Normal ---------------- */
    'Tackle': [DA(C.white)],
    'Body Slam': [DA(C.white, { hop: 1, big: 1 }), QU({})],
    'Take Down': [DA(C.white, { big: 1 })],
    'Double-Edge': [DA(C.white, { big: 1 }), BU('#fff')],
    'Headbutt': [DA(C.white)],
    'Giga Impact': [GL('#b48cff'), DA('#b48cff', { big: 1 }), BU('#b48cff', { big: 1.6 })],
    'Quick Attack': [DA(C.white, { fast: 1 })],
    'Extreme Speed': [DA('#fff6a0', { fast: 1 }), SP('💨', { k: 3 })],
    'Rapid Spin': [DA(C.white, { spin: 1 })],
    'Rock Climb': [DA(C.rock)],
    'Facade': [DA('#ffb35a')],
    'Feint': [DA(C.white, { fast: 1 })],
    'Retaliate': [DA('#ff9a5a')],
    'Last Resort': [DA(C.white, { big: 1 }), SP('⭐', { k: 6 })],
    'Multi Attack': [DA('#e0e0ff'), SP('✨', { k: 6 })],
    'Covet': [DA(C.fairy), SP('💖', { k: 4 })],
    'Thrash': [DA(C.red), HI('💥', { n: 3, fast: 1 })],
    'Rage': [GL(C.red), DA(C.red)],
    'Flail': [DA(C.white, { fast: 1 }), HI('💢', { n: 3, fast: 1 })],
    'Strength': [DA(C.white), HI('💪', { big: 1.3 })],
    'Skull Bash': [CH(C.white), DA(C.white, { big: 1 })],
    'Self Destruct': [GL(C.fire), BU(C.fire, { at: 'a', big: 1.5, e: '💥' }), BU(C.fire)],
    'Explosion': [GL(C.fire), BU(C.fire, { at: 'a', big: 2, e: '💥' }), W(FL('#fff', .7)), BU(C.fire, { big: 1.5 })],
    'Pound': [HI('✋')],
    'Double Slap': [HI('✋', { n: 2 })],
    'Chip Away': [HI('✋', { n: 2 })],
    'Comet Punch': [HI('👊', { n: 4, gap: 110 })],
    'Mega Punch': [HI('👊', { big: 1.4 })],
    'Mega Kick': [HI('🦶', { big: 1.4 })],
    'Dizzy Punch': [HI('👊'), SP('💫', { k: 4 })],
    'Smelling Salts': [HI('✋'), SP('⚡', { k: 4 })],
    'Fake Out': [HI('👏', { big: 1.2 })],
    'Stomp': [HI('🦶', { from: 'top' }), QU({})],
    'Scratch': [SL(C.white, { n: 3 })],
    'Fury Swipes': [SL(C.white, { n: 3, rep: 3 })],
    'Cut': [SL(C.white, { n: 1, big: 1 })],
    'False Swipe': [SL(C.white, { n: 1 })],
    'Slash': [SL(C.white, { n: 2, big: 1 })],
    'Crush Claw': [SL(C.white, { n: 3, big: 1 })],
    'Slam': [SL(C.white, { arc: 1, n: 1, big: 1 })],
    'Tail Slap': [SL(C.white, { arc: 1, n: 1, rep: 2 })],
    'Double Hit': [SL(C.white, { arc: 1, n: 1, rep: 2 })],
    'Horn Attack': [JB(C.white, { n: 1, big: 1 })],
    'Fury Attack': [JB(C.white, { n: 4, gap: 100 })],
    'Hyper Drill': [JB(C.white, { n: 4, gap: 70, big: 1 })],
    'Hyper Fang': [JA(C.white, { big: 1 })],
    'Vice Grip': [JA('#c0c0c0')],
    'Wrap': [RI('#d8b98a', { squeeze: 1, n: 4 })],
    'Bind': [RI('#d8b98a', { squeeze: 1, n: 4 })],
    'Constrict': [RI('#b06ad8', { squeeze: 1, n: 4 })],
    'Hyper Beam': [CH('#ffcf3a'), BM('#ffcf3a', { w: 30, big: 1 })],
    'Hidden Power': [VXO('#e0e0ff', { at: 'a', k: 6 }), O('#e0e0ff', { n: 5, gap: 60, sz: .6 })],
    'Swift': [P('⭐', { n: 5, gap: 70, spin: 360, arc: -30 })],
    'Barrage': [O('#e6e6e6', { n: 4, gap: 90, arc: 40, sz: .8 })],
    'Egg Bomb': [P('🥚', { arc: 80, spin: 360 }), BU('#ffd23f')],
    'Pay Day': [P('🪙', { n: 5, gap: 70, arc: 40, spin: 360 })],
    'Population Bomb': [HI('💥', { n: 6, gap: 80, fast: 1 })],
    'Spike Cannon': [SPK('#e8e8e8', { n: 5, gap: 70, dur: 320 })],
    'Weather Ball': [O('#ffe08a', { sz: 1.3, arc: 70 }), BU('#ffe08a')],
    'Tri Attack': [O(C.fire, { arc: 40 }), W(O(C.ice)), W(O(C.elec, { arc: -40 })), BU('#fff')],
    'Secret Power': [O('#e6e6e6'), BU('#e6e6e6')],
    'Echoed Voice': [RI(C.white, { n: 4, sym: '🎵' })],
    'Round': [RI(C.white, { n: 3, sym: '🎵' })],
    'Hyper Voice': [RI(C.white, { n: 4, big: 1, sym: '🔊' })],
    'Boomburst': [RI(C.white, { n: 6, big: 1, sym: '🔊' }), FL('#fff', .4)],
    'Uproar': [RI(C.white, { n: 5, sym: '📢' })],
    'Snore': [RI(C.white, { n: 3, sym: '💤' })],
    'Razor Wind': [CH(C.white), CR(C.white, { n: 3, gap: 100 })],
    'Judgment': [RO('#fff8c0', { n: 8, sz: .7 }), FL('#fff8c0', .4)],
    'Revelation Dance': [DA('#ff9ad5', { frac: 0, spin: 1 }), O('#ff9ad5', { sz: 1.2 })],
    'Tera Blast': [BM('#bdf3ff', { w: 20 }), SP('💎', { k: 5 })],
    'Tera Starstorm': [RA('⭐', { n: 10 }), BM('#bdf3ff', { w: 22 })],
    'Terrain Pulse': [RI('#9ad56a', { n: 3 })],
    'Splash': [DA(C.water, { frac: 0, hop: 1 }), SP('💦', { at: 'a', k: 5 })],
    'Swords Dance': [SP('🗡️', { at: 'a', k: 4 }), DA(C.white)],

    /* ---------------- Fire ---------------- */
    'Ember': [P('🔥', { n: 3, gap: 110, sz: .8 })],
    'Flamethrower': [S('🔥', { n: 16 })],
    'Fire Blast': [P('🔥', { sz: 1.4 }), BU(C.fire, { big: 1.8, e: '🔥', k: 10 })],
    'Fire Spin': [VX('🔥', { k: 9 })],
    'Fire Punch': [HI('👊'), BU(C.fire, { e: '🔥' })],
    'Fire Fang': [JA(C.fire, { bits: '🔥' })],
    'Blaze Kick': [HI('🦶'), BU(C.fire, { e: '🔥' })],
    'Flame Charge': [DA(C.fire, { e: '🔥' })],
    'Flame Wheel': [DA(C.fire, { spin: 1, e: '🔥' })],
    'Flare Blitz': [DA(C.fire, { big: 1, e: '🔥' }), BU(C.fire, { big: 1.5, e: '🔥' })],
    'Incinerate': [S('🔥', { n: 10 }), BU(C.fire, { e: '🔥' })],
    'Lava Plume': [BU(C.fire, { at: 'a', big: 1.6, e: '🔥' }), BU(C.fire, { e: '🔥' })],
    'Heat Wave': [S('🔥', { n: 14, jit: 44 }), WI(C.fire)],
    'Inferno': [VX('🔥', { k: 10 }), BU(C.fire, { e: '🔥', big: 1.3 })],
    'Sacred Fire': [VX('🔥', { k: 10 }), BU('#ffcc33', { e: '✨', big: 1.3 })],
    'Fusion Flare': [O('#fff6d0', { sz: 1.8 }), BU(C.fire, { big: 1.6, e: '🔥' })],
    'Overheat': [CH(C.fire), BM(C.fire, { w: 30, c2: '#fff4a0', big: 1, bits: '🔥' })],
    'Eruption': [BU(C.fire, { at: 'a', big: 1.6, e: '🔥' }), RA('🔥', { n: 7, sz: 1.3 })],
    'Blast Burn': [QU({ big: 1, erupt: C.fire, e: '🔥', n: 8 }), BU(C.fire, { big: 2, e: '🔥' })],
    'Blue Flare': [CH('#3a8bff'), BU('#3a8bff', { big: 2, e: '🔥', filter: TINT.blue })],
    'Burn Up': [GL(C.fire), S('🔥', { n: 18, sz: 1 })],
    'Burning Jealousy': [RI(C.fire, { n: 3 }), BU(C.fire, { e: '🔥' })],
    'Fiery Dance': [VX('🔥', { at: 'a', k: 7 }), P('🔥', { n: 3, gap: 90 })],
    'Fire Lash': [VN({ n: 1, c: '#c2300c', c2: '#ffb03a', leaf: '🔥', thick: 1.2 })],
    'Fire Pledge': [QU({ erupt: C.fire, e: '🔥', n: 8 })],
    'Flame Burst': [O(C.fire, { sz: 1.2 }), BU(C.fire, { e: '🔥' })],
    'Heat Crash': [DA(C.fire, { hop: 1, big: 1 }), QU({}), W(BU(C.fire, { e: '🔥' }))],
    'Magma Storm': [VX('🔥', { k: 14, big: 1 }), W(WI(C.fire))],
    'Mind Blown': [BU(C.fire, { at: 'a', e: '💥' }), O(C.fire, { sz: 1.5 }), BU(C.fire, { big: 1.7, e: '🔥' })],
    'Mystical Fire': [O('#ff7ad0', { sz: 1.2 }), BU('#ff7ad0', { e: '🔥', filter: TINT.pink })],
    'Pyro Ball': [P('🔥', { arc: 80, sz: 1.3, spin: 720 }), BU(C.fire, { e: '🔥', big: 1.4 })],
    'Raging Fury': [DA(C.fire, { e: '🔥' }), VX('🔥', { k: 8 })],
    'Searing Shot': [BU(C.fire, { at: 'a', e: '🔥', big: 1.3 }), O(C.fire, { n: 3, gap: 80 })],
    'Shell Trap': [BU(C.fire, { big: 1.6, e: '💥' })],
    'Temper Flare': [DA(C.fire, { e: '🔥' }), BU(C.fire)],
    'Torch Song': [RI(C.fire, { n: 3, sym: '🎵' }), S('🔥', { n: 8 })],
    'V-create': [CH(C.fire), DA(C.fire, { big: 1, e: '🔥' }), SL(C.fire, { x: 1, big: 1 }), BU(C.fire, { big: 2, e: '🔥' })],
    'Armor Cannon': [O(C.fire, { n: 3, gap: 90, sz: 1.2 }), BU(C.fire, { e: '🔥', big: 1.4 })],
    'Bitter Blade': [SL(C.fire, { n: 1, big: 1, bits: '🔥' }), DR(C.fire, { k: 5 })],

    /* ---------------- Water ---------------- */
    'Water Gun': [S('💧', { n: 9 })],
    'Bubble': [P('🫧', { n: 4, gap: 90, arc: -40 })],
    'Bubble Beam': [S('🫧', { n: 14 })],
    'Hydro Pump': [BM(C.water, { w: 30, c2: '#dff4ff', bits: '💧' })],
    'Hydro Cannon': [CH(C.water), O(C.water, { sz: 2 }), BU(C.water, { big: 1.8, e: '💧' })],
    'Surf': [WV({}), BU(C.water, { e: '💧', snd: 'splash' })],
    'Muddy Water': [WV({ filter: TINT.mud }), BU(C.mud, { e: '💧', filter: TINT.mud, snd: 'splash' })],
    'Sparkling Aria': [S('🫧', { n: 10 }), RI(C.water, { sym: '🎵', n: 3 })],
    'Origin Pulse': [RI(C.water, { n: 4, big: 1 }), BM(C.water, { w: 22 })],
    'Aqua Jet': [DA(C.water, { fast: 1, e: '💧' })],
    'Aqua Step': [DA(C.water, { hop: 1 }), SP('💧', { k: 5 })],
    'Aqua Tail': [SL(C.water, { arc: 1, n: 1, big: 1, bits: '💧' })],
    'Aqua Cutter': [CR(C.water, { n: 2, gap: 110 })],
    'Water Pulse': [O(C.water, { sz: 1.2 }), RI(C.water, { at: 'd' })],
    'Water Shuriken': [P('💠', { n: 3, gap: 90, spin: 1080 })],
    'Brine': [S('💧', { n: 10 }), BU(C.water, { e: '💧', snd: 'splash' })],
    'Octazooka': [O('#33333a', { sz: 1.2 }), CL('#2a2a30')],
    'Razor Shell': [SL(C.water, { x: 1 })],
    'Dive': [VA('down', { e: '💧', c: C.water })],
    'Waterfall': [DA(C.water, { e: '💧' }), RA('💧', { n: 5, gap: 50 })],
    'Scald': [SO('#ff9a6a', { n: 12 }), CL('#ffffff')],
    'Snipe Shot': [P('💧', { fast: 1, sz: 1.3 })],
    'Liquidation': [DA(C.water), BU(C.water, { big: 1.4, e: '💧', snd: 'splash' })],
    'Crabhammer': [HI('🦀', { big: 1.3 }), BU(C.water, { e: '💧' })],
    'Clamp': [JA(C.water)],
    'Fishious Rend': [JA(C.water, { big: 1, bits: '💧' })],
    'Flip Turn': [DA(C.water, { spin: 1 })],
    'Hydro Steam': [BM('#cfe8ff', { w: 26 }), CL('#ffffff')],
    'Jet Punch': [HI('👊', { fast: 1 }), BU(C.water, { e: '💧' })],
    'Steam Eruption': [QU({ erupt: '#ffffff', dust: '#eeeeee' }), CL('#ffffff')],
    'Triple Dive': [VA('down', { e: '💦' }), SP('💦', { k: 4 })],
    'Water Pledge': [QU({ erupt: C.water, e: '💧', n: 8, dust: '#bfe6ff' })],
    'Water Spout': [BU(C.water, { at: 'a', e: '💧' }), RA('💧', { n: 10, gap: 45 })],
    'Wave Crash': [DA(C.water, { big: 1, e: '🌊' }), BU(C.water, { e: '💧' })],
    'Whirlpool': [VX('💧', { k: 10 }), W(WI(C.water))],
    'Chilling Water': [S('💧', { n: 10 }), SP('❄️', { k: 4 })],

    /* ---------------- Electric ---------------- */
    'Thunder Shock': [BO({ from: 'a' })],
    'Thunderbolt': [BO({ big: 1.1 }), SP('⚡', { k: 4 })],
    'Thunder': [FL('#fff8b0', .5), BO({ big: 1.6, n: 2 })],
    'Thunder Punch': [HI('👊'), BO({})],
    'Thunder Fang': [JA(C.elec, { bits: '⚡' })],
    'Spark': [DA(C.elec, { e: '⚡' })],
    'Wild Charge': [DA(C.elec, { e: '⚡' }), BO({})],
    'Volt Tackle': [DA(C.elec, { big: 1, e: '⚡' }), BO({ big: 1.3 })],
    'Discharge': [BO({ from: 'a', spread: 1, n: 5 })],
    'Nuzzle': [DA(C.elec, { frac: .5 }), SP('⚡', { k: 4 })],
    'Charge Beam': [CH(C.elec), BM(C.elec, { w: 12 })],
    'Shock Wave': [BO({ from: 'a', n: 2 })],
    'Electro Ball': [O(C.elec, { sz: 1.3 }), BO({})],
    'Electroweb': [P('🕸️', { sz: 1.5, spin: 180 }), BO({})],
    'Zap Cannon': [O(C.elec, { sz: 1.8 }), BO({ n: 2, big: 1.3 })],
    'Zing Zap': [DA(C.elec, { e: '⚡' })],
    'Parabolic Charge': [BO({ from: 'a', spread: 1, n: 4 }), DR(C.elec, { k: 5 })],
    'Thunder Cage': [RI(C.elec, { squeeze: 1, n: 4 }), BO({})],
    'Thunderclap': [BO({ big: 1.2 })],
    'Fusion Bolt': [DA(C.elec, { big: 1 }), BO({ big: 1.4 })],
    'Bolt Strike': [DA(C.elec, { big: 1, e: '⚡' }), BO({ big: 1.6 })],
    'Bolt Beak': [JB(C.elec, { n: 1, big: 1 }), BO({})],
    'Aura Wheel': [DA(C.elec, { spin: 1, e: '⚡' })],
    'Double Shock': [CH(C.elec), DA(C.elec, { big: 1 }), BO({ big: 1.5 })],
    'Electro Drift': [DA(C.elec, { fast: 1, e: '⚡' }), BO({})],
    'Electro Shot': [CH(C.elec), BM(C.elec, { w: 24 })],
    'Plasma Fists': [HI('👊', { n: 2 }), BO({})],
    'Rising Voltage': [QU({ erupt: C.elec, e: '⚡' }), BO({ big: 1.3 })],
    'Supercell Slam': [DA(C.elec, { hop: 1, big: 1 }), BO({ big: 1.3 })],
    'Volt Switch': [O(C.elec), BO({})],
    'Wildbolt Storm': [WI(C.elec, { tornado: 1 }), BO({ n: 3 })],

    /* ---------------- Ice ---------------- */
    'Ice Beam': [BM(C.ice, { w: 16, bits: '❄️' })],
    'Aurora Beam': [BM('#9af', { rainbow: 1, w: 18 })],
    'Blizzard': [S('❄️', { n: 22, jit: 44 }), WI(C.ice, { big: 1.2 })],
    'Powder Snow': [S('❄️', { n: 10, sz: .6 })],
    'Ice Shard': [P('🧊', { n: 2, gap: 80, fast: 1 })],
    'Icy Wind': [S('❄️', { n: 12, jit: 34 }), WI(C.ice)],
    'Ice Punch': [HI('👊'), SP('❄️', { k: 6 })],
    'Ice Fang': [JA(C.ice, { bits: '❄️' })],
    'Icicle Crash': [RA('🧊', { n: 5, sz: 1.4, shake: 1 })],
    'Icicle Spear': [SPK(C.ice, { n: 4, gap: 80 })],
    'Avalanche': [RA('🧊', { n: 7, shake: 1 })],
    'Frost Breath': [SO(C.ice, { n: 12 }), SP('❄️', { k: 5 })],
    'Freeze-Dry': [O(C.ice, { sz: 1.2 }), SP('❄️', { k: 8 })],
    'Triple Axel': [HI('🦶', { n: 3, spin: 1 }), SP('❄️', { k: 5 })],
    'Glaciate': [RA('🧊', { n: 6 }), W(WI(C.ice))],
    'Ice Ball': [DA(C.ice, { spin: 1 })],
    'Ice Hammer': [HI('🔨', { from: 'top', big: 1.3, filter: TINT.blue }), SP('❄️', { k: 5 })],
    'Ice Spinner': [DA(C.ice, { spin: 1 }), SP('❄️', { k: 4 })],
    'Ice Burn': [CH(C.ice), BM(C.ice, { w: 26, c2: '#fff', bits: '🔥' })],

    /* ---------------- Fighting ---------------- */
    'Karate Chop': [HI('✋', { from: 'top' })],
    'Low Kick': [HI('🦶', { low: 1 })],
    'Low Sweep': [HI('🦶', { low: 1 }), SL(C.white, { n: 1, arc: 1 })],
    'Double Kick': [HI('🦶', { n: 2 })],
    'Triple Kick': [HI('🦶', { n: 3 })],
    'Jump Kick': [HI('🦶', { from: 'top' })],
    'High Jump Kick': [HI('🦶', { from: 'top', big: 1.5 })],
    'Rolling Kick': [HI('🦶', { spin: 1 })],
    'Axe Kick': [HI('🦶', { from: 'top', big: 1.3 })],
    'Mach Punch': [HI('👊', { fast: 1 })],
    'Bullet Punch': [HI('👊', { n: 3, fast: 1, filter: 'grayscale(1) brightness(1.3)' })],
    'Arm Thrust': [HI('✋', { n: 3, gap: 110 })],
    'Force Palm': [HI('✋'), RI('#5aa0ff', { at: 'd', n: 2 })],
    'Brick Break': [HI('✋', { from: 'top' }), BU('#c58a4a', { e: '🧱' })],
    'Rock Smash': [HI('👊'), BU(C.rock, { e: '🪨' })],
    'Drain Punch': [HI('👊'), DR(C.leaf)],
    'Power Up Punch': [HI('👊'), GL(C.fight)],
    'Dynamic Punch': [HI('👊', { big: 1.4 }), BU(C.fire, { big: 1.4 }), SP('💫', { k: 4 })],
    'Focus Punch': [CH(C.fight), HI('👊', { big: 1.7 })],
    'Hammer Arm': [HI('💪', { from: 'top', big: 1.4 })],
    'Sky Uppercut': [HI('👊', { from: 'bottom', big: 1.2 }), LI(C.fight)],
    'Close Combat': [HI(['👊', '🦶'], { n: 6, gap: 85, fast: 1 })],
    'Superpower': [GL(C.fight), HI('💪', { big: 1.5 })],
    'Cross Chop': [SL(C.fight, { x: 1, big: 1 })],
    'Seismic Toss': [LI(C.fight, { toss: 1 })],
    'Vital Throw': [LI(C.fight, { toss: 1 })],
    'Circle Throw': [LI(C.fight, { toss: 1 })],
    'Storm Throw': [LI(C.fight, { toss: 1 })],
    'Submission': [DA(C.fight), LI(C.fight, { toss: 1 })],
    'Aura Sphere': [CH('#3a8bff'), O('#3a8bff', { sz: 1.4 }), BU('#3a8bff')],
    'Focus Blast': [CH('#ffb43a'), O('#ffb43a', { sz: 1.7 }), BU('#ffb43a', { big: 1.5 })],
    'Vacuum Wave': [RI('#bfe3ff', { n: 2 })],
    'Body Press': [DA(C.white, { hop: 1, big: 1 }), QU({})],
    'Collision Course': [DA(C.fight, { big: 1 }), BU(C.fire, { big: 1.6 })],
    'Flying Press': [VA('up')],
    'Meteor Assault': [DA(C.fight, { big: 1 }), BU('#ffb43a', { big: 1.4 })],
    'Sacred Sword': [SL('#cfe8ff', { n: 1, big: 1 }), SP('✨', { k: 4 })],
    'Secret Sword': [SL('#a6e3ff', { x: 1, big: 1 })],
    'Revenge': [GL(C.red), HI('👊', { big: 1.2 })],
    'Upper Hand': [HI('✋', { fast: 1, from: 'bottom' })],
    'Wake Up Slap': [HI('✋'), SP('💢', { k: 3 })],

    /* ---------------- Poison ---------------- */
    'Poison Sting': [SPK(C.poison)],
    'Acid': [O('#a7e04a', { n: 3, gap: 90, arc: 40, sz: .8 }), BU('#a7e04a', { e: '💧', filter: TINT.poison })],
    'Acid Spray': [SO('#a7e04a', { n: 12 })],
    'Poison Fang': [JA(C.poison, { bits: '💜' })],
    'Sludge': [O(C.poison, { arc: 50, sz: 1.2 }), BU(C.poison)],
    'Sludge Bomb': [O(C.poison, { n: 2, gap: 120, arc: 70, sz: 1.4 }), BU(C.poison, { big: 1.3 })],
    'Sludge Wave': [WV({ filter: TINT.purple }), BU(C.poison)],
    'Venoshock': [SO(C.poison, { n: 12 }), BU(C.poison)],
    'Cross Poison': [SL(C.poison, { x: 1 })],
    'Poison Jab': [JB(C.poison, { n: 2 })],
    'Poison Tail': [SL(C.poison, { arc: 1, n: 1, big: 1 })],
    'Gunk Shot': [O('#7d3aa8', { sz: 1.7, arc: 40 }), BU(C.poison, { big: 1.6, e: '💜' })],
    'Smog': [CL('#9b6fc0')],
    'Clear Smog': [CL('#c8c8dc')],
    'Belch': [RI('#a7c04a', { n: 2 }), CL('#a7c04a')],
    'Barb Barrage': [SPK(C.poison, { n: 4, gap: 80 })],
    'Dire Claw': [SL(C.poison, { n: 3, big: 1 })],
    'Malignant Chain': [P('⛓️', { spin: 360 }), RI(C.poison, { squeeze: 1, n: 3 })],
    'Mortal Spin': [DA(C.poison, { spin: 1 }), CL(C.poison)],

    /* ---------------- Ground ---------------- */
    'Earthquake': [QU({ big: 1 })],
    'Magnitude': [QU({ big: 1 })],
    'Bulldoze': [QU({})],
    'Fissure': [QU({ big: 1 })],
    'Earth Power': [QU({ erupt: '#ff8a2a', n: 7 })],
    "Land's Wrath": [QU({ erupt: C.ground, e: '🪨', n: 7 })],
    'Thousand Arrows': [QU({ erupt: C.ground, spikes: 1, n: 9 })],
    'Thousand Waves': [QU({ big: 1 }), WV({ filter: TINT.mud })],
    'Precipice Blades': [QU({ big: 1, erupt: '#ff5a1a', spikes: 1, n: 9 })],
    'Headlong Rush': [DA(C.ground, { big: 1 }), QU({})],
    'High Horsepower': [DA(C.ground, { big: 1 }), QU({})],
    'Stomping Tantrum': [HI('🦶', { n: 3, from: 'top', fast: 1 }), QU({})],
    'Dig': [VA('down')],
    'Drill Run': [DA(C.ground, { spin: 1, fast: 1 }), BU(C.ground, { e: '🪨' })],
    'Bone Club': [P('🦴', { spin: 720 })],
    'Bone Rush': [P('🦴', { n: 3, gap: 100, spin: 720 })],
    'Bonemerang': [P('🦴', { boom: 1, spin: 1080, arc: 50 })],
    'Mud-Slap': [O(C.mud, { n: 2, gap: 70, sz: .8 }), BU(C.mud, { e: '💧', filter: TINT.mud })],
    'Mud Shot': [O(C.mud, { n: 3, gap: 90 })],
    'Mud Bomb': [O(C.mud, { arc: 60, sz: 1.3 }), BU(C.mud)],
    'Sand Tomb': [VXO('#e0c27a', { k: 14 })],
    'Sandsear Storm': [WI('#e0a85a', { tornado: 1 }), VXO('#ffb35a', { k: 10 })],
    'Scorching Sands': [SO('#ffb35a', { n: 14 })],

    /* ---------------- Flying ---------------- */
    'Gust': [CR(C.white, { n: 2, gap: 100 }), WI(C.white)],
    'Hurricane': [WI('#cfe6ff', { tornado: 1, big: 1.4 })],
    'Air Cutter': [CR(C.white, { n: 2, gap: 90 })],
    'Air Slash': [CR('#dff0ff', { n: 3, gap: 90, sz: 1.2 })],
    'Wing Attack': [SL(C.fly, { arc: 1, n: 1 }), P('🪶', { n: 3, gap: 60, spin: 200 })],
    'Steel Wing': [SL(C.steel, { arc: 1, n: 1, big: 1 })],
    'Dual Wingbeat': [SL(C.fly, { arc: 1, n: 1, rep: 2 })],
    'Peck': [JB('#ffb84a', { n: 2 })],
    'Drill Peck': [JB('#ffb84a', { n: 4, gap: 80, big: 1 })],
    'Pluck': [JB('#ffb84a', { n: 1 }), SP('🫐', { k: 1 })],
    'Aerial Ace': [DA(C.fly, { fast: 1 }), SL(C.white, { n: 1 })],
    'Acrobatics': [DA(C.fly, { hop: 1, spin: 1 })],
    'Fly': [VA('up')],
    'Bounce': [VA('up')],
    'Sky Drop': [LI(C.fly, { toss: 1 })],
    'Brave Bird': [DA('#ff7a3a', { big: 1, e: '🪶' }), BU('#ff7a3a', { big: 1.3 })],
    'Sky Attack': [CH('#fff4a0'), DA('#fff4a0', { big: 1, fast: 1 })],
    'Aeroblast': [CH('#bfe0ff'), BM('#bfe0ff', { w: 26 }), WI('#bfe0ff')],
    'Oblivion Wing': [BM('#e0305a', { w: 20 }), DR('#e0305a')],
    'Dragon Ascent': [VA('up'), BU(C.dragon, { big: 1.4 })],
    'Beak Blast': [CH(C.fire), JB(C.fire, { n: 1, big: 1 }), BU(C.fire, { e: '🔥' })],
    'Chatter': [RI(C.white, { n: 4, sym: '🎵' })],
    'Bleakwind Storm': [WI('#a6d8ff', { tornado: 1, big: 1.2 }), S('❄️', { n: 10, jit: 40 })],

    /* ---------------- Psychic ---------------- */
    'Confusion': PSY,
    'Psychic': [W(LI(C.psy)), RI(C.psy, { at: 'd', n: 4, big: 1 })],
    'Psybeam': [BM(C.psy, { rainbow: 1, w: 16 })],
    'Psywave': [RI(C.psy, { n: 4 })],
    'Extrasensory': [GL(C.psy), RI(C.psy, { n: 3, sym: '👁️' })],
    'Psyshock': [O(C.psy, { n: 4, gap: 70 })],
    'Psystrike': [RI(C.psy, { n: 5, big: 1 }), W(LI(C.psy)), FL(C.psy, .3)],
    'Psycho Cut': [CR(C.psy, { sz: 1.4 })],
    'Psyblade': [SL(C.psy, { n: 1, big: 1 })],
    'Zen Headbutt': [GL(C.psy), DA(C.psy)],
    'Psychic Fangs': [JA(C.psy)],
    'Heart Stamp': [HI('💗', { big: 1.2 })],
    'Dream Eater': [CL('#c8a8ff'), DR(C.psy)],
    'Future Sight': [GL(C.psy), RO(C.psy, { n: 1, sz: 2.2 }), BU(C.psy, { big: 1.4 })],
    'Expanding Force': [RI(C.psy, { n: 4, big: 1, at: 'd' }), W(LI(C.psy))],
    'Hyperspace Hole': [RI('#9a5aff', { squeeze: 1, n: 4 }), VA('fade', { c: '#9a5aff' })],
    'Lumina Crash': [BM('#ffd0f0', { rainbow: 1, w: 22 })],
    'Luster Purge': [O('#fff0a0', { sz: 1.6 }), BU('#fff0a0', { big: 1.3 })],
    'Mist Ball': [O('#ffc0e0', { sz: 1.5 }), CL('#ffe0f0')],
    'Mystical Power': [RI(C.psy, { n: 3 }), BU(C.psy)],
    'Photon Geyser': [CH('#fff8c0'), BM('#fff8c0', { w: 32, big: 1 }), FL('#fff8c0', .5)],
    'Prismatic Laser': [CH('#fff'), BM('#fff', { rainbow: 1, w: 30, big: 1 }), FL('#fff', .4)],
    'Psychic Noise': [RI(C.psy, { n: 4, sym: '🎵' })],
    'Psycho Boost': [CH(C.psy), O(C.psy, { sz: 2 }), BU(C.psy, { big: 1.7 })],
    'Stored Power': [GL(C.psy), O(C.psy, { n: 3, gap: 80 })],
    'Synchronoise': [RI(C.psy, { n: 5, at: 'd' })],

    /* ---------------- Bug ---------------- */
    'X-Scissor': [SL(C.bug, { x: 1 })],
    'Fury Cutter': [SL(C.bug, { n: 1, rep: 3 })],
    'Bug Bite': [JA(C.bug)],
    'Bug Buzz': [RI(C.bug, { n: 4, big: 1 })],
    'Signal Beam': [BM(C.bug, { rainbow: 1, w: 14 })],
    'Silver Wind': [S('✨', { n: 16, jit: 30 }), WI('#e6e6f0')],
    'Leech Life': [JB(C.bug, { n: 1 }), DR('#ff4a5a')],
    'Megahorn': [DA(C.bug), JB(C.bug, { n: 1, big: 1 })],
    'Pin Missile': [SPK(C.bug, { n: 5, gap: 70, dur: 320 })],
    'Twineedle': [SPK(C.bug, { n: 2, gap: 90 })],
    'Fell Stinger': [JB(C.bug, { n: 1, big: 1 })],
    'Attack Order': [S('🐝', { n: 10, jit: 34, sz: .8, fade: 0, quiet: 0, dur: 460 })],
    'Infestation': [VX('🐛', { k: 7 })],
    'Struggle Bug': [SO(C.bug, { n: 9 })],
    'Lunge': [DA(C.bug)],
    'Pounce': [DA(C.bug, { hop: 1 })],
    'First Impression': [DA(C.bug, { fast: 1 }), BU(C.bug)],
    'Skitter Smack': [VA('fade', { c: C.bug })],
    'Steamroller': [DA(C.bug, { spin: 1, big: 1 })],
    'U-turn': [DA(C.bug, { fast: 1 })],
    'Pollen Puff': [O('#ffe14d', { arc: 70, sz: 1.3 }), BU('#ffe14d', { e: '🌼' })],

    /* ---------------- Rock ---------------- */
    'Rock Throw': [P('🪨', { n: 2, gap: 120, arc: 70 })],
    'Rock Slide': [RA('🪨', { n: 7, shake: 1 })],
    'Rock Tomb': [RA('🪨', { n: 4, sz: 1.4, spread: .8 })],
    'Rock Blast': [P('🪨', { n: 4, gap: 90 })],
    'Rock Wrecker': [P('🪨', { sz: 2.2, arc: 40 }), BU(C.rock, { big: 1.7, e: '🪨' })],
    'Stone Edge': [QU({ erupt: C.rock, spikes: 1, n: 8 })],
    'Ancient Power': [VX('🪨', { at: 'a', k: 5 }), P('🪨', { n: 4, gap: 70 })],
    'Power Gem': [BM('#ff5ac8', { w: 12 }), SP('💎', { k: 5 })],
    'Diamond Storm': [RA('💎', { n: 9 })],
    'Head Smash': [DA(C.rock, { big: 1 }), BU(C.rock, { big: 1.6, e: '🪨' })],
    'Meteor Beam': [CH('#c79aff'), BM('#c79aff', { w: 28, big: 1 })],
    'Rollout': [DA(C.rock, { spin: 1 })],
    'Accelerock': [DA(C.rock, { fast: 1 })],
    'Smack Down': [P('🪨', { arc: 60 }), QU({})],
    'Salt Cure': [RO('#ffffff', { n: 10, sz: .4 }), SP('✨', { k: 5 })],
    'Stone Axe': [SL(C.rock, { n: 1, big: 1 }), RA('🪨', { n: 3 })],
    'Mighty Cleave': [SL(C.rock, { n: 1, big: 1, len: 130 })],

    /* ---------------- Ghost ---------------- */
    'Shadow Ball': [O(C.ghost, { sz: 1.5 }), BU(C.ghost)],
    'Shadow Claw': [SL(C.ghost, { n: 3, big: 1 })],
    'Shadow Punch': [HI('👊', { filter: TINT.purple })],
    'Shadow Sneak': [VA('fade')],
    'Shadow Force': [VA('fade'), BU(C.ghost, { big: 1.6 })],
    'Phantom Force': [VA('fade')],
    'Shadow Bone': [P('🦴', { spin: 720, filter: TINT.purple }), BU(C.ghost)],
    'Lick': [HI('👅')],
    'Astonish': [VA('fade'), SP('👻', { k: 1 })],
    'Night Shade': [BM('#3a2a5a', { w: 22, c2: '#a35aff' })],
    'Hex': [RI(C.ghost, { squeeze: 1, n: 3 }), CL('#6a4a98')],
    'Ominous Wind': [WI(C.ghost), S('👻', { n: 4, fade: 0, quiet: 0 })],
    'Infernal Parade': [VX('🔥', { k: 8, filter: TINT.purple })],
    'Bitter Malice': [CL('#4a3a6a'), SP('👻', { k: 3 })],
    'Last Respects': [RA('👻', { n: 5 })],
    'Moongeist Beam': [CH('#a35aff'), BM('#a35aff', { w: 30, big: 1 })],
    'Poltergeist': [P('🪑', { arc: 70, spin: 540 }), BU(C.ghost)],
    'Rage Fist': [GL(C.red), HI('👊', { big: 1.3, filter: TINT.purple })],
    'Spectral Thief': [VA('fade'), DR(C.ghost)],
    'Spirit Shackle': [P('🏹', { fast: 1, orient: 0 }), RI(C.ghost, { squeeze: 1, n: 3 })],

    /* ---------------- Dragon ---------------- */
    'Dragon Breath': [SO('#8a7bff', { n: 14 })],
    'Dragon Claw': [SL(C.dragon, { n: 3, big: 1 })],
    'Dragon Pulse': [BM(C.dragon, { w: 22, c2: '#c7b8ff' }), RI(C.dragon, { at: 'd', n: 2 })],
    'Dragon Rush': [DA(C.dragon, { big: 1, e: '🐉' })],
    'Dragon Tail': [SL(C.dragon, { arc: 1, n: 1, big: 1 })],
    'Dragon Hammer': [DA(C.dragon, { big: 1 }), QU({})],
    'Dragon Darts': [P('🐉', { n: 2, gap: 120, sz: .8 })],
    'Dragon Energy': [CH(C.dragon), BM(C.dragon, { w: 34, big: 1 })],
    'Draco Meteor': [O(C.dragon, { sz: 1.2, arc: 140 }), RA('☄️', { n: 6, slant: 1, shake: 1 })],
    'Twister': [WI(C.dragon, { tornado: 1 })],
    'Outrage': [GL(C.red), DA(C.dragon), HI('💢', { n: 3, fast: 1 })],
    'Dual Chop': [HI('✋', { n: 2, from: 'top', filter: TINT.purple })],
    'Scale Shot': [P('🔷', { n: 4, gap: 70, sz: .6 })],
    'Breaking Swipe': [SL(C.dragon, { arc: 1, n: 1, big: 1 })],
    'Clanging Scales': [RI(C.dragon, { n: 4, sym: '🔔' })],
    'Core Enforcer': [BM('#7aff9a', { w: 20 })],
    'Dynamax Cannon': [CH('#e0204a'), BM('#e0204a', { w: 36, c2: '#ffc0d0', big: 1 }), FL('#e0204a', .35)],
    'Eternabeam': [CH('#e0204a'), BM('#e0204a', { w: 36, c2: '#ffc0d0', big: 1 }), FL('#e0204a', .35)],
    'Fickle Beam': [BM(C.dragon, { w: 20 })],
    'Glaive Rush': [DA(C.dragon, { fast: 1, big: 1 })],
    'Order Up': [P('🍣', { arc: 60 }), BU(C.dragon)],
    'Roar of Time': [RI('#4aa8ff', { n: 5, big: 1 }), FL('#4aa8ff', .4), BM('#9ad1ff', { w: 28 })],
    'Spacial Rend': [SL('#ff8ad8', { n: 1, big: 1, len: 140 }), FL('#ff8ad8', .35)],

    /* ---------------- Dark ---------------- */
    'Bite': [JA(C.white)],
    'Crunch': [JA(C.white, { n: 2, big: 1 })],
    'Jaw Lock': [JA(C.white, { n: 2 })],
    'Dark Pulse': [RI(C.dark, { n: 4, big: 1 })],
    'Night Slash': [SL('#7a4ad8', { n: 1, big: 1 })],
    'Night Daze': [RI('#c2306a', { n: 4, at: 'd', big: 1 }), FL('#300018', .4)],
    'Feint Attack': [VA('fade', { c: C.dark })],
    'Foul Play': [VA('fade', { c: C.dark }), BU(C.dark)],
    'Sucker Punch': [DA(C.dark, { fast: 1 }), HI('👊', { fast: 1 })],
    'Pursuit': [DA(C.dark, { fast: 1 })],
    'Payback': [DA(C.dark)],
    'Assurance': [DA(C.dark)],
    'Brutal Swing': [SL(C.dark, { arc: 1, n: 1, big: 1 })],
    'Knock Off': [HI('✋'), BU(C.dark)],
    'Throat Chop': [HI('✋', { from: 'top' })],
    'Wicked Blow': [HI('👊', { big: 1.4 }), BU(C.dark)],
    'Lash Out': [HI('💢', { n: 2 })],
    'Darkest Lariat': [DA(C.dark, { spin: 1, big: 1 })],
    'Comeuppance': [DA(C.dark), BU(C.dark)],
    'False Surrender': [SL(C.dark, { n: 1 })],
    'Kowtow Cleave': [SL(C.dark, { n: 1, big: 1 })],
    'Power Trip': [GL(C.dark), O(C.dark, { n: 3, gap: 80 })],
    'Ruination': [FL('#200010', .45), CL('#3a2040')],
    'Snarl': [RI(C.dark, { n: 3, sym: '💢' })],
    'Thief': [DA(C.dark, { fast: 1 }), SP('💰', { k: 1 })],
    'Dark Void': [VXO(C.dark, { k: 12 })],

    /* ---------------- Steel ---------------- */
    'Metal Claw': [SL(C.steel, { n: 3 })],
    'Iron Tail': [SL(C.steel, { arc: 1, n: 1, big: 1 })],
    'Iron Head': [DA(C.steel), SP('✨', { k: 3 })],
    'Flash Cannon': [BM(C.steel, { w: 24 }), FL('#ffffff', .3)],
    'Steel Beam': [CH(C.steel), BM(C.steel, { w: 32, big: 1 })],
    'Gyro Ball': [DA(C.steel, { spin: 1 })],
    'Heavy Slam': [DA(C.steel, { hop: 1, big: 1 }), QU({})],
    'Meteor Mash': [HI('👊', { from: 'top', big: 1.3 }), SP('⭐', { k: 5 })],
    'Smart Strike': [JB(C.steel, { n: 1, big: 1 })],
    'Anchor Shot': [P('⚓', { spin: 0 }), RI(C.steel, { squeeze: 1, n: 3 })],
    'Magnet Bomb': [P('🧲', { arc: 50 }), BU(C.steel)],
    'Gear Grind': [P('⚙️', { n: 2, gap: 120, spin: 1080 })],
    'Mirror Shot': [BM('#e8f4ff', { w: 14 }), FL('#ffffff', .3)],
    'Make It Rain': [RA('🪙', { n: 14, gap: 45 })],
    'Doom Desire': [RO('#fff4c0', { n: 1, sz: 2 }), BU('#fff4c0', { big: 1.8 })],
    'Double Iron Bash': [DA(C.steel, { spin: 1 }), HI('💥', { n: 2 })],
    'Gigaton Hammer': [HI('🔨', { from: 'top', big: 2 }), QU({ big: 1 })],
    'Behemoth Blade': [SL(C.steel, { n: 1, big: 1, len: 140 })],
    'Behemoth Bash': [DA(C.steel, { big: 1 }), SP('🛡️', { k: 1 })],
    'Sunsteel Strike': [GL(C.gold), DA(C.gold, { big: 1 })],
    'Spin Out': [DA(C.steel, { spin: 1 })],
    'Steel Roller': [DA(C.steel, { spin: 1, big: 1 })],
    'Tachyon Cutter': [CR(C.steel, { n: 2, gap: 90 })],

    /* ---------------- Fairy ---------------- */
    'Fairy Wind': [WI(C.fairy), SP('✨', { k: 5 })],
    'Disarming Voice': [RI(C.fairy, { n: 3, sym: '💗' })],
    'Alluring Voice': [RI(C.fairy, { n: 3, sym: '💗' })],
    'Draining Kiss': [P('💋'), DR(C.fairy)],
    'Sweet Kiss': [SP('💋', { k: 3 }), SP('💗', { k: 4 })],
    'Dazzling Gleam': [FL('#ffffff', .5), SP('✨', { k: 12, big: 1.2 })],
    'Moonblast': [SP('🌙', { at: 'a', k: 1, px: 30 }), O('#ffd6f5', { sz: 1.6 }), BU(C.fairy, { e: '✨' })],
    'Play Rough': [DA(C.fairy), CL('#ffe0f0'), W(HI('💥', { n: 3, fast: 1 })), SP('⭐', { k: 5 })],
    'Spirit Break': [HI('👊', { filter: TINT.pink }), BU(C.fairy)],
    "Nature's Madness": [RI(C.fairy, { squeeze: 1, n: 3 }), BU(C.fairy)],
    'Springtide Storm': [WI(C.fairy, { tornado: 1 }), S('🌸', { n: 12, jit: 34 })],
    'Magical Torque': [DA(C.fairy, { spin: 1 }), SP('✨', { k: 4 })],
    'Misty Explosion': [BU(C.fairy, { at: 'a', big: 1.8 }), CL('#ffd6f0')],
    'Fleur Cannon': [CH(C.fairy), BM(C.fairy, { w: 30, big: 1 })],
    'Light of Ruin': [CH('#fff'), BM('#ffe0f4', { w: 34, big: 1 }), FL('#fff', .5)],
    'Geomancy': [GL('#9af'), SP('🌈', { k: 2 }), BU('#9af')]
  };

  /* the game spells a few moves more than one way (U-turn / U Turn) */
  const key = n => (n || '').toLowerCase().replace(/[^a-z]/g, '');
  const BY_KEY = {};
  Object.keys(RECIPES).forEach(n => { BY_KEY[key(n)] = RECIPES[n]; });

  /* any move not in the list still looks like its type */
  const BY_TYPE = {
    Normal: [DA(C.white)],
    Fire: [P('🔥', { n: 2, gap: 100 }), BU(C.fire, { e: '🔥' })],
    Water: [S('💧', { n: 10 })],
    Electric: [BO({})],
    Grass: [P('🍃', { n: 3, gap: 90, spin: 540 })],
    Ice: [BM(C.ice, { w: 14 }), SP('❄️', { k: 4 })],
    Fighting: [HI('👊')],
    Poison: [O(C.poison, { arc: 40 }), CL(C.poison)],
    Ground: [QU({})],
    Flying: [CR(C.white, { n: 2, gap: 100 }), WI(C.white)],
    Psychic: PSY,
    Bug: [JB(C.bug, { n: 2 })],
    Rock: [RA('🪨', { n: 5 })],
    Ghost: [O(C.ghost, { sz: 1.3 }), BU(C.ghost)],
    Dragon: [SO('#8a7bff', { n: 12 })],
    Dark: [SL('#7a4ad8', { n: 2 })],
    Steel: [DA(C.steel), SP('✨', { k: 3 })],
    Fairy: [SP('✨', { k: 10 })]
  };
  function recipeFor(mv) { return BY_KEY[key(mv.name)] || BY_TYPE[mv.type] || BY_TYPE.Normal; }

  /* =======================================================================
     play one attack
     ======================================================================= */
  function layerOf(stage) {
    let L = stage.querySelector(':scope > .fx-layer');
    if (!L) { L = document.createElement('div'); L.className = 'fx-layer'; stage.appendChild(L); }
    return L;
  }
  function centre(el, sr) {
    const box = el.querySelector('.critter-box') || el;
    const r = box.getBoundingClientRect();
    return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height / 2, h: r.height };
  }

  function play(opt) {
    const stage = opt.stage, aEl = opt.aEl, dEl = opt.dEl, mv = opt.move;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return { hit: 420, end: 420, quiet: true };
    const sr = stage.getBoundingClientRect();
    const a = centre(aEl, sr), d = centre(dEl, sr);
    const dist = Math.max(40, Math.hypot(d.x - a.x, d.y - a.y));
    const c = {
      stage, aEl, dEl, layer: layerOf(stage), els: [], timers: [],
      a, d, dh: d.h, dist, W: sr.width, H: sr.height,
      angDeg: Math.atan2(d.y - a.y, d.x - a.x) * 180 / PI,
      dir: d.x >= a.x ? 1 : -1,
      s: Math.max(.85, Math.min(1.45, .72 + (mv.power || 60) / 220))
    };
    let prevStart = 0, prevHit = 0, hit = 0, end = 0, moves = false;
    recipeFor(mv).forEach(step => {
      const piece = PIECES[step.p];
      if (!piece) return;
      const r = piece(c, step);
      const start = step.par ? prevStart : prevHit;
      c.timers.push(setTimeout(() => { try { r.run(); } catch (e) { } }, start));
      prevStart = start; prevHit = start + r.hit;
      hit = Math.max(hit, start + r.hit); end = Math.max(end, start + r.end);
      if (r.moves) moves = true;
    });
    /* a little step forward, unless the attacker is already running/flying in */
    if (!moves) {
      const dx = (d.x - a.x) * .08, dy = (d.y - a.y) * .08;
      aEl.animate([{ transform: 'none' }, { transform: `translate(${dx}px,${dy}px)`, offset: .4 }, { transform: 'none' }], { duration: 320 });
    }
    setTimeout(() => c.els.forEach(el => el.remove()), end + 400);
    return { hit: Math.max(hit, 200), end: Math.max(end, hit + 100) };
  }

  window.FX = {
    play,
    setSound(fn) { sound = typeof fn === 'function' ? fn : () => { }; },
    has(name) { return !!BY_KEY[key(name)]; },
    /* for the test page: list moves with no recipe of their own */
    missing(names) { return names.filter(n => !BY_KEY[key(n)]); }
  };
})();
