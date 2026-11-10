/**
 * Sound. Muted by default, persisted in localStorage.
 *
 * Effects have synthesized fallbacks. Real files go in /public/sounds/ and are
 * listed in /public/sounds/manifest.json, e.g.
 *   { "music": "egg.mp3", "blip": "blip.wav", "select": "select.wav" }
 *
 * "music" loops while the tree room is on screen. If there's no music file,
 * a quiet synthesized drone plays instead.
 */

export type SoundName = 'blip' | 'move' | 'select' | 'item' | 'save' | 'music' | 'gaster';

const KEY = 'cc.sound';
/** Gaster's voice file is loud and harsh; keep it well under everything else. */
const GASTER_VOL = 0.06;
const MUSIC_VOL = 0.12; // background level: under the text blips, never in front
const FADE = 1.2;

let ctx: AudioContext | null = null;
let loaded: Promise<void> | null = null;
const buffers = new Map<SoundName, AudioBuffer>();
/** Start times (s) of each separate blip in the Gaster voice file. */
let gasterOnsets: number[] = [];
let musicNode: { stop: () => void } | null = null;
let wantMusic = false;

export const isOn = () => localStorage.getItem(KEY) === 'on';

function audio(): AudioContext | null {
  if (!isOn()) return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    loaded = loadManifest(ctx);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

async function loadManifest(a: AudioContext) {
  try {
    const res = await fetch('/sounds/manifest.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const manifest: Record<string, string> = await res.json();
    await Promise.all(
      Object.entries(manifest).map(async ([name, file]) => {
        try {
          const data = await (await fetch(`/sounds/${file}`)).arrayBuffer();
          const buf = await a.decodeAudioData(data);
          buffers.set(name as SoundName, buf);
          if (name === 'gaster') gasterOnsets = onsets(buf);
        } catch {
          /* missing or undecodable: fall back to synth */
        }
      }),
    );
  } catch {
    /* no manifest: synth only */
  }
}

/** Finds where each sound starts after a gap of silence (5ms windows). */
function onsets(buf: AudioBuffer): number[] {
  const data = buf.getChannelData(0);
  const win = Math.round(buf.sampleRate * 0.005);
  const out: number[] = [];
  let quiet = 0;
  for (let i = 0; i + win < data.length; i += win) {
    let sum = 0;
    for (let j = i; j < i + win; j++) sum += data[j] * data[j];
    const loud = Math.sqrt(sum / win) > 0.02;
    if (loud && (out.length === 0 || quiet >= 6)) out.push(i / buf.sampleRate);
    quiet = loud ? 0 : quiet + 1;
  }
  return out;
}

/** One Gaster blip: a random slice of the voice file, short and quiet. */
function gasterBlip() {
  const a = ctx!;
  const buf = buffers.get('gaster');
  if (!buf || !gasterOnsets.length) return;
  const at = gasterOnsets[Math.floor(Math.random() * gasterOnsets.length)];
  const src = a.createBufferSource();
  src.buffer = buf;
  const g = a.createGain();
  const t = a.currentTime;
  g.gain.setValueAtTime(GASTER_VOL, t);
  g.gain.linearRampToValueAtTime(0, t + 0.11);
  src.connect(g).connect(a.destination);
  src.start(t, at, 0.12);
}

function playBuffer(name: SoundName, gain = 0.6) {
  const a = ctx!;
  const src = a.createBufferSource();
  src.buffer = buffers.get(name)!;
  const g = a.createGain();
  g.gain.value = gain;
  src.connect(g).connect(a.destination);
  src.start();
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'square', vol = 0.035) {
  const a = ctx!;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, a.currentTime + start);
  g.gain.linearRampToValueAtTime(vol, a.currentTime + start + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start);
  o.stop(a.currentTime + start + dur + 0.02);
}

export function play(name: Exclude<SoundName, 'music'>, voice = 1) {
  const a = audio();
  if (!a) return;
  if (name === 'gaster') return gasterBlip();
  if (buffers.has(name)) return playBuffer(name);
  switch (name) {
    case 'blip':
      tone(220 * voice + Math.random() * 12, 0, 0.045, 'square', 0.025);
      break;
    case 'move':
      tone(660, 0, 0.04, 'square', 0.02);
      break;
    case 'select':
      tone(523, 0, 0.06);
      tone(784, 0.05, 0.08);
      break;
    case 'item':
      [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.07, 0.12, 'triangle', 0.05));
      break;
    case 'save':
      [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.05, 0.25, 'sine', 0.04));
      break;
  }
}

/** Starts the looped track (or the drone fallback) with a fade-in. */
async function startMusic() {
  const a = audio();
  if (!a || musicNode) return;
  await loaded;
  if (!wantMusic || musicNode || !isOn()) return;

  const master = a.createGain();
  master.gain.setValueAtTime(0, a.currentTime);
  master.connect(a.destination);
  const sources: AudioScheduledSourceNode[] = [];

  if (buffers.has('music')) {
    master.gain.linearRampToValueAtTime(MUSIC_VOL, a.currentTime + FADE);
    const src = a.createBufferSource();
    src.buffer = buffers.get('music')!;
    src.loop = true;
    src.connect(master);
    src.start();
    sources.push(src);
  } else {
    master.gain.linearRampToValueAtTime(0.03, a.currentTime + 3);
    [55, 82.4, 110.3].forEach((f, i) => {
      const o = a.createOscillator();
      o.type = i === 2 ? 'triangle' : 'sine';
      o.frequency.value = f;
      const lfo = a.createOscillator();
      const lg = a.createGain();
      lfo.frequency.value = 0.07 + i * 0.03;
      lg.gain.value = 0.6;
      lfo.connect(lg).connect(o.frequency);
      o.connect(master);
      o.start();
      lfo.start();
      sources.push(o, lfo);
    });
  }

  musicNode = {
    stop: () => {
      const now = a.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + FADE * 0.6);
      setTimeout(() => sources.forEach((s) => s.stop()), FADE * 600 + 50);
    },
  };
}

function stopMusic() {
  musicNode?.stop();
  musicNode = null;
}

/** Ask for the room music on or off. It only actually plays when sound is on. */
export function music(on: boolean) {
  if (on === wantMusic) return;
  wantMusic = on;
  if (on) void startMusic();
  else stopMusic();
}

export function setOn(on: boolean) {
  localStorage.setItem(KEY, on ? 'on' : 'off');
  if (!on) stopMusic();
  else {
    audio();
    if (wantMusic) void startMusic();
  }
  document.dispatchEvent(new CustomEvent('cc:sound', { detail: on }));
}
