// 留空代表尚未匯入影片，使用短文字銜接。路徑相對於 public/。
export const films = { chapter1Intro: '', chapter1Outro: '' };
export const chapters = [
  { n:'00', title:'Bloom Mirror', theme:'序章 · 你的存在，讓世界回應', icon:'◌', biome:'mirror', ready:false },
  { n:'01', title:'種子森林', theme:'土壤生態 · 聽見大地的呼吸', icon:'❧', biome:'forest', ready:true },
  { n:'02', title:'光之花園', theme:'空氣與氣候 · 找回穿透塵霾的光', icon:'☼', biome:'light', ready:false },
  { n:'03', title:'蝴蝶谷', theme:'物種共生 · 守護每一種生命', icon:'⋈', biome:'valley', ready:false },
  { n:'04', title:'天空花園', theme:'水資源 · 讓水重新流動', icon:'≈', biome:'sky', ready:false },
  { n:'05', title:'生命之樹', theme:'全球生態 · 一起讓世界盛開', icon:'♧', biome:'tree', ready:false },
];
export const stages = {
  survey: { title:'循著微光，讀懂土地', text:'靠近三處觀測點，按住滑鼠右鍵開啟生態透視鏡，再按住 E 觀測。', short:'生態觀測', action:'按住右鍵 ＋ E · 觀測', duration:1.8 },
  isolate: { title:'先讓污染停止流入', text:'找到兩處截流石。靠近後按住 E，沿引導軌道推石，隔離污染支流。', short:'隔離污染', action:'按住 E · 推動截流石', duration:3 },
  soil: { title:'讓土壤重新擁有生命', text:'前往三處修復點，按 E 選擇合適的治理方法。', short:'土壤修復', action:'按 E · 修復土壤', duration:0 },
  ritual: { title:'捧起一顆新的希望', text:'回到生命種子旁，按住 E 完成喚醒儀式。這是象徵性的生態復甦。', short:'喚醒種子', action:'按住 E · 捧起生命種子', duration:4 },
  reflect: { title:'把森林的回應帶回生活', text:'靠近生命種子，按 E 回顧修復順序，完成本章。', short:'生態回顧', action:'按 E · 回顧旅程', duration:0 },
  complete: { title:'森林記得你的溫柔', text:'本章已完成。你可以自在探索，或按 Esc 返回主畫面。', short:'旅程完成', action:'', duration:0 },
};
export const observations = [
  { name:'溪流沉積物', finding:'紫色是遊戲用來標示污染的視覺符號。現實中的重金屬污染通常不能只靠顏色判斷，需要採樣與檢測。' },
  { name:'土壤中的碎片', finding:'塑膠垃圾會逐漸碎裂。微塑膠可能殘留在土壤中；畫面中放大的碎片只是觀測示意。' },
  { name:'沉睡的種子', finding:'種子需要適合的水分、空氣與環境。先控制污染源，再治理土壤，才能為恢復生長創造條件。' },
];
export const soilQuestions = [
  { title:'碎片仍留在土地裡', text:'污染支流已隔離。這裡散落著塑膠碎片，接下來怎麼做？', choices:['把碎片埋得更深','收集可見垃圾並妥善分類處理','用更多水把碎片沖到下游'], correct:1, why:'先清除可見垃圾並避免新增污染。細小的微塑膠仍可能殘留，不能把一次清理當成完全復原。' },
  { title:'看不見的污染', text:'採樣顯示這片土壤可能含有重金屬。哪個做法比較合適？', choices:['隔離並請專業人員檢測、選擇治理方法','直接種可食用蔬菜吸收污染','只要水變清澈就能宣布安全'], correct:0, why:'重金屬不會被一般清洗或魔法消除。需依檢測結果選擇治理方式，並持續監測；不宜自行栽種食用作物。' },
  { title:'讓生命慢慢回來', text:'完成污染控制與治理後，怎樣支持棲地恢復？', choices:['立刻大量施肥，越多越好','引入任何長得快的外來植物','依當地條件恢復原生植被，持續觀察'], correct:2, why:'選擇適合當地的原生植被，保護土壤與棲地，並持續監測。真實生態復育需要時間，不會在種下植物後立刻完成。' },
];
