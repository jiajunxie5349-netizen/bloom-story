import * as THREE from 'three';
// Small wind waves remain below floating-leaf freeboard (maximum displacement .022 m).
export const lakeWaveGLSL=`
float lakeHeight(vec2 p,float t){return sin(dot(p,vec2(.91,.38))-t*.72)*.011+sin(dot(p,vec2(-.63,1.14))-t*.94)*.007+sin(dot(p,vec2(2.7,1.9))+t*1.2)*.004;}
vec2 lakeSlope(vec2 p,float t){return cos(dot(p,vec2(.91,.38))-t*.72)*.011*vec2(.91,.38)+cos(dot(p,vec2(-.63,1.14))-t*.94)*.007*vec2(-.63,1.14)+cos(dot(p,vec2(2.7,1.9))+t*1.2)*.004*vec2(2.7,1.9);}
`;
export function configureLakeWater(material,time,health,shore){
 material.transparent=true;material.depthWrite=true;material.color.set('white');material.roughness=.22;material.envMapIntensity=.3;
 material.onBeforeCompile=s=>{
  s.uniforms.uWaterTime=time;s.uniforms.uWaterHealth=health;s.uniforms.uShore={value:shore};
  s.vertexShader='uniform float uWaterTime;varying vec3 vWaterWorld;\n'+lakeWaveGLSL+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.y+=lakeHeight(position.xz,uWaterTime);vWaterWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
  s.fragmentShader='uniform float uWaterTime;uniform float uWaterHealth;uniform sampler2D uShore;varying vec3 vWaterWorld;\n'+lakeWaveGLSL+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec2 p=vWaterWorld.xz;float bank=texture2D(uShore,(p+36.)/72.).r;if(bank>.86)discard;
   float depth=max(.01,.57-bank*.65),clear=uWaterHealth;
   float currents=.5+.5*sin(p.x*.63+p.y*.27+sin(p.y*.72-uWaterTime*.08));
   float silt=.5+.5*sin(p.x*1.8+sin(p.y*1.3)*2.-uWaterTime*.07)*sin(p.y*2.1-p.x*.33);
   vec3 toxic=mix(vec3(.018,.012,.026),vec3(.055,.035,.064),currents*.65+silt*.35);
   vec3 pure=mix(vec3(.045,.17,.19),vec3(.18,.36,.32),exp(-depth*4.));
   float sunlight=pow(max(0.,sin(p.x*4.6+sin(p.y*2.1-uWaterTime*.43))*sin(p.y*4.1+sin(p.x*2.7+uWaterTime*.31))),9.);
   float crest=pow(max(0.,sin(p.x*3.7+p.y*2.3+sin(p.y*1.7-uWaterTime*.43))*sin(p.y*3.1-p.x*1.8+uWaterTime*.51)),9.);
   diffuseColor.rgb=mix(toxic,pure+sunlight*vec3(.07,.10,.075)*exp(-depth*4.),clear);
   diffuseColor.rgb+=crest*mix(vec3(.012,.010,.018),vec3(.085,.12,.13),clear);
   // Turbidity removes riverbed visibility; clean shallow water reveals the real submerged ground.
   float fresnel=pow(1.-abs(dot(normalize(vNormal),normalize(vViewPosition))),4.);
   diffuseColor.a=mix(1.,clamp(.30+depth*.85+fresnel*.35,.38,.92),clear);
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec2 slope=lakeSlope(vWaterWorld.xz,uWaterTime);
   slope+=vec2(sin(vWaterWorld.x*12.+vWaterWorld.z*7.-uWaterTime*1.7),cos(vWaterWorld.z*11.-vWaterWorld.x*8.+uWaterTime*1.3))*.03;
   normal=normalize((viewMatrix*vec4(normalize(vec3(-slope.x,1.,-slope.y)),0.)).xyz);
  `);
 };
}
export function addSubmergedStones(scene,terrain){
 const geo=new THREE.IcosahedronGeometry(1,2),mat=new THREE.MeshStandardMaterial({color:'#7a8b80',roughness:.74,metalness:0}),mesh=new THREE.InstancedMesh(geo,mat,90),dummy=new THREE.Object3D();mesh.name='Rounded_submerged_waterstones';let seed=6291,n=0;
 const random=()=>((seed=seed*16807%2147483647)/2147483647);
 for(let i=0;i<6000&&n<90;i++){const x=(random()-.5)*42,z=(random()-.5)*42,h=terrain.raw(x,z);if(h==null||h> -2.58||h< -3.0)continue;const r=.12+random()*.24;dummy.position.set(x,h+.035,z);dummy.rotation.set(0,random()*6.28,.1);dummy.scale.set(r,r*.45,r*.8);dummy.updateMatrix();mesh.setMatrixAt(n++,dummy.matrix);mesh.setColorAt(n-1,new THREE.Color().setHSL(.12+random()*.15,.08,.32+random()*.15));}
 mesh.count=n;mesh.receiveShadow=true;mesh.computeBoundingSphere();scene.add(mesh);return mesh;
}
export function configureRiverWater(material,time,health){
 material.color.set('white');material.roughness=.23;material.envMapIntensity=.2;material.specularIntensity=.65;
 material.onBeforeCompile=s=>{
  s.uniforms.uFlow=time;s.uniforms.uRiverHeal=health;
  s.vertexShader='uniform float uFlow;varying vec2 vRiver;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRiver=uv;transformed.y+=sin(uv.y*13.-uFlow*1.3+sin(uv.x*9.))*.008;');
  s.fragmentShader='uniform float uFlow;uniform float uRiverHeal;varying vec2 vRiver;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float downstream=vRiver.y*17.-uFlow*1.3;
   float ripple=sin(downstream+sin(vRiver.x*8.+vRiver.y*3.)*1.7);
   float lace=pow(max(0.,ripple*sin(vRiver.y*27.-uFlow*1.9-vRiver.x*5.)),12.);
   float edge=smoothstep(0.,.12,vRiver.x)*(1.-smoothstep(.88,1.,vRiver.x));
   diffuseColor.rgb=mix(vec3(.032,.020,.045),vec3(.09,.27,.24),uRiverHeal)+lace*mix(vec3(.012,.005,.016),vec3(.055,.075,.065),uRiverHeal);
   diffuseColor.a=edge*mix(.98,.52,uRiverHeal);
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=normalize(normal+vec3(cos(vRiver.y*17.-uFlow*1.3+sin(vRiver.x*8.))*.08,sin(vRiver.y*27.-uFlow*1.9-vRiver.x*5.)*.05,0.));');
 };
}
