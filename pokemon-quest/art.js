/* ===========================================================================
   art.js — original cartoon creature renderer
   ---------------------------------------------------------------------------
   Every critter in this game is drawn from scratch with plain SVG shapes so
   that no copyrighted artwork is copied into the page. Each Pokedex entry
   carries a small `art` recipe (body shape + colors + ears + tail + extras)
   and this file turns that recipe into a cute 100x100 drawing.

   A recipe looks like:
     { shape:'biped', body:'#f7d02c', accent:'#e0a600', belly:'#ffe97a',
       ears:'point', earTip:'#2b2b3a', tail:'zigzag',
       back:['shell'], front:['cheeks'], eyes:'round', mouth:'w' }
   =========================================================================== */
window.Art = (function () {
  "use strict";

  const DARK = '#2b2b3a';

  /* ---------- tiny svg helpers ---------- */
  const el = (cx, cy, rx, ry, fill, more) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"${more || ''}/>`;
  const ci = (cx, cy, r, fill, more) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${more || ''}/>`;
  const pa = (d, fill, more) => `<path d="${d}" fill="${fill}"${more || ''}/>`;
  const ln = (d, stroke, w, more) =>
    `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${more || ''}/>`;

  /* =========================================================================
     BODY SHAPES
     Each builder returns { back, body, head, A } where A holds anchor points:
       hx,hy,hr  head circle      fx,fy  face center
       bx,by     middle of back   tx,ty  tail attachment
       sx,sy     body side/height for wings & flippers
     ========================================================================= */
  const SHAPES = {
    /* round puffball — Jigglypuff, Marill, Togepi, Wooloo, Popplio */
    blob(a) {
      const A = { hx: 50, hy: 55, hr: 29, fx: 50, fy: 54, bx: 50, by: 28, tx: 79, ty: 72, sx: 24, sy: 58 };
      return {
        back: '',
        body:
          el(38, 88, 11, 6, a.accent) +
          el(62, 88, 11, 6, a.accent) +
          el(19, 62, 9, 7, a.body) +
          el(81, 62, 9, 7, a.body),
        head:
          ci(50, 55, 29, a.body) +
          el(50, 69, 18, 13, a.belly, ' opacity=".8"'),
        A
      };
    },

    /* stands on two feet — Pikachu, Charmander, Squirtle, Riolu, Pawmi */
    biped(a) {
      const A = { hx: 50, hy: 31, hr: 20, fx: 50, fy: 32, bx: 50, by: 54, tx: 69, ty: 68, sx: 30, sy: 64 };
      return {
        back: '',
        body:
          el(38, 90, 10, 6, a.accent) +
          el(62, 90, 10, 6, a.accent) +
          el(28, 63, 7, 11, a.body, ' transform="rotate(16 28 63)"') +
          el(72, 63, 7, 11, a.body, ' transform="rotate(-16 72 63)"') +
          el(50, 66, 18, 21, a.body) +
          el(50, 71, 11, 14, a.belly, ' opacity=".9"'),
        head: ci(50, 31, 20, a.body),
        A
      };
    },

    /* four legs — Eevee, Litten, Fennekin, Yamper, Lechonk */
    quad(a) {
      const A = { hx: 33, hy: 37, hr: 19, fx: 33, fy: 38, bx: 60, by: 44, tx: 83, ty: 54, sx: 60, sy: 60 };
      return {
        back: '',
        body:
          `<rect x="40" y="64" width="9" height="26" rx="4.5" fill="${a.accent}"/>` +
          `<rect x="76" y="64" width="9" height="24" rx="4.5" fill="${a.accent}"/>` +
          `<rect x="52" y="66" width="9" height="24" rx="4.5" fill="${a.body}"/>` +
          `<rect x="66" y="66" width="9" height="24" rx="4.5" fill="${a.body}"/>` +
          el(61, 59, 26, 18, a.body) +
          el(59, 67, 18, 9, a.belly, ' opacity=".75"'),
        head:
          ci(33, 37, 19, a.body) +
          el(31, 45, 10, 7, a.belly, ' opacity=".85"'),
        A
      };
    },

    /* little bird — Torchic, Piplup, Rowlet, Quaxly */
    bird(a) {
      const A = { hx: 50, hy: 34, hr: 19, fx: 50, fy: 35, bx: 50, by: 56, tx: 74, ty: 76, sx: 26, sy: 60 };
      return {
        back: '',
        body:
          pa('M 36 92 l 14 0 l -7 -7 z', a.accent) +
          pa('M 50 92 l 14 0 l -7 -7 z', a.accent) +
          el(26, 60, 8, 14, a.accent, ' transform="rotate(14 26 60)"') +
          el(74, 60, 8, 14, a.accent, ' transform="rotate(-14 74 60)"') +
          el(50, 62, 23, 24, a.body) +
          el(50, 66, 14, 16, a.belly, ' opacity=".85"'),
        head: ci(50, 34, 19, a.body),
        A
      };
    },

    /* coiled snake — Dratini, Snivy, and (fatter) Gyarados & Onix */
    serpent(a) {
      const g = a.girth || 16;
      const A = { hx: 47, hy: 29, hr: g > 18 ? 19 : 17, fx: 47, fy: 30, bx: 47, by: 46, tx: 22, ty: 86, sx: 30, sy: 60 };
      return {
        back: '',
        body:
          ln('M 22 86 Q 54 97 77 79 Q 91 66 66 60 Q 44 55 47 44', a.body, g) +
          ln('M 30 87 Q 54 94 72 81', a.belly, g * .32, ' opacity=".7"'),
        head: ci(A.hx, A.hy, A.hr, a.body),
        A
      };
    },

    /* swimmer — Magikarp, Goomy-ish blobs in water */
    fish(a) {
      const A = { hx: 34, hy: 50, hr: 16, fx: 32, fy: 50, bx: 52, by: 38, tx: 80, ty: 54, sx: 30, sy: 66 };
      return {
        back: pa('M 74 54 q 18 -18 24 -2 q -6 20 -24 2 z', a.accent),
        body:
          pa('M 50 34 q 8 -14 16 2 q -8 6 -16 -2 z', a.accent) +
          el(52, 56, 30, 20, a.body) +
          el(50, 64, 20, 10, a.belly, ' opacity=".7"') +
          pa('M 44 74 q 8 12 18 2 q -8 -6 -18 -2 z', a.accent),
        head: ci(34, 50, 16, a.body) + el(24, 56, 8, 5, a.belly, ' opacity=".8"'),
        A
      };
    },

    /* great big soft one — Snorlax, Lapras, Ditto */
    bigblob(a) {
      const A = { hx: 50, hy: 42, hr: 25, fx: 50, fy: 42, bx: 50, by: 26, tx: 84, ty: 76, sx: 18, sy: 66 };
      return {
        back: '',
        body:
          el(28, 89, 14, 8, a.accent) +
          el(72, 89, 14, 8, a.accent) +
          el(16, 66, 10, 9, a.body) +
          el(84, 66, 10, 9, a.body) +
          el(50, 64, 35, 27, a.body) +
          el(50, 72, 25, 18, a.belly, ' opacity=".85"'),
        head: ci(50, 42, 25, a.body),
        A
      };
    },

    /* stands like a person — Machop, Alakazam, Mewtwo, Gardevoir */
    humanoid(a) {
      const A = { hx: 50, hy: 25, hr: 16, fx: 50, fy: 26, bx: 50, by: 48, tx: 68, ty: 70, sx: 30, sy: 54 };
      return {
        back: '',
        body:
          `<rect x="42" y="70" width="8" height="20" rx="4" fill="${a.body}"/>` +
          `<rect x="51" y="70" width="8" height="20" rx="4" fill="${a.body}"/>` +
          el(43, 91, 9, 5, a.accent) + el(58, 91, 9, 5, a.accent) +
          pa(`M 35 42 Q 50 36 65 42 L 60 72 Q 50 76 40 72 Z`, a.body) +
          pa(`M 42 50 Q 50 47 58 50 L 56 70 Q 50 72 44 70 Z`, a.belly, ' opacity=".8"') +
          el(31, 55, 6, 13, a.body, ' transform="rotate(12 31 55)"') +
          el(69, 55, 6, 13, a.body, ' transform="rotate(-12 69 55)"') +
          ci(30, 66, 5, a.accent) + ci(70, 66, 5, a.accent),
        head: ci(50, 25, 16, a.body),
        A
      };
    },

    /* floating, wobbly hem — Mimikyu */
    ghost(a) {
      const A = { hx: 50, hy: 48, hr: 26, fx: 50, fy: 50, bx: 50, by: 24, tx: 80, ty: 74, sx: 24, sy: 56 };
      return {
        back: '',
        body: '',
        head:
          pa('M 24 50 Q 24 20 50 20 Q 76 20 76 50 L 76 82 Q 70 76 64 83 Q 58 90 51 83 Q 44 76 37 83 Q 30 90 24 80 Z', a.body) +
          el(50, 62, 15, 12, a.belly, ' opacity=".45"'),
        A
      };
    }
  };

  /* =========================================================================
     EARS — drawn behind the head so they look attached
     ========================================================================= */
  const EARS = {
    none: () => '',
    point: (a, A) => {
      const t = a.earTip || a.accent, h = A.hr * 1.5, w = A.hr * 0.42;
      return pa(`M ${A.hx - A.hr * .72} ${A.hy - A.hr * .5} l ${-w} ${-h} l ${w * 2.1} ${h * .42} z`, a.body) +
        pa(`M ${A.hx + A.hr * .72} ${A.hy - A.hr * .5} l ${w} ${-h} l ${-w * 2.1} ${h * .42} z`, a.body) +
        pa(`M ${A.hx - A.hr * .72 - w} ${A.hy - A.hr * .5 - h} l ${w * .5} ${h * .3} l ${-w * .8} ${h * .05} z`, t) +
        pa(`M ${A.hx + A.hr * .72 + w} ${A.hy - A.hr * .5 - h} l ${-w * .5} ${h * .3} l ${w * .8} ${h * .05} z`, t);
    },
    round: (a, A) => {
      const r = A.hr * 0.44;
      return ci(A.hx - A.hr * .82, A.hy - A.hr * .78, r, a.body) +
        ci(A.hx + A.hr * .82, A.hy - A.hr * .78, r, a.body) +
        ci(A.hx - A.hr * .82, A.hy - A.hr * .78, r * .5, a.earTip || a.accent) +
        ci(A.hx + A.hr * .82, A.hy - A.hr * .78, r * .5, a.earTip || a.accent);
    },
    long: (a, A) => {
      const w = A.hr * 0.3, h = A.hr * 1.35;
      return el(A.hx - A.hr * .62, A.hy - A.hr * .85 - h * .4, w, h, a.body, ` transform="rotate(-12 ${A.hx - A.hr * .62} ${A.hy - h})"`) +
        el(A.hx + A.hr * .62, A.hy - A.hr * .85 - h * .4, w, h, a.body, ` transform="rotate(12 ${A.hx + A.hr * .62} ${A.hy - h})"`) +
        el(A.hx - A.hr * .62, A.hy - A.hr * 1.5, w * .55, h * .45, a.earTip || a.belly) +
        el(A.hx + A.hr * .62, A.hy - A.hr * 1.5, w * .55, h * .45, a.earTip || a.belly);
    },
    tuft: (a, A) =>
      pa(`M ${A.hx - A.hr * .5} ${A.hy - A.hr * .85} q ${-A.hr * .5} ${-A.hr * .7} ${A.hr * .15} ${-A.hr * .95} q ${A.hr * .3} ${A.hr * .3} ${A.hr * .5} ${A.hr * .55} z`, a.earTip || a.accent) +
      pa(`M ${A.hx + A.hr * .5} ${A.hy - A.hr * .85} q ${A.hr * .5} ${-A.hr * .7} ${-A.hr * .15} ${-A.hr * .95} q ${-A.hr * .3} ${A.hr * .3} ${-A.hr * .5} ${A.hr * .55} z`, a.earTip || a.accent),
    leaf: (a, A) =>
      pa(`M ${A.hx - A.hr * .8} ${A.hy - A.hr * .55} q ${-A.hr * .9} ${-A.hr * .55} ${-A.hr * 1.1} ${A.hr * .12} q ${A.hr * .6} ${A.hr * .5} ${A.hr * 1.1} ${-A.hr * .12} z`, a.earTip || a.accent) +
      pa(`M ${A.hx + A.hr * .8} ${A.hy - A.hr * .55} q ${A.hr * .9} ${-A.hr * .55} ${A.hr * 1.1} ${A.hr * .12} q ${-A.hr * .6} ${A.hr * .5} ${-A.hr * 1.1} ${-A.hr * .12} z`, a.earTip || a.accent),
    fin: (a, A) =>
      pa(`M ${A.hx - A.hr * .85} ${A.hy - A.hr * .15} q ${-A.hr * 1.1} ${-A.hr * .3} ${-A.hr * 1.15} ${A.hr * .55} q ${A.hr * .75} ${A.hr * .2} ${A.hr * 1.15} ${-A.hr * .55} z`, a.earTip || a.belly) +
      pa(`M ${A.hx + A.hr * .85} ${A.hy - A.hr * .15} q ${A.hr * 1.1} ${-A.hr * .3} ${A.hr * 1.15} ${A.hr * .55} q ${-A.hr * .75} ${A.hr * .2} ${-A.hr * 1.15} ${-A.hr * .55} z`, a.earTip || a.belly)
  };

  /* =========================================================================
     TAILS — drawn behind everything
     ========================================================================= */
  const TAILS = {
    none: () => '',
    zigzag: (a, A) =>
      pa(`M ${A.tx} ${A.ty} l 10 -6 l -3 12 l 12 -8 l -2 14 l 14 -10 l -4 20 l -13 4 l -14 -6 z`, a.earTip || '#e0a600'),
    flame: (a, A) => {
      const x = A.tx + 6, y = A.ty + 2;
      return ln(`M ${A.tx - 4} ${A.ty + 6} q 12 4 20 -6`, a.body, 9) +
        pa(`M ${x + 14} ${y - 6} q 10 -10 2 -22 q -3 10 -9 12 q 1 -8 -4 -13 q -2 14 -11 17 q 8 12 22 6 z`, '#ff9c33') +
        pa(`M ${x + 14} ${y - 8} q 5 -7 1 -15 q -3 7 -7 8 q 0 -5 -3 -8 q -1 9 -7 11 q 6 8 16 4 z`, '#ffd84d');
    },
    bushy: (a, A) =>
      el(A.tx + 6, A.ty - 4, 16, 13, a.earTip || a.belly, ` transform="rotate(-22 ${A.tx + 6} ${A.ty - 4})"`) +
      el(A.tx + 2, A.ty - 2, 11, 9, a.accent, ` transform="rotate(-22 ${A.tx + 2} ${A.ty - 2})" opacity=".45"`),
    thin: (a, A) => ln(`M ${A.tx - 2} ${A.ty} q 16 2 18 -18`, a.body, 6),
    curl: (a, A) => ln(`M ${A.tx - 2} ${A.ty} q 18 0 14 -12 q -3 -8 -11 -3`, a.body, 6),
    leaf: (a, A) =>
      ln(`M ${A.tx - 2} ${A.ty} q 12 0 14 -10`, a.accent, 5) +
      pa(`M ${A.tx + 12} ${A.ty - 10} q 12 -8 16 2 q -10 8 -16 -2 z`, a.earTip || '#7ac74c'),
    swirl: (a, A) =>
      ln(`M ${A.tx - 4} ${A.ty} q 16 4 14 -12`, a.accent, 4) +
      ci(A.tx + 12, A.ty - 18, 8, a.body),
    star: (a, A) =>
      ln(`M ${A.tx - 2} ${A.ty} q 14 2 16 -16`, a.body, 5) +
      pa(`M ${A.tx + 14} ${A.ty - 26} l 3 7 l 7 1 l -5 5 l 2 7 l -7 -4 l -7 4 l 2 -7 l -5 -5 l 7 -1 z`, a.earTip || '#f7d02c'),
    fan: (a, A) =>
      pa(`M ${A.tx - 4} ${A.ty} q 18 -14 22 4 q -12 10 -22 -4 z`, a.accent) +
      ln(`M ${A.tx + 2} ${A.ty - 1} l 14 -4 M ${A.tx + 3} ${A.ty + 2} l 14 1`, a.body, 1.6, ' opacity=".5"')
  };

  /* =========================================================================
     EXTRAS — little identifying features, front or back layer
     ========================================================================= */
  const EXTRAS = {
    /* --- faces --- */
    cheeks: (a, A) =>
      ci(A.fx - A.hr * .82, A.fy + A.hr * .3, A.hr * .22, a.cheek || '#ef6b63', ' opacity=".9"') +
      ci(A.fx + A.hr * .82, A.fy + A.hr * .3, A.hr * .22, a.cheek || '#ef6b63', ' opacity=".9"'),
    whiskers: (a, A) =>
      ln(`M ${A.fx - A.hr * .55} ${A.fy + A.hr * .38} l ${-A.hr * .85} ${-A.hr * .16} M ${A.fx - A.hr * .55} ${A.fy + A.hr * .5} l ${-A.hr * .85} ${A.hr * .16}`, DARK, 1.5, ' opacity=".6"') +
      ln(`M ${A.fx + A.hr * .55} ${A.fy + A.hr * .38} l ${A.hr * .85} ${-A.hr * .16} M ${A.fx + A.hr * .55} ${A.fy + A.hr * .5} l ${A.hr * .85} ${A.hr * .16}`, DARK, 1.5, ' opacity=".6"'),
    mask: (a, A) =>
      pa(`M ${A.fx - A.hr * .95} ${A.fy - A.hr * .3} q ${A.hr} ${-A.hr * .45} ${A.hr * 1.9} 0 q ${-A.hr * .2} ${A.hr * .6} ${-A.hr * .95} ${A.hr * .6} q ${-A.hr * .75} 0 ${-A.hr * .95} ${-A.hr * .6} z`, a.accent, ' opacity=".85"'),
    snout: (a, A) =>
      el(A.fx, A.fy + A.hr * .52, A.hr * .38, A.hr * .28, a.accent) +
      ci(A.fx - A.hr * .15, A.fy + A.hr * .5, A.hr * .07, DARK) +
      ci(A.fx + A.hr * .15, A.fy + A.hr * .5, A.hr * .07, DARK),
    nose: (a, A) => ci(A.fx, A.fy + A.hr * .42, A.hr * .16, a.cheek || '#ef6b63'),
    tear: (a, A) => pa(`M ${A.fx + A.hr * .62} ${A.fy + A.hr * .18} q ${A.hr * .22} ${A.hr * .42} 0 ${A.hr * .5} q ${-A.hr * .22} ${-A.hr * .08} 0 ${-A.hr * .5} z`, '#8fd8ff'),
    jawTeeth: (a, A) =>
      pa(`M ${A.fx - A.hr * .42} ${A.fy + A.hr * .6} l ${A.hr * .16} ${A.hr * .2} l ${A.hr * .16} ${-A.hr * .2} z`, '#fff') +
      pa(`M ${A.fx + A.hr * .1} ${A.fy + A.hr * .6} l ${A.hr * .16} ${A.hr * .2} l ${A.hr * .16} ${-A.hr * .2} z`, '#fff'),
    tusks: (a, A) =>
      pa(`M ${A.fx - A.hr * .5} ${A.fy + A.hr * .55} l ${-A.hr * .22} ${A.hr * .55} l ${A.hr * .3} ${-A.hr * .1} z`, '#f5f5f5') +
      pa(`M ${A.fx + A.hr * .5} ${A.fy + A.hr * .55} l ${A.hr * .22} ${A.hr * .55} l ${-A.hr * .3} ${-A.hr * .1} z`, '#f5f5f5'),
    beak: (a, A) => pa(`M ${A.fx} ${A.fy + A.hr * .28} l ${-A.hr * .3} ${A.hr * .26} l ${A.hr * .6} 0 z`, a.beak || '#f0a63a'),
    curl: (a, A) => ln(`M ${A.fx - A.hr * .35} ${A.fy - A.hr * .8} q ${-A.hr * .5} ${-A.hr * .55} ${A.hr * .35} ${-A.hr * .6} q ${A.hr * .45} 0 ${A.hr * .2} ${A.hr * .45}`, a.accent, 4),
    quiff: (a, A) => pa(`M ${A.fx - A.hr * .5} ${A.fy - A.hr * .85} q ${A.hr * .2} ${-A.hr * .95} ${A.hr * 1.1} ${-A.hr * .55} q ${-A.hr * .45} ${A.hr * .35} ${-A.hr * .45} ${A.hr * .62} z`, a.accent),
    headTuft: (a, A) =>
      pa(`M ${A.fx} ${A.fy - A.hr * .95} l ${-A.hr * .3} ${-A.hr * .7} l ${A.hr * .18} ${A.hr * .12} l ${A.hr * .14} ${-A.hr * .5} l ${A.hr * .14} ${A.hr * .5} l ${A.hr * .18} ${-A.hr * .12} l ${-A.hr * .3} ${A.hr * .7} z`, a.accent),
    gem: (a, A) => pa(`M ${A.fx} ${A.fy - A.hr * .95} l ${-A.hr * .2} ${A.hr * .28} l ${A.hr * .2} ${A.hr * .22} l ${A.hr * .2} ${-A.hr * .22} z`, a.cheek || '#ef6b63'),
    bow: (a, A) =>
      pa(`M ${A.fx + A.hr * .55} ${A.fy - A.hr * .8} l ${A.hr * .5} ${-A.hr * .3} l 0 ${A.hr * .6} z`, a.cheek || '#ef6b63') +
      pa(`M ${A.fx + A.hr * .55} ${A.fy - A.hr * .8} l ${-A.hr * .5} ${-A.hr * .3} l 0 ${A.hr * .6} z`, a.cheek || '#ef6b63'),
    headLeaf: (a, A) =>
      ln(`M ${A.hx} ${A.hy - A.hr * .9} l 0 ${-A.hr * .35}`, '#5ca85c', 3) +
      pa(`M ${A.hx} ${A.hy - A.hr * 1.25} q ${A.hr * .75} ${-A.hr * .75} ${A.hr * 1.15} ${A.hr * .1} q ${-A.hr * .7} ${A.hr * .6} ${-A.hr * 1.15} ${-A.hr * .1} z`, '#7ac74c') +
      pa(`M ${A.hx} ${A.hy - A.hr * 1.25} q ${-A.hr * .6} ${-A.hr * .6} ${-A.hr * .95} ${A.hr * .05} q ${A.hr * .55} ${A.hr * .5} ${A.hr * .95} ${-A.hr * .05} z`, '#8fd45f'),
    leafBow: (a, A) =>
      pa(`M ${A.fx} ${A.fy + A.hr * .95} q ${-A.hr * .8} ${-A.hr * .3} ${-A.hr * .85} ${A.hr * .35} q ${A.hr * .55} ${A.hr * .2} ${A.hr * .85} ${-A.hr * .35} z`, '#7ac74c') +
      pa(`M ${A.fx} ${A.fy + A.hr * .95} q ${A.hr * .8} ${-A.hr * .3} ${A.hr * .85} ${A.hr * .35} q ${-A.hr * .55} ${A.hr * .2} ${-A.hr * .85} ${-A.hr * .35} z`, '#8fd45f'),
    faceRing: (a, A) => `<circle cx="${A.fx}" cy="${A.fy + A.hr * .05}" r="${A.hr * .78}" fill="${a.belly}" opacity=".9"/>`,
    cheekFins: (a, A) =>
      pa(`M ${A.fx - A.hr * .95} ${A.fy + A.hr * .1} q ${-A.hr * .8} ${-A.hr * .2} ${-A.hr * .7} ${A.hr * .5} q ${A.hr * .5} ${A.hr * .1} ${A.hr * .7} ${-A.hr * .5} z`, a.cheek || '#f0772b') +
      pa(`M ${A.fx + A.hr * .95} ${A.fy + A.hr * .1} q ${A.hr * .8} ${-A.hr * .2} ${A.hr * .7} ${A.hr * .5} q ${-A.hr * .5} ${A.hr * .1} ${-A.hr * .7} ${-A.hr * .5} z`, a.cheek || '#f0772b'),
    clothEyes: (a, A) =>
      ln(`M ${A.fx - A.hr * .5} ${A.fy - A.hr * .1} l ${A.hr * .3} ${A.hr * .22} l ${-A.hr * .3} ${A.hr * .2}`, DARK, 2.6) +
      ln(`M ${A.fx + A.hr * .5} ${A.fy - A.hr * .1} l ${-A.hr * .3} ${A.hr * .22} l ${A.hr * .3} ${A.hr * .2}`, DARK, 2.6) +
      ln(`M ${A.fx - A.hr * .28} ${A.fy + A.hr * .62} l ${A.hr * .14} ${A.hr * .16} l ${A.hr * .14} ${-A.hr * .16} l ${A.hr * .14} ${A.hr * .16} l ${A.hr * .14} ${-A.hr * .16}`, DARK, 2.2),

    /* --- markings --- */
    stripes: (a, A) =>
      ln(`M ${A.bx - 12} ${A.by + 4} l 8 -5 M ${A.bx + 2} ${A.by + 2} l 8 -5 M ${A.bx + 16} ${A.by + 4} l 8 -5`, a.accent, 3, ' opacity=".9"') +
      ln(`M ${A.fx - A.hr * .1} ${A.fy - A.hr * .8} l ${A.hr * .45} ${-A.hr * .3}`, a.accent, 2.4, ' opacity=".9"'),
    spots: (a, A) =>
      ci(A.bx - 10, A.by + 6, 4, a.accent, ' opacity=".7"') +
      ci(A.bx + 4, A.by + 2, 5, a.accent, ' opacity=".7"') +
      ci(A.bx + 18, A.by + 8, 4, a.accent, ' opacity=".7"'),
    rings: (a, A) =>
      ci(A.fx, A.fy - A.hr * .75, A.hr * .22, a.cheek || '#f7d02c') +
      ci(A.bx + 6, A.by + 2, 5, a.cheek || '#f7d02c') +
      ci(43, 74, 3.6, a.cheek || '#f7d02c'),
    eggShell: (a, A) =>
      pa(`M ${A.hx - 22} ${A.hy + 16} l 7 -9 l 7 9 l 7 -9 l 7 9 l 7 -9 l 5 9 z`, '#f4f4f8') +
      pa(`M ${A.hx - 14} ${A.hy + 22} l 5 -7 l 5 7 z`, a.cheek || '#ef6b63') +
      pa(`M ${A.hx + 6} ${A.hy + 22} l 5 -7 l 5 7 z`, '#6390f0'),
    fluff: (a, A) =>
      ci(A.hx - 22, A.hy + 6, 12, a.belly) + ci(A.hx + 22, A.hy + 6, 12, a.belly) +
      ci(A.hx - 14, A.hy - 14, 12, a.belly) + ci(A.hx + 14, A.hy - 14, 12, a.belly) +
      ci(A.hx, A.hy - 22, 12, a.belly),
    hooves: (a, A) => el(38, 90, 7, 4, a.accent) + el(62, 90, 7, 4, a.accent),
    collarRocks: (a, A) =>
      pa(`M ${A.hx - 20} ${A.hy + 17} l 6 -7 l 5 7 z`, '#d8d0c8') +
      pa(`M ${A.hx - 6} ${A.hy + 20} l 6 -8 l 6 8 z`, '#e4ded6') +
      pa(`M ${A.hx + 10} ${A.hy + 17} l 5 -7 l 6 7 z`, '#d8d0c8'),
    scalchop: (a, A) => ci(50, 70, 7, '#f5f0e0') + ci(50, 70, 3, '#d8d0b8'),
    ribbons: (a, A) =>
      ln(`M ${A.hx - 14} ${A.hy + 12} q -16 10 -12 26`, a.cheek || '#6390f0', 4) +
      ln(`M ${A.tx - 2} ${A.ty - 6} q 16 8 12 22`, a.cheek || '#6390f0', 4) +
      pa(`M ${A.hx - 26} ${A.hy + 38} l 6 -8 l 4 9 z`, a.cheek || '#6390f0'),

    /* --- back layer --- */
    shell: (a, A) =>
      el(A.bx + 6, A.by + 10, 24, 20, a.shell || '#c98a45') +
      el(A.bx + 6, A.by + 10, 17, 14, a.shell2 || '#e8b06a') +
      ln(`M ${A.bx - 8} ${A.by + 10} l 28 0 M ${A.bx + 6} ${A.by - 2} l 0 24`, a.shell || '#c98a45', 1.8, ' opacity=".6"'),
    bulb: (a, A) =>
      ci(A.bx + 8, A.by + 2, 17, '#8fd45f') +
      pa(`M ${A.bx + 8} ${A.by - 14} q 12 -10 16 2 q -10 8 -16 -2 z`, '#7ac74c') +
      pa(`M ${A.bx + 8} ${A.by - 14} q -12 -10 -16 2 q 10 8 16 -2 z`, '#6cbf85'),
    spikes: (a, A) =>
      pa(`M ${A.bx - 14} ${A.by + 6} l 5 -11 l 5 11 z`, a.accent) +
      pa(`M ${A.bx - 1} ${A.by + 1} l 5 -12 l 5 12 z`, a.accent) +
      pa(`M ${A.bx + 12} ${A.by + 4} l 5 -11 l 5 11 z`, a.accent),
    backFlames: (a, A) => {
      const f = (x, y, s) =>
        pa(`M ${x} ${y} q ${6 * s} ${-7 * s} ${1 * s} ${-15 * s} q ${-2 * s} ${6 * s} ${-6 * s} ${7 * s} q ${1 * s} ${-6 * s} ${-3 * s} ${-9 * s} q ${-1 * s} ${10 * s} ${-7 * s} ${12 * s} q ${6 * s} ${8 * s} ${15 * s} ${5 * s} z`, '#ff9c33');
      return f(A.bx - 16, A.by + 8, .9) + f(A.bx, A.by + 4, 1.1) + f(A.bx + 16, A.by + 8, .9);
    },
    wings: (a, A) =>
      pa(`M ${A.sx} ${A.sy} q -22 -14 -26 6 q 12 12 26 2 z`, a.wing || a.accent) +
      pa(`M ${100 - A.sx} ${A.sy} q 22 -14 26 6 q -12 12 -26 2 z`, a.wing || a.accent),
    hornSingle: (a, A) =>
      pa(`M ${A.hx + 6} ${A.hy - A.hr * .85} q 22 -10 26 6 q -14 -2 -22 4 z`, a.accent),
    flippers: (a, A) =>
      el(20, 72, 11, 6, a.accent, ' transform="rotate(18 20 72)"') +
      el(80, 72, 11, 6, a.accent, ' transform="rotate(-18 80 72)"'),
    stickTail: (a, A) => ln(`M ${A.tx - 2} ${A.ty} q 14 6 18 -8`, '#8a6a48', 4) + ci(A.tx + 17, A.ty - 10, 5, '#2b2b3a'),

    /* --- big, grown-up and legendary bits --- */
    bigWings: (a, A) =>
      pa(`M ${A.sx + 2} ${A.sy - 6} q -30 -26 -34 4 q -2 24 14 26 q 10 -16 20 -30 z`, a.wing || a.accent) +
      pa(`M ${98 - A.sx} ${A.sy - 6} q 30 -26 34 4 q 2 24 -14 26 q -10 -16 -20 -30 z`, a.wing || a.accent),
    mane: (a, A) => {
      let out = '';
      for (let i = 0; i < 9; i++) {
        const ang = (i / 8) * Math.PI * 1.5 + Math.PI * .75;
        out += ci(A.hx + Math.cos(ang) * A.hr * 1.05, A.hy + Math.sin(ang) * A.hr * 1.05, A.hr * .3, a.mane || a.belly);
      }
      return out;
    },
    crest: (a, A) =>
      pa(`M ${A.hx - 4} ${A.hy - A.hr * .9} q -4 -18 -20 -22 q 6 16 4 26 z`, a.accent) +
      pa(`M ${A.hx + 4} ${A.hy - A.hr * .9} q 4 -18 20 -22 q -6 16 -4 26 z`, a.accent),
    crown: (a, A) =>
      pa(`M ${A.hx - A.hr * .8} ${A.hy - A.hr * .78} l ${A.hr * .3} ${-A.hr * .7} l ${A.hr * .28} ${A.hr * .35} l ${A.hr * .24} ${-A.hr * .62} l ${A.hr * .24} ${A.hr * .62} l ${A.hr * .28} ${-A.hr * .35} l ${A.hr * .3} ${A.hr * .7} z`, a.crownColor || '#f5b700'),
    plates: (a, A) =>
      pa(`M ${A.bx - 18} ${A.by + 10} l 7 -12 l 7 12 z`, a.accent) +
      pa(`M ${A.bx - 2} ${A.by + 4} l 8 -14 l 8 14 z`, a.accent) +
      pa(`M ${A.bx + 16} ${A.by + 12} l 6 -11 l 7 11 z`, a.accent),
    fangsBig: (a, A) =>
      pa(`M ${A.fx - A.hr * .45} ${A.fy + A.hr * .5} l ${-A.hr * .1} ${A.hr * .6} l ${A.hr * .26} ${-A.hr * .2} z`, '#fff') +
      pa(`M ${A.fx + A.hr * .45} ${A.fy + A.hr * .5} l ${A.hr * .1} ${A.hr * .6} l ${-A.hr * .26} ${-A.hr * .2} z`, '#fff'),
    gills: (a, A) =>
      pa(`M ${A.hx - A.hr * .9} ${A.hy + A.hr * .2} q -14 -6 -18 8 q 12 6 18 -2 z`, a.accent) +
      pa(`M ${A.hx + A.hr * .9} ${A.hy + A.hr * .2} q 14 -6 18 8 q -12 6 -18 -2 z`, a.accent),
    hornPair: (a, A) =>
      ln(`M ${A.hx - A.hr * .5} ${A.hy - A.hr * .85} l ${-A.hr * .25} ${-A.hr * .6}`, a.accent, 3.2) +
      ln(`M ${A.hx + A.hr * .5} ${A.hy - A.hr * .85} l ${A.hr * .25} ${-A.hr * .6}`, a.accent, 3.2) +
      ci(A.hx - A.hr * .75, A.hy - A.hr * 1.45, A.hr * .16, a.accent) +
      ci(A.hx + A.hr * .75, A.hy - A.hr * 1.45, A.hr * .16, a.accent),
    moustache: (a, A) =>
      ln(`M ${A.fx - A.hr * .15} ${A.fy + A.hr * .55} q ${-A.hr * .5} ${A.hr * .3} ${-A.hr * .85} ${-A.hr * .1}`, '#c8a878', 3) +
      ln(`M ${A.fx + A.hr * .15} ${A.fy + A.hr * .55} q ${A.hr * .5} ${A.hr * .3} ${A.hr * .85} ${-A.hr * .1}`, '#c8a878', 3),
    tailOrbs: (a, A) =>
      ci(A.tx + 6, A.ty - 4, 4.5, a.cheek || '#7fd0f0') +
      ci(A.hx - A.hr * .1, A.hy + A.hr * 1.1, 4, a.cheek || '#7fd0f0'),
    sparkles: (a, A) => {
      const s = (x, y, r) => pa(`M ${x} ${y - r} l ${r * .3} ${r * .7} l ${r * .7} ${r * .3} l ${-r * .7} ${r * .3} l ${-r * .3} ${r * .7} l ${-r * .3} ${-r * .7} l ${-r * .7} ${-r * .3} l ${r * .7} ${-r * .3} z`, '#fff9c4');
      return s(18, 24, 7) + s(84, 34, 5.5) + s(76, 16, 4);
    },
    aura: (a, A) =>
      `<circle cx="50" cy="54" r="45" fill="none" stroke="${a.auraColor || '#ffe27a'}" stroke-width="3" opacity=".55"/>` +
      `<circle cx="50" cy="54" r="39" fill="none" stroke="${a.auraColor || '#ffe27a'}" stroke-width="1.6" opacity=".35"/>`
  };

  /* =========================================================================
     FACE — eyes + mouth
     ========================================================================= */
  function face(a, A) {
    const ox = A.hr * 0.44, ey = A.fy - A.hr * 0.04, r = Math.max(2.6, A.hr * 0.2);
    const style = a.eyes || 'round';
    let out = '';

    if (style === 'dot') {
      out += ci(A.fx - ox, ey, r * .55, DARK) + ci(A.fx + ox, ey, r * .55, DARK);
    } else if (style === 'angry') {
      out += el(A.fx - ox, ey + r * .2, r, r * .9, DARK) + el(A.fx + ox, ey + r * .2, r, r * .9, DARK);
      out += ln(`M ${A.fx - ox - r} ${ey - r} l ${r * 1.8} ${r * .7}`, DARK, 2.4);
      out += ln(`M ${A.fx + ox + r} ${ey - r} l ${-r * 1.8} ${r * .7}`, DARK, 2.4);
    } else if (style === 'happy') {
      out += ln(`M ${A.fx - ox - r} ${ey + r * .5} q ${r} ${-r * 1.5} ${r * 2} 0`, DARK, 2.6);
      out += ln(`M ${A.fx + ox - r} ${ey + r * .5} q ${r} ${-r * 1.5} ${r * 2} 0`, DARK, 2.6);
    } else if (style === 'sleepy') {
      out += ln(`M ${A.fx - ox - r} ${ey} q ${r} ${r} ${r * 2} 0`, DARK, 2.6);
      out += ln(`M ${A.fx + ox - r} ${ey} q ${r} ${r} ${r * 2} 0`, DARK, 2.6);
    } else {
      const big = style === 'big' ? 1.35 : 1;
      out += el(A.fx - ox, ey, r * big, r * big * 1.18, DARK);
      out += el(A.fx + ox, ey, r * big, r * big * 1.18, DARK);
      out += ci(A.fx - ox + r * .3 * big, ey - r * .45 * big, r * .38 * big, '#fff');
      out += ci(A.fx + ox + r * .3 * big, ey - r * .45 * big, r * .38 * big, '#fff');
      if (style === 'sparkle') {
        out += ci(A.fx - ox - r * .3, ey + r * .45, r * .18, '#fff');
        out += ci(A.fx + ox - r * .3, ey + r * .45, r * .18, '#fff');
      }
    }

    const my = A.fy + A.hr * 0.46, mw = A.hr * 0.22;
    const mouth = a.mouth || 'smile';
    if (mouth === 'w') {
      out += ln(`M ${A.fx - mw} ${my} q ${mw * .5} ${mw * .7} ${mw} 0 q ${mw * .5} ${mw * .7} ${mw} 0`, DARK, 2);
    } else if (mouth === 'open') {
      out += el(A.fx, my + 1, mw * .9, mw * .8, DARK) + el(A.fx, my + mw * .55, mw * .5, mw * .35, '#f08098');
    } else if (mouth === 'wave') {
      out += ln(`M ${A.fx - mw * 1.3} ${my} q ${mw * .45} ${-mw * .6} ${mw * .9} 0 q ${mw * .45} ${mw * .6} ${mw * .9} 0 q ${mw * .45} ${-mw * .6} ${mw * .9} 0`, DARK, 2);
    } else if (mouth === 'fangs') {
      out += el(A.fx, my + 1, mw * 1.1, mw * .85, DARK);
      out += pa(`M ${A.fx - mw * .8} ${my + mw * .1} l ${mw * .28} ${mw * .5} l ${mw * .28} ${-mw * .5} z`, '#fff');
      out += pa(`M ${A.fx + mw * .24} ${my + mw * .1} l ${mw * .28} ${mw * .5} l ${mw * .28} ${-mw * .5} z`, '#fff');
    } else if (mouth === 'smirk') {
      out += ln(`M ${A.fx - mw * .3} ${my} q ${mw} ${mw * .5} ${mw * 1.3} ${-mw * .3}`, DARK, 2);
    } else if (mouth !== 'none') {
      out += ln(`M ${A.fx - mw} ${my - mw * .3} q ${mw} ${mw} ${mw * 2} 0`, DARK, 2);
    }
    return out;
  }

  /* =========================================================================
     PUBLIC: build the whole critter
     ========================================================================= */
  function inner(p) {
    const a = p.art || {};
    const sh = (SHAPES[a.shape] || SHAPES.biped)(a);
    const A = sh.A;
    const pick = (dict, keys) => (keys || []).map(k => (dict[k] ? dict[k](a, A) : '')).join('');

    return [
      (TAILS[a.tail] || TAILS.none)(a, A),
      pick(EXTRAS, a.back),
      sh.back,
      sh.body,
      (EARS[a.ears] || EARS.none)(a, A),
      sh.head,
      face(a, A),
      pick(EXTRAS, a.front)
    ].join('');
  }

  /* opts: { size, silhouette, className, flip } */
  function svg(p, opts) {
    opts = opts || {};
    const cls = 'critter' + (opts.className ? ' ' + opts.className : '') + (opts.silhouette ? ' is-silhouette' : '');
    const size = opts.size ? ` style="width:${opts.size}px;height:${opts.size}px"` : '';
    const flip = opts.flip ? ' transform="translate(100,0) scale(-1,1)"' : '';
    return `<svg class="${cls}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${opts.silhouette ? 'mystery Pokemon' : (p.name || '')}"${size}><g${flip}>${inner(p)}</g></svg>`;
  }

  return { svg, inner };
})();
