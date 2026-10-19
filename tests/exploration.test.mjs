import {canopyLayout} from '../src/canopy-layout.js';
import {lotusLayout} from '../src/lotus-layout.js';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Terrain} from '../src/navigation.js';
import {interactionDistance,nearestInteraction,interactionRange} from '../src/interaction.js';
const dir=new URL('../public/models/',import.meta.url);
const t=new Terrain(JSON.parse(fs.readFileSync(new URL('terrain_v12.json',dir))),JSON.parse(fs.readFileSync(new URL('collisions_v16.json',dir))));t.connect(0,7.5);
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
const fans=JSON.parse(fs.readFileSync(new URL('collisions_v16.json',dir))).plants.filter(p=>p.kind==='fan');assert(fans.length>=12);assert(fans.some(p=>p.height<3));assert(fans.some(p=>p.height>5));for(const p of fans){assert(Math.abs(t.raw(p.x,p.z)-p.y)<.03,'fan root must sit on actual floor');}
console.log('PASS thick folded wetland fans across multiple natural growth levels');

// Prevent the stream from breaking into disconnected polygon puddles at the ford.
const THREE=await import('three');
const {riverPoints}=await import('../src/living-world.js');
const creek=new THREE.CatmullRomCurve3(riverPoints.map(p=>new THREE.Vector3(p[0],p[2],p[1])),false,'catmullrom',.12);
for(let i=0;i<=120;i++){const p=creek.getPoint(i/120);assert(t.raw(p.x,p.z)<p.y-.015,'river bed emerges through its water surface at '+i);}
console.log('PASS continuous creek bed under the water surface across the natural ford');

for(let i=0;i<t.heights.length;i++){const [x,z]=t.coordinates(i);if(Math.hypot(x,z)<34.5)assert(t.heights[i]!=null,'unexpected hole in interior floor');}
const collision=JSON.parse(fs.readFileSync(new URL('collisions_v16.json',dir)));assert(collision.source.includes('exact visible mesh BVH'));const oldBlocked=new Set(JSON.parse(fs.readFileSync(new URL('collisions_v10.json',dir))).blocked);const removed=[...oldBlocked].filter(i=>!t.blocked.has(i)&&t.safe.has(i));assert(removed.length>1000,'old invisible source footprints must become walkable');for(const i of removed){const [x,z]=t.coordinates(i);assert(t.canMove(x,z,t.height(x,z)));}
console.log('PASS continuous interior floor and collisions rebuilt only from current visible geometry');

let dry=0;for(let i=0;i<t.heights.length;i++){const [x,z]=t.coordinates(i);if(t.canMove(x,z,t.height(x,z)))dry++;}assert(t.safe.size/dry>.99,'broad walkable land must not be partitioned by ghost walls');console.log('PASS over 99% of unobstructed dry ground belongs to the main connected walking area');

// Compare accelerated camera queries with Three.js triangle raycasting, including
// negative directions, transformed geometry, grid edges and ignored near hits.
const {buildOcclusionIndex}=await import('../src/camera-occlusion.js');
const props=[];const mat=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
for(let i=0;i<240;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.35+(i%4)*.1,12,8),mat);m.position.set((i%20-10)*2.3,Math.floor(i/20)%4*.7,Math.floor(i/20-6)*2.3);m.rotation.set(i*.1,i*.3,i*.07);m.scale.set(1,.7+i%3*.2,1);m.updateMatrixWorld(true);props.push(m);}
const spatial=buildOcclusionIndex(props),raycaster=new THREE.Raycaster();let acceleratedTests=0;
for(let i=0;i<160;i++){const origin=new THREE.Vector3(Math.sin(i*2.4)*22,1+Math.sin(i*.8),Math.cos(i*1.7)*13),direction=props[i%props.length].position.clone().sub(origin).normalize();raycaster.set(origin,direction);raycaster.far=40;const brute=raycaster.intersectObjects(props,false).find(h=>h.distance>.1)?.distance??null,fast=spatial.nearest(raycaster.ray,.1,40);assert.equal(fast===null,brute===null);if(brute!==null)assert(Math.abs(fast-brute)<.0001,'camera collision mismatch');acceleratedTests+=spatial.lastTested;}
for(const direction of [new THREE.Vector3(1,0,0),new THREE.Vector3(-1,0,0),new THREE.Vector3(0,0,1),new THREE.Vector3(0,1,0)]){raycaster.set(new THREE.Vector3(0,0,0),direction);raycaster.far=30;const brute=raycaster.intersectObjects(props,false).find(h=>h.distance>.1)?.distance??null,fast=spatial.nearest(raycaster.ray,.1,30);assert.equal(fast===null,brute===null);if(brute!==null)assert(Math.abs(fast-brute)<.0001);}
assert(acceleratedTests<spatial.triangleCount*160*.1,'camera lookup must avoid scanning the whole forest');console.log('PASS camera spatial index matches 164 full-mesh rays while testing under 10% of triangles');
