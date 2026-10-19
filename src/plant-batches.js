import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// Bake configured transforms into a few render batches. Editing retains complete plants.
export function batchPlants(root){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),buckets=new Map();
 root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;const key=o.material.uuid+'|'+Object.keys(o.geometry.attributes).sort().join(',')+'|'+!!o.geometry.index;let b=buckets.get(key);if(!b){b={material:o.material,parts:[],sources:[]};buckets.set(key,b);}const g=o.geometry.clone();g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));b.parts.push(g);b.sources.push(o);});
 let count=0;
 for(const b of buckets.values()){const g=mergeGeometries(b.parts,false);if(!g)throw Error('植株繪製批次建立失敗');const mesh=new THREE.Mesh(g,b.material);mesh.name='Configured_plant_batch_'+count++;mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);for(const o of b.sources){o.removeFromParent();o.geometry.dispose();}for(const p of b.parts)p.dispose();}
 return count;
}
