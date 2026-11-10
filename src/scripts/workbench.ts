/**
 * The workbench: the normal homepage room. Everything in it is a real thing
 * from Luna's work, drawn small, with a line of narration and a link to its
 * record. Through the window, very far away, there is a red tree.
 */
import { Dialogue } from './dialogue';
import { play } from './sfx';
import { drawCat, loadOverrides, type Sprite } from './sprites';

const H = 216;
const SPEED = 1.1;
const RW = 300; // room width; the room floats in the dark like the tree room
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Palette: dark, a little warm. No neon.
const C = {
  wall: '#221c30',
  wallLo: '#1c1728',
  base: '#141019',
  floor: '#33262b',
  seam: '#2a1f24',
  wood: '#5e4134',
  woodHi: '#77553f',
  woodLo: '#3f2b23',
  frame: '#4c3f5c',
  frameHi: '#62537a',
  ink: '#140c24',
  paper: '#d9d1e8',
  shelf: '#4f382d',
};

type Thing = {
  id: string;
  /** Hit box in room-local coords, for clicks. */
  hit: [number, number, number, number];
  /** Where the cat stands to check it. */
  spot: [number, number];
  lines: () => string[];
  /** Record to offer at the end. */
  href?: string;
  /** Where its sparkle shows, room-local. */
  glint: [number, number];
};

/** Montréal's hour, for the sky. */
function montrealHour() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', hour: 'numeric', minute: '2-digit', hour12: false }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24;
  const m = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return { h, label: `${String(h).padStart(2, '0')}:${m}` };
}

function skyFor(h: number) {
  if (h >= 21 || h < 5) return { sky: '#0c0f26', glow: '#141a3a', stars: true, label: "It's dark out." };
  if (h < 7) return { sky: '#3d3060', glow: '#6a4a78', stars: false, label: "It's getting light." };
  if (h < 18) return { sky: '#6684ad', glow: '#8aa3c4', stars: false, label: 'The sky is doing its best.' };
  return { sky: '#4a2f58', glow: '#7a4560', stars: true, label: "It's getting dark." };
}

