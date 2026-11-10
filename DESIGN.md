# craftcat.dev design

Luna Puvilland's portfolio. A small homage to DELTARUNE's Forgotten Man rooms, built on top of a
portfolio that a recruiter can scan in thirty seconds without playing anything.

## Principles

- **Portfolio first, game second.** Name, pitch, buttons, and plain links are always visible. The
  room is optional; everything the man says is also written on the page.
- **Recognisable, not a costume.** The DELTARUNE references are the room, the man, his egg, the
  dialogue box, and the heart cursor. Everything else is a normal, quiet site in the same visual
  language. Inner pages use plain labels, not game jokes.
- **Real content only.** No invented roles, testimonials, or stats.
- **Fast and accessible.** Static Astro, no trackers, sound off by default, reduced motion honoured,
  keyboard and screen-reader paths for every interaction.

## Visual language

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#000` | Every page. Rooms are black voids. |
| `--ink` | `#fff` | Text, box borders. |
| `--ink-2` / `--dim` | `#c9c6d6` / `#8b879c` | Body copy / labels. |
| `--sel` | `#ffd800` | Selected, hovered, current. The menu yellow. |
| `--soul` | `#ff1f3d` | The heart cursor only. |
| Floor | `#5f3166` | The room's purple plateau. |

- **Type:** Pixelify Sans for headings, menus, dialogue, and labels. JetBrains Mono for body copy
  and data. Ligatures are off (Pixelify mangles "fi").
- **The box:** black fill, 3px white border. Dialogue, menus, cards, the save file. The About box
  doubles it (border plus inset outline), after DELTARUNE's POWER screen.
- **The soul:** a pixel heart drawn with `clip-path`, shown on hover/focus/selection next to menu
  items. `.soul--static` keeps it visible (section titles, brand).
- **Motion:** stepped (`steps()`), short, never decorative on its own. All of it collapses under
  `prefers-reduced-motion`.

## Home page

1. **Header:** kicker, name, one-line pitch.
2. **The room.** One of two scenes, picked before first paint by an inline script in `index.astro`:
   - **The workbench** (`src/scripts/workbench.ts`), the normal homepage. A side-on room of real
     things, each checkable with a line of dry narration and a link to its record: the pinwheel
     server and a floating T-piece (evil-tetris) on the shelf; a laptop with a Fedora sticker and
     the red TMS570 board on the desk; two cat pictures (one cat, then two: the Cat Pictures
     TryHackMe rooms); a Clocktower grimoire and a packed-up `k8s` box on the floor. The window
     shows Montréal's actual sky for the hour, and a tiny red tree on a far hill.
     Clicking walks the cat there (grid pathfinding around the furniture), then checks.
   - **The tree room** (`src/scripts/room.ts`), the secret. Never on a first visit. On later
     visits there's a 1 in 20 chance (`cc.visited`). Checking the window guarantees it on the next
     visit (`cc.far`, cleared once used), and `?room=tree` / `?room=bench` force a scene.
   - Walk with WASD/arrows or click. Z/Enter checks, X skips text. Leaving through the bottom
     scrolls to the work. Anti-slop rule for the workbench: only real objects with real names,
     flat side-on drawing, no props that are there to look cosy or "hacker".
   - Hints for people who dig: an HTML comment by the stage, a `--note` custom property in the
     CSS (comments get minified out), and a console message.
3. **About:** POWER-menu box. Portrait, name, class, stats, skills, one-line description.
4. **Work:** two-pane item menu (list + detail). Collapses to a list with inline summaries on phones.
5. **Notes:** latest log posts as bordered signs.
6. **Say hello:** save-point star and a save-file box with contact links.
7. **Footer:** the Hollow Knight bench (back to top), links, music credit, and the disclaimer.

## The man

His voice follows his Chapter 3 dialogue: ALL CAPS (set at 0.9em so it reads as voice, not
shouting), a little formal, warm, slightly hazy about memory, and fond of opinions ("I LIKE YOU!").
Narration is in parentheses, starting with an asterisk: "(Well, there is a man here.)"

- The menu comes first: Her work / Who's Luna? / Anything for me? / Short version / Bye.
- **The EGG** is the resume. Taking it adds it to the ITEM menu in the header (persisted in
  `localStorage` as `cc.items`).
- After giving the egg and saying goodbye he is gone until reload: "(Well, there is not a man here.)"
- Visit count is stored as `cc.talks` and changes his greeting.

Dialogue engine: `src/scripts/dialogue.ts`. Lines starting with `* ` get a hanging asterisk; lines
with a voice below 1 are the man's.

## The secret (spoilers)

FRIEND stands in the dark to the right of the path, drawn at about 6% opacity and only a little
clearer up close. The dark around it has an invisible floor. Walk to FRIEND and the room drops into
an empty void where Gaster speaks, in the style of the Chapter 1 intro.

- His lines type out in Wingdings (letters mapped to the Unicode symbols Wingdings draws, rendered
  as flat white silhouettes so emoji don't show in colour), with the English translation laid over
  them. Screen readers get the English. He types slowly, with a quiet blip from his voice file every third letter; the music stops.
  His lines stay vague: experiments, things that shouldn't be opened, no project names.
- He ends with "NOW. YOU MUST CREATE A VESSEL." Create goes to the contact form; Refuse returns you
  to the tree, and FRIEND is gone until reload.

## Inner pages

- `/systems/` work records with status filters; `/systems/[slug]/` record with a details box.
- `/log/` and `/log/[slug]/` notes.
- `/contact/` "Name the person writing." form that opens the visitor's mail client.
- `/resume/` stays paper: light, printable, Pixelify only for headings.
- `/404` a stump where the tree used to be.

## Assets

Placeholder art is drawn in code (`src/scripts/sprites.ts`); the tree follows the secret-room tree:
flat rounded leaf strokes leaning right, magenta in the shadows, a slanted navy trunk thick enough to
hide behind. Real files override it:

- `public/sprites/manifest.json` → `tree`, `player`, `friend` (FRIEND appears only if this is set)
- `public/sounds/manifest.json` → `music` (looped), `gaster` (voice blips), plus optional effects (`blip`, `move`, `select`,
  `item`, `save`)

## Credits

- Tree room music: the Egg Room theme from DELTARUNE Chapter 5, a piano arrangement of Toby Fox's
  "Scarlet Forest" by Trevor Alan Gomes, creator of the *DELTARUNE Piano Collections*.
- DELTARUNE and its characters, names, and music are © Toby Fox. This is an unofficial fan homage,
  not affiliated with or endorsed by Toby Fox, Fangamer, or Materia Collective.
