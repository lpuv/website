/**
 * Two independent canvases.
 *
 *   initMap()  — the hero. The machines Luna runs, as a force-directed graph
 *                you can drag. This is the interactive thing on the page.
 *   initTank() — a section further down. Twelve unpatched hosts and the worms
 *                that get into them, after xkcd 350.
 *
 * Colours come from the CSS custom properties so both follow the palette.
 */

interface NodeSeed {
  id: string;
  label: string;
  kind: string;
  desc: string;
  r: number;
  w: number;
}

interface Node extends NodeSeed {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hot: boolean;
  fixed: boolean;
}

interface Link {
  a: Node;
  b: Node;
}

interface Palette {
  bg: string;
  ink: string;
  ink3: string;
  rule: string;
  live: string;
  inkOn: string;
}

function readPalette(): Palette {
  const s = getComputedStyle(document.documentElement);
  const g = (k: string) => s.getPropertyValue(k).trim();
  return {
    bg: g('--bg'),
    ink: g('--text'),
    ink3: g('--text-3'),
    rule: g('--line-2'),
    live: g('--accent'),
    inkOn: g('--accent-ink'),
  };
}

/** Shared canvas plumbing: DPR-correct sizing that never drifts from the box. */
function fitCanvas(cv: HTMLCanvasElement, stage: HTMLElement): { w: number; h: number } | null {
  const rect = stage.getBoundingClientRect();
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
  if (!w || !h) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (cv.width !== bw || cv.height !== bh) {
    cv.width = bw;
    cv.height = bh;
  }
  const ctx = cv.getContext('2d');
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h };
}

/* ══════════════════════════════════════════════════════════
   The hero map
   ══════════════════════════════════════════════════════════ */

const K_REPEL = 9000;
const K_SPRING = 0.012;
const K_CENTER = 0.004;
const DAMP = 0.9;

