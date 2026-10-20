import modeling from '@jscad/modeling';
const {cuboid,polygon}=modeling.primitives,{union,subtract}=modeling.booleans,{translate}=modeling.transforms,{extrudeLinear}=modeling.extrusions;
export const B=(x,y,z,w,d,h)=>translate([x+w/2,y+d/2,z+h/2],cuboid({size:[w,d,h]}));
const prism=(points,z,h)=>translate([0,0,z],extrudeLinear({height:h},polygon({points})));
export const DEFAULTS=[{name:'Battleline',w:32,d:32,h:48,count:5,perUnit:5,columns:3,spacing:2,base:0},{name:'Dreadnought',w:65,d:65,h:82,count:1,perUnit:1,columns:1,spacing:2,base:0}];
export function plan(types,clearance=.3){
 if(!Number.isFinite(clearance)||clearance<.15||clearance>.6)throw Error('Clearance must be 0.15–0.60 mm');
 if(!Array.isArray(types)||!types.length)throw Error('Add at least one miniature type');
 const boxes=[];let x=0;
 for(const [type,t] of types.entries()){
 const perUnit=t.perUnit??5,columns=t.columns??0,spacing=t.spacing??2,base=t.base??0;
 if(![t.w,t.d,t.h,t.count,perUnit,columns,spacing,base].every(Number.isFinite)||Math.min(t.w,t.d,t.h)<5||!Number.isInteger(t.count)||t.count<1||t.count>200||!Number.isInteger(perUnit)||perUnit<1||perUnit>100||!Number.isInteger(columns)||columns<0||columns>100||spacing<2||spacing>20||base<0||base+2.2>Math.min(t.w,t.d)&&base>0)throw Error('Envelopes ≥5 mm; models 1–200; models/unit 1–100; columns 0=auto; spacing 2–20; base pocket must fit envelope');
 const maxC=Math.floor((241-4.8+spacing)/(t.w+spacing)),maxR=Math.floor((246-4.8+spacing)/(t.d+spacing)),h=Math.max(26,t.h+8.4);
 if(maxC<1||maxR<1||h+2.7>250)throw Error('Miniature exceeds 250 mm part envelope including integral features');
 let remaining=t.count;
 while(remaining){const target=Math.min(perUnit,remaining,maxC*maxR),cols=Math.min(columns||Math.ceil(Math.sqrt(target*t.d/t.w)),maxC,target),n=Math.min(target,cols*maxR),rows=Math.ceil(n/cols),w=Math.max(20,cols*t.w+(cols-1)*spacing+4.8),d=Math.max(32,rows*t.d+(rows-1)*spacing+4.8),models=[];
 for(let i=0;i<n;i++)models.push({x:2.4+(i%cols)*(t.w+spacing),y:2.4+Math.floor(i/cols)*(t.d+spacing),z:2.4,w:t.w,d:t.d,h:t.h});
 boxes.push({id:boxes.length,type,name:t.name||'Miniature',w,d,h,x,y:0,mini:{w:t.w,d:t.d,h:t.h},models,columns:cols,rows,base,spacing});x+=w+5;remaining-=n;
 }
 }
 if(boxes.length>40)throw Error('Maximum 40 units per assembly');
 return {version:2,clearance,wall:2.4,floor:2.4,interfaceZ:3,boxes,joints:boxes.slice(1).map((b,i)=>({a:i,b:i+1,z:3,x:b.x})),width:x+4,depth:Math.max(...boxes.map(b=>b.d))+4,height:Math.max(...boxes.map(b=>b.h))+2.7,modelCount:boxes.reduce((s,b)=>s+b.models.length,0),smallParts:0};
}
export function male(b,c){return prism([[b.w-.3,9],[b.w,9],[b.w+4,6],[b.w+4,18],[b.w,15],[b.w-.3,15]],3+c,14-c);}
export function channel(c){return prism([[-5.2,9-c],[-5,9-c],[-1+c,6-c],[-1+c,18+c],[-5,15+c],[-5.2,15+c]],3,300);}
export function latchWidth(b){return Math.min(32,b.w-8);}
export function lidTabs(b){const {w,d,h}=b,tw=latchWidth(b),sx=(w-tw)/2;return [union(B(sx,-2,h-14,tw,1.6,14.6),B(sx,-.5,h-9.5,tw,1.3,2)),union(B(sx,d+.4,h-14,tw,1.6,14.6),B(sx,d-.8,h-9.5,tw,1.3,2))];}
export function body(b,c){const {w,d,h}=b,tw=latchWidth(b),sx=(w-tw)/2;let shell=union(subtract(B(0,0,0,w,d,h),B(2.4,2.4,2.4,w-4.8,d-4.8,h)),subtract(B(-5,3,0,5.3,18,18),channel(c)),male(b,c));
 shell=subtract(shell,B(sx-c,-.1,h-9.5-c,tw+2*c,1.1+c,2+2*c),B(sx-c,d-1-c,h-9.5-c,tw+2*c,1.1+c,2+2*c));
 const ribs=[];
 for(const m of b.models)if(b.base>0){const k=b.base+1,cx=m.x+m.w/2,cy=m.y+m.d/2;shell=subtract(shell,B(cx-k/2,cy-k/2,1.8,k,k,.7));}
 for(let col=1;col<b.columns;col++)ribs.push(B(2.4+col*(b.mini.w+b.spacing)-b.spacing/2-.4,2,2,.8,d-4,2.4));
 for(let row=1;row<b.rows;row++)ribs.push(B(2,2.4+row*(b.mini.d+b.spacing)-b.spacing/2-.4,2,w-4,.8,2.4));
 return ribs.length?union(shell,...ribs):shell;
}
export function lid(b,c){const {w,d,h}=b;return union(B(0,-2,h+.3,w,d+4,2.4),...lidTabs(b),B(2.4+c,3,h-2,1.2,d-6,2.6),B(w-3.6-c,3,h-2,1.2,d-6,2.6));}
export const INSTRUCTIONS=`# mboxeditor v2 — two large parts per unit; zero loose small parts
Prototype: CAD checked, NOT physically printed, fatigue tested or load-rated.
Each unit holds multiple complete model envelopes separated by low integral ribs. Quantity means MODELS; models/unit is capacity. Partial units shrink. Columns 0=automatic, rows automatic. Excess models split into additional units. Heights independent. Walls/floor 2.4, lid 2.4, spacing >=2. Optional square base pockets use separate base width, not the full model envelope; no immobilization claim.
Print bodies base-down; lids top-face down (rotate 180 degrees in slicer; exports rebase only). PETG suggested, 0.4 nozzle, 0.2 layers. Inspect supports/overhangs at channels and hooks. Calibrate one pair first. No hardware or separate fasteners.
Connect front-aligned: next origin X=previous origin+W+5. Lift LEFT/male body above RIGHT/female channel, then lower it vertically until floor stop seats. Channel floor Z=3; male bottom Z=3+c. Interface independent of height. Flared trapezoid captures lateral separation. No vertical body locking: units can lift apart. Support every base.
Lid is LIFT-ON, not a sliding rail lid. Inner lips locate, not vertically capture. Broad integral front/back cantilever skirts carry inward hooks. Spread BOTH skirts outward approximately 1.5 mm with thumbs during lowering; release only when seated. Hooks rest in recessed wall pockets without CAD interference. Spread skirts and lift to open. Do not force an unflexed lid down. Flexibility, thumb forces, fatigue and creep require real print tests; CAD checks final fit and manually released rigid-component paths, NOT elastic simulation. No automatic snap-in claim: hooks have no lead-in ramp.
Carry upright WITH TWO HANDS SUPPORTING EVERY BASE. No handle; do not lift by lid, end unit or connector. Not inversion-safe or impact-safe; no vertical miniature restraint. Low ribs organize only. Every part <=250 including protrusions; overall row may be larger. Clearance 0.15–0.60 per face is not a strength guarantee. Avoid hot cars.
`;
