import * as THREE from 'three';
// Same folded geometry, distinct surface families. No alpha blending on stone.
export function mineralBotany(root,health){
 const cache=new Map(),materials=[];
 root.traverse(o=>{
  if(!o.isMesh)return;
  const convert=old=>{
   if(cache.has(old))return cache.get(old);
   const n=old.name.toLowerCase();
   const kind=/slate|stem|fibrous/.test(n)?'stone':/trumpet interior/.test(n)?'ivory':/violet/.test(n)?'amber':/umber|wine/.test(n)?'peach':/blue fluted/.test(n)?'blue':'jade';
   const restored={stone:'#435a60',ivory:'#d8c7a5',amber:'#bb863e',peach:'#ba9d72',blue:'#608d9e',jade:'#659e88'}[kind];
   const secondary={stone:'#6c7876',ivory:'#f0e2bf',amber:'#e9c693',peach:'#ead2b6',blue:'#b1c5c7',jade:'#c0cfac'}[kind];
   const m=new THREE.MeshPhysicalMaterial({name:old.name+' · mineral v18',map:old.map,side:old.side,color:old.color,metalness:0,roughness:.91,envMapIntensity:.08,clearcoat:0,ior:1.46,transmission:0});
   const state={m,base:old.color.clone(),restored:new THREE.Color(restored),kind};materials.push(state);
   m.onBeforeCompile=s=>{
    s.uniforms.uBotanyHealth=health;
    s.vertexShader='varying vec3 vMineral;\n'+s.vertexShader;
    s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMineral=position;');
    s.fragmentShader=`uniform float uBotanyHealth;varying vec3 vMineral;
float mh(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float mn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(mh(i),mh(i+vec3(1,0,0)),f.x),mix(mh(i+vec3(0,1,0)),mh(i+vec3(1,1,0)),f.x),f.y),mix(mix(mh(i+vec3(0,0,1)),mh(i+vec3(1,0,1)),f.x),mix(mh(i+vec3(0,1,1)),mh(i+vec3(1,1,1)),f.x),f.y),f.z);}
`+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
vec3 p=vMineral;float mineralField=mn(p*3.7+mn(p*1.1)*2.);float cloud=mn(p*16.);float vein=1.-smoothstep(.018,.05,abs(mn(p*6.2)-.5));
vec3 clearPigment=mix(vec3(${new THREE.Color(restored).toArray().join(',')}),vec3(${new THREE.Color(secondary).toArray().join(',')}),smoothstep(.32,.77,mineralField)*.55);
clearPigment*=.66+cloud*.48;clearPigment+=vein*vec3(.035,.033,.022);
diffuseColor.rgb=mix(diffuseColor.rgb*(.89+mineralField*.18),clearPigment,uBotanyHealth);`);
    s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+(mn(vMineral*11.)-.5)*.10,.23,1.);');
    s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nfloat grain=mn(vMineral*47.);normal=normalize(normal+vec3(dFdx(grain),dFdy(grain),0.)*.055);');
   };m.customProgramCacheKey=()=> 'mineral-botany-v18-'+kind;
   cache.set(old,m);return m;
  };o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);
 });
 return {update(h){for(const {m,kind} of materials){const stone=kind==='stone';m.roughness=THREE.MathUtils.lerp(.91,stone?.78:.34,h);m.clearcoat=stone?0:h*.32;m.clearcoatRoughness=.36;m.envMapIntensity=THREE.MathUtils.lerp(.08,stone?.12:.38,h);}}};
}
