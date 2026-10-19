import * as THREE from 'three';
import {floorScatter} from './forest-floor.js';

export function addUnderstory(scene,terrain,centers,rand,sites=[],options={}){
 const group=new THREE.Group();group.name='Continuous_grass_moss_and_leaf_understory';scene.add(group);
 const points=floorScatter(terrain),m=new THREE.Object3D(),color=new THREE.Color();
 const bodyTrail={value:Array.from({length:8},()=>new THREE.Vector4(999,999,999,0))};let trailTime=-1,lastTrail=null;
 const wind={value:0},globalHeal={value:0},repairs=[0,1,2].map(()=>({value:new THREE.Vector3(0,0,0)}));
 centers.forEach((c,i)=>{if(repairs[i])repairs[i].value.set(c.x,c.z,0);});
 function livingMaterial(base,bloom=false){
  const mat=new THREE.MeshStandardMaterial({color:base,side:THREE.DoubleSide,roughness:1,metalness:0,envMapIntensity:0});
  mat.customProgramCacheKey=()=>`living-meadow-v16-${bloom}-${Boolean(options.wetland)}`;
  mat.onBeforeCompile=s=>{
   Object.assign(s.uniforms,{uBodyTrail:bodyTrail,uWind:wind,uGlobalHeal:globalHeal,uGrass0:repairs[0],uGrass1:repairs[1],uGrass2:repairs[2]});
   s.vertexShader='uniform vec4 uBodyTrail[8];uniform float uGlobalHeal;uniform vec3 uGrass0;uniform vec3 uGrass1;uniform vec3 uGrass2;uniform float uWind;varying vec3 vFloorRoot;varying float vBladeHeight;\n'+s.vertexShader;
   s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    vBladeHeight=uv.y;
    vFloorRoot=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
    float growth=max(uGlobalHeal,max(uGrass0.z*(1.-smoothstep(1.,7.,distance(vFloorRoot.xz,uGrass0.xy))),max(uGrass1.z*(1.-smoothstep(1.,7.,distance(vFloorRoot.xz,uGrass1.xy))),uGrass2.z*(1.-smoothstep(1.,7.,distance(vFloorRoot.xz,uGrass2.xy))))));
    ${bloom?'transformed*=smoothstep(.25,.9,growth);':''}
    vec2 bend=vec2(0.);float press=0.;
    for(int j=0;j<8;j++){vec2 delta=vFloorRoot.xz-uBodyTrail[j].xy;float d=length(delta);float weight=(1.-smoothstep(.12,.85,d))*uBodyTrail[j].w;press=max(press,weight);bend+=delta/(d+.12)*weight;}
    vec3 localBend=transpose(mat3(instanceMatrix))*vec3(bend.x,0.,bend.y);
    transformed.xz+=localBend.xz*uv.y*uv.y*.14;
    transformed.y*=1.-press*uv.y*.62;
    transformed.x+=sin(uWind*.85+vFloorRoot.x*.7+vFloorRoot.z*.47)*uv.y*uv.y*.025;`);
   s.fragmentShader='uniform float uGlobalHeal;uniform vec3 uGrass0;uniform vec3 uGrass1;uniform vec3 uGrass2;varying vec3 vFloorRoot;varying float vBladeHeight;\n'+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float heal=max(uGlobalHeal,max(uGrass0.z*(1.-smoothstep(1.,7.,distance(vFloorRoot.xz,uGrass0.xy))),max(uGrass1.z*(1.-smoothstep(1.,7.,distance(vFloorRoot.xz,uGrass1.xy))),uGrass2.z*(1.-smoothstep(1.,7.,distance(vFloorRoot.xz,uGrass2.xy))))));
    ${bloom?'diffuseColor.rgb*=.84+vBladeHeight*.16;':options.wetland?'diffuseColor.rgb*=mix(vec3(.24,.29,.27),vec3(.34,.49,.36),heal)*mix(.58,1.15,vBladeHeight);':'diffuseColor.rgb*=mix(vec3(.22,.20,.14),vec3(.38,.62,.26),heal)*mix(.58,1.15,vBladeHeight);'}`);
  };
  return mat;
 }
 // Each blade is grounded independently, without central star-shaped tufts or planted rows.
 const verts=[],uv=[],indices=[];
 for(let j=0;j<=3;j++){const t=j/3,w=.025*Math.sin(Math.PI*(t*.91+.045))*(1-t*.7);for(const side of [-1,1]){verts.push(.085*t*t+side*w,.28*t-.035*t*t,0);uv.push((side+1)/2,t);}}
 for(let j=0;j<3;j++){const i=j*2;indices.push(i,i+1,i+2,i+1,i+3,i+2);}
 const bladeGeo=new THREE.BufferGeometry();bladeGeo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));bladeGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));bladeGeo.setIndex(indices);bladeGeo.computeVertexNormals();
 const grass=new THREE.InstancedMesh(bladeGeo,livingMaterial('#d2d1b7'),points.length);grass.name='Individually_rooted_meadow_blades';
 points.forEach((p,i)=>{m.position.set(p.x,p.y,p.z);m.rotation.set(0,p.angle,0);m.scale.set(p.scale,p.scale*(.55+Math.abs(Math.sin(p.angle*7))*.6)*(options.wetland&&(terrain.raw(p.x,p.z)??0)<-1.45?.12:1),p.scale);m.updateMatrix();grass.setMatrixAt(i,m.matrix);grass.setColorAt(i,color.setScalar(.75+Math.abs(Math.sin(p.x*17+p.z*31))*.25));});
 grass.receiveShadow=true;grass.computeBoundingSphere();group.add(grass);
 // Creeping round leaves fill the layer below the taller blades.
 const leafVerts=[0,0,0],leafUV=[.5,0],leafIndices=[];
 for(let i=0;i<=12;i++){const a=i/12*Math.PI*2,r=1+.08*Math.sin(a*3);leafVerts.push(Math.cos(a)*.11*r,.018+Math.sin(a)*.012,Math.sin(a)*.16*r);leafUV.push((Math.cos(a)+1)/2,.7+Math.sin(a)*.25);if(i<12)leafIndices.push(0,i+1,i+2);}
 const leafGeo=new THREE.BufferGeometry();leafGeo.setAttribute('position',new THREE.Float32BufferAttribute(leafVerts,3));leafGeo.setAttribute('uv',new THREE.Float32BufferAttribute(leafUV,2));leafGeo.setIndex(leafIndices);leafGeo.computeVertexNormals();
 const leafCount=Math.floor(points.length/11),creepers=new THREE.InstancedMesh(leafGeo,livingMaterial('#a5a18a'),leafCount);creepers.name='Low_creeping_woodland_leaves';
 for(let i=0;i<leafCount;i++){const p=points[i*11];m.position.set(p.x,p.y+.02,p.z);m.rotation.set(0,p.angle,0);m.scale.setScalar((.45+p.scale*.40)*(options.wetland&&(terrain.raw(p.x,p.z)??0)<-1.45?.18:1));m.updateMatrix();creepers.setMatrixAt(i,m.matrix);}creepers.receiveShadow=true;creepers.computeBoundingSphere();group.add(creepers);
 // Feathered ground ferns occupy the soft understory, including gaps between groves.
 const fernV=[],fernU=[],fernI=[];
 for(let branch=0;branch<3;branch++)for(let j=1;j<=7;j++)for(const side of [-1,1]){
  const t=j/8,a=branch*2.39996,b=t*.32,w=Math.sin(t*Math.PI)*.11;
  const convert=(r,y,off)=>[Math.sin(a)*r+Math.cos(a)*off,y,Math.cos(a)*r-Math.sin(a)*off];
  const v=[convert(b,.38*t-.12*t*t,0),convert(b+.05,.38*t-.12*t*t+.018,side*w),convert(b+.08,.38*t-.12*t*t,0)],k=fernV.length/3;
  v.forEach(p=>{fernV.push(...p);fernU.push(.5,Math.min(1,p[1]/.3));});fernI.push(k,k+1,k+2);
 }
 const fernGeo=new THREE.BufferGeometry();fernGeo.setAttribute('position',new THREE.Float32BufferAttribute(fernV,3));fernGeo.setAttribute('uv',new THREE.Float32BufferAttribute(fernU,2));fernGeo.setIndex(fernI);fernGeo.computeVertexNormals();
 const ferns=new THREE.InstancedMesh(fernGeo,livingMaterial('#aab39a'),1900);ferns.name='Irregular_feathered_ground_ferns';
 for(let i=0;i<1900;i++){const p=points[(i*29)%points.length];m.position.set(p.x,p.y,p.z);m.rotation.set(0,p.angle,0);m.scale.setScalar((.7+p.scale*.7)*(options.wetland&&(terrain.raw(p.x,p.z)??0)<-1.45?.35:1));m.updateMatrix();ferns.setMatrixAt(i,m.matrix);}ferns.computeBoundingSphere();group.add(ferns);
 const lc=document.createElement('canvas');lc.width=lc.height=128;const l=lc.getContext('2d');l.fillStyle='#928364';l.beginPath();l.moveTo(64,2);l.bezierCurveTo(15,32,19,92,64,125);l.bezierCurveTo(108,90,113,28,64,2);l.fill();l.strokeStyle='#63543e';l.lineWidth=2;l.beginPath();l.moveTo(64,5);l.lineTo(64,125);for(let y=25;y<115;y+=15){l.moveTo(64,y);l.lineTo(34,y-15);l.moveTo(64,y);l.lineTo(94,y-15);}l.stroke();const leafMap=new THREE.CanvasTexture(lc);leafMap.colorSpace=THREE.SRGBColorSpace;
 const litter=new THREE.InstancedMesh(new THREE.PlaneGeometry(.20,.33),new THREE.MeshStandardMaterial({map:leafMap,alphaTest:.35,side:THREE.DoubleSide,roughness:1,metalness:0,envMapIntensity:0}),1600);
 for(let i=0;i<1600;i++){const p=points[i%points.length];m.position.set(p.x,p.y+.024,p.z);m.rotation.set(-Math.PI/2,0,p.angle);m.scale.setScalar(p.scale*.8);m.updateMatrix();litter.setMatrixAt(i,m.matrix);}litter.computeBoundingSphere();group.add(litter);
 // Whole flowers grow from their roots after repair: petals, centre and stem share one mesh.
 const fv=[],fu=[],fi=[],fc=[];
 function tri(a,b,c,color){const start=fv.length/3;for(const p of [a,b,c]){fv.push(...p);fu.push(.5,Math.min(1,p[1]/.55));fc.push(...color);}fi.push(start,start+1,start+2);}
 for(let j=0;j<5;j++){const a=j*Math.PI*2/5,b=a+.42,c=a-.42;const root=[Math.cos(a)*.018,.43,Math.sin(a)*.018],tip=[Math.cos(a)*.13,.46+Math.sin(j*2)*.012,Math.sin(a)*.13];tri(root,[Math.cos(b)*.08,.47,Math.sin(b)*.08],tip,[1,1,1]);tri(root,tip,[Math.cos(c)*.08,.47,Math.sin(c)*.08],[.86,.90,.93]);}
 for(let j=0;j<8;j++){const a=j*Math.PI/4,b=(j+1)*Math.PI/4;tri([0,.474,0],[Math.cos(a)*.035,.468,Math.sin(a)*.035],[Math.cos(b)*.035,.468,Math.sin(b)*.035],[.85,.65,.17]);}
 tri([-.009,0,0],[.009,0,0],[.006,.44,0],[.22,.40,.12]);tri([-.009,0,0],[.006,.44,0],[-.006,.44,0],[.22,.40,.12]);
 const flowerGeo=new THREE.BufferGeometry();flowerGeo.setAttribute('position',new THREE.Float32BufferAttribute(fv,3));flowerGeo.setAttribute('uv',new THREE.Float32BufferAttribute(fu,2));flowerGeo.setAttribute('color',new THREE.Float32BufferAttribute(fc,3));flowerGeo.setIndex(fi);flowerGeo.computeVertexNormals();
 const flowerMat=livingMaterial('#ffffff',true);flowerMat.vertexColors=true;const flowers=new THREE.InstancedMesh(flowerGeo,flowerMat,5200),palette=['#eee2b0','#d3b2cf','#b5c8dd','#e6d5c5','#d5b86e'];flowers.name='Spring_bloom_colonies';flowers.frustumCulled=false;group.add(flowers);
 for(let i=0;i<5200;i++){const p=points[(i*7)%points.length],s=.55+p.scale*.7;m.position.set(p.x,p.y,p.z);m.rotation.set(0,p.angle,0);m.scale.set(s,s*(.65+Math.abs(Math.sin(p.z*3.1))*.65),s);m.updateMatrix();flowers.setMatrixAt(i,m.matrix);flowers.setColorAt(i,color.set(palette[Math.floor((Math.sin(p.x*.7+Math.cos(p.z*.4))*.5+.5)*4.99)]));}
 return {update(strengths,ritual,quality,time=0,reduced=false,player=null,jump=0){
  wind.value=reduced?0:time;globalHeal.value=ritual?.9:terrain.continuous?(strengths[0]??0)*.85:0;
  repairs.forEach((r,i)=>r.value.z=strengths[i]??0);
  grass.count=Math.floor(points.length*(quality==='low'?.60:1));creepers.count=Math.floor(leafCount*(quality==='low'?.65:1));
  if(player&&time!==trailTime){
   trailTime=time;
   const grounded=jump<.12&&player.y-(terrain.height(player.x,player.z)??player.y)<.22;
   if(grounded&&(!lastTrail||Math.hypot(player.x-lastTrail.x,player.z-lastTrail.z)>.12)){
    bodyTrail.value.pop();bodyTrail.value.unshift(new THREE.Vector4(player.x,player.z,time,1));lastTrail={x:player.x,z:player.z};
   }
   for(let i=0;i<8;i++){const p=bodyTrail.value[i];p.w=Math.exp(-Math.max(0,time-p.z)*1.35);if(i===0&&grounded&&Math.hypot(player.x-p.x,player.z-p.y)<.2)p.w=1;}
  }
  flowers.count=quality==='low'?3000:5200;
 }};
}
