import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {biomeStudies,biomeHeight,biomeWalkable} from './biome-data.js';
import {addUnderstory} from './meadow.js';
import {floorNoise} from './forest-floor.js';
import {addForestAtmosphere} from './forest-atmosphere.js';
import {addLivingLandmarks} from './living-landmarks.js';
import {woodlandMaterial,organicCap} from './woodland-material.js';
import {breatheGuardian} from './guardian-life.js';
import {buildOcclusionIndex} from './camera-occlusion.js';

export async function createBiomeWorld(canvas,chapter,settings){
 const data=biomeStudies[chapter],height=(x,z)=>biomeHeight(chapter,x,z),scene=new THREE.Scene();scene.background=new THREE.Color(data.color);scene.fog=new THREE.FogExp2(data.color,chapter===4?.018:.023);
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 renderer.debug.onShaderError=(gl,p,v,f)=>{console.error(gl.getProgramInfoLog(p),gl.getShaderInfoLog(v),gl.getShaderInfoLog(f));throw Error('場景材質載入失敗');};
 const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,220),sky=new THREE.HemisphereLight('#d7dfd4','#303e29',1.6),sun=new THREE.DirectionalLight('#eee1bc',2);sun.position.set(-12,25,7);scene.add(sky,sun);
 const draco=new DRACOLoader().setDecoderPath(import.meta.env.BASE_URL+'draco/');draco.setWorkerLimit(2);const loader=new GLTFLoader().setDRACOLoader(draco);let stopped=false;
 try{
 const [avatar,fans]=await Promise.all([loader.loadAsync(import.meta.env.BASE_URL+'models/sprite_guardian_v10.glb'),loader.loadAsync(import.meta.env.BASE_URL+'models/original_fan_leaves_v11.glb')]);draco.dispose();
 let seed=chapter*1933;const random=()=>((seed=seed*16807%2147483647)/2147483647),health={value:.18};
 const earth=new THREE.MeshStandardMaterial({color:'#777c52',roughness:1,metalness:0,envMapIntensity:0});
 earth.onBeforeCompile=s=>{s.uniforms.uHealth=health;s.vertexShader='varying vec3 vEarth;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvEarth=position;');s.fragmentShader=floorNoise+'\nuniform float uHealth;varying vec3 vEarth;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb=woodlandFloor(vEarth.xz,uHealth);');};
 const groundGeo=new THREE.RingGeometry(0,80,192,160);groundGeo.rotateX(-Math.PI/2);const a=groundGeo.attributes.position;for(let i=0;i<a.count;i++)a.setY(i,height(a.getX(i),a.getZ(i)));groundGeo.computeVertexNormals();const ground=new THREE.Mesh(groundGeo,earth);ground.receiveShadow=true;scene.add(ground);
 const terrain={continuous:true,radius:36,raw:height,height:(x,z)=>Math.hypot(x,z)<36&&!(chapter===4&&z>-24&&z<18&&Math.abs(x-(Math.sin(z*.17)*3+2))<.74)?height(x,z):null};
 const surrounding=addForestAtmosphere(scene,random,earth,terrain,fans.scene),cover=addUnderstory(scene,terrain,[],random,data.sites.map(s=>({position:new THREE.Vector3(s.x,0,s.z)}))),landmarks=addLivingLandmarks(scene,terrain,fans.scene,data.sites),solids=[...landmarks.solids],cameraMeshes=[...landmarks.collisionMeshes];
 const templates=[];fans.scene.traverse(o=>{if(o.isMesh)templates.push(o);});const bark=woodlandMaterial('stem'),caps=woodlandMaterial('cap'),livingLeaves=[];
 const make=(geo,mat,pos,scale=null)=>{const mesh=new THREE.Mesh(geo,mat);mesh.position.copy(pos);if(scale)mesh.scale.copy(scale);scene.add(mesh);return mesh;};
 const makeLeaf=(p,r,angle=0)=>{const leaf=templates[Math.floor(random()*templates.length)].clone();leaf.material=leaf.material.clone();leaf.material.roughness=.95;leaf.material.metalness=0;leaf.material.envMapIntensity=.04;leaf.material.side=THREE.DoubleSide;leaf.position.copy(p);leaf.scale.setScalar(r);leaf.rotation.set((random()-.5)*.4,angle,(random()-.5)*.25);scene.add(leaf);livingLeaves.push(leaf);cameraMeshes.push(leaf);return leaf;};
 // Irregular groves with space for the player and every interaction approach.
 for(let i=0;i<42;i++){
  const angle=random()*Math.PI*2,r=17+random()*11,x=Math.sin(angle)*r,z=Math.cos(angle)*r;
  if(data.sites.some(s=>Math.hypot(s.x-x,s.z-z)<4)||Math.hypot(x,z-15)<4)continue;
  const h=height(x,z),H=2.3+random()*3.3,R=1.3+random()*1.4,dx=Math.sin(angle)*.6,dz=Math.cos(angle)*.6;
  makeLeaf(new THREE.Vector3(x+dx,h+H,z+dz),R,angle);
  const curve=new THREE.CubicBezierCurve3(new THREE.Vector3(x,h-.03,z),new THREE.Vector3(x-dx*.2,h+H*.3,z-dz*.2),new THREE.Vector3(x+dx*.5,h+H*.8,z+dz*.5),new THREE.Vector3(x+dx,h+H,z+dz));const stem=make(new THREE.TubeGeometry(curve,20,.12,8,false),bark,new THREE.Vector3());cameraMeshes.push(stem);solids.push({x,z,r:.19});
 }
 for(let i=0;i<30;i++){const angle=random()*6.28,r=19+random()*7,x=Math.sin(angle)*r,z=Math.cos(angle)*r;if(data.sites.some(s=>Math.hypot(s.x-x,s.z-z)<4))continue;const h=.45+random()*1.2,R=.35+random()*.7;make(organicCap(),caps,new THREE.Vector3(x,height(x,z)+h,z),new THREE.Vector3(R,R,R));const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(x,height(x,z)-.02,z),new THREE.Vector3(x+.15,height(x,z)+h*.5,z+.1),new THREE.Vector3(x,height(x,z)+h,z));make(new THREE.TubeGeometry(curve,12,.07,7,false),bark,new THREE.Vector3());solids.push({x,z,r:R+.03});}
 const waterTime={value:0},waterHealth={value:0},waterMat=new THREE.MeshStandardMaterial({color:'#4b7778',roughness:.42,metalness:0,envMapIntensity:.025,side:THREE.DoubleSide});
 waterMat.onBeforeCompile=s=>{s.uniforms.uFlowTime=waterTime;s.uniforms.uFlowHealth=waterHealth;s.vertexShader='varying vec3 vFlow;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFlow=position;');s.fragmentShader=floorNoise+'\nuniform float uFlowTime;uniform float uFlowHealth;varying vec3 vFlow;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat flow=floorNoise(vFlow.xz*3.+vec2(uFlowTime*.15,-uFlowTime*.21));diffuseColor.rgb=mix(vec3(.055,.066,.072),vec3(.035,.13,.12),uFlowHealth)*(.85+flow*.18);');};
 // Chapter-specific silhouettes are built in world space, rather than flat chapter cards.
 const butterflies=[];
 if(chapter===3){
  const shape=new THREE.Shape();shape.moveTo(0,0);shape.bezierCurveTo(.18,.45,.58,.43,.52,.13);shape.bezierCurveTo(.51,-.10,.20,-.31,.02,-.13);shape.closePath();const wingGeo=new THREE.ShapeGeometry(shape,10);const wu=wingGeo.attributes.uv,wp=wingGeo.attributes.position;for(let k=0;k<wu.count;k++)wu.setXY(k,wp.getX(k)/.58,(wp.getY(k)+.31)/.76);
  const wc=document.createElement('canvas');wc.width=wc.height=256;const wctx=wc.getContext('2d');wctx.fillStyle='#b99560';wctx.fillRect(0,0,256,256);for(let k=0;k<18;k++){wctx.fillStyle=k%3?'#d4bd89':'#765d42';wctx.globalAlpha=.35;wctx.beginPath();wctx.ellipse(35+(k*47)%200,22+(k*67)%215,7+k%4,12+k%7,k,0,6.28);wctx.fill();}wctx.globalAlpha=.8;wctx.strokeStyle='#443d32';wctx.lineWidth=2;for(let k=0;k<9;k++){wctx.beginPath();wctx.moveTo(0,114);wctx.quadraticCurveTo(80,70+k*10,245,k*31);wctx.stroke();}const wingMap=new THREE.CanvasTexture(wc);wingMap.colorSpace=THREE.SRGBColorSpace;const wingMat=new THREE.MeshStandardMaterial({map:wingMap,roughness:.92,side:THREE.DoubleSide});
  for(let i=0;i<24;i++){const group=new THREE.Group(),wings=[-1,1].map(side=>{const wing=new THREE.Mesh(wingGeo,wingMat);wing.scale.set(side,.85,1);group.add(wing);return wing;});const body=new THREE.Mesh(new THREE.CapsuleGeometry(.025,.16,3,6),new THREE.MeshStandardMaterial({color:'#51483b',roughness:1}));group.add(body);scene.add(group);butterflies.push({group,wings,phase:i*2.39996});}
  for(const s of data.sites)for(let j=0;j<3;j++){
   const x=s.x+Math.sin(j*2.4)*2.1,z=s.z+Math.cos(j*2.4)*2.1,H=2.5+j*.5;
   const p=new THREE.Vector3(x,height(x,z)+H,z),curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(x,height(x,z),z),new THREE.Vector3(x+.7,height(x,z)+H*.5,z+.2),p);make(new THREE.TubeGeometry(curve,20,.065,8,false),bark,new THREE.Vector3());solids.push({x,z,r:.12});
   const flower=new THREE.Group();flower.position.copy(p);scene.add(flower);for(let n=0;n<7;n++){const petal=make(new THREE.SphereGeometry(1,20,12),new THREE.MeshStandardMaterial({color:j%2?'#b6b9cd':'#b9a399',roughness:.92,side:THREE.DoubleSide}),new THREE.Vector3());scene.remove(petal);flower.add(petal);petal.position.set(Math.cos(n*6.28/7)*.45,.12,Math.sin(n*6.28/7)*.45);petal.scale.set(.35,.08,.75);petal.rotation.set(.25,n*6.28/7,0);}livingLeaves.push(flower);
  }
 }
 if(chapter===4){
  // Smooth irregular ribbons follow the land's actual slope. No square water tiles.
  const vertices=[],uv=[],index=[];
  for(let i=0;i<=180;i++){const z=-24+i/180*42,x=Math.sin(z*.17)*3+2,w=.55+.16*Math.sin(z*.31+.5);for(const side of [-1,1]){const px=x+side*w;vertices.push(px,height(px,z)+.035,z);uv.push((side+1)/2,i/180);}if(i<180){const k=i*2;index.push(k,k+1,k+2,k+1,k+3,k+2);}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();make(geo,waterMat,new THREE.Vector3());
  for(let i=0;i<7;i++){
   const angle=i*2.39996,r=37+random()*15,x=Math.sin(angle)*r,z=Math.cos(angle)*r,y=1+random()*7,R=4+random()*4;
   const islandGeo=new THREE.SphereGeometry(1,40,24),ip=islandGeo.attributes.position;for(let k=0;k<ip.count;k++){const px=ip.getX(k),py=ip.getY(k),pz=ip.getZ(k),d=1+.08*Math.sin(px*7+pz*5)*Math.sin(py*5);ip.setXYZ(k,px*d,py>0?py*.6:py*2.2,pz*d);}islandGeo.computeVertexNormals();make(islandGeo,new THREE.MeshStandardMaterial({color:'#666c5c',roughness:1}),new THREE.Vector3(x,y,z),new THREE.Vector3(R,R*.6,R));const top=new THREE.Vector3(x,y+R*.36,z),leafPoint=top.clone().add(new THREE.Vector3(.25,1.6,.15));makeLeaf(leafPoint,R*.65,angle);make(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(top,top.clone().add(new THREE.Vector3(-.2,1,.1)),leafPoint),14,.14,8,false),bark,new THREE.Vector3());
  }
  const z=-24,x=Math.sin(z*.17)*3+2,y=height(x,z);
  const cliff=make(new THREE.SphereGeometry(1,40,24),new THREE.MeshStandardMaterial({color:'#68705d',roughness:1}),new THREE.Vector3(x,y+5,-27),new THREE.Vector3(5.2,5.5,3.3));cameraMeshes.push(cliff);
  const vv=[],ii=[];for(let i=0;i<=60;i++){const t=i/60,xx=x+Math.sin(t*5)*.18,zz=-24.3+.3*t;for(const side of [-1,1])vv.push(xx+side*(.48+.13*Math.sin(t*6)),y+(1-t)*9.9,zz);if(i<60){const k=i*2;ii.push(k,k+1,k+2,k+1,k+3,k+2);}}const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(vv,3));fg.setIndex(ii);fg.computeVertexNormals();make(fg,waterMat,new THREE.Vector3());
  makeLeaf(new THREE.Vector3(x,y+10,-25.8),1.7,.4);
 }
 if(chapter===5){
  const origin=new THREE.Vector3(0,height(0,-8),-8),trunkCurve=new THREE.CatmullRomCurve3([origin,origin.clone().add(new THREE.Vector3(-1,7,.5)),origin.clone().add(new THREE.Vector3(1,15,-.5)),origin.clone().add(new THREE.Vector3(-.7,25,0))]);const trunk=make(new THREE.TubeGeometry(trunkCurve,80,2.1,18,false),bark,new THREE.Vector3());cameraMeshes.push(trunk);solids.push({x:0,z:-8,r:2.15});
  for(let i=0;i<12;i++){const angle=i*2.39996,H=12+(i%4)*2.6,start=trunkCurve.getPoint(H/25),end=origin.clone().add(new THREE.Vector3(Math.sin(angle)*(5+i%3),H+3.6,Math.cos(angle)*(5+i%3)));const branch=make(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(start,start.clone().lerp(end,.55).add(new THREE.Vector3(0,2,0)),end),28,.27,10,false),bark,new THREE.Vector3());cameraMeshes.push(branch);makeLeaf(end,3.1+i%3*.6,angle);}
  for(let i=0;i<7;i++){const angle=i*6.28/7,end=origin.clone().add(new THREE.Vector3(Math.sin(angle)*8,0,Math.cos(angle)*8));end.y=height(end.x,end.z)-.03;const curve=new THREE.CubicBezierCurve3(origin.clone().add(new THREE.Vector3(0,.3,0)),origin.clone().add(new THREE.Vector3(Math.sin(angle)*2,2.4,Math.cos(angle)*2)),end.clone().add(new THREE.Vector3(0,1.6,0)),end);const root=make(new THREE.TubeGeometry(curve,32,.20,9,false),bark,new THREE.Vector3());cameraMeshes.push(root);for(let t=.12;t<=1;t+=.06){const p=curve.getPoint(t);if(p.y-height(p.x,p.z)<1.4)solids.push({x:p.x,z:p.z,r:.20});}}
 }
 const sites=data.sites.map((s,i)=>{make(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(s.x,height(s.x,s.z)-.02,s.z),new THREE.Vector3(s.x-.08,height(s.x,s.z)+.3,s.z),new THREE.Vector3(s.x,height(s.x,s.z)+.45,s.z)),10,.035,6,false),bark,new THREE.Vector3());const leaf=makeLeaf(new THREE.Vector3(s.x,height(s.x,s.z)+.45,s.z),.38,i);const seed=make(new THREE.SphereGeometry(.12,20,12),new THREE.MeshStandardMaterial({color:'#cfca9b',roughness:.85}),new THREE.Vector3(s.x,height(s.x,s.z)+.55,s.z));return {...s,index:i,type:'site',seed,leaf};});
 const npc={x:-3,z:15,name:data.npc,type:'npc'};make(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(npc.x,height(npc.x,npc.z),npc.z),new THREE.Vector3(npc.x-.25,height(npc.x,npc.z)+1,npc.z),new THREE.Vector3(npc.x+.1,height(npc.x,npc.z)+1.8,npc.z)),24,.12,8,false),bark,new THREE.Vector3());makeLeaf(new THREE.Vector3(npc.x+.1,height(npc.x,npc.z)+1.8,npc.z),.55,1);solids.push({x:npc.x,z:npc.z,r:.15});
 const player=new THREE.Group(),guardian=avatar.scene;guardian.scale.setScalar(.65);player.add(guardian);scene.add(player);player.position.set(0,height(0,15),15);const hands=[];guardian.traverse(o=>{if(/Orb_Hand/.test(o.name))hands.push(o);});const life=breatheGuardian(guardian,hands);
 scene.updateMatrixWorld(true);const occlusion=buildOcclusionIndex(cameraMeshes),ray=new THREE.Ray();const velocity=new THREE.Vector3(),move=new THREE.Vector3(),look=new THREE.Vector3(),desired=new THREE.Vector3();let yaw=0,pitch=.30,distance=7,jump=0,jumpV=0,space=false,camTimer=0,camDistance=7;
 const bodyRay=new THREE.Ray(),down=new THREE.Vector3(0,-1,0);
 function canMove(x,z){
  if(!biomeWalkable(chapter,x,z,solids))return false;
  // Probe the visible lower leaf surfaces, including the small interaction plants.
  // A stem footprint alone cannot protect a player from an overhanging leaf.
  for(const [dx,dz] of [[0,0],[.19,0],[-.19,0],[0,.19],[0,-.19]]){
   bodyRay.origin.set(x+dx,height(x,z)+1.64,z+dz);bodyRay.direction.copy(down);
   if(occlusion.nearest(bodyRay,.02,1.53)!=null)return false;
  }
  return true;
 }
 function resize(){renderer.setPixelRatio(Math.min(devicePixelRatio,settings.quality==='low'?1:1.5));renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}resize();
 function update(dt,time,input,active,state){
  if(stopped)return;const x=Number(input.has('KeyD')||input.has('ArrowRight'))-Number(input.has('KeyA')||input.has('ArrowLeft')),z=Number(input.has('KeyS')||input.has('ArrowDown'))-Number(input.has('KeyW')||input.has('ArrowUp'));move.set(active?x:0,0,active?z:0);if(move.lengthSq())move.normalize().applyAxisAngle(THREE.Object3D.DEFAULT_UP,yaw).multiplyScalar(settings.speed??3.3);velocity.lerp(move,1-Math.exp(-9*dt));
  if(active){const n=Math.max(1,Math.ceil(velocity.length()*dt/.06));for(let j=0;j<n;j++){const nx=player.position.x+velocity.x*dt/n,nz=player.position.z+velocity.z*dt/n;if(canMove(nx,player.position.z))player.position.x=nx;if(canMove(player.position.x,nz))player.position.z=nz;}if(velocity.lengthSq()>.05){const angle=Math.atan2(velocity.x,velocity.z)-guardian.rotation.y;guardian.rotation.y+=Math.atan2(Math.sin(angle),Math.cos(angle))*(1-Math.exp(-7*dt));}if(input.has('Space')&&!space&&!jump)jumpV=2.2;}
  space=active&&input.has('Space');jumpV-=6.5*dt;jump=Math.max(0,jump+jumpV*dt);if(!jump)jumpV=0;player.position.y=height(player.position.x,player.position.z);life.update(time,dt,velocity,settings.reduced,jump);
  const complete=state.filter(Boolean).length/3;health.value=THREE.MathUtils.damp(health.value,.18+complete*.82,1,dt);waterTime.value=settings.reduced?0:time;waterHealth.value=health.value;cover.update([health.value,health.value,health.value],complete===1,settings.quality,time,settings.reduced,player.position,jump);landmarks.update(health.value);surrounding.update(health.value,settings.quality);
  butterflies.forEach(({group,wings,phase},i)=>{const loop=complete===1,r=loop?10:2.2,centre=data.sites[i%3],t=phase+(settings.reduced?0:time*.18);group.position.set((loop?0:centre.x)+Math.sin(t)*r,height((loop?0:centre.x)+Math.sin(t)*r,(loop?-3:centre.z)+Math.cos(t)*r)+1.1+Math.sin(t*2.1)*.45,(loop?-3:centre.z)+Math.cos(t)*r);group.rotation.y=-t;wings.forEach((w,j)=>w.rotation.y=(j?1:-1)*(settings.reduced?.35:Math.sin(time*7+phase)*.75));});
  sites.forEach((s,i)=>{s.seed.material.color.set(state[i]?'#c1d899':'#a99e76');});
  look.copy(player.position).y+=1;desired.set(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));camTimer-=dt;if(camTimer<=0){camTimer=.15;ray.set(look,desired);camDistance=occlusion.nearest(ray,.6,distance)??distance;camDistance=Math.max(1,camDistance-.25);}desired.multiplyScalar(Math.min(distance,camDistance)).add(look);desired.y=Math.max(desired.y,height(desired.x,desired.z)+.5);camera.position.lerp(desired,1-Math.exp(-10*dt));camera.lookAt(look);renderer.render(scene,camera);
 }
 function audit(){const q=[[0,15]],seen=new Set(['0,15']),key=(x,z)=>x+','+z;for(let i=0;i<q.length;i++)for(const [a,b] of [[.5,0],[-.5,0],[0,.5],[0,-.5]]){const x=q[i][0]+a,z=q[i][1]+b,k=key(x,z);if(!seen.has(k)&&canMove(x,z)){seen.add(k);q.push([x,z]);}}return {cells:seen.size,sites:sites.filter(s=>q.some(([x,z])=>Math.hypot(x-s.x,z-s.z)<2)).length};}
 return {player,sites,npc,update,resize,recover(){player.position.set(0,height(0,15),15);velocity.set(0,0,0);jump=jumpV=0;camera.position.copy(player.position).add(new THREE.Vector3(0,4,7));},...(import.meta.env.DEV?{audit,setPosition(x,z){let point=canMove(x,z)?[x,z]:null;for(let i=0;!point&&i<48;i++){const a=i*Math.PI/24,px=x+Math.cos(a)*.65,pz=z+Math.sin(a)*.65;if(canMove(px,pz))point=[px,pz];}if(point){player.position.set(point[0],height(...point),point[1]);velocity.set(0,0,0);}return Boolean(point);}}:{}),rotate(dx,dy){yaw-=dx*.004;pitch=THREE.MathUtils.clamp(pitch+dy*.003,-.08,.95);},zoom(d){distance=THREE.MathUtils.clamp(distance+d*.008,2.8,12);},dispose(){stopped=true;scene.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}});renderer.dispose();renderer.forceContextLoss();}};
 }catch(e){draco.dispose();renderer.dispose();throw e;}
}
