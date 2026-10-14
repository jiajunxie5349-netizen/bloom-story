import * as THREE from 'three';
export function addUnderstory(scene,terrain,centers,rand,sites=[]){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
 // Curved silhouettes provide dozens of fine blades per patch without separate meshes.
 for(let i=0;i<85;i++){const x=rand()*256,h=60+rand()*190,w=1+rand()*2.6,bend=(rand()-.5)*90;const g=c.createLinearGradient(0,256,0,256-h);g.addColorStop(0,'#525b36');g.addColorStop(.65,'#9ca77a');g.addColorStop(1,'#cad0a8');c.fillStyle=g;c.beginPath();c.moveTo(x-w,256);c.quadraticCurveTo(x+bend*.3,256-h*.55,x+bend,256-h);c.quadraticCurveTo(x+bend*.15,256-h*.45,x+w,256);c.fill();}
 const grassMap=new THREE.CanvasTexture(canvas);grassMap.colorSpace=THREE.SRGBColorSpace;grassMap.anisotropy=4;
 const verts=[],uv=[],indices=[];
 for(let p=0;p<3;p++){const a=p*Math.PI/3,offset=verts.length/3;for(let j=0;j<=3;j++){const t=j/3;for(const x of [-.42,.42]){verts.push(Math.cos(a)*x+Math.sin(t*1.7)*.035,t*.52,Math.sin(a)*x+t*t*.06);uv.push(x<0?0:1,t);}}for(let j=0;j<3;j++){const i=offset+j*2;indices.push(i,i+1,i+2,i+1,i+3,i+2);}}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 const wind={value:0},material=new THREE.MeshStandardMaterial({map:grassMap,alphaTest:.42,side:THREE.DoubleSide,roughness:1,alphaToCoverage:true});
 material.onBeforeCompile=s=>{s.uniforms.uWind=wind;s.vertexShader='uniform float uWind;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x+=sin(uWind*.8+instanceMatrix[3].x*2.+instanceMatrix[3].z)*uv.y*uv.y*.045;');};
 const grass=new THREE.InstancedMesh(geo,material,7200),m=new THREE.Object3D(),color=new THREE.Color(),items=[];
 function sample(){for(let n=0;n<200;n++){const x=(rand()-.5)*34,z=(rand()-.5)*34,y=terrain.height(x,z);if(y!==null&&terrain.canMove(x,z,y)&&!sites.some(s=>Math.hypot(s.position.x-x,s.position.z-z)<1.4))return new THREE.Vector3(x,y+.018,z);}const [x,z]=terrain.nearest(1,6);return new THREE.Vector3(x,terrain.height(x,z),z);}
 for(let i=0;i<7200;i++){const p=sample(),angle=rand()*6.28,scale=.7+rand()*.65;items.push({p,angle,scale});m.position.copy(p);m.rotation.set(0,angle,0);m.scale.setScalar(scale*.85);m.updateMatrix();grass.setMatrixAt(i,m.matrix);grass.setColorAt(i,color.setHSL(.14+rand()*.025,.18,.43+rand()*.1));}
 const lc=document.createElement('canvas');lc.width=lc.height=128;const l=lc.getContext('2d');l.fillStyle='#ad8d53';l.beginPath();l.moveTo(64,2);l.bezierCurveTo(15,32,19,92,64,125);l.bezierCurveTo(108,90,113,28,64,2);l.fill();l.strokeStyle='#6c532f';l.lineWidth=2;l.beginPath();l.moveTo(64,5);l.lineTo(64,125);for(let y=25;y<115;y+=15){l.moveTo(64,y);l.lineTo(34,y-15);l.moveTo(64,y);l.lineTo(94,y-15);}l.stroke();const leafMap=new THREE.CanvasTexture(lc);leafMap.colorSpace=THREE.SRGBColorSpace;
 const leaves=new THREE.InstancedMesh(new THREE.PlaneGeometry(.23,.38,3,3),new THREE.MeshStandardMaterial({map:leafMap,alphaTest:.35,side:THREE.DoubleSide,roughness:1}),550);
 for(let i=0;i<550;i++){m.position.copy(sample());m.rotation.set(-Math.PI/2,0,rand()*6.28);m.scale.setScalar(.65+rand()*.6);m.updateMatrix();leaves.setMatrixAt(i,m.matrix);}
 const petal=new THREE.SphereGeometry(.055,7,4);petal.scale(1,.22,1.7);const flowers=new THREE.InstancedMesh(petal,new THREE.MeshStandardMaterial({color:'#e4d7b5',roughness:.9}),1800);
 for(let i=0;i<1800;i++){m.scale.setScalar(.001);m.updateMatrix();flowers.setMatrixAt(i,m.matrix);flowers.setColorAt(i,color.setHSL(i%3===0?.13:.91,.25,.72));}
 scene.add(grass,leaves,flowers);for(const o of [grass,leaves,flowers])o.frustumCulled=false;
 let last=-1;
 return {update(strengths,ritual,quality,time=0,reduced=false){
  wind.value=reduced?0:time;grass.count=quality==='low'?3200:7200;flowers.count=quality==='low'?800:1800;
  const signature=strengths.reduce((s,v,i)=>s+v*(i+1),ritual?10:0);if(Math.abs(signature-last)<.02)return;last=signature;
  items.forEach(({p,angle,scale},i)=>{const heal=Math.max(ritual?.9:0,...centers.map((c,j)=>strengths[j]*Math.max(0,1-p.distanceTo(c)/7)));m.position.copy(p);m.rotation.set(0,angle,0);m.scale.setScalar(scale*(.85+heal*.3));m.updateMatrix();grass.setMatrixAt(i,m.matrix);grass.setColorAt(i,color.setHSL(.14+heal*.1,.18+heal*.22,.43+heal*.07));
   if(i<360){for(let n=0;n<5;n++){const a=n*6.28/5;m.position.copy(p);m.position.x+=Math.cos(a)*.055;m.position.z+=Math.sin(a)*.055;m.position.y+=.18+heal*.05;m.rotation.set(0,a,0);m.scale.setScalar(Math.max(.001,heal));m.updateMatrix();flowers.setMatrixAt(i*5+n,m.matrix);}}
  });grass.instanceMatrix.needsUpdate=true;grass.instanceColor.needsUpdate=true;flowers.instanceMatrix.needsUpdate=true;
 }};
}
