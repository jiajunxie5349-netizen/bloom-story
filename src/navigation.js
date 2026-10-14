export class Terrain {
  constructor(data) { Object.assign(this, data); this.reachable = new Set(); }
  index(x,z) { const ix=Math.round((x-this.min)/this.step), iz=Math.round((z-this.min)/this.step); return ix>=0&&iz>=0&&ix<this.size&&iz<this.size ? iz*this.size+ix : -1; }
  coordinates(i) { return [this.min+(i%this.size)*this.step, this.min+Math.floor(i/this.size)*this.step]; }
  raw(x,z) { const i=this.index(x,z); return i<0 ? null : this.heights[i]; }
  connect(x,z) {
    let seed=this.index(x,z);
    if (this.heights[seed] == null) seed=this.heights.findIndex(v=>v!=null && v > -2.3);
    this.reachable=new Set([seed]); const queue=[seed];
    for(let k=0;k<queue.length;k++) {
      const i=queue[k], [px,pz]=this.coordinates(i);
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx=px+dx*this.step,nz=pz+dz*this.step,j=this.index(nx,nz);
        if(j<0||this.reachable.has(j)||Math.hypot(nx,nz)>18||this.heights[j]==null||this.heights[j]<-2.45||Math.abs(this.heights[j]-this.heights[i])>.24) continue;
        this.reachable.add(j);queue.push(j);
      }
    }
    // Match navigation connectivity to the player's footprint, not just a point.
    const safe=new Set([...this.reachable].filter(i=>{const [a,b]=this.coordinates(i);return this.canMove(a,b,this.heights[i]);}));
    if(!safe.has(seed))seed=[...safe].sort((a,b)=>{const [ax,az]=this.coordinates(a),[bx,bz]=this.coordinates(b);return (ax-x)**2+(az-z)**2-(bx-x)**2-(bz-z)**2;})[0];
    const connected=new Set([seed]),footQueue=[seed];
    for(let k=0;k<footQueue.length;k++){
      const i=footQueue[k];for(const j of [i-1,i+1,i-this.size,i+this.size]){
        if(!safe.has(j)||connected.has(j)||Math.abs(this.heights[j]-this.heights[i])>.24)continue;
        const [a,b]=this.coordinates(i),[c,d]=this.coordinates(j);
        if(Math.hypot(a-c,b-d)>this.step*1.1)continue;
        connected.add(j);footQueue.push(j);
      }
    }
    // Keep full valid cells for radius checks; task placement uses the safe component.
    this.safe=connected;
  }
  nearest(x,z) {
    let best=-1,dist=Infinity;
    for(const i of (this.safe??this.reachable)) { const [a,b]=this.coordinates(i),d=(a-x)**2+(b-z)**2; if(d<dist){dist=d;best=i;} }
    return this.coordinates(best);
  }
  height(x,z) {
    const i=this.index(x,z); if(!this.reachable.has(i)) return null;
    // Bilinear interpolation within valid ground cells, fallback at terrain edges.
    const fx=(x-this.min)/this.step,fz=(z-this.min)/this.step,ix=Math.floor(fx),iz=Math.floor(fz);
    if(ix<0||iz<0||ix>=this.size-1||iz>=this.size-1)return this.heights[i];
    const a=iz*this.size+ix,hs=[a,a+1,a+this.size,a+this.size+1].map(j=>this.heights[j]);
    if(hs.some(v=>v==null))return this.heights[i];
    const u=fx-ix,v=fz-iz;return (hs[0]*(1-u)+hs[1]*u)*(1-v)+(hs[2]*(1-u)+hs[3]*u)*v;
  }
  canMove(x,z,oldY) {
    const y=this.height(x,z); if(y==null||Math.abs(y-oldY)>.36)return false;
    return [[.16,0],[-.16,0],[0,.16],[0,-.16]].every(([a,b])=>this.height(x+a,z+b)!=null);
  }
}
