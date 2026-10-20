import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {forestDetailLayout} from './forest-detail-layout.js';
export function addForestDetails(scene,terrain,sites,chapter=1){
 const layout=forestDetailLayout(terrain,sites,chapter),root=new THREE.Group();root.name='Fallen_wood_and_mineral_understory';scene.add(root);
 const heal={value:0},time={value:0},walker={value:new THREE.Vector3(1000,0,1000)};
 function material(color,soft=false){const m=new THREE.MeshPhysicalMaterial({color,roughness:soft?.46:.92,metalness:0,clearcoat:soft?.18:0,envMapIntensity:soft?.16:.03,side:THREE.DoubleSide});m.onBeforeCompile=s=>{
  s.uniforms.uDetailHeal=heal;s.uniforms.uDetailTime=time;s.uniforms.uWalker=walker;
  s.vertexShader='uniform float uDetailTime;uniform vec3 uWalker;varying vec3 vDetail;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vec4 baseDetail=vec4(position,1.);
   #ifdef USE_INSTANCING
   baseDetail=instanceMatrix*baseDetail;
   #endif
   baseDetail=modelMatrix*baseDetail;
   ${soft?'vec2 away=baseDetail.xz-uWalker.xz;float proximity=1.-smoothstep(.25,1.15,length(away));float tip=clamp(position.y*1.5,0.,1.);transformed.xz+=normalize(away+vec2(.001))*.32*proximity*tip;transformed.y-=proximity*tip*.24;transformed.x+=sin(uDetailTime*.7+baseDetail.x*.8+baseDetail.z)*.016*tip;':''}
   vDetail=baseDetail.xyz;`);
  s.fragmentShader='uniform float uDetailHeal;varying vec3 vDetail;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float mineralVein=pow(.5+.5*sin(vDetail.y*24.+sin(vDetail.x*9.+vDetail.z*6.)*2.),18.);
   float cloud=.5+.5*sin(vDetail.x*12.+sin(vDetail.z*8.)*3.)*sin(vDetail.y*11.+vDetail.z*5.);
   diffuseColor.rgb*=.75+cloud*.35;
   ${soft?'diffuseColor.rgb=mix(diffuseColor.rgb, mix(vec3(.19,.32,.26),vec3(.57,.65,.46),cloud)+mineralVein*.11,uDetailHeal);':'diffuseColor.rgb+=vec3(.025,.045,.013)*uDetailHeal*cloud;'}
  `);
 };m.customProgramCacheKey=()=>'forest-detail-'+soft;return m;}
 const bark=material('#48443b'),heart=material('#82745a'),moss=material('#536650'),jade=material('#545c4e',true),ivory=material('#908673',true);
 const collections=new Map();const dummy=new THREE.Object3D();
 function part(geo,mat,pos,rot=new THREE.Euler(),scale=new THREE.Vector3(1,1,1)){
  dummy.position.copy(pos);dummy.rotation.copy(rot);dummy.scale.copy(scale);dummy.updateMatrix();geo.applyMatrix4(dummy.matrix);if(!collections.has(mat))collections.set(mat,[]);collections.get(mat).push(geo);
 }
 for(const [i,l] of layout.logs.entries()){
  const a=new THREE.Vector3(l.ax,l.ya+l.radius*.7,l.az),b=new THREE.Vector3(l.bx,l.yb+l.radius*.7,l.bz),axis=b.clone().sub(a).normalize(),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis),rot=new THREE.Euler().setFromQuaternion(q);
  const trunk=new THREE.CylinderGeometry(l.radius*.72,l.radius,l.length,11,7,false),p=trunk.attributes.position;
  for(let n=0;n<p.count;n++){const d=1+.055*Math.sin(p.getY(n)*13+n*2.4);p.setX(n,p.getX(n)*d);p.setZ(n,p.getZ(n)*d);}trunk.computeVertexNormals();part(trunk,bark,a.clone().lerp(b,.5),rot);
  // Exposed broken heartwood, concentric growth rings and short snapped limbs.
  for(const [end,r] of [[a,l.radius],[b,l.radius*.72]]){
   const disk=new THREE.CircleGeometry(r*.88,11);disk.rotateX(-Math.PI/2);part(disk,heart,end.clone().addScaledVector(axis,end===a?-.006:.006),rot);
   for(let j=1;j<4;j++){const ring=new THREE.TorusGeometry(r*j/4,.006,3,19);ring.rotateX(Math.PI/2);part(ring,bark,end.clone().addScaledVector(axis,end===a?-.009:.009),rot);}
  }
  for(let j=0;j<4;j++){const pos=a.clone().lerp(b,.16+j*.21);pos.y+=l.radius*.65;part(new THREE.CylinderGeometry(.025,.08,.35,6),bark,pos,new THREE.Euler(.4,l.yaw+j,.9));
   const capPos=pos.clone();capPos.y+=.07;part(new THREE.SphereGeometry(.15,9,4),i%2?moss:ivory,capPos,new THREE.Euler(0,j,0),new THREE.Vector3(1,.25,.8));}
 }
 for(const [mat,geos] of collections){const merged=mergeGeometries(geos,false),mesh=new THREE.Mesh(merged,mat);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);geos.forEach(g=>g.dispose());}
 // Thick, folded spear leaves: a raised keel, two valleys and an irregular tip.
 const leaf=new THREE.BufferGeometry(),v=[0,0,0,-.16,.24,.13,-.24,.48,.07,-.10,.75,0,0,1.02,-.08,.14,.72,0,.25,.44,.07,.15,.20,.13,0,.42,.20],idx=[];
 for(let i=0;i<8;i++)idx.push(8,i,(i+1)%8);leaf.setAttribute('position',new THREE.Float32BufferAttribute(v,3));const front=[...v];for(let k=0;k<front.length;k+=3)v.push(front[k],front[k+1]-.022,front[k+2]);
 for(let j=0;j<8;j++){idx.push(17,9+(j+1)%8,9+j);const next=(j+1)%8;idx.push(j,j+9,next,next,j+9,next+9);}leaf.setAttribute('position',new THREE.Float32BufferAttribute(v,3));leaf.setIndex(idx);leaf.computeVertexNormals();
 const leaves=new THREE.InstancedMesh(leaf,jade,layout.plants.length*9),buds=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.12,1),ivory,layout.plants.length);let n=0;
 for(const [i,p] of layout.plants.entries()){
  for(let j=0;j<9;j++){const angle=p.yaw+j*2.39996;dummy.position.set(p.x,p.y-.025,p.z);dummy.rotation.set(.38+(j%3)*.28,angle,Math.sin(j*3.7)*.18);dummy.scale.set(p.scale*(p.kind===1?.7:1),p.scale*(p.kind===2?1.2:.7),p.scale);dummy.updateMatrix();leaves.setMatrixAt(n++,dummy.matrix);}
  dummy.position.set(p.x,p.y+.09,p.z);dummy.rotation.set(0,p.yaw,0);dummy.scale.setScalar(p.scale);dummy.updateMatrix();buds.setMatrixAt(i,dummy.matrix);
 }
 leaves.receiveShadow=true;root.add(leaves,buds);leaves.computeBoundingSphere();buds.computeBoundingSphere();
 return {root,layout,solids:layout.solids,update(t,h,player,reduced){time.value=reduced?0:t;heal.value=h;walker.value.copy(player);}};
}
