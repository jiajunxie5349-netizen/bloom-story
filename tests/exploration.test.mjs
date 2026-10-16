import {canopyLayout} from '../src/canopy-layout.js';
import {lotusLayout} from '../src/lotus-layout.js';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Terrain} from '../src/navigation.js';
import {interactionDistance,nearestInteraction,interactionRange} from '../src/interaction.js';
const dir=new URL('../public/models/',import.meta.url);
const t=new Terrain(JSON.parse(fs.readFileSync(new URL('terrain_v10.json',dir))),JSON.parse(fs.readFileSync(new URL('collisions_v10.json',dir))));canopyLayout.forEach(p=>t.obstacles.push({x:p.x,z:p.z,radius:.14}));lotusLayout.filter(p=>!p.pond).forEach(p=>t.obstacles.push({x:p.x,z:p.z,radius:.12}));t.connect(0,7.5);
let previous=t.height(0,30);
for(let i=0;i<=1440;i++){
 const a=i/1440*Math.PI*2,x=Math.sin(a)*30,z=Math.cos(a)*30;
 assert(t.canMove(x,z,previous),`loop blocked at ${i}: ${x},${z}`);assert(t.safe.has(t.index(x,z)),`loop disconnected ${i}`);previous=t.height(x,z);
}
for(let i=0;i<24;i++){
 const a=i/24*Math.PI*2;assert(t.pathTo(0,7.5,Math.sin(a)*30,Math.cos(a)*30).length,'unreachable perimeter sector '+i);
}
const target={position:{x:0,y:0,z:0},interactionPosition:{x:.7,y:.2,z:0}};
for(let i=0;i<36;i++){const a=i/36*Math.PI*2,p={x:.7+Math.sin(a)*2.3,y:0,z:Math.cos(a)*2.3};assert(interactionDistance(p,target)<interactionRange);assert(nearestInteraction(p,[target]));}
assert.equal(interactionDistance({x:.7,y:5,z:0},target),Infinity);
console.log('PASS entire 1440-step walking loop, 24 perimeter routes, interaction from 36 approach angles and vertical separation');
for(const p of lotusLayout){
 assert(t.raw(p.x,p.z)!=null,'lotus root missing ground');
 if(p.pond){for(let j=0;j<24;j++){const a=j/24*Math.PI*2;const bank=t.raw(p.x+Math.sin(a)*(p.radius+.35),p.z+Math.cos(a)*(p.radius+.35));if(bank!=null&&bank>-2.45)assert(t.raw(p.x,p.z)+p.height-p.radius*.6-bank>2.15,'giant leaf must clear the walking bank');}}
 else {assert(p.height-p.radius*.6>2.15,'leaf must clear the guardian and slight jump');assert(!t.canMove(p.x,p.z,t.height(p.x,p.z)),'stem is solid');}
}
console.log('PASS lotus root supports, pond-edge clearance and overhead walking space');
