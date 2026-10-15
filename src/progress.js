export const SAVE_KEY='floraverse.bloom-story.v2';
export const OLD_SAVE_KEY='floraverse.bloom-story.v1';
export const freshProgress=()=>({scanned:[],evidence:false,barriers:[],soils:[],ritual:false,reflection:false,position:null,drafts:{},legacyCompleted:false});
const indices=(a,n)=>[...new Set(Array.isArray(a)?a:[])].filter(x=>Number.isInteger(x)&&x>=0&&x<n);
export function sanitizeProgress(v){
 const p=freshProgress();p.scanned=indices(v?.scanned,3);p.evidence=p.scanned.length===3&&v?.evidence===true;
 if(p.evidence)p.barriers=indices(v?.barriers,2);
 if(p.barriers.length===2){p.soils=indices(v?.soils,3);if(!p.soils.includes(0))p.soils=[];else if(!p.soils.includes(1))p.soils=[0];}
 p.ritual=p.soils.length===3&&v?.ritual===true;p.reflection=p.ritual&&v?.reflection===true;p.legacyCompleted=v?.legacyCompleted===true&&p.reflection;
 if(Array.isArray(v?.position)&&v.position.length===2&&v.position.every(x=>Number.isFinite(x)&&Math.abs(x)<35))p.position=v.position;
 if(v?.drafts&&typeof v.drafts==='object')for(const k of ['evidence','water','cleanup','soil','plants','transfer']){const d=v.drafts[k];if(d&&typeof d==='object'&&JSON.stringify(d).length<5000)p.drafts[k]=d;}
 return p;
}
export function progressPercent(p){return (p.evidence?15:0)+p.barriers.length/2*20+(p.soils.includes(0)?15:0)+(p.soils.includes(1)?20:0)+(p.soils.includes(2)?10:0)+(p.reflection?20:0);}
export function stageOf(p){if(!p.evidence)return 'survey';if(p.barriers.length<2)return 'isolate';if(p.soils.length<3)return 'soil';if(!p.ritual)return 'ritual';return p.reflection?'complete':'reflect';}
export function canUnlock(p){return p.ritual&&progressPercent(p)>=80;}
export function loadProgress(storage){
 try{const saved=storage.getItem(SAVE_KEY);if(saved!==null)return sanitizeProgress(JSON.parse(saved)?.progress);
 const old=JSON.parse(storage.getItem(OLD_SAVE_KEY))?.progress;if(!old)return freshProgress();
 const p=freshProgress();p.scanned=indices(old.scanned,3);p.position=old.position;
 // Old achievements retain chapter rights; they do not count as a new assessment.
 if(old.ritual===true&&indices(old.soils,3).length===3&&indices(old.barriers,2).length===2&&p.scanned.length===3){p.evidence=true;p.barriers=[0,1];p.soils=[0,1,2];p.ritual=true;p.reflection=old.reflection===true;p.legacyCompleted=p.reflection;}
 return sanitizeProgress(p);
 }catch{return freshProgress();}
}
export function saveProgress(storage,p){try{storage.setItem(SAVE_KEY,JSON.stringify({version:2,progress:p}));return true;}catch{return false;}}
