import * as THREE from 'three';
// Static camera occlusion grid. The rendered meshes and player collision data
// remain unchanged; only triangle lookup is accelerated.
export function buildOcclusionIndex(meshes,cellSize=2){
 const cells=new Map(),key=(x,y,z)=>`${x},${y},${z}`;let count=0;
 for(const m of meshes)count+=(m.geometry.index?.count??m.geometry.attributes.position.count)/3;
 const triangles=new Float32Array(count*9),seen=new Uint32Array(count);const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),hit=new THREE.Vector3(),start=new THREE.Vector3();let id=0,stamp=0,lastTested=0;
 for(const mesh of meshes){const p=mesh.geometry.attributes.position,idx=mesh.geometry.index,n=idx?.count??p.count;
  for(let i=0;i<n;i+=3){a.fromBufferAttribute(p,idx?idx.getX(i):i).applyMatrix4(mesh.matrixWorld);b.fromBufferAttribute(p,idx?idx.getX(i+1):i+1).applyMatrix4(mesh.matrixWorld);c.fromBufferAttribute(p,idx?idx.getX(i+2):i+2).applyMatrix4(mesh.matrixWorld);a.toArray(triangles,id*9);b.toArray(triangles,id*9+3);c.toArray(triangles,id*9+6);
   const x0=Math.floor(Math.min(a.x,b.x,c.x)/cellSize),x1=Math.floor(Math.max(a.x,b.x,c.x)/cellSize),y0=Math.floor(Math.min(a.y,b.y,c.y)/cellSize),y1=Math.floor(Math.max(a.y,b.y,c.y)/cellSize),z0=Math.floor(Math.min(a.z,b.z,c.z)/cellSize),z1=Math.floor(Math.max(a.z,b.z,c.z)/cellSize);
   for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++){const k=key(x,y,z);let list=cells.get(k);if(!list){list=[];cells.set(k,list);}list.push(id);}id++;
  }
 }
 return {get triangleCount(){return count;},get lastTested(){return lastTested;},nearest(ray,minDistance=0,maxDistance=12){
  lastTested=0;if(maxDistance<=minDistance)return null;if(++stamp===0xffffffff){seen.fill(0);stamp=1;}
  ray.at(minDistance,start);let x=Math.floor(start.x/cellSize),y=Math.floor(start.y/cellSize),z=Math.floor(start.z/cellSize);const dx=ray.direction.x,dy=ray.direction.y,dz=ray.direction.z,sx=Math.sign(dx),sy=Math.sign(dy),sz=Math.sign(dz);
  const deltaX=dx?cellSize/Math.abs(dx):Infinity,deltaY=dy?cellSize/Math.abs(dy):Infinity,deltaZ=dz?cellSize/Math.abs(dz):Infinity;
  let tx=dx?((x+(sx>0?1:0))*cellSize-ray.origin.x)/dx:Infinity,ty=dy?((y+(sy>0?1:0))*cellSize-ray.origin.y)/dy:Infinity,tz=dz?((z+(sz>0?1:0))*cellSize-ray.origin.z)/dz:Infinity,nearest=maxDistance,found=false,travel=minDistance;
  // Grid traversal visits every crossed cell, including rays parallel to a face.
  const limit=Math.ceil((maxDistance-minDistance)*3/cellSize)+8;
  for(let step=0;step<limit&&travel<=nearest;step++){
   for(const tri of cells.get(key(x,y,z))??[]){if(seen[tri]===stamp)continue;seen[tri]=stamp;lastTested++;a.fromArray(triangles,tri*9);b.fromArray(triangles,tri*9+3);c.fromArray(triangles,tri*9+6);if(!ray.intersectTriangle(a,b,c,false,hit))continue;const d=hit.distanceTo(ray.origin);if(d>minDistance&&d<=nearest){nearest=d;found=true;}}
   if(tx<=ty&&tx<=tz){travel=tx;x+=sx;tx+=deltaX;}else if(ty<=tz){travel=ty;y+=sy;ty+=deltaY;}else{travel=tz;z+=sz;tz+=deltaZ;}
  }
  return found?nearest:null;
 }};
}
