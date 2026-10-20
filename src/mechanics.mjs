import modeling from '@jscad/modeling';
const {cuboid,polygon}=modeling.primitives,{union,subtract,intersect}=modeling.booleans,{translate,rotateZ}=modeling.transforms,{extrudeLinear}=modeling.extrusions;
export const B=(x,y,z,w,d,h)=>translate([x+w/2,y+d/2,z+h/2],cuboid({size:[w,d,h]}));
const prism=(points,z,h)=>translate([0,0,z],extrudeLinear({height:h},polygon({points})));
const yz=(points,x,w)=>modeling.transforms.transform([0,1,0,0,0,0,1,0,1,0,0,0,x,0,0,1],extrudeLinear({height:w},polygon({points})));
export const DEFAULTS=[{name:'Battleline',w:32,d:32,h:48,count:5,perUnit:5,columns:3,spacing:2,base:0},{name:'Dreadnought',w:65,d:65,h:82,count:1,perUnit:1,columns:1,spacing:2,base:0}];
// Coordinates refer to the FULL nominal rectangular envelope, not the cavity.
// Overlapping 8 mm edge rebates house complementary through-height profiles.
export const PITCH=16,GAP=-8,BAND=10.4;
const quantize=n=>Math.max(2,Math.ceil((n-8)/PITCH))*PITCH+8;
export const ports=n=>Array.from({length:Math.round((n-8)/PITCH)},(_,i)=>13+i*PITCH);
export function plan(types,clearance=.3,layout={mode:'row',columns:2,layers:2}){
 if(!Number.isFinite(clearance)||clearance<.15||clearance>.6)throw Error('Clearance must be 0.15–0.60 mm');
 if(!Array.isArray(types)||!types.length)throw Error('Add at least one miniature type');
 const boxes=[];
 for(const [type,t] of types.entries()){
 const perUnit=t.perUnit??5,columns=t.columns??0,spacing=t.spacing??2,base=t.base??0;
 if(![t.w,t.d,t.h,t.count,perUnit,columns,spacing,base].every(Number.isFinite)||Math.min(t.w,t.d,t.h)<5||!Number.isInteger(t.count)||t.count<1||t.count>200||!Number.isInteger(perUnit)||perUnit<1||perUnit>100||!Number.isInteger(columns)||columns<0||columns>100||spacing<2||spacing>20||base<0||base+2.2>Math.min(t.w,t.d)&&base>0)throw Error('Invalid model dimensions, quantity, spacing or base');
 const maxC=Math.floor((248-2*BAND+spacing)/(t.w+spacing)),maxR=Math.floor((248-2*BAND+spacing)/(t.d+spacing)),h=Math.max(26,t.h+8.4);
 if(maxC<1||maxR<1||h+4.4>250)throw Error('Miniature exceeds 250 mm part envelope including integral features');
 let remaining=t.count;
 while(remaining){const target=Math.min(perUnit,remaining,maxC*maxR),cols=Math.min(columns||Math.ceil(Math.sqrt(target*t.d/t.w)),maxC,target),n=Math.min(target,cols*maxR),rows=Math.ceil(n/cols),w=quantize(cols*t.w+(cols-1)*spacing+2*BAND),d=quantize(rows*t.d+(rows-1)*spacing+2*BAND),models=[];
 for(let i=0;i<n;i++)models.push({x:BAND+(i%cols)*(t.w+spacing),y:BAND+Math.floor(i/cols)*(t.d+spacing),z:2.4,w:t.w,d:t.d,h:t.h});
 boxes.push({id:boxes.length,type,name:t.name||'Miniature',w,d,h,x:0,y:0,z:0,mini:{w:t.w,d:t.d,h:t.h},models,columns:cols,rows,base,spacing});remaining-=n;
 }}
 if(boxes.length>40)throw Error('Maximum 40 units per assembly');
 const mode=layout.mode??'row',nc=Math.max(1,Math.floor(layout.columns||2)),layers=Math.max(1,Math.floor(layout.layers||2));
 if(!['row','grid','stack'].includes(mode))throw Error('Unknown assembly layout');
 if(mode==='row'){let x=0;for(const b of boxes){b.x=x;x+=b.w+GAP;}}
 if(mode==='grid'){const widths=Array.from({length:nc},(_,col)=>Math.max(0,...boxes.filter((_,i)=>i%nc===col).map(b=>b.w))),xs=widths.map((_,i)=>widths.slice(0,i).reduce((s,w)=>s+w+GAP,0));let y=0;for(let i=0;i<boxes.length;i+=nc){const row=boxes.slice(i,i+nc);for(const [col,b]of row.entries()){b.x=xs[col];b.y=y;}y+=Math.max(...row.map(b=>b.d))+GAP;}}
 if(mode==='stack'){const first=boxes[0];if(boxes.some(b=>b.w!==first.w||b.d!==first.d||b.h!==first.h))throw Error('Stack preview requires identical footprint AND height; use equal full units (no partial units)');let x=0;for(let i=0;i<boxes.length;i+=layers){for(let j=i;j<Math.min(i+layers,boxes.length);j++){boxes[j].x=x;boxes[j].z=(j-i)*(first.h+3.4);}x+=first.w+GAP;}}
 const joints=[];for(const a of boxes)for(const b of boxes){if(a.id>=b.id)continue;let axis=null,count=0;if(a.z===b.z&&a.y===b.y&&b.x===a.x+a.w+GAP){axis='x';count=Math.min(ports(a.d).length,ports(b.d).length);}if(a.z===b.z&&a.x===b.x&&b.y===a.y+a.d+GAP){axis='y';count=Math.min(ports(a.w).length,ports(b.w).length);}if(a.x===b.x&&a.y===b.y&&a.w===b.w&&a.d===b.d&&b.z===a.z+a.h+3.4){axis='z';count=4;}if(axis)joints.push({a:a.id,b:b.id,axis,count});}
 return {version:4,layout:{mode,columns:nc,layers},clearance,wall:BAND,floor:2.4,seamOverlap:8,boxes,joints,width:Math.max(...boxes.map(b=>b.x+b.w)),depth:Math.max(...boxes.map(b=>b.y+b.d)),height:Math.max(...boxes.map(b=>b.z+b.h))+3.95,modelCount:boxes.reduce((s,b)=>s+b.models.length,0),smallParts:0};
}
// Full-height dovetails: no horizontal socket roof, no external ears. The
// rectangular reservation includes the tongues; neighbour rectangles overlap.
const tongueProfile=(w,p,c=0)=>polygon({points:[[w-4.3,p-1.4-c],[w-4+c,p-1.4-c],[w+c,p-2.8-c],[w+c,p+2.8+c],[w-4+c,p+1.4+c],[w-4.3,p+1.4+c]]});
const tongue=(w,p,z,h,c=0)=>translate([0,0,z],extrudeLinear({height:h},tongueProfile(w,p,c)));
const sideY=s=>modeling.transforms.mirrorY(rotateZ(-Math.PI/2,s));
export function male(b,c){return union(...ports(b.d).map(p=>tongue(b.w,p,0,b.h)));}
export const latchWidth=b=>Math.min(24,Math.min(b.w,b.d)-22);
export function lidTabs(b){const tw=latchWidth(b),sx=(b.w-tw)/2,h=b.h;
 // Printed lid points inward; this hook's slope is upward in its print frame.
 const front=union(B(sx,7.6,h-14,tw,1.2,14.6),yz([[8.7,h-10],[10,h-10],[8.7,h-8.6]],sx,tw));
 // Use only male right/back wall bands; female grooves occupy their release space.
 return [translate([0,b.d,0],modeling.transforms.mirrorY(front)),translate([b.w,0,0],rotateZ(Math.PI/2,translate([(b.d-b.w)/2,0,0],front)))];
}
function latchCuts(b,c){const tw=latchWidth(b),sx=(b.w-tw)/2,h=b.h;
 const front=union(B(sx-c,5.1,h-14.4,tw+2*c,3.7,15.4),yz([[8.5,h-10-c],[10.1+c,h-10-c],[8.5,h-8.1+c]],sx-c,tw+2*c));
 return [translate([0,b.d,0],modeling.transforms.mirrorY(front)),translate([b.w,0,0],rotateZ(Math.PI/2,translate([(b.d-b.w)/2,0,0],front)))];
}
const corners=b=>[[6,6],[b.w-6,6],[6,b.d-6],[b.w-6,b.d-6]];
function pyramid(x,y,z,r){return intersect(yz([[y-r,z],[y+r,z],[y,z+r*1.1]],x-r,2*r),translate([x,y,0],rotateZ(Math.PI/2,yz([[-r,z],[r,z],[0,z+r*1.1]],-r,2*r))));}
export function body(b,c){const {w,d,h}=b;
 let shell=subtract(union(B(4+c/2,4+c/2,0,w-8-c,d-8-c,h),male(b,c),sideY(union(...ports(w).map(p=>tongue(d,p,0,h))))),B(BAND,BAND,2.4,w-2*BAND,d-2*BAND,h),...ports(d).map(p=>tongue(8,p,-1,h+2,c)),...ports(w).map(p=>sideY(tongue(8,p,-1,h+2,c))));
 for(const cut of latchCuts(b,c))shell=subtract(shell,cut);
 for(const [x,y] of corners(b)){shell=union(shell,B(x-1.2,y-1.2,h-.1,2.4,2.4,3.5),pyramid(x,y,h+3.4,.5));shell=subtract(shell,pyramid(x,y,-.01,.5+c));}
 for(const m of b.models)if(b.base>0){const k=b.base+1,cx=m.x+m.w/2,cy=m.y+m.d/2;shell=subtract(shell,B(cx-k/2,cy-k/2,1.8,k,k,.7));}
 const ribs=[];for(let col=1;col<b.columns;col++)ribs.push(B(BAND+col*(b.mini.w+b.spacing)-b.spacing/2-.4,BAND-.4,2,.8,d-2*BAND+.8,2.4));for(let row=1;row<b.rows;row++)ribs.push(B(BAND-.4,BAND+row*(b.mini.d+b.spacing)-b.spacing/2-.4,2,w-2*BAND+.8,.8,2.4));return modeling.modifiers.retessellate(ribs.length?union(shell,...ribs):shell);
}
export function lid(b,c){const {w,d,h}=b;
 // Rooted internal leaves, with top-only access even between joined units.
 let s=union(B(4+c,4+c,h+.3,w-8-2*c,d-8-2*c,2.4),...lidTabs(b));
 if(d>48)s=union(s,B(BAND+c,23.6,h-2,1.2,d-47.2,2.6),B(w-BAND-1.2-c,23.6,h-2,1.2,d-47.2,2.6));
 for(const [x,y]of corners(b))s=subtract(s,B(x-1.2-c,y-1.2-c,h-1,2.4+2*c,2.4+2*c,6));
 // Open roof apertures expose the INNER face; squeeze leaves toward cavity.
 const access=B(w/2-9,9.1,h-3,18,14.1,7);
 s=subtract(s,translate([0,d,0],modeling.transforms.mirrorY(access)),translate([w,0,0],rotateZ(Math.PI/2,translate([(d-w)/2,0,0],access))));
 return modeling.modifiers.retessellate(s);
}
export const INSTRUCTIONS=`# mboxeditor v4 — recessed seam, two parts/unit
Unprinted CAD prototype; NOT load-rated or physically validated. Body base down, lid automatically top-face down. No loose hardware. No support geometry intended; validate slicer and a complete pair before batching.
Nominal rectangle W/D=16n+8, n>=2; cavity starts 10.4 mm inside it. Neighbour origins advance W-8 / D-8 (16n). Rectangular reservations overlap 8 mm; the actual complementary wall profiles do NOT overlap. Wall butt datum is 4 mm inside each reserved edge. Tongues lie entirely inside the reservation. LEFT/FRONT female, RIGHT/BACK male, port centres 13+16k. Full-height dovetails slide vertically; lower bodies together BEFORE lids. At least two actual ports per side. No vertical lock or stop. Four-neighbour grid requires simultaneous vertical insertion, not horizontal pressing.
Four wall-borne corner seats at (6,6) and mirrored coordinates support same-footprint stacks at H+3.4; 47.7 degree pyramid keys locate but do not latch. Lid corner notches clear seats; lid is not the load path. Stack requires identical footprints/heights in preview.
Lid stays lift-on with two broad integral INTERNAL leaves in the RIGHT/BACK wall bands, not external skirts. Width 18–24 mm, thickness 1.2 mm, free length 14 mm; inward hooks engage sloped wall pockets. From the lid-top openings press BOTH leaves OUTWARD into their recessed wall space, hold released while lowering/lifting, then let go to latch. Nominal manual release is 1.4 mm at hook (elastic bending/force NOT validated). The two 18 mm-wide top apertures remain accessible between neighbouring lids; remove upper stacked bodies before accessing lower lids. Hooks give positive CAD vertical retention, NOT a certified snap or inversion-safe transport latch. Fit lids after joining bodies; remove lids before sliding bodies apart. Mixed-size grids can have unjoined neighbours: only settings.joints denotes engagement.
Rebated walls shorten the connector load arm; no measured strength improvement is claimed. No fatigue, adhesion, impact, friction, bending or print test performed. Carry upright with TWO HANDS SUPPORTING ALL BASES. Never lift by lids, an end unit or an upper unit.
`;
