import * as THREE from 'three';
export function addCanopy(scene,terrain,targets){
 const capMat=new THREE.MeshStandardMaterial();
 // Fictional violet infestation, distinct from the native plants it covers.
 const infestation=new THREE.Group();scene.add(infestation);const shade=new THREE.MeshStandardMaterial({color:'#49374d',roughness:.8,emissive:'#543465',emissiveIntensity:.18});const patches=targets.filter(t=>t.type==='soil'||t.type==='survey'&&t.index===1).map(t=>{const group=new THREE.Group();group.position.copy(t.position);infestation.add(group);for(let j=0;j<5;j++){const h=.4+j*.08,curve=new THREE.CatmullRomCurve3([new THREE.Vector3(Math.sin(j)*.6,0,Math.cos(j)*.6),new THREE.Vector3(Math.sin(j)*.4,h*.6,Math.cos(j)*.4),new THREE.Vector3(Math.sin(j+.7)*.5,h,Math.cos(j+.7)*.5)]);const m=new THREE.Mesh(new THREE.TubeGeometry(curve,16,.025,6,false),shade);group.add(m);}return {group,target:t,health:0};});
 return {collisionMeshes:[],update(time,repair,progress,reduced,dt){capMat.color.lerpColors(new THREE.Color('#938c80'),new THREE.Color('#c5af83'),repair);for(const p of patches){const healed=p.target.type==='soil'?progress.soils.includes(p.target.index):progress.barriers.length>0;p.health=THREE.MathUtils.damp(p.health,healed?1:0,1.4,dt);p.group.scale.setScalar(Math.max(.001,1-p.health));p.group.visible=p.health<.99;}}};
}

