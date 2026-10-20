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
// Slide toward -Y to open. Rails and all release features stay in wall bands.
export const latchWidth=b=>Math.min(24,b.w-22);
export function lidTabs(b,c=0){const tw=latchWidth(b),x=(b.w-tw)/2,h=b.h;
 const blade=B(x,8.8,h-1.2,tw,1.2,1.2);
 const tooth=yz([[8.8,h-7],[10,h-7],[10,h],[8.8,h]],x+tw-6,6);
 return [translate([0,0,-2*c],union(blade,tooth))];
}
export function releasedLid(b,c,angle=.22){const tab=lidTabs(b,c)[0],root=[(b.w-latchWidth(b))/2,9.4,b.h-2*c],local=translate(root.map(v=>-v),tab);
 return union(subtract(lid(b,c),tab),translate(root,modeling.transforms.rotateY(-angle,local)));
}
const xz=(points,y,d)=>modeling.transforms.transform([1,0,0,0,0,0,1,0,0,-1,0,0,0,y+d,0,1],extrudeLinear({height:d},polygon({points})));
function railCut(b,c){const {w,d,h}=b;return xz([[8.2,h-5],[w-8.2,h-5],[w-8.2,h-2.4],[w-10.6,h],[10.6,h],[8.2,h-2.4]],4,d-12.2);}
const corners=b=>[[6,6],[b.w-6,6],[6,b.d-6],[b.w-6,b.d-6]];
function pyramid(x,y,z,r){return intersect(yz([[y-r,z],[y+r,z],[y,z+r*1.1]],x-r,2*r),translate([x,y,0],rotateZ(Math.PI/2,yz([[-r,z],[r,z],[0,z+r*1.1]],-r,2*r))));}
export function body(b,c){const {w,d,h}=b;
 let shell=subtract(union(B(4+c/2,4+c/2,0,w-8-c,d-8-c,h),male(b,c),sideY(union(...ports(w).map(p=>tongue(d,p,0,h))))),B(BAND,BAND,2.4,w-2*BAND,d-2*BAND,h),...ports(d).map(p=>tongue(8,p,-1,h+2,c)),...ports(w).map(p=>sideY(tongue(8,p,-1,h+2,c))));
 shell=subtract(shell,railCut(b,c),B(8.2,4,h-8.5,w-16.4,6.5,10.5),B((w-latchWidth(b))/2-.5,8.1,h-8.5,latchWidth(b)+1,2.3,10.5));
 // End shoulder captures the tooth against horizontal drift; no loose latch.
 shell=union(shell,B((w+latchWidth(b))/2-6,8.0+c/6,0,6,.6,h-5.8));
 for(const [x,y] of corners(b)){shell=union(shell,B(x-1.2,y-1.2,h-.1,2.4,2.4,3.5),pyramid(x,y,h+3.4,.5));shell=subtract(shell,pyramid(x,y,-.01,.5+c));}
 for(const m of b.models)if(b.base>0){const k=b.base+1,cx=m.x+m.w/2,cy=m.y+m.d/2;shell=subtract(shell,B(cx-k/2,cy-k/2,1.8,k,k,.7));}
 const ribs=[];for(let col=1;col<b.columns;col++)ribs.push(B(BAND+col*(b.mini.w+b.spacing)-b.spacing/2-.4,BAND-.4,2,.8,d-2*BAND+.8,2.4));for(let row=1;row<b.rows;row++)ribs.push(B(BAND-.4,BAND+row*(b.mini.d+b.spacing)-b.spacing/2-.4,2,w-2*BAND+.8,.8,2.4));return modeling.modifiers.retessellate(ribs.length?union(shell,...ribs):shell);
}
export function lid(b,c){const {w,d,h}=b;
 const roof=xz([[8.2+c,h-4.7],[w-8.2-c,h-4.7],[w-8.2-c,h-2.4-2*c],[w-10.6,h-2*c],[10.6,h-2*c],[8.2+c,h-2.4-2*c]],10.2,d-18.4-c);
 // Broad end grip/leaf is outside the cavity shadow, not a roof aperture.
 const x=(w-latchWidth(b))/2;
 const root=xz([[x,h-4.7+2*c],[x+4,h-4.7+2*c],[x+7.7,h-1.2],[x+7.7,h],[x,h]],8.8,4);
 return modeling.modifiers.retessellate(union(roof,translate([0,0,-2*c],root),...lidTabs(b,c)));
}
export const INSTRUCTIONS=`# Solid horizontal sliding lid — unprinted CAD prototype
Exactly body + lid per unit. Body base down; lid automatically roof-face down. No loose hardware. Inspect slicer and print a full pair before batching.
Recessed LEFT/FRONT female and RIGHT/BACK male seams: 16 mm pitch, 13+16k ports, 8 mm overlapping reservations, 10.4 mm cavity margin. Lower bodies together vertically before lids. Four wall seats locate stacks without a vertical lock; stack preview needs equal footprints/heights.
Insert lid from FRONT (-Y) toward BACK (+Y) into recessed side rails. Lift the broad integral front-end leaf to clear the end shoulder, slide to the rear positive stop, release. To open lift the leaf approximately 4–5 mm at the tooth (CAD root-pivot pose 0.22 radians), hold and pull toward -Y. Do not lift the captured roof vertically. Release acts outside the model cavity. Roof is solid above the entire cavity, without top holes. End/rail seams remain: NOT dust-tight or watertight.
FRONT insertion edge requires at least one lid-depth of clear working space. A front neighbour blocks withdrawal: detach the blocking neighbour/unit first. Remove upper stacked units before accessing lower lids. Extraction preview is illustrative, NOT a valid path in every grid/stack. Only settings.joints denotes real mixed-grid engagement.
The broad integral 18–24 mm end leaf and tooth prevent horizontal drift in the locked CAD pose. Elastic bending, force, fatigue, snap action and inversion retention have NOT been physically verified. Triangle slope tests are CAD checks, not print certification. Carry upright with BOTH HANDS SUPPORTING ALL BASES; never lift by lid, connector or upper unit.
`;
