export const gardenSpawn=[0,14];
export const GARDEN_KEY='floraverse.light-garden.v1';
export const beds=[]; // Legacy import retained; there are no artificial planting beds.
export const valleyRocks=[{x:-17,z:1,radius:1.1},{x:17,z:0,radius:.9},{x:-4,z:-22,radius:1.3},{x:12,z:20,radius:.85}];
export function gardenHeight(x,z){const r=Math.hypot(x,z),angle=Math.atan2(x,z),edge=31.4+.7*Math.sin(angle*3)+.35*Math.cos(angle*5);return -.4+.16*Math.sin(x*.19)*Math.cos(z*.17)+.08*Math.sin(z*.33+x*.11)+Math.min(6,Math.max(0,r-edge)**2*.18)*(.9+.18*Math.sin(angle*3)+.1*Math.cos(angle*7));}
export function gardenSlope(x,z){return Math.hypot((gardenHeight(x+.1,z)-gardenHeight(x-.1,z))/.2,(gardenHeight(x,z+.1)-gardenHeight(x,z-.1))/.2);}
export const gardenSites=[
 {x:-10,z:10,name:'苔石觀測點',symbol:'⌕'},
 {x:10,z:8,name:'焦黑的林間空地',symbol:'♧'},
 {x:-9,z:-7,name:'落枝風口',symbol:'≈'},
 {x:9,z:-10,name:'失光的幼苗叢',symbol:'☼'},
 {x:0,z:-17,name:'光之種根窩',symbol:'❧'},
];
export function gardenCanMove(x,z){return Number.isFinite(x)&&Number.isFinite(z)&&Math.hypot(x,z)<35&&gardenSlope(x,z)<1.15&&!valleyRocks.some(r=>Math.hypot(x-r.x,z-r.z)<r.radius+.2);}
export function freshGarden(){return {done:[],awakened:false,position:[...gardenSpawn]};}
export function sanitizeGarden(v){const p=freshGarden();for(let i=0;i<4;i++){if(!Array.isArray(v?.done)||!v.done.includes(i))break;p.done.push(i);}p.awakened=p.done.length===4&&v?.awakened===true;if(Array.isArray(v?.position)&&v.position.length===2&&gardenCanMove(...v.position))p.position=v.position;return p;}
export function loadGarden(storage){try{return sanitizeGarden(JSON.parse(storage.getItem(GARDEN_KEY)));}catch{return freshGarden();}}
export const gardenPercent=p=>p.done.length*20+(p.awakened?20:0);
export function saveGarden(storage,p){try{storage.setItem(GARDEN_KEY,JSON.stringify(sanitizeGarden(p)));return true;}catch{return false;}}
export const gardenLessons=[
 {title:'追查灰霧從哪裡來',goal:'比較三處觀測值，找出下一個要調查的位置。',concept:'同樣方式觀測時，數值較高的地方值得先調查，但仍要重複確認。懸浮微粒是空氣中的固體或液體小粒子。灰霧與氣味只能作線索，不能靠外觀判定種類或安全。',why:'比較資料比憑灰霧顏色猜原因可靠；找差異能幫助選擇調查方向。',source:'https://www.epa.gov/pm-pollution/particulate-matter-pm-basics',prompt:'同時觀測的虛構指數：上風林緣 2、焦黑空地 8、幼苗叢 5。先查哪裡，還缺什麼？',choices:[['flowers','幼苗叢：花最枯，先大量施肥'],['source','焦黑空地：先查來源，再重複觀測'],['color','灰色：已證明只有一種污染物']],answer:'source',feedback:'來源附近指數較高，支持優先調查，還不能證明唯一原因。獲得「觀察之種」。'},
 {title:'找到三處需要照顧的物件',goal:'由守谷者處理燃燒來源，玩家整理冷卻垃圾並保留棲地。',concept:'處理來源能減少污染持續進入空氣。把污染吹到別處，或用香味蓋住，都不是消除來源。',why:'逐物件判斷把源頭控制變成具體行動，也避免把所有落葉當垃圾。',source:'https://www.epa.gov/pm-pollution/particulate-matter-pm-basics',prompt:'請老藤處理仍冒煙的來源；你只整理冷卻後的散落物，再保留健康的落葉棲地。點選每件物品，為它選合適行動。',feedback:'來源停止增加，積塵妥善清理，棲地保留。獲得「守護之種」。'},
 {title:'讀懂林谷的風',goal:'沿風向找出可能受影響的幼苗，決定還要在哪裡觀測。',concept:'風往哪裡吹，那一側就是下風處。風能把懸浮微粒帶到那裡；擴散或稀釋不等於污染消失。健康植被是棲地，不是能處理所有污染的萬能濾材。',why:'閱讀俯視圖中的觀測風向，推理哪一片幼苗位於下風處，並決定下一個觀測重點。圖上的箭頭記錄風向，不表示玩家能改變山風。',source:'https://www.epa.gov/pm-pollution/particulate-matter-pm-basics',prompt:'風從左上林緣向右，經焦黑空地向下，再從谷地向左吹到幼苗叢。沿圖閱讀風路，判斷下一步應查什麼；箭頭是觀測資料，不需要操作轉向。',feedback:'你已讀懂傳播方向；先控制來源，再持續觀察下風處。獲得「流動之種」。'},
 {title:'讓日光回到葉片',goal:'替幼苗保留合適光線，再選出光合作用所需的條件。',concept:'光合作用利用光能、水及二氧化碳製造養分。灰霾影響光線的敘事是藝術化表現；花開不代表空氣已安全。',why:'選擇枯枝形成的葉隙完成故事，再辨認植物所需條件，將視覺回饋連結到概念。',source:'https://science.nasa.gov/earth/earth-observatory/the-carbon-cycle/',prompt:'先比較三種葉隙狀態，選擇讓光到達幼苗而保留遮蔭的方式；再選出植物生長需要的條件。',choices:[['light','只有越強的光越好'],['complete','合適的光、水、二氧化碳及生長條件'],['spray','香味與彩色燈就能取代自然條件']],answer:'complete',feedback:'光線回到幼苗叢，仍需適當水分與後續照顧。獲得「生長之種」。'}
];
export function checkGarden(stage,s){
 if(stage===0)return s.choice==='source';
 if(stage===1)return s.fire==='stop'&&s.dust==='clean'&&s.leaves==='keep';
 if(stage===2)return s.choice==='downwind'&&s.filter===true;
 if(stage===3)return s.mirror===1&&s.choice==='complete';
 return false;
}
