export const gardenSpawn=[0,14];
export const GARDEN_KEY='floraverse.light-garden.v1';
export const beds=[{x:-7,z:4,w:10,d:3},{x:7,z:-3,w:10,d:3},{x:-6,z:-12,w:8,d:3}];
export const gardenSites=[
 {x:-10,z:10,name:'灰霧觀測台',symbol:'⌕'},
 {x:10,z:8,name:'積灰的燃燒爐',symbol:'♧'},
 {x:-9,z:-7,name:'停轉的風之迴廊',symbol:'≈'},
 {x:9,z:-10,name:'失光的日照花床',symbol:'☼'},
 {x:0,z:-17,name:'光之種祭壇',symbol:'❧'},
];
export function gardenCanMove(x,z){return Number.isFinite(x)&&Number.isFinite(z)&&Math.abs(x)<17.8&&Math.abs(z)<20.8&&!beds.some(b=>Math.abs(x-b.x)<b.w/2+.22&&Math.abs(z-b.z)<b.d/2+.22);}
export function freshGarden(){return {done:[],awakened:false,position:[...gardenSpawn]};}
export function sanitizeGarden(v){const p=freshGarden();for(let i=0;i<4;i++){if(!Array.isArray(v?.done)||!v.done.includes(i))break;p.done.push(i);}p.awakened=p.done.length===4&&v?.awakened===true;if(Array.isArray(v?.position)&&v.position.length===2&&gardenCanMove(...v.position))p.position=v.position;return p;}
export function loadGarden(storage){try{return sanitizeGarden(JSON.parse(storage.getItem(GARDEN_KEY)));}catch{return freshGarden();}}
export const gardenPercent=p=>p.done.length*20+(p.awakened?20:0);
export function saveGarden(storage,p){try{storage.setItem(GARDEN_KEY,JSON.stringify(sanitizeGarden(p)));return true;}catch{return false;}}
export const gardenLessons=[
 {title:'追查灰霧從哪裡來',goal:'比較來源附近與對照位置，形成可查證的假說。',concept:'懸浮微粒是空氣中的固體或液體小粒子。灰霧與氣味只能作線索，不能靠外觀判定種類或安全。',why:'比較資料比憑灰霧顏色猜原因可靠；找差異能幫助選擇調查方向。',source:'https://www.epa.gov/pm-pollution/particulate-matter-pm-basics',prompt:'同時觀測的虛構指數：溫室入口 2、燃燒爐附近 8、花床 5。先查哪裡，還缺什麼？',choices:[['flowers','花床：花最枯，先大量施肥'],['source','燃燒爐：先查來源，再重複觀測'],['color','灰色：已證明只有一種污染物']],answer:'source',feedback:'來源附近指數較高，支持優先調查，還不能證明唯一原因。獲得「觀察之種」。'},
 {title:'找到三處需要照顧的物件',goal:'減少污染來源，同時保留自然棲地。',concept:'處理來源能減少污染持續進入空氣。把污染吹到別處，或用香味蓋住，都不是消除來源。',why:'逐物件判斷把源頭控制變成具體行動，也避免把所有落葉當垃圾。',source:'https://www.epa.gov/indoor-air-quality-iaq/improving-indoor-air-quality',prompt:'依序照顧燃燒爐、積塵通道與落葉棲地。點選每件物品，為它選合適行動。',feedback:'來源停止增加，積塵妥善清理，棲地保留。獲得「守護之種」。'},
 {title:'接通風之迴廊',goal:'理解來源控制、適當通風與粒子過濾彼此配合。',concept:'過濾是來源控制與通風的補充。這次觀測顯示室外較乾淨；通風不能一律不看室外條件就開窗。粒子濾材也不等於處理所有氣體。',why:'旋轉風向接通路徑，讓你觀察空氣經過濾材、植物區，再到排出口，而非只按一個淨化按鈕。',source:'https://www.epa.gov/indoor-air-quality-iaq/air-cleaners-and-air-filters-home',prompt:'由左上進氣口開始：把三片導向葉轉成「向右 → 向下 → 向左」，接通右上濾材、右下植物區與左下出口。',feedback:'風路已接通，粒子濾材與源頭控制一起工作。獲得「流動之種」。'},
 {title:'讓日光回到葉片',goal:'理解植物需要光、水與二氧化碳，不能只靠強光解決所有問題。',concept:'光合作用利用光能、水及二氧化碳製造養分。灰霾影響光線的敘事是藝術化表現；花開不代表空氣已安全。',why:'以鏡面引光完成故事，再辨認植物所需條件，將視覺回饋連結到概念。',source:'https://science.nasa.gov/earth/earth-observatory/the-carbon-cycle/',prompt:'旋轉日光鏡，讓光束指向花床，再選出植物完整的需求。',choices:[['light','只有越強的光越好'],['complete','合適的光、水、二氧化碳及生長條件'],['spray','香味與彩色燈就能取代自然條件']],answer:'complete',feedback:'光線回到花床，仍需適當水分與後續照顧。獲得「生長之種」。'}
];
export function checkGarden(stage,s){
 if(stage===0)return s.choice==='source';
 if(stage===1)return s.fire==='stop'&&s.dust==='clean'&&s.leaves==='keep';
 if(stage===2)return s.turns?.join(',')==='0,1,2'&&s.filter===true;
 if(stage===3)return s.mirror===1&&s.choice==='complete';
 return false;
}