export function initMap(): void {
  const cv = document.getElementById('map') as HTMLCanvasElement | null;
  if (!cv) return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;

  const stage = cv.parentElement as HTMLElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let seeds: NodeSeed[] = [];
  let rawLinks: [string, string][] = [];
  try {
    seeds = JSON.parse(cv.dataset.nodes ?? '[]');
    rawLinks = JSON.parse(cv.dataset.links ?? '[]');
  } catch {
    return;
  }
  if (!seeds.length) return;

  const nodes: Node[] = seeds.map((s) => ({ ...s, x: 0, y: 0, vx: 0, vy: 0, hot: false, fixed: false }));
  const byId: Record<string, Node> = {};
  for (const n of nodes) byId[n.id] = n;
  const links: Link[] = rawLinks.map(([a, b]) => ({ a: byId[a], b: byId[b] })).filter((l) => l.a && l.b);

  const core = byId.core ?? nodes[0];
  let selected: Node = core;
  let drag: { n: Node; px: number; py: number } | null = null;

  let W = 0;
  let H = 0;
  let C = readPalette();
  let seeded = false;

  let visible = true;
  let frameQueued = false;
  let dirty = true;

  function seed(): void {
    const cx = W * 0.46;
    const cy = H * 0.46;
    const R = Math.min(W, H) * 0.32;
    core.x = cx;
    core.y = cy;
    const ring = nodes.filter((n) => n !== core);
    ring.forEach((n, i) => {
      const a = (i / ring.length) * Math.PI * 2 - Math.PI / 2;
      n.x = cx + Math.cos(a) * R;
      n.y = cy + Math.sin(a) * R;
      n.vx = 0;
      n.vy = 0;
    });
  }

  function resize(): void {
    const prevW = W;
    const prevH = H;
    const size = fitCanvas(cv!, stage);
    if (!size) return;
    W = size.w;
    H = size.h;

    if (!seeded) {
      seed();
      seeded = true;
    } else if (prevW && prevH && (prevW !== W || prevH !== H)) {
      // keep whatever the visitor dragged; scale it into the new box
      const sx = W / prevW;
      const sy = H / prevH;
      for (const n of nodes) { n.x *= sx; n.y *= sy; n.vx = 0; n.vy = 0; }
    }
    dirty = true;
    requestFrame();
  }

  function isSettled(): boolean {
    for (const n of nodes) {
      if (Math.abs(n.vx) > 0.04 || Math.abs(n.vy) > 0.04) return false;
    }
    return true;
  }

  function step(): void {
    const cx = W * 0.46;
    const cy = H * 0.46;
    const rest = Math.min(W, H) * 0.33;

    for (const n of nodes) {
      if (n.fixed) continue;
      n.vx += (cx - n.x) * K_CENTER;
      n.vy += (cy - n.y) * K_CENTER;
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d2 = 1; }
        const d = Math.sqrt(d2);
        const f = K_REPEL / d2;
        const ux = dx / d;
        const uy = dy / d;
        if (!a.fixed) { a.vx -= (ux * f) / a.w; a.vy -= (uy * f) / a.w; }
        if (!b.fixed) { b.vx += (ux * f) / b.w; b.vy += (uy * f) / b.w; }
      }
    }
    for (const l of links) {
      const dx = l.b.x - l.a.x;
      const dy = l.b.y - l.a.y;
      const d = Math.hypot(dx, dy) || 1;
      const f = (d - rest) * K_SPRING;
      const ux = dx / d;
      const uy = dy / d;
      if (!l.a.fixed) { l.a.vx += (ux * f) / l.a.w; l.a.vy += (uy * f) / l.a.w; }
      if (!l.b.fixed) { l.b.vx -= (ux * f) / l.b.w; l.b.vy -= (uy * f) / l.b.w; }
    }
    for (const n of nodes) {
      if (n.fixed) continue;
      n.vx *= DAMP;
      n.vy *= DAMP;
      n.x += n.vx;
      n.y += n.vy;
      const pad = n.r + 70;
      if (n.x < pad) { n.x = pad; n.vx *= -0.4; }
      if (n.x > W - pad) { n.x = W - pad; n.vx *= -0.4; }
      if (n.y < pad) { n.y = pad; n.vy *= -0.4; }
      if (n.y > H - pad) { n.y = H - pad; n.vy *= -0.4; }
    }
  }

  function draw(): void {
    ctx!.clearRect(0, 0, W, H);
    for (const l of links) {
      const hot = l.a === selected || l.b === selected || l.a.hot || l.b.hot;
      ctx!.beginPath();
      ctx!.moveTo(l.a.x, l.a.y);
      ctx!.lineTo(l.b.x, l.b.y);
      ctx!.strokeStyle = hot ? C.live : C.rule;
      ctx!.lineWidth = hot ? 1.5 : 1;
      ctx!.stroke();
    }
    for (const n of nodes) {
      const on = n === selected || n.hot;
      const isCore = n === core;
      const r = on ? n.r + 2 : n.r;
      if (on) {
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, r + 7, 0, Math.PI * 2);
        ctx!.fillStyle = `${C.live}1f`;
        ctx!.fill();
      }
      ctx!.beginPath();
      ctx!.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx!.fillStyle = on ? C.live : isCore ? C.ink : C.bg;
      ctx!.fill();
      if (!on && !isCore) {
        ctx!.strokeStyle = C.ink;
        ctx!.lineWidth = 1.3;
        ctx!.stroke();
      }
      const lx = n.x + r + 9;
      ctx!.textAlign = 'left';
      ctx!.textBaseline = 'middle';
      ctx!.fillStyle = on ? C.live : C.ink;
      ctx!.font = `${isCore ? 500 : 400} ${isCore ? 14 : 13}px "Bricolage Grotesque", sans-serif`;
      ctx!.fillText(n.label, lx, n.y - 5);
      ctx!.fillStyle = on ? C.live : C.ink3;
      ctx!.font = '9.5px "JetBrains Mono", monospace';
      ctx!.fillText(n.kind.toUpperCase(), lx, n.y + 7);
    }
  }

  function requestFrame(): void {
    if (frameQueued) return;
    frameQueued = true;
    requestAnimationFrame(loop);
  }

  function loop(): void {
    frameQueued = false;
    if (!visible) return;
    const moving = !isSettled();
    if (moving) step();
    if (moving || dirty) { draw(); dirty = false; }
    if (moving) requestFrame();
  }

  function hit(x: number, y: number): Node | null {
    let best: Node | null = null;
    let bd = Infinity;
    for (const n of nodes) {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < Math.max(n.r + 12, 26) && d < bd) { bd = d; best = n; }
    }
    return best;
  }

  const local = (e: PointerEvent) => {
    const r = cv!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  cv.addEventListener('pointerdown', (e) => {
    const p = local(e);
    const n = hit(p.x, p.y);
    if (!n) return;
    cv.setPointerCapture(e.pointerId);
    cv.classList.add('is-dragging');
    drag = { n, px: p.x, py: p.y };
    n.fixed = true;
    select(n);
    requestFrame();
  });

  cv.addEventListener('pointermove', (e) => {
    const p = local(e);
    if (drag) {
      const n = drag.n;
      n.x = p.x;
      n.y = p.y;
      n.vx = (p.x - drag.px) * 0.9;
      n.vy = (p.y - drag.py) * 0.9;
      drag.px = p.x;
      drag.py = p.y;
      return;
    }
    const h = hit(p.x, p.y);
    for (const n of nodes) n.hot = n === h;
    cv.style.cursor = h ? 'grab' : 'default';
    requestFrame();
  });

  function release(e: PointerEvent): void {
    if (!drag) return;
    const n = drag.n;
    n.fixed = false;
    n.vx = Math.max(-24, Math.min(24, n.vx));
    n.vy = Math.max(-24, Math.min(24, n.vy));
    drag = null;
    dirty = true;
    requestFrame();
    cv!.classList.remove('is-dragging');
    if (cv!.hasPointerCapture(e.pointerId)) cv!.releasePointerCapture(e.pointerId);
  }

  cv.addEventListener('pointerup', release);
  cv.addEventListener('pointercancel', release);

  const ro = {
    kind: document.getElementById('ro-kind'),
    label: document.getElementById('ro-label'),
    desc: document.getElementById('ro-desc'),
  };

  function select(n: Node): void {
    selected = n;
    dirty = true;
    if (ro.kind) ro.kind.textContent = n.kind;
    if (ro.label) ro.label.textContent = n.label;
    if (ro.desc) ro.desc.textContent = n.desc;
  }

  cv.addEventListener('keydown', (e) => {
    const i = nodes.indexOf(selected);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      select(nodes[(i + 1) % nodes.length]);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      select(nodes[(i - 1 + nodes.length) % nodes.length]);
    }
  });

  window.addEventListener('palettechange', () => {
    C = readPalette();
    dirty = true;
    requestFrame();
  });

  resize();
  window.addEventListener('resize', resize);
  if ('ResizeObserver' in window) new ResizeObserver(() => resize()).observe(stage);
  document.fonts?.ready.then(() => resize()).catch(() => {});

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible) requestFrame();
    }, { threshold: 0 }).observe(stage);
  }

  select(core);
  if (reduce) {
    for (let i = 0; i < 500; i++) step();
    draw();
  } else {
    requestFrame();
  }
}

