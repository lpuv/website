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
 * The red tree, after the DELTARUNE secret-room tree: flat, rounded horizontal
 * leaf strokes stacked into a crown that leans right, magenta in the back and
 * on the left, and a dark slanted trunk with a few twisted branches.
 * Coordinates are authored at 1x and scaled by S.
 */
export function drawTree() {
  const S = 1.3;
  const W = Math.ceil(112 * S);
  const H = Math.ceil(98 * S);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const fill = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  };

  // --- trunk -------------------------------------------------------------
  const NAVY = '#1b1838';
  const NAVY_HI = '#2e2a58';
  const limb = (pts: [number, number][], w0: number, w1: number) => {
    const total = pts.length - 1;
    for (let s0 = 0; s0 < total; s0++) {
      const [x0, y0] = pts[s0];
      const [x1, y1] = pts[s0 + 1];
      const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * S * 2);
      for (let i = 0; i <= n; i++) {
        const t = (s0 + i / n) / total;
        const x = (x0 + (x1 - x0) * (i / n)) * S;
        const y = (y0 + (y1 - y0) * (i / n)) * S;
        const w = (w0 + (w1 - w0) * t) * S;
        fill(x - w / 2, y, w, 1.2, NAVY);
        fill(x - w / 2, y, Math.max(1, w * 0.18), 1.2, NAVY_HI);
      }
    }
  };
  limb([[52, 95], [54, 84], [58, 74], [63, 64], [66, 58]], 11, 5);
  limb([[63, 64], [72, 58], [82, 55], [90, 54]], 4, 1.5);
  limb([[60, 70], [70, 66], [76, 62]], 3, 1.5);
  limb([[61, 66], [55, 60], [50, 57]], 3, 1.5);
  limb([[66, 58], [70, 52]], 3, 1.5);
  limb([[50, 93], [43, 96], [38, 97]], 3, 1);
  limb([[55, 93], [64, 96], [71, 97]], 3, 1);
  limb([[52, 94], [50, 97]], 2, 1);

  // --- crown -------------------------------------------------------------
  const TONE: Record<string, [string, string, string]> = {
    r: ['#ff3355', '#ec1f45', '#cc163c'],
    m: ['#c02a92', '#a3167a', '#7d1061'],
    d: ['#8e1470', '#740f5c', '#5a0b49'],
  };
  const pill = (x: number, y: number, w: number, h: number, t: string) => {
    const [hi, mid, lo] = TONE[t];
    const X = Math.round(x * S);
    const Y = Math.round(y * S);
    const Wp = Math.round(w * S);
    const Hp = Math.max(3, Math.round(h * S));
    for (let row = 0; row < Hp; row++) {
      const inset = row === 0 || row === Hp - 1 ? 2 : row === 1 || row === Hp - 2 ? 1 : 0;
      const col = row === 0 ? hi : row >= Hp - 2 ? lo : mid;
      fill(X + inset, Y + row, Wp - inset * 2, 1, col);
    }
  };
  // [x, y, w, h, tone], back to front.
  const strokes: [number, number, number, number, string][] = [
    // back: shadowed magenta mass, left and lower right
    [14, 17, 42, 9, 'd'], [8, 25, 36, 9, 'm'], [4, 33, 34, 9, 'm'], [6, 41, 36, 9, 'm'],
    [12, 49, 34, 8, 'd'], [72, 40, 34, 9, 'd'], [78, 48, 28, 8, 'm'], [66, 52, 24, 6, 'd'],
    // front: red strokes, staggered and leaning right
    [66, 0, 20, 7, 'r'],
    [50, 7, 54, 9, 'r'],
    [24, 13, 50, 9, 'r'], [58, 15, 44, 9, 'r'],
    [32, 22, 72, 9, 'r'],
    [26, 30, 66, 9, 'r'],
    [0, 33, 20, 6, 'r'],
    [36, 38, 60, 9, 'r'],
    [28, 45, 50, 9, 'r'],
    [34, 52, 30, 8, 'r'],
    [40, 59, 18, 6, 'r'],
    // accents: magenta strokes tucked into the red
    [56, 21, 16, 6, 'm'], [18, 38, 14, 6, 'm'], [86, 44, 16, 6, 'm'], [70, 33, 12, 5, 'm'],
  ];
  for (const st of strokes) pill(...st);

  // stray leaves drifting off the crown
  fill(100 * S, 3 * S, 6 * S, 2, '#ec1f45');
  fill(104 * S, 30 * S, 4 * S, 2, '#a3167a');
  fill(-0, 26 * S, 5 * S, 2, '#ec1f45');

  return { canvas: c as Sprite, baseX: Math.round(53 * S), baseY: Math.round(95 * S), crownBottom: Math.round(66 * S) };
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
