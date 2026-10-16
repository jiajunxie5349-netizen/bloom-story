import * as THREE from 'three';
// Inertial movement and small non-synchronous motions keep the silhouette alive.
// Leaf bending is performed on the GPU, with no per-frame geometry allocations.
export function breatheGuardian(model,hands=[]){
 const clock={value:0},stride={value:0};let speed=0,lean=0,handLag=0;
 model.traverse(o=>{if(!o.isMesh||!/Leaf_|Sprout/.test(o.name))return;
  const before=o.material.onBeforeCompile,cache=o.material.customProgramCacheKey?.()??'';
  const m=o.material.clone();o.material=m;m.roughness=.94;m.metalness=0;m.envMapIntensity=.12;
  m.onBeforeCompile=s=>{before?.(s);s.uniforms.uLeafClock=clock;s.uniforms.uLeafStride=stride;s.vertexShader='uniform float uLeafClock;uniform float uLeafStride;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat edge=clamp((1.1-position.y)*.65,0.,1.);float breeze=sin(uLeafClock*1.3+position.y*3.1)+.35*sin(uLeafClock*2.1+position.x*7.);transformed.x+=breeze*edge*(.012+uLeafStride*.008);transformed.z+=sin(uLeafClock*1.05+position.x*5.)*edge*.018+uLeafStride*edge*edge*.025;');};m.customProgramCacheKey=()=> 'living-leaf-v8:'+o.name+cache;
 });
 return {update(time,dt,velocity,reduced,jump=0){
  const target=Math.min(1,Math.hypot(velocity.x,velocity.z)/5);speed=THREE.MathUtils.damp(speed,target,4,dt);lean=THREE.MathUtils.damp(lean,speed*.10,3.8,dt);handLag=THREE.MathUtils.damp(handLag,speed,2.8,dt);clock.value=reduced?0:time;stride.value=reduced?0:speed;
  const breath=reduced?0:Math.sin(time*1.45)*.048+Math.sin(time*.73)*.018;
  model.position.y=1.1+jump+breath+(reduced?0:Math.sin(time*4.4)*speed*.018);
  model.rotation.x=reduced?0:lean+Math.sin(time*.9)*.012;model.rotation.z=reduced?0:Math.sin(time*1.1)*.013*(1-speed*.5);
  model.scale.y=.65*(1+(reduced?0:Math.sin(time*1.45)*.009));
  hands.forEach((h,i)=>{const side=i?1:-1;h.position.set(side*(.29+(reduced?0:Math.sin(time*1.05+i*1.6)*.018)),.12+(reduced?0:Math.sin(time*1.45+i*.8)*.043)-handLag*.035,.36+handLag*.055+(reduced?0:Math.sin(time*1.1+i)*.024));});
 }};
}
