import * as THREE from 'three';
import {floorScatter} from './forest-floor.js';

export function addUnderstory(scene,terrain,centers,rand,sites=[]){
 const group=new THREE.Group();group.name='Continuous_grass_moss_and_leaf_understory';scene.add(group);
 const points=floorScatter(terrain),m=new THREE.Object3D(),color=new THREE.Color();
 const wind={value:0},globalHeal={value:0},repairs=[0,1,2].map(()=>({value:new THREE.Vector3(0,0,0)}));
 centers.forEach((c,i)=>{if(repairs[i])repairs[i].value.set(c.x,c.z,0);});
 function livingMaterial(base){
  const mat=new THREE.MeshStandardMaterial({color:base,side:THREE.DoubleSide,roughness:1,metalness:0,envMapIntensity:0});
  mat.onBeforeCompile=s=>{
   Object.assign(s.uniforms,{uWind:wind,uGlobalHeal:globalHeal,uGrass0:repairs[0],uGrass1:repairs[1],uGrass2:repairs[2]});
   s.vertexShader='uniform float uWind;varying vec3 vFloorRoot;varying float vBladeHeight;\n'+s.vertexShader;
   s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    vBladeHeight=uv.y;
    vFloorRoot=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
    transformed.x+=sin(uWind*.85+vFloorRoot.x*.7+vFloorRoot.z*.47)*uv.y*uv.y*.025;`);
   s.fragmentShader='uniform float uGlobalHeal;uniform vec3 uGrass0;uniform vec3 uGrass1;uniform vec3 uGrass2;varying vec3 vFloorRoot;varying float vBladeHeight;\n'+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float heal=max(uGlobalHeal,max(uGrass0.z*(1.-smoothstep(1.,7.,distance(vFloorRoot.xz,uGrass0.xy))),max(uGrass1.z*(1.-smoothstep(1.,7.,distance(vFloorRoot.xz,uGrass1.xy))),uGrass2.z*(1.-smoothstep(1.,7.,distance(vFloorRoot.xz,uGrass2.xy))))));
    diffuseColor.rgb*=mix(vec3(.22,.20,.14),vec3(.38,.62,.26),heal)*mix(.68,1.14,vBladeHeight);`);
  };
  return mat;
 }
 // Each blade is grounded independently, without central star-shaped tufts or planted rows.
 const verts=[],uv=[],indices=[];
 for(let j=0;j<=3;j++){const t=j/3,w=.025*Math.sin(Math.PI*(t*.91+.045))*(1-t*.7);for(const side of [-1,1]){verts.push(.085*t*t+side*w,.28*t-.035*t*t,0);uv.push((side+1)/2,t);}}
 for(let j=0;j<3;j++){const i=j*2;indices.push(i,i+1,i+2,i+1,i+3,i+2);}
 const bladeGeo=new THREE.BufferGeometry();bladeGeo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));bladeGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));bladeGeo.setIndex(indices);bladeGeo.computeVertexNormals();
 const grass=new THREE.InstancedMesh(bladeGeo,livingMaterial('#d2d1b7'),points.length);grass.name='Individually_rooted_meadow_blades';
 points.forEach((p,i)=>{m.position.set(p.x,p.y,p.z);m.rotation.set(0,p.angle,0);m.scale.set(p.scale,p.scale*(.55+Math.abs(Math.sin(p.angle*7))*.6),p.scale);m.updateMatrix();grass.setMatrixAt(i,m.matrix);grass.setColorAt(i,color.setScalar(.75+Math.abs(Math.sin(p.x*17+p.z*31))*.25));});
 grass.receiveShadow=true;grass.computeBoundingSphere();group.add(grass);
 // Creeping round leaves fill the layer below the taller blades.
 const leafVerts=[0,0,0],leafUV=[.5,0],leafIndices=[];
 for(let i=0;i<=12;i++){const a=i/12*Math.PI*2,r=1+.08*Math.sin(a*3);leafVerts.push(Math.cos(a)*.11*r,.018+Math.sin(a)*.012,Math.sin(a)*.16*r);leafUV.push((Math.cos(a)+1)/2,.7+Math.sin(a)*.25);if(i<12)leafIndices.push(0,i+1,i+2);}
 const leafGeo=new THREE.BufferGeometry();leafGeo.setAttribute('position',new THREE.Float32BufferAttribute(leafVerts,3));leafGeo.setAttribute('uv',new THREE.Float32BufferAttribute(leafUV,2));leafGeo.setIndex(leafIndices);leafGeo.computeVertexNormals();
 const leafCount=Math.floor(points.length/11),creepers=new THREE.InstancedMesh(leafGeo,livingMaterial('#a5a18a'),leafCount);creepers.name='Low_creeping_woodland_leaves';
 for(let i=0;i<leafCount;i++){const p=points[i*11];m.position.set(p.x,p.y+.02,p.z);m.rotation.set(0,p.angle,0);m.scale.setScalar(.45+p.scale*.40);m.updateMatrix();creepers.setMatrixAt(i,m.matrix);}creepers.receiveShadow=true;creepers.computeBoundingSphere();group.add(creepers);
 const lc=document.createElement('canvas');lc.width=lc.height=128;const l=lc.getContext('2d');l.fillStyle='#928364';l.beginPath();l.moveTo(64,2);l.bezierCurveTo(15,32,19,92,64,125);l.bezierCurveTo(108,90,113,28,64,2);l.fill();l.strokeStyle='#63543e';l.lineWidth=2;l.beginPath();l.moveTo(64,5);l.lineTo(64,125);for(let y=25;y<115;y+=15){l.moveTo(64,y);l.lineTo(34,y-15);l.moveTo(64,y);l.lineTo(94,y-15);}l.stroke();const leafMap=new THREE.CanvasTexture(lc);leafMap.colorSpace=THREE.SRGBColorSpace;
 const litter=new THREE.InstancedMesh(new THREE.PlaneGeometry(.20,.33),new THREE.MeshStandardMaterial({map:leafMap,alphaTest:.35,side:THREE.DoubleSide,roughness:1,metalness:0,envMapIntensity:0}),1600);
 for(let i=0;i<1600;i++){const p=points[i%points.length];m.position.set(p.x,p.y+.024,p.z);m.rotation.set(-Math.PI/2,0,p.angle);m.scale.setScalar(p.scale*.8);m.updateMatrix();litter.setMatrixAt(i,m.matrix);}litter.computeBoundingSphere();group.add(litter);
 const flowerGeo=new THREE.SphereGeometry(.05,7,4);flowerGeo.scale(1,.22,1.7);
 const flowers=new THREE.InstancedMesh(flowerGeo,new THREE.MeshStandardMaterial({color:'#cec5a4',roughness:1,metalness:0,envMapIntensity:0}),1200);flowers.frustumCulled=false;group.add(flowers);let flowerState=-1;
 return {update(strengths,ritual,quality,time=0,reduced=false){
  wind.value=reduced?0:time;globalHeal.value=ritual?.9:terrain.continuous?(strengths[0]??0)*.85:0;
  repairs.forEach((r,i)=>r.value.z=strengths[i]??0);
  grass.count=Math.floor(points.length*(quality==='low'?.60:1));creepers.count=Math.floor(leafCount*(quality==='low'?.65:1));
  const state=strengths.reduce((v,n,i)=>v+n*(i+1),ritual?10:0);
  if(Math.abs(state-flowerState)>.035){flowerState=state;for(let i=0;i<240;i++){
   const p=points[i],heal=Math.max(globalHeal.value,...centers.map((c,j)=>(strengths[j]??0)*Math.max(0,1-Math.hypot(p.x-c.x,p.z-c.z)/7)));
   for(let j=0;j<5;j++){const a=j*Math.PI*2/5;m.position.set(p.x+Math.cos(a)*.045,p.y+.24,p.z+Math.sin(a)*.045);m.rotation.set(0,a,0);m.scale.setScalar(Math.max(.001,heal));m.updateMatrix();flowers.setMatrixAt(i*5+j,m.matrix);}
  }flowers.instanceMatrix.needsUpdate=true;}
 }};
}
