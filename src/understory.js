import * as THREE from 'three';
export function addUnderstory(scene,terrain,centers,rand){
 const geometry=new THREE.BufferGeometry(),positions=[];
 for(let blade=0;blade<4;blade++){
  const a=blade*2.4,c=Math.cos(a),s=Math.sin(a),w=.045,h=.25+blade*.065;
  const p=[[-w*c,0,-w*s],[w*c,0,w*s],[.09*c,h,.09*s]];positions.push(...p.flat());
 }
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
 const grassMat=new THREE.MeshStandardMaterial({color:'#72764b',roughness:.94,side:THREE.DoubleSide});
 const grass=new THREE.InstancedMesh(geometry,grassMat,2200),leaf=new THREE.InstancedMesh(new THREE.SphereGeometry(.18,5,3),new THREE.MeshStandardMaterial({color:'#806443',roughness:.96}),350);
 const flowerGeometry=new THREE.BufferGeometry(),fp=[];
 for(let n=0;n<5;n++){const a=n*Math.PI*2/5,c=Math.cos(a),s=Math.sin(a);fp.push(0,.24,0,c*.10-s*.045,.25,s*.10+c*.045,c*.19,.27,s*.19,c*.10+s*.045,.25,s*.10-c*.045,0,.24,0,c*.19,.27,s*.19);}
 flowerGeometry.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));flowerGeometry.computeVertexNormals();
 const flowers=new THREE.InstancedMesh(flowerGeometry,new THREE.MeshStandardMaterial({color:'#ead5b4',roughness:.84,side:THREE.DoubleSide}),450);
 const m=new THREE.Object3D(),items=[],color=new THREE.Color();
 function sample(){for(let n=0;n<100;n++){const x=(rand()-.5)*34,z=(rand()-.5)*34,y=terrain.height(x,z);if(y!==null&&terrain.canMove(x,z,y))return new THREE.Vector3(x,y+.03,z);}const p=terrain.nearest(0,5);return new THREE.Vector3(p[0],terrain.height(...p),p[1]);}
 for(let i=0;i<2200;i++){const p=sample(),angle=rand()*6.28,scale=.6+rand()*.9;items.push({p,angle,scale});m.position.copy(p);m.rotation.set(0,angle,0);m.scale.setScalar(scale*.3);m.updateMatrix();grass.setMatrixAt(i,m.matrix);grass.setColorAt(i,color.setHSL(.13+rand()*.035,.24,.20+rand()*.08));}
 for(let i=0;i<350;i++){m.position.copy(sample());m.rotation.set(rand()*.2,rand()*6.28,rand()*.2);m.scale.set(.7+rand(),.055,.45+rand()*.4);m.updateMatrix();leaf.setMatrixAt(i,m.matrix);leaf.setColorAt(i,color.setHSL(.06+rand()*.06,.28,.2+rand()*.1));}
 for(let i=0;i<450;i++){m.position.copy(items[i*4].p);m.scale.setScalar(.001);m.updateMatrix();flowers.setMatrixAt(i,m.matrix);flowers.setColorAt(i,color.setHSL(i%3===0?.12:i%3===1?.88:.16,.38,.70));}
 scene.add(grass,leaf,flowers);grass.frustumCulled=leaf.frustumCulled=flowers.frustumCulled=false;
 let last=-1;
 return {update(strengths,ritual,quality){
  grass.count=quality==='low'?400:2200;flowers.count=quality==='low'?180:450;
  const signature=strengths.reduce((s,v,i)=>s+v*(i+1),ritual?10:0);if(Math.abs(signature-last)<.02)return;last=signature;
  items.forEach(({p,angle,scale},i)=>{
   const heal=Math.max(ritual?.85:0,...centers.map((c,j)=>strengths[j]*Math.max(0,1-p.distanceTo(c)/7)));
   m.position.copy(p);m.rotation.set(0,angle,0);m.scale.setScalar(scale*(.3+heal*1.2));m.updateMatrix();grass.setMatrixAt(i,m.matrix);grass.setColorAt(i,color.setHSL(.14+heal*.1,.24+heal*.16,.22+heal*.1));
   if(i%4===0&&i/4<450){m.scale.setScalar(Math.max(.001,heal*.9));m.updateMatrix();flowers.setMatrixAt(i/4,m.matrix);}
  });grass.instanceMatrix.needsUpdate=true;grass.instanceColor.needsUpdate=true;flowers.instanceMatrix.needsUpdate=true;
 }};
}
