/**
 * The tank.
 *
 * A small, self-contained network simulation for the hero. Hosts are real
 * projects; attacks arrive as email attachments, spread over shares, get
 * quarantined, and are reimaged by a monitoring process that also adds and
 * removes machines at random. It is decorative navigation, not a claim about
 * live traffic.
 *
 * Constraints that keep it usable:
 *  - canvas 2D, no WebGL, no external runtime
 *  - pauses when offscreen or when the tab is hidden
 *  - prefers-reduced-motion renders a static map
 *  - keyboard: arrows select a host, Enter opens it
 *  - every host is also a plain link in the grid below the hero
 */

type NodeKind = 'core' | 'system' | 'external';
type NodeState = 'clean' | 'infected' | 'quarantined' | 'crashed';
type PacketKind = 'traffic' | 'email' | 'spread' | 'defense' | 'monitor';
type FeedLevel = 'info' | 'threat' | 'signal' | 'warn';

interface Virus {
  id: string;
  name: string;
  payload: string;
  growth: number;
  spread: number;
  note: string;
}

interface NodeDef {
  id: string;
  label: string;
  href: string;
  kind: NodeKind;
  blurb: string;
  os: string;
  patch: string;
  patchAge: number;
  wide: readonly [number, number];
  narrow: readonly [number, number];
  r: number;
  depth: number;
}

interface SimNode extends NodeDef {
  sx: number;
  sy: number;
  rr: number;
  state: NodeState;
  heat: number;
  load: number;
  virus: Virus | null;
  infectedAt: number;
  quarantineUntil: number;
  spreadAt: number;
  reimageAt: number;
  struggling: boolean;
  defending: boolean;
  phase: number;
  neighbors: string[];
  guest: boolean;
}

interface Packet {
  kind: PacketKind;
  fromId: string | null;
  toId: string;
  t: number;
  speed: number;
  sx?: number;
  sy?: number;
  cx?: number;
  cy?: number;
  virus?: Virus;
  action?: 'reimage' | 'patch' | 'add';
}

interface EdgeDef {
  a: string;
  b: string;
  protocol: string;
}

interface FeedItem {
  time: string;
  text: string;
  level: FeedLevel;
}

interface Burst {
  x: number;
  y: number;
  t: number;
  color: [number, number, number];
}

interface Star {
  x: number;
  y: number;
  r: number;
  a: number;
  phase: number;
  depth: number;
}

const VIRUSES: Virus[] = [
  {
    id: 'iloveyou',
    name: 'ILOVEYOU',
    payload: 'LOVE-LETTER-FOR-YOU.TXT.vbs',
    growth: 0.085,
    spread: 1.2,
    note: 'VBScript worm. Opens the attachment, then mails itself to every Outlook contact.',
  },
  {
    id: 'melissa',
    name: 'Melissa',
    payload: 'list.doc',
    growth: 0.07,
    spread: 1.0,
    note: 'Macro virus. Emails itself to the first fifty addresses in the book.',
  },
  {
    id: 'sobig',
    name: 'Sobig',
    payload: 'your_document.zip',
    growth: 0.06,
    spread: 0.95,
    note: 'Mass-mailing worm. Spoofs the sender so the bounce goes somewhere else.',
  },
  {
    id: 'emotet',
    name: 'Emotet',
    payload: 'invoice_Q3.docm',
    growth: 0.075,
    spread: 1.1,
    note: 'Macro dropper. Beacons out, then pulls the next stage onto the host.',
  },
  {
    id: 'qakbot',
    name: 'Qakbot',
    payload: 'statement.pdf.exe',
    growth: 0.065,
    spread: 1.05,
    note: 'Banking trojan. Steals credentials, then moves laterally over SMB.',
  },
  {
    id: 'agenttesla',
    name: 'AgentTesla',
    payload: 'po_order.xlsm',
    growth: 0.05,
    spread: 0.7,
    note: 'Infostealer. Exfiltrates saved credentials and keystrokes.',
  },
];

const GUESTS = [
  { label: 'lab-nas', os: 'Debian 11', patch: '2019-04', patchAge: 7.6 },
  { label: 'old-laptop', os: 'Ubuntu 20.04', patch: '2021-08', patchAge: 5.2 },
  { label: 'printer', os: 'embedded', patch: '2018-11', patchAge: 8.0 },
  { label: 'test-vm', os: 'Alpine 3.14', patch: '2022-03', patchAge: 4.6 },
  { label: 'rpi-4', os: 'Raspbian 10', patch: '2020-06', patchAge: 6.4 },
  { label: 'media-box', os: 'LibreELEC 9', patch: '2021-01', patchAge: 5.8 },
];

const NODES: NodeDef[] = [
  {
    id: 'nix-lab',
    label: 'nix-lab',
    href: '/systems/nix-lab',
    kind: 'core',
    blurb: 'Every host I run, rebuilt from one flake.',
    os: 'NixOS 25.11',
    patch: 'rolling',
    patchAge: 0.1,
    wide: [0.72, 0.44],
    narrow: [0.5, 0.24],
    r: 11,
    depth: 1.15,
  },
  {
    id: 'rocket-cdh',
    label: 'rocket-cdh',
    href: '/systems/rocket-cdh',
    kind: 'system',
    blurb: 'C&DH firmware for the Orbital CubeSat.',
    os: 'FreeRTOS / TMS570',
    patch: '2024.10',
    patchAge: 2.1,
    wide: [0.78, 0.14],
    narrow: [0.78, 0.1],
    r: 8,
    depth: 1,
  },
  {
    id: 'grimoire',
    label: 'grimoire',
    href: '/systems/grimoire',
    kind: 'system',
    blurb: 'A Blood on the Clocktower bot for Discord.',
    os: 'Python 3.13',
    patch: '2025.11',
    patchAge: 1,
    wide: [0.9, 0.3],
    narrow: [0.88, 0.26],
    r: 7.5,
    depth: 0.9,
  },
  {
    id: 'evil-tetris',
    label: 'evil-tetris',
    href: '/systems/evil-tetris',
    kind: 'system',
    blurb: 'A Tetris clone that plays dirty.',
    os: 'Godot 4',
    patch: '2025.03',
    patchAge: 1.7,
    wide: [0.82, 0.72],
    narrow: [0.3, 0.36],
    r: 7,
    depth: 0.9,
  },
  {
    id: 'proxmox',
    label: 'pinwheel',
    href: '/systems/nix-lab',
    kind: 'system',
    blurb: 'The Proxmox host under the homelab. Twelve NixOS containers.',
    os: 'Proxmox VE 9.1.9',
    patch: '2026.11',
    patchAge: 0.1,
    wide: [0.6, 0.2],
    narrow: [0.62, 0.18],
    r: 8,
    depth: 1,
  },
  {
    id: 'cve-2012-2982',
    label: 'CVE-2012-2982',
    href: '/systems/cve-2012-2982',
    kind: 'system',
    blurb: 'Reproducing a Webmin RCE end to end.',
    os: 'Webmin 1.580',
    patch: '2012.09',
    patchAge: 14.2,
    wide: [0.5, 0.34],
    narrow: [0.2, 0.14],
    r: 7.5,
    depth: 1,
  },
  {
    id: 'mcgill-enhanced',
    label: 'McGillEnhanced',
    href: '/systems/mcgill-enhanced',
    kind: 'system',
    blurb: 'Contributor to a student-run browser extension.',
    os: 'WebExtensions',
    patch: '2025.09',
    patchAge: 1.2,
    wide: [0.92, 0.56],
    narrow: [0.82, 0.38],
    r: 7.2,
    depth: 1.1,
  },
  {
    id: 'infra-k8s',
    label: 'infra-k8s',
    href: '/systems/infra-k8s',
    kind: 'system',
    blurb: 'The cluster I retired, and why.',
    os: 'Kubernetes 1.29',
    patch: '2025.01',
    patchAge: 1.8,
    wide: [0.58, 0.1],
    narrow: [0.12, 0.28],
    r: 7,
    depth: 0.8,
  },
  {
    id: 'fedora',
    label: 'fedora',
    href: '/systems/fedora',
    kind: 'external',
    blurb: 'Packaging and infrastructure for Fedora.',
    os: 'Fedora 42',
    patch: 'rolling',
    patchAge: 0.2,
    wide: [0.94, 0.8],
    narrow: [0.92, 0.14],
    r: 5.8,
    depth: 0.6,
  },
  {
    id: 'tryhackme',
    label: 'tryhackme',
    href: '/systems/tryhackme',
    kind: 'external',
    blurb: 'Red-team practice, challenge authoring, CTFs.',
    os: 'Kali / range',
    patch: 'n/a',
    patchAge: 0,
    wide: [0.66, 0.78],
    narrow: [0.4, 0.1],
    r: 5.8,
    depth: 0.7,
  },
];

