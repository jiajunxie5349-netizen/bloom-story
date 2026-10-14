import assert from 'node:assert/strict';
import fs from 'node:fs';
import {freshProgress,sanitizeProgress,stageOf,progressPercent,canUnlock,loadProgress,saveProgress} from '../src/progress.js';
import {Terrain} from '../src/navigation.js';
const p=freshProgress();assert.equal(stageOf(p),'survey');assert.equal(progressPercent(p),0);assert.equal(canUnlock(p),false);
assert.deepEqual(sanitizeProgress({scanned:[0,0,8,-1,'1'],ritual:true,reflection:true}).scanned,[0]);
assert.equal(sanitizeProgress({ritual:true}).ritual,false);
p.scanned=[0,1,2];assert.equal(stageOf(p),'isolate');assert.equal(progressPercent(p),20);
p.barriers=[0,1];assert.equal(stageOf(p),'soil');assert.equal(progressPercent(p),40);
p.soils=[0,1,2];assert.equal(stageOf(p),'ritual');assert.equal(progressPercent(p),60);assert.equal(canUnlock(p),false);
p.ritual=true;assert.equal(stageOf(p),'reflect');assert.equal(progressPercent(p),80);assert.equal(canUnlock(p),true);
p.reflection=true;p.position=[7,4];assert.equal(progressPercent(p),100);assert.equal(stageOf(p),'complete');
let saved;const storage={getItem:()=>saved,setItem:(k,v)=>saved=v};assert.equal(saveProgress(storage,p),true);assert.deepEqual(loadProgress(storage),p);
assert.equal(saveProgress({setItem(){throw Error();}},p),false);assert.deepEqual(loadProgress({getItem(){return '{broken';}}),freshProgress());
const t=new Terrain(JSON.parse(fs.readFileSync(new URL('../public/models/terrain.json',import.meta.url))));t.connect(0,5);
assert(t.safe.size>1000);
const taskPoints=[[7,4],[10,-4],[-7,9],[8,0],[5,9],[11,6],[-6,11],[0,13],[0,8]];
// Verify actual traversability with the controller's footprint and interpolated height.
const start=t.index(...t.nearest(0,5)),parents=new Map([[start,-1]]),q=[start];
for(let k=0;k<q.length;k++){
 const i=q[k],[x,z]=t.coordinates(i),y=t.height(x,z);
 for(const [a,b] of [[.25,0],[-.25,0],[0,.25],[0,-.25]]){
   const j=t.index(x+a,z+b);if(parents.has(j)||!t.safe.has(j))continue;
   let ok=true;
   for(let s=1;s<=5;s++){const xx=x+a*s/5,zz=z+b*s/5;if(!t.canMove(xx,zz,y)){ok=false;break;}}
   if(ok){parents.set(j,i);q.push(j);}
 }
}
for(const [x,z] of taskPoints){const point=t.nearest(x,z),i=t.index(...point);assert(parents.has(i),`unreachable task ${x},${z} -> ${point}`);}
assert.equal(t.canMove(100,100,0),false);
console.log(`PASS progress sequence, 80% gating, save corruption, unavailable storage, ${taskPoints.length} walkable task routes (${parents.size} cells)`);

