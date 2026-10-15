import {stageOf} from './progress.js';
const stations=[['A 上游採樣站','地圖東北側溪流源頭。沿外圍環行林地前往，尋找 A 木牌與較清的入流水。'],['B 支流破袋採樣站','地圖東側支流中段。尋找破袋、暗色滲流與 B 木牌。'],['C 池岸採樣站','地圖西南側的池岸。尋找垃圾附近標有 C 的木牌。']];
export function taskBrief(p){
 const stage=stageOf(p);
 if(stage==='survey'){
  const missing=[0,1,2].filter(i=>!p.scanned.includes(i));const i=missing[0]??2;
  return {stage,target:{type:'survey',index:i},title:missing.length?'先收集三處水樣觀測':'把三處觀測連成證據',where:stations[i][1],name:stations[i][0],steps:missing.length?['靠近木牌旁的採樣瓶，直到出現 E 提示。','按一次 E 讀取觀測，點「收進生態圖鑑」。','三站都讀取後，進入證據工作台。可先調查任一站。']:['靠近 C 站按 E，開啟證據工作台。','選出值得優先追查的樣本、傳播路徑與還缺少的證據。','按「檢查方案」；通過後按「完成並返回森林」。'],done:missing.length?`已記錄 ${p.scanned.length} / 3 站；不是走過或只看見瓶子就完成。`:'三項判斷通過檢查並按完成，才會開啟水路修復。',stations:[0,1,2].map(j=>({label:stations[j][0],done:p.scanned.includes(j)}))};
 }
 const base={stage};
 if(stage==='isolate')return {...base,target:{type:'isolate',index:0},name:'污染支流石閘',title:'停止來源，安排殘留污染的去向',where:'地圖東側，B 站與水池之間。尋找暗褐色滲流痕跡與可調整的石閘。',steps:['靠近石閘按 E，開啟水路示意工作台。','處理來源、調整石閘導向，並考慮殘留污染與清水通道。','按「測試水流」，閱讀結果；通過後按「完成並返回森林」。'],done:'水路的四個條件需同時成立。只移動石頭或把污染送離水池，都不代表完成。'};
 if(stage==='soil'){
  const i=p.soils.length;
  const tasks=[
   {name:'池岸垃圾堆',title:'分辨垃圾與棲地，完成池岸清理',where:'地圖東南側池岸。尋找散落的瓶子與包裝碎片。',steps:['靠近垃圾堆按 E，進入手部近景。','逐件點選物品，閱讀細節，再點適當去向；也可拖放。','所有物品判斷後按「檢查方案」，通過再按完成。'],done:'每件物品都有合適去向；需要保留的自然材料也須作判斷。'},
   {name:'裸露坡地剖面',title:'為不同地況配置修復措施',where:'地圖西南側，C 站後方較高的乾裂坡地。',steps:['靠近裂土按 E，開啟五區土壤剖面。','先選一項措施，再點要配置的區域。比較坡度、逕流與既有棲地。','按「模擬降雨並檢查」，依結果修正；通過後按完成。'],done:'五個區域的配置通過檢查。不是在森林裡把所有土地種滿草。'},
   {name:'枯萎植株',title:'讓植物與生境相配',where:'地圖南側林緣。尋找低垂枯葉、失去生機的植株。',steps:['靠近枯萎植株按 E，開啟植被配置。','閱讀三種植物的光照與水分條件，再放到合適生境。','檢查是否保留棲地材料與通行缺口；按檢查，通過再按完成。'],done:'三種植物的配置及棲地保留條件都通過檢查。'}
  ];return {...base,...tasks[i],target:{type:'soil',index:i}};
 }
 if(stage==='ritual')return {...base,target:{type:'ritual',index:0},name:'生命種子',title:'回到種子，完成喚醒',where:'地圖中央偏南，小葉包覆、帶有微光的種子。',steps:['靠近種子按 E。','在儀式面板點「張開雙手，捧起種子」。'],done:'喚醒記錄後會開啟最後的綜合驗證。'};
 if(stage==='reflect')return {...base,target:{type:'ritual',index:0},name:'生命種子',title:'用新情境驗證你學到的修復原理',where:'留在生命種子旁，再按 E。',steps:['為另一片花圃排列四項行動。','選擇能支持修復成效的證據。','按檢查，通過後按完成，銜接尾聲。'],done:'新情境的順序與判斷通過檢查；本章完成度達 100%。'};
 return {...base,target:null,name:'自由探索',title:'森林已回應你的修復',where:'可以自由觀察環境，或按 Esc 儲存並回主畫面。',steps:[],done:'第一章已完成。'};
}

