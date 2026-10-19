import * as THREE from 'three';
// A consistent physical affordance: pale folded calyx, a contrasting core and nearby motes.
// Completion closes the motes and reveals a living green core; no waypoint or screen overlay.
export function addInteractionDetails(parent,kind,index=0,offset=.7){
 const root=new THREE.Group();root.name='Touchable_calyx_'+kind;root.position.x=offset;parent.add(root);
 const pale=new THREE.MeshPhysicalMaterial({color:'#d4c9a7',roughness:.48,metalness:0,clearcoat:.15}),dark=new THREE.MeshStandardMaterial({color:'#535e50',roughness:.85}),coreMat=new THREE.MeshStandardMaterial({color:'#c19a62',roughness:.38,emissive:'#ad763a',emissiveIntensity:.12});
 const stalk=new THREE.Mesh(new THREE.CylinderGeometry(.04,.07,.42,7,3),dark);stalk.position.y=.21;root.add(stalk);
 const petals=[];
 for(let j=0;j<7;j++){
  const a=j*Math.PI*2/7,geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([0,.08,0,-.1,.16,.2,0,.31,.38,.1,.16,.2,0,.21,.17],3));geo.setIndex([0,1,4,1,2,4,2,3,4,3,0,4,0,3,1,1,3,2]);geo.computeVertexNormals();
  const petal=new THREE.Mesh(geo,j%3?pale:dark);petal.rotation.y=a;petal.position.y=.35;root.add(petal);petals.push(petal);
 }
 const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.075,2),coreMat);core.position.y=.58;root.add(core);
 const positions=[];for(let j=0;j<7;j++)positions.push(Math.sin(j*2.4)*.22,.68+j*.055,Math.cos(j*2.4)*.22);
 const motes=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(positions,3)),new THREE.PointsMaterial({color:'#ead6a1',size:.025,transparent:true,opacity:.6,depthWrite:false}));root.add(motes);
 // Detailed mineral chips and a rolled leaf lip differ at each task.
 for(let j=0;j<3;j++){const chip=new THREE.Mesh(new THREE.OctahedronGeometry(.045+j*.014,0),j%2?pale:dark);chip.position.set(Math.sin(j*2.4+index)*.32,.04,Math.cos(j*2.4+index)*.32);chip.scale.y=.4;root.add(chip);}
 return {root,update(t,done,near,reduced){motes.visible=!done;coreMat.color.set(done?'#a7bf86':'#c19a62');coreMat.emissiveIntensity=done?.04:(near?.24:.12);motes.rotation.y=reduced?0:t*.23;core.position.y=.58+(reduced||done?0:Math.sin(t*1.6+index)*.018);petals.forEach((p,j)=>p.rotation.x=done?-.12:Math.sin((reduced?0:t*.65)+j)*.025);}};
}
