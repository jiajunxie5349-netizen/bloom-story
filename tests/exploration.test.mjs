import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Terrain} from '../src/navigation.js';
import {interactionDistance,nearestInteraction,interactionRange} from '../src/interaction.js';
const dir=new URL('../public/models/',import.meta.url);
const t=new Terrain(JSON.parse(fs.readFileSync(new URL('terrain.json',dir))),JSON.parse(fs.readFileSync(new URL('collisions.json',dir))));t.connect(0,7.5);
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
