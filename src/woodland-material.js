import * as THREE from 'three';
// Pigment uses world-space, multi-scale patches: no UV latitude bands.
export function woodlandMaterial(kind='cap'){
 const m=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:kind==='cap'?.91:.97,metalness:0,envMapIntensity:.02,side:THREE.DoubleSide});
 m.onBeforeCompile=s=>{
  s.vertexShader='varying vec3 vWoodland;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWoodland=(modelMatrix*vec4(transformed,1.)).xyz;\n#ifdef USE_INSTANCING\nvWoodland=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;\n#endif');
  s.fragmentShader=`varying vec3 vWoodland;
float wh(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float wn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(wh(i),wh(i+vec3(1,0,0)),f.x),mix(wh(i+vec3(0,1,0)),wh(i+vec3(1,1,0)),f.x),f.y),mix(mix(wh(i+vec3(0,0,1)),wh(i+vec3(1,0,1)),f.x),mix(wh(i+vec3(0,1,1)),wh(i+vec3(1,1,1)),f.x),f.y),f.z);}
`+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
vec3 p=vWoodland;float pigmentField=wn(p*1.8+wn(p*.8)*2.);float pores=wn(p*68.);float age=wn(p*7.7);float speck=smoothstep(.72,.88,wn(p*31.));
${kind==='cap'?"vec3 pigment=mix(vec3(.075,.083,.069),vec3(.23,.125,.075),pigmentField);pigment=mix(pigment,vec3(.19,.22,.18),smoothstep(.43,.76,wn(p*.75)));pigment=mix(pigment,vec3(.33,.29,.21),speck*.28+smoothstep(.68,.83,age)*.30);":`vec3 pigment=${kind==='stone'?"mix(vec3(.095,.11,.10),vec3(.26,.24,.19),wn(p*2.4+wn(p*8.)))":"mix(vec3(.12,.095,.06),vec3(.26,.22,.14),wn(vec3(p.x*28.,p.y*1.4,p.z*28.)))"};`}
diffuseColor.rgb=pigment*(.86+pores*.25);`);
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nfloat detail=wn(vWoodland*40.);normal=normalize(normal+vec3(dFdx(detail),dFdy(detail),0.)*.22);');
 };m.customProgramCacheKey=()=> 'woodland-pigment-v14-'+kind;return m;
}
export function organicCap(){
 const g=new THREE.LatheGeometry([new THREE.Vector2(.008,.32),new THREE.Vector2(.22,.33),new THREE.Vector2(.49,.25),new THREE.Vector2(.77,.08),new THREE.Vector2(.95,-.07),new THREE.Vector2(1,-.14),new THREE.Vector2(.93,-.19),new THREE.Vector2(.42,-.24),new THREE.Vector2(.06,-.23)],64);
 const a=g.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i),r=Math.hypot(x,z),t=Math.atan2(z,x);const edge=1+.055*Math.sin(t*3+.8)+.025*Math.cos(t*7+1.2)+.018*Math.sin(t*11);a.setXYZ(i,x*edge,a.getY(i)+r*(Math.sin(t*2)*.055+Math.cos(t*5+.3)*.025),z*edge*.88);}g.computeVertexNormals();return g;
}

export function organicRock(){
 const g=new THREE.SphereGeometry(1,56,36),a=g.attributes.position;
 for(let i=0;i<a.count;i++){
  const x=a.getX(i),y=a.getY(i),z=a.getZ(i),d=1+.11*Math.sin(x*9+z*5)*Math.sin(y*7-1)+.07*Math.sin(z*13+y*3)+.055*Math.sin(x*16-y*5);
  a.setXYZ(i,x*d,y*d,z*d);
 }
 g.computeVertexNormals();return g;
}


