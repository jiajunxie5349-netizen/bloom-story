import * as THREE from 'three';

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

export function addLakeEcology(scene,terrain){
 const group=new THREE.Group();group.name='Quiet_lake_shallow_leaf_colonies';scene.add(group);
 const positions=[],uvs=[],indices=[],radial=5,sectors=36;
 // Cupped radial veins, scalloped edges and an open notch echo the original giant leaves.
 for(let j=0;j<=radial;j++)for(let i=0;i<=sectors;i++){
  const t=j/radial,a=.12+i/sectors*(Math.PI*2-.24),r=t*(1+.045*Math.sin(a*7)+.025*Math.sin(a*13));
  positions.push(Math.sin(a)*r,.025*t*t+.016*Math.cos(a*12)*t*t,Math.cos(a)*r);uvs.push(i/sectors,t);
  if(j<radial&&i<sectors){const k=j*(sectors+1)+i;indices.push(k,k+sectors+1,k+1,k+1,k+sectors+1,k+sectors+2);}
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();
 const material=new THREE.MeshStandardMaterial({color:'#77745a',roughness:.94,metalness:0,envMapIntensity:.035,side:THREE.DoubleSide});
 material.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  float vein=pow(.5+.5*cos(vUv.x*75.398),18.)*vUv.y;
  diffuseColor.rgb*=.76+vein*.19+.12*sin(vUv.y*31.+sin(vUv.x*33.));`);};
 material.defines={USE_UV:''};
 const pads=lakeLeafLayout(terrain),leaves=new THREE.InstancedMesh(geo,material,pads.length),m=new THREE.Object3D();
 pads.forEach((p,i)=>{m.position.set(p.x,-2.445,p.z);m.rotation.set(0,p.angle,0);m.scale.set(p.r,1,p.r);m.updateMatrix();leaves.setMatrixAt(i,m.matrix);});leaves.receiveShadow=true;leaves.computeBoundingSphere();group.add(leaves);
 const stemMat=new THREE.MeshStandardMaterial({color:'#4e5139',roughness:1});
 for(const p of pads){const stem=new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(p.x-.12,p.bed-.02,p.z),new THREE.Vector3(p.x+.08,(p.bed-2.45)/2,p.z+.1),new THREE.Vector3(p.x,-2.445,p.z)),5,.014,5,false),stemMat);group.add(stem);}
 // Reeds grow from the bed in sparse colonies, leaving the broad water surface readable.
 const reeds=new THREE.InstancedMesh(new THREE.CylinderGeometry(.009,.016,1,5),stemMat,pads.length*3);
 pads.forEach((p,i)=>{for(let j=0;j<3;j++){const a=p.angle+j*2.4,x=p.x+Math.sin(a)*p.r*.6,z=p.z+Math.cos(a)*p.r*.6,bed=terrain.raw(x,z),h=.65+.22*Math.sin(i*17+j);m.position.set(x,bed+h*.5,z);m.rotation.set(.09*Math.sin(a),a,.13*Math.cos(a));m.scale.set(1,h,1);m.updateMatrix();reeds.setMatrixAt(i*3+j,m.matrix);}});reeds.computeBoundingSphere();group.add(reeds);
 return {update(health){material.color.lerpColors(new THREE.Color('#77745a'),new THREE.Color('#6c8c54'),health);}};
}