/* ══════════════════════════════════════════════════════════
   The tank
   ══════════════════════════════════════════════════════════ */

interface Worm {
  id: string;
  name: string;
  cve: string;
  vector: string;
  spread: number;
  effect: 'none' | 'crash' | 'shutdown' | 'cure';
  note: string;
}

const WORMS: Worm[] = [
  { id: 'slammer', name: 'SQL Slammer', cve: 'CVE-2002-0649',
    vector: 'UDP 1434 · SQL Resolution Service', spread: 30, effect: 'none',
    note: '376 bytes, one packet. 75,000 victims in ten minutes. Memory-only, so a reboot clears it.' },
  { id: 'blaster', name: 'Blaster', cve: 'CVE-2003-0352',
    vector: 'TCP 135 · RPC DCOM', spread: 58, effect: 'crash',
    note: 'Crashed the RPC service and put the host into a reboot loop.' },
  { id: 'sasser', name: 'Sasser', cve: 'CVE-2003-0533',
    vector: 'TCP 445 · LSASS', spread: 74, effect: 'shutdown',
    note: 'Crashed LSASS, which put the infected machine on a shutdown countdown.' },
  { id: 'welchia', name: 'Welchia', cve: 'CVE-2003-0352',
    vector: 'TCP 135 · RPC DCOM + WebDAV', spread: 66, effect: 'cure',
    note: 'Used the same exploit as Blaster, then deleted Blaster and installed the patch.' },
];

