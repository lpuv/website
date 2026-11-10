/**
 * Placeholder pixel art, drawn in code so the site works with zero assets.
 *
 * To swap in real art, add PNGs to /public/sprites/ and list them in
 * /public/sprites/manifest.json, e.g. { "tree": "tree.png", "player": "player.png" }.
 * - tree:   drawn with its bottom-centre on the trunk base. Top 75% sways.
 * - player: a single frame, bottom-centre on the player's feet.
 */

export type Sprite = HTMLCanvasElement | HTMLImageElement;

/**
 * The red tree: chunky horizontal brush strokes of red over magenta, a dark
 * twisted trunk, roots spreading onto the floor.
 */
export function drawTree() {
  const W = 136;
  const H = 112;
  const bx = 63;
  const by = 107;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const rect = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  // Trunk, branches, roots.
  const BARK = '#2a1230';
  const BARK_HI = '#4a2350';
  const line = (x0: number, y0: number, x1: number, y1: number, w: number) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      rect(x - w / 2, y, w, 1, BARK);
    }
  };
  for (let y = 66; y <= by; y++) {
    const t = (y - 66) / (by - 66);
    const w = 4 + t * 2 + (y > by - 4 ? (y - (by - 4)) * 2 : 0);
    const sway = Math.round(Math.sin(y * 0.18) * 1.2);
    rect(bx - w / 2 + sway, y, w, 1, BARK);
    rect(bx - w / 2 + sway, y, 1, 1, BARK_HI);
  }
  line(bx, 82, bx - 18, 60, 3);
  line(bx - 12, 68, bx - 24, 58, 2);
  line(bx + 1, 78, bx + 22, 56, 3);
  line(bx + 14, 64, bx + 30, 58, 2);
  line(bx, 70, bx + 4, 50, 2);
  line(bx - 3, by - 1, bx - 16, by + 3, 2);
  line(bx + 3, by - 1, bx + 17, by + 2, 2);
  line(bx, by, bx - 6, by + 4, 2);
  line(bx + 10, by + 1, bx + 22, by + 4, 1);

  // Canopy strokes: [x, y, width, tone]. y is the stroke's top; strokes are 10px tall.
  const TONES: Record<string, [string, string, string]> = {
    r: ['#ff4a6a', '#f2203f', '#c4123a'], // bright red
    p: ['#ff5c86', '#ff2e5e', '#d0174f'], // pinkish red
    m: ['#d43196', '#b5187e', '#861263'], // magenta (shadow side)
  };
  const strokes: [number, number, number, string][] = [
    [40, 0, 30, 'r'], [86, 1, 22, 'r'],
    [26, 7, 44, 'r'], [62, 7, 58, 'p'],
    [14, 14, 30, 'm'], [38, 14, 86, 'r'],
    [6, 21, 34, 'm'], [34, 21, 96, 'p'],
    [10, 28, 30, 'm'], [36, 28, 94, 'r'],
    [14, 35, 34, 'm'], [44, 35, 72, 'p'], [110, 36, 20, 'r'],
    [24, 42, 28, 'm'], [46, 42, 82, 'r'],
    [34, 49, 30, 'm'], [60, 49, 66, 'r'],
    [30, 56, 62, 'r'], [92, 56, 26, 'm'],
    [44, 63, 46, 'p'], [94, 63, 14, 'm'],
    [54, 70, 30, 'r'],
  ];
  for (const [x, y, w, t] of strokes) {
    const [hi, mid, lo] = TONES[t];
    const h = 10;
    for (let row = 0; row < h; row++) {
      // Rounded ends: inset the first and last rows.
      const inset = row === 0 || row === h - 1 ? 2 : row === 1 || row === h - 2 ? 1 : 0;
      const col = row < 2 ? hi : row === h - 1 ? '#3d0a2c' : row > h - 4 ? lo : mid;
      rect(x + inset, y + row, w - inset * 2, 1, col);
    }
  }
  return { canvas: c as Sprite, baseX: bx, baseY: by, crownBottom: 80 };
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
