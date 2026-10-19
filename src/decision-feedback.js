// Respond to the actual decision, so the lesson is visible before the final check.
export function decisionFeedback(kind,s,step){
 if(kind==='evidence'){
  const values=[s.source,s.route,s.limit],right=['B','branch','repeat'];
  const good=['你把 A 和 B 放在一起比較了。B 的指數較高，岸邊又有破袋，因此值得先追查；還不能認定它是唯一來源。','這條路徑連起了破袋、支流、水池和下游。水會搬運污染，因此處理時也要保護下游。','再次採樣與來源調查，能檢查這次推測是否成立。一次觀察不夠。'];
  const revise=['再看看：A 是入流前的參照；B 的數值上升，又有破袋線索。先找值得追查的位置。','水色或枯葉不能證明污染種類。請用現場來源與水流方向連起路徑。','清澈只是外觀；要再採樣、比較及追查來源。'];
  return values[step]===right[step]?good[step]:revise[step];
 }
 if(kind==='soil'){
  const expected=['cover','plant','buffer','keep','isolate'],v=s.zones?.['ABCDE'[step]];
  const why=['落葉覆蓋保護裸土，減少雨滴直接沖刷。','合適的坡腳植被與根系能保護土壤；不是把所有地方鋪成硬地。','連續的岸邊植被能減緩逕流，保護水邊棲地。','健康落葉與原有植被本來就在保護棲地，減少干擾即可。','未知污染先標記查明。不能用新植物或肥料掩蓋問題。'];
  return (v===expected[step]?'這項措施符合眼前需要：':'這裡先想想：')+why[step];
 }
 if(kind==='plants'){
  const id=['shade','slope','shore'][step],right=s.zones?.[id]===id;
  return (right?'生長條件對上了。':'再比對植物卡的光與水需求。')+['樹蔭下選能利用散射光、適合濕潤環境的草本。','坡地日照較多、排水較好，選適合這種條件的草叢。','池岸可能短暫積水，需要能承受這個條件的植物。'][step];
 }
 if(kind==='water')return step===0?(!s.source?'污染還在流入，先停止來源。':!s.collected?'來源停止了；已流出的殘留還要收集與妥善處理。':!s.clean?'清水也需要通道，不能把所有水都堵住。':'來源、殘留與清水都已顧到。接著決定殘留的去向。'):(s.gate==='hold'?'暫存還需要收集與適當處理；把問題留在可處理的位置。':'導向水池或下游，會把污染交給其他生命。改選暫存處理區。');
 if(kind==='transfer')return s.reason?(s.reason==='data'?'用相同位置、可比較條件的資料追蹤，才能檢查改善是否持續。':'花開與透明都只是外觀，不能代替後續資料。'):['先確認問題，才知道要控制什麼來源。','減少來源，避免一面修復、一面繼續受損。','來源受控後，按地況修復棲地。','持續觀測，檢查方法並依變化調整。'][Math.max(0,(s.order?.length??1)-1)];
 return '';
}
