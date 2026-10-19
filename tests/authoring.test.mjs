import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as THREE from 'three';
import {Terrain} from '../src/navigation.js';
import {validateLayout,applyLayout,layoutSignature} from '../src/scene-layout.js';
import {batchPlants} from '../src/plant-batches.js';
import {mineralBotany} from '../src/mineral-botany.js';
import {mapLayout} from '../src/map-config.js';
const read=name=>JSON.parse(fs.readFileSync(new URL('../public/models/'+name,import.meta.url)));
const manifest=read('scene-manifest.json'),layout=read('scene-layout.json'),terrain=new Terrain(read('terrain_v12.json'),layout);
assert.equal(Object.keys(manifest.objects).length,204);validateLayout(layout,manifest,terrain);assert.equal(layoutSignature(layout),layout.layoutSignature);
const glb=fs.readFileSync(new URL('../public/models/forest_vegetation_v18.glb',import.meta.url));assert.equal(crypto.createHash('sha256').update(glb).digest('hex'),manifest.assetSHA256);assert.equal(layout.meshSHA256,manifest.assetSHA256);
const json=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString());const ids=json.nodes.filter(n=>n.extras?.sceneId).map(n=>n.extras.sceneId);assert.equal(new Set(ids).size,204);assert.deepEqual(new Set(ids),new Set(Object.keys(layout.objects)));
assert(json.nodes.some(n=>/Folded_jade|Ivory_rosette|Amber_rosette/.test(n.name??'')||n.extras?.assemblyId));
const invalid=structuredClone(layout),id=ids[0];invalid.objects[id].position=[0,-2,0];assert.throws(()=>validateLayout(invalid,manifest,terrain));invalid.objects[id]=structuredClone(layout.objects[id]);invalid.objects[id].scale=Infinity;assert.throws(()=>validateLayout(invalid,manifest,terrain));invalid.objects[id].scale=1;invalid.assetSHA256='wrong';assert.throws(()=>validateLayout(invalid,manifest,terrain));
terrain.connect(...mapLayout.spawn);for(const site of mapLayout.sites){const path=terrain.pathTo(...mapLayout.spawn,site.x,site.z);assert(path.length);const p=path.at(-1);assert(Math.hypot(p[0]-site.x,p[2]-site.z)<1.7,site.label);}
const root=new THREE.Group(),plant=new THREE.Group();plant.userData.sceneId='test';const material=new THREE.MeshStandardMaterial();plant.add(new THREE.Mesh(new THREE.BoxGeometry(),material));root.add(plant);applyLayout(root,{objects:{test:{position:[2,3,4],yaw:.3,scale:1.2}}});const before=new THREE.Box3().setFromObject(root);assert.equal(batchPlants(root),1);const after=new THREE.Box3().setFromObject(root);assert(before.min.distanceTo(after.min)<1e-5&&before.max.distanceTo(after.max)<1e-5,'batch must preserve actual configured geometry');
const health={value:1},botany=mineralBotany(root,health);botany.update(1);root.traverse(o=>{if(o.isMesh){assert.equal(o.material.metalness,0);assert.equal(o.material.transparent,false);const s={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <color_fragment>\n#include <roughnessmap_fragment>\n#include <normal_fragment_maps>'};o.material.onBeforeCompile(s);assert(!/\bpatch\b/.test(s.fragmentShader));assert(s.fragmentShader.includes('uBotanyHealth'));}});
if(fs.existsSync(new URL('../dist/index.html',import.meta.url))){assert(!fs.existsSync(new URL('../dist/editor.html',import.meta.url)));for(const name of fs.readdirSync(new URL('../dist/assets',import.meta.url)).filter(x=>x.endsWith('.js'))){const text=fs.readFileSync(new URL('../dist/assets/'+name,import.meta.url),'utf8');assert(!text.includes('/__scene/save')&&!text.includes('TransformControls')&&!text.includes('森林場景編輯器'),'authoring code leaked into release');}}
console.log('PASS 204 stable complete plants, exact asset/layout pairing, grounded transforms, preserved render batches, all story approaches, nonmetallic mineral materials and editor-free release');
