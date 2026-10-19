import * as THREE from 'three';
import {woodlandMaterial} from './woodland-material.js';

// A living root arch frames each ecological place; its open centre stays walkable.
export function addLivingLandmarks(scene,terrain,source,places){
 const group=new THREE.Group();group.name='Grown_root_and_folded_leaf_landmarks';scene.add(group);
 const templates=[];source.traverse(o=>{if(o.isMesh)templates.push(o);});
 const bark=woodlandMaterial('stem'),solids=[],collisionMeshes=[],leaves=[];
 const originalColors=[];
 for(const [i,p] of places.entries()){
  const yaw=(i*2.31+.4),axis=new THREE.Vector3(Math.cos(yaw),0,Math.sin(yaw)),up=terrain.raw(p.x,p.z)??0;
  const centre=new THREE.Vector3(p.x,up+5.0+(i%3)*.45,p.z);
  for(const side of [-1,1]){
   const x=p.x+axis.x*side*3.25,z=p.z+axis.z*side*3.25,h=terrain.height(x,z);
   if(h==null)continue;
   const foot=new THREE.Vector3(x,h-.035,z),a=foot.clone().add(new THREE.Vector3(axis.x*side*.55,2.4,axis.z*side*.55)),b=centre.clone().addScaledVector(axis,side*1.7);
   const curve=new THREE.CubicBezierCurve3(foot,a,b,centre),geo=new THREE.TubeGeometry(curve,32,.13,9,false),root=new THREE.Mesh(geo,bark);root.castShadow=root.receiveShadow=true;group.add(root);collisionMeshes.push(root);
   for(let t=0;t<.40;t+=.06){const v=curve.getPoint(t);if(v.y-h<1.75)solids.push({x:v.x,z:v.z,r:.14,radius:.14});}
   for(let j=0;j<3;j++){
    const v=curve.getPoint(.64+j*.12),leaf=templates[(i+j)%templates.length].clone();leaf.material=leaf.material.clone();leaf.material.side=THREE.DoubleSide;leaf.material.metalness=0;leaf.material.roughness=.96;leaf.material.envMapIntensity=.035;
    const R=1.05+j*.33;leaf.position.copy(v).add(new THREE.Vector3(Math.sin(j*2.4)*.45,.20,Math.cos(j*2.4)*.45));leaf.rotation.set(-.12+j*.11,yaw+j*2.1,.13*side);leaf.scale.setScalar(R);const twig=new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(v,leaf.position.clone()),3,.024,5,false),bark);group.add(twig);leaf.receiveShadow=true;group.add(leaf);leaves.push(leaf);originalColors.push(leaf.material.color.clone());collisionMeshes.push(leaf);
   }
  }
 }
 return {group,solids,collisionMeshes,update(health){leaves.forEach((l,i)=>l.material.color.copy(originalColors[i]).multiply(new THREE.Color().lerpColors(new THREE.Color('#928a76'),new THREE.Color('#a7c58b'),health)));}};
}
