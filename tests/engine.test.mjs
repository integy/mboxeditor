import test from 'node:test';
import assert from 'node:assert/strict';
import {plan,makeParts,exportZip,triangles} from '../src/engine.mjs';
import {unzipSync,strFromU8} from 'fflate';
test('mixed boxes connect without overlap, exact quantities and bounded actual solids',()=>{
 const p=plan([{name:'Infantry',w:28,d:28,h:40,count:2},{name:'Tank',w:82,d:60,h:72,count:1}],.3);
 assert.equal(p.boxes.length,3); assert.equal(p.joints.length,2);
 for(let i=0;i<p.boxes.length;i++)for(let j=i+1;j<p.boxes.length;j++)assert.ok(p.boxes[i].x+p.boxes[i].w<p.boxes[j].x);
 const parts=makeParts(p); assert.equal(parts.reduce((s,p)=>s+p.qty,0),3*3+2);
 for(const part of parts){ const ts=triangles(part.solid);assert.ok(ts.length>10);const pts=ts.flat(); for(let a=0;a<3;a++){const vs=pts.map(v=>v[a]);assert.ok(Math.max(...vs)-Math.min(...vs)<=250.001);} }
 const zip=unzipSync(exportZip(p,parts));const bom=JSON.parse(strFromU8(zip['BOM.json']));assert.equal(bom.length,parts.length);assert.ok(zip['assembly.md']);
});
test('rejects impossible dimensions instead of scaling',()=>{assert.throws(()=>plan([{name:'Huge',w:240,d:20,h:40,count:1}],.3),/250|large/);assert.throws(()=>plan([{w:20,d:20,h:20,count:0}],.3));});
