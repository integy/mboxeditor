import modeling from '@jscad/modeling';
const {cuboid,polygon}=modeling.primitives,{union,subtract}=modeling.booleans,{translate,rotateZ}=modeling.transforms,{extrudeLinear}=modeling.extrusions;
export const B=(x,y,z,w,d,h)=>translate([x+w/2,y+d/2,z+h/2],cuboid({size:[w,d,h]}));
const prism=(points,z,h)=>translate([0,0,z],extrudeLinear({height:h},polygon({points})));
// Extrude a Y/Z profile across X. Used for genuinely sloped hook/socket roofs.
const yz=(points,x,w)=>modeling.transforms.transform([0,1,0,0,0,0,1,0,1,0,0,0,x,0,0,1],extrudeLinear({height:w},polygon({points})));
export const DEFAULTS=[{name:'Battleline',w:32,d:32,h:48,count:5,perUnit:5,columns:3,spacing:2,base:0},{name:'Dreadnought',w:65,d:65,h:82,count:1,perUnit:1,columns:1,spacing:2,base:0}];
export const PITCH=16,GAP=8;
const quantize=n=>Math.max(2,Math.ceil((n+GAP)/PITCH))*PITCH-GAP;
export const ports=n=>Array.from({length:Math.round((n+GAP)/PITCH)},(_,i)=>4+i*PITCH);
export function plan(types,clearance=.3,layout={mode:'row',columns:2,layers:2}){
 if(!Number.isFinite(clearance)||clearance<.15||clearance>.6)throw Error('Clearance must be 0.15–0.60 mm');
 if(!Array.isArray(types)||!types.length)throw Error('Add at least one miniature type');
 const boxes=[];
 for(const [type,t] of types.entries()){
 const perUnit=t.perUnit??5,columns=t.columns??0,spacing=t.spacing??2,base=t.base??0;
 if(![t.w,t.d,t.h,t.count,perUnit,columns,spacing,base].every(Number.isFinite)||Math.min(t.w,t.d,t.h)<5||!Number.isInteger(t.count)||t.count<1||t.count>200||!Number.isInteger(perUnit)||perUnit<1||perUnit>100||!Number.isInteger(columns)||columns<0||columns>100||spacing<2||spacing>20||base<0||base+2.2>Math.min(t.w,t.d)&&base>0)throw Error('Invalid model dimensions, quantity, spacing or base');
 const maxC=Math.floor((232-4.8+spacing)/(t.w+spacing)),maxR=Math.floor((232-4.8+spacing)/(t.d+spacing)),h=Math.max(26,t.h+8.4);
 if(maxC<1||maxR<1||h+4.4>250)throw Error('Miniature exceeds 250 mm part envelope including integral features');
 let remaining=t.count;
 while(remaining){const target=Math.min(perUnit,remaining,maxC*maxR),cols=Math.min(columns||Math.ceil(Math.sqrt(target*t.d/t.w)),maxC,target),n=Math.min(target,cols*maxR),rows=Math.ceil(n/cols),w=quantize(cols*t.w+(cols-1)*spacing+4.8),d=quantize(rows*t.d+(rows-1)*spacing+4.8),models=[];
 for(let i=0;i<n;i++)models.push({x:2.4+(i%cols)*(t.w+spacing),y:2.4+Math.floor(i/cols)*(t.d+spacing),z:2.4,w:t.w,d:t.d,h:t.h});
 boxes.push({id:boxes.length,type,name:t.name||'Miniature',w,d,h,x:0,y:0,z:0,mini:{w:t.w,d:t.d,h:t.h},models,columns:cols,rows,base,spacing});remaining-=n;
 }}
 if(boxes.length>40)throw Error('Maximum 40 units per assembly');
 const mode=layout.mode??'row',nc=Math.max(1,Math.floor(layout.columns||2)),layers=Math.max(1,Math.floor(layout.layers||2));
 if(!['row','grid','stack'].includes(mode))throw Error('Unknown assembly layout');
 if(mode==='row'){let x=0;for(const b of boxes){b.x=x;x+=b.w+GAP;}}
 if(mode==='grid'){const widths=Array.from({length:nc},(_,col)=>Math.max(0,...boxes.filter((_,i)=>i%nc===col).map(b=>b.w))),xs=widths.map((_,i)=>widths.slice(0,i).reduce((s,w)=>s+w+GAP,0));let y=0;for(let i=0;i<boxes.length;i+=nc){const row=boxes.slice(i,i+nc);for(const [col,b]of row.entries()){b.x=xs[col];b.y=y;}y+=Math.max(...row.map(b=>b.d))+GAP;}}
 if(mode==='stack'){const first=boxes[0];if(boxes.some(b=>b.w!==first.w||b.d!==first.d||b.h!==first.h))throw Error('Stack preview requires identical footprint AND height; use equal full units (no partial units)');let x=0;for(let i=0;i<boxes.length;i+=layers){for(let j=i;j<Math.min(i+layers,boxes.length);j++){boxes[j].x=x;boxes[j].z=(j-i)*(first.h+3.4);}x+=first.w+GAP;}}
 const joints=[];for(const a of boxes)for(const b of boxes){if(a.id>=b.id)continue;let axis=null,count=0;if(a.z===b.z&&a.y===b.y&&b.x===a.x+a.w+GAP){axis='x';count=Math.min(ports(a.d).length,ports(b.d).length);}if(a.z===b.z&&a.x===b.x&&b.y===a.y+a.d+GAP){axis='y';count=Math.min(ports(a.w).length,ports(b.w).length);}if(a.x===b.x&&a.y===b.y&&a.w===b.w&&a.d===b.d&&b.z===a.z+a.h+3.4){axis='z';count=4;}if(axis)joints.push({a:a.id,b:b.id,axis,count});}
 return {version:3,layout:{mode,columns:nc,layers},clearance,wall:2.4,floor:2.4,boxes,joints,width:Math.max(...boxes.map(b=>b.x+b.w))+12,depth:Math.max(...boxes.map(b=>b.y+b.d))+12,height:Math.max(...boxes.map(b=>b.z+b.h))+4.4,modelCount:boxes.reduce((s,b)=>s+b.models.length,0),smallParts:0};
}
// Both profiles stand directly on the bed. Female channel is OPEN THROUGH Z: no roof, no floor bridge.
const maleAt=(w,p)=>prism([[w-.3,p-1.4],[w,p-1.4],[w+4,p-2.8],[w+4,p+2.8],[w,p+1.4],[w-.3,p+1.4]],0,7);
const femaleAt=(p,c)=>subtract(B(-7.8,p-4,0,8.1,8,8),prism([[-8.1,p-1.4-c],[-8,p-1.4-c],[-4+c,p-2.8-c],[-4+c,p+2.8+c],[-8,p+1.4+c],[-8.1,p+1.4+c]],-1,10));
const sideY=(s)=>modeling.transforms.mirrorY(rotateZ(-Math.PI/2,s));
export function male(b,c){return union(...ports(b.d).map(p=>maleAt(b.w,p)));}
export function latchWidth(b){return Math.min(32,b.w-8);}
export function lidTabs(b){const {w,d,h}=b,tw=latchWidth(b),sx=(w-tw)/2;const front=union(B(sx,-2,h-14,tw,1.6,14.6),yz([[-.5,h-10],[.8,h-10],[-.5,h-8.7]],sx,tw));return [front,translate([0,d,0],modeling.transforms.mirrorY(front))];}
const corners=b=>[[1.2,1.2],[b.w-1.2,1.2],[1.2,b.d-1.2],[b.w-1.2,b.d-1.2]];
// Square pyramid: rise/run 1.1 (47.7 degrees), a margin over the 45-degree limit.
function pyramid(x,y,z,r){return modeling.booleans.intersect(yz([[y-r,z],[y+r,z],[y,z+r*1.1]],x-r,2*r),translate([x,y,0],rotateZ(Math.PI/2,yz([[-r,z],[r,z],[0,z+r*1.1]],-r,2*r))));}
export function body(b,c){const {w,d,h}=b,tw=latchWidth(b),sx=(w-tw)/2;let shell=union(subtract(B(0,0,0,w,d,h),B(2.4,2.4,2.4,w-4.8,d-4.8,h)),...ports(d).map(p=>femaleAt(p,c)),male(b,c),sideY(union(...ports(w).map(p=>femaleAt(p,c)))),sideY(union(...ports(w).map(p=>maleAt(d,p)))));
 const pocket=yz([[-.2,h-10-c],[.8+c,h-10-c],[.8+c,h-10],[-.2,h-9+c]],sx-c,tw+2*c);
 shell=subtract(shell,pocket,translate([0,d,0],modeling.transforms.mirrorY(pocket)));
 for(const [x,y] of corners(b)){shell=union(shell,B(x-1.2,y-1.2,h-.1,2.4,2.4,3.5),pyramid(x,y,h+3.4,.5));shell=subtract(shell,pyramid(x,y,-.01,.5+c));}
 for(const m of b.models)if(b.base>0){const k=b.base+1,cx=m.x+m.w/2,cy=m.y+m.d/2;shell=subtract(shell,B(cx-k/2,cy-k/2,1.8,k,k,.7));}
 const ribs=[];for(let col=1;col<b.columns;col++)ribs.push(B(2.4+col*(b.mini.w+b.spacing)-b.spacing/2-.4,2,2,.8,d-4,2.4));for(let row=1;row<b.rows;row++)ribs.push(B(2,2.4+row*(b.mini.d+b.spacing)-b.spacing/2-.4,2,w-4,.8,2.4));return ribs.length?union(shell,...ribs):shell;
}
export function lid(b,c){const {w,d,h}=b;let s=union(B(0,-2,h+.3,w,d+4,2.4),...lidTabs(b),B(2.4+c,3,h-2,1.2,d-6,2.6),B(w-3.6-c,3,h-2,1.2,d-6,2.6));for(const [x,y]of corners(b))s=subtract(s,B(x-1.2-c,y-1.2-c,h-1,2.4+2*c,2.4+2*c,6));return s;}
export const INSTRUCTIONS=`# mboxeditor v3 — two integral parts; no loose hardware
CAD prototype: NOT physically printed, fatigue tested or load-rated. No support material intended. Body base down; exported lid automatically top-face down. 45-degree hook/socket roofs and steeper pyramid stack recesses; XY channels open through their complete height. No intentional bridging allowance. Slicer and physical print validation still required.
X right / Y back / Z up. LEFT and FRONT are female; RIGHT and BACK male. Origins advance shell W+8 / D+8, exact multiples of 16 mm. Ports at 4+16k, >=2 per edge. Different edge lengths share min(port counts) when front/left aligned. Do not rotate genders or claim arbitrary adjacency. Mixed grid rows with shorter units can leave gaps: settings.joints lists only actual engaged edges.
Join XY by lowering male into open female channels before fitting lids. Through channels have NO vertical stop or lock. Assembly rests on a flat surface. Four wall-top corner seats project through lid notches and carry the upper body base; four 45-degree keys/recesses locate identical-footprint stacks. Stack pitch H+3.4. No vertical stack latch; never lift the kit by its upper unit. Stack preview rejects unequal footprint/height.
Lid remains lift-on with broad integral front/back skirts. Manually spread BOTH skirts 1.5 mm during insertion/removal. Sloped hooks are not a physically validated snap mechanism. No unsupported rectangular body pocket roofs. Carry upright with TWO HANDS SUPPORTING ALL BASES, not by lid or side connector. Upside-down, impact, creep, fatigue, print adhesion and carrying performance unvalidated. PETG / 0.4 nozzle / 0.2 layers are starting suggestions only. Calibrate a full body/lid pair first.
`;