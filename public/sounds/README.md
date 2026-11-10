# Sounds

List files in `manifest.json`:

```json
{ "music": "egg.mp3", "gaster": "wdgaster.mp3", "blip": "blip.wav", "move": "move.wav", "select": "select.wav", "item": "item.wav", "save": "save.wav" }
```

- `music` loops while the tree room is on screen and sound is on, fading in and out. Without it, a
  quiet synthesized drone plays instead.
- `gaster` is a strip of voice blips. It's split at the silences when it loads, and one random
  blip plays every third letter of Gaster's lines, very quietly (gain 0.06). No synth fallback.
- Effects are optional; anything missing uses a synthesized fallback.

Sound is off by default. If you add or change music, update the credit in the footer
(`src/layouts/Base.astro`) and in `DESIGN.md`.

`egg.mp3`: the Egg Room theme from DELTARUNE Chapter 5, a piano arrangement of Toby Fox's
"Scarlet Forest" by Trevor Alan Gomes, creator of the *DELTARUNE Piano Collections*.
