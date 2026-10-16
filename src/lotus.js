import * as THREE from 'three';
import {lotusLayout} from './lotus-layout.js';
export function addLotus(scene,terrain,templates){
 const group=new THREE.Group();group.name='Original_textured_fan_grove';scene.add(group);const collisionMeshes=[],materials=[];const clock={value:0};
 for(let i=0;i<lotusLayout.length;i++){
  const p=lotusLayout[i],ground=terrain.height(p.x,p.z)??terrain.raw(p.x,p.z),leaf=templates[i%templates.length].clone();leaf.material=leaf.material.clone();leaf.material.side=THREE.DoubleSide;leaf.material.roughness=.72;leaf.material.metalness=.09;leaf.material.envMapIntensity=.32;leaf.material.color.set('#c5c5b2');materials.push(leaf.material);
  leaf.position.set(p.x,ground+p.height,p.z);leaf.rotation.set(p.tilt??.12,p.angle,p.roll??.08);leaf.scale.set(p.radius,p.radius,p.radius);leaf.castShadow=leaf.receiveShadow=true;group.add(leaf);collisionMeshes.push(leaf);
  const end=new THREE.Vector3(p.x,ground+p.height,p.z),curve=new THREE.CubicBezierCurve3(new THREE.Vector3(p.x,ground-.045,p.z),new THREE.Vector3(p.x+.06,ground+p.height*.3,p.z-.025),new THREE.Vector3(p.x-.08,ground+p.height*.75,p.z+.04),end);const stem=new THREE.Mesh(new THREE.TubeGeometry(curve,28,.032,8,false),new THREE.MeshStandardMaterial({color:'#6b6650',roughness:.92}));group.add(stem);stem.castShadow=stem.receiveShadow=true;collisionMeshes.push(stem);if(!p.pond)terrain.obstacles.push({x:p.x,z:p.z,radius:.12});
  const phase=i*2.399;leaf.userData.rest={x:leaf.rotation.x,z:leaf.rotation.z,phase};
 }
 return {collisionMeshes,update(time,repair,reduced){clock.value=reduced?0:time;for(const leaf of group.children){if(!leaf.userData.rest)continue;const r=leaf.userData.rest;leaf.rotation.x=r.x+Math.sin(clock.value*.53+r.phase)*.009;leaf.rotation.z=r.z+Math.sin(clock.value*.42+r.phase)*.006;}materials.forEach(m=>m.color.lerpColors(new THREE.Color('#b7b3a1'),new THREE.Color('#b8d49d'),repair));}};
}
