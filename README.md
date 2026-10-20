# mboxeditor v4 — recessed interlocking seams

Browser-only multi-miniature editor: Three.js, JSCAD CSG, STL and ZIP/BOM. Exactly **body + lid per unit**, no pins, keys or loose hardware. Multi-model capacity, per-type heights, optional base pockets, ribs and complete model envelopes remain. Gemini provenance is restricted to the software architecture (`docs/gemini-design.txt`); mechanics are independently developed.

## Run

```sh
npm install
npm test
npm run build
npm run dev
npm run test:browser
```

Browser tests require local Chrome and localhost:4173. Build preserves the separate `dist/.git` gh-pages repository; these commands do not publish.

## Recessed seam: actual motion and solid mating

Two rigid closed flush walls cannot contain an engaging connector without overlap or motion. This design uses **overlapping edge reservations and vertical sliding**, not cosmetic hidden ports. Define each unit's nominal rectangular envelope as `[0,W]×[0,D]`; W/D = `16n+8`, n≥2. Neighbour origins advance **W−8 / D−8**. The reservations overlap 8 mm, but the actual solids do not. The previous 8 mm inter-box stand-off is removed.

The load-bearing outer wall butt datum is 4 mm inside the nominal rectangle, with c/2 relief on both butting walls (total c=.15… .60 mm). This is a narrow fit seam, not an 8 mm gap. Male neck runs from W−4.3 to W−4; trapezoid widens from 2.8 to 5.6 mm across a 4 mm axial run. Its tip is at W, **never outside the nominal rectangular envelope**. Female cuts use the complementary profile expanded by c, at X=4…8 relative to the neighbour. Tangential centres are **13+16k**, k=0…n−1. The 13 mm datum deliberately avoids crossing the perpendicular corner ports and stack seats even at .60 mm clearance. Every side has at least two actual ports.

LEFT/FRONT are female, RIGHT/BACK male. No alternating rotation or universal-gender adjacency. Both tongue and channel run the complete body height, with no socket ceiling, bridge or vertical stop. Lower bodies into the common seam before fitting lids. Simultaneous X/Y lowering into a two-neighbour grid corner is collision-tested over the whole body height. A vertical slide is necessary; do not press horizontally or claim enclosed fixed faces engage without motion. Unused edge profiles are visible at free boundaries; no enclosing cosmetic cover is supplied or implied.

The cavity starts **10.4 mm inside the nominal rectangle**, beyond both seam bands. Floor stays 2.4 mm and is closed under every model; grooves never enter the cavity. Shared seams do not intersect model envelopes, floor interior, lids or perpendicular corner ports. The actual straight wall between cavity and butt datum is approximately 6.4−c/2 mm, less at female pockets; tongue cantilever length is 4 mm. This shortens the load arm and supports the mating profile within a thickened wall zone. **It is not a measured strength improvement.**

## Dimensions / capacity cost

Full model W/D/H includes weapons; no scaling. Model spacing ≥2 mm. Rows/overflow units are automatic; partial units shrink. Max40 units, 200 models/type. Height = model H+8.4, minimum26. All exported parts, not only nominal shells, must fit250×250×250.

At c=.30:

| Configuration | Nominal envelope W×D×H | Actual body STL bounds | Lid STL bounds |
|---|---|---|---|
| Single32×32×48 miniature |56×56×56.4|51.85×51.85×60.35|47.4×47.4×16.7|
| Five32×32×48, 3 columns |136×88×56.4|131.85×83.85×60.35|127.4×79.4×16.7|
| Single65×65×82 |88×88×90.4|83.85×83.85×94.35|79.4×79.4×16.7|
| Minimum5 mm model |40×40×26|35.85×35.85×29.95|31.4×31.4×16.7|
| Maximum test227×227×237 |248×248×245.4|243.85×243.85×249.35|239.4×239.4×16.7|

These are nominal reservations versus tight physical STL bounds, not interchangeable dimensions. A32 mm unit has a48 mm origin pitch, three ports/edge, and remains below70 mm. The thick seam band costs16 mm extra total cavity margin compared with v3; quantization can add another pitch. Maximum unscaled single-model W/D is227.2 mm. Default five-model + Dreadnought reservations assemble to216×88×94.35 mm. Settings/UI dimensions describe the nominal assembly reservation; actual material begins inside unused perimeter rebates.

