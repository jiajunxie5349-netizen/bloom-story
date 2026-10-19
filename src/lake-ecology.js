import * as THREE from 'three';
export function lakeLeafHeight(radius,lowestPoint){return -2.48+.024-lowestPoint*radius+.005;}

export function lakeLeafLayout(terrain,seed=421){
 const random=()=>((seed=seed*16807%2147483647)/2147483647),out=[];
 for(let i=0;i<12000&&out.length<38;i++){
  const x=(random()-.5)*42,z=(random()-.5)*42,r=.28+random()*.38,h=terrain.raw(x,z);
  if(h==null||h> -2.64||h< -4.8||out.some(p=>Math.hypot(p.x-x,p.z-z)<p.r+r+.2))continue;
  if(!Array.from({length:12},(_,j)=>{const a=j*Math.PI/6;return terrain.raw(x+Math.cos(a)*(r+.12),z+Math.sin(a)*(r+.12));}).every(v=>v!=null&&v< -2.58))continue;
  if(!Array.from({length:12},(_,j)=>{const a=j*Math.PI/6;return terrain.raw(x+Math.cos(a)*2.5,z+Math.sin(a)*2.5);}).some(v=>v!=null&&v> -2.3))continue;
  out.push({x,z,r,angle:random()*Math.PI*2,bed:h});
 }
 return out;
}

export function addLakeEcology(scene,terrain,fanSource){
 const group=new THREE.Group();group.name='Textured_folded_shallow_leaves';scene.add(group);
 const pads=lakeLeafLayout(terrain),m=new THREE.Object3D(),materials=[],templates=[];
 fanSource.traverse(o=>{if(o.isMesh)templates.push(o);});
 const types=templates.map(t=>{const geo=t.geometry.clone();geo.scale(1,.09,1);geo.computeVertexNormals();geo.computeBoundingBox();const mat=t.material.clone();mat.side=THREE.DoubleSide;mat.roughness=.96;mat.metalness=0;mat.envMapIntensity=.015;materials.push(mat);const mesh=new THREE.InstancedMesh(geo,mat,Math.ceil(pads.length/templates.length));mesh.receiveShadow=true;group.add(mesh);return mesh;});
 const counts=types.map(()=>0);
 pads.forEach((p,i)=>{const k=i%types.length;m.position.set(p.x,lakeLeafHeight(p.r,types[k].geometry.boundingBox.min.y),p.z);m.rotation.set(0,p.angle,0);m.scale.setScalar(p.r);m.updateMatrix();types[k].setMatrixAt(counts[k]++,m.matrix);});types.forEach((t,i)=>{t.count=counts[i];t.computeBoundingSphere();});
 return {update(health){materials.forEach(mat=>mat.color.setRGB(.48+health*.12,.48+health*.18,.40+health*.05));}};
}
