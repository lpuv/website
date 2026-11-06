/**
 * The hero has two depths.
 *
 *   map  — the machines Luna runs, as a force-directed graph you can drag.
 *   tank — a simulated network of twelve unpatched VMs, after xkcd 350: viruses
 *          swim between hosts, breed, and get wiped by a monitor at random.
 *
 * Both share one canvas. Colours come from the CSS custom properties so the
 * canvas follows the palette.
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

interface Cell {
  name: string;
  i: number;
  state: 'clean' | 'infected' | 'wiped';
  x: number;
  y: number;
  spawn: number;
  flash: number;
}

interface Bug {
  x: number;
  y: number;
  vx: number;
  vy: number;
  target: number;
  strain: string;
  life: number;
  dead: boolean;
}

interface Palette {
  bg: string;
  ink: string;
  ink3: string;
  rule: string;
  live: string;
  inkOn: string;
}

const K_REPEL = 9000;
const K_SPRING = 0.012;
const K_CENTER = 0.004;
const DAMP = 0.9;

/** The twelve containers on pinwheel. Real names, from the nix-lab record. */
const CONTAINERS = [
  'ipa', 'panel', 'dns', 'media', 'cfproxy', 'trilium',
  'finance', 'twitch', 'changes', 'timeline', 'home', 'monitor',
];

const STRAINS = ['blaster', 'w32.welchia', 'sobig', 'mydoom', 'sqlslammer'];

