// Fictional teaching models; these are not measurements or engineering plans.
export const puzzleNames={evidence:'循著水流尋找證據',water:'讓污染停在來源端',cleanup:'雙手清理池岸',soil:'讓土地留住水',plants:'幫植物找到位置',transfer:'把修復帶回生活'};
export function freshPuzzle(k){return structuredClone({evidence:{source:'',route:'',limit:''},water:{source:false,gate:'pond',collected:false,clean:true},cleanup:{items:{},selected:''},soil:{zones:{},selected:'cover'},plants:{zones:{},selected:'shade',habitat:true},transfer:{order:[],reason:''}}[k]??{});}
export const specimens=[
 {id:'bottle',name:'塑膠瓶',symbol:'♜',destination:'collect',detail:'空塑膠容器，送至分類收集盤。'},
 {id:'bag',name:'包裝袋',symbol:'▱',destination:'collect',detail:'人造包裝，可能繼續碎裂。'},
 {id:'fragment',name:'大塊塑膠碎片',symbol:'◇',destination:'collect',detail:'可見碎片；細小微塑膠仍需評估。'},
 {id:'leaves',name:'枯葉層',symbol:'❧',destination:'keep',detail:'自然有機物及小生物的庇護。'},
 {id:'wood',name:'倒木',symbol:'▰',destination:'keep',detail:'保留棲地及分解循環。'},
 {id:'fungus',name:'菌菇',symbol:'♧',destination:'keep',detail:'真菌，不是垃圾，也不屬於植物。'},
 {id:'container',name:'滲漏的未知容器',symbol:'⚠',destination:'isolate',detail:'設置警示，交專業處理，避免接觸。'},
 {id:'report',name:'樣本檢測卡',symbol:'▤',destination:'monitor',detail:'撿完垃圾仍不能排除溶解污染與微小殘留。'}
];
export function checkPuzzle(k,s){
 const fail=text=>({ok:false,text});
 if(!Object.hasOwn(puzzleNames,k))return fail('未知任務，無法提交。');
 if(k==='evidence'){
  if(s.source!=='B')return fail('比較 A 與 B：指數差異從哪裡開始？受影響地點未必就是來源。');
  if(s.route!=='branch')return fail('把來源、支流、水池與下游連成傳播路徑，不能只憑水色判定。');
  if(s.limit!=='repeat')return fail('單次資料只支持優先調查的假說，還需要再次採樣及來源調查。');
 }
 if(k==='water'){
  if(!s.source)return fail('先處理破袋與不當排放，否則污染仍持續增加。');
  if(s.gate!=='hold')return fail(s.gate==='downstream'?'污染被轉移到下游，問題並未解決。':'讓殘留污染進入指定暫存收集區，避免流入池中。');
  if(!s.collected)return fail('暫存不是污染消失，需要安排收集與適當處理。');
  if(!s.clean)return fail('保留不受污染的自然水路，避免把所有水流一起堵死。');
 }
 if(k==='cleanup')for(const item of specimens)if(s.items?.[item.id]!==item.destination)return fail(item.id==='container'?'未知容器應標記隔離並交專業處理。':item.id==='report'?'保留檢測卡作後續監測，清理並不代表全部安全。':item.destination==='keep'?'落葉、倒木與真菌有棲地功能，不必全部清空。':'把可見的人造垃圾移到收集盤。');
 if(k==='soil')for(const [id,choice]of Object.entries({A:'cover',B:'plant',C:'buffer',D:'keep',E:'isolate'}))if(s.zones?.[id]!==choice)return fail({A:'裸露坡面需要適量覆蓋，降低沖刷。',B:'坡腳以適地植被保護土壤。',C:'池岸需要連續的緩衝植被。',D:'健康棲地應保留。',E:'待治理污染區不可被新土或植物掩蓋。'}[id]);
 if(k==='plants'){
  for(const [id,choice]of Object.entries({shade:'shade',slope:'slope',shore:'shore'}))if(s.zones?.[id]!==choice)return fail('比較植物卡的光照、水分與排水條件；同一植物並不適合所有位置。');
  if(!s.habitat)return fail('保留倒木、落葉與通道，森林不需要每一格都種滿花。');
 }
 if(k==='transfer'){
  if(s.order?.join(',')!=='observe,source,restore,monitor')return fail('依證據確認問題，再控制來源、改善棲地，最後以可比較的觀測驗證效果。');
  if(s.reason!=='data')return fail('清澈與開花是外觀；用相同位置、可比較條件的觀測檢查效果。');
 }
 return {ok:true,text:{evidence:'已建立有證據的調查假說，並保留需要查證的問題。',water:'來源已控制，殘留安排處理，自然清水路保持連通。',cleanup:'垃圾已收集，棲地有保留，未知物已標記；仍需監測。',soil:'覆蓋、植被與緩衝帶各司其職，待治理區沒有被掩蓋。',plants:'植被適合生境，倒木、落葉與通道仍保留。',transfer:'你已把修復原理轉用到新的情境。'}[k]};
}