export function initWorkbench() {
  const stageEl = document.querySelector<HTMLElement>('[data-stage]');
  const viewEl = stageEl?.querySelector('canvas');
  const boxEl = document.querySelector<HTMLElement>('[data-dlg]');
  const hint = document.querySelector<HTMLElement>('[data-stage-hint]');
  if (!stageEl || !viewEl || !boxEl) return;
  const stage: HTMLElement = stageEl;
  const view: HTMLCanvasElement = viewEl;
  const box: HTMLElement = boxEl;

  const dlg = new Dialogue(box);
  const out = view.getContext('2d')!;
  const buf = document.createElement('canvas');
  const g = buf.getContext('2d')!;

  let W = 320;
  let OX = 10; // room left, in buffer coords
  const OY = 8; // room top
  const cat = drawCat();
  let playerImg: Sprite | null = null;
  void loadOverrides().then((o) => {
    if (o.player) playerImg = o.player;
  });

  // Player position is room-local so resizes don't move it.
  const P = { x: 150, y: 200, dir: 1, moving: false, step: 0 };
  let pending: Thing | null = null;
  let hovered: Thing | null = null;
  const checked = new Set<string>(JSON.parse(localStorage.getItem('cc.checked') ?? '[]'));
  /** Waypoints from a click, found by a breadth-first search over a coarse grid. */
  let path: { x: number; y: number }[] = [];
  const keys = new Set<string>();
  let visible = true;
  let t0 = performance.now();

  // Stars: fixed, so they don't shimmer around between frames.
  const stars = Array.from({ length: 14 }, (_, i) => [24 + ((i * 37) % 58), 15 + ((i * 23) % 26)]);

  // --- things ---------------------------------------------------------------
  const time = montrealHour();
  const sky = skyFor(time.h);

  const things: Thing[] = [
    {
      id: 'window',
      glint: [80, 16],
      hit: [20, 10, 66, 54],
      spot: [53, 112],
      lines: () => [
        `* (Montréal, ${time.label}. ${sky.label})`,
        '* (Very far away, there is a red tree.)',
        "* (It's much too far to walk to.)",
        '* (...Maybe if you came back.)',
      ],
    },
    {
      id: 'cats',
      glint: [150, 26],
      hit: [98, 16, 56, 32],
      spot: [126, 112],
      lines: () => [
        '* (Two cat pictures. One cat in the first. Two in the second.)',
        '* (They are also TryHackMe rooms. Luna wrote both.)',
        '* (Each one hides a flag.)',
      ],
      href: '/systems/tryhackme/',
    },
    {
      id: 'pinwheel',
      glint: [187, 23],
      hit: [164, 18, 26, 18],
      spot: [176, 124],
      lines: () => [
        '* (A small black box called pinwheel.)',
        '* (Ryzen 7. 27 GiB of RAM. A 2.32 TiB ZFS pool.)',
        '* (Twelve containers live inside: dns, media, trilium, monitor, and eight more.)',
        '* (Every one of them is a file. Any of them could be rebuilt from nothing.)',
      ],
      href: '/systems/nix-lab/',
    },
    {
      id: 'tetris',
      glint: [212, 16],
      hit: [194, 14, 20, 20],
      spot: [204, 124],
      lines: () => [
        '* (A T-piece from evil-tetris.)',
        '* (It was supposed to fall. It went up instead.)',
      ],
      href: '/systems/evil-tetris/',
    },
    {
      id: 'laptop',
      glint: [247, 58],
      hit: [220, 54, 30, 24],
      spot: [235, 124],
      lines: () => [
        "* (A laptop. The sticker on the lid is Fedora's.)",
        '* (Luna packages software for Fedora: 86box, some Rust crates, makedeb.)',
        "* (A package isn't done when it builds. It's done when someone else can rebuild it.)",
      ],
      href: '/systems/fedora/',
    },
    {
      id: 'launchpad',
      glint: [273, 70],
      hit: [254, 66, 22, 14],
      spot: [264, 124],
      lines: () => [
        '* (A red TMS570 board, plugged into the laptop.)',
        "* (It's nearly the same chip as the CubeSat's flight computer.)",
        '* (Nearly. A driver can work here and still be wrong in orbit.)',
      ],
      href: '/systems/rocket-cdh/',
    },
    {
      id: 'grimoire',
      glint: [155, 114],
      hit: [132, 110, 24, 16],
      spot: [144, 134],
      lines: () => [
        '* (A Blood on the Clocktower grimoire.)',
        "* (The Storyteller keeps every player's secret in one of these.)",
        '* (Luna wrote a Discord bot that keeps the digital one. It is also called grimoire.)',
      ],
      href: '/systems/grimoire/',
    },
    {
      id: 'box',
      glint: [290, 151],
      hit: [258, 146, 34, 26],
      spot: [248, 164],
      lines: () => [
        '* (A cardboard box labelled k8s.)',
        '* (It ran fine. It was just more cluster than one machine needed.)',
        '* (It has been packed up.)',
      ],
      href: '/systems/infra-k8s/',
    },
  ];

  // Footprints on the floor that the cat walks around.
  const solid: [number, number, number, number][] = [
    [158, 100, 134, 20], // desk
    [132, 112, 24, 12], // grimoire
    [260, 150, 32, 20], // box
  ];
  const walkable = (x: number, y: number) =>
    x >= 6 && x <= RW - 6 && y >= 108 && (y <= 196 || (x > 127 && x < 173)) &&
    !solid.some(([sx, sy, sw, sh]) => x > sx - 4 && x < sx + sw + 4 && y > sy && y < sy + sh + 3);

  const CELL = 4;
  const GW = Math.ceil(RW / CELL);
  const GH = Math.ceil(212 / CELL);
  const clear = (ax: number, ay: number, bx: number, by: number) => {
    const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 2);
    for (let i = 1; i <= n; i++) if (!walkable(ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n)) return false;
    return true;
  };
  function findPath(from: { x: number; y: number }, to: { x: number; y: number }) {
    const cell = (x: number, y: number) => [Math.round(x / CELL), Math.round(y / CELL)];
    const ok = (cx: number, cy: number) => cx >= 0 && cy >= 0 && cx < GW && cy < GH && walkable(cx * CELL, cy * CELL);
    const [sx, sy] = cell(from.x, from.y);
    let [gx, gy] = cell(to.x, to.y);
    // If the goal is inside furniture, aim for the nearest open cell.
    if (!ok(gx, gy)) {
      let best: [number, number] | null = null;
      let bd = Infinity;
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
        const d = (x - gx) ** 2 + (y - gy) ** 2;
        if (d < bd && ok(x, y)) [bd, best] = [d, [x, y]];
      }
      if (!best) return [];
      [gx, gy] = best;
    }
    const prev = new Int32Array(GW * GH).fill(-1);
    const start = sy * GW + sx;
    prev[start] = start;
    const queue = [start];
    const steps = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (let qi = 0; qi < queue.length; qi++) {
      const c = queue[qi];
      if (c === gy * GW + gx) break;
      const cx = c % GW;
      const cy = (c / GW) | 0;
      for (const [ddx, ddy] of steps) {
        const nx = cx + ddx;
        const ny = cy + ddy;
        const ni = ny * GW + nx;
        if (!ok(nx, ny) || prev[ni] !== -1) continue;
        if (ddx && ddy && (!ok(cx + ddx, cy) || !ok(cx, cy + ddy))) continue; // no corner cutting
        prev[ni] = c;
        queue.push(ni);
      }
    }
    let c = gy * GW + gx;
    if (prev[c] === -1) return [];
    const cells: { x: number; y: number }[] = [];
    while (c !== start) {
      cells.unshift({ x: (c % GW) * CELL, y: ((c / GW) | 0) * CELL });
      c = prev[c];
    }
    // Final point is the exact goal if reachable, then drop waypoints we can see past.
    if (walkable(to.x, to.y)) cells[cells.length - 1] = { ...to };
    const out: { x: number; y: number }[] = [];
    let from2 = { x: from.x, y: from.y };
    for (let i = 0; i < cells.length; i++) {
      const next = cells[i + 1];
      if (next && clear(from2.x, from2.y, next.x, next.y)) continue;
      out.push(cells[i]);
      from2 = cells[i];
    }
    return out;
  }

  // --- layout ---------------------------------------------------------------
  const resize = () => {
    const r = stage.getBoundingClientRect();
    const aspect = Math.max(1.1, Math.min(2.4, r.width / Math.max(1, r.height)));
    W = Math.round(H * aspect);
    OX = Math.round((W - RW) / 2);
    buf.width = W;
    buf.height = H;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    view.width = Math.round(r.width * dpr);
    view.height = Math.round(r.height * dpr);
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  // --- checking things ------------------------------------------------------
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });

  async function check(t: Thing) {
    if (dlg.open) return;
    keys.clear();
    path = [];
    pending = null;
    box.classList.toggle('dlg--top', P.y > 150);
    if (t.id === 'window') localStorage.setItem('cc.far', '1');
    checked.add(t.id);
    localStorage.setItem('cc.checked', JSON.stringify([...checked]));
    const lines = t.lines();
    if (!t.href) return void (await dlg.say(lines));
    const pick = await dlg.say(
      [
        ...lines.slice(0, -1),
        {
          text: lines[lines.length - 1],
          choices: [
            { id: 'read', label: 'Read about it' },
            { id: 'leave', label: 'Leave it' },
          ],
        },
      ],
      { keepOpen: true },
    );
    dlg.close();
    if (pick === 'read') location.href = t.href;
  }

  const nearest = () => {
    let best: Thing | null = null;
    let bd = 20;
    for (const t of things) {
      const d = Math.hypot(P.x - t.spot[0], (P.y - t.spot[1]) * 1.2);
      if (d < bd) {
        bd = d;
        best = t;
      }
    }
    return best;
  };

  box.addEventListener('dlg:close', () => stage.focus({ preventScroll: true }));

  // --- input ----------------------------------------------------------------
  const typing = (el: Element | null) => !!el && /INPUT|TEXTAREA|SELECT/.test(el.tagName);
  const stageFocused = () => document.activeElement === stage;
  const MOVE: Record<string, string> = {
    w: 'up', arrowup: 'up', s: 'down', arrowdown: 'down',
    a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right',
  };

  window.addEventListener('keydown', (e) => {
    if (typing(document.activeElement) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (dlg.open) {
      if (visible && dlg.key(e)) e.preventDefault();
      return;
    }
    if (!visible) return;
    const k = e.key.toLowerCase();
    if (MOVE[k] && (!k.startsWith('arrow') || stageFocused())) {
      keys.add(MOVE[k]);
      path = [];
      pending = null;
      e.preventDefault();
      return;
    }
    if (k === 'z' || (k === 'enter' && stageFocused())) {
      const t = nearest();
      if (t) {
        e.preventDefault();
        void check(t);
      }
    }
  });
  window.addEventListener('keyup', (e) => {
    const m = MOVE[e.key.toLowerCase()];
    if (m) keys.delete(m);
  });
  window.addEventListener('blur', () => keys.clear());

  const toLocal = (e: PointerEvent) => {
    const r = view.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W - OX, y: ((e.clientY - r.top) / r.height) * H - OY };
  };
  const thingAt = (p: { x: number; y: number }) =>
    things.find(({ hit: [x, y, w, h] }) => p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h);

  view.addEventListener('pointerdown', (e) => {
    if (dlg.open) return;
    const p = toLocal(e);
    const t = thingAt(p);
    pending = t ?? null;
    const dest = t ? { x: t.spot[0], y: t.spot[1] } : p;
    path = findPath(P, dest);
    if (!path.length && t && Math.hypot(P.x - dest.x, P.y - dest.y) < 6) void check(t);
  });
  view.addEventListener('pointermove', (e) => {
    hovered = thingAt(toLocal(e)) ?? null;
    view.style.cursor = hovered ? 'pointer' : '';
  });
  view.addEventListener('pointerleave', () => (hovered = null));

  new IntersectionObserver(([entry]) => {
    visible = entry.intersectionRatio > 0.35;
    if (!visible) keys.clear();
  }, { threshold: [0, 0.35, 1] }).observe(stage);

  // --- simulation -----------------------------------------------------------
  function update(dt: number) {
    let dx = 0;
    let dy = 0;
    if (!dlg.open) {
      if (keys.has('left')) dx -= 1;
      if (keys.has('right')) dx += 1;
      if (keys.has('up')) dy -= 1;
      if (keys.has('down')) dy += 1;
      const goal = path[0];
      if (goal) {
        const tx = goal.x - P.x;
        const ty = goal.y - P.y;
        const d = Math.hypot(tx, ty);
        if (d < 1.5) {
          path.shift();
          if (!path.length && pending) void check(pending);
        } else {
          dx = tx / d;
          dy = ty / d;
        }
      }
    }
    const len = Math.hypot(dx, dy) || 1;
    dx = (dx / len) * SPEED * dt;
    dy = (dy / len) * SPEED * dt;
    P.moving = dx !== 0 || dy !== 0;
    if (dx) P.dir = dx > 0 ? 1 : -1;
    const okX = walkable(P.x + dx, P.y);
    const okY = walkable(P.x, P.y + dy);
    if (okX) P.x += dx;
    if (okY) P.y += dy;

    if (path.length && !okX && !okY) path = []; // shouldn't happen, but never walk into a wall forever
    if (P.moving) P.step += dt;

    // Out through the doorway at the bottom: to the work.
    if (P.y > 206) {
      P.y = 190;
      path = [];
      keys.clear();
      play('select');
      scrollTo('work');
    }

    if (hint) {
      const msg = dlg.open ? '' : nearest() ? 'Z · check' : '';
      if (hint.textContent !== msg) hint.textContent = msg;
    }
  }

  // --- drawing --------------------------------------------------------------
  const R = (x: number, y: number, w: number, h: number, c: string) => {
    g.fillStyle = c;
    g.fillRect(OX + x, OY + y, w, h);
  };

  function drawWall() {
    R(0, 0, RW, 100, C.wall);
    R(0, 0, RW, 4, C.wallLo);
    R(0, 96, RW, 4, C.base);
  }

  function drawFloor() {
    R(0, 100, RW, 96, C.floor);
    for (let y = 108; y < 196; y += 11) {
      R(0, y, RW, 1, C.seam);
      const off = ((y / 11) | 0) % 2 ? 0 : 37;
      for (let x = off; x < RW; x += 74) R(x, y + 1, 1, 10, C.seam);
    }
    // Doorway at the bottom, leading out.
    R(124, 196, 52, 12, C.floor);
    R(124, 196, 1, 12, C.seam);
    R(175, 196, 1, 12, C.seam);
    // Window light on the floor.
    g.globalAlpha = 0.06;
    g.fillStyle = sky.glow;
    for (let i = 0; i < 30; i++) g.fillRect(OX + 24 + i * 0.6, OY + 104 + i, 62, 1);
    g.globalAlpha = 1;
  }

  function drawWindow(t: number) {
    R(20, 10, 66, 54, C.frame);
    R(20, 10, 66, 2, C.frameHi);
    R(23, 13, 60, 46, sky.sky);
    if (sky.stars) {
      for (const [i, [sx, sy]] of stars.entries()) {
        const on = reduce || Math.sin(t * 0.001 + i * 1.7) > -0.6;
        if (on) R(sx, sy, 1, 1, i % 4 ? '#8a8fb8' : '#d8dcff');
      }
      R(70, 17, 4, 4, '#e8e4d0'); // moon
      R(71, 17, 3, 1, sky.sky);
    }
    // Horizon: the city.
    const city = [3, 5, 2, 6, 4, 7, 3, 5, 8, 4, 2, 5, 3, 6, 2];
    city.forEach((h, i) => R(23 + i * 4, 59 - h, 4, h, '#0b0914'));
    // Far away: a hill rising out of the city, and the red tree on top of it.
    for (let y = 52; y <= 58; y++) {
      const hw = Math.round(3 + (y - 52) * 2.6);
      const x0 = Math.max(54, 70 - hw);
      const x1 = Math.min(83, 70 + hw);
      R(x0, y, x1 - x0, 1, '#0b0914');
      // A purple rim along the top of the hill, like the tree room's floor.
      if (y <= 55) {
        R(x0, y, 1, 1, '#3d2246');
        R(x1 - 1, y, 1, 1, '#3d2246');
      }
    }
    R(67, 52, 6, 1, '#3d2246');
    drawFarTree(60, 38, t);
    // Mullions and sill.
    R(52, 13, 2, 46, C.frame);
    R(23, 35, 60, 2, C.frame);
    R(18, 64, 70, 3, C.frameHi);
  }

  /** The tree as a tiny sprite. h = highlight, r = red, l = red shadow, m = magenta, d = dark magenta, t = trunk. */
  const FAR_TREE = [
    '...........hhhh.......',
    '.......hhhhrrrrhh...r.',
    '....mmmrrrrrrrrrrr....',
    'r..mmmmrrrrrrrrrrrr...',
    '..mmmmrrrrrrrrrrrrmm..',
    '...dmmmmrrrrrrrrrmmd..',
    '....ddmmmrrrrrlrrdd...',
    '.......dmrrrllll......',
    '.........llt.tt.......',
    '..........tttt........',
    '..........tt..........',
    '.........tt...........',
    '.........tt...........',
    '........ttt...........',
    '.......t.tt.t.........',
  ];
  const FAR_COL: Record<string, string> = {
    h: '#ff3355', r: '#ec1f45', l: '#b3123a', m: '#b3208a', d: '#740f5c', t: '#1b1838',
  };
  function drawFarTree(x: number, y: number, t: number) {
    // The crown sways a pixel, like the real one.
    const sway = reduce ? 0 : Math.round(Math.sin(t * 0.0008) * 0.6);
    FAR_TREE.forEach((row, ry) => {
      const off = ry < 8 ? sway : 0;
      for (let rx = 0; rx < row.length; rx++) {
        const c = FAR_COL[row[rx]];
        if (c) R(x + rx + off, y + ry, 1, 1, c);
      }
    });
  }

  function catFace(x: number, y: number) {
    R(x, y, 1, 1, C.ink);
    R(x + 4, y, 1, 1, C.ink);
    R(x, y + 1, 5, 3, C.ink);
    R(x + 1, y + 2, 1, 1, '#ffd800');
    R(x + 3, y + 2, 1, 1, '#ffd800');
    R(x + 1, y + 4, 3, 1, C.ink);
  }

  function drawCatPictures() {
    // Cat Pictures 1
    R(100, 18, 22, 24, '#8b7354');
    R(102, 20, 18, 20, C.paper);
    catFace(108, 27);
    // Cat Pictures 2
    R(130, 24, 22, 24, '#8b7354');
    R(132, 26, 18, 20, C.paper);
    catFace(134, 33);
    catFace(142, 33);
  }

  function drawShelf(t: number) {
    R(160, 36, 60, 3, C.shelf);
    R(160, 36, 60, 1, C.woodHi);
    R(166, 39, 2, 4, C.woodLo);
    R(212, 39, 2, 4, C.woodLo);
    // pinwheel: a small black box with one light.
    R(166, 22, 22, 14, '#17161d');
    R(166, 22, 22, 1, '#2d2b38');
    R(168, 32, 6, 1, '#24222d');
    const blink = reduce || Math.floor(t / 900) % 3 !== 0;
    R(184, 32, 2, 1, blink ? '#9fd0ff' : '#2a3a4a');
    // The T-piece, floating a little above the shelf.
    const bob = reduce ? 0 : Math.round(Math.sin(t * 0.002) * 1);
    const ty = 18 + bob;
    const block = (x: number, y: number) => {
      R(x, y, 5, 5, '#a3167a');
      R(x, y, 5, 1, '#c02a92');
      R(x, y, 1, 5, '#c02a92');
    };
    block(196, ty);
    block(201, ty);
    block(206, ty);
    block(201, ty + 5);
  }

  function drawDesk() {
    // Laptop: we see the back of the lid, with a sticker.
    R(222, 56, 26, 20, '#6e6c7a');
    R(222, 56, 26, 1, '#8a8896');
    R(247, 56, 1, 20, '#55535f');
    R(233, 63, 5, 5, '#3c6eb4');
    R(235, 64, 1, 4, '#fff');
    R(236, 64, 1, 1, '#fff');
    R(234, 65, 3, 1, '#fff');
    // LaunchPad: a small red board, cable running to the laptop.
    R(256, 70, 18, 7, '#b8102c');
    R(256, 70, 18, 1, '#d8263f');
    R(262, 72, 4, 3, '#1a1a1a');
    R(258, 71, 1, 1, '#e9e4d0');
    R(271, 71, 1, 1, '#e9e4d0');
    R(250, 74, 6, 1, '#d8d4dc');
    R(248, 73, 2, 1, '#d8d4dc');
    // Desk: top, front, legs.
    R(158, 76, 134, 4, C.woodHi);
    R(158, 80, 134, 3, C.wood);
    R(158, 83, 134, 15, C.woodLo);
    R(160, 85, 60, 1, C.wood); // drawer line
    R(188, 89, 6, 1, C.woodHi); // handle
    R(160, 98, 4, 20, C.woodLo);
    R(286, 98, 4, 20, C.woodLo);
  }

  function drawGrimoire() {
    R(132, 114, 24, 10, '#4a1220');
    R(132, 114, 24, 2, '#6a1c2c');
    R(155, 114, 1, 10, '#2e0b14');
    R(141, 117, 5, 5, '#c9a24a');
    R(142, 118, 3, 3, '#4a1220');
    R(143, 118, 1, 2, '#c9a24a');
  }

  function drawBox() {
    R(260, 150, 32, 20, '#8a6a46');
    R(260, 150, 32, 3, '#a3825a');
    R(274, 150, 4, 20, '#b89a6a');
    R(264, 158, 8, 5, '#e6e0d0');
    R(265, 160, 6, 1, '#6a6070');
    R(291, 150, 1, 20, '#6a5034');
  }

  /** A four-point twinkle, a few pixels across. Phase 0..1. */
  function sparkle(x: number, y: number, phase: number) {
    const col = '#fff6b0';
    if (reduce) {
      R(x, y, 1, 1, col);
      return;
    }
    const f = phase < 0.15 ? 1 : phase < 0.3 ? 2 : phase < 0.42 ? 1 : 0;
    if (!f) return;
    R(x, y, 1, 1, '#ffffff');
    if (f >= 1) {
      R(x - 1, y, 1, 1, col);
      R(x + 1, y, 1, 1, col);
      R(x, y - 1, 1, 1, col);
      R(x, y + 1, 1, 1, col);
    }
    if (f >= 2) {
      R(x - 2, y, 1, 1, '#ffd800');
      R(x + 2, y, 1, 1, '#ffd800');
      R(x, y - 2, 1, 1, '#ffd800');
      R(x, y + 2, 1, 1, '#ffd800');
    }
  }

  function drawSparkles(t: number) {
    things.forEach((th, i) => {
      if (checked.has(th.id)) return;
      // Staggered, so they twinkle one at a time rather than in unison.
      const phase = ((t / 2600 + i * 0.37) % 1 + 1) % 1;
      sparkle(th.glint[0], th.glint[1], phase);
    });
  }

  /** Yellow corner brackets around whatever is selected. */
  function drawBrackets(th: Thing) {
    const [x, y, w, h] = th.hit;
    const c = '#ffd800';
    const L = 3;
    const x2 = x + w - 1;
    const y2 = y + h - 1;
    for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x2, y, -1, 1], [x, y2, 1, -1], [x2, y2, -1, -1]] as const) {
      R(sx > 0 ? cx : cx - L + 1, cy, L, 1, c);
      R(cx, sy > 0 ? cy : cy - L + 1, 1, L, c);
    }
  }

  function drawPlayer() {
    const img = playerImg ?? cat[P.moving ? Math.floor(P.step / 9) % 2 : 0];
    const bob = P.moving && Math.floor(P.step / 9) % 2 ? -1 : 0;
    const x = Math.round(OX + P.x - img.width / 2);
    const y = Math.round(OY + P.y - img.height) + bob;
    g.fillStyle = 'rgba(10,6,14,0.5)';
    g.fillRect(Math.round(OX + P.x - 5), Math.round(OY + P.y) - 1, 10, 2);
    g.save();
    if (P.dir < 0) {
      g.translate(x * 2 + img.width, 0);
      g.scale(-1, 1);
    }
    g.drawImage(img, x, y);
    g.restore();
  }

  function render(t: number) {
    g.fillStyle = '#000';
    g.fillRect(0, 0, W, H);
    drawWall();
    drawFloor();
    drawWindow(t);
    drawCatPictures();
    drawShelf(t);
    drawDesk();
    // Floor objects and the cat, back to front.
    const floorThings: [number, () => void][] = [
      [124, drawGrimoire],
      [170, drawBox],
      [P.y, drawPlayer],
    ];
    floorThings.sort((a, b) => a[0] - b[0]).forEach(([, f]) => f());
    drawSparkles(t);
    const sel = dlg.open ? null : hovered ?? nearest();
    if (sel) drawBrackets(sel);
    out.imageSmoothingEnabled = false;
    out.drawImage(buf, 0, 0, view.width, view.height);
  }

  function frame(now: number) {
    const dt = Math.max(0, Math.min(3, (now - t0) / 16.67));
    t0 = now;
    if (visible || dlg.open) {
      update(dt);
      render(now);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Walk in through the doorway.
  if (reduce) P.y = 170;
  else path = [{ x: 150, y: 168 }];

  // For anyone reading the console.
  console.log(
    '%c* (Well, there is not a man here.)\n* (Try looking out the window.)',
    'font-family: monospace; color: #e23a48',
  );
}