const BASE_EDGES: EdgeDef[] = [
  { a: 'nix-lab', b: 'rocket-cdh', protocol: 'jtag' },
  { a: 'nix-lab', b: 'grimoire', protocol: 'discord' },
  { a: 'nix-lab', b: 'evil-tetris', protocol: 'ssh' },
  { a: 'nix-lab', b: 'proxmox', protocol: 'ssh' },
  { a: 'nix-lab', b: 'cve-2012-2982', protocol: 'http' },
  { a: 'nix-lab', b: 'mcgill-enhanced', protocol: 'https' },
  { a: 'nix-lab', b: 'infra-k8s', protocol: 'k8s' },
  { a: 'nix-lab', b: 'fedora', protocol: 'https' },
  { a: 'nix-lab', b: 'tryhackme', protocol: 'vpn' },
  { a: 'proxmox', b: 'grimoire', protocol: 'lxc' },
  { a: 'proxmox', b: 'evil-tetris', protocol: 'lxc' },
  { a: 'proxmox', b: 'cve-2012-2982', protocol: 'smb' },
  { a: 'rocket-cdh', b: 'cve-2012-2982', protocol: 'jtag' },
  { a: 'grimoire', b: 'mcgill-enhanced', protocol: 'discord' },
  { a: 'evil-tetris', b: 'infra-k8s', protocol: 'smb' },
  { a: 'fedora', b: 'tryhackme', protocol: 'https' },
  { a: 'mcgill-enhanced', b: 'tryhackme', protocol: 'https' },
];

const SIGNAL: [number, number, number] = [110, 242, 192];
const THREAT: [number, number, number] = [255, 95, 109];
const AMBER: [number, number, number] = [255, 196, 107];
const TEXT_DIM: [number, number, number] = [125, 135, 152];

let MAX_INFECTED = 3;
let MAX_GUESTS = 3;
let ATTACK_FIRST = 2600;
let ATTACK_GAP_MIN = 6500;
let ATTACK_GAP_MAX = 11000;
const DEFEND_AFTER = 8200;
const QUARANTINE_TIME = 3400;
let MONITOR_FIRST = 8000;
let MONITOR_GAP_MIN = 13000;
let MONITOR_GAP_MAX = 21000;
let PACKET_CAP = 26;
let TRAFFIC_INTERVAL = 0.42;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const mixRgb = (
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] => [
  Math.round(lerp(a[0], b[0], t)),
  Math.round(lerp(a[1], b[1], t)),
  Math.round(lerp(a[2], b[2], t)),
];

const mix = (a: [number, number, number], b: [number, number, number], t: number) =>
  `rgb(${mixRgb(a, b, t).join(',')})`;

