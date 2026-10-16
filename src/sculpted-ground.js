import * as THREE from 'three';
// A continuous surface replaces the old extruded grid-cell banks. Physics still
// follows the tested height field; dry walking surfaces retain their elevation.
export function sculptedGround(terrain,material){
 const n=Math.round((terrain.size-1)*1.5)+1,step=terrain.step/1.5,min=terrain.min,positions=new Float32Array(n*n*3),indices=[];
 const raw=(x,z)=>terrain.heights[Math.max(0,Math.min(terrain.size-1,z))*terrain.size+Math.max(0,Math.min(terrain.size-1,x))]??-3.3;
 const cubic=(a,b,c,d,t)=>b+.5*t*(c-a+t*(2*a-5*b+4*c-d+t*(3*(b-c)+d-a)));
 for(let iz=0;iz<n;iz++)for(let ix=0;ix<n;ix++){const fx=ix/1.5,fz=iz/1.5,x=Math.floor(fx),z=Math.floor(fz),u=fx-x,v=fz-z;const bilinear=(raw(x,z)*(1-u)+raw(x+1,z)*u)*(1-v)+(raw(x,z+1)*(1-u)+raw(x+1,z+1)*u)*v;const rows=[-1,0,1,2].map(d=>cubic(raw(x-1,z+d),raw(x,z+d),raw(x+1,z+d),raw(x+2,z+d),u));const smooth=cubic(...rows,v);const y=bilinear>-2.15?THREE.MathUtils.clamp(smooth,bilinear-.035,bilinear+.035):THREE.MathUtils.lerp(bilinear,THREE.MathUtils.clamp(smooth,-3.35,-2.10),.7);const i=(iz*n+ix)*3;positions.set([min+ix*step,y,min+iz*step],i);if(ix<n-1&&iz<n-1&&Math.hypot(min+(ix+.5)*step,min+(iz+.5)*step)<35.5){const a=iz*n+ix;indices.push(a,a+n,a+1,a+1,a+n,a+n+1);}}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,material);mesh.name='Continuous_sculpted_forest_floor';mesh.receiveShadow=true;return mesh;
}

