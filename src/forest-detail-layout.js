// Shared by rendering, navigation and the local layout validator.
export function touchesSolid(x,z,o,padding=.19){
 let px=o.x,pz=o.z;
 if(o.ax!==undefined){const dx=o.bx-o.ax,dz=o.bz-o.az,t=Math.max(0,Math.min(1,((x-o.ax)*dx+(z-o.az)*dz)/(dx*dx+dz*dz)));px=o.ax+t*dx;pz=o.az+t*dz;}
 return Math.hypot(x-px,z-pz)<(o.radius??o.r)+padding;
}
export function forestDetailLayout(terrain,sites=[],chapter=1){
 let seed=chapter===1?93217:73143;const random=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
 const height=(x,z)=>terrain.height(x,z),valid=(x,z)=>{const y=height(x,z);return y!=null&&y>-2.3&&Math.hypot(x,z)<33.5&&!terrain.blocked.has(terrain.index(x,z));};
 const clear=(x,z,r)=>sites.every(s=>Math.hypot(x-(s.x??s.position.x),z-(s.z??s.position.z))>r);
 const logs=[],plants=[];
 for(let i=0;i<600&&logs.length<11;i++){
  const a=random()*Math.PI*2,r=5+random()*23,x=Math.sin(a)*r,z=Math.cos(a)*r,yaw=random()*Math.PI*2,length=2.8+random()*2.2,radius=.23+random()*.12;
  const dx=Math.sin(yaw)*length/2,dz=Math.cos(yaw)*length/2,ax=x-dx,az=z-dz,bx=x+dx,bz=z+dz;
  if(!clear(x,z,4+length/2)||![[x,z],[ax,az],[bx,bz]].every(([px,pz])=>valid(px,pz))||Math.abs(height(ax,az)-height(bx,bz))>.22||logs.some(l=>Math.hypot(x-l.x,z-l.z)<5))continue;
  logs.push({x,z,ax,az,bx,bz,y:height(x,z),ya:height(ax,az),yb:height(bx,bz),yaw,length,radius});
 }
 // Jittered clusters cross former radial and circular clearings; only task reach is reserved.
 for(let i=0;i<540;i++){
  const x=(random()-.5)*67,z=(random()-.5)*67;
  if(!valid(x,z)||!clear(x,z,1.7))continue;
  plants.push({x,z,y:height(x,z),yaw:random()*Math.PI*2,scale:.45+random()*.8,kind:i%3});
 }
 return {logs,plants,solids:logs.map(l=>({...l}))};
}
