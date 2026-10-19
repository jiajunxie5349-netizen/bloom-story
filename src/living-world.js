import * as THREE from 'three';
import {organicCap,woodlandMaterial} from './woodland-material.js';
export const riverPoints=[[19,-26,-2.15],[18,-17,-2.25],[16,-8,-2.35],[12,0,-2.45],[8,6,-2.55]];
export const peripheralLayout=Array.from({length:110},(_,i)=>{const a=i*2.39996,r=i%2?32.2+(i%7)*.16:27.8+(i%4)*.1;return {a,x:Math.cos(a)*r,z:Math.sin(a)*r,scale:.5+(i%9)*.11};});
export function addLivingWorld(scene,terrain,targets,options={}){
 const root=new THREE.Group();scene.add(root);
 const bark=new THREE.MeshStandardMaterial({color:'#493c29',roughness:1});
 const leafMat=new THREE.MeshStandardMaterial({color:'#655e34',roughness:.91,side:THREE.DoubleSide});
 const barkCanvas=document.createElement('canvas');barkCanvas.width=barkCanvas.height=128;const bc=barkCanvas.getContext('2d');bc.fillStyle='#807255';bc.fillRect(0,0,128,128);for(let i=0;i<90;i++){bc.strokeStyle=i%3?'#443f2c':'#ab9770';bc.globalAlpha=.3;bc.lineWidth=.6+i%3*.3;const x=i*31%128;bc.beginPath();bc.moveTo(x,0);bc.bezierCurveTo(x+Math.sin(i)*6,40,x-4,90,x+Math.cos(i)*5,128);bc.stroke();}const barkMap=new THREE.CanvasTexture(barkCanvas);barkMap.colorSpace=THREE.SRGBColorSpace;bark.map=barkMap;bark.bumpMap=barkMap;bark.bumpScale=.045;
 const veinCanvas=document.createElement('canvas');veinCanvas.width=veinCanvas.height=128;const vc=veinCanvas.getContext('2d');vc.fillStyle='#a8a683';vc.fillRect(0,0,128,128);vc.strokeStyle='#555c3a';vc.lineWidth=1;vc.beginPath();vc.moveTo(64,0);vc.lineTo(64,128);for(let i=12;i<128;i+=12){vc.moveTo(64,i);vc.quadraticCurveTo(32,i-12,0,i-22);vc.moveTo(64,i);vc.quadraticCurveTo(94,i-12,128,i-22);}vc.stroke();const veinMap=new THREE.CanvasTexture(veinCanvas);veinMap.colorSpace=THREE.SRGBColorSpace;leafMat.map=veinMap;leafMat.bumpMap=veinMap;leafMat.bumpScale=.012;
 function add(geo,mat,x,y,z,parent=root){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 // Shared, curved leaflets and smooth mushroom profiles populate the new
 // outer land. The walking ring r=30 is explicitly kept open.
 const leaf=new THREE.SphereGeometry(1,12,6);leaf.scale(.085,.015,.30);
 const stem=new THREE.CylinderGeometry(.035,.07,.8,10);
 const cap=organicCap();cap.scale(.42,.42,.42);const capMat=woodlandMaterial('cap');
 const stems=new THREE.InstancedMesh(stem,bark,110),caps=new THREE.InstancedMesh(cap,capMat,110),leaves=new THREE.InstancedMesh(leaf,leafMat,900);
 const dummy=new THREE.Object3D();let k=0;
 for(let i=0;i<(options.wetland?0:110);i++){
  const {a,x,z,scale}=peripheralLayout[i],y=terrain.raw(x,z);
  if(y==null||y<-2.4||terrain.blocked.has(terrain.index(x,z)))continue;
  dummy.position.set(x,y+.4*scale,z);dummy.rotation.set(0,a,0);dummy.scale.setScalar(scale);dummy.updateMatrix();stems.setMatrixAt(k,dummy.matrix);
  terrain.obstacles.push({x,z,radius:.42*scale});
  dummy.position.y=y+.8*scale;dummy.updateMatrix();caps.setMatrixAt(k,dummy.matrix);
  for(let j=0;j<8;j++){const b=j*Math.PI/4;dummy.position.set(x+Math.sin(b)*.21,y+.1+(j%3)*.12,z+Math.cos(b)*.21);dummy.rotation.set(.3, b,.18);dummy.scale.setScalar(scale);dummy.updateMatrix();leaves.setMatrixAt(k*8+j,dummy.matrix);}k++;
 }stems.count=caps.count=k;leaves.count=k*8;root.add(stems,caps,leaves);
 // A continuous moving ribbon follows the sculpted stream bed, rather than
 // a floating decorative strip. Water remains non-walkable.
 const curve=new THREE.CatmullRomCurve3(riverPoints.map(p=>new THREE.Vector3(p[0],p[2],p[1])),false,'catmullrom',.12),positions=[],uv=[],indices=[];
 for(let i=0;i<=240;i++){const t=i/240,p=curve.getPoint(t),d=curve.getTangent(t),len=Math.hypot(d.x,d.z),nx=-d.z/len,nz=d.x/len,baseWidth=.77+Math.sin(t*14+.7)*.13+Math.sin(t*31+1.4)*.07;let w=baseWidth*THREE.MathUtils.smoothstep(t,0,.045);while(w>.14&&[1,-1].some(side=>(terrain.raw(p.x+nx*w*side,p.z+nz*w*side)??-3.3)>p.y-.04))w*=.9;for(const side of [-1,1]){positions.push(p.x+nx*w*side,p.y,p.z+nz*w*side);uv.push((side+1)/2,t*4);}if(i<240){const n=i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}}
 const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));rg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));rg.setIndex(indices);rg.computeVertexNormals();
 const water=new THREE.MeshPhysicalMaterial({color:'#3d394b',roughness:.38,metalness:0,envMapIntensity:.035,specularIntensity:.24,transparent:true,depthWrite:false,side:THREE.DoubleSide});const clock={value:0},riverHeal={value:0};
 water.onBeforeCompile=s=>{s.uniforms.uFlow=clock;s.uniforms.uRiverHeal=riverHeal;s.vertexShader='uniform float uFlow; varying vec2 vRiver;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRiver=uv;transformed.y+=sin(uv.y*13.-uFlow*.7+sin(uv.x*9.))*.008;');s.fragmentShader='uniform float uFlow;uniform float uRiverHeal;varying vec2 vRiver;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat stream=pow(max(0.,sin(vRiver.y*17.+sin(vRiver.y*4.7+vRiver.x*6.3)*1.8-uFlow*.7)*sin(vRiver.y*7.1-vRiver.x*5.3+uFlow*.43)),14.);diffuseColor.a*=smoothstep(0.,.12,vRiver.x)*(1.-smoothstep(.88,1.,vRiver.x));diffuseColor.rgb=mix(vec3(.035,.027,.048),vec3(.025,.085,.075),uRiverHeal)+stream*vec3(.008,.011,.012);');s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=normalize(normal+vec3(sin(vRiver.y*13.+sin(vRiver.x*7.+uFlow*.27)-uFlow*.62)*.045,cos(vRiver.y*8.3-vRiver.x*11.+uFlow*.48)*.035,0.));');};
 const streamMesh=add(rg,water,0,0,0);streamMesh.castShadow=false;
 // The bridge deck and baked walk surface share the same top elevation.
 // The existing crossing remains walkable, dressed as an irregular natural gravel shoal.
 const gravel=new THREE.MeshStandardMaterial({color:'#6d6853',roughness:1});for(let i=0;i<27;i++){const x=16.45+(i%9)*.57+Math.sin(i*2.4)*.09,z=-24.2+Math.floor(i/9)*.59+Math.cos(i*1.7)*.10;const y=terrain.height(x,z);if(y==null)continue;const stone=add(new THREE.IcosahedronGeometry(.18,2),gravel,x,y-.13,z);stone.scale.set(1.2,.8,.9);stone.rotation.y=i*2.4;}
 // Two story companions, intentionally on walkable ground near the route.
 const npcs=[];
 function npc(id,name,x,z){const [a,b]=terrain.nearest(x,z),position=new THREE.Vector3(a,terrain.height(a,b),b),group=new THREE.Group();group.position.copy(position);root.add(group);const t={type:'npc',index:id,label:name,position,interactionPosition:position.clone().add(new THREE.Vector3(0,.4,0)),group};npcs.push(t);return t;}
 const tree=npc(0,'守望老樹',-3,23);
 terrain.obstacles.push({x:tree.position.x,z:tree.position.z,radius:.28});
 const trunkCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(-.06,.7,.04),new THREE.Vector3(.06,1.5,-.02),new THREE.Vector3(0,2.6,0)]);add(new THREE.TubeGeometry(trunkCurve,40,.18,14,false),bark,0,0,0,tree.group);
 for(let i=0;i<5;i++){const angle=i*1.256,rootCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,.25,0),new THREE.Vector3(Math.sin(angle)*.18,.08,Math.cos(angle)*.18),new THREE.Vector3(Math.sin(angle)*.38,0,Math.cos(angle)*.38)]);add(new THREE.TubeGeometry(rootCurve,16,.055,8,false),bark,0,0,0,tree.group);const end=new THREE.Vector3(Math.sin(angle)*.45,2.2+i*.09,Math.cos(angle)*.45),branchCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,1.65+i*.06,0),end.clone().multiplyScalar(.65).add(new THREE.Vector3(0,.7,0)),end]);add(new THREE.TubeGeometry(branchCurve,24,.037,8,false),bark,0,0,0,tree.group);for(let j=0;j<4;j++){const l=add(leaf,leafMat,end.x+Math.sin(j*2.4)*.05,end.y+j*.035,end.z+Math.cos(j*2.4)*.05,tree.group);l.rotation.set(.4,angle+j*.8,.2);l.scale.setScalar(.55);}}
 const eyeMat=new THREE.MeshStandardMaterial({color:'#b0b281',emissive:'#8e945d',emissiveIntensity:.25});
 for(const side of [-1,1])add(new THREE.SphereGeometry(.045,12,8),eyeMat,side*.10,1.65,.21,tree.group);
 const friend=npc(1,'受傷的苔光',5,10);
 const body=add(new THREE.SphereGeometry(.2,20,12),leafMat,0,.42,0,friend.group);body.scale.set(.7,1.3,.75);
 add(new THREE.SphereGeometry(.08,16,10),eyeMat,0,.52,.12,friend.group);
 for(const n of npcs){const c=document.createElement('canvas');c.width=256;c.height=64;const ctx=c.getContext('2d');ctx.fillStyle='#e4d8af';ctx.font='22px Microsoft JhengHei';ctx.textAlign='center';ctx.fillText(n.label+' · E',128,44);const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;const sign=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,transparent:true,depthTest:true}));sign.scale.set(1.8,.45,1);sign.position.y=n.index?1.1:3;sign.visible=false;n.group.add(sign);n.sign=sign;}
 return {npcs,update(time,repair,progress,reduced){clock.value=reduced?0:time;riverHeal.value=repair;leafMat.color.set(repair>.5?'#66834b':'#655e34');friend.group.children[0].position.y=.42+(reduced?0:Math.sin(time*1.6)*.045);}};
}
