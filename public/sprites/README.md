# Sprites

The site draws placeholder pixel art in code (`src/scripts/sprites.ts`). To use real art,
drop PNGs here and list them in `manifest.json`:

```json
{ "tree": "tree.png", "player": "player.png", "friend": "FRIENDInsideMeERAM.webp" }
```

- `tree`: bottom-centre of the image sits on the trunk base. The top 75% sways in the wind.
  Roughly 96×112 px reads well; the room is 180 px tall.
- `friend`: drawn at 25×23 room pixels, nearly invisible in the dark beside the path. Walking
  to it opens the secret. Remove it from the manifest and the secret goes with it.
- `player`: one frame, bottom-centre on the feet. Around 12–20 px tall. It is flipped for left.

Draw at 1× (one image pixel = one room pixel). The canvas is upscaled with nearest-neighbour.
If you use fan art, get the artist's permission and credit them in the footer.
