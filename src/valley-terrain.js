import {unlocked,finale} from './valley-data.js';
import {touchesSolid} from './forest-detail-layout.js';
export const ellipse=(x,z,cx,cz,rx,rz)=>((x-cx)/rx)**2+((z-cz)/rz)**2<1;
export function extensionDomain(x,z){return ellipse(x,z,52,-9,32,36)||ellipse(x,z,14,-61,42,34);}
export function regionAt(x,z){return Math.hypot(x,z)<=35?'A':z<-35?'C':'B';}
export function extensionHeight(base,x,z){if(!extensionDomain(x,z))return null;const r=Math.hypot(x,z),edge=base.height(x*34.7/r,z*34.7/r)??-1.7,h=-1.7+Math.max(0,x-32)*.025+Math.max(0,-z-30)*.025;const t=Math.max(0,Math.min(1,(r-35)/7));return edge*(1-t)+h*t+Math.sin(x*.16)*Math.cos(z*.13)*.055*t;}
// Composition wrapper leaves the original A grid, blocked cells and placements intact.
export class ValleyTerrain{
 constructor(base){this.base=base;this.obstacles=[];this.progress={done:[]};this.min=-106;this.step=.5;this.size=385;this.radius=145;this.safe=new Set();this.reachable=this.safe;this.blocked=new Set();this.plantingBlocked=new Set();}
 setProgress(p){this.progress=p;}
 index(x,z){const a=Math.round((x-this.min)/this.step),b=Math.round((z-this.min)/this.step);return a>=0&&b>=0&&a<this.size&&b<this.size?b*this.size+a:-1;}
 coordinates(i){return [this.min+i%this.size*this.step,this.min+Math.floor(i/this.size)*this.step];}
 raw(x,z){return Math.hypot(x,z)<=35?this.base.raw(x,z):extensionHeight(this.base,x,z);}
 height(x,z){return Math.hypot(x,z)<=35?this.base.height(x,z):extensionHeight(this.base,x,z);}
 allowed(x,z,p=this.progress){if(p.preview===true)return true;const r=regionAt(x,z);if(!unlocked(p,r))return false;/* The western return is a visible root tangle until the finale. */if(r==='C'&&x<9&&z>-40&&!finale(p))return false;return true;}
 canMove(x,z,oldY,ignoreGates=false){const y=this.height(x,z);if(y==null||!Number.isFinite(oldY)||Math.abs(y-oldY)>.36||!ignoreGates&&!this.allowed(x,z))return false;if(Math.hypot(x,z)<=35&&!this.base.canMove(x,z,oldY))return false;if(Math.hypot(x,z)>36&&![[.85,0],[-.85,0],[0,.85],[0,-.85]].every(([a,b])=>extensionDomain(x+a,z+b)||Math.hypot(x+a,z+b)<=35))return false;if(this.obstacles.some(o=>touchesSolid(x,z,o,.23)))return false;return [[.22,0],[-.22,0],[0,.22],[0,-.22]].every(([a,b])=>this.height(x+a,z+b)!=null);}
 nearest(x,z){if(this.canMove(x,z,this.height(x,z)))return [x,z];let best=null,dist=Infinity;for(const i of this.safe){const [a,b]=this.coordinates(i),d=(a-x)**2+(b-z)**2;if(d<dist&&this.canMove(a,b,this.height(a,b))){dist=d;best=[a,b];}}return best??this.base.nearest(0,7.5);}
 connect(x,z){const [a,b]=this.nearest(x,z),seed=this.index(a,b),q=[seed];this.safe=new Set([seed]);this.reachable=this.safe;for(let k=0;k<q.length;k++){const i=q[k],[px,pz]=this.coordinates(i),y=this.height(px,pz);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=px+dx*this.step,nz=pz+dz*this.step,j=this.index(nx,nz);if(j<0||this.safe.has(j)||!this.canMove(nx,nz,y))continue;this.safe.add(j);q.push(j);}}}
 pathTo(x,z,tx,tz){const start=this.index(...this.nearest(x,z)),goal=this.index(...this.nearest(tx,tz)),q=[start],parents=new Map([[start,-1]]);for(let k=0;k<q.length;k++){const i=q[k];if(i===goal)break;const [a,b]=this.coordinates(i);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const c=a+dx*this.step,d=b+dz*this.step,j=this.index(c,d);if(j<0||parents.has(j)||!this.safe.has(j)||!this.canMove(c,d,this.height(a,b)))continue;parents.set(j,i);q.push(j);}}if(!parents.has(goal))return [];const out=[];for(let i=goal;i!==-1;i=parents.get(i)){const [a,b]=this.coordinates(i);out.push([a,this.height(a,b),b]);}return out.reverse();}
}
