/**
 * The room with the tree. A purple plateau in the dark, a path leading down,
 * and a man you can't quite see.
 */
import { Dialogue, inventory, type Line } from './dialogue';
import { ambient, play } from './sfx';
import { drawCat, drawTree, loadOverrides, type Sprite } from './sprites';

const H = 216;
const SPEED = 1.1;
const FLOOR = '#5f3166';
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
  const cat = drawCat();
  let playerImg: Sprite | null = null;

  const T = { x: 160, y: 126 }; // trunk base
  const P = { x: 154, y: H - 10, dir: 1, moving: false, step: 0 };
  let target: { x: number; y: number } | null = null;
  const keys = new Set<string>();
  const leaves: Leaf[] = [];
  let visible = true;
  let gone = false; // the man leaves after giving the egg, until next visit
  let peeked = false;
  let t0 = performance.now();

  // Floor: plateau, a step, and a path running off the bottom. Offsets from the trunk base.
  const FLOOR_RECTS: [number, number, number, number][] = [
    [-80, -56, 146, 72],
    [-54, 16, 96, 24],
    [-29, 40, 46, 200],
  ];
  const onFloor = (x: number, y: number) =>
    FLOOR_RECTS.some(([rx, ry, rw, rh], i) =>
      x >= T.x + rx + 3 && x <= T.x + rx + rw - 3 && y >= T.y + ry + (i === 0 ? 4 : 0) && y <= T.y + ry + rh);
  const trunk = (x: number, y: number) => Math.abs(x - T.x) < 7 && y > T.y - 5 && y < T.y + 3;

  // --- layout -------------------------------------------------------------
  const resize = () => {
    const r = stage.getBoundingClientRect();
    const aspect = Math.max(1.1, Math.min(2.4, r.width / Math.max(1, r.height)));
    const nextW = Math.round(H * aspect);
    const dx = Math.round(nextW / 2) - T.x;
    W = nextW;
    T.x += dx;
    P.x += dx;
    if (target) target.x += dx;
    buf.width = W;
    buf.height = H;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    view.width = Math.round(r.width * dpr);
    view.height = Math.round(r.height * dpr);
  };
  new ResizeObserver(resize).observe(stage);
  resize();
  P.x = T.x - 6;

  void loadOverrides().then((o) => {
    if (o.tree) {
      treeSprite = o.tree;
      tree = { ...tree, baseX: o.tree.width / 2, baseY: o.tree.height, crownBottom: o.tree.height * 0.75 };
    }
    if (o.player) playerImg = o.player;
  });

  // --- the man ------------------------------------------------------------
  const visits = () => Number(localStorage.getItem('cc.talks') ?? '0');
  const man = (text: string) => ({ text: `* ${text}`, voice: 0.7 });
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });

  const menu = (prompt: string): Line => ({
    ...man(prompt),
    choices: [
      { id: 'work', label: 'Her work' },
      { id: 'who', label: 'Who is Luna?' },
      { id: 'short', label: 'The short version' },
      { id: 'bye', label: 'Goodbye' },
    ],
  });

  async function egg(): Promise<boolean> {
    if (inventory.has('egg')) return false;
    const take = await dlg.say(
      [
        '* (He offered you something.)',
        { text: '* (Take it?)', choices: [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }] },
      ],
      { keepOpen: true },
    );
    if (take !== 'yes') {
      await dlg.say(['* (Well, the man put it back in his pocket.)', man('THAT IS ALRIGHT. IT WILL KEEP.')], { keepOpen: true });
      return false;
    }
    play('item');
    inventory.add('egg');
    await dlg.say(
      [
        '* (You got the EGG.)',
        man("IT IS HER RESUME. DON'T ASK ME WHY IT IS AN EGG."),
        man('PUT IT SOMEWHERE SAFE. YOUR ITEM MENU, PERHAPS.'),
      ],
      { keepOpen: true },
    );
    return true;
  }

  async function talk() {
    if (dlg.open) return;
    keys.clear();
    target = null;
    box.classList.toggle('dlg--top', P.y > T.y + 55);

    if (gone) {
      await dlg.say(['* (Well, there is not a man here.)', '* (...but the path still leads down.)']);
      return;
    }

    const n = visits();
    localStorage.setItem('cc.talks', String(n + 1));
    ambient(true);

    let opening: Line[];
    if (n === 0) {
      opening = [
        '* (There is a tree here.)',
        '* (Well, there is a man here.)',
        '* (He seems happy to see you.)',
        man('HELLO! YOU FOUND THE TREE.'),
        man('THIS IS LUNA\'S PLACE. SHE IS NOT HERE, SO I AM LOOKING AFTER IT.'),
        {
          ...man('IT IS A NICE TREE, ISN\'T IT?'),
          choices: [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }],
        },
      ];
    } else if (n % 5 === 4) {
      opening = [
        '* (Well, there is a man here.)',
        man('YOU HAVE COME BACK AGAIN.'),
        man('MOST PEOPLE FORGET ME. ...I THINK. I FORGET.'),
      ];
    } else {
      opening = [
        '* (Well, there is a man here.)',
        man(n === 1 ? 'OH! IT IS YOU. OR... HAVE WE MET?' : 'HELLO AGAIN.'),
      ];
    }

    let pick = await dlg.say(opening, { keepOpen: true });
    if (pick === 'yes') await dlg.say([man('AN OPINION! I LIKE YOU.')], { keepOpen: true });
    if (pick === 'no') await dlg.say([man('THAT IS ALRIGHT. IT IS THE ONLY ONE I HAVE.')], { keepOpen: true });

    if (await egg()) {
      // fall through to the menu
    }

    pick = await dlg.say([menu('WHAT WERE YOU LOOKING FOR?')], { keepOpen: true });
    while (pick && pick !== 'bye') {
      if (pick === 'work') {
        await dlg.say([
          man('IT IS DOWN THE PATH.'),
          man('SHE WROTE DOWN WHAT WAS HARD ABOUT EACH ONE. I LIKED THAT.'),
        ]);
        scrollTo('work');
        return;
      }
      if (pick === 'who') {
        const knows = await dlg.say(
          [
            man('LUNA PUVILLAND. SHE STUDIES COMPUTER ENGINEERING AT MCGILL, UNTIL 2029.'),
            man('SHE LEADS COMMAND AND DATA HANDLING FOR A SMALL SATELLITE. IT WILL GO TO SPACE ONE DAY.'),
            man('I HAVE NEVER BEEN.'),
            man('SHE PACKAGES SOFTWARE FOR FEDORA. AND SHE TAKES OLD PROGRAMS APART, TO SEE HOW THEY BREAK.'),
            {
              ...man('SHE IS LOOKING FOR AN INTERNSHIP. DO YOU KNOW OF ONE?'),
              choices: [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }],
            },
          ],
          { keepOpen: true },
        );
        if (knows === 'yes') {
          const write = await dlg.say(
            [
              man('WONDERFUL! YOU SHOULD WRITE TO HER.'),
              { text: '* (Write to Luna?)', choices: [{ id: 'mail', label: 'Email her' }, { id: 'later', label: 'Later' }] },
            ],
            { keepOpen: true },
          );
          if (write === 'mail') {
            dlg.close();
            location.href = 'mailto:luna@craftcat.dev';
            return;
          }
        } else {
          await dlg.say([man('THAT IS ALRIGHT. NEITHER DO I.')], { keepOpen: true });
        }
      }
      if (pick === 'short') {
        const go = await dlg.say(
          [
            man('OF COURSE. TAKE YOUR TIME, OR DON\'T.'),
            man('SYSTEMS. SECURITY. EMBEDDED. MCGILL, 2029. LOOKING FOR AN INTERNSHIP.'),
            {
              ...man('WHERE WILL YOU GO?'),
              choices: [
                { id: 'resume', label: 'Resume' },
                { id: 'mail', label: 'Email' },
                { id: 'stay', label: 'Stay' },
              ],
            },
          ],
          { keepOpen: true },
        );
        if (go === 'resume') return void (location.href = '/resume/');
        if (go === 'mail') {
          dlg.close();
          location.href = 'mailto:luna@craftcat.dev';
          return;
        }
      }
      pick = await dlg.say([menu('ANYTHING ELSE?')], { keepOpen: true });
    }
    if (pick === 'bye') {
      await dlg.say([man('IF YOU WILL IT, WE SHALL MEET AGAIN.'), '* (Well, the man waved goodbye.)']);
      if (inventory.has('egg')) gone = true;
    } else dlg.close();
  }

  async function peek() {
    peeked = true;
    keys.clear();
    target = null;
    box.classList.remove('dlg--top');
    await dlg.say([
      '* (You tried to look behind the tree.)',
      '* (...the man stepped politely around the other side.)',
    ]);
  }

  box.addEventListener('dlg:close', () => {
    ambient(false);
    stage.focus({ preventScroll: true });
  });

  // --- input --------------------------------------------------------------
  const near = () => Math.hypot(P.x - T.x, (P.y - T.y) * 1.3) < 36;
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
    const onTree = Math.abs(p.x - T.x) < 60 && p.y < T.y + 4 && p.y > T.y - tree.baseY;
    if (onTree) {
      void talk();
      return;
    }
    target = p;
  });

  new IntersectionObserver(([entry]) => {
    visible = entry.intersectionRatio > 0.35;
    if (!visible) keys.clear();
  }, { threshold: [0, 0.35, 1] }).observe(stage);

  // --- simulation ---------------------------------------------------------
  const walkable = (x: number, y: number) => (onFloor(x, y) || y > H - 1) && !trunk(x, y);

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

    const okX = walkable(P.x + dx, P.y);
    const okY = walkable(P.x, P.y + dy);
    if (okX) P.x += dx;
    if (okY) P.y += dy;
    if (target && !okX && !okY) target = null;
    if (P.moving) P.step += dt;

    // Behind the tree, once per visit.
    if (!peeked && !gone && !dlg.open && P.y < T.y - 30 && Math.abs(P.x - T.x) < 16) void peek();

    // Down the path: to the work.
    if (P.y > H + 6) {
      P.y = H - 8;
      target = null;
      keys.clear();
      play('select');
      scrollTo('work');
    }

    if (hint) {
      const msg = dlg.open ? '' : near() ? 'Z · check' : '';
      if (hint.textContent !== msg) hint.textContent = msg;
    }

    if (!reduce && Math.random() < 0.006 * dt) {
      leaves.push({
        x: T.x + (Math.random() - 0.4) * 90,
        y: T.y - tree.baseY + 30 + Math.random() * 40,
        vx: (Math.random() - 0.3) * 0.12,
        vy: 0.1 + Math.random() * 0.08,
        floor: T.y - 10 + Math.random() * 24,
        life: 260,
        col: Math.random() < 0.6 ? '#f2203f' : '#b5187e',
        phase: Math.random() * 6,
      });
    }
    for (const l of leaves) {
      if (l.y < l.floor) {
        l.phase += 0.03 * dt;
        l.x += (l.vx + Math.sin(l.phase) * 0.16) * dt;
        l.y += l.vy * dt;
      } else l.life -= dt;
    }
    for (let i = leaves.length - 1; i >= 0; i--) if (leaves[i].life <= 0) leaves.splice(i, 1);
  }

  // --- render -------------------------------------------------------------
  function drawFloor() {
    g.fillStyle = FLOOR;
    for (const [rx, ry, rw, rh] of FLOOR_RECTS) g.fillRect(T.x + rx, T.y + ry, rw, rh);
  }

  function drawTreeAt(time: number) {
    const s = treeSprite;
    const ox = Math.round(T.x - tree.baseX);
    const oy = Math.round(T.y - tree.baseY);
    for (let row = 0; row < s.height; row++) {
      const k = row < tree.crownBottom ? 1 - row / tree.crownBottom : 0;
      // Strokes move as whole bands, like the game's chunky leaves.
      const band = Math.floor(row / 10);
      const off = reduce ? 0 : Math.round(Math.sin(time * 0.0008 + band * 0.9) * 1.2 * k);
      g.drawImage(s, 0, row, s.width, 1, ox + off, oy + row, s.width, 1);
    }
  }

  function drawPlayer() {
    const img = playerImg ?? cat[P.moving ? Math.floor(P.step / 9) % 2 : 0];
    const bob = P.moving && Math.floor(P.step / 9) % 2 ? -1 : 0;
    const x = Math.round(P.x - img.width / 2);
    const y = Math.round(P.y - img.height) + bob;
    g.fillStyle = 'rgba(20,6,26,0.55)';
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
    drawFloor();
    for (const l of leaves) if (l.y >= l.floor) {
      g.globalAlpha = Math.min(1, l.life / 120);
      g.fillStyle = l.col;
      g.fillRect(Math.round(l.x), Math.round(l.y), 3, 1);
    }
    g.globalAlpha = 1;
    const behind = P.y < T.y;
    if (behind) drawPlayer();
    drawTreeAt(time);
    if (!behind) drawPlayer();
    for (const l of leaves) if (l.y < l.floor) {
      g.fillStyle = l.col;
      g.fillRect(Math.round(l.x), Math.round(l.y), Math.sin(l.phase) > 0 ? 3 : 2, 1);
    }
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

  // Walk in from the path on arrival.
  if (!reduce) target = { x: T.x - 6, y: T.y + 26 };

  document.querySelectorAll('[data-talk]').forEach((b) =>
    b.addEventListener('click', () => {
      stage.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      void talk();
    }),
  );
  if (visits() === 0 && window.scrollY < 40) setTimeout(() => window.scrollY < 40 && !dlg.open && talk(), 1500);
}
