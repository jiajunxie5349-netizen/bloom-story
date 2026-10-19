import {peripheralLayout} from '../src/living-world.js';
import {canopyLayout} from '../src/canopy-layout.js';
import {lotusLayout} from '../src/lotus-layout.js';
import {mapLayout} from '../src/map-config.js';
import {taskBrief} from '../src/task-guidance.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {freshProgress,sanitizeProgress,stageOf,progressPercent,canUnlock,loadProgress,saveProgress} from '../src/progress.js';
import {Terrain} from '../src/navigation.js';
import {freshPuzzle,checkPuzzle,specimens} from '../src/puzzles.js';
const p=freshProgress();assert.equal(stageOf(p),'survey');assert.equal(canUnlock(p),false);
assert.deepEqual(sanitizeProgress({scanned:[0,0,8,-1,'1'],ritual:true}).scanned,[0]);
p.scanned=[0,1,2];assert.equal(stageOf(p),'survey');assert.equal(progressPercent(p),0);
p.evidence=true;assert.equal(stageOf(p),'isolate');assert.equal(progressPercent(p),15);
p.barriers=[0,1];assert.equal(stageOf(p),'soil');assert.equal(progressPercent(p),35);
p.soils=[0];assert.equal(progressPercent(p),50);p.soils.push(1);assert.equal(progressPercent(p),70);
p.soils.push(2);assert.equal(stageOf(p),'ritual');assert.equal(progressPercent(p),80);assert.equal(canUnlock(p),false);
p.ritual=true;assert.equal(stageOf(p),'reflect');assert.equal(canUnlock(p),true);
p.reflection=true;p.position=[7,4];assert.equal(progressPercent(p),100);assert.equal(stageOf(p),'complete');
assert.deepEqual(sanitizeProgress({...p,evidence:false}).barriers,[]);
assert.equal(sanitizeProgress({...p,soils:[2]}).ritual,false);
let saved=null;const storage={getItem:k=>k.includes('.v2')?saved:null,setItem:(k,v)=>saved=v};assert.equal(saveProgress(storage,p),true);assert.deepEqual(loadProgress(storage),p);
assert.equal(saveProgress({setItem(){throw Error();}},p),false);assert.deepEqual(loadProgress({getItem(){return '{broken';}}),freshProgress());
const migrated=loadProgress({getItem:k=>k.includes('.v1')?JSON.stringify({progress:{...p,evidence:undefined}}):null});assert.equal(canUnlock(migrated),true);assert.equal(migrated.legacyCompleted,true);
const partial=loadProgress({getItem:k=>k.includes('.v1')?JSON.stringify({progress:{scanned:[0,1,2],barriers:[0,1],soils:[0]}}):null});assert.equal(stageOf(partial),'survey');assert.equal(canUnlock(partial),false);assert.deepEqual(partial.scanned,[0,1,2]);
for(const kind of ['evidence','water','cleanup','soil','plants','transfer'])assert.equal(checkPuzzle(kind,freshPuzzle(kind)).ok,false,kind+' must require work');
assert.equal(checkPuzzle('evidence',{source:'B',route:'branch',limit:'repeat'}).ok,true);
const water={source:true,gate:'hold',collected:true,clean:true};assert.equal(checkPuzzle('water',water).ok,true);
assert.equal(checkPuzzle('water',{...water,gate:'downstream'}).ok,false);assert.equal(checkPuzzle('water',{...water,clean:false}).ok,false);assert.equal(checkPuzzle('water',{...water,collected:false}).ok,false);
const items=Object.fromEntries(specimens.map(i=>[i.id,i.destination]));assert.equal(checkPuzzle('cleanup',{items}).ok,true);assert.equal(checkPuzzle('cleanup',{items:{...items,leaves:'collect'}}).ok,false);assert.equal(checkPuzzle('cleanup',{items:{...items,container:'collect'}}).ok,false);
const zones={A:'cover',B:'plant',C:'buffer',D:'keep',E:'isolate'};assert.equal(checkPuzzle('soil',{zones}).ok,true);assert.equal(checkPuzzle('soil',{zones:{...zones,E:'cover'}}).ok,false);
assert.equal(checkPuzzle('plants',{zones:{shade:'shade',slope:'slope',shore:'shore'},habitat:true}).ok,true);assert.equal(checkPuzzle('plants',{zones:{shade:'shore',slope:'slope',shore:'shade'},habitat:true}).ok,false);
assert.equal(checkPuzzle('transfer',{order:['observe','source','restore','monitor'],reason:'data'}).ok,true);assert.equal(checkPuzzle('transfer',{order:['restore','observe','source','monitor'],reason:'data'}).ok,false);
const t=new Terrain(JSON.parse(fs.readFileSync(new URL('../public/models/terrain_v12.json',import.meta.url))),JSON.parse(fs.readFileSync(new URL('../public/models/scene-layout.json',import.meta.url))));for(const p of peripheralLayout){const h=t.raw(p.x,p.z);if(h!=null&&h>=-2.4&&!t.blocked.has(t.index(p.x,p.z)))t.obstacles.push({x:p.x,z:p.z,radius:.42*p.scale});}t.connect(...mapLayout.spawn);
assert(t.safe.size>1000);
const taskPoints=mapLayout.sites.map(s=>[s.x,s.z]);
// Verify actual traversability with the controller's footprint and interpolated height.
const start=t.index(...t.nearest(...mapLayout.spawn)),parents=new Map([[start,-1]]),q=[start];
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
assert(t.blocked.size>100);for(const i of t.blocked){const [x,z]=t.coordinates(i);assert.equal(t.canMove(x,z,t.raw(x,z)),false);}
for(const [x,z] of taskPoints){const path=t.pathTo(...t.nearest(...mapLayout.spawn),...t.nearest(x,z));assert(path.length>0,'missing guide route');assert(path.every(([a,y,b])=>t.canMove(a,b,y)));}
const [ox,oz]=t.nearest(...mapLayout.spawn),oy=t.height(ox,oz);assert(t.canMove(ox,oz,oy));t.obstacles.push({x:ox,z:oz,radius:.45});assert.equal(t.canMove(ox,oz,oy),false);assert.notDeepEqual(t.nearest(ox,oz),[ox,oz]);t.obstacles.pop();assert(t.canMove(ox,oz,oy));
console.log(`PASS progress sequence, 80% gating, save corruption, unavailable storage, ${taskPoints.length} walkable task routes (${parents.size} cells)`);

