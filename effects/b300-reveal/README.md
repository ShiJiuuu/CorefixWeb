# B300 server reveal

A procedural 3D Remotion composition based only on the supplied
`SuperServer SYS-822GS-NB3RT User's Manual`.

## Timing

- 1920 x 1080 at 60 fps
- 300 frames / 5 seconds total
- Frames 0-24: black hold
- Frames 25-100: light trace around the projected server outline
- Frames 90-130: server fade-in
- Frames 112-168: shell unlatch beat, then a staggered outward burst
- Frames 146-290: exposed internal modules separate in sequence and settle
- Frames 291-299: final module layout hold
- No rotation sequence

The enclosure sections unlatch, tumble outward around their own pivots and
recede beyond the camera bounds, leaving only the internal hardware modules of
`8x` GPU baseboard, control board, network, storage, cooling and power
assemblies. There are no overlay titles, labels or perimeter annotations.

The composition uses a static neutral reflection environment and physically
based metallic materials with clear coat and anisotropic response. Animated
lights, flashes, glow layers, shadows, vignettes and ring effects are omitted.
Internal geometry includes GPU connectors and capacitors, CPU retention
hardware, DIMM clips, PCB traces, mounting screws, fan fasteners, OSFP cages,
drive handles and detailed PSU vents. Individual GPU, fan, network, storage and
power modules use deterministic asymmetric offsets and small rotations to keep
the exploded arrangement organic without losing the readable hardware grouping.
The complete assembly is positioned toward frame right so the left third stays
clear for website copy. The internal module bodies are scaled to 0.64 of the
shell (a further 20% reduction from the previous 0.8 layout) while their
separation distances are compensated so the exploded layout stays readable; the
shell retains its original outline for the opening light trace.

The burst uses a short unlatch phase followed by an accelerating outward
release. Every panel has its own delay, pivot-based tumble, receding scale and
late opacity fade, so the large faces do not slide across frame like flat cards
or linger at the edges. Deterministic debris is emitted from the shell faces,
accelerates outward with drag and fades before the internal modules finish
settling.

## Preview

```bash
npm run dev
```

Open the `B300Reveal` composition in Remotion Studio.

## Validation

```bash
npm run lint
```

Extracted specifications and source page references are documented in
`B300_SOURCE_NOTES.md`.