const rgba = (c: [number, number, number], a: number) =>
  `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/**
 * Navigation is restricted to this site and the one external host the map
 * links to. The hrefs are static, but validating here keeps the canvas from
 * ever becoming a redirect gadget if the node list is edited later.
 */
function navigate(href: string): void {
  const url = new URL(href, window.location.origin);
  const sameOrigin = url.origin === window.location.origin;
  const allowedExternal = url.protocol === 'https:' && url.hostname === 'github.com';
  if (!sameOrigin && !allowedExternal) return;

  const link = document.createElement('a');
  link.href = url.href;
  link.rel = 'noopener noreferrer';
  link.click();
}

function openNode(node: SimNode): void {
  navigate(node.href);
}

const timeFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Toronto',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

export function initTank(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#tank');
  const stage = canvas?.parentElement;
  if (!canvas || !stage) return;

  const context = canvas.getContext('2d');
  if (!context) return;
  const ctx: CanvasRenderingContext2D = context;

  const tip = document.querySelector<HTMLElement>('#node-tip');
  const tipKind = document.querySelector<HTMLElement>('#node-tip-kind');
  const tipLabel = document.querySelector<HTMLElement>('#node-tip-label');
  const tipDesc = document.querySelector<HTMLElement>('#node-tip-desc');
  const tipMeta = document.querySelector<HTMLElement>('#node-tip-meta');
  const tipGo = document.querySelector<HTMLElement>('#node-tip-go');
  const feed = document.querySelector<HTMLElement>('#tank-feed');
  const announce = document.querySelector<HTMLElement>('#tank-announce');
  const statHosts = document.querySelector<HTMLElement>('#tank-hosts');
  const statThreat = document.querySelector<HTMLElement>('#tank-threat');
  const statPatch = document.querySelector<HTMLElement>('#tank-patch');
  const statPackets = document.querySelector<HTMLElement>('#tank-packets');
  const statState = document.querySelector<HTMLElement>('#tank-state');
  const pauseBtn = document.querySelector<HTMLButtonElement>('#tank-pause');
  const hostBody = document.querySelector<HTMLElement>('#tank-hosts-body');
  const logList = document.querySelector<HTMLElement>('#tank-log');
  const hint = document.querySelector<HTMLAnchorElement>('#tank-hint');

  const detail = stage.dataset.detail === 'true';

  MAX_INFECTED = detail ? 5 : 3;
  MAX_GUESTS = detail ? 6 : 3;
  ATTACK_FIRST = detail ? 1600 : 2600;
  ATTACK_GAP_MIN = detail ? 4000 : 6500;
  ATTACK_GAP_MAX = detail ? 8000 : 11000;
  MONITOR_FIRST = detail ? 5000 : 8000;
  MONITOR_GAP_MIN = detail ? 9000 : 13000;
  MONITOR_GAP_MAX = detail ? 15000 : 21000;
  PACKET_CAP = detail ? 70 : 26;
  TRAFFIC_INTERVAL = detail ? 0.28 : 0.42;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w = 0;
  let h = 0;
  let dpr = 1;
  let gridPattern: CanvasPattern | null = null;
  let layoutMix = 0;
  let mouseX = 0;
  let mouseY = 0;
  let pointerInside = false;
  let hovered: string | null = null;
  let focusedIndex = -1;
  let hintTimer: number | null = null;
  let hintVisible = false;
  let paused = false;
  let visible = true;
  let raf = 0;
  let last = performance.now();
  let nextAttack = ATTACK_FIRST;
  let nextMonitor = MONITOR_FIRST;
  let trafficTimer = 0;
  let lastStats = 0;
  let guestSeq = 0;
  let monitorStep = 0;
  let packets: Packet[] = [];
  let bursts: Burst[] = [];
  let feedItems: FeedItem[] = [];
  let logItems: FeedItem[] = [];
  let lastTable = 0;
  const stars: Star[] = Array.from({ length: 70 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 0.4 + Math.random() * 1.1,
    a: 0.1 + Math.random() * 0.32,
    phase: Math.random() * Math.PI * 2,
    depth: 0.3 + Math.random() * 0.7,
  }));

  const byId = new Map<string, SimNode>();
  const nodes: SimNode[] = NODES.map((def, i) => {
    const node: SimNode = {
      ...def,
      sx: 0,
      sy: 0,
      rr: def.r,
      state: 'clean',
      heat: 0,
      load: 0,
      virus: null,
      infectedAt: 0,
      quarantineUntil: 0,
      spreadAt: 0,
      reimageAt: 0,
      struggling: false,
      defending: false,
      phase: i * 1.7 + Math.random() * 0.6,
      neighbors: [],
      guest: false,
    };
    byId.set(def.id, node);
    return node;
  });

  let edges: EdgeDef[] = BASE_EDGES.map((edge) => ({ ...edge }));
  for (const edge of edges) {
    byId.get(edge.a)?.neighbors.push(edge.b);
    byId.get(edge.b)?.neighbors.push(edge.a);
  }

  const core = byId.get('nix-lab') ?? nodes[0];

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    w = Math.max(1, rect.width);
    h = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // One repeating dot tile beats ~1,000 fillRect calls per frame.
    const tile = document.createElement('canvas');
    tile.width = 30;
    tile.height = 30;
    const tileCtx = tile.getContext('2d');
    if (tileCtx) {
      tileCtx.fillStyle = 'rgba(120, 150, 180, 0.16)';
      tileCtx.fillRect(0, 0, 1, 1);
      gridPattern = ctx.createPattern(tile, 'repeat');
    }

    layoutMix = w < 820 ? 1 : 0;
    positionNodes(performance.now());
    kick();
  };

  function positionNodes(now: number) {
    const padX = Math.max(18, w * 0.03);
    const padY = Math.max(18, h * 0.08);
    const scale = clamp(Math.min(w, h) / 900, 0.78, 1.18);
    const drift = reduce ? 0 : 1;
    const parallax = reduce ? 0 : 1;

    // The detail view has no text over the canvas, so it can use a radial
    // layout instead of the hero's right-hand constellation.
    if (detail && w >= 720) {
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.34;
      const others = nodes.filter((n) => n !== core);

      for (const node of nodes) {
        if (node === core) {
          node.sx = cx;
          node.sy = cy;
        } else {
          const i = others.indexOf(node);
          const angle = (i / Math.max(1, others.length)) * Math.PI * 2 - Math.PI / 2;
          const ring = node.kind === 'external' ? 1.12 : 1;
          node.sx =
            cx +
            Math.cos(angle) * radius * ring +
            Math.sin(now * 0.00035 + node.phase) * 2.4 * drift +
            (mouseX - w / 2) * 0.006 * node.depth * parallax;
          node.sy =
            cy +
            Math.sin(angle) * radius * 0.82 * ring +
            Math.cos(now * 0.00031 + node.phase * 1.3) * 1.9 * drift +
            (mouseY - h / 2) * 0.006 * node.depth * parallax;
        }
        node.rr = node.r * scale;
      }
      return;
    }

    for (const node of nodes) {
      const nx = lerp(node.wide[0], node.narrow[0], layoutMix);
      const ny = lerp(node.wide[1], node.narrow[1], layoutMix);
      const baseX = padX + nx * (w - padX * 2);
      const baseY = padY + ny * (h - padY * 2);
      const dx = Math.sin(now * 0.00035 + node.phase) * 2.4 * drift;
      const dy = Math.cos(now * 0.00031 + node.phase * 1.3) * 1.9 * drift;
      const px = (mouseX - w / 2) * 0.006 * node.depth * parallax;
      const py = (mouseY - h / 2) * 0.006 * node.depth * parallax;
      node.sx = baseX + dx + px;
      node.sy = baseY + dy + py;
      node.rr = node.r * scale;
    }
  }

  function infectedCount() {
    return nodes.filter((n) => n.state === 'infected').length;
  }

  function quarantinedCount() {
    return nodes.filter((n) => n.state === 'quarantined').length;
  }

  function crashedCount() {
    return nodes.filter((n) => n.state === 'crashed').length;
  }

  let feedQueue: FeedItem[] = [];
  let feedTimer: number | null = null;

  function renderFeed() {
    if (!feed) return;
    feed.replaceChildren(
      ...feedItems.map((entry, i) => {
        const li = document.createElement('li');
        li.dataset.level = entry.level;
        if (i === 0) li.classList.add('is-new');
        const time = document.createElement('time');
        time.textContent = entry.time;
        const span = document.createElement('span');
        span.textContent = entry.text;
        li.append(time, span);
        return li;
      }),
    );
  }

  function renderLog() {
    if (!logList) return;
    logList.replaceChildren(
      ...logItems.map((entry, i) => {
        const li = document.createElement('li');
        li.dataset.level = entry.level;
        if (i === 0) li.classList.add('is-new');
        const time = document.createElement('time');
        time.textContent = entry.time;
        const span = document.createElement('span');
        span.textContent = entry.text;
        li.append(time, span);
        return li;
      }),
    );
  }

  function pumpFeed() {
    if (feedTimer !== null) return;
    const next = feedQueue.shift();
    if (!next) return;
    feedItems = [next, ...feedItems].slice(0, 5);
    renderFeed();
    if (feedQueue.length) {
      feedTimer = window.setTimeout(() => {
        feedTimer = null;
        pumpFeed();
      }, 700);
    }
  }

  function logEvent(text: string, level: FeedLevel = 'info') {
    const item: FeedItem = { time: timeFmt.format(new Date()), text, level };
    feedQueue.push(item);
    if (feedQueue.length > 12) feedQueue.shift();
    if (logList) {
      logItems = [item, ...logItems].slice(0, 80);
      renderLog();
    }
    pumpFeed();
  }

  function updateStats(now: number) {
    if (now - lastStats < 400) return;
    lastStats = now;
    const infected = infectedCount();
    const quarantined = quarantinedCount();
    const crashed = crashedCount();
    const threat = Math.round((infected / Math.max(1, nodes.length - 1)) * 100);
    const hosts = nodes.filter((n) => n.kind !== 'core');
    const debt = hosts.reduce((sum, n) => sum + n.patchAge, 0) / Math.max(1, hosts.length);

    if (statHosts) statHosts.textContent = String(nodes.length).padStart(2, '0');
    if (statThreat) {
      statThreat.textContent = `${threat}%`;
      statThreat.dataset.level = threat > 0 ? 'threat' : 'ok';
    }
    if (statPatch) {
      statPatch.textContent = `${debt.toFixed(1)}y`;
      statPatch.dataset.level = debt > 4 ? 'threat' : debt > 2 ? 'warn' : 'ok';
    }
    if (statPackets) statPackets.textContent = String(packets.length).padStart(3, '0');
    if (statState) {
      const level = infected > 0 ? 'threat' : quarantined > 0 || crashed > 0 ? 'warn' : 'ok';
      statState.textContent =
        level === 'threat' ? 'under attack' : level === 'warn' ? 'contained' : 'nominal';
      statState.dataset.level = level;
    }

    if (hostBody && now - lastTable > 1000) {
      lastTable = now;
      renderHostTable();
    }
  }

  function renderHostTable() {
    if (!hostBody) return;
    const rows = [...nodes].sort((a, b) => {
      if (a.kind === 'core') return -1;
      if (b.kind === 'core') return 1;
      return a.label.localeCompare(b.label);
    });

    hostBody.replaceChildren(
      ...rows.map((node) => {
        const tr = document.createElement('tr');

        const name = document.createElement('td');
        const link = document.createElement('a');
        link.href = node.href;
        link.rel = 'noopener noreferrer';
        link.textContent = node.label;
        name.append(link);

        const os = document.createElement('td');
        os.textContent = node.os;

        const patch = document.createElement('td');
        patch.textContent =
          node.patch === 'n/a' ? 'n/a' : `${node.patch} · ${node.patchAge.toFixed(1)}y`;

        const state = document.createElement('td');
        state.dataset.state = node.state;
        state.textContent = node.state;

        const load = document.createElement('td');
        const loadWrap = document.createElement('span');
        loadWrap.className = 'load';
        const bar = document.createElement('span');
        bar.className = 'load__bar';
        const fill = document.createElement('span');
        fill.className = 'load__fill';
        const pct = Math.round(node.load * 100);
        fill.style.width = `${pct}%`;
        fill.dataset.level =
          node.state === 'infected' ? 'threat' : node.state === 'quarantined' ? 'warn' : 'ok';
        bar.append(fill);
        const pctText = document.createElement('span');
        pctText.textContent = `${pct}%`;
        loadWrap.append(bar, pctText);
        load.append(loadWrap);

        const virus = document.createElement('td');
        virus.textContent = node.virus?.name ?? '—';

        tr.append(name, os, patch, state, load, virus);
        return tr;
      }),
    );
  }

  function addBurst(node: SimNode, color: [number, number, number]) {
    bursts.push({ x: node.sx, y: node.sy, t: 0, color });
  }

  function infect(node: SimNode, now: number, virus: Virus) {
    if (node.kind === 'core' || node.state !== 'clean') return;
    if (infectedCount() >= MAX_INFECTED) {
      logEvent(`ingress blocked · ${node.label}`, 'signal');
      return;
    }
    if (node.patchAge < 1.5 && Math.random() < 0.65) {
      addBurst(node, SIGNAL);
      logEvent(`blocked · ${node.label} (patched)`, 'signal');
      return;
    }
    node.state = 'infected';
    node.virus = virus;
    node.load = 0.08;
    node.infectedAt = now;
    node.spreadAt = now + rand(1600, 3000) / virus.spread;
    node.defending = false;
    node.struggling = false;
    addBurst(node, THREAT);
    logEvent(`${virus.name} · ${node.label}`, 'threat');
    updateStats(now + 1000);
  }

  function quarantine(node: SimNode, now: number) {
    if (node.state !== 'infected') return;
    node.state = 'quarantined';
    node.quarantineUntil = now + QUARANTINE_TIME;
    node.defending = false;
    addBurst(node, SIGNAL);
    logEvent(`quarantine · ${node.label}`, 'signal');
    updateStats(now + 1000);
  }

  function restore(node: SimNode, now: number) {
    node.state = 'clean';
    node.load = 0;
    node.virus = null;
    node.struggling = false;
    node.quarantineUntil = 0;
    logEvent(`restored · ${node.label}`, 'signal');
    updateStats(now + 1000);
  }

  function crash(node: SimNode, now: number) {
    node.state = 'crashed';
    node.load = 1;
    node.reimageAt = now + rand(4500, 7500);
    node.defending = false;
    addBurst(node, THREAT);
    logEvent(`host crashed · ${node.label}`, 'threat');
    updateStats(now + 1000);
  }

  function reimage(node: SimNode, now: number, reason = 'monitoring') {
    if (node.kind === 'core') return;
    node.state = 'clean';
    node.load = 0;
    node.virus = null;
    node.infectedAt = 0;
    node.quarantineUntil = 0;
    node.reimageAt = 0;
    node.defending = false;
    node.struggling = false;
    addBurst(node, SIGNAL);
    logEvent(`${reason} reimaged · ${node.label}`, 'signal');
    updateStats(now + 1000);
  }

  function patchHost(node: SimNode, now: number) {
    if (node.kind === 'core') return;
    const before = node.patchAge;
    node.patch = '2026.11';
    node.patchAge = 0.1;
    addBurst(node, SIGNAL);
    logEvent(`patch · ${node.label} ${before.toFixed(1)}y → 0.1y`, 'signal');
    updateStats(now + 1000);
  }

  function addEdge(a: string, b: string, protocol: string) {
    if (edges.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a))) return;
    edges.push({ a, b, protocol });
    byId.get(a)?.neighbors.push(b);
    byId.get(b)?.neighbors.push(a);
  }

  function addGuest(now: number) {
    const guests = nodes.filter((n) => n.guest);
    if (guests.length >= MAX_GUESTS) removeGuest(guests[0], now);

    const def = pick(GUESTS);
    const id = `guest-${guestSeq++}`;
    const node: SimNode = {
      id,
      label: def.label,
      href: '/systems/',
      kind: 'system',
      blurb: 'A machine the monitoring system just added. Unpatched, of course.',
      os: def.os,
      patch: def.patch,
      patchAge: def.patchAge,
      wide: [rand(0.52, 0.94), rand(0.12, 0.8)],
      narrow: [rand(0.12, 0.92), rand(0.08, 0.38)],
      r: 5.6,
      depth: 0.7,
      sx: 0,
      sy: 0,
      rr: 5.6,
      state: 'clean',
      heat: 0,
      load: 0,
      virus: null,
      infectedAt: 0,
      quarantineUntil: 0,
      spreadAt: 0,
      reimageAt: 0,
      struggling: false,
      defending: false,
      phase: Math.random() * 6,
      neighbors: [],
      guest: true,
    };

    nodes.push(node);
    byId.set(id, node);
    addEdge(id, core.id, 'ssh');
    const others = nodes.filter((n) => n.id !== id && n.kind !== 'core');
    if (others.length) addEdge(id, pick(others).id, 'smb');
    positionNodes(now);
    addBurst(node, AMBER);
    logEvent(`monitoring added · ${node.label} (${def.patch})`, 'warn');
    updateStats(now + 1000);
  }

  function removeGuest(node: SimNode, now: number) {
    const idx = nodes.indexOf(node);
    if (idx < 0) return;
    nodes.splice(idx, 1);
    byId.delete(node.id);
    edges = edges.filter((e) => e.a !== node.id && e.b !== node.id);
    for (const n of nodes) n.neighbors = n.neighbors.filter((id) => id !== node.id);
    packets = packets.filter((p) => p.toId !== node.id && p.fromId !== node.id);
    if (focusedIndex === idx) focusedIndex = -1;
    else if (focusedIndex > idx) focusedIndex -= 1;
    if (hovered === node.id) setHover(null);
    logEvent(`monitoring removed · ${node.label}`, 'warn');
    updateStats(now + 1000);
  }

  function spawnEmail(now: number) {
    nextAttack = now + rand(ATTACK_GAP_MIN, ATTACK_GAP_MAX);
    const candidates = nodes.filter((n) => n.kind !== 'core' && n.state === 'clean');
    if (!candidates.length) return;
    const target = pick(candidates);
    const virus = pick(VIRUSES);
    const dx = target.sx - core.sx;
    const dy = target.sy - core.sy;
    const len = Math.hypot(dx, dy) || 1;
    const sx = target.sx + (dx / len) * Math.max(w, h) * 0.9;
    const sy = target.sy + (dy / len) * Math.max(w, h) * 0.9;
    const mx = (sx + target.sx) / 2;
    const my = (sy + target.sy) / 2;
    const bend = rand(60, 160) * (Math.random() > 0.5 ? 1 : -1);

    packets.push({
      kind: 'email',
      fromId: null,
      toId: target.id,
      t: 0,
      speed: rand(0.38, 0.55),
      sx,
      sy,
      cx: mx + (-dy / len) * bend,
      cy: my + (dx / len) * bend,
      virus,
    });
    logEvent(`email · ${virus.payload}`, 'threat');
  }

  function spawnTraffic() {
    const from = pick(nodes);
    if (!from.neighbors.length) return;
    const toId = pick(from.neighbors);
    if (packets.filter((p) => p.kind === 'traffic').length > PACKET_CAP) return;
    packets.push({ kind: 'traffic', fromId: from.id, toId, t: 0, speed: rand(0.35, 0.7) });
  }

  function spawnSpread(node: SimNode) {
    const targets = node.neighbors
      .map((id) => byId.get(id))
      .filter((n): n is SimNode => !!n && n.state === 'clean' && n.kind !== 'core');
    if (!targets.length) return;
    const target = pick(targets);
    const edge = edges.find(
      (e) => (e.a === node.id && e.b === target.id) || (e.a === target.id && e.b === node.id),
    );
    const protocol = edge?.protocol ?? 'ssh';
    packets.push({
      kind: 'spread',
      fromId: node.id,
      toId: target.id,
      t: 0,
      speed: rand(0.5, 0.8),
      virus: node.virus ?? pick(VIRUSES),
    });
    logEvent(`${protocol.toUpperCase()} · ${node.label} → ${target.label}`, 'threat');
  }

  function spawnDefense(node: SimNode) {
    node.defending = true;
    packets.push({ kind: 'defense', fromId: core.id, toId: node.id, t: 0, speed: rand(0.7, 0.95) });
  }

  function spawnMonitor(now: number) {
    nextMonitor = now + rand(MONITOR_GAP_MIN, MONITOR_GAP_MAX);
    const candidates = nodes.filter((n) => n.kind !== 'core');
    if (!candidates.length) return;
    // The first three sweeps demonstrate add, patch, and reimage. After that
    // the monitoring system picks at random.
    const scripted: Array<'add' | 'patch' | 'reimage'> = ['add', 'patch', 'reimage'];
    const roll = Math.random();
    const action: 'reimage' | 'patch' | 'add' =
      monitorStep < scripted.length
        ? scripted[monitorStep]
        : roll < 0.4
          ? 'reimage'
          : roll < 0.7
            ? 'patch'
            : 'add';
    monitorStep += 1;
    const to = action === 'add' ? core : pick(candidates);
    packets.push({
      kind: 'monitor',
      fromId: null,
      toId: to.id,
      t: 0,
      speed: rand(0.35, 0.5),
      sx: -30,
      sy: rand(h * 0.15, h * 0.85),
      cx: w * 0.25,
      cy: to.sy,
      action,
    });
    logEvent(`monitoring sweep · ${action}`, 'warn');
  }

  function arrive(packet: Packet, now: number) {
    const target = byId.get(packet.toId);
    if (!target) return;
    if (packet.kind === 'email' || packet.kind === 'spread') {
      infect(target, now, packet.virus ?? pick(VIRUSES));
    } else if (packet.kind === 'defense') {
      quarantine(target, now);
    } else if (packet.kind === 'monitor') {
      if (packet.action === 'add') addGuest(now);
      else if (packet.action === 'patch') patchHost(target, now);
      else reimage(target, now, 'monitoring');
    }
  }

  function update(dt: number, now: number) {
    positionNodes(now);

    // Ease heat toward the node's state.
    for (const node of nodes) {
      const target =
        node.state === 'infected'
          ? 1
          : node.state === 'quarantined'
            ? 0.28
            : node.state === 'crashed'
              ? 0.12
              : 0;
      node.heat += (target - node.heat) * Math.min(1, dt * 4.5);
    }

    if (!paused) {
      if (now > nextAttack) spawnEmail(now);
      if (now > nextMonitor) spawnMonitor(now);

      trafficTimer += dt;
      if (trafficTimer > TRAFFIC_INTERVAL) {
        trafficTimer = 0;
        spawnTraffic();
      }

      for (const node of nodes) {
        if (node.state === 'infected') {
          const virus = node.virus;
          if (virus) node.load = Math.min(1, node.load + dt * virus.growth);
          if (!node.struggling && node.load > 0.7) {
            node.struggling = true;
            logEvent(`host struggling · ${node.label} ${Math.round(node.load * 100)}%`, 'threat');
          }
          if (node.load >= 1) {
            crash(node, now);
            continue;
          }
          if (now > node.spreadAt) {
            node.spreadAt = now + rand(2200, 3800) / (virus?.spread ?? 1);
            spawnSpread(node);
          }
          if (!node.defending && now - node.infectedAt > DEFEND_AFTER) {
            spawnDefense(node);
          }
        }
        if (node.state === 'quarantined' && now > node.quarantineUntil) {
          restore(node, now);
        }
        if (node.state === 'crashed' && now > node.reimageAt) {
          reimage(node, now, 'monitoring');
        }
      }

      // Advance packets.
      for (const packet of packets) {
        packet.t += packet.speed * dt;
      }

      const arrived = packets.filter((p) => p.t >= 1);
      if (arrived.length) {
        packets = packets.filter((p) => p.t < 1);
        for (const packet of arrived) arrive(packet, now);
      }

      for (const burst of bursts) burst.t += dt * 1.5;
      bursts = bursts.filter((burst) => burst.t < 1);
    }

    updateStats(now);
  }

  function packetPoint(packet: Packet, t: number): [number, number] {
    const to = byId.get(packet.toId);
    const tx = to ? to.sx : 0;
    const ty = to ? to.sy : 0;

    if (packet.fromId) {
      const from = byId.get(packet.fromId);
      const fx = from ? from.sx : tx;
      const fy = from ? from.sy : ty;
      return [lerp(fx, tx, t), lerp(fy, ty, t)];
    }

    const sx = packet.sx ?? tx;
    const sy = packet.sy ?? ty;
    const cx = packet.cx ?? (sx + tx) / 2;
    const cy = packet.cy ?? (sy + ty) / 2;
    const u = 1 - t;
    return [
      u * u * sx + 2 * u * t * cx + t * t * tx,
      u * u * sy + 2 * u * t * cy + t * t * ty,
    ];
  }

  function drawGrid(now: number) {
    // Soft bloom behind the network.
    const bloomRadius = Math.min(w, h) * 0.62;
    const bloom = ctx.createRadialGradient(core.sx, core.sy, 0, core.sx, core.sy, bloomRadius);
    bloom.addColorStop(0, 'rgba(110, 242, 192, 0.06)');
    bloom.addColorStop(0.45, 'rgba(110, 242, 192, 0.018)');
    bloom.addColorStop(1, 'rgba(110, 242, 192, 0)');
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, w, h);

    // Faint starfield for depth.
    for (const star of stars) {
      const sx = star.x * w + (reduce ? 0 : (mouseX - w / 2) * 0.004 * star.depth);
      const sy = star.y * h + (reduce ? 0 : (mouseY - h / 2) * 0.004 * star.depth);
      const twinkle = reduce ? 1 : 0.7 + 0.3 * Math.sin(now * 0.001 + star.phase);
      ctx.fillStyle = `rgba(180, 200, 220, ${star.a * twinkle})`;
      ctx.beginPath();
      ctx.arc(sx, sy, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const ox = reduce ? 0 : (mouseX - w / 2) * -0.004;
    const oy = reduce ? 0 : (mouseY - h / 2) * -0.004;
    if (gridPattern) {
      ctx.save();
      ctx.translate(ox, oy);
      ctx.fillStyle = gridPattern;
      ctx.fillRect(-ox, -oy, w, h);
      ctx.restore();
    }

    // Radar rings around the core.
    const r = Math.min(w, h) * 0.46;
    ctx.save();
    ctx.translate(core.sx, core.sy);
    ctx.strokeStyle = 'rgba(110, 242, 192, 0.07)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, (r / 3) * i, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (!reduce) {
      const angle = (now * 0.00016) % (Math.PI * 2);
      ctx.rotate(angle);
      const grad = ctx.createLinearGradient(0, 0, r, 0);
      grad.addColorStop(0, 'rgba(110, 242, 192, 0)');
      grad.addColorStop(1, 'rgba(110, 242, 192, 0.22)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEdges() {
    for (const edge of edges) {
      const a = byId.get(edge.a);
      const b = byId.get(edge.b);
      if (!a || !b) continue;

      const heat = Math.max(a.heat, b.heat);
      const isHover = hovered === edge.a || hovered === edge.b;
      const cut = a.state === 'quarantined' || b.state === 'quarantined';
      const share = edge.protocol === 'smb' || edge.protocol === 'nfs' || edge.protocol === 'lxc';
      const color = mix(SIGNAL, THREAT, heat);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.strokeStyle =
        heat > 0.05 ? color : isHover ? rgba(SIGNAL, 0.55) : 'rgba(120, 150, 180, 0.26)';
      ctx.lineWidth = isHover ? 1.4 : 1;
      if (share) ctx.setLineDash([2, 4]);
      if (cut) ctx.setLineDash([3, 5]);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawPacketShape(
    packet: Packet,
    x: number,
    y: number,
    color: [number, number, number],
    alpha: number,
  ) {
    if (packet.kind === 'email') {
      const ew = 7;
      const eh = 5;
      ctx.strokeStyle = rgba(color, alpha);
      ctx.lineWidth = 1;
      ctx.strokeRect(x - ew / 2, y - eh / 2, ew, eh);
      ctx.beginPath();
      ctx.moveTo(x - ew / 2, y - eh / 2);
      ctx.lineTo(x, y + 1);
      ctx.lineTo(x + ew / 2, y - eh / 2);
      ctx.stroke();
      return;
    }

    if (packet.kind === 'spread') {
      for (let i = 0; i < 3; i++) {
        const angle = i * 2.1;
        ctx.fillStyle = rgba(color, alpha * (0.45 + i * 0.18));
        ctx.beginPath();
        ctx.arc(x + Math.cos(angle) * 3, y + Math.sin(angle) * 3, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    if (packet.kind === 'monitor') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = rgba(color, alpha);
      ctx.lineWidth = 1;
      ctx.strokeRect(-2.5, -2.5, 5, 5);
      ctx.restore();
      return;
    }

    if (packet.kind === 'defense') {
      ctx.strokeStyle = rgba(color, alpha);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    ctx.fillStyle = rgba(color, alpha);
    ctx.beginPath();
    ctx.arc(x, y, packet.kind === 'traffic' ? 1.4 : 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPackets() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const packet of packets) {
      const t = clamp(packet.t, 0, 1);
      const [x, y] = packetPoint(packet, t);
      const [px, py] = packetPoint(packet, Math.max(0, t - 0.16));

      // Inbound packets leave a faint arc across the map.
      if (!packet.fromId) {
        const to = byId.get(packet.toId);
        if (to) {
          const sx = packet.sx ?? to.sx;
          const sy = packet.sy ?? to.sy;
          const cx = packet.cx ?? (sx + to.sx) / 2;
          const cy = packet.cy ?? (sy + to.sy) / 2;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo(cx, cy, to.sx, to.sy);
          ctx.strokeStyle = rgba(packet.kind === 'monitor' ? AMBER : THREAT, 0.09);
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 7]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      const color =
        packet.kind === 'email' || packet.kind === 'spread'
          ? THREAT
          : packet.kind === 'monitor'
            ? packet.action === 'patch'
              ? SIGNAL
              : AMBER
            : SIGNAL;

      const alpha = packet.kind === 'traffic' ? 0.5 : 0.95;
      const halo =
        packet.kind === 'traffic' ? 7 : packet.kind === 'monitor' ? 10 : packet.kind === 'email' ? 12 : 12;

      // Trail
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.strokeStyle = rgba(color, alpha * 0.32);
      ctx.lineWidth = packet.kind === 'traffic' ? 1 : 1.6;
      ctx.stroke();

      // Halo (two circles is cheaper than a radial gradient per packet)
      ctx.fillStyle = rgba(color, alpha * 0.12);
      ctx.beginPath();
      ctx.arc(x, y, halo, 0, Math.PI * 2);
      ctx.fill();

      drawPacketShape(packet, x, y, color, alpha);
    }

    ctx.restore();
  }

  function polygon(x: number, y: number, radius: number, sides: number, rotation: number) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = rotation + (i / sides) * Math.PI * 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function drawVirus(node: SimNode, now: number) {
    if (!node.virus || node.state !== 'infected') return;
    const t = reduce ? 0 : now;
    const count = 2 + Math.floor(node.load * 5);
    for (let i = 0; i < count; i++) {
      const angle = t * 0.0018 + node.phase + i * ((Math.PI * 2) / count);
      const radius = node.rr + 6 + node.load * 10 + Math.sin(t * 0.004 + i) * 2;
      const x = node.sx + Math.cos(angle) * radius;
      const y = node.sy + Math.sin(angle) * radius;
      ctx.fillStyle = rgba(THREAT, 0.3 + node.load * 0.45);
      ctx.beginPath();
      ctx.arc(x, y, 1 + node.load * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawNodes(now: number) {
    for (const node of nodes) {
      const isHover = hovered === node.id;
      const isFocus = focusedIndex >= 0 && nodes[focusedIndex]?.id === node.id;
      const rgb = mixRgb(SIGNAL, THREAT, node.heat);
      const color = `rgb(${rgb.join(',')})`;
      const r = node.rr + (node.state === 'infected' ? node.load * 2 : 0);

      // Outer glow
      const glowRadius = r * (node.state === 'infected' ? 7 : 5);
      const glow = ctx.createRadialGradient(node.sx, node.sy, 0, node.sx, node.sy, glowRadius);
      const glowColor =
        node.state === 'infected'
          ? THREAT
          : node.state === 'quarantined'
            ? AMBER
            : node.state === 'crashed'
              ? THREAT
              : SIGNAL;
      const glowAlpha =
        node.state === 'infected' ? 0.16 + node.load * 0.08 : node.state === 'crashed' ? 0.05 : 0.1;
      glow.addColorStop(0, rgba(glowColor, glowAlpha));
      glow.addColorStop(1, rgba(glowColor, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(node.sx, node.sy, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Hover / focus ring
      if (isHover || isFocus) {
        ctx.save();
        ctx.strokeStyle = rgba(SIGNAL, 0.7);
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.lineDashOffset = reduce ? 0 : -now * 0.012;
        ctx.beginPath();
        ctx.arc(node.sx, node.sy, r + 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Shape
      ctx.save();
      ctx.strokeStyle = node.state === 'crashed' ? rgba(THREAT, 0.38) : color;
      ctx.fillStyle = rgba(rgb, node.state === 'quarantined' ? 0.12 : 0.9);
      ctx.lineWidth = node.kind === 'core' ? 1.6 : 1.2;

      if (node.state === 'quarantined') {
        ctx.setLineDash([2, 3]);
      }
      if (node.state === 'crashed') {
        ctx.setLineDash([2, 3]);
      }

      if (node.kind === 'core') {
        polygon(node.sx, node.sy, r, 6, Math.PI / 6);
      } else if (node.kind === 'external') {
        polygon(node.sx, node.sy, r, 4, Math.PI / 4);
      } else {
        ctx.beginPath();
        ctx.arc(node.sx, node.sy, r, 0, Math.PI * 2);
      }
      ctx.stroke();

      if (node.state === 'crashed') {
        ctx.beginPath();
        ctx.moveTo(node.sx - 3, node.sy - 3);
        ctx.lineTo(node.sx + 3, node.sy + 3);
        ctx.moveTo(node.sx + 3, node.sy - 3);
        ctx.lineTo(node.sx - 3, node.sy + 3);
        ctx.stroke();
      } else if (node.kind === 'core' || node.state === 'infected') {
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(node.sx, node.sy, r * 0.36, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Infection load ring
      if (node.state === 'infected') {
        ctx.beginPath();
        ctx.arc(
          node.sx,
          node.sy,
          r + 4.5,
          -Math.PI / 2,
          -Math.PI / 2 + Math.PI * 2 * node.load,
        );
        ctx.strokeStyle = rgba(THREAT, 0.75);
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Virus particles
      drawVirus(node, now);

      // Infected flicker
      if (node.state === 'infected') {
        const flicker = 0.5 + 0.5 * Math.sin(now * 0.012 + node.phase);
        ctx.strokeStyle = rgba(THREAT, 0.25 + flicker * 0.4);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(node.sx, node.sy, r + 4 + flicker * 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Labels
      const showLabel =
        w > 720 ||
        node.kind === 'core' ||
        isHover ||
        isFocus ||
        node.state === 'infected' ||
        node.state === 'crashed';
      if (!showLabel) continue;

      const label = node.label;
      const virus = node.virus;
      const sub =
        node.state === 'infected' && virus
          ? `${virus.name} ${Math.round(node.load * 100)}%`
          : node.state === 'crashed'
            ? 'offline · reimaging'
            : '';

      ctx.font = '500 11px "JetBrains Mono Variable", ui-monospace, monospace';
      ctx.textBaseline = 'middle';
      const mainWidth = ctx.measureText(label).width;
      let textWidth = mainWidth;
      if (sub) {
        ctx.font = '500 9px "JetBrains Mono Variable", ui-monospace, monospace';
        textWidth = Math.max(textWidth, ctx.measureText(sub).width);
        ctx.font = '500 11px "JetBrains Mono Variable", ui-monospace, monospace';
      }

      const pad = 4;
      const labelX = node.sx + r + 9;
      const labelY = node.sy + 0.5;
      const flip = labelX + textWidth + pad * 2 > w - 4;
      const drawX = flip ? node.sx - r - 9 - textWidth - pad * 2 : labelX;
      const alpha = isHover || isFocus ? 1 : node.state === 'infected' ? 0.95 : 0.72;
      const boxH = sub ? 30 : 17;

      ctx.fillStyle = `rgba(6, 8, 13, ${isHover || isFocus ? 0.85 : 0.62})`;
      ctx.beginPath();
      ctx.roundRect(drawX, labelY - boxH / 2, textWidth + pad * 2, boxH, 2);
      ctx.fill();

      ctx.fillStyle =
        node.state === 'infected'
          ? rgba(THREAT, alpha)
          : isHover || isFocus
            ? rgba(SIGNAL, alpha)
            : rgba(TEXT_DIM, alpha);
      ctx.textAlign = 'left';
      ctx.fillText(label, drawX + pad, labelY - (sub ? 5 : 0));

      if (sub) {
        ctx.font = '500 9px "JetBrains Mono Variable", ui-monospace, monospace';
        ctx.fillStyle = rgba(THREAT, 0.85);
        ctx.fillText(sub, drawX + pad, labelY + 7);
      }
    }
  }

  function drawBursts() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const burst of bursts) {
      const radius = 10 + burst.t * 70;
      const alpha = (1 - burst.t) * 0.45;
      ctx.strokeStyle = rgba(burst.color, alpha);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw(now: number) {
    ctx.clearRect(0, 0, w, h);
    drawGrid(now);
    drawEdges();
    drawPackets();
    drawBursts();
    drawNodes(now);
  }

  function loop(now: number) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (!paused && !reduce && visible) {
      update(dt, now);
    } else {
      positionNodes(now);
    }

    draw(now);

    if (!paused && !reduce && visible) {
      raf = requestAnimationFrame(loop);
    }
  }

  function kick() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function showTip(node: SimNode) {
    if (!tip) return;
    tip.classList.add('is-visible');
    if (tipKind) {
      tipKind.textContent = node.guest
        ? 'guest machine'
        : node.kind === 'external'
          ? 'external'
          : node.kind === 'core'
            ? 'core system'
            : 'system record';
    }
    if (tipLabel) tipLabel.textContent = node.label;
    if (tipDesc) {
      tipDesc.textContent =
        node.state === 'infected' && node.virus
          ? node.virus.note
          : node.state === 'crashed'
            ? 'Offline. The monitoring system will reimage it.'
            : node.state === 'quarantined'
              ? 'Quarantined. Traffic is cut until the host is restored.'
              : node.blurb;
    }
    if (tipMeta) {
      const patchNote =
        node.patch === 'n/a'
          ? 'not applicable'
          : node.patchAge > 0.5
            ? `${node.patchAge.toFixed(1)}y behind`
            : 'current';
      tipMeta.textContent =
        node.state === 'infected' && node.virus
          ? `${node.virus.name} · load ${Math.round(node.load * 100)}% · ${node.os} · patch ${node.patch}`
          : node.state === 'crashed'
            ? `offline · ${node.os} · patch ${node.patch}`
            : node.state === 'quarantined'
              ? `quarantined · ${node.os} · patch ${node.patch}`
              : `${node.os} · patch ${node.patch} · ${patchNote}`;
      tipMeta.dataset.state = node.state;
    }
    if (tipGo) {
      tipGo.textContent = node.guest ? 'open systems →' : 'open record →';
    }

    const tipW = 260;
    const tipH = 150;
    const left = clamp(node.sx + 18, 8, Math.max(8, w - tipW - 8));
    const top = clamp(node.sy - 18, 8, Math.max(8, h - tipH - 8));
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }

  function hideTip() {
    tip?.classList.remove('is-visible');
  }

  function hideHint() {
    if (hintTimer !== null) {
      window.clearTimeout(hintTimer);
      hintTimer = null;
    }
    if (!hintVisible) return;
    hintVisible = false;
    hint?.classList.remove('is-visible');
    canvas?.classList.remove('is-open');
  }

  function positionHint(x: number, y: number) {
    if (!hint) return;
    const hintW = hint.offsetWidth || 180;
    const hintH = hint.offsetHeight || 32;
    const left = clamp(x + 18, 8, Math.max(8, w - hintW - 8));
    const top = clamp(y + 18, 8, Math.max(8, h - hintH - 8));
    hint.style.left = `${left}px`;
    hint.style.top = `${top}px`;
  }

  function showHint(x: number, y: number) {
    if (!hint || detail) return;
    if (hintTimer !== null) {
      window.clearTimeout(hintTimer);
      hintTimer = null;
    }
    hintVisible = true;
    hint.classList.add('is-visible');
    canvas?.classList.add('is-open');
    positionHint(x, y);
  }

  function scheduleHint(x: number, y: number) {
    if (!hint || detail) return;
    if (hintVisible) {
      positionHint(x, y);
      return;
    }
    if (hintTimer !== null) return;
    hintTimer = window.setTimeout(() => {
      hintTimer = null;
      if (pointerInside && !hovered) showHint(mouseX, mouseY);
    }, 620);
  }

  function setHover(id: string | null) {
    if (hovered === id) return;
    hovered = id;
    canvas?.classList.toggle('is-hot', !!id);
    if (id) {
      hideHint();
      const node = byId.get(id);
      if (node) showTip(node);
    } else {
      hideTip();
    }
    kick();
  }

  function announceNode(node: SimNode) {
    if (!announce) return;
    const state =
      node.state === 'infected'
        ? `Infected with ${node.virus?.name ?? 'malware'}.`
        : node.state === 'crashed'
          ? 'Offline.'
          : node.state === 'quarantined'
            ? 'Quarantined.'
            : 'Online.';
    announce.textContent = `${node.label}. ${state} ${node.blurb}`;
  }

  function hitTest(x: number, y: number): SimNode | null {
    let best: SimNode | null = null;
    let bestDist = Infinity;
    for (const node of nodes) {
      const d = Math.hypot(node.sx - x, node.sy - y);
      if (d < node.rr + 16 && d < bestDist) {
        best = node;
        bestDist = d;
      }
    }
    return best;
  }

  const onPointerMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
    pointerInside = true;
    const node = hitTest(mouseX, mouseY);
    setHover(node?.id ?? null);
    if (node) hideHint();
    else scheduleHint(mouseX, mouseY);
    if (reduce) kick();
  };

  const onPointerLeave = () => {
    pointerInside = false;
    setHover(null);
  };

  const onClick = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const node = hitTest(x, y);
    if (node) {
      openNode(node);
      return;
    }
    if (detail) return;
    if (hintVisible) {
      navigate('/tank');
      return;
    }
    showHint(x, y);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Enter', ' ', 'Escape'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();

    if (event.key === 'Escape') {
      focusedIndex = -1;
      setHover(null);
      if (announce) announce.textContent = '';
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      const node = focusedIndex >= 0 ? nodes[focusedIndex] : null;
      if (node) openNode(node);
      return;
    }

    const dir = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    focusedIndex =
      focusedIndex < 0
        ? dir > 0
          ? 0
          : nodes.length - 1
        : (focusedIndex + dir + nodes.length) % nodes.length;
    const node = nodes[focusedIndex];
    setHover(node.id);
    showTip(node);
    announceNode(node);
    kick();
  };

  const onFocus = () => {
    if (focusedIndex < 0) focusedIndex = 0;
    const node = nodes[focusedIndex];
    setHover(node.id);
    showTip(node);
    announceNode(node);
  };

  const onBlur = (event: FocusEvent) => {
    focusedIndex = -1;
    setHover(null);
    if (event.relatedTarget !== hint) hideHint();
    if (announce) announce.textContent = '';
  };

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('click', onClick);
  stage.addEventListener('pointerleave', hideHint);
  canvas.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('focus', onFocus);
  canvas.addEventListener('blur', onBlur);

  pauseBtn?.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.querySelector('[data-label]')!.textContent = paused ? 'resume' : 'pause';
    if (!paused) kick();
    else {
      cancelAnimationFrame(raf);
      raf = 0;
      draw(performance.now());
    }
  });

  const ro = new ResizeObserver(resize);
  ro.observe(stage);

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) kick();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    { threshold: 0.02 },
  );
  io.observe(stage);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else {
      kick();
    }
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => kick());
  }

  logEvent('network online', 'signal');
  logEvent(`${nodes.length} hosts reachable`, 'info');

  // Patient zero: the deliberately old Webmin box is already infected.
  const patientZero = byId.get('cve-2012-2982');
  if (patientZero) {
    const now = performance.now();
    patientZero.state = 'infected';
    patientZero.virus = VIRUSES[0];
    patientZero.load = 0.42;
    patientZero.heat = 1;
    patientZero.infectedAt = now - 2200;
    patientZero.spreadAt = now + 1800;
    patientZero.struggling = true;
    logEvent(`${VIRUSES[0].name} · ${patientZero.label}`, 'threat');
    logEvent('host struggling · CVE-2012-2982 42%', 'threat');
  }

  updateStats(performance.now() + 1000);
  resize();
  kick();

  // Keep the pointer state fresh if the window scrolls under a stationary mouse.
  window.addEventListener('scroll', () => {
    if (pointerInside && reduce) kick();
  });
}