// The real scene places two solid props at each stone gate after choosing safe task positions.
const scenePoints=taskPoints.map(([x,z],i)=>{const point=t.nearest(x,z);if(i===3)t.obstacles.push({x:point[0]+.9,z:point[1]+.1,radius:.43});return point;});
for(const [x,z] of scenePoints)assert(t.pathTo(...mapLayout.spawn,x,z).length>0,`gate prop obstructs task ${x},${z}`);


const guidance=freshProgress();assert.equal(taskBrief(guidance).target.index,0);guidance.scanned=[0];assert.equal(taskBrief(guidance).target.index,1);guidance.scanned=[0,2];assert.equal(taskBrief(guidance).target.index,1);guidance.scanned=[0,1,2];assert.equal(taskBrief(guidance).target.index,2);guidance.evidence=true;assert.equal(taskBrief(guidance).target.type,'isolate');guidance.barriers=[0,1];for(let i=0;i<3;i++){assert.equal(taskBrief(guidance).target.index,i);assert(taskBrief(guidance).steps.some(s=>s.includes('完成')));guidance.soils.push(i);}assert.equal(taskBrief(guidance).stage,'ritual');guidance.ritual=true;assert.equal(taskBrief(guidance).stage,'reflect');guidance.reflection=true;assert.equal(taskBrief(guidance).target,null);assert(t.safe.size>6000,'expanded terrain should retain substantially more navigable space');
