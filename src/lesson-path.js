export const fieldLessons={
 evidence:{clues:['A 是支流進入前的參照位置。比較 A、B 的差異，再看現場是否有來源線索。','水會把污染往下游帶；選擇能連起現場線索與受影響位置的路徑。','一次觀測還不是定論。選能再次確認來源與變化的做法。'],question:'污染可能從哪裡進入池塘？',reason:'把進入支流前的 A，和支流出口 B 相比，找出數值開始明顯上升的位置。',takeaway:'B 比 A 高，又有破袋線索，因此先調查 B。這是調查方向，還不是唯一污染來源的證明。',limit:'水變清澈不能取代重複採樣；同時也要檢查其他可能來源。',steps:['哪個位置值得先追查？','水可能把污染帶到哪裡？','要怎樣再確認這個推測？']},
 water:{clues:['點選三項措施，亮起代表採用；清水通道預設保留。','已流出的污染需要暫存並妥善處理；不要把問題送到另一處棲地。'],question:'怎樣阻止污染繼續進入水池？',reason:'停止新污染，再替已流出的殘留安排收集處理；清水仍要能流動。',takeaway:'停止來源、收集殘留、保留清水，需要一起考慮。只把污染改道到下游，會傷害另一處棲地。',limit:'石閘只是故事示意；真實水域的攔截與污染處理須由合適人員評估。',steps:['選擇來源與清水的照顧措施','替已流出的殘留選去向']},
 cleanup:{question:'池岸哪些東西要清走，哪些要留下？',reason:'依物件的性質決定去向。自然落葉與倒木是小生物的家；人造垃圾與未知滲漏物要分開處理。',takeaway:'垃圾要收集；落葉、倒木與真菌有棲地功能。未知滲漏物要標記並交給專業處理。',limit:'撿完垃圾只處理了可見的物品，水中仍可能有看不見的污染。',steps:['塑膠瓶','包裝袋','塑膠碎片','枯葉層','倒木','菌菇','未知容器','樣本檢測卡']},
 soil:{question:'同一種修復方式，適合所有土地嗎？',reason:'看眼前這一區的問題，再選一種措施。選取後會直接放入這一區，不必再點地形。',takeaway:'覆蓋減少裸坡沖刷；適地植被保護坡腳；岸邊緩衝帶保護水域。健康棲地保留，未知污染區先隔離查明。',limit:'模擬降雨用來理解作用，不是工程成效預測；植被也不能掩蓋待治理污染。',steps:['裸坡：雨滴直接打在土上','坡腳：泥沙容易往這裡移動','池岸：逕流即將進入水域','健康棲地：已有自然保護','未知污染區：尚待查明']},
 plants:{question:'這裡的光和水，適合哪種植物？',reason:'先看目前生境，再選植物卡。選取後會直接放入這個生境。',takeaway:'樹蔭、排水好的坡地與會短暫積水的池岸，需要不同生長條件的植物。適地適種比種得多更重要。',limit:'這些是功能示意卡；真實復育還需考慮在地物種、生態與長期照顧。',steps:['樹蔭：散射光、較濕潤','坡地：日照較多、排水良好','池岸：可能短暫積水']},
 transfer:{question:'換一片土地，你會怎麼開始修復？',reason:'先確認問題，避免未查原因就施工；行動後還要用可比較的資料追蹤。',takeaway:'觀察確認 → 減少來源 → 修復棲地 → 後續觀測，是可以帶去新情境的思考順序。',limit:'真實治理常要反覆觀察與調整；不是做完一次就能判定安全。',steps:['安排四項行動，再選驗證方式']}
};
export const measureMeaning={cover:'先保護裸土，減少雨滴沖刷',plant:'用合適植物與根系保護土壤',buffer:'在水邊保留連續植被，減緩逕流',keep:'已有健康棲地，減少干擾',isolate:'先標記查明，交由合適人員治理',fertilizer:'增加養分，不一定能解決沖刷',paving:'改成硬面會改變滲水與逕流'};
export function lessonStepReady(kind,state,step){
 if(kind==='evidence')return Boolean(state[['source','route','limit'][step]]);
 if(kind==='soil')return Boolean(state.zones?.['ABCDE'[step]]);
 if(kind==='plants')return Boolean(state.zones?.[['shade','slope','shore'][step]]);
 if(kind==='cleanup')return Boolean(state.items?.[['bottle','bag','fragment','leaves','wood','fungus','container','report'][step]]);
 return true;
}
export function firstIssue(kind,s){
 if(kind==='evidence')return s.source!=='B'?0:s.route!=='branch'?1:2;
 if(kind==='soil')return Math.max(0,['cover','plant','buffer','keep','isolate'].findIndex((v,i)=>s.zones?.['ABCDE'[i]]!==v));
 if(kind==='plants'){const i=['shade','slope','shore'].findIndex(v=>s.zones?.[v]!==v);return i<0?2:i;}
 if(kind==='cleanup'){const ids=['bottle','bag','fragment','leaves','wood','fungus','container','report'],dest=['collect','collect','collect','keep','keep','keep','isolate','monitor'];return Math.max(0,ids.findIndex((v,i)=>s.items?.[v]!==dest[i]));}
 if(kind==='water')return s.source&&s.collected&&s.clean?1:0;
 return 0;
}
