import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {Terrain} from '../src/navigation.js';
import {tasks,freshValley,loadValley,saveValley,finishTask,unlocked,completed,finale,sanitizeValley} from '../src/valley-data.js';
import {createModelPreview} from '../src/model-preview.js';
import {ValleyTerrain} from '../src/valley-terrain.js';
import {addValley} from '../src/valley-world.js';
import {mapLayout} from '../src/map-config.js';
import {forestDetailLayout} from '../src/forest-detail-layout.js';
import {peripheralLayout} from '../src/living-world.js';
const base=new Terrain(JSON.parse(fs.readFileSync(new URL('../public/models/terrain_v12.json',import.meta.url))),JSON.parse(fs.readFileSync(new URL('../public/models/scene-layout.json',import.meta.url))));base.connect(0,7.5);
const baseline=JSON.stringify({h:base.heights,b:[...base.blocked]});
const p=freshValley();assert.equal(tasks.length,9);assert.equal(new Set(tasks.map(t=>t.id)).size,9);assert(!finishTask(p,'B1'));assert(!finishTask(p,'A3'));
const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
assert.deepEqual(loadValley(storage,{evidence:true,barriers:[0,1],soils:[0,1,2],position:[0,7.5]}).done,['A1','A2','A3']);
assert.deepEqual(loadValley(storage,{evidence:true,barriers:[0,1],soils:[0,1,2]},{done:[0,1,2,3]}).done,['A1','A2','A3','B1','B2']);
assert.deepEqual(sanitizeValley({done:['C3','B3','A3']}).done,[]);
const terrain=new ValleyTerrain(base);terrain.setProgress(p);assert.equal(terrain.height(0,7.5),base.height(0,7.5));assert(!terrain.allowed(43,-6));assert(!terrain.allowed(14,-66));
for(const id of ['A1','A2'])assert(finishTask(p,id));assert(!unlocked(p,'B'));assert(finishTask(p,'A3'));assert(unlocked(p,'B'));assert(!unlocked(p,'C'));
for(const id of ['B1','B2','B3'])assert(finishTask(p,id));assert(unlocked(p,'C'));for(const id of ['C1','C2','C3'])assert(finishTask(p,id));assert(finale(p));assert.equal(completed(p,'C'),3);assert(saveValley(storage,p));assert.deepEqual(loadValley(storage).done,p.done);
const anchors=mapLayout.sites.map(s=>{const [x,z]=base.nearest(s.x,s.z);return {...s,position:new THREE.Vector3(x,base.height(x,z),z),interactionPosition:new THREE.Vector3(x+.7,base.height(x,z)+.2,z)};});
// Match the original A runtime's extra solids before validating the new links.
base.obstacles.push(...forestDetailLayout(base,[...mapLayout.sites,{x:0,z:7.5},{x:-3,z:23},{x:5,z:10}]).solids);
for(const t of anchors.filter(t=>t.type==='isolate'))base.obstacles.push({x:t.position.x+.9,z:t.position.z+.1,radius:.43});
for(const p of peripheralLayout)if((base.raw(p.x,p.z)??-9)>=-2.4&&!base.plantingBlocked.has(base.index(p.x,p.z)))base.obstacles.push({x:p.x,z:p.z,radius:.42*p.scale});
const treeFoot=base.nearest(-3,23);base.obstacles.push({x:treeFoot[0],z:treeFoot[1],radius:.28});
for(const [i,p]of anchors.filter(t=>t.type==='survey').entries()){const yaw=i*2.31+.4,axis=new THREE.Vector3(Math.cos(yaw),0,Math.sin(yaw)),up=base.raw(p.position.x,p.position.z),centre=new THREE.Vector3(p.position.x,up+5+(i%3)*.45,p.position.z);for(const side of [-1,1]){const x=p.position.x+axis.x*side*3.25,z=p.position.z+axis.z*side*3.25,h=base.height(x,z);if(h==null)continue;const foot=new THREE.Vector3(x,h-.035,z),a=foot.clone().add(new THREE.Vector3(axis.x*side*.55,2.4,axis.z*side*.55)),b=centre.clone().addScaledVector(axis,side*1.7),c=new THREE.CubicBezierCurve3(foot,a,b,centre);for(let t=0;t<.4;t+=.06){const v=c.getPoint(t);if(v.y-h<1.75)base.obstacles.push({x:v.x,z:v.z,radius:.14});}}}
base.connect(0,7.5);
const scene=new THREE.Scene(),valley=addValley(scene,base,anchors);assert.equal(valley.targets.length,9);assert.equal(JSON.stringify({h:base.heights,b:[...base.blocked]}),baseline,'A terrain and collision cells must remain identical');
const report=[];
for(const stage of [[],['A1','A2','A3'],['A1','A2','A3','B1','B2','B3'],p.done]){
 const progress={...freshValley(),done:stage};valley.sync(progress);valley.terrain.connect(0,7.5);let count=0;
 for(const t of valley.targets){if(!unlocked(progress,t.region))continue;const end=valley.terrain.pathTo(0,7.5,t.position.x,t.position.z).at(-1);assert(end&&Math.hypot(end[0]-t.position.x,end[2]-t.position.z)<1.3,`blocked ${t.id} at ${stage.length}/9`);let approaches=0;for(let j=0;j<16;j++){const a=j/16*Math.PI*2,x=t.position.x+Math.cos(a)*1.1,z=t.position.z+Math.sin(a)*1.1;if(valley.terrain.canMove(x,z,valley.terrain.height(x,z))&&valley.terrain.safe.has(valley.terrain.index(x,z)))approaches++;}assert(approaches>=4,`too few approaches ${t.id}: ${approaches}`);count++;}
 if(stage.length<3)assert(!valley.terrain.allowed(43,-6));if(stage.length<6)assert(!valley.terrain.allowed(14,-66));report.push({done:stage.length,accessibleTasks:count,safeCells:valley.terrain.safe.size});
}
for(const child of scene.children)child.traverse(o=>{if(o.isMesh){const a=o.geometry.attributes.position.array;assert(a.every(Number.isFinite),'invalid mesh coordinates '+o.name);}});
console.log('PASS single world: nine tasks, strict 3/3 gates, legacy migration, save round trip, A terrain unchanged, all task approaches reachable.',report);

const previewBefore=createModelPreview(false),previewAfter=createModelPreview(true);assert.equal(previewBefore.done.length,0);assert.equal(previewAfter.done.length,9);assert(!unlocked(freshValley(),'B'));assert(!unlocked(freshValley(),'C'));assert(valley.terrain.allowed(43,-6,previewBefore));assert(valley.terrain.allowed(14,-66,previewBefore));assert(valley.terrain.allowed(0,-38,previewBefore));assert.equal(sanitizeValley(previewAfter).preview,undefined);valley.sync(previewBefore);assert.equal(valley.terrain.progress.preview,true);valley.sync(freshValley());assert(!valley.terrain.allowed(43,-6));assert(!valley.terrain.allowed(14,-66));assert.deepEqual(createModelPreview(false).done,[]);console.log('PASS model preview: independent before/after state, all regions accessible, formal gates restored on exit.');

let previewWrites=0;assert.equal(saveValley({setItem(){previewWrites++;}},previewAfter),false);assert.equal(previewWrites,0,'preview must not write player storage');
