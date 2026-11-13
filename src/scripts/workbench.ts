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
  wall: '#1d4550', // the teal accent wall, at night
  wallLo: '#173840',
  base: '#9aa6ac',
  floor: '#4a3a31',
  floorHi: '#544236',
  seam: '#3c2f28',
  birch: '#c9a77c',
  birchHi: '#dcc095',
  birchLo: '#9f7f58',
  white: '#d6d2de',
  whiteLo: '#8e8a98',
  frame: '#2f7f8a',
  frameHi: '#47a0aa',
  ink: '#140c24',
  paper: '#d9d1e8',
  warm: '#ffd890',
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
      glint: [72, 14],
      hit: [14, 8, 68, 58],
      spot: [48, 112],
      lines: () => [
        `* (Montréal, ${time.label}. ${sky.label})`,
        '* (Very far away, there is a red tree.)',
        "* (It's much too far to walk to.)",
        '* (...Maybe if you came back.)',
      ],
    },
    {
      id: 'poster',
      glint: [109, 20],
      hit: [92, 18, 20, 28],
      spot: [102, 112],
      lines: () => ['* (A DELTARUNE poster.)', '* (The edges are a little worn.)'],
    },
    {
      id: 'cats',
      glint: [156, 26],
      hit: [114, 18, 46, 28],
      spot: [136, 112],
      lines: () => [
        '* (Two cat pictures. One cat in the first. Two in the second.)',
        '* (They are also TryHackMe rooms. Luna wrote both.)',
        '* (Each one hides a flag.)',
      ],
      href: '/systems/tryhackme/',
    },
    {
      id: 'pinwheel',
      glint: [183, 23],
      hit: [162, 20, 24, 16],
      spot: [172, 114],
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
      glint: [207, 13],
      hit: [190, 12, 18, 22],
      spot: [190, 114],
      lines: () => ['* (A T-piece from evil-tetris.)', '* (It was supposed to fall. It went up instead.)'],
      href: '/systems/evil-tetris/',
    },
    {
      id: 'penguin',
      glint: [266, 19],
      hit: [250, 16, 18, 20],
      spot: [262, 116],
      lines: () => ['* (A penguin.)', '* (It is not a project. It is just a penguin.)'],
    },
    {
      id: 'monitor',
      glint: [231, 47],
      hit: [196, 44, 38, 28],
      spot: [196, 122],
      lines: () => [
        "* (A monitor. Fedora's on it.)",
        '* (Luna packages software for Fedora: 86box, some Rust crates, makedeb.)',
        "* (A package isn't done when it builds. It's done when someone else can rebuild it.)",
      ],
      href: '/systems/fedora/',
    },
    {
      id: 'note',
      glint: [195, 46],
      hit: [185, 45, 12, 13],
      spot: [184, 116],
      lines: () => [
        '* (A sticky note on the wall. It says CVE-2012-2982.)',
        "* (A Webmin bug from 2012. People assume it's dead. It isn't.)",
        '* (Luna rebuilt the vulnerable server and wrote her own exploit, instead of using a public one.)',
        '* (The fix was boring: patch it, and stop running it as root.)',
      ],
      href: '/systems/cve-2012-2982/',
    },
    {
      id: 'launchpad',
      glint: [257, 67],
      hit: [238, 64, 22, 12],
      spot: [246, 116],
      lines: () => [
        '* (A red TMS570 board, plugged into the monitor.)',
        "* (It's nearly the same chip as the CubeSat's flight computer.)",
        '* (Nearly. A driver can work here and still be wrong in orbit.)',
      ],
      href: '/systems/rocket-cdh/',
    },
    {
      id: 'grimoire',
      glint: [123, 141],
      hit: [98, 136, 28, 16],
      spot: [112, 158],
      lines: () => [
        '* (A Blood on the Clocktower grimoire.)',
        "* (The Storyteller keeps every player's secret in one of these.)",
        '* (Luna wrote a Discord bot that keeps the digital one. It is also called grimoire.)',
      ],
      href: '/systems/grimoire/',
    },
    {
      id: 'box',
      glint: [42, 151],
      hit: [12, 146, 34, 26],
      spot: [56, 162],
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
    [174, 100, 100, 10], // desk
    [204, 104, 24, 14], // chair
    [278, 100, 16, 10], // lamp
    [100, 140, 24, 10], // grimoire
    [14, 150, 30, 20], // box
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
    R(0, 0, RW, 3, C.wallLo);
    R(0, 96, RW, 4, C.base);
    R(0, 96, RW, 1, '#c4ccd0');
  }

  /** Warm glow from the lamp: stepped, so it stays pixel-crisp. */
  function drawLampGlow() {
    const cx = 286;
    const cy = 64;
    const rings: [number, number][] = [[78, 0.02], [66, 0.025], [54, 0.03], [42, 0.035], [30, 0.045], [18, 0.05]];
    g.fillStyle = C.warm;
    for (const [r, a] of rings) {
      g.globalAlpha = a;
      for (let y = -r; y <= r; y++) {
        const hw = Math.round(Math.sqrt(r * r - y * y) * 1.15);
        const yy = cy + y;
        if (yy < 0 || yy > 196) continue;
        const x0 = Math.max(0, cx - hw);
        const x1 = Math.min(RW, cx + hw);
        if (x1 > x0) g.fillRect(OX + x0, OY + yy, x1 - x0, 1);
      }
    }
    g.globalAlpha = 1;
  }

  function drawFloor() {
    R(0, 100, RW, 96, C.floor);
    for (let y = 106; y < 196; y += 9) {
      R(0, y, RW, 1, C.seam);
      const off = ((y / 9) | 0) % 3 * 23;
      for (let x = off; x < RW; x += 69) R(x, y + 1, 1, 8, C.seam);
    }
    // Rug.
    R(140, 122, 122, 48, '#4f4e57');
    R(140, 122, 122, 1, '#605f69');
    R(143, 125, 116, 1, '#45444c');
    R(143, 166, 116, 1, '#45444c');
    R(143, 125, 1, 42, '#45444c');
    R(258, 125, 1, 42, '#45444c');
    for (let i = 0; i < 40; i++) R(142 + ((i * 53) % 118), 124 + ((i * 29) % 44), 1, 1, '#5a5962');
    // Doorway at the bottom, leading out.
    R(124, 196, 52, 12, C.floor);
    R(124, 196, 1, 12, C.seam);
    R(175, 196, 1, 12, C.seam);
    // Window light on the floor.
    g.globalAlpha = 0.07;
    g.fillStyle = sky.glow;
    for (let i = 0; i < 30; i++) g.fillRect(OX + 18 + i * 0.6, OY + 104 + i, 62, 1);
    g.globalAlpha = 1;
  }

  /** String lights draped along the top of the wall. */
  const LIGHT_PTS: [number, number][] = [[4, 5], [70, 20], [128, 6], [196, 18], [252, 7], [296, 15]];
  function lightY(x: number) {
    for (let i = 0; i < LIGHT_PTS.length - 1; i++) {
      const [x0, y0] = LIGHT_PTS[i];
      const [x1, y1] = LIGHT_PTS[i + 1];
      if (x < x0 || x > x1) continue;
      const u = (x - x0) / (x1 - x0);
      const sag = Math.sin(u * Math.PI) * 5;
      return Math.round(y0 + (y1 - y0) * u + sag);
    }
    return 6;
  }
  function drawLights(t: number) {
    for (let x = 4; x <= 296; x++) R(x, lightY(x), 1, 1, '#0d1a1e');
    for (let x = 8, i = 0; x <= 292; x += 10, i++) {
      const y = lightY(x) + 1;
      const tw = reduce ? 1 : 0.5 + 0.5 * Math.sin(t * 0.0015 + i * 2.1);
      g.globalAlpha = 0.12 + tw * 0.12;
      R(x - 2, y - 1, 5, 4, C.warm);
      g.globalAlpha = 1;
      R(x, y, 1, 2, tw > 0.35 ? '#fff0c0' : '#e0b870');
    }
  }

  function drawWindow(t: number) {
    // Curtains.
    R(6, 4, 10, 70, '#55635e');
    R(80, 4, 10, 70, '#55635e');
    for (const x of [8, 12, 83, 87]) R(x, 4, 1, 70, '#46524e');
    R(4, 2, 88, 2, '#2a2f2e'); // rod
    // Frame and sky.
    R(16, 10, 64, 54, C.frame);
    R(16, 10, 64, 2, C.frameHi);
    R(19, 13, 58, 47, sky.sky);
    if (sky.stars) {
      for (const [i, [sx, sy]] of stars.entries()) {
        const on = reduce || Math.sin(t * 0.001 + i * 1.7) > -0.6;
        if (on) R(sx - 4, sy, 1, 1, i % 4 ? '#8a8fb8' : '#d8dcff');
      }
      R(64, 17, 4, 4, '#e8e4d0'); // moon
      R(65, 17, 3, 1, sky.sky);
    }
    // Horizon: the city.
    const city = [3, 5, 2, 6, 4, 7, 3, 5, 8, 4, 2, 5, 3, 6, 2];
    city.forEach((h, i) => R(19 + i * 4, 60 - h, 4, h, '#0b0914'));
    // Far away: a hill rising out of the city, and the red tree on top of it.
    for (let y = 53; y <= 59; y++) {
      const hw = Math.round(3 + (y - 53) * 2.6);
      const x0 = Math.max(48, 64 - hw);
      const x1 = Math.min(77, 64 + hw);
      R(x0, y, x1 - x0, 1, '#0b0914');
      if (y <= 56) {
        R(x0, y, 1, 1, '#3d2246');
        R(x1 - 1, y, 1, 1, '#3d2246');
      }
    }
    R(61, 53, 6, 1, '#3d2246');
    drawFarTree(54, 39, t);
    // Mullions and sill.
    R(47, 13, 2, 47, C.frame);
    R(19, 35, 58, 2, C.frame);
    R(14, 64, 68, 3, '#c9c4d0');
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

  function drawPosters() {
    // DELTARUNE poster: a dark scene, a lit doorway, a figure.
    R(94, 20, 16, 24, '#e6e2ea');
    R(95, 21, 14, 22, '#1f1a4a');
    R(95, 21, 14, 3, '#2a2160');
    R(96, 22, 12, 1, '#e6e2ea'); // title
    R(99, 27, 6, 10, '#a3167a');
    R(100, 28, 4, 8, '#5fd0d8');
    R(101, 34, 2, 3, '#140c24');
    R(95, 38, 14, 5, '#2b8a8f');
    // Cat Pictures 1 and 2.
    R(116, 20, 20, 22, '#b89a6a');
    R(118, 22, 16, 18, C.paper);
    catFace(123, 28);
    R(140, 24, 20, 22, '#b89a6a');
    R(142, 26, 16, 18, C.paper);
    catFace(143, 32);
    catFace(151, 32);
  }

  function drawShelf(t: number) {
    // Long white floating shelf.
    R(160, 34, 114, 4, C.white);
    R(160, 37, 114, 1, C.whiteLo);
    // pinwheel: a small black box with one light.
    R(164, 21, 20, 13, '#17161d');
    R(164, 21, 20, 1, '#2d2b38');
    R(166, 30, 6, 1, '#24222d');
    const blink = reduce || Math.floor(t / 900) % 3 !== 0;
    R(180, 30, 2, 1, blink ? '#9fd0ff' : '#2a3a4a');
    // The T-piece, floating a little above the shelf.
    const bob = reduce ? 0 : Math.round(Math.sin(t * 0.002));
    const ty = 16 + bob;
    const block = (x: number, y: number) => {
      R(x, y, 5, 5, '#a3167a');
      R(x, y, 5, 1, '#c02a92');
      R(x, y, 1, 5, '#c02a92');
    };
    block(191, ty);
    block(196, ty);
    block(201, ty);
    block(196, ty + 5);
    // Pothos: a grey pot, leaves up top, a vine trailing down past the shelf.
    R(214, 26, 11, 8, '#8e8478');
    R(214, 26, 11, 1, '#a59a8c');
    const leaf = (x: number, y: number, c = '#4f9a52') => {
      R(x, y, 3, 2, c);
      R(x + 1, y - 1, 1, 1, c);
    };
    leaf(212, 22, '#3f8244');
    leaf(216, 19);
    leaf(220, 21, '#5aae5c');
    leaf(223, 24, '#3f8244');
    leaf(217, 23, '#5aae5c');
    for (let y = 37; y < 54; y++) R(225 + Math.round(Math.sin(y * 0.4)), y, 1, 1, '#2f6a34');
    leaf(225, 41, '#4f9a52');
    leaf(223, 47, '#3f8244');
    leaf(226, 52, '#5aae5c');
    // Camera.
    R(232, 27, 14, 7, '#1a1a1e');
    R(235, 25, 6, 2, '#1a1a1e');
    R(232, 27, 14, 1, '#34343c');
    R(237, 29, 4, 4, '#3a3a44');
    R(238, 30, 2, 2, '#6a7a8a');
    R(243, 28, 1, 1, '#c8c8d0');
    // Penguin plush.
    R(252, 22, 12, 12, '#1b1b24');
    R(254, 25, 8, 9, '#ecebf2');
    R(252, 20, 10, 3, '#1b1b24');
    R(254, 21, 1, 1, '#fff');
    R(258, 23, 4, 2, '#f2c230');
    R(250, 26, 2, 5, '#1b1b24');
    R(264, 26, 2, 5, '#1b1b24');
    R(253, 33, 3, 1, '#f2c230');
    R(260, 33, 3, 1, '#f2c230');
  }

  function drawDesk() {
    // Monitor, showing Fedora.
    R(198, 46, 36, 21, '#121216');
    for (let y = 0; y < 17; y++) R(200, 48 + y, 32, 1, y < 6 ? '#24386a' : y < 12 ? '#2c4a86' : '#3560a4');
    R(213, 53, 6, 6, '#51a2da');
    R(212, 54, 8, 4, '#51a2da');
    R(215, 54, 1, 4, '#fff');
    R(216, 54, 2, 1, '#fff');
    R(214, 55, 3, 1, '#fff');
    R(214, 67, 4, 5, '#2a2a30');
    R(209, 71, 14, 1, '#2a2a30');
    // Sticky note: a CVE number, scribbled.
    R(186, 47, 9, 9, '#f2dc6a');
    R(186, 47, 9, 1, '#f8e98e');
    R(187, 49, 6, 1, '#6a5a2a');
    R(187, 51, 7, 1, '#6a5a2a');
    R(187, 53, 4, 1, '#6a5a2a');
    R(194, 55, 1, 1, '#c9b450');
    // Keyboard and the red board, cable running to the monitor.
    R(203, 71, 4, 1, '#202028');
    R(224, 71, 12, 1, '#202028');
    R(240, 68, 16, 5, '#b8102c');
    R(240, 68, 16, 1, '#d8263f');
    R(245, 69, 4, 3, '#1a1a1a');
    R(242, 69, 1, 1, '#e9e4d0');
    R(253, 69, 1, 1, '#e9e4d0');
    R(234, 71, 6, 1, '#d8d4dc');
    // Birch desk with white legs.
    R(174, 72, 100, 3, C.birchHi);
    R(174, 75, 100, 2, C.birch);
    R(174, 77, 100, 3, C.birchLo);
    R(176, 80, 3, 30, '#c9c4d0');
    R(269, 80, 3, 30, '#c9c4d0');
  }

  /** Tall paper floor lamp on wooden legs, lit. */
  function drawLamp(t: number) {
    const flick = reduce ? 0 : Math.sin(t * 0.003) * 0.02;
    R(279, 30, 14, 66, '#f6e9c6');
    for (const x of [282, 286, 290]) R(x, 31, 1, 64, '#eadbb0');
    R(279, 30, 14, 1, '#fff8e0');
    g.globalAlpha = 0.2 + flick;
    R(277, 28, 18, 70, C.warm);
    g.globalAlpha = 1;
    R(280, 96, 2, 14, '#8a6a4a');
    R(285, 96, 2, 12, '#7a5a3c');
    R(290, 96, 2, 14, '#8a6a4a');
  }

  function drawChair() {
    R(209, 86, 16, 17, '#b8322e');
    R(209, 86, 16, 2, '#d0473f');
    R(208, 88, 1, 13, '#8e2522');
    R(205, 101, 24, 5, '#9a2a27');
    R(205, 101, 24, 1, '#c03a35');
    R(216, 106, 2, 8, '#d6d2de');
    R(206, 114, 22, 1, '#d6d2de');
    for (const x of [206, 216, 227]) R(x, 115, 1, 2, '#8e8a98');
  }

  function drawGrimoire() {
    R(100, 140, 24, 10, '#4a1220');
    R(100, 140, 24, 2, '#6a1c2c');
    R(123, 140, 1, 10, '#2e0b14');
    R(109, 143, 5, 5, '#c9a24a');
    R(110, 144, 3, 3, '#4a1220');
    R(111, 144, 1, 2, '#c9a24a');
  }

  function drawBox() {
    R(14, 150, 30, 20, '#8a6a46');
    R(14, 150, 30, 3, '#a3825a');
    R(27, 150, 4, 20, '#b89a6a');
    R(17, 158, 8, 5, '#e6e0d0');
    R(18, 160, 6, 1, '#6a6070');
    R(43, 150, 1, 20, '#6a5034');
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
    drawLampGlow();
    drawWindow(t);
    drawPosters();
    drawLights(t);
    drawShelf(t);
    drawDesk();
    drawLamp(t);
    // Floor objects and the cat, back to front.
    const floorThings: [number, () => void][] = [
      [117, drawChair],
      [150, drawGrimoire],
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
