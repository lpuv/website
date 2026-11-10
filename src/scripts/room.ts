/**
 * The room with the tree. A tiny overworld: walk around, talk to whoever is
 * behind the tree, or leave through either side.
 */
import { Dialogue, inventory, type Line } from './dialogue';
import { ambient, play } from './sfx';
import { drawCat, drawTree, loadOverrides, type Sprite } from './sprites';

const H = 180;
const SPEED = 1.15;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Leaf = { x: number; y: number; vx: number; vy: number; floor: number; life: number; col: string; phase: number };

export function initRoom() {
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
  let tree = drawTree();
  let treeSprite: Sprite = tree.canvas;
  let cat = drawCat();
  let playerImg: Sprite | null = null;

  const T = { x: 160, y: 120 }; // trunk base in room coords
  const P = { x: 100, y: 124, dir: 1, moving: false, step: 0 };
  let target: { x: number; y: number } | null = null;
  const keys = new Set<string>();
  const leaves: Leaf[] = [];
  let visible = true;
  let leaving = false;
  let behindWarned = false;
  let t0 = performance.now();

  // --- layout -------------------------------------------------------------
  const resize = () => {
    const r = stage.getBoundingClientRect();
    const aspect = Math.max(1.0, Math.min(2.4, r.width / Math.max(1, r.height)));
    const nextW = Math.round(H * aspect);
    const ratio = nextW / W;
    W = nextW;
    T.x = Math.round(W / 2);
    P.x = Math.max(8, Math.min(W - 8, P.x * ratio));
    buf.width = W;
    buf.height = H;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    view.width = Math.round(r.width * dpr);
    view.height = Math.round(r.height * dpr);
  };
  new ResizeObserver(resize).observe(stage);
  resize();
  P.x = T.x - Math.min(70, W * 0.3);

  void loadOverrides().then((o) => {
    if (o.tree) {
      treeSprite = o.tree;
      tree = { ...tree, baseX: o.tree.width / 2, baseY: o.tree.height, crownBottom: o.tree.height * 0.75 };
    }
    if (o.player) playerImg = o.player;
  });

  // --- talking ------------------------------------------------------------
  const talks = () => Number(localStorage.getItem('cc.talks') ?? '0');
  const man = (text: string) => ({ text, voice: 0.72 });

  const menu = (prompt: string): Line => ({
    ...man(prompt),
    choices: [
      { id: 'work', label: 'Show me the work' },
      { id: 'who', label: "Who's Luna?" },
      { id: 'egg', label: 'Anything for me?' },
      { id: 'hurry', label: "I'm in a hurry" },
      { id: 'bye', label: 'Bye' },
    ],
  });

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });

  async function talk() {
    if (dlg.open || leaving) return;
    keys.clear();
    target = null;
    const n = talks();
    localStorage.setItem('cc.talks', String(n + 1));
    ambient(true);
    box.classList.toggle('dlg--top', P.y > H * 0.72);

    let opening: Line[];
    if (n === 0) {
      opening = [
        "* (It's a quiet place. There's a tree here.)",
        '* (Someone is standing behind it.)',
        man('* oh. hello.'),
        man("* this is luna's website. she isn't around, so i keep an eye on it."),
        man('* she builds systems that have to keep running.'),
        man('* satellite firmware. a homelab built from one file. packages in fedora.'),
      ];
    } else if (n >= 6 && n % 6 === 0) {
      opening = [
        man('* you talk to me more than most people.'),
        man("* ...most people don't notice i'm here at all."),
      ];
    } else {
      opening = ['* (The man is still behind the tree.)', man(n === 1 ? '* oh. you came back.' : '* hello again.')];
    }

    let pick = await dlg.say([...opening, menu('* what are you looking for?')], { keepOpen: true });
    while (pick && pick !== 'bye') {
      let next: Line[] = [];
      if (pick === 'work') {
        await dlg.say([man("* it's further down. she wrote down what was hard about each one.")]);
        scrollTo('work');
        return;
      }
      if (pick === 'who') {
        next = [
          man('* luna puvilland. computer engineering at mcgill, class of 2029.'),
          man("* she leads command and data handling for mcgill's cubesat. it's going to space, eventually."),
          man('* she packages software for fedora, and takes old software apart to see how it breaks.'),
          man("* she's looking for internships. infrastructure, security, embedded."),
          man("* ...i've never actually seen her. she seems nice."),
        ];
      }
      if (pick === 'egg') {
        if (!inventory.has('egg')) {
          await dlg.say([man('* here. take this.')], { keepOpen: true });
          play('item');
          inventory.add('egg');
          next = [
            '* (You got the EGG.)',
            man("* it's her resume. it's shaped like an egg. don't ask me why."),
            "* (It's in your ITEM menu, up top.)",
          ];
        } else {
          next = [man('* i only had the one egg.'), man("* it's still in your ITEM menu.")];
        }
      }
      if (pick === 'hurry') {
        const go = await dlg.say(
          [
            man("* fair. here's the short version."),
            man('* systems, security, embedded. mcgill, 2029. open to internships.'),
            {
              ...man('* where to?'),
              choices: [
                { id: 'resume', label: 'Resume' },
                { id: 'email', label: 'Email her' },
                { id: 'stay', label: 'Never mind' },
              ],
            },
          ],
          { keepOpen: true },
        );
        if (go === 'resume') return void (location.href = '/resume/');
        if (go === 'email') {
          dlg.close();
          location.href = 'mailto:luna@craftcat.dev';
          return;
        }
      }
      pick = await dlg.say([...next, menu('* anything else?')], { keepOpen: true });
    }
    if (pick === 'bye') await dlg.say([man('* see you.')]);
    else dlg.close();
  }

  box.addEventListener('dlg:close', () => {
    ambient(false);
    stage.focus({ preventScroll: true });
  });

  // --- input --------------------------------------------------------------
  const near = () => Math.hypot(P.x - T.x, (P.y - T.y) * 1.4) < 34;
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
    const isArrow = k.startsWith('arrow');
    if (MOVE[k] && (!isArrow || stageFocused())) {
      keys.add(MOVE[k]);
      target = null;
      e.preventDefault();
      return;
    }
    if (k === 'z' || (k === 'enter' && stageFocused())) {
      if (near() || stageFocused()) {
        e.preventDefault();
        void talk();
      }
    }
  });
  window.addEventListener('keyup', (e) => {
    const m = MOVE[e.key.toLowerCase()];
    if (m) keys.delete(m);
  });
  window.addEventListener('blur', () => keys.clear());

  const toRoom = (e: PointerEvent) => {
    const r = view.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  view.addEventListener('pointerdown', (e) => {
    if (dlg.open) return;
    const p = toRoom(e);
    const onTree = Math.abs(p.x - T.x) < 46 && p.y < T.y + 4 && p.y > T.y - tree.baseY;
    if (onTree) {
      void talk();
      return;
    }
    target = { x: p.x, y: Math.max(66, p.y) };
  });

  new IntersectionObserver(([entry]) => {
    visible = entry.intersectionRatio > 0.35;
    if (!visible) keys.clear();
  }, { threshold: [0, 0.35, 1] }).observe(stage);

  // --- simulation ---------------------------------------------------------
  const blocked = (x: number, y: number) => Math.abs(x - T.x) < 13 && y > T.y - 16 && y < T.y + 3;

  function leave(href: string) {
    if (leaving) return;
    leaving = true;
    stage.classList.add('is-leaving');
    play('select');
    setTimeout(() => (location.href = href), reduce ? 0 : 380);
  }

  function update(dt: number) {
    let dx = 0;
    let dy = 0;
    if (!dlg.open) {
      if (keys.has('left')) dx -= 1;
      if (keys.has('right')) dx += 1;
      if (keys.has('up')) dy -= 1;
      if (keys.has('down')) dy += 1;
      if (target) {
        const tx = target.x - P.x;
        const ty = target.y - P.y;
        const d = Math.hypot(tx, ty);
        if (d < 1.5) target = null;
        else {
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

    const nx = P.x + dx;
    const ny = Math.max(66, Math.min(H - 3, P.y + dy));
    const hitX = blocked(nx, P.y);
    const hitY = blocked(P.x, ny);
    if (!hitX) P.x = nx;
    if (!hitY) P.y = ny;
    if ((hitX || hitY) && P.y < T.y - 4 && !behindWarned && !dlg.open) {
      behindWarned = true;
      keys.clear();
      target = null;
      box.classList.remove('dlg--top');
      void dlg.say(["* (You can't see who's back there.)", man('* ...please don\'t look.')]);
    }
    if (target && (hitX || hitY)) target = null;
    if (P.moving) P.step += dt;

    if (P.x < -4) leave('/systems/');
    if (P.x > W + 4) leave('/log/');

    if (hint) {
      const msg = dlg.open ? '' : near() ? 'Z · talk' : '';
      if (hint.textContent !== msg) hint.textContent = msg;
    }

    // Leaves
    if (!reduce && Math.random() < 0.012 * dt) {
      const top = T.y - tree.baseY;
      leaves.push({
        x: T.x + (Math.random() - 0.5) * 70,
        y: top + 20 + Math.random() * 40,
        vx: (Math.random() - 0.3) * 0.15,
        vy: 0.12 + Math.random() * 0.1,
        floor: T.y - 6 + Math.random() * 46,
        life: 600,
        col: Math.random() < 0.5 ? '#b8162f' : '#e23a48',
        phase: Math.random() * 6,
      });
    }
    for (const l of leaves) {
      if (l.y < l.floor) {
        l.phase += 0.03 * dt;
        l.x += (l.vx + Math.sin(l.phase) * 0.18) * dt;
        l.y += l.vy * dt;
      } else l.life -= dt;
    }
    for (let i = leaves.length - 1; i >= 0; i--) if (leaves[i].life <= 0) leaves.splice(i, 1);
  }

  // --- render -------------------------------------------------------------
  function drawSpot() {
    // Dithered pool of light under the tree.
    for (let y = T.y - 14; y < T.y + 30; y++) {
      for (let x = T.x - 90; x < T.x + 90; x++) {
        const d = Math.hypot((x - T.x) / 88, (y - T.y - 6) / 24);
        if (d > 1) continue;
        const v = 1 - d;
        if (v > 0.55 || (v > 0.25 && (x + y) % 2 === 0) || (v > 0.08 && x % 2 === 0 && y % 2 === 0)) {
          g.fillStyle = v > 0.55 ? '#141017' : '#0d0a10';
          g.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  function drawTreeAt(time: number) {
    const s = treeSprite;
    const ox = Math.round(T.x - tree.baseX);
    const oy = Math.round(T.y - tree.baseY);
    const sh = s.height;
    const sway = reduce ? 0 : 1;
    for (let row = 0; row < sh; row++) {
      const k = row < tree.crownBottom ? 1 - row / tree.crownBottom : 0;
      const off = Math.round(Math.sin(time * 0.0009 + row * 0.07) * 1.6 * k * sway);
      g.drawImage(s, 0, row, s.width, 1, ox + off, oy + row, s.width, 1);
    }
  }

  function drawPlayer() {
    const img = playerImg ?? cat[P.moving ? Math.floor(P.step / 9) % 2 : 0];
    const bob = P.moving && Math.floor(P.step / 9) % 2 ? -1 : 0;
    const x = Math.round(P.x - img.width / 2);
    const y = Math.round(P.y - img.height) + bob;
    // shadow
    g.fillStyle = '#1a1420';
    g.fillRect(Math.round(P.x - 5), Math.round(P.y) - 1, 10, 2);
    g.save();
    if (P.dir < 0) {
      g.translate(x * 2 + img.width, 0);
      g.scale(-1, 1);
    }
    g.drawImage(img, x, y);
    g.restore();
  }

  function render(time: number) {
    g.fillStyle = '#000';
    g.fillRect(0, 0, W, H);
    drawSpot();
    for (const l of leaves) if (l.y >= l.floor) {
      g.globalAlpha = Math.min(1, l.life / 200) * 0.8;
      g.fillStyle = l.col;
      g.fillRect(Math.round(l.x), Math.round(l.y), 2, 1);
    }
    g.globalAlpha = 1;
    const behind = P.y < T.y;
    if (behind) drawPlayer();
    drawTreeAt(time);
    if (!behind) drawPlayer();
    for (const l of leaves) if (l.y < l.floor) {
      g.fillStyle = l.col;
      g.fillRect(Math.round(l.x), Math.round(l.y), Math.sin(l.phase) > 0 ? 2 : 1, 1);
    }

    out.imageSmoothingEnabled = false;
    out.drawImage(buf, 0, 0, view.width, view.height);
  }

  // A few leaves already on the ground.
  for (let i = 0; i < 14; i++) {
    leaves.push({
      x: T.x + (Math.random() - 0.5) * 120, y: 999, floor: 0, vx: 0, vy: 0,
      life: 1e9, col: i % 2 ? '#7c0d22' : '#b8162f', phase: 0,
    });
    leaves[leaves.length - 1].y = T.y - 4 + Math.random() * 40;
    leaves[leaves.length - 1].floor = leaves[leaves.length - 1].y;
  }

  function frame(now: number) {
    const dt = Math.min(3, (now - t0) / 16.67);
    t0 = now;
    if (visible || dlg.open) {
      update(dt);
      render(now);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Expose for the "talk" button and an auto-greeting on first arrival.
  document.querySelectorAll('[data-talk]').forEach((b) =>
    b.addEventListener('click', () => {
      stage.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      void talk();
    }),
  );
  if (talks() === 0 && window.scrollY < 40) setTimeout(() => window.scrollY < 40 && talk(), 1100);
}
