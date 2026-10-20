import test from 'node:test';
import assert from 'node:assert/strict';
import modeling from '@jscad/modeling';
import {plan,makeParts,triangles,DEFAULTS} from '../src/engine.mjs';
import {ports,B,BAND,GAP} from '../src/mechanics.mjs';
const {intersect}=modeling.booleans,{translate}=modeling.transforms,{measureVolume,measureBoundingBox}=modeling.measurements;
const overlap=(a,b)=>Math.abs(measureVolume(intersect(a,b)));
test('reserved rectangular bounds contain every actual surface; models and cavities never enter shared rebate',()=>{
 for(const c of [.15,.3,.6])for(const t of [{w:5,d:5,h:5,count:1},{w:32,d:32,h:48,count:4,perUnit:1},...DEFAULTS,{w:227,d:227,h:237,count:1}]){
 const p=plan([t],c);for(const b of p.boxes){assert.equal((b.w-8)%16,0);assert.ok(ports(b.w).length>=2&&ports(b.d).length>=2);for(const a of makeParts({...p,boxes:[b]})){for(const tri of triangles(a.solid))for(const v of tri){assert.ok(v[0]>=-1e-6&&v[0]<=b.w+1e-6,'no X ears');assert.ok(v[1]>=-1e-6&&v[1]<=b.d+1e-6,'no Y ears');}}for(const m of b.models){assert.ok(m.x>=BAND&&m.y>=BAND);assert.ok(m.x+m.w<=b.w-BAND&&m.y+m.d<=b.d-BAND);}}
 }
});
test('common seam is 8 mm overlapping reservation, not an 8 mm empty gap; every port independently captures',()=>{
 for(const c of [.15,.3,.6]){const p=plan([{w:32,d:32,h:48,count:4,perUnit:1}],c,{mode:'grid',columns:2}),parts=makeParts(p),solid=parts.find(a=>a.role==='body').solid;
 assert.equal(GAP,-8);assert.equal(p.joints.length,4);assert.equal(p.width,104);assert.equal(p.depth,104);
 for(const j of p.joints){const a=p.boxes[j.a],b=p.boxes[j.b],axis=j.axis;assert.equal(axis==='x'?b.x-a.x:b.y-a.y,(axis==='x'?a.w:a.d)-8);
 const aa=translate([a.x,a.y,0],solid),bb=translate([b.x,b.y,0],solid);assert.ok(overlap(aa,bb)<.0001);
 let actual=0;for(const port of ports(axis==='x'?a.d:a.w)){const probe=axis==='x'?B(a.x+a.w-7,a.y+port-3.5,0,9,7,a.h):B(a.x+port-3.5,a.y+a.d-7,0,7,9,a.h);const displaced=translate(axis==='x'?[2,0,0]:[0,2,0],bb);if(overlap(intersect(aa,probe),displaced)>1)actual++;}
 assert.equal(actual,j.count,'joint count must correspond to actual independent solid capture');assert.ok(actual>=2);
 }
 // Whole-body lowering from fully separated height, simultaneously into two neighbours.
 const last=p.boxes[3],moving=translate([last.x,last.y,0],solid);for(let z=0;z<=last.h+4;z+=2)for(const b of p.boxes.slice(0,3))assert.ok(overlap(translate([b.x,b.y,0],solid),translate([0,0,z],moving))<.0001);
 }
});
test('grid plus stack: eight assembled units have no diagonal, seat, lid or wall collisions',()=>{for(const c of [.15,.3,.6]){const p=plan([{w:32,d:32,h:48,count:4,perUnit:1}],c,{mode:'grid',columns:2}),parts=makeParts(p),all=[];for(const layer of [0,1])for(const b of p.boxes)for(const a of parts){const pose=[b.x,b.y,layer*(b.h+3.4)];all.push(translate(pose,a.solid));}for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++)assert.ok(overlap(all[i],all[j])<.0001,'eight-unit grid/stack collision');}});

test('floor remains closed beneath all models; female grooves stop before cavity',()=>{for(const c of [.15,.3,.6]){const p=plan([{w:32,d:32,h:48,count:5,perUnit:5,columns:3,base:25}],c),b=p.boxes[0],body=makeParts(p).find(a=>a.role==='body').solid;for(const m of b.models){const slab=B(m.x,m.y,.2,m.w,m.d,1.5);assert.ok(Math.abs(overlap(body,slab)-m.w*m.d*1.5)<.01);}const [min,max]=measureBoundingBox(body);assert.ok(max[0]-min[0]<250&&max[1]-min[1]<250);}});
