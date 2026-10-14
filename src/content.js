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
 survey:{title:'循著水流尋找證據',text:'觀察三處池岸與支流樣本，按 E 收集，再在近景工作台比對證據。',short:'證據比對',action:'按 E · 觀察與比對',duration:0},
 isolate:{title:'讓污染停在來源端',text:'找到截流石，按 E 配置水路；先控制來源，保留清水並安排殘留處理。',short:'水路解謎',action:'按 E · 配置水路',duration:0},
 soil:{title:'一步步恢復森林棲地',text:'依序前往池岸清理、土壤剖面與枯萎植物。按 E 進入雙手近景工作台。',short:'清理與棲地配置',action:'按 E · 進入修復近景',duration:0},
 ritual:{title:'雙手捧起新的希望',text:'五項修復達 80%。回到生命種子，按 E 捧起種子。',short:'喚醒種子',action:'按 E · 捧起生命種子',duration:0},
 reflect:{title:'把修復原理帶回生活',text:'在種子旁完成另一片花圃的新情境，驗證修復順序與依據。',short:'綜合驗證',action:'按 E · 檢驗新的情境',duration:0},
 complete:{title:'森林記得你的溫柔',text:'可以自由探索已復甦的森林，或按 Esc 返回主畫面。',short:'旅程完成',action:'',duration:0}
};
export const observations = [
 {name:'A 上游參照樣本',finding:'同次觀測相對指數：懸浮物 1，養分 1。這是入流前的參照，不是法定安全值。'},
 {name:'B 支流出口樣本',finding:'相對指數：懸浮物 4，養分 5。附近有破損肥料袋，值得追查；單次觀測尚不能證明唯一來源。'},
 {name:'C 池岸樣本',finding:'相對指數：懸浮物 4，養分 4；散落塑膠包裝。紫色是遊戲符號，不能依顏色辨認重金屬。'}
];
