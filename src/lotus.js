import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {lotusLayout} from './lotus-layout.js';

// Complete, rooted fan leaves, inspired by the supplied lotus concept study.
// The leaf sits above the walking capsule; only the thin curved stem is solid.
export function addLotus(scene,terrain){
 const group=new THREE.Group();group.name='Rooted_Fan_Lotus';scene.add(group);
 const segments=96,rings=18,positions=[0,2.6,0],uv=[.5,.5],indices=[];
 function surface(t,a){const r=t*(1+.035*Math.sin(a*7)+.018*Math.sin(a*13));return new THREE.Vector3(Math.cos(a)*r, .18*t*t+.032*Math.sin(a*14)*t+.025*Math.sin(a*5)*t*t,Math.sin(a)*r*.91).applyAxisAngle(new THREE.Vector3(1,0,0),.5).add(new THREE.Vector3(0,2.6,0));}
 for(let j=1;j<=rings;j++)for(let i=0;i<=segments;i++){const a=.12+i/segments*(Math.PI*2-.24),p=surface(j/rings,a);positions.push(p.x,p.y,p.z);uv.push(.5+p.x*.47,.5+p.z*.47);}
 for(let i=0;i<segments;i++)indices.push(0,i+2,i+1);
 for(let j=0;j<rings-1;j++)for(let i=0;i<segments;i++){const a=1+j*(segments+1)+i,b=a+segments+1;indices.push(a,b+1,b,a,a+1,b+1);}
 const leafGeo=new THREE.BufferGeometry();leafGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));leafGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));leafGeo.setIndex(indices);leafGeo.computeVertexNormals();
 const atlas=document.createElement('canvas');atlas.width=atlas.height=512;const ctx=atlas.getContext('2d'),image=ctx.createImageData(512,512);
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){const i=(y*512+x)*4,a=Math.atan2(y-256,x-256),r=Math.hypot(x-256,y-256)/256,grain=Math.sin(x*17.13+y*43.71)*Math.sin(x*3.17-y*9.73),age=Math.sin(x*.07)*Math.sin(y*.055)*10,vein=Math.pow(.5+.5*Math.cos(a*14+r*1.2),35)*14;image.data.set([136+grain*7+age+vein,139+grain*6+age+vein,105+grain*6+age*.6+vein,255],i);}ctx.putImageData(image,0,0);
 const texture=new THREE.CanvasTexture(atlas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 const leafMat=new THREE.MeshStandardMaterial({map:texture,bumpMap:texture,bumpScale:.016,color:'#aaa58b',roughness:.86,metalness:.035,envMapIntensity:.2,side:THREE.DoubleSide});
 const stemMat=new THREE.MeshStandardMaterial({color:'#75694a',roughness:.95});const veinMat=new THREE.MeshStandardMaterial({color:'#686747',roughness:.92});
 const stemCurve=new THREE.CubicBezierCurve3(new THREE.Vector3(0,-.045,0),new THREE.Vector3(.08,.8,-.03),new THREE.Vector3(-.08,1.8,.03),new THREE.Vector3(0,2.6,0));const stemGeo=new THREE.TubeGeometry(stemCurve,28,.032,8,false);
 const veinParts=[];for(let i=0;i<14;i++){const a=.14+i/13*(Math.PI*2-.28),points=Array.from({length:13},(_,j)=>surface(.06+j/12*.91,a).add(new THREE.Vector3(0,.012,0)));veinParts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),24,.007,5,false));}
 const rimPoints=Array.from({length:97},(_,i)=>surface(.99,.12+i/96*(Math.PI*2-.24)));veinParts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPoints),128,.007,5,false));const veinGeo=mergeGeometries(veinParts);veinParts.forEach(g=>g.dispose());
 const leaves=new THREE.InstancedMesh(leafGeo,leafMat,lotusLayout.length),stems=new THREE.InstancedMesh(stemGeo,stemMat,lotusLayout.length),veins=new THREE.InstancedMesh(veinGeo,veinMat,lotusLayout.length);group.add(leaves,stems,veins);leaves.castShadow=stems.castShadow=true;leaves.receiveShadow=stems.receiveShadow=veins.receiveShadow=true;
 const dummy=new THREE.Object3D();for(let i=0;i<lotusLayout.length;i++){const p=lotusLayout[i],ground=terrain.height(p.x,p.z)??terrain.raw(p.x,p.z);if(ground==null)throw Error('荷葉缺少貼地資料');dummy.position.set(p.x,ground,p.z);dummy.rotation.y=p.angle;dummy.scale.set(p.radius,p.height/2.6,p.radius);dummy.updateMatrix();for(const mesh of [leaves,stems,veins])mesh.setMatrixAt(i,dummy.matrix);if(!p.pond)terrain.obstacles.push({x:p.x,z:p.z,radius:.12});}
 const clock={value:0};for(const material of [leafMat,stemMat,veinMat]){material.onBeforeCompile=s=>{s.uniforms.uLotusTime=clock;s.vertexShader='uniform float uLotusTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat leafWeight=pow(clamp(position.y/2.6,0.,1.),2.);transformed.x+=sin(uLotusTime*.65+position.y*.8)*leafWeight*.018;transformed.z+=sin(uLotusTime*.49+position.y)*leafWeight*.012;');};material.customProgramCacheKey=()=> 'rooted-lotus-v9';}
 return {collisionMeshes:[leaves,stems],update(time,repair,reduced){clock.value=reduced?0:time;leafMat.color.lerpColors(new THREE.Color('#9e9682'),new THREE.Color('#8fbd7b'),repair);stemMat.color.lerpColors(new THREE.Color('#75694a'),new THREE.Color('#748f4b'),repair);veinMat.color.lerpColors(new THREE.Color('#686747'),new THREE.Color('#658843'),repair);}};
}


