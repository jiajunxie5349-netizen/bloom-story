// Synthesized prototype sounds. No external recordings or licensing assumptions.
export class ForestAudio{
 constructor(){this.enabled=false;this.volume=.25;this.last=null;this.steps=0;}
 async set(enabled,volume=this.volume){
  this.volume=volume;this.enabled=enabled;
  if(enabled){try{if(!this.context)this.init();await this.context.resume();}catch{this.enabled=false;}}
  if(this.master)this.master.gain.setTargetAtTime(this.enabled?this.volume*.85:0,this.context.currentTime,.12);
  return this.enabled;
 }
 init(){
  const c=this.context=new AudioContext();this.master=c.createGain();this.master.gain.value=0;this.master.connect(c.destination);
  this.noise=c.createBuffer(1,c.sampleRate*3,c.sampleRate);const data=this.noise.getChannelData(0);let prev=0;
  for(let i=0;i<data.length;i++){prev=(prev+(Math.random()*2-1)*.04)/1.04;data[i]=prev;}
  const peak=Math.max(...Array.from(data.slice(0,10000)).map(Math.abs));for(let i=0;i<data.length;i++)data[i]=Math.max(-1,Math.min(1,data[i]/Math.max(.01,peak)*.65));
  this.wind=this.loop(500);this.water=this.loop(1700);this.wind.value=0;this.water.value=0;
 }
 loop(frequency){const c=this.context,src=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain();src.buffer=this.noise;src.loop=true;filter.type='lowpass';filter.frequency.value=frequency;src.connect(filter);filter.connect(g);g.connect(this.master);src.start();return g.gain;}
 play(type){
  if(!this.enabled||!this.context||this.context.state!=='running')return;
  const c=this.context,t=c.currentTime,g=c.createGain();g.connect(this.master);
  const noisy=['rustle','stone','water'].includes(type),duration=type==='stone'?.42:type==='water'?.35:.18;
  g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(noisy?.5:.18,t+.025);g.gain.exponentialRampToValueAtTime(.001,t+duration);
  let src;if(noisy){src=c.createBufferSource();src.buffer=this.noise;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=type==='stone'?160:type==='water'?1500:2300;src.connect(f);f.connect(g);}else{src=c.createOscillator();src.type='sine';src.frequency.setValueAtTime(type==='success'?650:type==='error'?180:430,t);src.frequency.exponentialRampToValueAtTime(type==='success'?980:320,t+duration);src.connect(g);}
  src.onended=()=>{src.disconnect();g.disconnect();};src.start(t,noisy?Math.random()*2:undefined);src.stop(t+duration+.01);
 }
 update(active,p,restoration=0){
  if(this.context){const t=this.context.currentTime;this.wind.setTargetAtTime(active?.18+restoration*.035:0,t,.4);this.water.setTargetAtTime(active?Math.max(0,1-Math.hypot(p.x,p.z)/22.5)*.24:0,t,.4);}
  if(!active){this.last=null;return;}
  if(this.last){const d=Math.hypot(p.x-this.last.x,p.z-this.last.z);if(d<1)this.steps+=d;if(this.steps>.9){this.steps=0;this.play('rustle');}}
  this.last={x:p.x,z:p.z};
 }
}
