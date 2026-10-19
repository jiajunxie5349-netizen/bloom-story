import * as THREE from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';

export function addWetlandEffects(scene,terrain,pool,waterMaterial){
 const group=new THREE.Group();scene.add(group);
 const veinMat=new THREE.MeshStandardMaterial({color:'#563d68',emissive:'#49335a',emissiveIntensity:.32,roughness:.53,metalness:0});
 const lines=[
  [[-5,-8],[-7,-3],[-8,3],[-8,7]],[[ -5,-8],[-11,-7],[-16,-9],[-20,-11]],
  [[-5,-8],[-2,-12],[1,-16],[3,-20]],[[-5,-8],[-5,-14],[-7,-19],[-9,-23]],
  [[-5,-8],[1,-5],[6,-3],[10,0]],[[-5,-8],[-1,-1],[2,3],[4,6]],
  [[-7,-3],[-12,-1],[-15,2]],[[-11,-7],[-13,-13],[-15,-16]],
  [[-2,-12],[4,-10],[7,-9]],[[1,-5],[4,-8],[8,-12]],
  [[-5,-14],[-2,-18],[-1,-21]],[[-7,-3],[-6,1],[-4,4]]
 ];
 for(let n=0;n<lines.length;n++){
  const curve=new THREE.CatmullRomCurve3(lines[n].map(([x,z])=>new THREE.Vector3(x,-2.445,z))),v=[],idx=[];
  for(let i=0;i<=100;i++){
   const t=i/100,p=curve.getPoint(t),d=curve.getTangent(t),w=(n<6?.030:.018)*(1-t*.65),h=terrain.raw(p.x,p.z);
   const y=h!=null&&h<-2.18?Math.max(-2.445,h+.016):-4;
   v.push(p.x-d.z*w,y,p.z+d.x*w,p.x+d.z*w,y,p.z-d.x*w);
   if(i<100&&y>-3){const next=curve.getPoint((i+1)/100);if((terrain.raw(next.x,next.z)??0)<-2.18){const q=i*2;idx.push(q,q+1,q+2,q+1,q+3,q+2);}}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,veinMat);m.material.side=THREE.DoubleSide;group.add(m);
 }
 for(const [x,z] of [[-7,-3],[3,-8],[-11,-12]]){const l=new THREE.PointLight('#74517e',.20,3.8,2);l.position.set(x,-2.18,z);group.add(l);}
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),image=ctx.createImageData(128,128);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){const r=Math.hypot((x-64)/64,(y-64)/64),a=Math.max(0,1-r);image.data.set([168,180,193,Math.round(a*a*(.65+.35*Math.sin(x*.12+Math.cos(y*.19)*2))*145)],(y*128+x)*4);}ctx.putImageData(image,0,0);
 const texture=new THREE.CanvasTexture(c),fogMat=new THREE.MeshBasicMaterial({map:texture,color:'#9aadb5',transparent:true,opacity:.19,depthWrite:false,side:THREE.DoubleSide});
 const fog=[];for(let i=0;i<5;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(17,12),fogMat);m.rotation.x=-Math.PI/2;m.rotation.z=i*.8;m.position.set(-5+Math.sin(i*2.4)*7,-2.18+i*.035,-8+Math.cos(i*2.4)*7);group.add(m);fog.push(m);}
 // A reduced-resolution, throttled planar capture reflects the actual plants.
 // The capture surface writes no pixels: the lake shader samples its texture.
 const mirror=new Reflector(new THREE.PlaneGeometry(72,72),{textureWidth:512,textureHeight:512,clipBias:.004,multisample:0});mirror.rotation.x=-Math.PI/2;mirror.position.copy(pool.position);mirror.position.y-=.006;mirror.material.colorWrite=false;mirror.material.depthWrite=false;scene.add(mirror);
 const matrix={value:mirror.material.uniforms.textureMatrix.value},reflection={value:mirror.getRenderTarget().texture},strength={value:0};
 const original=waterMaterial.onBeforeCompile;
 waterMaterial.onBeforeCompile=s=>{
  original(s);s.uniforms.uWetlandMirror=reflection;s.uniforms.uMirrorMatrix=matrix;s.uniforms.uMirrorStrength=strength;
  s.vertexShader='uniform mat4 uMirrorMatrix;varying vec4 vMirror;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <project_vertex>','vMirror=uMirrorMatrix*vec4(transformed.x,-transformed.z,transformed.y,1.);\n#include <project_vertex>');
  s.fragmentShader='uniform sampler2D uWetlandMirror;uniform float uMirrorStrength;varying vec4 vMirror;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>','vec4 mirrorUV=vMirror;mirrorUV.xy+=vec2(sin(vHabitatPosition.z*2.7+uWaterTime*.4),cos(vHabitatPosition.x*2.1-uWaterTime*.35))*.0015*mirrorUV.w;vec3 reflected=texture2DProj(uWetlandMirror,mirrorUV).rgb;outgoingLight=mix(outgoingLight,reflected,uMirrorStrength);\n#include <opaque_fragment>');
 };
 const renderMirror=mirror.onBeforeRender;let now=0,last=-1,enabled=false;
 mirror.onBeforeRender=function(...args){if(!enabled||now-last<.16)return;last=now;const cover=scene.getObjectByName('Continuous_grass_moss_and_leaf_understory'),visible=cover?.visible;if(cover)cover.visible=false;try{renderMirror.apply(this,args);}finally{if(cover)cover.visible=visible;}};
 return {update(time,health,quality,reduced){now=time;enabled=quality==='high';mirror.visible=enabled;strength.value=enabled?.20:0;veinMat.emissiveIntensity=(1-health)*.32;veinMat.color.lerpColors(new THREE.Color('#563d68'),new THREE.Color('#3d605b'),health);fog.forEach((m,i)=>{m.material.opacity=.13; m.position.x=-5+Math.sin(i*2.4)*7+(reduced?0:Math.sin(time*.028+i)*.6);});}};
}
