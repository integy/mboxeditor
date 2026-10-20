# mboxeditor

Browser-only, parametric miniature storage / transport kit editor. Traditional Chinese / English UI, locally bundled Three.js preview and actual watertight binary STL ZIP export. No backend, CDN, account or external runtime assets.

## Run / verify

```sh
npm install
npm run dev     # http://127.0.0.1:4173
npm run build   # static dist/ — host this directory on any static server
npm test
npm run test:browser
```

Node 22+ recommended (tested Node 26). Browser tests use installed Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`; change `executablePath` in `tests/browser.mjs` for another OS. Tests save actual downloaded ZIP and desktop/mobile screenshots in ignored `test-results/`. A root or project-subpath deployment works because all asset references are relative. Parent workflow handles repository publishing; no deploy credentials required by this app.

## Features and honest scope

- Add/edit/remove miniature types: complete W/D/H envelope, quantity. Each miniature gets its own fixed-base-cradle box. Quantities are not a grid of many figures inside one box.
- Automatic non-overlapping single-row layout, front-aligned, mixed 50 mm XY sizes and a common height (10 mm step). This deliberately simple layout is connected but **not a space-optimal 2D bin packer**.
- Orbit/zoom, top view, reset camera, exploded assembly, translucent miniature envelope ghosts, per-part dimensions and BOM, localStorage persistence.
- Real JSCAD CSG solids, unioned cradles/keys/pins, triangulated binary STL; unique geometry exported once with correct print quantities. ZIP also includes `BOM.csv`, `BOM.json`, `settings.json`, and `assembly.md`.
- Oversize input rejected; never silently scaled. Every *individual* exported part has XYZ bounds ≤250 mm. The connected assembly can be much larger.
- No hardware, magnets, glue, metal or purchased fasteners. Sliding captured lids + headed printed lock pins. Captured double-T bridge keys engage opposing side slots; lids cover bridge withdrawal paths.

**Prototype, not physically printed or load-tested.** No load-bearing handle is offered. Carry upright using **two hands supporting all box bases**. Do not lift by an end box, lid or bridge. Not inversion-safe: the gravity-seated lock pins can withdraw and miniatures have no vertical clamping. The fixed rectangular cradle limits horizontal base motion only; it does not immobilize thin bases, prevent bouncing or protect a delicate model from shock. A miniature envelope is not a base-shape measurement. Test with your actual model/base before transport. These are explicit limitations, not hidden “restraint” or “handle” features.

## Exact design (mm)

Coordinate convention: X left→right, Y front→back, Z up. Each body's local front-left-bottom is `[0,0,0]`.

- Pitch 50 XY, body width `ceil((miniW+26)/50)*50`, depth analogous. Maximum W/D miniature envelope 224 gives 250 body. Width/depth must be ≥5.
- Common body H `ceil((maxMiniH+16)/10)*10`; H ≤240. Roof top H+3; headed pin top H+5. Per-type count integer 1–20; total ≤30 to keep interactive CSG/preview manageable.
- Floor 4. Walls 10. Open main cavity `[10,10,4]` to `[W-10,D-10,H]`. Thus clear cavity XY ≥ miniature XY+6; vertical top clearance ≥12.
- Cradle unioned with floor: inner rectangular pocket miniature W+2 × D+2, centred; 2 mm cradle wall, top at Z8. Cradle starts Z3, overlapping the floor by 1 mm; no floating or merely touching solids. Clearance around the input envelope is 1 mm per side.
- Opposing connector sockets centred Y25, bottom Z(H-20), open at top. Left-wall head recess X3…7, Y20…30; throat X0…3, Y23…27. Right wall mirrored. Closed solid floor below each recess. Two adjacent walls separated by exactly 2 mm.
- Key local origin at right outer wall of left box, Y25, Z(H-20). Left T head X(-7+c)…(-3-c), right head X(5+c)…(9-c), each Y(-5+c)…(5-c), height19.6. Bridge neck X(-3-c)…(5+c), Y(-2+c)…(2-c). CSG-unioned with overlapping ends. At default c=.30: 3.4×9.4 heads, 3.4 neck width; nominal per-face clearance .30. Head is wider than 4 mm throat by ≥4.8 across allowed clearances; there is real pull-apart interference. Lid closes withdrawal path; slots/keys are not decorative.
- Lid top plate W×D×3 at ZH. Underside tongue X(7+c)…(W-7-c), Y0…(D-7-c), Z(H-4)…(H+.2); joined to plate with .2 overlap. Body groove X7…W-7, Y0…D-7, Z(H-4-c)…(H+c). Slide from Y0 until aligned; solid back wall stops deeper insertion. Sidewall roof shoulders capture the tongue against lifting. Print lid **top face down**, not assembled orientation.
- Lock hole centre XW/2, Y5.5, square side(3+2c); body hole down to H-10. Pin shaft 3×3×12, head6×6×2 with .2 union overlap. Seated shaft bottom H-8.8, head bottom H+3, top H+5. Pin blocks lid sliding, is manually removable and is **not a snap fit**.
- c adjustable .15–.60 per mating face; default .30. This is a geometric clearance, not a promise that every printer/material will fit.

## Assembly and printing

1. Print a small body/key/lid/pin calibration set before batch printing. Suggested starting point: PETG, 0.4 mm nozzle, 0.2 layers, 5 perimeters, 30% infill. Bodies base-down, lids top-down, keys upright, pins head-down. STL coordinates are rebased to minimum XYZ zero, **not auto-oriented**. Turn lids/pins in your slicer. Side grooves and socket roofs may need removable supports; inspect sliced overhangs carefully.
2. Arrange numbered boxes front-aligned in the row shown, 2 mm gap. Insert each bridge from the top until seated.
3. Set model base in cradle. Slide lids in from front, flush with back; insert headed lock pins vertically through the front lid holes.
4. Carry upright, supporting every box bottom. To disassemble: remove lock pins, slide lids forwards, lift bridge keys.
5. FDM anisotropy, stress concentrations, repeated wear, dimensional drift, impact and load are unvalidated. PLA creeps in heat; PETG also creeps. Do not leave in a hot car. Never assume preview/export validation establishes physical strength.

## Verification

`npm test` parses the **actual exported ZIP/STLs**, checks directed mesh edges occur twice with opposite winding, finite coordinates, positive signed volume, exact binary lengths, bounds, quantities, min/max/mixed cases, and input rejection. CSG intersection tests prove all assembled parts are mutually nonintersecting at clearance .15/.30/.60 and that lateral key pull-out, upward key removal under lid, and lid sliding with pin inserted encounter real geometry. This is collision/topology verification, **not structural analysis or physical manufacturing certification**.

`npm run test:browser` launches real headless Chrome, exercises top/exploded/ghost controls, add/remove, persistence, oversize rejection, downloads the real ZIP, audits all unique STL files, checks quantities and mobile overflow, and checks no page exceptions. Screenshots are evidence artifacts, not a claimed physical fit test.

## Provenance

See `docs/gemini-design.txt` for the actual consulted Gemini web transcript. Gemini supplied the common-grid idea and Three.js + STL/ZIP architecture. Its response stopped at the pitch heading and did not supply detailed mechanisms or dimensions. **All mechanical geometry, formulas and safety decisions here are independently engineered**, not attributed to Gemini. The app makes no claim of Gemini mechanical verification.

## Source map

- `src/engine.mjs`: pure planning, JSCAD mechanics, STL, ZIP and instructions
- `src/app.mjs`: editor, preview, local state, download
- `src/style.css`, `index.html`: responsive UI
- `tests/`: engine/topology/engagement tests and actual Chrome download integration
- `scripts/build.mjs`: esbuild local bundle/static dev server
