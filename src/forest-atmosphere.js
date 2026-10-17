import * as THREE from 'three';

// A surrounding forest stays outside the playable boundary; shared instances keep it inexpensive.
export function addForestAtmosphere(scene,random,groundMaterial,terrain){
 const group=new THREE.Group();group.name='Surrounding_Forest';scene.add(group);
 // A continuous forest floor and a visible bank match the actual walking limit.
 // These are independent scenery; playable plants and terrain are never scaled together.
 const outerHeight=(x,z)=>{const r=Math.hypot(x,z),a=Math.atan2(x,z),edge=terrain.raw(Math.sin(a)*Math.min(r,35.25),Math.cos(a)*Math.min(r,35.25))??-1.7,t=THREE.MathUtils.smoothstep(r,35.5,43);return (edge-.035)*(1-t)+(-1.8+.38*Math.sin(x*.13)*Math.cos(z*.16)+.16*Math.sin(x*.37+z*.21))*t;};
 const outerGeo=new THREE.RingGeometry(34.8,84,192,32);outerGeo.rotateX(-Math.PI/2);const op=outerGeo.attributes.position;for(let i=0;i<op.count;i++)op.setY(i,outerHeight(op.getX(i),op.getZ(i)));outerGeo.computeVertexNormals();const outerFloor=new THREE.Mesh(outerGeo,groundMaterial);outerFloor.name='Unbroken_natural_outer_forest_floor';outerFloor.receiveShadow=true;group.add(outerFloor);
 const sky=new THREE.Mesh(new THREE.SphereGeometry(90,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{warmth:{value:0},haze:{value:scene.fog.color}},vertexShader:'varying vec3 vSky;void main(){vSky=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 vSky;uniform float warmth;uniform vec3 haze;void main(){float h=smoothstep(-6.,45.,vSky.y);vec3 horizon=haze;vec3 zenith=haze*.72;gl_FragColor=vec4(mix(horizon,zenith,h),1.);\n#include <colorspace_fragment>\n}'}));group.add(sky);
 const atlas=document.createElement('canvas');atlas.width=atlas.height=256;const c=atlas.getContext('2d');
 for(let i=0;i<75;i++){const x=30+random()*196,y=30+random()*196,a=random()*6.28; c.save();c.translate(x,y);c.rotate(a);const g=c.createLinearGradient(-16,0,16,0);g.addColorStop(0,'#2d4630');g.addColorStop(.5,'#839568');g.addColorStop(1,'#334f37');c.fillStyle=g;c.beginPath();c.ellipse(0,0,10+random()*8,3+random()*4,0,0,6.28);c.fill();c.strokeStyle='#b4bb8140';c.beginPath();c.moveTo(-13,0);c.lineTo(13,0);c.stroke();c.restore();}
 const tex=new THREE.CanvasTexture(atlas);tex.colorSpace=THREE.SRGBColorSpace;
 const leaves=new THREE.MeshStandardMaterial({map:tex,alphaTest:.38,alphaToCoverage:true,side:THREE.DoubleSide,roughness:1,color:'#89977a'});
 const foliage=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),leaves,1700);foliage.frustumCulled=false;group.add(foliage);
 const barkCanvas=document.createElement('canvas');barkCanvas.width=barkCanvas.height=256;const bc=barkCanvas.getContext('2d');bc.fillStyle='#494839';bc.fillRect(0,0,256,256);
 for(let i=0;i<500;i++){bc.strokeStyle=i%3?'#252f25':'#787461';bc.globalAlpha=.12+random()*.24;bc.lineWidth=.5+random()*2;const x=random()*256,y=random()*256;bc.beginPath();bc.moveTo(x,y);bc.bezierCurveTo(x+random()*5,y+15,x-3,y+30,x+2,y+45+random()*65);bc.stroke();}
 const barkTexture=new THREE.CanvasTexture(barkCanvas);barkTexture.colorSpace=THREE.SRGBColorSpace;barkTexture.wrapS=barkTexture.wrapT=THREE.RepeatWrapping;barkTexture.repeat.set(3,2);
 const bark=new THREE.MeshStandardMaterial({map:barkTexture,bumpMap:barkTexture,bumpScale:.12,color:'#707766',roughness:1});
 const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.25,.5,1,9,4),bark,105);group.add(trunk);
 const branch=new THREE.InstancedMesh(new THREE.CylinderGeometry(.06,.16,1,7),bark,315);group.add(branch);
 const dummy=new THREE.Object3D();let fi=0,bi=0;
 // Low woody shrubs connect the near bank to the distant canopy, with rooted stems.
 const shrubStems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.035,.09,1,8),bark,260);group.add(shrubStems);
 const shrubLeaves=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),leaves,780);shrubLeaves.frustumCulled=false;group.add(shrubLeaves);
 for(let i=0;i<260;i++){const a=i*2.39996,r=36.5+random()*25,x=Math.sin(a)*r,z=Math.cos(a)*r,h=1.5+random()*3;dummy.position.set(x,outerHeight(x,z)+h*.5,z);dummy.rotation.set(0,a,0);dummy.scale.set(1,h,1);dummy.updateMatrix();shrubStems.setMatrixAt(i,dummy.matrix);for(let j=0;j<3;j++){dummy.position.set(x,outerHeight(x,z)+h*.60+j*.22,z);dummy.rotation.set(.3+j*.6,a+j*2.1,0);dummy.scale.set(2+random(),1.7+random(),1);dummy.updateMatrix();shrubLeaves.setMatrixAt(i*3+j,dummy.matrix);}}
 for(let i=0;i<105;i++){
  const a=i*2.39996,r=37+random()*23,x=Math.sin(a)*r,z=Math.cos(a)*r,h=10+random()*13;
  dummy.position.set(x,outerHeight(x,z)+h*.5-.1,z);dummy.rotation.set(.02,random()*6,.04);dummy.scale.set(1+random(),h,1+random());dummy.updateMatrix();trunk.setMatrixAt(i,dummy.matrix);
  for(let j=0;j<3;j++){
   const b=a+j*2.1+random()*.6,len=3+random()*3,y=outerHeight(x,z)+h*.55+j*1.5;
   dummy.position.set(x+Math.sin(b)*len*.35,y,z+Math.cos(b)*len*.35);dummy.rotation.set(Math.cos(b)*.7,0,-Math.sin(b)*.7);dummy.scale.set(1,len,1);dummy.updateMatrix();branch.setMatrixAt(bi++,dummy.matrix);
  }
  for(let j=0;j<16;j++){
   const b=random()*6.28,rr=random()*5,y=outerHeight(x,z)+(j<5?1.5+random()*7:h-1+random()*5);dummy.position.set(x+Math.sin(b)*rr,y,z+Math.cos(b)*rr);dummy.rotation.set(j%3===0?-Math.PI/2:random()*.8,random()*6.28,random()*.35);dummy.scale.set(4+random()*4,3+random()*3,1);dummy.updateMatrix();foliage.setMatrixAt(fi++,dummy.matrix);
  }
 }
 foliage.count=fi;
 // Low banks close the gap between the land's edge and tree trunks.
 const bank=new THREE.Mesh(new THREE.CylinderGeometry(65,65,5,96,1,true),new THREE.MeshStandardMaterial({color:'#354334',roughness:1,side:THREE.BackSide}));bank.position.y=-4;group.add(bank);
 return {update(restoration,quality){sky.material.uniforms.warmth.value=restoration*.85;leaves.color.setHSL(.10+restoration*.13,.15+restoration*.13,.38+restoration*.13);foliage.count=quality==='low'?Math.floor(fi*.65):fi;}};
}