const wormById: Record<string, Worm> = {};
for (const w of WORMS) wormById[w.id] = w;

const CONTAINERS = [
  'ipa', 'panel', 'dns', 'media', 'cfproxy', 'trilium',
  'finance', 'twitch', 'changes', 'timeline', 'home', 'monitor',
];

type CellState = 'clean' | 'infected' | 'patched' | 'crashed';

interface Cell {
  name: string;
  i: number;
  state: CellState;
  worm: string | null;
  timer: number;
  spawn: number;
  flash: number;
  x: number;
  y: number;
}

interface Bug {
  x: number;
  y: number;
  vx: number;
  vy: number;
  target: number;
  worm: string;
  life: number;
  dead: boolean;
}

export function initTank(): void {
  const cv = document.getElementById('tank-canvas') as HTMLCanvasElement | null;
  if (!cv) return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;

  const stage = cv.parentElement as HTMLElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let cells: Cell[] = [];
  let bugs: Bug[] = [];
  let tankLinks: { a: number; b: number }[] = [];
  let cellR = 20;
  let W = 0;
  let H = 0;
  let tick = 0;
  let quiet = 0;
  let wipeTimer = 0;
  let C = readPalette();

  let visible = false;
  let frameQueued = false;
  let dirty = true;

  const LOG: { t: string; text: string; kind: string }[] = [];
  const logEl = document.getElementById('tank-log');
  const ro = {
    kind: document.getElementById('tank-ro-kind'),
    label: document.getElementById('tank-ro-label'),
    desc: document.getElementById('tank-ro-desc'),
  };

  function log(text: string, kind: string): void {
    const t = new Intl.DateTimeFormat('en-CA', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).format(new Date());
    LOG.unshift({ t, text, kind });
    if (LOG.length > 4) LOG.pop();
    if (!logEl) return;
    logEl.replaceChildren(
      ...LOG.map((e) => {
        const li = document.createElement('li');
        li.dataset.k = e.kind;
        const time = document.createElement('time');
        time.textContent = e.t;
        const span = document.createElement('span');
        span.textContent = e.text;
        li.append(time, span);
        return li;
      }),
    );
  }

  function setReadout(kind: string, label: string, desc: string): void {
    if (ro.kind) ro.kind.textContent = kind;
    if (ro.label) ro.label.textContent = label;
    if (ro.desc) ro.desc.textContent = desc;
  }

  function build(): void {
    cells = [];
    bugs = [];
    tankLinks = [];
    tick = 0;
    quiet = 0;
    wipeTimer = 0;
    cellR = Math.max(13, Math.min(21, Math.min(W, H) * 0.044));

    const cx = W * 0.5;
    const cy = H * 0.5;
    const maxR = Math.min(W, H) * 0.38;

    CONTAINERS.forEach((name, i) => {
      const ang = i * 2.399963;
      const r = maxR * Math.sqrt((i + 0.5) / CONTAINERS.length);
      cells.push({
        name, i, state: 'clean', worm: null, timer: 0, spawn: 0, flash: 0,
        x: cx + Math.cos(ang) * r,
        y: cy + Math.sin(ang) * r,
      });
    });

    const seen = new Set<string>();
    cells.forEach((c) => {
      cells
        .filter((o) => o !== c)
        .map((o) => ({ o, d: Math.hypot(o.x - c.x, o.y - c.y) }))
        .sort((p, q) => p.d - q.d)
        .slice(0, 2)
        .forEach(({ o }) => {
          const key = [c.i, o.i].sort((x, y) => x - y).join('-');
          if (seen.has(key)) return;
          seen.add(key);
          tankLinks.push({ a: c.i, b: o.i });
        });
    });
  }

  const vulnerable = () => cells.filter((c) => c.state === 'clean');

  function infect(c: Cell, w: Worm): void {
    if (c.state === 'patched') return;
    if (w.effect === 'cure') {
      const had = c.worm === 'blaster' && c.state === 'infected';
      c.state = 'patched';
      c.worm = 'welchia';
      c.timer = 0;
      c.spawn = 0;
      c.flash = 1;
      log(had ? `welchia removed blaster from ${c.name}` : `${c.name} patched by welchia`, 'ok');
      return;
    }
    c.state = 'infected';
    c.worm = w.id;
    c.spawn = 0;
    c.flash = 1;
    log(`${c.name} infected — ${w.name}`, 'bad');
    if (w.effect === 'crash') c.timer = 210;
    if (w.effect === 'shutdown') c.timer = 190;
    if (w.effect === 'none') c.timer = 240;
  }

  function spawnBug(fromIdx: number, worm: string): void {
    if (bugs.length >= 4) return;
    const w = wormById[worm];
    const pool = w && w.effect === 'cure'
      ? cells.filter((c) => c.i !== fromIdx && (c.state === 'clean' || c.state === 'infected'))
      : vulnerable().filter((c) => c.i !== fromIdx);
    if (!pool.length) return;
    const t = pool[Math.floor(Math.random() * pool.length)];
    const s = cells[fromIdx];
    const ang = Math.atan2(t.y - s.y, t.x - s.x);
    bugs.push({
      x: s.x, y: s.y,
      vx: Math.cos(ang) * 0.8, vy: Math.sin(ang) * 0.8,
      target: t.i, worm, life: 0, dead: false,
    });
  }

  function release(id: string): void {
    const w = wormById[id];
    if (!w) return;
    const pool = w.effect === 'cure'
      ? cells.filter((c) => c.state === 'clean' || c.state === 'infected')
      : vulnerable();
    if (!pool.length) return;
    const victim = pool[Math.floor(Math.random() * pool.length)];
    infect(victim, w);
    log(`${w.name} got in — ${victim.name}`, 'warn');
  }

  function simulate(): void {
    tick++;

    const active = cells.some((c) => c.state === 'infected' || c.state === 'crashed');
    if (!active && !bugs.length) {
      if (++quiet > 110) {
        quiet = 0;
        const pool = vulnerable();
        if (pool.length) release(WORMS[Math.floor(Math.random() * WORMS.length)].id);
      }
    } else {
      quiet = 0;
    }

    for (const c of cells) {
      if (c.state === 'crashed') {
        if (c.timer > 0 && --c.timer === 0) {
          c.state = 'clean';
          c.flash = 1;
          log(`${c.name} rebooted`, 'ok');
        }
        continue;
      }
      const spreading = c.state === 'infected' || (c.state === 'patched' && c.worm === 'welchia');
      if (!spreading || !c.worm) continue;
      const w = wormById[c.worm];
      if (!w) continue;
      if (++c.spawn >= w.spread) {
        c.spawn = 0;
        spawnBug(c.i, c.worm);
      }
      if (c.timer > 0 && --c.timer === 0) {
        if (w.effect === 'crash') {
          c.state = 'crashed';
          c.worm = null;
          c.timer = 120;
          c.flash = 1;
          log(`${c.name} crashed`, 'bad');
        } else if (w.effect === 'shutdown') {
          c.state = 'clean';
          c.worm = null;
          c.flash = 1;
          log(`${c.name} rebooted on the shutdown timer`, 'ok');
        } else if (w.effect === 'none') {
          c.state = 'clean';
          c.worm = null;
          c.flash = 1;
          log(`${c.name} cleared — memory-only worm`, 'ok');
        }
      }
    }

    for (const b of bugs) {
      const t = cells[b.target];
      if (!t || t.state === 'patched') {
        const pool = vulnerable();
        if (!pool.length) { b.dead = true; continue; }
        b.target = pool[Math.floor(Math.random() * pool.length)].i;
        continue;
      }
      const w = wormById[b.worm];
      const ang = Math.atan2(t.y - b.y, t.x - b.x);
      b.vx += Math.cos(ang) * 0.05;
      b.vy += Math.sin(ang) * 0.05;
      b.vx += (Math.random() - 0.5) * 0.11;
      b.vy += (Math.random() - 0.5) * 0.11;
      const sp = Math.hypot(b.vx, b.vy) || 1;
      if (sp > 1.45) { b.vx = (b.vx / sp) * 1.45; b.vy = (b.vy / sp) * 1.45; }
      b.x += b.vx;
      b.y += b.vy;
      b.life++;
      if (b.x < 12) { b.x = 12; b.vx = Math.abs(b.vx); }
      if (b.x > W - 12) { b.x = W - 12; b.vx = -Math.abs(b.vx); }
      if (b.y < 12) { b.y = 12; b.vy = Math.abs(b.vy); }
      if (b.y > H - 12) { b.y = H - 12; b.vy = -Math.abs(b.vy); }

      if (Math.hypot(t.x - b.x, t.y - b.y) < cellR * 0.85 && w) {
        if (t.state === 'clean' || (w.effect === 'cure' && t.state === 'infected')) infect(t, w);
        b.dead = true;
      }
    }
    bugs = bugs.filter((b) => !b.dead && b.life < 1400);

    if (++wipeTimer > 520) {
      wipeTimer = 0;
      const patched = cells.filter((c) => c.state === 'patched');
      if (patched.length) {
        const v = patched[Math.floor(Math.random() * patched.length)];
        v.state = 'clean';
        v.worm = null;
        v.flash = 1;
        log(`${v.name} rebuilt — patch gone`, 'ok');
      }
    }

    for (const c of cells) if (c.flash > 0) c.flash -= 0.02;

    const inf = cells.filter((c) => c.state === 'infected').length;
    const down = cells.filter((c) => c.state === 'crashed').length;
    const patched = cells.filter((c) => c.state === 'patched').length;
    const st = document.getElementById('tank-state');
    if (st) {
      st.textContent = inf ? `${inf} infected`
        : down ? `${down} down`
        : patched ? `${patched} patched`
        : 'all clean';
      st.style.color = inf ? C.live : '';
    }
  }

  function draw(): void {
    ctx!.clearRect(0, 0, W, H);

    for (const l of tankLinks) {
      const a = cells[l.a];
      const b = cells[l.b];
      if (!a || !b) continue;
      const hot = a.state === 'infected' || b.state === 'infected';
      ctx!.beginPath();
      ctx!.moveTo(a.x, a.y);
      ctx!.lineTo(b.x, b.y);
      ctx!.strokeStyle = hot ? C.live : C.rule;
      ctx!.globalAlpha = hot ? 0.55 : 1;
      ctx!.lineWidth = 1;
      ctx!.stroke();
      ctx!.globalAlpha = 1;
    }

    for (const c of cells) {
      const inf = c.state === 'infected';
      const patched = c.state === 'patched';
      const crashed = c.state === 'crashed';
      const pulse = inf ? 1 + Math.sin(tick * 0.16) * 0.07 : 1;
      const r = cellR * pulse;

      if (inf) {
        ctx!.beginPath();
        ctx!.arc(c.x, c.y, r + 9, 0, Math.PI * 2);
        ctx!.fillStyle = `${C.live}22`;
        ctx!.fill();
      }
      if (patched) {
        ctx!.beginPath();
        ctx!.arc(c.x, c.y, r + 4, 0, Math.PI * 2);
        ctx!.strokeStyle = C.ink;
        ctx!.lineWidth = 1;
        ctx!.globalAlpha = 0.55;
        ctx!.stroke();
        ctx!.globalAlpha = 1;
      }

      ctx!.beginPath();
      ctx!.arc(c.x, c.y, r, 0, Math.PI * 2);
      if (inf) {
        ctx!.fillStyle = C.live;
        ctx!.fill();
      } else if (crashed) {
        ctx!.fillStyle = C.bg;
        ctx!.fill();
        ctx!.setLineDash([3, 3]);
        ctx!.strokeStyle = C.rule;
        ctx!.lineWidth = 1;
        ctx!.stroke();
        ctx!.setLineDash([]);
      } else {
        ctx!.fillStyle = C.bg;
        ctx!.fill();
        ctx!.strokeStyle = C.ink;
        ctx!.lineWidth = patched ? 1.8 : 1.2;
        ctx!.stroke();
      }

      if (c.flash > 0) {
        ctx!.globalAlpha = c.flash * 0.45;
        ctx!.fillStyle = C.live;
        ctx!.beginPath();
        ctx!.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.globalAlpha = 1;
      }

      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.fillStyle = inf ? C.inkOn : C.ink3;
      ctx!.font = `${Math.max(7.5, Math.min(10, cellR * 0.44))}px "JetBrains Mono", monospace`;
      ctx!.fillText(c.name, c.x, c.y);
    }

    for (const b of bugs) {
      for (let k = 5; k >= 1; k--) {
        const px = b.x - b.vx * k * 1.7;
        const py = b.y - b.vy * k * 1.7;
        ctx!.beginPath();
        ctx!.arc(px, py, 3.4 - k * 0.5, 0, Math.PI * 2);
        ctx!.fillStyle = C.live;
        ctx!.globalAlpha = 0.46 - k * 0.075;
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      ctx!.beginPath();
      ctx!.moveTo(b.x, b.y);
      ctx!.lineTo(b.x - b.vx * 4.5 + Math.sin(tick * 0.3) * 2.2, b.y - b.vy * 4.5 + Math.cos(tick * 0.3) * 2.2);
      ctx!.strokeStyle = C.live;
      ctx!.lineWidth = 1;
      ctx!.globalAlpha = 0.45;
      ctx!.stroke();
      ctx!.globalAlpha = 1;
      ctx!.beginPath();
      ctx!.arc(b.x, b.y, 3.6, 0, Math.PI * 2);
      ctx!.fillStyle = C.live;
      ctx!.fill();
    }
  }

  function requestFrame(): void {
    if (frameQueued) return;
    frameQueued = true;
    requestAnimationFrame(loop);
  }

  function loop(): void {
    frameQueued = false;
    if (!visible) return;
    simulate();
    draw();
    requestFrame();
  }

  function resize(): void {
    const size = fitCanvas(cv!, stage);
    if (!size) return;
    W = size.w;
    H = size.h;
    build();
    dirty = true;
    if (visible) requestFrame();
  }

  const local = (e: PointerEvent) => {
    const r = cv!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  cv.addEventListener('pointermove', (e) => {
    const p = local(e);
    let best: Cell | null = null;
    let bd = Infinity;
    for (const c of cells) {
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (d < cellR + 6 && d < bd) { bd = d; best = c; }
    }
    if (best) {
      const w = best.worm ? wormById[best.worm] : null;
      if (best.state === 'infected' && w) {
        setReadout(`${w.name} · ${w.cve}`, best.name, `${w.vector}. ${w.note}`);
      } else if (best.state === 'patched') {
        setReadout('patched', best.name, 'Welchia got here first. It is immune until the patch is rebuilt away.');
      } else if (best.state === 'crashed') {
        setReadout('crashed', best.name, 'The RPC service is down. It will reboot.');
      } else {
        setReadout('unpatched', best.name, 'Nothing on it yet. No patches, so it is only a matter of time.');
      }
      cv.style.cursor = 'pointer';
    } else {
      setReadout('the tank', 'twelve unpatched hosts',
        'Worms get in and spread. Hover a host to see what is on it.');
      cv.style.cursor = 'default';
    }
  });

  window.addEventListener('palettechange', () => {
    C = readPalette();
    dirty = true;
    if (visible) requestFrame();
  });

  resize();
  window.addEventListener('resize', resize);
  if ('ResizeObserver' in window) new ResizeObserver(() => resize()).observe(stage);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      if (visible) requestFrame();
    }, { threshold: 0.1 }).observe(stage);
  } else {
    visible = true;
    requestFrame();
  }
}
