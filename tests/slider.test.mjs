import test from 'node:test';
import assert from 'node:assert/strict';
import modeling from '@jscad/modeling';
import {plan,body,lid,releasedLid,B,BAND,lidTabs} from '../src/mechanics.mjs';
import {triangles} from '../src/engine.mjs';
const {intersect}=modeling.booleans,{translate}=modeling.transforms,{measureVolume}=modeling.measurements;
const overlap=(a,b)=>Math.abs(measureVolume(intersect(a,b)));
const fixtures=[{w:5,d:5,h:5,count:1},{w:32,d:32,h:48,count:5,columns:3},{w:227,d:227,h:237,count:1},{w:32.5,d:28.7,h:48.2,count:1}];
test('solid roof covers full cavity shadow without apertures; actual mesh vertical rays',()=>{
 for(const c of [.15,.3,.6])for(const t of fixtures){const b=plan([t],c).boxes[0],s=lid(b,c),ts=triangles(s);
 // A filled thin plane over the ENTIRE cavity proves coverage between sample rays too.
 const plane=B(BAND,BAND,b.h-2*c-.5,b.w-2*BAND,b.d-2*BAND,.05);
 assert.ok(Math.abs(overlap(s,plane)-(b.w-2*BAND)*(b.d-2*BAND)*.05)<.01);
 for(let x=BAND+.01;x<b.w-BAND;x+=Math.max(1,(b.w-2*BAND)/17))for(let y=BAND+.01;y<b.d-BAND;y+=Math.max(1,(b.d-2*BAND)/17)){
  const hits=ts.filter(([a,u,v])=>{const den=(u[1]-v[1])*(a[0]-v[0])+(v[0]-u[0])*(a[1]-v[1]);if(Math.abs(den)<1e-8)return false;const aa=((u[1]-v[1])*(x-v[0])+(v[0]-u[0])*(y-v[1]))/den,bb=((v[1]-a[1])*(x-v[0])+(a[0]-v[0])*(y-v[1]))/den;return aa>=-1e-8&&bb>=-1e-8&&aa+bb<=1+1e-8;});assert.ok(hits.length>=2,'mesh ray must enter and exit solid roof');
 }
 }
});
test('slider final, rail capture, positive end stop, locked tooth and root-pivot release paths',()=>{
 for(const c of [.15,.3,.6])for(const t of fixtures){const b=plan([t],c).boxes[0],wall=body(b,c),roof=lid(b,c),released=releasedLid(b,c);
 assert.ok(overlap(wall,roof)<.0001,'final clearance');
 assert.ok(overlap(wall,translate([0,0,1.8],roof))>.1,'positive rail vertical capture');
 assert.ok(overlap(wall,translate([0,1,0],roof))>.1,'rear end stop');
 assert.ok(overlap(wall,translate([0,-1.5,0],roof))>.01,'locked tooth stops horizontal drift');
 for(let k=0;k<=12;k++)assert.ok(overlap(wall,releasedLid(b,c,.22*k/12))<.0001,'root-pivot manual release sweep');
 for(let y=0;y<=b.d;y+=Math.max(.5,b.d/40))assert.ok(overlap(wall,translate([0,-y,0],released))<.0001,`horizontal insertion/removal at ${y}`);
 for(const m of b.models){const model=B(m.x,m.y,m.z,m.w,m.d,m.h);assert.ok(overlap(released,model)<.0001);}
 const tab=lidTabs(b,c)[0];assert.ok(overlap(tab,B(BAND,BAND,0,b.w-2*BAND,b.d-2*BAND,b.h+5))<.0001,'release is outside cavity');
 }
});
test('front neighbour blocks extraction: detach before opening; free front row has clear path',()=>{
 const p=plan([{w:32,d:32,h:48,count:4,perUnit:1}],.3,{mode:'grid',columns:2}),b=p.boxes[2],front=p.boxes[0],wall=translate([front.x,front.y,0],body(front,.3));
 const moving=translate([b.x,b.y-20,0],releasedLid(b,.3));assert.ok(overlap(wall,moving)>1,'actual front neighbour collision is intentional warning');
 const free=p.boxes[0];for(let y=0;y<=free.d;y+=2)assert.ok(overlap(body(free,.3),translate([0,-y,0],releasedLid(free,.3)))<.0001);
});
