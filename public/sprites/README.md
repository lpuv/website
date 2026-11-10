# Sprites

The site draws placeholder pixel art in code (`src/scripts/sprites.ts`). To use real art,
drop PNGs here and list them in `manifest.json`:

```json
{ "tree": "tree.png", "player": "player.png" }
```

- `tree`: bottom-centre of the image sits on the trunk base. The top 75% sways in the wind.
  Roughly 96×112 px reads well; the room is 180 px tall.
- `player`: one frame, bottom-centre on the feet. Around 12–20 px tall. It is flipped for left.

Draw at 1× (one image pixel = one room pixel). The canvas is upscaled with nearest-neighbour.
If you use fan art, get the artist's permission and credit them in the footer.
