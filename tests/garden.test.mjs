import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GARDEN_KEY,freshGarden,sanitizeGarden,loadGarden,saveGarden,gardenPercent,checkGarden,gardenCanMove,gardenSites,beds} from '../src/garden-data.js';
const empty=freshGarden();assert.equal(gardenPercent(empty),0);assert.equal(checkGarden(0,{}),false);
for(const bad of [null,{}, {done:'0123',awakened:true},{done:[2,3],awakened:true}])assert.deepEqual(sanitizeGarden(bad),empty);
assert.deepEqual(sanitizeGarden({done:[0,2,3],awakened:true}).done,[0]);
const completed={done:[0,1,2,3],awakened:true,position:[0,18]};assert.equal(gardenPercent(sanitizeGarden(completed)),100);
assert.equal(sanitizeGarden({...completed,position:[-7,4]}).position[0],0);
const cache=new Map([['floraverse.save.v2','FIRST_CHAPTER_UNCHANGED']]),storage={getItem:k=>cache.get(k),setItem:(k,v)=>cache.set(k,v)};
assert(saveGarden(storage,completed));assert.deepEqual(loadGarden(storage),completed);assert.equal(cache.get('floraverse.save.v2'),'FIRST_CHAPTER_UNCHANGED');assert(cache.has(GARDEN_KEY));
assert.deepEqual(loadGarden({getItem(){return '{broken';}}),empty);assert.equal(saveGarden({setItem(){throw Error();}},completed),false);
assert(checkGarden(0,{choice:'source'}));assert(!checkGarden(0,{choice:'color'}));
const source={fire:'stop',dust:'clean',leaves:'keep'};assert(checkGarden(1,source));for(const key of Object.keys(source))assert(!checkGarden(1,{...source,[key]:'wrong'}));
assert(checkGarden(2,{turns:[0,1,2],filter:true}));assert(!checkGarden(2,{turns:[0,1,2],filter:false}));assert(!checkGarden(2,{turns:[0,2,1],filter:true}));
assert(checkGarden(3,{mirror:1,choice:'complete'}));assert(!checkGarden(3,{mirror:0,choice:'complete'}));assert(!checkGarden(3,{mirror:1,choice:'light'}));
// Same clearance as the renderer: a narrow player capsule and actual prop radii.
const valid=(x,z)=>gardenCanMove(x,z)&&!gardenSites.some((s,i)=>Math.hypot(x-s.x,z-s.z)<(i===1?.7:.5)+.2);
const key=(x,z)=>`${x},${z}`,q=[[0,18]],seen=new Set([key(0,18)]);
for(let k=0;k<q.length;k++){const [x,z]=q[k];for(const [a,b] of [[.25,0],[-.25,0],[0,.25],[0,-.25]]){const nx=x+a,nz=z+b,id=key(nx,nz);if(!seen.has(id)&&valid(nx,nz)){seen.add(id);q.push([nx,nz]);}}}
for(const site of gardenSites){assert(q.some(([x,z])=>Math.hypot(x-site.x,z-site.z)<2),'unreachable site '+site.name);for(let i=0;i<24;i++){const a=i/24*Math.PI*2,x=site.x+Math.sin(a)*1.7,z=site.z+Math.cos(a)*1.7;assert(valid(x,z),'approach blocked '+site.name);}}
for(const b of beds)assert(!valid(b.x,b.z));assert(!valid(18,0));assert(valid(17,0));
const dir=new URL('../public/models/',import.meta.url),terrain=JSON.parse(fs.readFileSync(new URL('terrain_v11.json',dir))),anchors=JSON.parse(fs.readFileSync(new URL('vegetation_anchors_v8.json',dir)));
assert(anchors.length>200);for(const a of anchors){const i=Math.round((a.z-terrain.min)/terrain.step)*terrain.size+Math.round((a.x-terrain.min)/terrain.step);assert(Math.abs(a.rootY-terrain.heights[i])<.03,'floating root');assert(Math.abs(Math.hypot(a.x,a.z)-30)>=1.7,'walking ring obstructed');}
console.log(`PASS second chapter learning actions, separate saves, ${seen.size} reachable cells, 24 approach angles per site, ${anchors.length} grounded forest assemblies`);