export function drawJournalMap(canvas,world,brief,p){
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,t=world.terrain,pad=20,extent=72;
 const point=(x,z)=>[pad+(x+36)/extent*(w-pad*2),pad+(z+36)/extent*(h-pad*2)];
 c.fillStyle='#13241d';c.fillRect(0,0,w,h);
 const [cx,cy]=point(0,0);c.fillStyle='#395955';c.beginPath();c.ellipse(cx,cy,(w-pad*2)*34/extent,(h-pad*2)*34/extent,0,0,6.28);c.fill();
 for(let iz=0;iz<t.size;iz+=2)for(let ix=0;ix<t.size;ix+=2){const y=t.heights[iz*t.size+ix];if(y==null)continue;const x=t.min+ix*t.step,z=t.min+iz*t.step;if(Math.hypot(x,z)>t.radius)continue;const [a,b]=point(x,z);c.fillStyle=y<-2.45?'#486460':'#76694b';c.fillRect(a,b,(w-pad*2)*.5/extent+1,(h-pad*2)*.5/extent+1);}
 c.font='12px "Microsoft JhengHei",sans-serif';c.textAlign='center';c.fillStyle='#cad7ba';c.fillText('北 N',w/2,14);
 c.strokeStyle='#c5b88970';c.lineWidth=2;c.beginPath();c.ellipse(cx,cy,(w-pad*2)*30/extent,(h-pad*2)*30/extent,0,0,Math.PI*2);c.stroke();
 const stream=[[19,-26],[18,-17],[16,-8],[12,0],[8,6]];c.beginPath();stream.forEach(([a,b],i)=>{const [x,y]=point(a,b);i?c.lineTo(x,y):c.moveTo(x,y);});c.strokeStyle='#739c95';c.lineWidth=3;c.stroke();
 for(const n of world.npcs??[]){const [a,b]=point(n.position.x,n.position.z);c.fillStyle='#b3c78f';c.fillText('❧',a,b);}
 const markers=world.targets.filter(s=>brief.stage==='survey'?s.type==='survey':brief.target&&s.type===brief.target.type&&s.index===brief.target.index);
 for(const s of markers){const [a,b]=point(s.position.x,s.position.z),done=s.type==='survey'&&p.scanned.includes(s.index),selected=brief.target?.type===s.type&&brief.target?.index===s.index;c.fillStyle=selected?'#fff0c5':done?'#9da98f':'#e7d9ad';c.beginPath();c.arc(a,b,6,0,Math.PI*2);c.fill();const text=s.type==='survey'?'ABC'[s.index]:brief.name;c.strokeStyle='#14251c';c.lineWidth=3;c.strokeText(text,a,b-14);c.fillText(text,a,b-14);if(selected){c.strokeStyle='#ede5c4';c.lineWidth=1;c.beginPath();c.arc(a,b,10,0,6.28);c.stroke();}}
 const [x,y]=point(world.player.position.x,world.player.position.z);c.fillStyle='#7ae1ed';c.strokeStyle='#122b2a';c.lineWidth=2;c.beginPath();c.arc(x,y,5,0,6.28);c.fill();c.stroke();
}
