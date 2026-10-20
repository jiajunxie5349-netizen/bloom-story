import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Terrain} from '../src/navigation.js';
import {forestDetailLayout,touchesSolid} from '../src/forest-detail-layout.js';
import {mapLayout} from '../src/map-config.js';
import {gardenHeight,gardenSites,gardenSpawn,gardenCanMove} from '../src/garden-data.js';
import {peripheralLayout} from '../src/living-world.js';
const t=new Terrain(JSON.parse(fs.readFileSync(new URL('../public/models/terrain_v12.json',import.meta.url))),JSON.parse(fs.readFileSync(new URL('../public/models/scene-layout.json',import.meta.url))));
const sites=[...mapLayout.sites,{x:0,z:7.5},{x:-3,z:23},{x:5,z:10}],a=forestDetailLayout(t,sites);
assert.equal(a.logs.length,11);assert(a.plants.length>120);
assert.deepEqual(a,forestDetailLayout(t,sites),'layout must remain reproducible for local editor validation');
t.obstacles.push(...a.solids);for(const p of peripheralLayout)if((t.raw(p.x,p.z)??-9)>=-2.4&&!t.blocked.has(t.index(p.x,p.z)))t.obstacles.push({x:p.x,z:p.z,radius:.42*p.scale});t.connect(...mapLayout.spawn);
for(const s of mapLayout.sites){const end=t.pathTo(...mapLayout.spawn,s.x,s.z).at(-1);assert(end&&Math.hypot(end[0]-s.x,end[2]-s.z)<1.7,'fallen wood blocks '+s.label);}
for(let i=0;i<24;i++){const angle=i/24*Math.PI*2,x=Math.sin(angle)*30,z=Math.cos(angle)*30;assert(t.pathTo(...mapLayout.spawn,x,z).length,'unreachable woodland sector '+i);}
// Every physically open approach around each task belongs to the same connected land.
for(const s of mapLayout.sites){let approaches=0;for(let j=0;j<24;j++){const angle=j/24*Math.PI*2,x=s.x+Math.sin(angle)*1.8,z=s.z+Math.cos(angle)*1.8;if(!t.canMove(x,z,t.height(x,z)))continue;assert(t.safe.has(t.index(x,z)),'isolated task approach');approaches++;}assert(approaches>=4,'too few task approaches '+s.label);}
let dry=0;for(let i=0;i<t.heights.length;i++){const [x,z]=t.coordinates(i);if(t.canMove(x,z,t.height(x,z)))dry++;}assert(t.safe.size/dry>.99,'new details partition the forest');
for(const l of a.logs){assert(touchesSolid(l.x,l.z,l));assert(!touchesSolid(l.x+Math.cos(l.yaw)*(l.radius+.3),l.z-Math.sin(l.yaw)*(l.radius+.3),l),'capsule must not create a broad invisible box');}
assert(a.plants.some(p=>Math.abs(Math.hypot(p.x,p.z)-30)<.7),'soft plants should cross the former ring gap');
const gt={height:(x,z)=>Math.hypot(x,z)<35?gardenHeight(x,z):null,blocked:new Set(),index:()=>0},b=forestDetailLayout(gt,[...gardenSites,{x:0,z:14},{x:-3,z:14},{x:7,z:-7}],2);
assert.equal(b.logs.length,11);assert(b.plants.length>200);
const seen=new Set(),q=[gardenSpawn],key=(x,z)=>x+','+z;seen.add(key(...gardenSpawn));for(let i=0;i<q.length;i++){const [x,z]=q[i];for(const [dx,dz] of [[.5,0],[-.5,0],[0,.5],[0,-.5]]){const a=x+dx,c=z+dz,k=key(a,c);if(seen.has(k)||!gardenCanMove(a,c)||b.solids.some(s=>touchesSolid(a,c,s,.2)))continue;seen.add(k);q.push([a,c]);}}
for(const s of gardenSites)assert(q.some(([x,z])=>Math.hypot(x-s.x,z-s.z)<1.8),'new valley logs block '+s.name);
console.log(`PASS detailed woodland: ${a.logs.length+b.logs.length} capsule-matched logs, ${a.plants.length+b.plants.length} grounded clusters, nine forest routes, 24 free exploration sectors, five valley approaches`);
