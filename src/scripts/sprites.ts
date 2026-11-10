/**
 * Placeholder pixel art, drawn in code so the site works with zero assets.
 *
 * To swap in real art, add PNGs to /public/sprites/ and list them in
 * /public/sprites/manifest.json, e.g. { "tree": "tree.png", "player": "player.png" }.
 * - tree:   drawn with its bottom-centre on the trunk base. Top 75% sways.
 * - player: a single frame, bottom-centre on the player's feet.
 */

export type Sprite = HTMLCanvasElement | HTMLImageElement;

function hash(x: number, y: number) {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/**
 * The red tree. The crown is a pile of wide, rounded leaf clumps: pink-red on
 * top, magenta in the shadow (left and underneath). The trunk is thick enough
 * to hide someone.
 */
export function drawTree() {
  const W = 144;
  const H = 128;
  const bx = 70;
  const by = 123;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const px = (x: number, y: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, 1, 1);
  };

  // Trunk: thick, slightly leaning, flared roots.
  const BARK = ['#1f0c24', '#34173a', '#4d2453', '#6a3570'];
  const trunk = new Map<string, number>();
  const put = (x: number, y: number, v: number) => trunk.set(`${x},${y}`, v);
  for (let y = 62; y <= by; y++) {
    const t = (y - 62) / (by - 62);
    let half = 6 + t * 2.5;
    if (y > by - 7) half += (y - (by - 7)) * 1.6;
    const lean = Math.round(Math.sin(t * 2.4) * 2);
    for (let x = Math.round(bx - half + lean); x <= Math.round(bx + half + lean); x++) put(x, y, 0);
  }
  const limb = (x0: number, y0: number, x1: number, y1: number, w0: number) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const w = Math.max(1, Math.round(w0 * (1 - t * 0.6)));
      const x = Math.round(x0 + (x1 - x0) * t);
      const y = Math.round(y0 + (y1 - y0) * t);
      for (let k = -Math.floor(w / 2); k < Math.ceil(w / 2); k++) put(x + k, y, 0);
    }
  };
  limb(bx - 3, 74, bx - 26, 52, 6);
  limb(bx + 3, 70, bx + 28, 50, 6);
  limb(bx, 64, bx + 2, 40, 5);
  limb(bx - 6, by - 2, bx - 20, by + 3, 3);
  limb(bx + 6, by - 2, bx + 22, by + 3, 3);
  for (const k of trunk.keys()) {
    const [x, y] = k.split(',').map(Number);
    const l = !trunk.has(`${x - 1},${y}`);
    const r = !trunk.has(`${x + 1},${y}`);
    const l2 = !trunk.has(`${x - 2},${y}`);
    let v = r ? 0 : l ? 3 : l2 ? 2 : 1;
    if (v === 1 && hash(x, y >> 2) > 0.8) v = 0; // bark grooves
    px(x, y, BARK[v]);
  }

  // Crown clumps [cx, cy, rx, ry]; later clumps sit in front.
  const clumps: [number, number, number, number][] = [
    [60, 14, 22, 10], [94, 12, 20, 9], [74, 26, 40, 14],
    [36, 32, 22, 12], [108, 30, 24, 12],
    [22, 46, 18, 10], [120, 46, 18, 10],
    [54, 44, 30, 12], [94, 46, 28, 12],
    [40, 60, 20, 9], [72, 62, 26, 10], [104, 60, 18, 8],
  ];
  const HI = '#ff6a86';
  const RED = ['#ff3d63', '#f0234a', '#cf1546'];
  const MAG = ['#d63a9e', '#b31c82', '#861566'];
  const EDGE = '#3a0a2e';
  const owner = (x: number, y: number) => {
    for (let i = clumps.length - 1; i >= 0; i--) {
      const [cx, cy, rx, ry] = clumps[i];
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d <= 1 + (hash(x >> 2, y >> 1) - 0.5) * 0.16) return i;
    }
    return -1;
  };
  for (let y = 0; y < 76; y++) {
    for (let x = 0; x < W; x++) {
      const i = owner(x, y);
      if (i < 0) continue;
      const [cx, cy, rx, ry] = clumps[i];
      const outside = owner(x - 1, y) < 0 || owner(x + 1, y) < 0 || owner(x, y - 1) < 0 || owner(x, y + 1) < 0;
      if (outside) {
        px(x, y, EDGE);
        continue;
      }
      const below = owner(x, y + 1);
      const seam = below !== i && below < i; // this clump's lower lip over one behind it
      // Shadow: the left flank and the underside of the crown.
      const shadow = cx < 42 || (cy > 56 && cx < 90) || y > 66;
      const pal = shadow ? MAG : RED;
      const local = (y - (cy - ry)) / (2 * ry);
      const v = local * 0.65 + (y / 76) * 0.35;
      let col = v < 0.3 ? pal[0] : v < 0.66 ? pal[1] : pal[2];
      if (seam) col = pal[2];
      if (!shadow && local < 0.2 && y < 40 && Math.abs(x - (cx - rx * 0.2)) < rx * 0.45) col = HI;
      px(x, y, col);
    }
  }
  return { canvas: c as Sprite, baseX: bx, baseY: by, crownBottom: 76 };
}

/** Placeholder player: a small cat (craftcat). Two frames. */
const CAT = [
  [
    '..o......o..',
    '.owo....owo.',
    '.owwooooowwo',
    '.owwwwwwwwwo',
    'owwewwwwewwo',
    'owwwwwpwwwwo',
    'owwwwwwwwwwo',
    '.owwwwwwwwo.',
    '..owwwwwwo..',
    '.owwowwowwo.',
    '.owwo..owwo.',
    '..oo....oo..',
  ],
  [
    '..o......o..',
    '.owo....owo.',
    '.owwooooowwo',
    '.owwwwwwwwwo',
    'owwewwwwewwo',
    'owwwwwpwwwwo',
    'owwwwwwwwwwo',
    '.owwwwwwwwo.',
    '..owwwwwwo..',
    '..owwowwwo..',
    '..owo.owwo..',
    '...o...oo...',
  ],
].map((rows) => rows.map((r) => r.padEnd(12, '.')));

const CAT_PAL: Record<string, string> = {
  o: '#140c24',
  w: '#e9e4ff',
  e: '#ffd800',
  p: '#ff8fb1',
};

export function drawCat() {
  return CAT.map((rows) => {
    const c = document.createElement('canvas');
    c.width = 12;
    c.height = 12;
    const g = c.getContext('2d')!;
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (!CAT_PAL[ch]) return;
        g.fillStyle = CAT_PAL[ch];
        g.fillRect(x, y, 1, 1);
      }),
    );
    // A shading column on the right side.
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(80,60,140,0.35)';
    g.fillRect(9, 3, 3, 9);
    return c as Sprite;
  });
}

/** Loads sprite overrides from /sprites/manifest.json, if any. */
export async function loadOverrides(): Promise<Partial<Record<'tree' | 'player', HTMLImageElement>>> {
  try {
    const res = await fetch('/sprites/manifest.json');
    if (!res.ok) return {};
    const manifest: Record<string, string> = await res.json();
    const out: Record<string, HTMLImageElement> = {};
    await Promise.all(
      Object.entries(manifest).map(
        ([name, file]) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              out[name] = img;
              resolve();
            };
            img.onerror = () => resolve();
            img.src = `/sprites/${file}`;
          }),
      ),
    );
    return out;
  } catch {
    return {};
  }
}
