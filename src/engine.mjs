import modeling from '@jscad/modeling';
import {zipSync,strToU8} from 'fflate';
const {cuboid}=modeling.primitives,{union,subtract}=modeling.booleans,{translate}=modeling.transforms;
const B=(x,y,z,w,d,h)=>translate([x+w/2,y+d/2,z+h/2],cuboid({size:[w,d,h]}));
export const DEFAULTS=[{name:'Battleline',w:32,d:32,h:48,count:2},{name:'Dreadnought',w:65,d:65,h:82,count:1}];
export function plan(types,clearance=.3){
 if(!Number.isFinite(clearance)||clearance<.15||clearance>.6)throw Error('Clearance must be 0.15–0.60 mm');
 if(!Array.isArray(types)||!types.length)throw Error('Add at least one miniature type');
 const boxes=[];let x=0;let H=0;
 for(const t of types){if(![t.w,t.d,t.h,t.count].every(Number.isFinite)||Math.min(t.w,t.d,t.h)<5||!Number.isInteger(t.count)||t.count<1||t.count>20)throw Error('Dimensions ≥5 mm; quantity 1–20 (whole number)'); H=Math.max(H,Math.ceil((t.h+16)/10)*10);}
 if(H+7>250)throw Error('Part exceeds 250 mm Z. Miniature is too large.');
 for(const [type,t]of types.entries())for(let i=0;i<t.count;i++){
 const w=Math.ceil((t.w+26)/50)*50,d=Math.ceil((t.d+26)/50)*50;
 if(w>250||d>250)throw Error('Part exceeds 250 mm XY. Miniature is too large.');
 boxes.push({id:boxes.length,type,name:t.name||'Miniature',w,d,h:H,x,y:0,mini:{w:t.w,d:t.d,h:t.h}});x+=w+2;
 }
 if(boxes.length>30)throw Error('Maximum 30 boxes per assembly');
 const joints=boxes.slice(1).map((b,i)=>({a:i,b:i+1,x:b.x-2,y:25,z:H-20}));
 return {version:1,clearance,pitch:50,height:H,boxes,joints,width:x-2,depth:Math.max(...boxes.map(b=>b.d))};
}
// T-key heads are captured behind the side-wall throat; lids block upward removal.
export function socket(w,H,right){const sx=right?w:0;return union(B(sx+(right?-7:3),20,H-20,4,10,21),B(sx+(right?-3:-.1),23,H-20,3.1,4,21));}
function body(b,c){const {w,d,h:H,mini:m}=b;
 let shell=subtract(B(0,0,0,w,d,H),B(10,10,4,w-20,d-20,H),socket(w,H,true),socket(w,H,false));
 // Sliding lid tongues travel in two grooves, accessible from y=0; back wall stops travel.
 shell=subtract(shell,B(7,0,H-4-c, w-14,d-7,4+2*c),B(w/2-1.5-c,4-c,H-10,3+2*c,3+2*c,11));
 const px=(w-m.w-2)/2,py=(d-m.d-2)/2;
 const cradle=subtract(B(px-2,py-2,3, m.w+6,m.d+6,5),B(px,py,2,m.w+2,m.d+2,8));
 return union(shell,cradle);
}
function lid(b,c){return union(B(0,0,b.h,b.w,b.d,3),B(7+c,0,b.h-4,b.w-14-2*c,b.d-7-c,4.2));}
export function key(c){return union(B(-7+c,-5+c,0,4-2*c,10-2*c,19.6),B(5+c,-5+c,0,4-2*c,10-2*c,19.6),B(-3-c,-2+c,0,8+2*c,4-2*c,19.6));}
export function triangles(solid){const ps=modeling.geometries.geom3.toPolygons(modeling.modifiers.generalize({snap:true,simplify:true,triangulate:true},solid));return ps.flatMap(p=>{const a=[];for(let i=1;i<p.vertices.length-1;i++)a.push([p.vertices[0],p.vertices[i],p.vertices[i+1]]);return a;});}
export function bounds(solid){const [a,b]=modeling.measurements.measureBoundingBox(solid);return b.map((v,i)=>+(v-a[i]).toFixed(3));}
export function makeParts(p){const out=[],map=new Map();const add=(name,solid,pose,role,box)=>{const size=bounds(solid);if(size.some(v=>v>250.001||v<=0))throw Error('Part exceeds 250 mm build envelope');let part=map.get(name);if(!part){part={name,solid,qty:0,size,role,instances:[]};map.set(name,part);out.push(part);}part.qty++;part.instances.push({pose,box});};
 for(const b of p.boxes){const tag=`${b.w}x${b.d}x${b.h}_mini${b.mini.w}x${b.mini.d}`;
 add(`body_${tag}`,body(b,p.clearance),[b.x,0,0],'body',b.id);
 const l=subtract(lid(b,p.clearance),B(b.w/2-1.5-p.clearance,4-p.clearance,b.h-5,3+2*p.clearance,3+2*p.clearance,10));
 add(`lid_${b.w}x${b.d}x${b.h}`,l,[b.x,0,0],'lid',b.id);
 const pin=union(B(-1.5,-1.5,0,3,3,12),B(-3,-3,11.8,6,6,2));add('lid_lock_pin',pin,[b.x+b.w/2,5.5,b.h-8.8],'pin',b.id);
 }
 for(const j of p.joints)add('bridge_T_key',key(p.clearance),[j.x,j.y,j.z],'key',null);
 return out;
}
export function stl(solid){const ts=triangles(solid);const arr=new Uint8Array(84+ts.length*50),v=new DataView(arr.buffer);v.setUint32(80,ts.length,true);let k=84;for(const t of ts){k+=12;for(const pt of t)for(const n of pt){v.setFloat32(k,n,true);k+=4;}k+=2;}return arr;}
export function exportZip(p,parts=makeParts(p)){const files={};const bom=parts.map(({name,qty,size,role})=>({file:name+'.stl',quantity:qty,bounds_mm:size,role}));for(const a of parts){let solid=a.solid;const [min]=modeling.measurements.measureBoundingBox(solid);solid=translate(min.map(v=>-v),solid);files[a.name+'.stl']=stl(solid);}files['BOM.json']=strToU8(JSON.stringify(bom,null,2));files['BOM.csv']=strToU8('file,quantity,x_mm,y_mm,z_mm\n'+bom.map(a=>[a.file,a.quantity,...a.bounds_mm].join(',')).join('\n'));files['settings.json']=strToU8(JSON.stringify(p,null,2));files['assembly.md']=strToU8(INSTRUCTIONS);return zipSync(files,{level:6});}
export const INSTRUCTIONS=`# mboxeditor · assembly / 組裝\nAll dimensions mm. Prototype, not load-rated or physically tested.\n1. Print bodies upright flat base down. Print lids top-face down (rotate 180 degrees); tongues face up. Keys upright, pins head-down. No purchased hardware. Suggested 0.4 mm nozzle, 0.2 mm layers, 5 perimeters, 30% infill, PETG. Socket overhangs and lid grooves may require removable supports. Test fit a body/key pair before batch printing.\n2. Place bodies in numbered row, front edges aligned, exactly 2 mm between walls. Socket centres are 25 mm from front; heights common to all boxes.\n3. Drop each double-T bridge into opposing side slots until its bottom seats, 20 mm below body top. Head overlaps the throat by at least 1.4 mm on each side; this resists separation.\n4. Place miniature flat base inside its fixed rectangular cradle. Pocket is W+2 by D+2. Cradle only limits sideways base movement; no vertical clamping. Input full miniature envelope, not only base diameter. Fragile/tall models need independent physical restraint validation.\n5. Slide each lid from the front (y=0), tongues in side grooves, until flush at back. Broad top covers bridge openings. Insert headed lock pin down through lid into front wall; it blocks lid sliding. Remove pins, slide lids out, then lift keys to dismantle.\n6. Carry upright WITH TWO HANDS SUPPORTING ALL BOX BASES. There is no load-bearing handle. Bridges align the kit, not a certified suspended load. Do not lift by a lid, end box or connector. Not inversion-safe: loose pins can withdraw and models can bounce.\nTolerances: adjustable 0.15–0.60 mm per mating face, default 0.30. Socket head 4x10, throat 3x4, depth 20; key height 19.6. Pitch XY 50, gap 2; common body height rounded up 10 mm from tallest model +16. Walls nominal 10, floor 4, lid 3. Lid top extends 3 above body, lock head 5 above. Every exported part ≤250 in XYZ; assembly can be larger. No scaling. PLA creeps in heat; PETG also creeps. Print anisotropy, impact, layer adhesion and actual fit/load capacity untested. Do not leave in hot cars.\n`;
