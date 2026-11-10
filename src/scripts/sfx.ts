/**
 * Sound. Muted by default, persisted in localStorage.
 *
 * Every sound has a synthesized fallback. To use real files instead, drop them in
 * /public/sounds/ and list them in /public/sounds/manifest.json, e.g.
 *   { "blip": "blip.wav", "select": "select.wav", "item": "item.wav", "ambient": "ambient.ogg" }
 */

export type SoundName = 'blip' | 'move' | 'select' | 'item' | 'save' | 'ambient';

const KEY = 'cc.sound';
let ctx: AudioContext | null = null;
let manifest: Partial<Record<SoundName, string>> | null = null;
const buffers = new Map<SoundName, AudioBuffer>();
let ambientNode: { stop: () => void } | null = null;
let wantAmbient = false;

export const isOn = () => localStorage.getItem(KEY) === 'on';

function audio(): AudioContext | null {
  if (!isOn()) return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    void loadManifest();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

async function loadManifest() {
  if (manifest) return;
  manifest = {};
  try {
    const res = await fetch('/sounds/manifest.json', { cache: 'force-cache' });
    if (!res.ok) return;
    manifest = await res.json();
    await Promise.all(
      Object.entries(manifest!).map(async ([name, file]) => {
        try {
          const data = await (await fetch(`/sounds/${file}`)).arrayBuffer();
          buffers.set(name as SoundName, await ctx!.decodeAudioData(data));
        } catch {
          /* fall back to synth */
        }
      }),
    );
    if (wantAmbient) startAmbient();
  } catch {
    /* no manifest: synth only */
  }
}

function playBuffer(name: SoundName, loop = false, gain = 0.6) {
  const a = ctx!;
  const src = a.createBufferSource();
  src.buffer = buffers.get(name)!;
  src.loop = loop;
  const g = a.createGain();
  g.gain.value = gain;
  src.connect(g).connect(a.destination);
  src.start();
  return { stop: () => src.stop() };
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

export function play(name: SoundName, voice = 1) {
  const a = audio();
  if (!a) return;
  if (buffers.has(name)) {
    playBuffer(name);
    return;
  }
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

/** A low, slow drone for the tree room. Real file wins if present. */
function startAmbient() {
  const a = audio();
  if (!a || ambientNode) return;
  if (buffers.has('ambient')) {
    ambientNode = playBuffer('ambient', true, 0.35);
    return;
  }
  const master = a.createGain();
  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(0.03, a.currentTime + 3);
  master.connect(a.destination);
  const oscs = [55, 82.4, 110.3].map((f, i) => {
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
    return [o, lfo];
  });
  ambientNode = {
    stop: () => {
      master.gain.linearRampToValueAtTime(0, a.currentTime + 0.6);
      setTimeout(() => oscs.flat().forEach((o) => o.stop()), 700);
    },
  };
}

export function ambient(on: boolean) {
  wantAmbient = on;
  if (on) startAmbient();
  else {
    ambientNode?.stop();
    ambientNode = null;
  }
}

export function setOn(on: boolean) {
  localStorage.setItem(KEY, on ? 'on' : 'off');
  if (!on) {
    ambientNode?.stop();
    ambientNode = null;
  } else {
    audio();
    if (wantAmbient) startAmbient();
  }
  document.dispatchEvent(new CustomEvent('cc:sound', { detail: on }));
}
