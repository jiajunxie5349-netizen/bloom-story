// Shared, non-periodic woodland floor. The ground stays matte at every quality level.
export const floorNoise = `
float floorHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float floorNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(floorHash(i),floorHash(i+vec2(1.,0.)),f.x),mix(floorHash(i+vec2(0.,1.)),floorHash(i+vec2(1.)),f.x),f.y);}
vec3 woodlandFloor(vec2 p,float heal){
 vec2 warp=vec2(floorNoise(p*.27),floorNoise(p*.23+19.))*2.8;
 float humus=floorNoise(p*.72+warp),moss=floorNoise(p*2.7+warp);
 float fibres=floorNoise(p*65.),crumbs=floorNoise(p*19.);
 vec3 litter=mix(vec3(.043,.028,.016),vec3(.105,.081,.039),humus);
 vec3 turf=mix(vec3(.040,.038,.023),vec3(.078,.075,.037),moss);
 turf=mix(turf,mix(vec3(.035,.082,.025),vec3(.09,.16,.046),moss),heal);
 float cover=smoothstep(.19,.65,humus*.4+moss*.6);
 return mix(litter,turf,cover)*(.74+fibres*.3+crumbs*.18);
}`;

// Jitter every cell independently, then shuffle: low detail still covers the entire map.
// Soft ground cover never contributes collision or camera blockers.
export function floorScatter(terrain,seed=713,spacing=.21){
 const random=()=>((seed=seed*16807%2147483647)/2147483647),points=[];
 for(let x=-terrain.radius;x<terrain.radius;x+=spacing)for(let z=-terrain.radius;z<terrain.radius;z+=spacing){
  const px=x+random()*spacing,pz=z+random()*spacing;
  if(Math.hypot(px,pz)>terrain.radius-.25)continue;
  const y=terrain.height(px,pz),raw=terrain.raw(px,pz);
  if(y==null||raw==null||raw<=-2.15)continue;
  // Leave only little litter openings, rather than bare rows between grass clumps.
  if(random()<.07)continue;
  points.push({x:px,y:y-.018,z:pz,angle:random()*Math.PI*2,scale:.65+random()*.85});
 }
 for(let i=points.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[points[i],points[j]]=[points[j],points[i]];}
 return points;
}

