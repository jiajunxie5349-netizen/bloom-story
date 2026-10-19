// Later chapters are explorable scene studies, with independent, session-only interactions.
export const biomeStudies={
 3:{title:'蝴蝶谷',subtitle:'讓生命找到連在一起的家',intro:'流光把你送到花谷。花還在，蝴蝶卻總在斷開的葉叢前折返。蝶使停在寄主葉上：「請先看看，我們從小到大，需要的是同一個家嗎？」',npc:'蝶使・翎',source:'https://www.fws.gov/our-work/pollinators',color:'#78876e',sites:[
  {x:-10,z:8,name:'寄主葉叢',look:'幼蟲停在葉上，成蝶在附近尋花。',question:'照顧牠們，要只留下花朵嗎？',choices:[['both','留下寄主植物，也保留成蝶取食的花'],['flowers','只有花就足夠，把其餘葉叢清走']],answer:'both',explain:'蝴蝶不同生命階段有不同需求。寄主植物與花蜜資源都需要合適的種類，不能只用「花多」判斷棲地好壞。'},
  {x:10,z:3,name:'斷開的花帶',look:'蝴蝶在兩片花叢之間折返，低矮葉叢尚未連成庇護。',question:'怎樣幫牠找到下一個落腳處？',choices:[['connect','用合適的花與葉叢連起棲地，留下飛行空隙'],['wall','把空隙全部種成密牆']],answer:'connect',explain:'棲地需要資源與連通性，也需要可移動的空間。這裡的花帶是示意，真實安排要考慮物種與環境。'},
  {x:0,z:-15,name:'輪替盛開的花窩',look:'有些花正在開，有些還是花苞，另一些開始結實。',question:'整座花谷只種一種、同時開花的植物好嗎？',choices:[['variety','保留適地的多種植物，讓資源有不同時段'],['same','全部換成同一種花，開完就不再照顧']],answer:'variety',explain:'適地的植物多樣性與不同開花時段，有助於提供持續資源。花種選擇仍須以在地生態為準。'}]},
 4:{title:'天空花園',subtitle:'水流回來，還要問它適不適合使用',intro:'蝶影飛向雲上的浮島。溪流守望者守著一片集雨巨葉：「雨帶來水，也可能帶來遠方的影響。先觀察，再決定怎樣照顧花園。」浮島屬於故事的幻想地景。',npc:'溪流守望者',source:'https://www.epa.gov/acidrain/what-acid-rain',color:'#718e91',sites:[
  {x:-10,z:8,name:'集雨巨葉',look:'葉盆接住了雨滴，觀測記錄顯示條件和上次不同。',question:'水看起來透明，能直接判定適合幼苗嗎？',choices:[['measure','比較水質與幼苗需求，交由守望者確認'],['clear','看起來透明就直接使用']],answer:'measure',explain:'透明只是外觀。水是否適合使用，需要對應用途與可比較的觀測，不能只看顏色。'},
  {x:10,z:3,name:'落根水道',look:'落枝卡在兩片集水葉之間，細流繞向裸露的岸邊。',question:'落枝堵住了原本的水路，怎樣恢復流動？',choices:[['flow','請守望者整理已確認安全的堵塞，保留池岸植被'],['sweep','清空所有岸邊植物，讓水越快越好']],answer:'flow',explain:'水路連通與岸邊棲地要一起照顧。恢復流動不代表污染已經消失，也不表示應清光自然材料。'},
  {x:0,z:-15,name:'霧雨觀測崖',look:'遠方霧雨落在浮島，源頭線索不全在眼前。',question:'過濾掉看得見的顆粒，就處理了所有酸雨問題嗎？',choices:[['source','還要追查形成酸沉降的來源，持續觀測與專業評估'],['filter','顆粒不見了，就代表所有問題已解決']],answer:'source',explain:'酸沉降與二氧化硫、氮氧化物等前驅物有關；移除顆粒不能等同處理所有溶解物或酸度問題。這裡不提供自行投藥的操作。'}]},
 5:{title:'生命之樹',subtitle:'讓每一份照顧，連成能延續的關係',intro:'四段旅程的回聲匯在巨樹根下。樹冠還沒有全部展開：「土、水、光與生命都來了。你願意看看，它們怎樣互相支持嗎？」這裡先展示生態關係的場景互動。',npc:'生命之樹的回聲',source:'https://www.nrcs.usda.gov/conservation-basics/soil/soil-health',color:'#777f67',sites:[
  {x:-10,z:8,name:'土壤與根的回聲',look:'健康落葉層下有嫩根，另一側裸土仍易受雨水沖刷。',question:'怎樣讓根下的照顧持續下去？',choices:[['soil','保護健康落葉與土壤，依地況維持覆蓋'],['bare','把地面掃得完全乾淨']],answer:'soil',explain:'土壤保護、自然有機物與活根互相支持。整齊裸地不等於健康棲地。'},
  {x:10,z:3,name:'水與光的回聲',look:'一側幼苗缺水，另一側已有適合的遮蔭。',question:'讓整座森林都接受最強的光，就能恢復嗎？',choices:[['balance','依植物需求照顧水分與光照，保留合適遮蔭'],['maximum','清開所有樹冠，光越強越好']],answer:'balance',explain:'生長條件需要配合。增加單一條件，不能取代其他需求，也不能用強光補回缺水。'},
  {x:0,z:-18,name:'共生與明日的回聲',look:'新花開了，蝶影回來，但遠方仍有新的環境變化。',question:'花開之後，這段照顧就結束了嗎？',choices:[['continue','保留多樣棲地，和同伴持續觀察並調整'],['end','花開代表全部安全，不再觀察']],answer:'continue',explain:'復甦是持續的共同照顧。需要觀察環境變化，再調整方法；不能用一次花開判定所有問題已解決。'}]}
};
export function biomeHeight(ch,x,z){const r=Math.hypot(x,z),a=Math.atan2(z,x),edge=25.7+Math.sin(a*3)*2.8+Math.cos(a*5)*1.5+Math.sin(a*7)*.7;return -.35+.48*Math.sin(x*.13)*Math.cos(z*.12)+.22*Math.cos(x*.21+z*.16)+Math.min(4.6,Math.max(0,r-edge)**2*.20);}
export function biomeWalkable(ch,x,z,solids=[]){
 if(!Number.isFinite(x)||!Number.isFinite(z)||Math.hypot(x,z)>36)return false;
 const sx=(biomeHeight(ch,x+.1,z)-biomeHeight(ch,x-.1,z))/.2,sz=(biomeHeight(ch,x,z+.1)-biomeHeight(ch,x,z-.1))/.2;
 return Math.hypot(sx,sz)<.95&&!solids.some(p=>Math.hypot(p.x-x,p.z-z)<p.r+.24);
}
