# Sounds

Everything has a synthesized fallback (`src/scripts/sfx.ts`). To use real files, drop them
here and list them in `manifest.json`:

```json
{ "blip": "blip.wav", "move": "move.wav", "select": "select.wav", "item": "item.wav", "save": "save.wav", "ambient": "ambient.ogg" }
```

`ambient` loops quietly while the visitor is talking to the tree. Sound is off by default.
