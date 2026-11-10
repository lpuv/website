/**
 * A small typewriter dialogue engine, modelled on the overworld text box.
 *
 * Z / Enter / click: advance (or finish the current line).
 * X / Shift: finish the current line instantly.
 * Arrows / WASD: move between choices.
 */
import { play } from './sfx';

export type Choice = { id: string; label: string };
export type Line = string | { text: string; choices?: Choice[]; voice?: number };

const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export class Dialogue {
  readonly box: HTMLElement;
  private textEl: HTMLElement;
  private liveEl: HTMLElement;
  private choicesEl: HTMLElement;
  private nextEl: HTMLElement;
  open = false;
  private typing = false;
  private skip = false;
  private resolveAdvance: (() => void) | null = null;
  private resolveChoice: ((id: string) => void) | null = null;
  private choiceIndex = 0;
  private choiceButtons: HTMLButtonElement[] = [];

  constructor(box: HTMLElement) {
    this.box = box;
    this.textEl = box.querySelector('[data-dlg-text]')!;
    this.liveEl = box.querySelector('[data-dlg-live]')!;
    this.choicesEl = box.querySelector('[data-dlg-choices]')!;
    this.nextEl = box.querySelector('[data-dlg-next]')!;

    box.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('button')) return;
      this.advance();
    });
  }

  /** Returns true if the key was handled. */
  key(e: KeyboardEvent): boolean {
    if (!this.open) return false;
    const k = e.key.toLowerCase();
    if (this.resolveChoice && !this.typing) {
      const cols = window.matchMedia('(max-width: 560px)').matches ? 1 : 2;
      const n = this.choiceButtons.length;
      let i = this.choiceIndex;
      if (k === 'arrowright' || k === 'd') i = (i + 1) % n;
      else if (k === 'arrowleft' || k === 'a') i = (i - 1 + n) % n;
      else if (k === 'arrowdown' || k === 's') i = Math.min(n - 1, i + cols);
      else if (k === 'arrowup' || k === 'w') i = Math.max(0, i - cols);
      else if (k === 'z' || k === 'enter') {
        this.choiceButtons[i]?.click();
        return true;
      } else return false;
      if (i !== this.choiceIndex) {
        this.focusChoice(i);
        play('move');
      }
      return true;
    }
    if (k === 'z' || k === 'enter') {
      this.advance();
      return true;
    }
    if (k === 'x' || k === 'shift') {
      this.skip = true;
      return true;
    }
    return false;
  }

  private advance() {
    if (this.typing) {
      this.skip = true;
      return;
    }
    if (this.resolveAdvance) {
      const r = this.resolveAdvance;
      this.resolveAdvance = null;
      play('select');
      r();
    }
  }

  private focusChoice(i: number) {
    this.choiceIndex = i;
    this.choiceButtons.forEach((b, j) => b.classList.toggle('is-sel', j === i));
  }

  private async type(text: string, voice: number) {
    this.typing = true;
    this.skip = false;
    const star = text.startsWith('* ');
    if (star) text = text.slice(2);
    this.textEl.classList.toggle('has-star', star);
    this.textEl.classList.toggle('is-man', voice < 1);
    this.textEl.textContent = '';
    this.liveEl.textContent = text;
    this.nextEl.hidden = true;
    if (reduce()) {
      this.textEl.textContent = text;
    } else {
      let out = '';
      for (let i = 0; i < text.length; i++) {
        if (this.skip) {
          out = text;
          this.textEl.textContent = out;
          break;
        }
        const ch = text[i];
        out += ch;
        this.textEl.textContent = out;
        if (ch !== ' ' && i % 2 === 0) play('blip', voice);
        const wait = /[.,!?]/.test(ch) && text[i + 1] === ' ' ? 140 : ch === '…' ? 220 : 26;
        await new Promise((r) => setTimeout(r, wait));
      }
    }
    this.typing = false;
  }

  show() {
    this.open = true;
    this.box.hidden = false;
    this.box.classList.add('is-open');
  }

  close() {
    this.open = false;
    this.box.classList.remove('is-open');
    this.box.hidden = true;
    this.choicesEl.innerHTML = '';
    this.resolveAdvance = null;
    this.resolveChoice = null;
    this.box.dispatchEvent(new CustomEvent('dlg:close'));
  }

  /** Plays the lines in order. Resolves with the chosen id if the last line had choices. */
  async say(lines: Line[], { keepOpen = false } = {}): Promise<string | null> {
    this.show();
    let picked: string | null = null;
    for (const raw of lines) {
      const line = typeof raw === 'string' ? { text: raw } : raw;
      this.choicesEl.innerHTML = '';
      this.choiceButtons = [];
      await this.type(line.text, line.voice ?? 1);
      if (!this.open) return null;

      if (line.choices?.length) {
        picked = await new Promise<string>((resolve) => {
          this.resolveChoice = resolve;
          this.choiceButtons = line.choices!.map((c, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'dlg__choice';
            b.innerHTML = `<span class="soul" aria-hidden="true"></span><span></span>`;
            b.lastElementChild!.textContent = c.label;
            b.addEventListener('pointerenter', () => this.focusChoice(i));
            b.addEventListener('click', () => {
              play('select');
              this.resolveChoice = null;
              resolve(c.id);
            });
            this.choicesEl.append(b);
            return b;
          });
          this.focusChoice(0);
          if (document.activeElement && this.box.contains(document.activeElement)) {
            this.choiceButtons[0].focus();
          }
        });
        this.choicesEl.innerHTML = '';
        continue;
      }

      this.nextEl.hidden = false;
      await new Promise<void>((r) => (this.resolveAdvance = r));
      if (!this.open) return null;
    }
    if (!keepOpen) this.close();
    return picked;
  }
}

/** Inventory, persisted. Items render in the topbar ITEM menu. */
export const inventory = {
  get(): string[] {
    try {
      return JSON.parse(localStorage.getItem('cc.items') ?? '[]');
    } catch {
      return [];
    }
  },
  has(id: string) {
    return this.get().includes(id);
  },
  add(id: string) {
    const items = this.get();
    if (!items.includes(id)) items.push(id);
    localStorage.setItem('cc.items', JSON.stringify(items));
    document.dispatchEvent(new CustomEvent('cc:items'));
  },
};
