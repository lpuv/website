---
name: craftcat.dev
description: The personal site of Luna Puvilland — a warm-lit bench where the machines keep running.
colors:
  espresso: "#211a16"
  espresso-deep: "#1a1411"
  surface: "#2a221d"
  surface-raised: "#332a24"
  hairline: "#40342c"
  hairline-strong: "#5b4c41"
  cream: "#f3ede3"
  cream-dim: "#cbbfb0"
  cream-faint: "#8e8274"
  ember: "#d9814a"
  ember-bright: "#f0a06a"
  ember-ink: "#241d18"
  paper: "#efe9dc"
  paper-shade: "#e4dccb"
  paper-ink: "#241d18"
  paper-dim: "#6b5f52"
  paper-rule: "#cfc4b2"
typography:
  display:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 4.5vw, 4.35rem)"
    fontWeight: 600
    lineHeight: 0.96
    letterSpacing: "-0.042em"
    fontVariation: "'opsz' 64"
  headline:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.2rem, 5.4vw, 4rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.045em"
  title:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 2.6vw, 2.1rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  subtitle:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.3rem, 2.2vw, 1.65rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  prose:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0em"
  lead:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  label:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.68rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.14em"
  data:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.74rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.05em"
  body-sm:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.86rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  title-sm:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  contact-mail:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.1rem, 2.4vw, 1.6rem)"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  paper-name:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.8rem, 4.4vw, 2.6rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  clock:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SFMono-Regular, monospace"
    fontSize: "clamp(1.9rem, 3.6vw, 2.6rem)"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "-0.03em"
  label-sm:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.64rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.1em"
  label-xs:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.6rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.12em"
rounded:
  hairline: "1px"
  base: "2px"
  pill: "50%"
spacing:
  gutter: "clamp(1.3rem, 3.4vw, 3.2rem)"
  wrap: "1360px"
  topbar: "60px"
  hairline: "1px"
  xs: "0.35rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.6rem"
  section: "clamp(2.6rem, 7vh, 4.5rem)"
components:
  button-default:
    backgroundColor: "transparent"
    textColor: "{colors.cream}"
    rounded: "{rounded.base}"
    padding: "0.55rem 1rem"
    height: "40px"
  button-default-hover:
    backgroundColor: "transparent"
    textColor: "{colors.cream}"
  button-primary:
    backgroundColor: "{colors.ember}"
    textColor: "{colors.ember-ink}"
    rounded: "{rounded.base}"
    padding: "0.55rem 1rem"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.ember-bright}"
    textColor: "{colors.ember-ink}"
  work-row:
    backgroundColor: "transparent"
    textColor: "{colors.cream}"
    rounded: "0px"
    padding: "1rem 0.2rem"
  work-row-hover:
    backgroundColor: "{colors.espresso-deep}"
    textColor: "{colors.cream}"
  tag:
    backgroundColor: "transparent"
    textColor: "{colors.cream-dim}"
    rounded: "{rounded.base}"
    padding: "0.14rem 0.4rem"
  field:
    backgroundColor: "{colors.espresso}"
    textColor: "{colors.cream}"
    rounded: "{rounded.base}"
    padding: "0.6rem 0.7rem"
  panel:
    backgroundColor: "{colors.espresso}"
    textColor: "{colors.cream}"
    rounded: "0px"
    padding: "1.1rem 1.2rem"
  paper:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-ink}"
    rounded: "{rounded.base}"
    padding: "clamp(1.6rem, 5vw, 3.6rem)"
---

# Design System: craftcat.dev

## Overview

**Creative North Star: "The Bench"**

A warm-lit workbench. Everything on it is a real object with a state you can see: a machine that is running, a package that shipped, a virus currently swimming between two hosts. The light is low and warm, the surfaces are matte, and nothing glows for decoration. You are allowed to pick anything up.

The atmosphere is **serious about the work, unserious about itself**. The craft is deadpan — hairlines, tabular figures, honest labels — and the wink lives entirely in the content: a record that opens "the repository description calls it 'really stupid,' which is accurate and also the design brief," or a tank of unpatched VMs modelled on xkcd 350 where you can watch `w32.welchia` take a host and get wiped by the monitor. The chrome never jokes.

The palette is the whole idea. Espresso is a warm near-black — brown, not grey — so the room reads as lit rather than switched off. Cream carries every word. Ember is the only saturated thing on the page and it always means *live*: the primary action, an infected host, the current nav item, a running readout. There is no second accent and no glow.

