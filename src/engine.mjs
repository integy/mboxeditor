import modeling from '@jscad/modeling';
import {zipSync,strToU8} from 'fflate';
import {plan,DEFAULTS,body,lid,INSTRUCTIONS} from './mechanics.mjs';
export {plan,DEFAULTS,body,lid,INSTRUCTIONS} from './mechanics.mjs';
const {translate,rotateX}=modeling.transforms;
export function printSolid(part){const s=part.role==='lid'?rotateX(Math.PI,part.solid):part.solid;const [min]=modeling.measurements.measureBoundingBox(s);return translate(min.map(v=>-v),s);}

export function triangles(solid){const ps=modeling.geometries.geom3.toPolygons(modeling.modifiers.generalize({snap:true,simplify:true,triangulate:true},solid));return ps.flatMap(p=>{const a=[];for(let i=1;i<p.vertices.length-1;i++)a.push([p.vertices[0],p.vertices[i],p.vertices[i+1]]);return a;});}
export function bounds(solid){const [a,b]=modeling.measurements.measureBoundingBox(solid);return b.map((v,i)=>+(v-a[i]).toFixed(3));}
export function makeParts(p){const out=[],map=new Map();const add=(name,solid,pose,role,box)=>{const size=bounds(solid);if(size.some(v=>v>250.001||v<=0))throw Error('Part exceeds 250 mm build envelope');let part=map.get(name);if(!part){part={name,solid,qty:0,size,role,instances:[]};map.set(name,part);out.push(part);}part.qty++;part.instances.push({pose,box});};
 for(const b of p.boxes){const tag=`${b.w}x${b.d}x${b.h}_n${b.models.length}_c${b.columns}_m${b.mini.w}x${b.mini.d}_b${b.base}`;
 add(`body_${tag}`,body(b,p.clearance),[b.x,b.y,b.z],'body',b.id);
 add(`lid_${b.w}x${b.d}x${b.h}`,lid(b,p.clearance),[b.x,b.y,b.z],'lid',b.id);
 }
 return out;
}
export function stl(solid){const ts=triangles(solid);const arr=new Uint8Array(84+ts.length*50),v=new DataView(arr.buffer);v.setUint32(80,ts.length,true);let k=84;for(const t of ts){const u=t[1].map((x,i)=>x-t[0][i]),w=t[2].map((x,i)=>x-t[0][i]),n=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]],len=Math.hypot(...n);for(const x of n){v.setFloat32(k,len?x/len:0,true);k+=4;}for(const pt of t)for(const n of pt){v.setFloat32(k,n,true);k+=4;}k+=2;}return arr;}
export function exportZip(p,parts=makeParts(p)){const files={};const bom=parts.map(({name,qty,size,role,instances})=>({file:name+'.stl',quantity:qty,bounds_mm:size,role,print_orientation:role==='lid'?'top-face down':'base down',instances:instances.map(({box,pose})=>({box,assembly_translation_mm:pose}))}));for(const a of parts){const solid=printSolid(a);files[a.name+'.stl']=stl(solid);}files['BOM.json']=strToU8(JSON.stringify(bom,null,2));files['BOM.csv']=strToU8('file,quantity,x_mm,y_mm,z_mm\n'+bom.map(a=>[a.file,a.quantity,...a.bounds_mm].join(',')).join('\n'));files['settings.json']=strToU8(JSON.stringify(p,null,2));files['assembly.md']=strToU8(INSTRUCTIONS);return zipSync(files,{level:6});}

