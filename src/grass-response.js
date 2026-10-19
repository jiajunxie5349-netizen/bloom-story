// A small trail of body positions gives grass a soft bend and a gradual recovery.
// Time-based fading avoids changing terrain or adding movement blockers.
export function trailInfluence(x,z,trail,time){
 let strength=0;
 for(const p of trail){const d=Math.hypot(x-p.x,z-p.z),age=time-p.time;if(age<0||age>2.8||d>.9)continue;strength=Math.max(strength,(1-d/.9)*Math.exp(-age*1.35));}
 return strength;
}
export function growWeight(heal){const t=Math.max(0,Math.min(1,(heal-.25)/.65));return t*t*(3-2*t);}
