import * as THREE from 'three';
export function addUnderstory(scene,terrain,centers,rand,sites=[]){
 // Actual tapered, curved leaf surfaces replace alpha-painted linear cards.
 const verts=[],uv=[],indices=[];
 for(let blade=0;blade<9;blade++){const a=blade*2.39996,bend=.07+.035*Math.sin(blade*1.7),height=.20+(blade%4)*.065,width=.014+(blade%3)*.007,offset=verts.length/3,ox=Math.cos(a)*.075,oz=Math.sin(a)*.075;
 for(let j=0;j<=3;j++){const t=j/3,w=width*Math.sin(Math.PI*(t*.88+.07))*(1-t*.7);for(const side of [-1,1]){verts.push(ox+Math.sin(a)*bend*t*t+Math.cos(a)*side*w,Math.sin(t*1.25)*height,oz+Math.cos(a)*bend*t*t-Math.sin(a)*side*w);uv.push((side+1)/2,t);}}
 for(let j=0;j<3;j++){const i=offset+j*2;indices.push(i,i+1,i+2,i+1,i+3,i+2);}}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 const wind={value:0},material=new THREE.MeshStandardMaterial({color:'#586148',side:THREE.DoubleSide,roughness:1,metalness:0,envMapIntensity:0});
 material.onBeforeCompile=s=>{s.uniforms.uWind=wind;s.vertexShader='uniform float uWind;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x+=sin(uWind*.8+instanceMatrix[3].x*2.+instanceMatrix[3].z)*uv.y*uv.y*.045;');};
 const grass=new THREE.InstancedMesh(geo,material,11000),m=new THREE.Object3D(),color=new THREE.Color(),items=[];
 function sample(){for(let n=0;n<200;n++){const x=(rand()-.5)*70,z=(rand()-.5)*70,y=terrain.raw(x,z);const density=.35+.3*Math.sin(x*.33+Math.sin(z*.25))+.2*Math.cos(z*.41-x*.17);if(rand()>density)continue;if(y!==null&&y>-2.15&&Math.hypot(x,z)<terrain.radius&&!terrain.blocked.has(terrain.index(x,z))&&!sites.some(s=>Math.hypot(s.position.x-x,s.position.z-z)<.65))return new THREE.Vector3(x,(terrain.height(x,z)??y)+.018,z);}const [x,z]=terrain.nearest(1,6);return new THREE.Vector3(x,terrain.height(x,z),z);}
 for(let i=0;i<11000;i++){const p=sample(),angle=rand()*6.28,scale=.7+rand()*.65;items.push({p,angle,scale});m.position.copy(p);m.rotation.set(0,angle,0);m.scale.setScalar(scale*.85);m.updateMatrix();grass.setMatrixAt(i,m.matrix);grass.setColorAt(i,color.setHSL(.14+rand()*.025,.18,.43+rand()*.1));}
 const lc=document.createElement('canvas');lc.width=lc.height=128;const l=lc.getContext('2d');l.fillStyle='#6f5433';l.beginPath();l.moveTo(64,2);l.bezierCurveTo(15,32,19,92,64,125);l.bezierCurveTo(108,90,113,28,64,2);l.fill();l.strokeStyle='#6c532f';l.lineWidth=2;l.beginPath();l.moveTo(64,5);l.lineTo(64,125);for(let y=25;y<115;y+=15){l.moveTo(64,y);l.lineTo(34,y-15);l.moveTo(64,y);l.lineTo(94,y-15);}l.stroke();const leafMap=new THREE.CanvasTexture(lc);leafMap.colorSpace=THREE.SRGBColorSpace;
 const leaves=new THREE.InstancedMesh(new THREE.PlaneGeometry(.23,.38,3,3),new THREE.MeshStandardMaterial({map:leafMap,color:'#77705a',alphaTest:.35,side:THREE.DoubleSide,roughness:1,metalness:0,envMapIntensity:0}),550);
 for(let i=0;i<550;i++){m.position.copy(sample());m.rotation.set(-Math.PI/2,0,rand()*6.28);m.scale.setScalar(.65+rand()*.6);m.updateMatrix();leaves.setMatrixAt(i,m.matrix);}
 const petal=new THREE.SphereGeometry(.055,7,4);petal.scale(1,.22,1.7);const flowers=new THREE.InstancedMesh(petal,new THREE.MeshStandardMaterial({color:'#e4d7b5',roughness:.9}),1800);
 for(let i=0;i<1800;i++){m.scale.setScalar(.001);m.updateMatrix();flowers.setMatrixAt(i,m.matrix);flowers.setColorAt(i,color.setHSL(i%3===0?.13:.91,.25,.72));}
 const reedMaterial=new THREE.MeshStandardMaterial({color:'#63523b',roughness:1});
 const reeds=new THREE.InstancedMesh(new THREE.CylinderGeometry(.012,.019,1,6),reedMaterial,240),heads=new THREE.InstancedMesh(new THREE.CapsuleGeometry(.035,.14,3,7),new THREE.MeshStandardMaterial({color:'#473422',roughness:1}),240);let reedCount=0;
 for(let k=0;k<60;k++){let p=null;for(let n=0;n<500;n++){const x=(rand()-.5)*50,z=(rand()-.5)*50,y=terrain.raw(x,z);if(y!=null&&y>-2.5&&y<-2.15&&Math.hypot(x,z)<26&&[[.7,0],[-.7,0],[0,.7],[0,-.7]].some(([a,b])=>{const h=terrain.raw(x+a,z+b);return h!=null&&h<-2.5;})){p={x,z,y};break;}}if(!p)continue;for(let j=0;j<4;j++){const x=p.x+(rand()-.5)*.28,z=p.z+(rand()-.5)*.28,y=terrain.raw(x,z)??p.y,height=.45+rand()*.5;m.position.set(x,y+height*.5,z);m.rotation.set((rand()-.5)*.18,0,(rand()-.5)*.18);m.scale.set(1,height,1);m.updateMatrix();reeds.setMatrixAt(reedCount,m.matrix);m.position.y=y+height;m.scale.setScalar(.75+rand()*.4);m.updateMatrix();heads.setMatrixAt(reedCount++,m.matrix);}}
 reeds.count=heads.count=reedCount;scene.add(grass,leaves,flowers,reeds,heads);for(const o of [grass,leaves,flowers,reeds,heads])o.frustumCulled=false;
 let last=-1;
 return {update(strengths,ritual,quality,time=0,reduced=false){
  wind.value=reduced?0:time;grass.count=quality==='low'?6500:11000;flowers.count=quality==='low'?800:1800;
  const living=ritual?1:strengths[1]??0;reedMaterial.color.setHSL(.09+living*.14,.26,.10+living*.06);
  const signature=strengths.reduce((s,v,i)=>s+v*(i+1),ritual?10:0);if(Math.abs(signature-last)<.02)return;last=signature;
  items.forEach(({p,angle,scale},i)=>{const heal=Math.max(ritual?.9:0,...centers.map((c,j)=>strengths[j]*Math.max(0,1-p.distanceTo(c)/7)));m.position.copy(p);m.rotation.set(0,angle,0);m.scale.set(scale*(.95+heal*.15),scale*(.65+heal*.65),scale*(.95+heal*.15));m.updateMatrix();grass.setMatrixAt(i,m.matrix);grass.setColorAt(i,color.setHSL(.09+heal*.15,.27+heal*.13,.25+heal*.22));
   if(i<360){for(let n=0;n<5;n++){const a=n*6.28/5;m.position.copy(p);m.position.x+=Math.cos(a)*.055;m.position.z+=Math.sin(a)*.055;m.position.y+=.18+heal*.05;m.rotation.set(0,a,0);m.scale.setScalar(Math.max(.001,heal));m.updateMatrix();flowers.setMatrixAt(i*5+n,m.matrix);}}
  });grass.receiveShadow=true;grass.instanceMatrix.needsUpdate=true;grass.instanceColor.needsUpdate=true;flowers.instanceMatrix.needsUpdate=true;
 }};
}
