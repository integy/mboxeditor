# mboxeditor v3

Browser-only multi-miniature editor: local Three.js, JSCAD CSG, binary STL and ZIP/BOM export. Exactly **body + lid per unit**, no separate keys, pins or hardware. Mechanical geometry independently developed; earlier Gemini consultation concerned only general software architecture (`docs/gemini-design.txt`).

## Run

```sh
npm install
npm test
npm run build
npm run dev
npm run test:browser
```

Chrome tests use installed macOS Chrome and localhost:4173. `dist/.git` is a separate gh-pages repository, preserved by build. Build/test does not publish.

## Capacity and print limits

Enter full model W/D/H including weapons. Quantity is models; models/unit is target capacity. Columns 0=auto; rows and overflow units are automatic. Partial units shrink. Minimum spacing 2 mm, wall/floor 2.4 mm, independent height model H+8.4 (minimum26). Optional shallow square base pockets organize, not immobilize. Low integral ribs separate envelopes. No scaling. Maximum40 units, 200 models/type.

Shell W/D are rounded UP to `16n−8`, n≥2, so all edge port datums align. A single32 mm miniature has40×40 shell and51.8×51.8 actual body including protrusions (under60); smallest shell24×24, two ports/edge. Default five32 mm models occupy104×72 shell. Every part is checked against250×250×250 INCLUDING all integral features; oversized models are rejected, not scaled. Current maximum shell232 mm; maximum model W/D227.2 before capacity rounding. Height allowance includes seats/keys. Overall assembly may exceed250.

## Standardized integral interfaces

```
                        BACK (+Y): male ports
                       ┌──────────────────┐
 LEFT (−X): female ←   │        BODY      │   → RIGHT (+X): male
                       └──────────────────┘
                        FRONT (−Y): female ports

 Z: upper floor + pyramid recesses
              ↓ four aligned corners
    lower wall-top seats + integral pyramid keys
    lid has four clearance notches (not the stack load path)
```

XY port pitch16 mm; tangential centres `4+16k`, k=0…n−1. Shell dimensions+8 are exact pitch multiples. Each of all four edges has n≥2 ports; aligned different-size edges engage **min(nA,nB)** ports. Neighbour origins X=W+8 or Y=D+8. No alternating rotations: front/left female, back/right male. This is keyed, not fully arbitrary adjacency.

Male Z0…7, neck2.8 mm wide, trapezoid head5.6 mm wide, protrusion4 mm. Female Z0…8, housing protrudes7.8 mm and is8 mm wide, channel open THROUGH Z; profile expanded by c=0.15…0.60 mm in axial/tangential directions. Shell-to-shell gap8 mm leaves0.2 mm housing-to-opposite-wall clearance. No ceiling, bridge or closed socket roof. Female geometry is unioned into the body, not separate hardware.

Lower a male-bearing unit into the neighbour's open channel **before fitting lids**. Rigid lower/raise path is sampled in CAD for both X/Y and simultaneous two-neighbour corners. Trapezoids capture horizontal separation; channels have **no vertical floor stop or lock**. All units must rest on a common flat supporting surface.

### Up/down stack

Four2.4×2.4 wall-top corner seats extend toH+3.4; the upper floor sits there,0.7 mm above lower lid roof. Each seat carries an integral square pyramid,1 mm base width,0.55 mm tall (47.7° slope). The upper underside has matching upward-closing pyramid recesses expanded by c, bottom datum−0.01. Corner coordinates(1.2,1.2), (W−1.2,1.2), (1.2,D−1.2), (W−1.2,D−1.2). This locates XY, **does not latch Z**. Seat areas outside recesses carry weight directly into aligned body walls, not a hollow lid roof or thin lid cantilever.

Stack pitchH+3.4. Same-footprint stacking only. Viewer additionally requires identical heights to avoid pretending mixed-height layers have a common bearing plane. No vertical capture; never lift the kit by its upper unit. Physical fit, friction and stack stability require printing.

### Lid retained

Lift-on roof with broad manually spread front/back skirts, up to32 mm wide and1.6 mm thick,14 mm drop. The main shape and thumb-spread interaction remain; only45° triangular hook/receiving-pocket roofs and four corner pass-through notches replace unsupported ceilings. Plate H+0.3…H+2.7, inner locating lips remain. Spread BOTH skirts about1.5 mm, lower/lift, then release. Do not force an unflexed lid. Rigid released paths tested; elastic forces, stress, fatigue and automatic snap-in are NOT established.

## Print WITHOUT support material — geometry target, not physical certification

- Body exports base down. Lid exports automatically **top-face DOWN** (180° X rotation then bed rebase). Do not reverse this orientation.
- Body XY channels open through their complete height. Hook and wall pocket roofs45°; underside stack recesses47.7°; no intentional bridge allowance. All other downward surfaces lie on the bed in nominated orientation.
- Tests inspect actual print-oriented triangles across minimum/multi/max envelopes and c=.15/.30/.60: no elevated downward-facing surface steeper than45° overhang. The only exemption is actual bed contact, not a feature-name ignore list; normal comparison includes a small numerical tolerance for JSCAD snapping.
- PETG,0.4 nozzle,0.2 mm layers are starting suggestions. Slicer preview and a **full body/lid calibration pair** are required before batching. No physical printer was run; adhesion, cooling, dimensional fit and unsupported-layer quality remain unvalidated. If your slicer requires support, do not quietly print with it and call this validated.

## Preview / exports

Row demonstrates X, grid columns demonstrate X/Y, stack layers demonstrate Z. Ghosts and both part instances use real XYZ poses. Grid has fixed common column origins and row origins on16 mm lattice. Mixed footprints may leave gaps: **only `settings.json → joints` entries are actually engaged**, not every visual neighbour. Do not claim a gap is joined. Stack mode rejects unequal footprint/height rather than showing unsupported boxes.

ZIP contains unique body/lid STLs with BOM quantities, BOM CSV/JSON, complete posed settings and assembly instructions. No calibration hardware or small loose connector files. STL normals are populated.

## Verification and limitations

`npm test`: exact quantities, compact/overflow units, envelope clearance, true exported STL closure/opposite edge winding/single connected component/positive volume/bounds, rigid final collisions, X/Y capture and lower-in paths including grid corner, four-key stack clearance/seat-stop/lateral capture, lid released path, print-oriented slope audit at .15/.30/.60. This is geometric verification, not physical strength certification.

`npm run test:browser`: actual local Chrome desktop/mobile, ghost counts, editing, persistence, grid Y poses, stack Z poses, incompatible-stack rejection, actual downloaded ZIP/BOM/STL audit, oversize rejection and page errors. Artifacts in ignored `test-results/`.

**Unprinted prototype.** No load rating, no inversion/shock safety, no validated handle. Carry upright with **two hands supporting ALL bases**. Never lift by lid, upper unit, end unit or connector. Low ribs/pockets do not clamp fragile miniatures. Creep, layer adhesion, skirt fatigue and thermal performance untested.
