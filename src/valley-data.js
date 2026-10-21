export const VALLEY_KEY='floraverse.single-valley.v1';
export const regions=[
 {id:'A',name:'濁水林岸',theme:'讀懂水土，讓生長重新開始',center:[0,0]},
 {id:'B',name:'風葉共生谷',theme:'留下合適的光，連起生命的棲地',center:[52,-9]},
 {id:'C',name:'生命樹根庭',theme:'讓水、土、光與生命重新相連',center:[14,-61]}
];
// A anchors reuse existing task models; background placements are untouched.
export const tasks=[
 {id:'A1',region:'A',name:'支流採樣石',pos:[-10.5,13.5],anchor:['survey',2],lesson:'比較證據，不能只憑水色判定污染。',question:'三個樣本：上游混濁度低；破袋支流混濁且有異味；池岸介於兩者。下一步？',choices:['只看池水紫色就決定污染種類','追查支流破袋，並重複採樣確認','把混濁的水引到另一片森林'],answer:1,action:'依序檢視三個樣本槽',steps:3,success:'已比對上游、支流與池岸資料，記下需要持續觀測的位置。'},
 {id:'A2',region:'A',name:'滲流裂口',pos:[12,0],anchor:['isolate',0],requires:'A1',lesson:'先處理來源，再控制殘留；不能把污染搬到別處。',question:'破袋支流持續外溢，哪一組處理順序較合適？',choices:['封住所有河水，直到池子乾掉','只清理湖面，讓破袋繼續滲流','標記來源請守望者處理，再調整集流石、保留清水主流'],answer:2,action:'標記破袋，再調整兩塊集流石',steps:3,success:'來源交由守望者處理，殘留留在集流凹地，清水主流仍保持連通。'},
 {id:'A3',region:'A',name:'裸露池岸',pos:[-9,16.5],anchor:['soil',1],requires:'A2',lesson:'清理垃圾與保護土壤，需要保留健康的自然覆蓋。',question:'雨水正沖刷裸露池岸，應如何照顧？',choices:['移走人造垃圾，保留健康落葉並補上適當覆蓋','移走所有落葉，讓地面完全裸露','把整片地面鋪上石板'],answer:0,action:'清理包裝、安排覆蓋，再觀察雨水',steps:3,success:'池岸覆蓋減少沖刷。林岸三項修復完成，東側枝絲退去。'},
 {id:'B1',region:'B',name:'灰霧落枝空地',pos:[43,-6],lesson:'風會搬運微粒；灰霧吹走不等於來源消失。',question:'上風葉面較乾淨，焦黑空地與下風葉片積灰。應先做什麼？',choices:['等待風把灰吹到別處','追查空地來源，請守望者處理並繼續觀測下風處','拔掉所有有灰的植物'],answer:1,action:'比對風葉、標記來源、留下觀測葉',steps:3,success:'新增灰霧停止，仍保留少量殘霧，等待後續觀測。'},
 {id:'B2',region:'B',name:'失光幼苗叢',pos:[58,-13],requires:'B1',lesson:'植物需要適量光與水，不能把所有活樹冠清空。',question:'幼苗長期被斷落枯枝遮住。哪個調整較合適？',choices:['移走所有活葉，讓日光最強','只增加水，完全忽略光照','調整已確認的枯枝，留下適量葉隙及濕潤庇護'],answer:2,action:'轉動枯枝，觀察葉隙和幼苗',steps:2,success:'斑駁日光抵達幼苗，活冠層與地面水分仍被保留。'},
 {id:'B3',region:'B',name:'蝶使花窩',pos:[58,4],requires:'B2',lesson:'幼蟲和成蝶需要不同資源，棲地也需要連通空間。',question:'兩叢花窩之間缺少落腳處。應補上什麼？',choices:['兼有寄主葉與蜜源的分散植叢，保留飛行與行走空隙','只有同一種開花植物，種成密牆','移走寄主葉，只留下漂亮花朵'],answer:0,action:'配置寄主葉、蜜源與中間落腳處',steps:3,success:'蝶使能在資源間移動。共生谷三項修復完成，北側根拱舒展。'},
 {id:'C1',region:'C',name:'集雨根渠',pos:[1,-56],lesson:'水透明與水流通，都不能單獨證明適合生命使用。',question:'根渠乾涸，東側集雨葉盆有水。開通前應確認？',choices:['只要水清就可以使用','比較水的觀測資訊與幼根需求，再恢復支渠並持續追蹤','把主溪全部改道，只供應巨樹'],answer:1,action:'檢視觀測石、移開落枝、開通支渠',steps:3,success:'支渠將清水送往缺水根部，主溪仍向西南低處流動。'},
 {id:'C2',region:'C',name:'失衡根系環',pos:[26,-57],requires:'C1',lesson:'水分、光照與覆蓋互相影響，照護要對應真正不足的條件。',question:'三處幼根分別過乾、失光、裸露。應怎麼做？',choices:['三處都灌最多水','三處都移走遮蔭','依線索分別調整水分、葉隙與覆蓋，避免過量'],answer:2,action:'依序照顧三個不同的根部微棲地',steps:3,success:'三處微棲地恢復平衡，根部重新回應水與光。'},
 {id:'C3',region:'C',name:'樹心種窩',pos:[14,-66],requires:'C2',lesson:'把方法用在新情境；復甦後仍要觀測和調整。',question:'雨後新支流再次混濁，但沒有原本破袋的氣味。下一步？',choices:['重新比較上下游與坡岸沖刷線索，再選擇照護方法','直接判定是同一種污染','因為巨樹發光，就不必再觀察'],answer:0,action:'留下觀測葉，將生命種子放回樹心',steps:2,success:'生命之樹甦醒。完整森林與西側回遊根拱開放，旅程留在這個世界繼續。'}
];
export const freshValley=()=>({version:1,done:[],position:null,drafts:{},migrated:false});
export const completed=(p,r)=>tasks.filter(t=>t.region===r&&p.done.includes(t.id)).length;
export const unlocked=(p,r)=>r==='A'||(completed(p,'A')===3&&(r==='B'||completed(p,'B')===3));
export const finale=p=>completed(p,'C')===3;
export function sanitizeValley(v){const p=freshValley();p.done=tasks.filter(t=>Array.isArray(v?.done)&&v.done.includes(t.id)).map(t=>t.id);p.done=p.done.filter(id=>{const t=tasks.find(t=>t.id===id);return (t.region==='A'||completed(p,'A')===3)&&(t.region!=='C'||completed(p,'B')===3);});for(const t of tasks)if(t.requires&&!p.done.includes(t.requires))p.done=p.done.filter(id=>id!==t.id);if(Array.isArray(v?.position)&&v.position.length===2&&v.position.every(n=>Number.isFinite(n)&&Math.abs(n)<150))p.position=v.position;p.migrated=v?.migrated===true;if(v?.drafts&&typeof v.drafts==='object')for(const t of tasks){const d=v.drafts[t.id];if(d&&typeof d==='object')p.drafts[t.id]={choice:Number.isInteger(d.choice)?d.choice:-1,step:Math.max(0,Math.min(t.steps-1,Number(d.step)||0))};}return p;}
export function loadValley(storage,legacy,oldGarden){try{const raw=storage.getItem(VALLEY_KEY);if(raw!==null)return sanitizeValley(JSON.parse(raw));}catch{}const p=freshValley();if(legacy){if(legacy.evidence)p.done.push('A1');if(legacy.barriers?.length===2&&p.done.includes('A1'))p.done.push('A2');if(legacy.soils?.length===3&&p.done.includes('A2'))p.done.push('A3');p.position=legacy.position;if(completed(p,'A')===3&&[0,1,2].every(i=>oldGarden?.done?.includes(i))){p.done.push('B1');if(oldGarden.done.includes(3))p.done.push('B2');}p.migrated=p.done.length>0;}return p;}
export function saveValley(storage,p){try{storage.setItem(VALLEY_KEY,JSON.stringify(sanitizeValley(p)));return true;}catch{return false;}}
export function finishTask(p,id){const t=tasks.find(t=>t.id===id);if(!t||!unlocked(p,t.region)||t.requires&&!p.done.includes(t.requires))return false;if(!p.done.includes(id))p.done.push(id);delete p.drafts[id];return true;}
export function legacyVisual(p){const a=completed(p,'A');return {scanned:p.done.includes('A1')?[0,1,2]:[],evidence:a>=1,barriers:a>=2?[0,1]:[],soils:a===3?[0,1,2]:[],ritual:a===3,reflection:a===3};}
