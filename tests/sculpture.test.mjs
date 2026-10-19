import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {Terrain} from '../src/navigation.js';
import {mapLayout} from '../src/map-config.js';
const read=n=>fs.readFileSync(new URL('../public/models/'+n,import.meta.url));
const vegetation=read('forest_vegetation_v15.glb');
const collision=JSON.parse(read('collisions_v15.json'));
assert.equal(collision.meshSHA256,createHash('sha256').update(vegetation).digest('hex'),'collision bake must match the exact visible asset');
const gltf=JSON.parse(vegetation.subarray(20,20+vegetation.readUInt32LE(12)).toString());
for(const m of gltf.materials.filter(m=>!m.name.startsWith("Material_"))){
 assert.equal(m.pbrMetallicRoughness.metallicFactor??1,0,'dry vegetation must not become metallic');
 assert((m.pbrMetallicRoughness.roughnessFactor??1)>=.8);
 assert(!m.emissiveFactor?.some(v=>v>0),'plant surfaces should not emit light');
}
const t=new Terrain(JSON.parse(read('terrain_v12.json')),collision);t.connect(...mapLayout.spawn);
const plants=JSON.parse(read('plant_details_v15.json'));
assert.equal(new Set(plants.map(p=>p.kind)).size,7,'all seven plant silhouettes must be present');
assert(plants.length>=45);
for(const p of plants){assert(Math.abs(t.raw(p.x,p.z)-p.rootY)<.03,'no suspended roots');}
// Require real approaches to the requested task, not a path to a distant
// nearest valid cell that could hide a newly blocked interaction location.
for(const s of mapLayout.sites){
 let approaches=0;
 for(let n=0;n<24;n++){
  const a=n*Math.PI/12,x=s.x+Math.cos(a)*1.25,z=s.z+Math.sin(a)*1.25;
  const [nx,nz]=t.nearest(x,z);
  if(Math.hypot(nx-s.x,nz-s.z)<2&&t.pathTo(...mapLayout.spawn,nx,nz).length)approaches++;
 }
 assert(approaches>=12,`${s.label}: insufficient accessible interaction approaches`);
}
console.log(`PASS exact model/collision pairing, nonmetallic plant surfaces, ${plants.length} grounded sculptures and nine accessible task approaches`);
