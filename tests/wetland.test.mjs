import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {Terrain} from '../src/navigation.js';
import {mapLayout} from '../src/map-config.js';
import {createWetlandHabitat} from '../src/wetland-habitat.js';
import {buildOcclusionIndex} from '../src/camera-occlusion.js';
const read=n=>JSON.parse(fs.readFileSync(new URL('../public/models/'+n,import.meta.url)));
const collision=read('collisions_v16.json'),t=new Terrain(read('terrain_v12.json'),collision);
assert.equal(collision.moduleSHA256,createHash('sha256').update(fs.readFileSync(new URL('../src/wetland-habitat.js',import.meta.url))).digest('hex'),'bake must match the visible procedural habitat');
const habitat=createWetlandHabitat(t);assert.deepEqual(habitat.plants,collision.plants);
assert.equal(new Set(habitat.plants.map(p=>p.kind)).size,7);
assert(habitat.plants.filter(p=>p.kind==='trumpet'&&p.height>7).length>=2,'right bank needs two mature pale trumpets');
for(const m of habitat.collisionMeshes){
 const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++)assert(Number.isFinite(p.getX(i))&&Number.isFinite(p.getY(i))&&Number.isFinite(p.getZ(i)));
 assert.equal(m.material.metalness,0);assert(m.material.roughness>=.42);
}
const backdrop=habitat.group.getObjectByName('Curved_mineral_scenic_enclosure');assert(backdrop);
const pos=backdrop.geometry.attributes.position;for(let i=0;i<pos.count;i++)assert(Math.hypot(pos.getX(i),pos.getZ(i))>t.radius+3,'backdrop must not cut into playable land');
const drawn=[];habitat.group.updateMatrixWorld(true);habitat.group.traverse(o=>{if(o.isMesh)drawn.push(o);});
assert(drawn.length<15,'material batches should avoid hundreds of prop draw calls');
const index=buildOcclusionIndex(drawn),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),normal=new THREE.Vector3(),center=new THREE.Vector3(),ray=new THREE.Ray();let matched=0;
for(const m of habitat.collisionMeshes.filter((_,i)=>i%9===0)){
 const g=m.geometry,p=g.attributes.position,ids=g.index;let hit=false;
 for(let i=3;i<Math.min(ids?.count??p.count,90);i+=3){a.fromBufferAttribute(p,ids?ids.getX(i):i).applyMatrix4(m.matrixWorld);b.fromBufferAttribute(p,ids?ids.getX(i+1):i+1).applyMatrix4(m.matrixWorld);c.fromBufferAttribute(p,ids?ids.getX(i+2):i+2).applyMatrix4(m.matrixWorld);normal.crossVectors(b.clone().sub(a),c.clone().sub(a));if(normal.lengthSq()<.000001)continue;normal.normalize();center.copy(a).add(b).add(c).multiplyScalar(1/3);ray.origin.copy(center).addScaledVector(normal,.12);ray.direction.copy(normal).negate();const distance=index.nearest(ray,.001,.14);if(distance!=null){hit=true;break;}}
 assert(hit,'a physical source surface is missing from the rendered batch');matched++;
}
assert(matched>5);
// Preserve full player-height approaches, rather than only a path to an
// arbitrary nearest cell that could be far from the requested task.
t.connect(...mapLayout.spawn);
for(const s of mapLayout.sites){
 let count=0;
 for(let n=0;n<24;n++){const a=n*Math.PI/12,[x,z]=t.nearest(s.x+Math.cos(a)*1.25,s.z+Math.sin(a)*1.25);if(Math.hypot(x-s.x,z-s.z)<2&&t.pathTo(...mapLayout.spawn,x,z).length)count++;}
 assert(count>=12,s.label+' has too few interaction approaches');
}
// On loading a save inside a new root, recovery must select actual safe land.
const root=habitat.solids.find(s=>s.radius>.7);assert(root);const [x,z]=t.nearest(root.x,root.z);assert(t.canMove(x,z,t.height(x,z)));assert(t.safe.has(t.index(x,z)));
console.log(`PASS wetland source/bake pairing, ${habitat.plants.length} rooted plants, two hero trumpets, finite nonmetallic geometry, exterior backdrop and nine task approaches`);
