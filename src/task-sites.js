import {addInteractionDetails} from './interaction-details.js';
import * as THREE from 'three';
export function createTaskSite(type,index,label){
 const group=new THREE.Group(),objects=[],earth=new THREE.MeshStandardMaterial({color:'#594b33',roughness:1}),bronze=new THREE.MeshStandardMaterial({color:'#6f7350',roughness:.83,metalness:0}),plastic=new THREE.MeshStandardMaterial({color:'#4b716b',roughness:.6,metalness:0});
 function mesh(geo,mat,x,y,z){const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);objects.push(o);return o;}
 function bottle(x,z,s=1){
  const profile=[[.055,0],[.082,.018],[.085,.05],[.078,.22],[.045,.27],[.028,.285],[.028,.34]].map(p=>new THREE.Vector2(...p));
  const o=mesh(new THREE.LatheGeometry(profile,16),plastic,x,.02,z);o.scale.setScalar(s);
  const lip=mesh(new THREE.TorusGeometry(.031*s,.009*s,5,16),bronze,x,.36*s,z);lip.rotation.x=Math.PI/2;
  mesh(new THREE.CylinderGeometry(.034*s,.034*s,.035*s,12),bronze,x,.375*s,z);
  const label=mesh(new THREE.CylinderGeometry(.086*s,.086*s,.075*s,16,1,true),new THREE.MeshStandardMaterial({color:'#d7c69a',roughness:.88}),x,.14*s,z);
  for(let j=0;j<3;j++)mesh(new THREE.BoxGeometry(.022*s,.006*s,.008*s),bronze,x+.018*s,.13*s+j*.025*s,z+.086*s);
  return o;
 }
 let focus,rock=null,radius=0;
 if(type==='survey'){

  focus=bottle(.72,.05,1.2);
  const board=mesh(new THREE.BoxGeometry(.50,.34,.035),earth,.9,.76,.15);
  const labelCanvas=document.createElement('canvas');labelCanvas.width=128;labelCanvas.height=96;const lc=labelCanvas.getContext('2d');lc.fillStyle='#5b4931';lc.fillRect(0,0,128,96);lc.fillStyle='#e8d9b5';lc.font='bold 64px Georgia';lc.textAlign='center';lc.fillText('ABC'[index],64,72);const lm=new THREE.CanvasTexture(labelCanvas);lm.colorSpace=THREE.SRGBColorSpace;board.material=new THREE.MeshStandardMaterial({map:lm,roughness:1});
  const stick=mesh(new THREE.CylinderGeometry(.022,.028,.60,10),earth,.9,.30,.15);stick.rotation.z=-.12;
  if(index===1){
   const sack=mesh(new THREE.LatheGeometry([new THREE.Vector2(.14,0),new THREE.Vector2(.23,.12),new THREE.Vector2(.22,.32),new THREE.Vector2(.13,.42)],24),new THREE.MeshStandardMaterial({color:'#8e7950',roughness:1,side:THREE.DoubleSide}),1.1,.02,.3);sack.rotation.z=.25;
   sack.scale.setScalar(1.35);
   const seep=mesh(new THREE.CircleGeometry(.75,19),new THREE.MeshStandardMaterial({color:'#37291a',roughness:.96,transparent:true,opacity:.65,depthWrite:false}),1,.022,.2);seep.rotation.x=-Math.PI/2;seep.scale.set(1.5,.7,1);
   const opening=mesh(new THREE.CircleGeometry(.12,20),earth,1.0,.43,.3);opening.rotation.x=-Math.PI/2;
   for(let n=0;n<12;n++)mesh(new THREE.IcosahedronGeometry(.018,0),earth,.9+Math.sin(n*2.4)*.25,.025,.25+Math.cos(n*2.4)*.25);
  }
 }
 if(type==='isolate'){
  rock=mesh(new THREE.IcosahedronGeometry(.42,2),new THREE.MeshStandardMaterial({color:'#55584b',roughness:.94}),.9,.32,.1);rock.scale.set(1.1,.75,.85);focus=rock;radius=.43;

  const stain=mesh(new THREE.PlaneGeometry(2.4,.35,8,2),new THREE.MeshBasicMaterial({color:'#4a3425',transparent:true,opacity:.4,depthWrite:false}),1.3,.025,-.3);stain.rotation.x=-Math.PI/2;
 }
 if(type==='soil'&&index===0){
  focus=bottle(.7,.1,1.2);const b=bottle(.3,-.3,1);b.rotation.z=1.1;
  for(let i=0;i<6;i++){const trash=mesh(new THREE.PlaneGeometry(.15,.23),new THREE.MeshStandardMaterial({color:i%2?'#817454':'#78948a',side:THREE.DoubleSide,roughness:.9}),.3+Math.cos(i)*.4,.06,Math.sin(i)*.4);trash.rotation.set(-1.4,.2,i);}
 }
 if(type==='soil'&&index===1){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');c.fillStyle='#433025';c.beginPath();for(let i=0;i<18;i++){const a=i/18*6.28,r=100+Math.sin(i*2.4)*16;c.lineTo(128+Math.cos(a)*r,128+Math.sin(a)*r);}c.closePath();c.fill();c.strokeStyle='#292117';c.lineWidth=2;
  for(let i=0;i<18;i++){const a=i*2.4;c.beginPath();c.moveTo(128+Math.cos(a)*15,128+Math.sin(a)*15);c.lineTo(128+Math.cos(a+.2)*65,128+Math.sin(a+.2)*65);c.lineTo(128+Math.cos(a)*125,128+Math.sin(a)*125);c.stroke();}
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;focus=mesh(new THREE.PlaneGeometry(1.2,1.2),new THREE.MeshStandardMaterial({map,transparent:true,depthWrite:false,roughness:1}),.7,.035,0);focus.rotation.x=-Math.PI/2;
 }
 if(type==='soil'&&index===2){
  focus=mesh(new THREE.CylinderGeometry(.035,.06,.55,12),earth,.7,.28,0);
  for(let i=0;i<7;i++){const leaf=mesh(new THREE.SphereGeometry(.16,12,6),bronze,.7+Math.sin(i*2.4)*.22,.25+i*.04,Math.cos(i*2.4)*.19);leaf.scale.set(.35,.12,1.7);leaf.rotation.z=i*.7;}
 }
 if(type==='ritual'){
  focus=mesh(new THREE.SphereGeometry(.10,20,12),new THREE.MeshStandardMaterial({color:'#72924c',emissive:'#719844',emissiveIntensity:.2,roughness:.45}),.7,.45,0);
  for(let i=0;i<2;i++){const leaf=mesh(new THREE.SphereGeometry(.14,16,8),bronze,.7+(i?-.09:.09),.4,.04);leaf.scale.set(.25,1.7,.6);leaf.rotation.z=i?-.3:.3;}
  mesh(new THREE.CylinderGeometry(.06,.09,.35,12),earth,.7,.16,0);
 }
 const ring=mesh(new THREE.RingGeometry(.48,.50,64),new THREE.MeshBasicMaterial({color:'#d8b976',transparent:true,opacity:.42,side:THREE.DoubleSide,depthWrite:false}),.7,.045,0);ring.rotation.x=-Math.PI/2;
 const canvas=document.createElement('canvas');canvas.width=640;canvas.height=120;const ctx=canvas.getContext('2d');ctx.fillStyle='rgba(14,35,27,.92)';ctx.beginPath();ctx.roundRect(2,2,636,116,20);ctx.fill();ctx.strokeStyle='#b6be7f';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#e4e5c7';ctx.font='30px "Microsoft JhengHei",sans-serif';ctx.textAlign='center';ctx.fillText(label,320,51);ctx.fillStyle='#d9bd7c';ctx.font='23px "Microsoft JhengHei",sans-serif';ctx.fillText('接近後按 E 調查',320,91);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const sign=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,transparent:true}));sign.position.set(.7,1.55,0);sign.scale.set(2.5,.47,1);group.add(sign);
 const detail=addInteractionDetails(group,type,index);
 return {group,focus,ring,sign,rock,radius,objects,detail,plantMaterial:bronze};
}
