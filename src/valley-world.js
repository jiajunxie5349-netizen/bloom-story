import {floorNoise} from './forest-floor.js';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {ValleyTerrain,extensionDomain,regionAt} from './valley-terrain.js';
import {tasks,completed,unlocked,finale} from './valley-data.js';

function shell(radius,depth,segments=48,rings=8,fan=false){
 const pos=[],idx=[];const angle=i=>i/segments*Math.PI*2;
 for(let side=0;side<2;side++)for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
  const a=angle(i),t=j/rings,r=radius*t*(1+.045*Math.sin(i*2.37)*t),pleat=(i%2?-.075:.075)*Math.pow(t,.8)*radius;
  const y=fan?depth*t*t+pleat:depth*Math.pow(t,.65)+pleat*.5;
  pos.push(Math.cos(a)*r,y-side*.065*(.4+t),Math.sin(a)*r*(fan?.8:1));
 }
 const n=(rings+1)*(segments+1);
 for(let side=0;side<2;side++)for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){const a=side*n+j*(segments+1)+i,b=a+segments+1;if(side)idx.push(a,b+1,b,a,a+1,b+1);else idx.push(a,b,b+1,a,b+1,a+1);}
 for(let i=0;i<segments;i++){const a=rings*(segments+1)+i;idx.push(a,a+n,a+n+1,a,a+n+1,a+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);const flat=g.toNonIndexed();flat.computeVertexNormals();return flat;
}
function veinMaterial(kind,region,health,border){
 const palette={jade:['#424e47','#7eaa91'],ivory:['#8f8b80','#e6d8bd'],stone:['#394148','#657873'],earth:['#45463a','#646a54'],bark:['#353e42','#59696a'],amber:['#685745','#d7b471'],ash:['#302d30','#626353']};
 const [a,b]=palette[kind],m=new THREE.MeshPhysicalMaterial({name:`valley-${region}-${kind}`,color:a,roughness:kind==='jade'||kind==='ivory'?.72:.9,metalness:0,clearcoat:kind==='jade'||kind==='ivory'?.28:0,clearcoatRoughness:.4,envMapIntensity:.22,side:THREE.DoubleSide});
 m.onBeforeCompile=s=>{s.uniforms.uValleyHealth=health;s.uniforms.uValleyBorder=border;s.vertexShader='varying vec3 vVein;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvVein=position;');s.fragmentShader=floorNoise+`uniform float uValleyHealth;uniform float uValleyBorder;varying vec3 vVein;
 float vh(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
 float vn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(vh(i),vh(i+vec3(1,0,0)),f.x),mix(vh(i+vec3(0,1,0)),vh(i+vec3(1,1,0)),f.x),f.y),mix(mix(vh(i+vec3(0,0,1)),vh(i+vec3(1,0,1)),f.x),mix(vh(i+vec3(0,1,1)),vh(i+vec3(1,1,1)),f.x),f.y),f.z);}
 `+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float cloud=vn(vVein*.75)*.6+vn(vVein*3.7)*.3+vn(vVein*13.)*.1;
 float grain=vn(vVein*85.);
 float veins=1.-smoothstep(.006,.026,abs(vn(vVein*3.2+cloud)-.5));
 diffuseColor.rgb=mix(vec3(${new THREE.Color(a).toArray().join(',')}),vec3(${new THREE.Color(b).toArray().join(',')}),uValleyHealth)*(.65+cloud*.55+grain*.16)+veins*vec3(${kind==='earth'?'.005,.005,.004':'.025,.024,.02'});${kind==='earth'?'diffuseColor.rgb=woodlandFloor(vVein.xz,mix(uValleyBorder,uValleyHealth,smoothstep(35.,42.,length(vVein.xz))))*(.9+cloud*.1)*mix(vec3(1.),vec3(.9,.65,1.05),smoothstep(35.,43.,length(vVein.xz)));':''}`);s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+(grain-.5)*.12-uValleyHealth*${kind==='jade'||kind==='ivory'?'.38':'.1'},.3,1.);`);s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=normalize(normal+vec3(dFdx(grain),dFdy(grain),0.)*.08);');};m.customProgramCacheKey=()=>`valley-veins-${region}-${kind}`;return m;
}
export function addValley(scene,base,legacyTargets){
 const terrain=new ValleyTerrain(base),root=new THREE.Group();root.name='Single_valley_extension_B_C';scene.add(root);
 const states={A:{value:0},B:{value:0},C:{value:0}},mats={},buckets=new Map(),collisionMeshes=[],targets=[],crowns=[];
 for(const r of ['B','C'])for(const kind of ['jade','ivory','stone','earth','bark','amber','ash'])mats[r+kind]=veinMaterial(kind,r,states[r],states.A);
 let seed=29131;const rand=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
 const dummy=new THREE.Object3D();
 function emit(g,kind,r,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0){dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();const copy=g.clone().applyMatrix4(dummy.matrix);copy.deleteAttribute("uv");const key=r+kind;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(copy);}
 const rockGeo=new THREE.IcosahedronGeometry(1,1),stemGeo=new THREE.LatheGeometry([[.55,0],[.3,.3],[.17,1.2],[.15,2.4],[.29,2.8]].map(p=>new THREE.Vector2(...p)),10).toNonIndexed();
 const fanGeo=shell(1,.3,48,6,true),cupGeo=shell(1,.65,48,7),domeGeo=shell(1,-.5,24,4);
 function branch(points,radius,r,kind='bark',dynamic=false){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),g=new THREE.TubeGeometry(curve,22,radius,8,false).toNonIndexed();if(dynamic){const pivot=new THREE.Vector3(...points[Math.floor(points.length/2)]);g.translate(-pivot.x,-pivot.y,-pivot.z);const o=new THREE.Mesh(g,mats[r+kind]);o.position.copy(pivot);o.userData.origin=pivot.clone();root.add(o);collisionMeshes.push(o);return o;}emit(g,kind,r,0,0,0);g.dispose();}
 function plant(x,z,h,w,type,r,lean=0){const y=terrain.height(x,z);if(y==null)return;emit(stemGeo,'stone',r,x,y,z,.48,h/2.8,.48,0,0,lean);const offset=Math.sin(-lean)*h;
  emit(type==='cup'?cupGeo:type==='dome'?domeGeo:fanGeo,type==='cup'?'ivory':'jade',r,x+offset,y+h,z,w,w,w,type==='fan'?-.35-rand()*.65:0,rand()*6.28,lean);
  if(type==='cup')emit(rockGeo,'amber',r,x+offset,y+h+.13,z,.12,.3,.12);
  // Raised underside ribs and a thick mineral collar stay visible below the shell.
  emit(rockGeo,'stone',r,x+offset,y+h-.15,z,.38,.28,.38);
  for(let j=0;j<8;j++){const a=j/8*6.28;branch([[x+offset,y+h-.1,z],[x+offset+Math.cos(a)*w*.55,y+h-.04,z+Math.sin(a)*w*.55]],.025,r,'stone');}
  if(h>2.5)terrain.obstacles.push({x,z,radius:.23});
 }
 function rock(x,z,s,r){const y=terrain.height(x,z);if(y==null)return;emit(rockGeo,'stone',r,x,y+.24*s,z,s,.65*s,s*.8,rand(),rand()*6.28,0);if(s>.7)terrain.obstacles.push({x,z,radius:s*.65});}
 // Only new terrain triangles are emitted. A's original surface is never overlaid.
 const positions={B:[],C:[]};const clip=(poly)=>{const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ia=Math.hypot(...a)>=35,ib=Math.hypot(...b)>=35;if(ia)out.push(a);if(ia!==ib){let lo=0,hi=1;for(let n=0;n<18;n++){const t=(lo+hi)/2,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;if((Math.hypot(x,z)>=35)===ia)lo=t;else hi=t;}const t=(lo+hi)/2;out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}return out;};
 for(let z=-95;z<28;z+=1)for(let x=-29;x<85;x+=1)for(const tri of [[[x,z],[x,z+1],[x+1,z]],[[x+1,z],[x,z+1],[x+1,z+1]]]){if(!tri.every(p=>extensionDomain(...p)))continue;const p=clip(tri);for(let i=1;i<p.length-1;i++)for(const [px,pz] of [p[0],p[i],p[i+1]])positions[regionAt((tri[0][0]+tri[1][0]+tri[2][0])/3,(tri[0][1]+tri[1][1]+tri[2][1])/3)==='C'?'C':'B'].push(px,terrain.height(px,pz)??base.raw(px,pz)??-1.7,pz);}
 for(const r of ['B','C']){const ground=new THREE.BufferGeometry();ground.setAttribute('position',new THREE.Float32BufferAttribute(positions[r],3));ground.computeVertexNormals();const land=new THREE.Mesh(ground,mats[r+'earth']);land.name=r+'_continuous_soil_only_outside_A';land.receiveShadow=true;root.add(land);}
 // Clear task approaches, while density elsewhere varies organically.
 const reserved=(x,z,d=4)=>tasks.some(t=>Math.hypot(x-t.pos[0],z-t.pos[1])<d)||Math.hypot(x-14,z+71)<8||Math.hypot(x-35,z+8)<6||Math.hypot(x-36,z+37)<6;
 for(let i=0;i<360;i++){const x=-24+rand()*104,z=-91+rand()*111;if(Math.hypot(x,z)<37||!extensionDomain(x,z)||reserved(x,z))continue;const r=regionAt(x,z);if(r==='A')continue;if(i%3===0)rock(x,z,.4+rand()*1.2,r);else if(i%2===0)plant(x,z,4+rand()*5,2.8+rand()*2.5,i%5===0?'cup':i%7===0?'dome':'fan',r,(rand()-.5)*.22);else{for(let j=0;j<3;j++)emit(fanGeo,'jade',r,x+(rand()-.5),terrain.height(x,z)+.18,z+(rand()-.5),.24+rand()*.25,.4,.3,rand()*1.8,rand()*6.28,0);}}
 for(let i=0;i<650;i++){const x=-22+rand()*103,z=-91+rand()*112;if(Math.hypot(x,z)<37.5||!extensionDomain(x,z)||reserved(x,z,2.7))continue;const r=regionAt(x,z);if(r==='A')continue;const y=terrain.height(x,z);emit(rockGeo,i%4===0?'earth':'stone',r,x,y+.035,z,.3+rand()*1.1,.04+rand()*.1,.3+rand()*.9,0,rand()*6.28,0);}
 for(const [x,z,h,w,kind]of [[53,-21,7,5.3,'fan'],[65,-20,6.5,4.8,'fan'],[50,-9,7.8,5.2,'fan'],[67,-6,6,4.8,'cup'],[49,8,5.7,4,'cup'],[65,12,7,5,'fan'],[39,-17,6.8,4.6,'fan'],[69,-32,8,5.5,'fan']])plant(x,z,h,w,kind,'B',(rand()-.5)*.18);
 // Sculptural fallen wood is off the clearing, with finite capsule collision.
 for(const [x,z,l,yaw,r]of [[46,-19,9,1,'B'],[69,-5,6,.3,'B'],[-8,-67,8,-.5,'C']]){const y=terrain.height(x,z),dx=Math.sin(yaw)*l/2,dz=Math.cos(yaw)*l/2;branch([[x-dx,y+.6,z-dz],[x,y+1.2,z],[x+dx,y+.4,z+dz]],.48,r);terrain.obstacles.push({x,z,ax:x-dx,az:z-dz,bx:x+dx,bz:z+dz,radius:.52});for(let j=0;j<5;j++)rock(x-dx+dx*j*.4+.8,z-dz+dz*j*.4,.3,r);}
 // LIFE TREE: fluted trunk, buttress roots, branching crown, folded fan plates.
 const tx=14,tz=-71,ty=terrain.height(tx,tz),trunkPoints=[];
 for(let j=0;j<=15;j++)for(let i=0;i<=32;i++){const a=i/32*6.28,t=j/15,r=(3.5*Math.pow(1-t,3)+1.1)*(.92+.13*Math.cos(a*8)+.04*Math.sin(j+i));trunkPoints.push(tx+Math.cos(a)*r+Math.sin(t*5)*.45,ty+t*27,tz+Math.sin(a)*r);}
 const ti=[];for(let j=0;j<15;j++)for(let i=0;i<32;i++){const a=j*33+i;ti.push(a,a+33,a+34,a,a+34,a+1);}const trunk=new THREE.BufferGeometry();trunk.setAttribute('position',new THREE.Float32BufferAttribute(trunkPoints,3));trunk.setIndex(ti);const flatTrunk=trunk.toNonIndexed();flatTrunk.computeVertexNormals();emit(flatTrunk,'bark','C',0,0,0);terrain.obstacles.push({x:tx,z:tz,radius:4.7});
 for(let i=0;i<11;i++){const a=i/11*6.28,l=7+rand()*5,ex=tx+Math.cos(a)*l,ez=tz+Math.sin(a)*l,ey=terrain.height(ex,ez)??ty;branch([[tx+Math.cos(a)*1.4,ty+4,tz+Math.sin(a)*1.4],[tx+Math.cos(a)*4,ty+.6,tz+Math.sin(a)*4],[ex,ey+.12,ez]],.38,'C');/* Tall buttresses collide; low outer roots remain step-over. */terrain.obstacles.push({x:tx+Math.cos(a)*2.4,z:tz+Math.sin(a)*2.4,radius:.42});}
 for(let i=0;i<19;i++){const a=i*2.4,y=ty+12+i*.65,w=3.6+rand()*3.4,rad=3+rand()*6,ex=tx+Math.cos(a)*rad,ez=tz+Math.sin(a)*rad;branch([[tx,ty+8, tz],[tx+Math.cos(a)*rad*.5,y-2,tz+Math.sin(a)*rad*.5],[ex,y,ez]],.22+rand()*.16,'C');const leaf=new THREE.Mesh(fanGeo,mats['C'+(i%5===0?'amber':'jade')]);leaf.position.set(ex,y,ez);leaf.scale.set(w,w,w);leaf.rotation.set(-.8,a,0);leaf.castShadow=true;root.add(leaf);crowns.push({leaf,w,angle:-.2-rand()*.4});collisionMeshes.push(leaf);}
 // Root court seed cradle: concave organic shell with broad dry approach from south.
 emit(cupGeo,'bark','C',14,terrain.height(14,-66),-66,1.3,.7,1.05,0,0,0);
 const seedMat=new THREE.MeshPhysicalMaterial({color:'#c29b54',emissive:'#e6ad55',emissiveIntensity:.12,roughness:.3,clearcoat:.4});const seedObject=new THREE.Mesh(new THREE.IcosahedronGeometry(.27,2),seedMat);seedObject.position.set(14,terrain.height(14,-66)+.6,-66);root.add(seedObject);
 // B1: ash evidence leaves and localized particles, not a wildfire.
 const ashObjects=new THREE.Group();root.add(ashObjects);const ay=terrain.height(43,-6);
 const ash=new THREE.Mesh(new THREE.CircleGeometry(1.5,17),mats.Bash);ash.rotation.x=-Math.PI/2;ash.position.set(43,ay+.025,-6);ashObjects.add(ash);
 for(let j=0;j<4;j++){const o=new THREE.Mesh(stemGeo,mats.Bash);o.scale.set(.2,.25,.2);o.position.set(42+j*.45,ay,-6);o.rotation.z=.8;ashObjects.add(o);}
 const smokeGeo=new THREE.BufferGeometry(),smokePos=new Float32Array(36*3);for(let i=0;i<36;i++){smokePos.set([42.8+(rand()-.5)*1.5,ay+.2+rand()*2.2,-6+(rand()-.5)],i*3);}smokeGeo.setAttribute('position',new THREE.BufferAttribute(smokePos,3));const smoke=new THREE.Points(smokeGeo,new THREE.PointsMaterial({color:'#858885',size:.16,transparent:true,opacity:.27,depthWrite:false}));root.add(smoke);
 // B2 adjustable dead branch stays separate so the actual model responds to action.
 const by=terrain.height(58,-13),deadBranch=branch([[55,by+3.1,-13],[58,by+2.4,-13],[61,by+3,-14]],.16,'B','bark',true);
 const seedlings=[];for(let i=0;i<6;i++){const group=new THREE.Group();group.position.set(57+(i%3)*.65,terrain.height(58,-13),-13+Math.floor(i/3)*.8);const stem=new THREE.Mesh(new THREE.CylinderGeometry(.035,.06,.7,6),mats.Bstone);stem.position.y=.35;group.add(stem);for(let j=0;j<2;j++){const leaf=new THREE.Mesh(fanGeo,mats.Bjade);leaf.scale.set(.32,.4,.35);leaf.position.set(j?.2:-.2,.65,0);leaf.rotation.z=j?.6:-.6;group.add(leaf);}root.add(group);seedlings.push(group);}
 // B3 staggered host and nectar patches with open movement space between.
 const habitatPlants=new THREE.Group();root.add(habitatPlants);for(const [x,z]of [[56,5],[61,3]]){plant(x,z,.9,.65,'cup','B');plant(x+.8,z-.4,.75,.8,'fan','B');}for(let i=0;i<3;i++){const flower=new THREE.Mesh(i%2?fanGeo:cupGeo,mats['B'+(i%2?'jade':'ivory')]);flower.position.set(58.4+i*.5,terrain.height(59,6)+.65,6+i*.4);flower.scale.set(.45,.45,.45);habitatPlants.add(flower);}
 // C1 rain leaves feed a side runnel from the high eastern ridge.
 for(const [x,z,w]of [[-1,-57,2],[1,-59,1.2]])plant(x,z,1.6,w,'cup','C');
 const blocker=branch([[-.8,terrain.height(1,-56)+.3,-55.7],[2.4,terrain.height(1,-56)+.35,-56.2]],.14,'C','bark',true);
 // C2 is one irregular root ring, not a set of garden beds.
 branch([[23,terrain.height(26,-57)+.1,-55],[24,terrain.height(26,-57)+.15,-59],[29,terrain.height(26,-57)+.2,-59],[30,terrain.height(26,-57)+.1,-55]],.18,'C');
 for(let i=0;i<3;i++){const x=24+i*2;plant(x,-57,.65,.55,'fan','C');for(let j=0;j<4;j++)emit(fanGeo,'earth','C',x+(rand()-.5),terrain.height(x,-57)+.04,-57+(rand()-.5),.22,.1,.18,0,rand()*6.28,0);}
 // Physically sloped creeks rendered in the new land only, with layered moving normals.
 const waterUniforms={time:{value:0},health:{value:1}},waters=[];
 function creek(points,width,region){const c=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z))),p=[],indices=[];for(let i=0;i<=150;i++){const t=i/150,v=c.getPoint(t),d=c.getTangent(t),w=width*(.85+.15*Math.sin(t*24));for(const sign of [-1,1]){const x=v.x+d.z*w*sign,z=v.z-d.x*w*sign;p.push(x,(terrain.height(x,z)??-1.7)+.055,z); }if(i<150){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(indices);g.computeVertexNormals();const m=new THREE.MeshPhysicalMaterial({color:'#5a8583',roughness:.24,metalness:0,clearcoat:.8,envMapIntensity:.65,transparent:true,opacity:.74,depthWrite:false,side:THREE.DoubleSide});m.onBeforeCompile=s=>{s.uniforms.uFlowTime=waterUniforms.time;s.uniforms.uFlowHealth=waterUniforms.health;s.vertexShader='varying vec3 vFlow;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFlow=position;');s.fragmentShader='uniform float uFlowTime;uniform float uFlowHealth;varying vec3 vFlow;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float waves=sin(vFlow.x*12.+vFlow.z*7.-uFlowTime*2.2)+sin(vFlow.x*7.-vFlow.z*15.-uFlowTime*1.4);float glint=pow(.5+.5*sin(vFlow.x*9.+vFlow.z*11.-uFlowTime*1.6+waves*.5),12.);diffuseColor.rgb=mix(vec3(.12,.10,.16),vec3(.21,.53,.5),uFlowHealth)+glint*.12;diffuseColor.a=mix(.93,.62,uFlowHealth);`);s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=normalize(normal+vec3(dFdx(waves),dFdy(waves),0.)*.17);');};m.customProgramCacheKey=()=>`valley-flow-${region}`;const o=new THREE.Mesh(g,m);o.name='Downhill_creek_'+region;root.add(o);waters.push(o);return o;}
 creek([[66,-26],[58,-23],[49,-18],[40,-12],[35,-8]],.45,'B');
 creek([[35,-74],[20,-76],[-3,-61]],.4,'C');const irrigation=creek([[-3,-61],[1,-56],[-4,-44],[-8,-35]],.35,'C');
 // Stage boundaries: natural root arches and withered leaf tangles share collision state.
 const gates=[];function gate(x,z,width,name,required,r,yaw=0){const y=terrain.height(x,z)??-1.7,frame=new THREE.Group();frame.name=name;root.add(frame);const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-width/2,0,0),new THREE.Vector3(-width*.4,3,0),new THREE.Vector3(0,4.5,0),new THREE.Vector3(width*.4,3,0),new THREE.Vector3(width/2,0,0)]);const arch=new THREE.Mesh(new THREE.TubeGeometry(curve,30,.25,7,false),mats[r+'bark']);frame.add(arch);frame.position.set(x,y,z);frame.rotation.y=yaw;const tangled=new THREE.Group();frame.add(tangled);for(let i=0;i<16;i++){const o=new THREE.Mesh(fanGeo,mats[r+'ash']);o.scale.set(.65,.7,.8);o.position.set((i%5-2)*width/5,.4+Math.floor(i/5)*.7,(i%2-.5)*.3);o.rotation.set(i*.3,i*.7,.4);tangled.add(o);}gates.push({frame,tangled,required});}
 gate(35.5,-8,9,'A_to_B_root_arch','B','B',Math.PI/2);gate(36,-37,10,'B_to_C_root_arch','C','C',-.55);gate(0,-35.5,10,'Finale_return_root_arch','finale','C');
 // Visible withered root growth follows the actual locked boundary, not an invisible wall.
 const curtains={B:[],C:[],finale:[]};
 for(let i=0;i<100;i++){const a=i/100*Math.PI*2,x=Math.sin(a)*35.8,z=Math.cos(a)*35.8;if(!extensionDomain(x,z))continue;const r=regionAt(x,z),required=r==='C'&&x<9?'finale':r;curtains[required].push([x,z]);}
 for(let x=27;x<72;x+=2.4)if(extensionDomain(x,-35.3)&&Math.hypot(x,-35.3)>36)curtains.C.push([x,-35.3]);
 for(const [required,points]of Object.entries(curtains)){const geos=[];for(const [x,z]of points){const y=terrain.height(x,z);if(y==null)continue;for(let j=0;j<3;j++){dummy.position.set(x+(rand()-.5)*.8,y+.5+j*.65,z+(rand()-.5)*.8);dummy.rotation.set(-.7,rand()*6.28,rand()-.5);dummy.scale.set(1.3,1.1,1.1);dummy.updateMatrix();geos.push(fanGeo.clone().applyMatrix4(dummy.matrix));}}if(!geos.length)continue;const tangled=new THREE.Mesh(mergeGeometries(geos),mats.Cash);geos.forEach(g=>g.dispose());root.add(tangled);gates.push({tangled,required});}
 // Batch static surfaces by region and material, preserving all silhouette detail.
 for(const [key,geos]of buckets){const g=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());const m=new THREE.Mesh(g,mats[key]);m.name='Valley_sculpture_'+key;m.castShadow=true;m.receiveShadow=true;root.add(m);collisionMeshes.push(m);}
 const butterflies=[];for(let i=0;i<7;i++){const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:i%2?'#d9bd88':'#b0c49d',side:THREE.DoubleSide,roughness:.75});for(const sign of [-1,1]){const wing=new THREE.Mesh(new THREE.CircleGeometry(.13,5),mat);wing.scale.set(1,1.5,1);wing.position.x=sign*.1;g.add(wing);}root.add(g);butterflies.push(g);}
 // Each task has a recognizable physical anchor, small amber response and near label.
 for(const t of tasks){let position,anchor;if(t.region==='A'){anchor=legacyTargets.find(a=>a.type===t.anchor[0]&&a.index===t.anchor[1]);position=anchor.interactionPosition.clone();}else{position=new THREE.Vector3(t.pos[0],terrain.height(...t.pos),t.pos[1]);if(t.id==='C3')position.set(14,terrain.height(14,-63.9),-63.9);}
  const glow=new THREE.Mesh(new THREE.SphereGeometry(.055,8,6),new THREE.MeshBasicMaterial({color:'#e9ce91'}));glow.position.copy(position).y+=.75;root.add(glow);const ring=new THREE.Mesh(new THREE.RingGeometry(.65,.68,40),new THREE.MeshBasicMaterial({color:'#d4bd8c',transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.copy(position).y+=.045;root.add(ring);targets.push({...t,label:t.name,position,interactionPosition:position,glow,ring,anchor});}
 let version='';
 function sync(p){terrain.setProgress(p);const v=String(p.preview===true)+p.done.join(',');if(v!==version){version=v;terrain.connect(0,7.5);}irrigation.visible=p.done.includes('C1');habitatPlants.visible=p.done.includes('B3');for(const g of gates)g.tangled.visible=!p.preview&&(g.required==='finale'?!finale(p):!unlocked(p,g.required));}
 function update(dt,time,p,player,reduced,scan){sync(p);states.A.value=THREE.MathUtils.damp(states.A.value,completed(p,'A')===3?1:completed(p,'A')*.2,1,dt);for(const r of ['B','C']){const n=completed(p,r);states[r].value=THREE.MathUtils.damp(states[r].value,n===3?1:n*.09,1,dt);}waterUniforms.time.value=reduced?0:time;
  for(const c of crowns){c.leaf.rotation.x=THREE.MathUtils.damp(c.leaf.rotation.x,finale(p)?c.angle:-.8,1,dt);c.leaf.scale.y=THREE.MathUtils.damp(c.leaf.scale.y,finale(p)?c.w:c.w*.65,1,dt);}
  smoke.material.opacity=p.done.includes('B1')?.035:.27;smoke.position.x=reduced?0:Math.sin(time*.25)*.18;deadBranch.rotation.y=p.done.includes('B2')?.7:(p.drafts?.B2?.step??0)*.35;seedlings.forEach(g=>g.scale.y=p.done.includes('B2')?1:.55);blocker.visible=!p.done.includes('C1');seedMat.emissiveIntensity=finale(p)?.65:.08;
  for(const t of targets){const d=player.distanceTo(t.position),open=unlocked(p,t.region),done=p.done.includes(t.id);t.glow.visible=open&&!done;t.glow.position.y=t.position.y+.75+(reduced?0:Math.sin(time*1.6)*.06);t.ring.visible=open&&!done&&(scan||d<3);t.ring.material.opacity=d<3?.38:.14;}
  butterflies.forEach((g,i)=>{g.visible=p.done.includes('B3');const t=reduced?i:time*.35+i;g.position.set(58+Math.sin(t)*3,terrain.height(58,4)+1.1+Math.sin(t*1.7)*.4,4+Math.cos(t)*2);g.rotation.y=-t;g.children.forEach((w,j)=>w.rotation.y=(j?1:-1)*(reduced?.45:Math.sin(time*8+i)*.6));});
 }
 function perform(id,f){if(id==='B2')deadBranch.rotation.y=f*.7;if(id==='C1')blocker.position.x=blocker.userData.origin.x+f*2;if(id==='C3')seedMat.emissiveIntensity=.08+f*.5;}
 terrain.setProgress({done:[]});terrain.connect(0,7.5);
 return {root,terrain,targets,collisionMeshes,waters,update,sync,perform,states,tree:{x:tx,z:tz,height:35}};
}
