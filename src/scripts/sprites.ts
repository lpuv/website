/**
 * Placeholder pixel art, drawn in code so the site works with zero assets.
 *
 * To swap in real art, add PNGs to /public/sprites/ and list them in
 * /public/sprites/manifest.json, e.g. { "tree": "tree.png", "player": "player.png" }.
 * - tree:   drawn with its bottom-centre on the trunk base. Top 75% sways.
 * - player: a single frame, bottom-centre on the player's feet.
 */

export type Sprite = HTMLCanvasElement | HTMLImageElement;

const PAL = {
  outline: '#2a0610',
  leafDark: '#7c0d22',
  leaf: '#b8162f',
  leafLight: '#e23a48',
  leafHi: '#f25a5e',
  bark: '#1c1216',
  barkMid: '#3a2428',
  barkHi: '#5b3a3a',
};

function hash(x: number, y: number) {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((r) => r.map((v) => v / 16));

/** Red-leaved tree. Returns the canvas plus where the trunk base sits in it. */
export function drawTree() {
  const W = 96;
  const H = 112;
  const cx = 48;
  const base = 108; // trunk base y
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const px = (x: number, y: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, 1, 1);
  };

  // Trunk: tapering, with a couple of roots and two branches into the crown.
  const trunk = new Set<string>();
  for (let y = 40; y <= base; y++) {
    const t = (y - 40) / (base - 40);
    let half = 3 + t * 2.2;
    if (y > base - 6) half += (y - (base - 6)) * 1.3; // root flare
    for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
      trunk.add(`${x},${y}`);
    }
  }
  const branch = (x0: number, y0: number, dx: number, len: number) => {
    for (let i = 0; i < len; i++) {
      const x = Math.round(x0 + dx * i);
      const y = y0 - i;
      trunk.add(`${x},${y}`);
      trunk.add(`${x + 1},${y}`);
    }
  };
  branch(cx - 2, 62, -0.9, 16);
  branch(cx + 2, 58, 0.8, 18);
  branch(cx, 50, 0.1, 14);

  for (const k of trunk) {
    const [x, y] = k.split(',').map(Number);
    const edgeL = !trunk.has(`${x - 1},${y}`);
    const edgeR = !trunk.has(`${x + 1},${y}`);
    let col = PAL.barkMid;
    if (edgeR) col = PAL.bark;
    else if (edgeL) col = PAL.barkHi;
    else if (hash(x, y) > 0.82) col = PAL.bark;
    px(x, y, col);
  }

  // Crown: lumpy union of blobs.
  const blobs: [number, number, number][] = [
    [cx, 34, 26],
    [cx - 22, 44, 16],
    [cx + 23, 42, 17],
    [cx - 12, 18, 16],
    [cx + 13, 17, 15],
    [cx, 52, 16],
    [cx - 30, 32, 10],
    [cx + 31, 30, 10],
  ];
  const inside = (x: number, y: number) =>
    blobs.some(([bx, by, r]) => {
      const d = Math.hypot(x - bx, (y - by) * 1.08);
      return d < r + (hash(x, y) - 0.5) * 2.4;
    });
  const light = [cx - 16, 6];
  for (let y = 0; y < 72; y++) {
    for (let x = 0; x < W; x++) {
      if (!inside(x, y)) continue;
      // Let some trunk show through in the lower crown.
      if (trunk.has(`${x},${y}`) && y > 46 && hash(x, y) > 0.35) continue;
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      if (edge) {
        px(x, y, PAL.outline);
        continue;
      }
      const d = Math.hypot(x - light[0], y - light[1]) / 70;
      // Clumps: each leaf cluster shades darker toward its own lower-right.
      const cl = Math.sin(x * 0.45) * Math.cos(y * 0.5 + x * 0.12) * 0.12;
      const v = 1 - d + cl + (hash(x * 3, y * 7) - 0.5) * 0.05 - BAYER[y % 4][x % 4] * 0.12;
      let col = PAL.leafDark;
      if (v > 0.74) col = PAL.leafHi;
      else if (v > 0.5) col = PAL.leafLight;
      else if (v > 0.24) col = PAL.leaf;
      // Leaf-clump texture: small dark notches.
      if (hash(x, y) > 0.93 && col !== PAL.leafDark) col = PAL.leafDark;
      px(x, y, col);
    }
  }
  return { canvas: c as Sprite, baseX: cx, baseY: base, crownBottom: 72 };
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
