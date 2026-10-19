import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Terrain} from '../src/navigation.js';
import {floorScatter} from '../src/forest-floor.js';
import {lakeLeafLayout} from '../src/lake-ecology.js';
import {gardenHeight} from '../src/garden-data.js';
const first=new Terrain(JSON.parse(fs.readFileSync(new URL('../public/models/terrain_v12.json',import.meta.url))));
const second={radius:35,height:gardenHeight,raw:gardenHeight};
for(const [name,t] of [['forest',first],['valley',second]]){
 const points=floorScatter(t),low=points.slice(0,Math.floor(points.length*.6));
 assert(points.length<125000,'grass budget exceeded');
 for(const p of points){assert(Math.abs(p.y-t.height(p.x,p.z)+.018)<1e-7);assert(t.raw(p.x,p.z)>-2.15);}
 // A 2 m survey quadrat of dry, level ground must remain a meadow even on low quality.
 const bins=new Map();for(const p of low){const key=`${Math.floor(p.x/2)},${Math.floor(p.z/2)}`;bins.set(key,(bins.get(key)??0)+1);}
 let tested=0;for(let x=-28;x<28;x+=2)for(let z=-28;z<28;z+=2){
  const heights=[[0,0],[2,0],[0,2],[2,2],[1,1]].map(([a,b])=>t.height(x+a,z+b));
  if(Math.hypot(x+1,z+1)>30||heights.some(y=>y==null||y<-2.05)||Math.max(...heights)-Math.min(...heights)>.5)continue;
  assert((bins.get(`${x/2},${z/2}`)??0)>=18,`${name}: bare low-quality patch at ${x},${z}`);tested++;
 }assert(tested>80);console.log(`PASS ${name}: ${points.length} rooted blades; ${tested} dry quadrats retain continuous coverage on low detail`);
}
const pads=lakeLeafLayout(first);assert(pads.length>8);
for(const p of pads)for(let j=0;j<36;j++){const a=j*Math.PI/18;assert(first.raw(p.x+Math.sin(a)*(p.r+.06),p.z+Math.cos(a)*(p.r+.06))<-2.50,'lake leaf crosses a dry bank');}
console.log(`PASS ${pads.length} shallow-water leaves stay inside the lake, with no new movement blockers`);
