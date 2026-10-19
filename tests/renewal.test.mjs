import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {trailInfluence,growWeight} from '../src/grass-response.js';
import {decisionFeedback} from '../src/decision-feedback.js';
import {biomeStudies,biomeHeight,biomeWalkable} from '../src/biome-data.js';
import {addLivingLandmarks} from '../src/living-landmarks.js';
import {Terrain} from '../src/navigation.js';
import {mapLayout} from '../src/map-config.js';
const trail=[{x:0,z:0,time:1}];
assert(trailInfluence(.2,0,trail,1)>trailInfluence(.2,0,trail,2));
assert.equal(trailInfluence(2,0,trail,1),0);assert.equal(trailInfluence(.2,0,trail,4),0);
assert.equal(growWeight(.18),0);assert.equal(growWeight(1),1);assert(growWeight(.6)>0);
assert.match(decisionFeedback('evidence',{source:'B'},0),/不能認定/);
assert.match(decisionFeedback('soil',{zones:{E:'cover'}},4),/不能/);
assert.match(decisionFeedback('water',{source:true,collected:true,clean:true,gate:'downstream'},1),/其他生命/);
// Check the new visible root footprints alongside the baked vegetation collisions.
const read=name=>JSON.parse(fs.readFileSync(new URL('../public/models/'+name,import.meta.url)));
const t=new Terrain(read('terrain_v12.json'),read('collisions_v14.json'));t.connect(...mapLayout.spawn);
const source=new THREE.Group();source.add(new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshStandardMaterial()));
const places=mapLayout.sites.filter(s=>s.type==='survey');
const roots=addLivingLandmarks(new THREE.Scene(),t,source,places);t.obstacles.push(...roots.solids);t.connect(...mapLayout.spawn);
for(const s of mapLayout.sites)assert(t.pathTo(...mapLayout.spawn,s.x,s.z).length,`new roots block ${s.label}`);
for(const ch of [3,4,5]){
 const d=biomeStudies[ch];assert.equal(d.sites.length,3);
 const queue=[[0,15]],seen=new Set(['0,15']);
 for(let i=0;i<queue.length;i++)for(const [dx,dz] of [[.5,0],[-.5,0],[0,.5],[0,-.5]]){const x=queue[i][0]+dx,z=queue[i][1]+dz,k=x+','+z;if(!seen.has(k)&&biomeWalkable(ch,x,z)){seen.add(k);queue.push([x,z]);}}
 for(const s of d.sites){assert(queue.some(([x,z])=>Math.hypot(x-s.x,z-s.z)<1));assert.equal(s.choices.filter(([v])=>v===s.answer).length,1);assert(s.explain.length>20);}
 assert(!biomeWalkable(ch,40,0));assert(Number.isFinite(biomeHeight(ch,0,0)));
}
console.log('PASS grass recovery, actual bloom growth, decision-specific explanations, root landmark approaches, and chapters 3–5 terrain connectivity');