/** A hard cap keeps the tank readable: a few sick machines, not a wipeout. */
const INFECT_CAP = 4;

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

  /* ── depth 1: the machines ─────────────────────────────── */
  const nodes: Node[] = seeds.map((s) => ({ ...s, x: 0, y: 0, vx: 0, vy: 0, hot: false, fixed: false }));
  const byId: Record<string, Node> = {};
  for (const n of nodes) byId[n.id] = n;
  const links: Link[] = rawLinks.map(([a, b]) => ({ a: byId[a], b: byId[b] })).filter((l) => l.a && l.b);

  const core = byId.core ?? nodes[0];
  let selected: Node = core;
  let drag: { n: Node; px: number; py: number } | null = null;

  /* ── depth 2: the tank ─────────────────────────────────── */
  let cells: Cell[] = [];
  let bugs: Bug[] = [];
  let tankLinks: { a: number; b: number }[] = [];
  let wipeTimer = 0;
  let spawnTimer = 0;
  let idle = 0;
  let cellR = 20;

  let mode: 'map' | 'run' = 'map';
  let tick = 0;
  let W = 0;
  let H = 0;
  let C = readPalette();

  const cleanCells = () => cells.filter((c) => c.state === 'clean');
  const infCount = () => cells.filter((c) => c.state === 'infected').length;

  function buildTank(): void {
    cells = [];
    bugs = [];
    tankLinks = [];
    wipeTimer = 0;
    spawnTimer = 0;
    idle = 0;
    cellR = Math.max(13, Math.min(21, Math.min(W, H) * 0.044));

    const cx = W * 0.5;
    const cy = H * 0.5;
    const maxR = Math.min(W, H) * 0.38;

    CONTAINERS.forEach((name, i) => {
      const ang = i * 2.399963; // golden angle: organic, nothing lines up
      const r = maxR * Math.sqrt((i + 0.5) / CONTAINERS.length);
      cells.push({
        name,
        i,
        state: 'clean',
        x: cx + Math.cos(ang) * r,
        y: cy + Math.sin(ang) * r,
        spawn: 0,
        flash: 0,
      });
    });

    // it is still a network: wire each machine to its two nearest neighbours
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

  /* ── the event log ─────────────────────────────────────── */
  const LOG: { t: string; text: string; kind: string }[] = [];
  const logEl = document.getElementById('map-log');

  function log(text: string, kind: string): void {
    const t = new Intl.DateTimeFormat('en-CA', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).format(new Date());
    LOG.unshift({ t, text, kind });
    if (LOG.length > 4) LOG.pop();
    renderLog();
  }

  function renderLog(): void {
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

  function spawnBug(fromIdx: number): void {
    if (bugs.length >= 3) return;
    const pool = cleanCells().filter((c) => c.i !== fromIdx);
    if (!pool.length) return;
    const t = pool[Math.floor(Math.random() * pool.length)];
    const s = cells[fromIdx];
    const ang = Math.atan2(t.y - s.y, t.x - s.x);
    bugs.push({
      x: s.x,
      y: s.y,
      vx: Math.cos(ang) * 0.8,
      vy: Math.sin(ang) * 0.8,
      target: t.i,
      strain: STRAINS[Math.floor(Math.random() * STRAINS.length)],
      life: 0,
      dead: false,
    });
  }

  function simulate(): void {
    if (mode !== 'run') return;
    tick++;

    // The tank must never sit dead. If nothing is infected and no virus is
    // loose, the monitor lets a new one in — otherwise a well-timed wipe
    // leaves the aquarium permanently clean.
    if (!bugs.length && !infCount()) {
      if (++idle > 90) {
        idle = 0;
        const pool = cleanCells();
        if (pool.length) {
          const victim = pool[Math.floor(Math.random() * pool.length)];
          victim.state = 'infected';
          victim.flash = 1;
          log(`${victim.name} executed an attachment`, 'warn');
          spawnBug(victim.i);
        }
      }
    } else {
      idle = 0;
    }

    // infected machines breed more viruses
    for (const c of cells) {
      if (c.state !== 'infected') continue;
      if (infCount() >= INFECT_CAP) break;
      if (++c.spawn > 220) {
        c.spawn = 0;
        spawnBug(c.i);
      }
    }

    // viruses swim
    for (const b of bugs) {
      let t = cells[b.target];
      if (!t || t.state !== 'clean') {
        const pool = cleanCells();
        if (!pool.length) {
          b.dead = true;
          continue;
        }
        t = pool[Math.floor(Math.random() * pool.length)];
        b.target = t.i;
      }
      const ang = Math.atan2(t.y - b.y, t.x - b.x);
      b.vx += Math.cos(ang) * 0.05;
      b.vy += Math.sin(ang) * 0.05;
      b.vx += (Math.random() - 0.5) * 0.11;
      b.vy += (Math.random() - 0.5) * 0.11;

      const sp = Math.hypot(b.vx, b.vy) || 1;
      if (sp > 1.45) {
        b.vx = (b.vx / sp) * 1.45;
        b.vy = (b.vy / sp) * 1.45;
      }

      b.x += b.vx;
      b.y += b.vy;
      b.life++;

      if (b.x < 12) { b.x = 12; b.vx = Math.abs(b.vx); }
      if (b.x > W - 12) { b.x = W - 12; b.vx = -Math.abs(b.vx); }
      if (b.y < 12) { b.y = 12; b.vy = Math.abs(b.vy); }
      if (b.y > H - 12) { b.y = H - 12; b.vy = -Math.abs(b.vy); }

      for (const c of cells) {
        if (c.state !== 'clean') continue;
        if (Math.hypot(c.x - b.x, c.y - b.y) < cellR * 0.85) {
          if (infCount() < INFECT_CAP) {
            c.state = 'infected';
            c.flash = 1;
            log(`${c.name} infected — ${b.strain}`, 'bad');
          }
          b.dead = true;
          break;
        }
      }
    }
    bugs = bugs.filter((b) => !b.dead && b.life < 1200);

    // the monitor wipes and rebuilds at random
    if (++wipeTimer > 200) {
      wipeTimer = 0;
      const sick = cells.filter((c) => c.state === 'infected');
      if (sick.length > 1) {
        const v = sick[Math.floor(Math.random() * sick.length)];
        v.state = 'wiped';
        v.flash = 1;
        log(`${v.name} wiped by monitor`, 'ok');
      }
    }
    if (++spawnTimer > 150) {
      spawnTimer = 0;
      const dead = cells.filter((c) => c.state === 'wiped');
      if (dead.length) {
        const v = dead[Math.floor(Math.random() * dead.length)];
        v.state = 'clean';
        v.flash = 1;
        log(`${v.name} rebuilt clean`, 'ok');
      }
    }

    for (const c of cells) if (c.flash > 0) c.flash -= 0.02;

    const inf = infCount();
    const wip = cells.filter((c) => c.state === 'wiped').length;
    const st1 = document.getElementById('stat-hosts');
    const st2 = document.getElementById('stat-debt');
    if (st1) {
      st1.textContent = inf ? `${inf} infected` : wip ? `${wip} wiped` : 'all clean';
      st1.style.color = inf ? C.live : '';
    }
    if (st2) st2.textContent = `patch debt ${wip + inf}`;
  }

  /* ── geometry ──────────────────────────────────────────── */
  /**
   * The canvas bitmap must always match its CSS box. If they diverge the drawing
   * is scaled and every pointer hit lands off the node it looks like it hit, so
   * the box is observed rather than sampled once at load.
   */
  let seeded = false;

  function resize(): void {
    const rect = stage.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (!w || !h) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (cv!.width !== bw || cv!.height !== bh) {
      cv!.width = bw;
      cv!.height = bh;
    }

    const prevW = W;
    const prevH = H;
    W = w;
    H = h;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!seeded) {
      seed();
      seeded = true;
    } else if (prevW && prevH && (prevW !== w || prevH !== h)) {
      // keep whatever the visitor dragged; scale it into the new box
      const sx = w / prevW;
      const sy = h / prevH;
      for (const n of nodes) { n.x *= sx; n.y *= sy; n.vx = 0; n.vy = 0; }
      if (mode === 'run') {
        for (const c of cells) { c.x *= sx; c.y *= sy; }
        for (const b of bugs) { b.x *= sx; b.y *= sy; }
      }
    }
    dirty = true;
    requestFrame();
  }

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

  /* ── draw ──────────────────────────────────────────────── */
  function drawMap(): void {
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

  function drawTank(): void {
    // the network, drawn first so machines sit on top of it
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

    // machines — fixed nodes, not creatures
    for (const c of cells) {
      const inf = c.state === 'infected';
      const wip = c.state === 'wiped';
      const pulse = inf ? 1 + Math.sin(tick * 0.16) * 0.07 : 1;
      const r = cellR * pulse;

      if (inf) {
        ctx!.beginPath();
        ctx!.arc(c.x, c.y, r + 9, 0, Math.PI * 2);
        ctx!.fillStyle = `${C.live}22`;
        ctx!.fill();
      }
      ctx!.beginPath();
      ctx!.arc(c.x, c.y, r, 0, Math.PI * 2);
      if (inf) {
        ctx!.fillStyle = C.live;
        ctx!.fill();
      } else if (wip) {
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
        ctx!.lineWidth = 1.2;
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

    // viruses, swimming
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

  function draw(): void {
    ctx!.clearRect(0, 0, W, H);
    if (mode === 'map') drawMap();
    else drawTank();
  }

  /**
   * The loop parks itself. A settled map and a scrolled-away hero cost nothing;
   * anything that changes state calls requestFrame() to wake it.
   */
  let visible = true;
  let frameQueued = false;
  let dirty = true;

  function isSettled(): boolean {
    for (const n of nodes) {
      if (Math.abs(n.vx) > 0.04 || Math.abs(n.vy) > 0.04) return false;
    }
    return true;
  }

  function requestFrame(): void {
    if (frameQueued) return;
    frameQueued = true;
    requestAnimationFrame(loop);
  }

  function loop(): void {
    frameQueued = false;
    if (!visible) return;

    const running = mode === 'run';
    const moving = running || !isSettled();

    if (moving) step();
    if (running) simulate();
    if (moving || dirty) {
      draw();
      dirty = false;
    }
    if (moving) requestFrame();
  }

  /* ── interaction ───────────────────────────────────────── */
  function hitNode(x: number, y: number): Node | null {
    let best: Node | null = null;
    let bd = Infinity;
    for (const n of nodes) {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < Math.max(n.r + 12, 26) && d < bd) { bd = d; best = n; }
    }
    return best;
  }

  function hitCell(x: number, y: number): Cell | null {
    let best: Cell | null = null;
    let bd = Infinity;
    for (const c of cells) {
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < cellR + 6 && d < bd) { bd = d; best = c; }
    }
    return best;
  }

  const local = (e: PointerEvent) => {
    const r = cv!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  cv.addEventListener('pointerdown', (e) => {
    if (mode !== 'map') return;
    const p = local(e);
    const n = hitNode(p.x, p.y);
    if (!n) return;
    cv.setPointerCapture(e.pointerId);
    cv.classList.add('is-dragging');
    requestFrame();
    drag = { n, px: p.x, py: p.y };
    n.fixed = true;
    select(n);
  });

  cv.addEventListener('pointermove', (e) => {
    const p = local(e);

    if (mode === 'run') {
      const c = hitCell(p.x, p.y);
      if (c) {
        setReadout(
          c.state === 'infected' ? 'infected' : c.state === 'wiped' ? 'wiped' : 'container',
          c.name,
          c.state === 'infected'
            ? 'Something got in. It is shedding viruses onto its neighbours.'
            : c.state === 'wiped'
              ? 'The monitor took it down. It will be rebuilt clean.'
              : 'Clean for now. No patches, so it is only a matter of time.',
        );
        cv.style.cursor = 'pointer';
      } else {
        setReadout('the tank', 'twelve VMs, no patches',
          'They run whatever arrives by email and share files with each other.');
        cv.style.cursor = 'default';
      }
      return;
    }

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
    const h = hitNode(p.x, p.y);
    for (const n of nodes) n.hot = n === h;
    cv.style.cursor = h ? 'grab' : 'default';
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

  /* ── readout ───────────────────────────────────────────── */
  const ro = {
    kind: document.getElementById('ro-kind'),
    label: document.getElementById('ro-label'),
    desc: document.getElementById('ro-desc'),
  };

  function setReadout(kind: string, label: string, desc: string): void {
    dirty = true;
    if (ro.kind) ro.kind.textContent = kind;
    if (ro.label) ro.label.textContent = label;
    if (ro.desc) ro.desc.textContent = desc;
  }

  function select(n: Node): void {
    selected = n;
    dirty = true;
    requestFrame();
    setReadout(n.kind, n.label, n.desc);
  }

  cv.addEventListener('keydown', (e) => {
    if (e.key === 't' || e.key === 'T') {
      setMode(mode === 'run' ? 'map' : 'run');
      return;
    }
    if (mode !== 'map') return;
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

  /* ── depth switch ──────────────────────────────────────── */
  const btnMap = document.getElementById('depth-map');
  const btnRun = document.getElementById('depth-run');
  const head = document.getElementById('tankhead');
  const hint = document.getElementById('ro-hint');

  function setMode(m: 'map' | 'run'): void {
    mode = m;
    dirty = true;
    requestFrame();
    btnMap?.setAttribute('aria-pressed', String(m === 'map'));
    btnRun?.setAttribute('aria-pressed', String(m === 'run'));
    LOG.length = 0;
    renderLog();

    if (m === 'run') {
      buildTank();
      tick = 0;
      if (head) head.hidden = false;
      if (hint) hint.textContent = 'hover a machine · click “map” to go back';
      setReadout('the tank', 'twelve VMs, no patches',
        'They run whatever arrives by email and share files with each other.');
      const st1 = document.getElementById('stat-hosts');
      const st2 = document.getElementById('stat-debt');
      if (st1) { st1.textContent = 'all clean'; st1.style.color = ''; }
      if (st2) st2.textContent = 'patch debt 0';
    } else {
      if (head) head.hidden = true;
      if (hint) hint.textContent = 'drag to move · “the tank” opens the network';
      const st1 = document.getElementById('stat-hosts');
      const st2 = document.getElementById('stat-debt');
      if (st1) { st1.textContent = `${nodes.length - 1} projects on the map`; st1.style.color = ''; }
      if (st2) st2.textContent = `${seeds.length - 1} machines`;
      select(core);
    }
  }

  btnMap?.addEventListener('click', () => setMode('map'));
  btnRun?.addEventListener('click', () => setMode('run'));

  const onPalette = () => {
    C = readPalette();
    dirty = true;
    requestFrame();
  };
  window.addEventListener('palettechange', onPalette);

  /* ── boot ──────────────────────────────────────────────── */
  resize();
  window.addEventListener('resize', resize);

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => resize());
    observer.observe(stage);
  }
  document.fonts?.ready.then(() => resize()).catch(() => {});

  select(core);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
        if (visible) requestFrame();
      },
      { threshold: 0 },
    ).observe(stage);
  }

  if (reduce) {
    for (let i = 0; i < 500; i++) step();
    draw();
  } else {
    requestFrame();
  }
}