## Vertical interfaces and internal lid retention

Four2.4×2.4 wall-top corner seats at (6,6), (W−6,6), (6,D−6), (W−6,D−6) rise to H+3.4. Each has a1 mm-wide, .55 mm-tall square pyramid (47.7° slope) and matching underside recess. Seats carry stack loads into walls, not the lid roof. Stack pitch **H+3.4**; upper floor sits .7 mm above lid roof. Stack preview requires identical footprint/height; keys locate XY but do not latch Z.

The broad **lift-on lid retains positive integrated hooks**, moved inside the RIGHT/BACK (male) wall bands rather than exterior skirts. Two leaves are 18–24 mm wide, 1.2 mm thick and 14 mm free length. Their inward triangular hooks reach 10 mm inboard, behind the 10.4 mm cavity datum; sloped wall pockets provide clearance in the locked pose and vertical geometric capture. Female FRONT/LEFT bands were deliberately avoided: outward release there would intersect female connector channels. Nominal manual retraction is **1.4 mm outward into the male wall band**, not into stored miniature envelopes or adjacent units.

Insert fingers through the two **18×14.1 mm lid-top apertures**, press the RIGHT and BACK leaves outward, hold while lowering/lifting, then release to latch. No external-wall access is needed between joined lids. Remove upper stacked bodies first. Finger access is above model tops. Lid roof remains H+.3 to H+2.7; overall lid print height is now **16.7 mm**, not 4.7 mm. Both parts stay single connected solids with no loose bits. Hooks establish CAD retention, not validated snap action or transport/inversion certification.

**Release verification limitation:** collision tests sample root-pivot leaf rotation through the release sweep and subsequent vertical removal, plus a translated free-leaf envelope. They do not simulate continuous elastic deformation, root strain, release force, fatigue or actual finger compliance. The recess extends to 5.1 mm inboard, leaving only about .8–1.0 mm of local outer wall at the pocket; this needs print/strength testing. The short 14 mm leaf requires physical flex testing; do not batch-print or claim a safe transport latch until this is verified. Top apertures are open (not dust-tight).

## Preview / export

Row/grid origins use the overlap pitch, including mixed unit dimensions. Some mixed grid neighbours have no common seam because larger row/column allocations leave space: **only settings.joints indicates real engagement**. Joint counts are actual common ports, verified independently by solid capture probes; diagonal reservation overlap is not a joint. Model ghosts and both part instances use actual XYZ poses.

ZIP contains body/lid STL files, BOM quantities (two parts/unit), CSV, posed settings and assembly instructions. No small loose parts. Body base down, lid automatically top-face down. Export tessellation welds sub-micron CSG duplicates, splits shared T-junction edges, then centroid-triangulates convex polygons; strict STL edge closure/winding/component audits remain unchanged.

## Verification / limitations

`npm test` covers full model envelopes; min/max/mixed capacity; all four mating faces; independent capture of every counted port; X/Y clearances .15/.30/.60; full-height simultaneous corner insertion; no final body/lid/neighbour solid collision; stack lowering, registration and wall seat stops; lid installation; rectangle containment of every actual triangle; closed cavity floor; actual ZIP STL manifold edges/opposite winding/single connected component/positive volume/bounds. The actual print-frame triangle-normal slope test is unchanged: only real bed-contact surfaces are exempt from the45° limit, with no feature whitelist or bridge allowance.

`npm run test:browser` runs actual local Chrome desktop/mobile, editing, persistence, ghosts, real grid/stack poses, incompatible-stack rejection, real downloaded ZIP/BOM/STL audit,250 mm rejection and page errors. Ignored artifacts: `test-results/`.

**Unprinted prototype.** Geometry checks do not certify support-free printing or strength. No physical print, stress, fatigue, layer adhesion, impact, creep, friction or carrying test. PETG/.4 nozzle/.2 layers are starting suggestions only; inspect slicer and print a full pair before batching. No inter-box Z latch, inversion safety or handle. Carry upright with **two hands supporting ALL bases**; never lift by lid, connector, end unit or upper unit.
