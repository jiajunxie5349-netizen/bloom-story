import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {mapLayout} from './map-config.js';

// Metres, with the existing lake bed and story stations as the spatial anchors.
// The open southern shore leads into an enclosing north bank, rather than rows.
export const wetlandHeroes=[
 ['fan',-15,10,4.2,4.2,-.5],['fan',-22,2,4.2,4.8,.35],
 ['fan',-24,-10,7.6,4.5,-.2],['fan',-17,-22,3.6,4.7,.5],
 ['fan',-5,-25,6.8,4.5,-.3],['fan',7,-24,4.4,3.7,.45],
 ['fan',22,-14,5.3,4.3,-.6],['fan',22,0,3.2,3.8,.2],
 ['fan',13,19,2.2,3.5,-.3],['fan',-15,23,1.6,3.6,.4],
 ['trumpet',8,-6,7.4,3.0,.3],['trumpet',15,-20,9.3,3.5,-.35],
 ['cup',15,-15,2.7,1.8,.2],['cup',17,-4,3.8,2.0,-.3],
 ['cup',19,-8,2.1,1.45,.3],['cup',10,-18,2.8,1.7,-.25],
 ['cone',9,-23,8.8,2.7,.2],['cone',-1,-26,5.1,1.8,-.4],
 ['darkcup',-19,16,4.4,2.3,.3],['darkcup',23,13,3.6,1.9,-.4],
 ['rosette',-7,22,3.3,2.7,.25],['rosette',-22,-18,4.2,2.8,-.25],
 ['dome',-23,23,4.1,2.7,.2],['dome',25,-23,6.0,3.5,-.3],
 ['fan',-6,9,3.8,3.8,.7],['fan',-10,-32,7.2,5.1,.2],['fan',1,-33,7.8,5.0,-.3]
];
export const wetlandRimRadius=a=>34+.35*Math.sin(a*3)+.20*Math.cos(a*7);
const colorPalettes={
 leaf:['#64735b','#87967d','#465548','#a3aa91','#676f67'],
 underside:['#474e48','#5a6154','#665c52'],
 stem:['#666d68','#878c80','#4a5552'],
 pale:['#c5bfb4','#a9b4b8','#dad2c4','#b9adb0'],
 rust:['#684b47','#866057','#a27764','#4c5350'],
 blue:['#6d8794','#899aa2','#555e72','#96858c']
};
function surface(palette,roughness=.78){
 const mat=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness,metalness:0,envMapIntensity:.12,side:THREE.DoubleSide});
 mat.name='Wetland_'+palette;mat.userData.palette=palette;
 mat.onBeforeCompile=s=>{
  s.vertexShader='varying vec3 vPatina;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvPatina=(modelMatrix*vec4(transformed,1.)).xyz;');
  s.fragmentShader=`varying vec3 vPatina;
float ph(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float pn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(ph(i),ph(i+vec3(1,0,0)),f.x),mix(ph(i+vec3(0,1,0)),ph(i+vec3(1,1,0)),f.x),f.y),mix(mix(ph(i+vec3(0,0,1)),ph(i+vec3(1,0,1)),f.x),mix(ph(i+vec3(0,1,1)),ph(i+vec3(1,1,1)),f.x),f.y),f.z);}
`+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat mineral=pn(vPatina*5.+pn(vPatina*1.3)*2.);float fleck=pn(vPatina*47.);float pores=pn(vPatina*135.);diffuseColor.rgb*=.68+mineral*.48+fleck*.19;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.33,.36,.33),smoothstep(.76,.9,fleck)*.22);');
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+(mineral-.5)*.16,.42,1.);');
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nfloat grain=pn(vPatina*80.);normal=normalize(normal+vec3(dFdx(grain),dFdy(grain),0.)*.16);');
 };mat.customProgramCacheKey=()=>`mineral-organic-v16-${palette}`;return mat;
}
function shell(profile,phase,palette,pleats=28,flute=.04){
 const positions=[],colors=[],uv=[],indices=[],segments=112;
 const ramp=colorPalettes[palette].map(c=>new THREE.Color(c));
 for(let j=0;j<profile.length;j++)for(let i=0;i<=segments;i++){
  const [radius,y]=profile[j],a=i/segments*Math.PI*2;
  const crease=Math.cos(a*pleats)*flute;
  const r=radius*(1+.055*Math.sin(a*3+phase)+.027*Math.sin(a*7-phase)+crease);
  const [dx,dz]=growthAxis(y,phase);
  positions.push(Math.cos(a)*r+dx,y+radius*(.045*Math.sin(a*5+phase)+crease*.38),Math.sin(a)*r*.92+dz);
  const mix=.5+.5*Math.sin(a*2.1+phase+j*.31),c=ramp[Math.floor(mix*(ramp.length-.001))].clone();
  c.multiplyScalar(.89+.11*Math.cos(a*pleats));colors.push(c.r,c.g,c.b);uv.push(i/segments,j/(profile.length-1));
  if(j<profile.length-1&&i<segments){const q=j*(segments+1)+i;indices.push(q,q+segments+2,q+1,q,q+segments+1,q+segments+2);}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function growthAxis(y,phase){return [.10*Math.sin(phase)*y+.06*Math.sin(phase+.7)*Math.max(0,y-1.5),.07*Math.cos(phase)*y+.05*Math.cos(phase+.4)*Math.max(0,y-2.2)];}
function fanShell(radius,phase){
 const seg=28,rings=6,positions=[],colors=[],uv=[],indices=[],palette=colorPalettes.leaf.map(c=>new THREE.Color(c));
 for(let side=0;side<2;side++)for(let j=0;j<=rings;j++)for(let i=0;i<=seg;i++){
  const t=j/rings,a=i/seg*Math.PI*2;
  const gap=Math.atan2(Math.sin(a-1.3-phase),Math.cos(a-1.3-phase));
  const notch=1-.16*Math.exp(-Math.pow(gap/.11,2))*Math.pow(t,6),r=radius*t*(1+.09*Math.sin(a*3+phase)+.045*Math.sin(a*7))*notch;
  // Alternating raised ribs and deep valleys radiate from the petiole socket.
  const fold=(i%2===0?1:-.35)*radius*(.045*t+.045*Math.sin(Math.PI*t));
  positions.push(Math.cos(a)*r,Math.pow(t,1.65)*radius*.24+fold+Math.sin(a+phase)*t*t*radius*.13-side*.045,Math.sin(a)*r*.84);
  const c=palette[(Math.floor(i/3)+Math.floor(j/3))%palette.length].clone().multiplyScalar(side?.66:i%2?.84:1.02);colors.push(c.r,c.g,c.b);uv.push(i/seg,t);
  if(j<rings&&i<seg){const q=side*(rings+1)*(seg+1)+j*(seg+1)+i,n=seg+1;if(side)indices.push(q,q+n,q+1,q+1,q+n,q+n+1);else indices.push(q,q+1,q+n,q+1,q+n+1,q+n);}
 }
 const offset=(rings+1)*(seg+1),rim=rings*(seg+1);
 for(let i=0;i<seg;i++)indices.push(rim+i,rim+i+1,offset+rim+i,rim+i+1,offset+rim+i+1,offset+rim+i);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function createWetlandHabitat(terrain){
 const group=new THREE.Group();group.name='Faceted_alien_wetland';const collisionMeshes=[],solids=[],plants=[];
 const mats=Object.fromEntries(Object.keys(colorPalettes).map(k=>[k,surface(k,k==='leaf'?.65:k==='pale'?.70:.82)]));
 mats.leaf.flatShading=true;mats.blue.flatShading=true;
 function mesh(g,mat,parent,solid=true){const m=new THREE.Mesh(g,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);if(solid)collisionMeshes.push(m);return m;}
 function plant(kind,x,z,h,r,phase){
  const y=terrain.raw(x,z);if(y==null||y<-2.3)return;
  // Reserve the existing continuous outer exploration loop without drawing a
  // path. Low crowns need their whole footprint clear; tall crowns only roots.
  const clearance=h<3?r+.6:kind==='cone'?r+.5:kind==='fan'?1:r*.31+.5;
  if(Math.abs(Math.hypot(x,z)-30)<clearance)return;
  if(mapLayout.sites.some(s=>Math.hypot(x-s.x,z-s.z)<2.5)||Math.hypot(x,z-7.5)<2.5)return;
  const p=new THREE.Group();p.position.set(x,y-.025,z);p.rotation.y=phase;group.add(p);
  const [bend,bendZ]=growthAxis(h,phase);
  if(kind==='fan'){
   const stem=shell([[0,-.07],[.52,0],[.28,.26],[.16,h*.28],[.13,h*.7],[.11,h]],phase,'stem',16,.07);mesh(stem,mats.stem,p);
   const tilt=Math.min(1.10+.14*Math.sin(phase),Math.asin(Math.min(.95,(h-.35)/(r*.84))));
   const leaf=mesh(fanShell(r,phase),mats.leaf,p);leaf.position.set(bend,h,bendZ);leaf.rotation.set(tilt,0,.16*Math.cos(phase));leaf.name='Thick_radially_pleated_fan';
  }else if(kind==='cone'){
   mesh(shell([[0,-.07],[r,0],[r*.91,h*.12],[r*.67,h*.36],[r*.48,h*.62],[r*.22,h*.87],[.03,h],[0,h]],phase,'blue',14,.12),mats.blue,p).name='Weathered_asymmetric_blue_cone';
  }else{
   const dark=kind==='darkcup',dome=kind==='dome',neck=dome?h*.67:h*.73;
   mesh(shell([[0,-.06],[r*.31,0],[r*.17,h*.12],[r*.08,h*.4],[r*.105,neck]],phase,'stem',28,.10),mats.stem,p);
   if(dome){mesh(shell([[r*.10,neck-.04],[r*.85,neck-.10],[r,neck+.06],[r*.88,neck+h*.12],[r*.55,neck+h*.28],[0,h]],phase,'rust',16,.055),mats.rust,p);}
   else{
    const cup=new THREE.Group(),[cx,cz]=growthAxis(neck,phase);cup.position.set(cx,neck,cz);cup.rotation.x=.48+.12*Math.sin(phase);p.add(cup);
    const cupMesh=(g,m)=>{g.translate(-cx,-neck,-cz);return mesh(g,m,cup);};
    cupMesh(shell([[r*.10,neck],[r*.25,neck+h*.04],[r*.65,h*.90],[r,h],[r*.98,h+.045]],phase,'rust',28,.045),mats.rust);
    cupMesh(shell([[r*.98,h+.045],[r*.93,h+.065],[r*.65,h*.91],[r*.27,neck+h*.055],[0,neck+.025]],phase,dark?'rust':kind==='rosette'?'blue':'pale',56,.022),dark?mats.rust:kind==='rosette'?mats.blue:mats.pale).name='Deep_closed_cup_with_radial_pleats';
    if(kind==='trumpet'){
     const pistil=cupMesh(shell([[0,neck+.03],[.10,neck+.03],[.13,h*.94],[.09,h*1.04],[0,h*1.05]],phase,'rust',12,.025),mats.rust);pistil.name='Attached_pistil';
    }
   }
  }
  const foot=kind==='cone'?r*.85:kind==='fan'?.38:r*.22;
  solids.push({x,z,radius:foot});plants.push({kind,x,z,y,height:h,radius:r});p.name=`Wetland_${kind}_${plants.length}`;
 }
 wetlandHeroes.forEach(p=>plant(...p));
 // Smaller individuals grow near their mature neighbours, in loose colonies.
 wetlandHeroes.forEach(([kind,x,z,h,r,phase],i)=>{
  if(i%3===0){plant(kind,x+2.7*Math.cos(phase+1),z+2.7*Math.sin(phase+1),h*.38,r*.40,phase+1.4);plant('cup',x-2.4*Math.cos(phase),z-2.4*Math.sin(phase),1.2+(i%4)*.3,.7+(i%3)*.2,phase-.9);}
 });
 // Low relief plates follow the same terrain surface used by walking. Their
 // upper face never rises enough to hide a pit or create an invisible step.
 const stoneMat=new THREE.MeshStandardMaterial({color:'#7b7870',roughness:.93,metalness:0,vertexColors:true,envMapIntensity:.04});
 const wetMat=stoneMat.clone();wetMat.roughness=.47;wetMat.color.set('#686570');
 const color=new THREE.Color();
 for(let i=0;i<230;i++){
  const a=i*2.39996,rr=6+(i%29)*.78,x=-4+Math.cos(a)*rr,z=-6+Math.sin(a)*rr,y=terrain.raw(x,z);
  if(y==null||y<-2.36||Math.hypot(x,z)>33)continue;
  const positions=[],colors=[],indices=[],n=7,rad=.45+(i%7)*.22;
  for(let side=0;side<2;side++)for(let j=0;j<n;j++){
   const t=j/n*Math.PI*2,R=rad*(.82+.18*Math.sin(j*17+i)),px=x+Math.cos(t)*R,pz=z+Math.sin(t)*R;
   const floor=terrain.raw(px,pz)??y;positions.push(px,floor+(side?-.22:.035),pz);color.set(j%3===0?'#958d80':j%3===1?'#777b70':'#a18e85');colors.push(color.r,color.g,color.b);
   if(!side&&j>1)indices.push(0,j,j-1);
   if(!side){const next=(j+1)%n;indices.push(j,next,j+n,next,next+n,j+n);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();mesh(g,y<-1.9?wetMat:stoneMat,group,false).name='Terrain_fitted_broken_bank_plate';
 }
 // Water stones and rusty shards stay off story approaches and the walking ring.
 const rockMat=new THREE.MeshStandardMaterial({color:'#62676a',roughness:.56,metalness:0,envMapIntensity:.14});
 for(let i=0;i<105;i++){
  const a=i*2.39996,r=8+(i%19)*.62,x=-4+Math.cos(a)*r,z=-6+Math.sin(a)*r,y=terrain.raw(x,z);
  if(y==null||y>-1.65||y<-2.85||mapLayout.sites.some(s=>Math.hypot(x-s.x,z-s.z)<2.7))continue;
  const R=.25+(i%6)*.18,g=i%4?new THREE.IcosahedronGeometry(1,2):new THREE.ConeGeometry(1,2,5);
  const rock=mesh(g,i%4?rockMat:mats.rust,group);rock.position.set(x,y+.14,z);rock.rotation.set(.12,a,.15);rock.scale.set(R,i%4?R*.48:R*.9,R*.72);
  // The shard material uses vertex colours; give its uncoloured source a patina.
  if(!g.attributes.color){const c=new THREE.Color(i%4?'#a0a4a1':'#8c6258'),arr=new Float32Array(g.attributes.position.count*3);for(let j=0;j<arr.length;j+=3)arr.set([c.r,c.g,c.b],j);g.setAttribute('color',new THREE.BufferAttribute(arr,3));}
  solids.push({x,z,radius:R*.6});
 }
 // A visible, irregular mineral bank closes the finite terrain before its
 // numerical radius limit, so the player meets a surface instead of thin air.
 const rv=[],rc=[],ri=[],rn=224;
 for(let i=0;i<=rn;i++)for(let j=0;j<3;j++){
  const a=i/rn*Math.PI*2,r=wetlandRimRadius(a),x=Math.sin(a)*r,z=Math.cos(a)*r,base=terrain.raw(x,z)??-1.5,R=r+(j===0?0:j===1?.7:5.5),y=base+(j===0?-.15:j===1?1.8+.3*Math.sin(a*5):3.2+.6*Math.sin(a*3+.4));
  rv.push(Math.sin(a)*R,y,Math.cos(a)*R);color.set(j===0?'#48484b':j===1?'#686b66':'#59645f');rc.push(color.r,color.g,color.b);
  if(i<rn&&j<2){const q=i*3+j;ri.push(q,q+1,q+3,q+1,q+4,q+3);}
 }
 const rim=new THREE.BufferGeometry();rim.setAttribute('position',new THREE.Float32BufferAttribute(rv,3));rim.setAttribute('color',new THREE.Float32BufferAttribute(rc,3));rim.setIndex(ri);rim.computeVertexNormals();mesh(rim,mats.underside,group).name='Scalloped_mineral_basin_bank';
 // Curved scenic enclosure beyond the playable radius. Its identity is an
 // ambiguous mineral shell; no doorway, greenhouse, paving or route partition.
 const bp=[],bc=[],bi=[],segments=144;
 for(let j=0;j<=segments;j++)for(let k=0;k<3;k++){
  const a=Math.PI*.47+j/segments*Math.PI*1.06,R=39.5+(k===1?.16:0),h=k===0?-3:k===1?3.8:9.0;
  bp.push(Math.sin(a)*R,h+.65*Math.sin(a*3),Math.cos(a)*R);color.set(k===1?'#354551':'#222b34');bc.push(color.r,color.g,color.b);
  if(j<segments&&k<2){const q=j*3+k;bi.push(q,q+3,q+1,q+1,q+3,q+4);}
 }
 const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(bp,3));bg.setAttribute('color',new THREE.Float32BufferAttribute(bc,3));bg.setIndex(bi);bg.computeVertexNormals();mesh(bg,mats.blue,group,false).name='Curved_mineral_scenic_enclosure';
 group.updateMatrixWorld(true);
 // Keep the exact source meshes for the body/camera bake, but draw shared
 // materials in a few batches instead of hundreds of separate rock/leaf calls.
 const backdrop=group.getObjectByName('Curved_mineral_scenic_enclosure'),batches=new Map();
 group.traverse(o=>{if(!o.isMesh||o===backdrop)return;const g=o.geometry.clone().applyMatrix4(o.matrixWorld);if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(g);});
 group.clear();group.add(backdrop);
 for(const [mat,geometries] of batches){const merged=mergeGeometries(geometries);if(!merged)throw Error('Wetland material batch failed');const m=new THREE.Mesh(merged,mat);m.name='Batched_'+mat.name;m.castShadow=true;m.receiveShadow=true;group.add(m);for(const g of geometries)g.dispose();}
 return {group,collisionMeshes,solids,plants,update(healed){for(const m of Object.values(mats))m.envMapIntensity=.12+healed*.04;}};
}