**Key Characteristics:**
- Warm espresso ground; cream text; one burnt-orange signal that only ever means "live".
- Bricolage Grotesque speaks, JetBrains Mono measures. The division is absolute.
- Hairlines and 1px gaps do the separating. No shadows except one physical drop under the resume sheet.
- 2px corners — machined, not soft.
- Motion exists only where something is genuinely happening.
- The hero is a live thing with two depths, not a picture of one.

## Colors

A warm near-black room, warm cream type, and one ember that is never decorative.

### Primary
- **Ember** (#d9814a): the signal. Primary buttons, the active nav underline, an infected host, the live readout rule, the focus ring, the current status value. If something is ember, something is happening.
- **Ember Bright** (#f0a06a): ember under the pointer. Used only as the primary button's hover fill.
- **Ember Ink** (#241d18): the near-black used as *text on* ember. Never a background.

### Neutral
- **Espresso** (#211a16): the page ground. Warm brown-black, never neutral grey.
- **Espresso Deep** (#1a1411): insets and row hover — one step *into* the surface rather than out of it.
- **Surface** (#2a221d) and **Surface Raised** (#332a24): panels and fields that need to sit slightly forward.
- **Hairline** (#40342c): every border, every grid gap, every table rule.
- **Hairline Strong** (#5b4c41): a border that must be seen without becoming a colour — ghost button outlines, the tank's network links.
- **Cream** (#f3ede3): headings, body, readout values.
- **Cream Dim** (#cbbfb0): prose, descriptions, nav at rest.
- **Cream Faint** (#8e8274): labels, metadata, timestamps, anything that is furniture.

### Paper
- **Paper** (#efe9dc): the resume sheet. The one light object in the room.
- **Paper Shade** (#e4dccb): rules and inset blocks on the sheet.
- **Paper Ink** (#241d18): text on paper.
- **Paper Dim** (#6b5f52): resume metadata and section labels.
- **Paper Rule** (#cfc4b2): resume dividers and link underlines.

### Named Rules
**The One Ember Rule.** Ember is a state, not a brand colour. It appears where something is live, active, infected, or actionable — and nowhere else. A screen where ember is the dominant impression has failed.

**The Warm Neutral Rule.** No neutral is a true grey. Every one is a brown-shifted ink or a warm cream. A `#888` reads as a bug against this ground.

**The Paper Is An Object Rule.** Paper is not a light theme. It is one physical sheet — the resume — that exists inside the warm room. Never use paper tones for a card, a panel, or an empty state.

## Typography

**Display Font:** Bricolage Grotesque Variable (with ui-sans-serif, system-ui fallbacks)
**Body Font:** Bricolage Grotesque Variable (same family, lower optical size)
**Label/Mono Font:** JetBrains Mono Variable (with ui-monospace, SFMono-Regular fallbacks)

**Character:** One variable grotesque does all the speaking and one mono does all the measuring. The pairing is a division of labour, not a contrast play: a sentence someone wrote is Bricolage; a label, value, timestamp, or piece of chrome is JetBrains Mono in uppercase at wide tracking. Display sizes lean on Bricolage's optical-size axis (`'opsz' 64`) for tight, high-contrast letterforms a static grotesque can't reach.

### Hierarchy
- **Display** (600, `clamp(2.5rem, 4.5vw, 4.35rem)`, 0.96): the hero statement only. Tracking `-0.042em`.
- **Headline** (600, `clamp(2.2rem, 5.4vw, 4rem)`, 0.98): page titles on `/systems`, `/log`, `/resume`, `/contact`, `/tank`.
- **Title** (600, `clamp(1.5rem, 2.6vw, 2.1rem)`, 1.05): section headings.
- **Subtitle** (600, `clamp(1.3rem, 2.2vw, 1.65rem)`, 1.2): prose h2 and record headings.
- **Body** (400, 1rem, 1.55): the document default.
- **Prose** (400, 1rem, 1.7, 68ch): long-form reading on record and log pages.
- **Lead** (400, 1.1rem, 1.55): the hero lede and page subtitles.
- **Label** (400, 0.68rem, 0.14em, uppercase): eyebrows, nav, spec tables.
- **Data** (400, 0.74rem, 0.05em): readouts, table cells, inline code.
- **Body SM** (400, 0.86rem, 1.5): work-row descriptions, footer prose, small supporting copy.
- **Title SM** (600, 1.2rem, 1.2): the hero readout's label, panel leads, the tank header.
- **Clock** (300, `clamp(1.9rem, 3.6vw, 2.6rem)`, 1): the Montréal time readout. Mono, tabular, light weight so it reads as a measurement rather than a headline.
- **Contact Mail** (400, `clamp(1.1rem, 2.4vw, 1.6rem)`): the email address on `/contact`, sized to be the obvious action on the page.
- **Paper Name** (600, `clamp(1.8rem, 4.4vw, 2.6rem)`, 0.98): the name at the top of the resume sheet, tracking `-0.04em`.
- **Label SM / XS** (0.64rem / 0.6rem): chips, tags, panel heads, the smallest chrome.

### Named Rules
**The Sentence Rule.** If a human wrote it as a sentence, it is Bricolage. If a machine reports it, it is JetBrains Mono. Mixing them breaks the illusion that the site is an instrument.

**The Tracking Rule.** Mono labels are never set at normal tracking. Uppercase mono needs 0.06em minimum and 0.14em for eyebrows; below that it reads as cramped rather than measured.

## Layout

A single 1360px container inset by a fluid gutter of `clamp(1.3rem, 3.4vw, 3.2rem)`. No sidebar, no multi-column marketing grid.

The hero is **asymmetric and deliberate**: a 0.40fr text column hard-left, a 0.60fr stage that bleeds past the right edge with `margin-right: calc(-1 * var(--gutter))`. A 22px dot grid sits under it, masked to fade out behind the text, so the map has a surface to sit on rather than floating in void.

The work list is a **list, not cards**: a four-column row of index, name, description, status, closed by a hairline, with the whole row as the link. Hovering indents it 0.7rem and darkens the ground.

Section rhythm is `clamp(2.6rem, 7vh, 4.5rem)` of vertical padding between hairline rules. Page heads use their own tighter rhythm and close with a hairline.

Content pages use a two-column record layout: a fluid prose column plus a 250px sticky spec table, ordered second visually but first in the DOM on mobile. Collapses to one column at 980px.

Breakpoints are pragmatic: 1100, 980, 820, 760, 720, 460. The load-bearing ones are **980px** (hero stacks, work rows drop their description), **820px** (console and channels stack), and **720px** (nav compresses).

## Elevation & Depth

**Flat by default.** Panels do not float. Separation comes from a 1px hairline or a 1px grid gap, never from a shadow. There is exactly one shadow in the system:

- **Paper drop** (`box-shadow: 0 24px 60px -30px #000`): the resume sheet. It is a physical page lying on the bench, and this is the only place depth is literal.

There are **no glows**. The previous world used phosphor bloom on status dots and button hovers; that is gone. Liveness is now carried by ember *colour* and by motion, not by light spill.

### Named Rules
**The Flat-By-Default Rule.** If you reach for a shadow to separate two things, use a hairline instead. The only legitimate shadow is the one under the resume sheet.

**The No Glow Rule.** Ember does not bloom. A coloured halo is decoration, and this system does not decorate. State is carried by colour, position, and motion.

**Print is not a theme.** The `@media print` block deliberately drops to `#fff` and `#000` at 10.5pt, strips every chrome element, and removes the paper shadow. Those values are outside the palette on purpose.

## Shapes

Corners are **2px** (`--radius`) on buttons, fields, panels, and the paper sheet, and **1px** on focus rings. That is below the threshold where a corner reads as "rounded" — the intent is a machined edge, not a soft one.

Borders are always **1px** and always a hairline tone. The one exception is the resume header's **2px solid ink rule**, which signals that the sheet is a different kind of object.

The recurring motifs are the **dot** (4–9px, circular, ember when live) and the **hairline rule**. The map's nodes are dots with labels set *beside* them — a map pin, not a bubble. Icons are 1.2–1.6px-stroke line art, never filled.

## Components

Every component should feel **tactile and confident**: a switch you can throw, a field you can type into, a plate you can read.

### Buttons
- **Shape:** 2px radius, 1px border, 40px minimum height, `0.55rem 1rem` padding. Uppercase mono at 0.71rem with 0.05em tracking.
- **Default (ghost):** transparent fill, cream text, hairline-strong border. This is the base state, not a variant.
- **Primary:** solid ember with ember-ink text. Once per view at most.
- **Hover:** ghost buttons shift their border to cream and lift 1px; primary buttons brighten to ember-bright. Both `0.16s` on `--ease`. No glow on either.
- **Arrow affordance:** a `→` or `↗` in a `.btn__arrow` span that translates 3px on hover.

### Work rows
The homepage's project list. A `<a>` styled as a four-column grid: index (mono, faint), name (600, 1.05rem), description (0.86rem, cream-dim), status (mono, right-aligned, faint). Closed by a hairline; the list is opened by a 1px cream rule. Hover indents the row and darkens the ground to espresso-deep. Below 980px the description column drops.

### Tags
2px radius, 1px hairline border, transparent fill, cream-dim at 0.64rem uppercase mono. Never interactive.

### Panels
The telemetry console's cells. `1.1rem 1.2rem` padding, minimum height 200px, with a `panel__head` bar holding a mono label left and an ember status value right, closed by a hairline. The status turns cream-dim when `data-state="offline"`. This head/value pattern is the canonical way to frame any readout.

### Inputs / Fields
- **Style:** 2px radius, 1px hairline border, espresso fill (darker than the surrounding panel, so the field reads as cut into it), `0.6rem 0.7rem` padding, mono at 0.74rem.
- **Label:** a mono uppercase 0.6rem label at 0.12em tracking sits above the field. Labels are never placeholders.
- **Focus:** border shifts to ember plus a 1px ember outline at 1px offset. No glow.

### Navigation
- **Topbar:** 60px tall, sticky, solid espresso (no backdrop blur), closed by a 1px hairline.
- **Links:** uppercase mono at 0.71rem with 0.06em tracking, cream-dim at rest. A 1px ember underline scales in from the left on hover; the current page keeps it at full width and takes ember text.
- **Brand:** a 20px line-art cat mark in ember, plus `craftcat/dev`.
- **Mobile:** status pill hides below 720px, `/dev` suffix hides below 720px, the fourth nav item hides below 460px.

### Signature Component: The Hero Stage
The hero is a canvas with **two depths**, switched by a two-word control on the stage itself (or the `T` key). It is the system's thesis, and it imposes three rules:

1. **The map is the default.** You arrive on the machines — five projects around `pinwheel`, labelled, draggable, with spring physics. Nothing is simulated until you ask.
2. **The tank is opt-in and self-explaining.** Switching to it shows a header that names what you are looking at ("Twelve VMs, no patches"), a legend for the three host states, and an event log that narrates each infection and wipe with a timestamp. Hovering any host explains its state in a sentence. A simulation nobody can read is not finished.
3. **The simulation must never die.** The tank re-seeds itself if it ever goes quiet, and caps infections at four so it reads as an aquarium rather than a wipeout.

### Signature Component: The Spec Table
Content pages carry a sticky 250px spec table: mono at 0.69rem, a 38% label column in cream-faint uppercase at 0.61rem, values in cream-dim, every row closed by a hairline. Links inside it are ember. This is the canonical "metadata about a thing" component.

### Signature Component: The Paper
The resume is the one warm light surface. Paper ground, paper-ink text, `clamp(1.6rem, 5vw, 3.6rem)` padding, 860px max width, and the single physical drop shadow. Its header closes with a 2px solid ink rule — the only 2px border in the system. It has a full `@media print` override that strips to white, black, and 10.5pt.

## Do's and Don'ts

### Do:
- **Do** separate surfaces with a 1px hairline or a 1px gap before reaching for any shadow.
- **Do** set every label, readout, timestamp, and piece of chrome in uppercase JetBrains Mono with 0.06em+ tracking.
- **Do** keep ember for things that are live, active, or infected — and nowhere else.
- **Do** use `font-variant-numeric: tabular-nums` on anything that counts, ticks, or updates.
- **Do** make the canvas keyboard-reachable, with a real focus ring, arrow-key cycling, and a screen-reader list of every machine.
- **Do** honour `prefers-reduced-motion` — the map settles instantly and draws once rather than looping.
- **Do** label simulated data as simulated, in the readout itself.
- **Do** keep the wink in the copy, not in the chrome.

### Don't:
- **Don't** build generic dark-mode SaaS: no glassmorphic gradient cards, no purple-to-blue hero, no rounded-everything floating dashboard, no decorative gradient text.
- **Don't** build costume hacker: no Matrix rain, no green-on-black monospace for prose, no fake terminal typing effects.
- **Don't** add a glow. Ember does not bloom.
- **Don't** use the paper palette outside the resume. It is one object, not a light theme.
- **Don't** use a true grey neutral. Every neutral is brown-shifted ink or warm cream.
- **Don't** introduce a second accent hue. Ember is the complete vocabulary; a new colour has to displace it.
- **Don't** set prose in mono or labels in Bricolage. The division of labour is the system.
- **Don't** add a label above a heading that repeats what the heading says. A mono eyebrow is only earned when it carries data the heading cannot.
- **Don't** let any single element become the reason someone remembers the page. The work is the reason.
