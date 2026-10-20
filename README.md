# mboxeditor v2

Browser-only multi-miniature unit editor with local Three.js and real JSCAD CSG binary STL/ZIP export. No server, CDN, purchased hardware or loose small parts.

## Run and verify

```
npm install
npm run build
npm test
npm run dev
npm run test:browser
```

Browser tests use real installed macOS Chrome on localhost:4173. `dist/` contains a separate deployment git repository: build preserves it. No deploy is performed by tests/build. Parent workflow handles publishing.

## Model counts and adaptive units

Enter complete model W/D/H including weapons, not just base diameter. **Models** is total quantity for that type. **Models/unit** is target capacity; **columns** is requested layout (0=auto); rows are automatic. Over-capacity layouts split into extra units while preserving exact model count. Final partial units shrink their grid. Individual heights are model H+8.4 (minimum 26), not shared across types. Current limit 40 units / 200 models per type keeps browser CSG manageable.

Default five 32×32×48 models occupy one 104.8×70.8×56.4 body shell (actual body width 113.8 including both integral interfaces). A single 32 mm model uses a 36.8×36.8 shell; actual body width 45.8. XY dimensions adapt exactly, no 100 mm minimum. Walls/floor 2.4 mm; low compartment ribs 0.8 mm wide, 2 mm above floor; minimum 2 mm model spacing. Optional **base** is separate measured square base width (0 disables); shallow 0.6 mm floor pockets are organizational, not restraint. Full envelope ghosts remain conservative at nominal floor height. No scaling. Every individual body/lid includes protrusions in its ≤250 mm XYZ bounds; connected row may exceed that.

## Exactly two large parts per unit

- Body: single CSG-unioned shell, compartment ribs, integral male dovetail and female open-top channel.
- Lid: one CSG-unioned plate with two broad cantilever skirts/hooks and inner locating lips.

No separate pins, keys, bridges or hardware. BOM contains only `body` and `lid`. ZIP includes unique STL files with quantities, BOM CSV/JSON, settings and assembly instructions.

## Mechanical geometry and assembly

Coordinates X left→right, Y front→back, Z up. Arrange units front-aligned at next origin = previous X + previous shell W + 5.

Dovetail male begins at shell right wall and extends 4 mm; profile Y9…15 at neck and Y6…18 at head. Female housing extends 5 mm left and is 18 mm deep Y3…21, 18 mm tall. Female floor datum Z3, male bottom Z3+c, top Z17. Channel is offset outward by adjustable per-face c=.15… .60. Trapezoid head mechanically captures lateral separation; floor blocks downward travel. Interface independent of body height. **Lift the LEFT/male body above the RIGHT/female body's channel and lower vertically**, before fitting lids. Channel is open above Z18. No vertical connector lock: do not lift the row by an end unit.

Lid is **lift-on**, not the old sliding design. Plate sits H+.3 to H+2.7. Front/back skirts extend down 14 mm, each up to 32 mm wide and 1.6 mm thick, joined to roof with overlap. Inward 0.8 mm hooks engage shallow outer-wall pockets at H−9.5; there is actual vertical capture and no final-pose collision. Inner lips locate laterally; they are NOT capture rails. Spread both broad skirts outward about 1.5 mm with thumbs while lowering/lifting and release only when seated. There is no lead-in ramp, so **do not force an unflexed lid down** or claim automatic snap insertion.

Print bodies base-down; lids top-face down (rotate 180° in slicer; exports rebase coordinates only). Suggested starting point PETG, 0.4 nozzle, 0.2 layers. Inspect overhangs/supports at sockets and hooks, calibrate one pair before batching. Physical thumb force, elastic strain, print fit, fatigue, layer strength and creep are **unvalidated**. CAD rigid-component paths do not establish elastic performance.

## Safety

Prototype, not load-rated or physically print-tested. Carry upright with **two hands supporting ALL bases**. No handle; never lift by end unit, lid or connector. Not inversion/shock-safe. Low ribs and optional pockets do not clamp or prevent model bounce. Fragile miniatures require separate physical restraint validation. Avoid hot cars.

## Verification

`npm test` parses actual exported binary STLs, audits opposite directed edge pairs, finite coordinates, positive volume and ≤250 bounds. It checks minimum/maximum/multi-model cases, exact partial quantities, independent heights, complete envelope clearance from walls/ribs/lids, final assembly collisions, positive lateral capture, integral floor stop, sampled vertical insertion and released-lid paths at .15/.30/.60 clearance. Topology is not structural certification.

`npm run test:browser` exercises real Chrome UI, per-unit settings, multiple ghosts, persistence, add/remove, rejection, actual ZIP download and mesh audit, zero small-part BOM, desktop/mobile layout and page errors. Artifacts saved in ignored `test-results/`.

## Source

`src/mechanics.mjs`: planning and mechanics. `src/engine.mjs`: mesh/ZIP export. `src/app.mjs`: editor/preview. `tests/`: CAD/topology/browser checks. `scripts/build.mjs`: esbuild and local server.

Design provenance: `docs/gemini-design.txt` records earlier consultation about general architecture. Current mechanical dimensions are independently engineered; no Gemini mechanical validation is claimed.
