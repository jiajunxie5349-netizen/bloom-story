export const filmScenes={
 chapter1Intro:{title:'在巨葉之下，醒來。',text:'穿過光之門，你落在沉睡的種子森林。巨葉遮住天光，紫色侵擾沿著水流蔓延。種子仍在呼吸；先聽聽老樹與池岸同伴的聲音，找出土地失去生機的原因。'},
 chapter1TurningPoint:{title:'水流停住了，傷口還在。',text:'來源的擴散被控制，池岸卻仍留下垃圾與裸露土壤。紫色異變膜開始褪去。要讓種子醒來，還必須為土地與原生植物重新創造生長條件。'},
 chapter1Outro:{title:'種子記住了你的回應。',text:'土地重獲庇護，生命種子甦醒。它的微光指向灰霾中的溫室：沒有能穿透塵霾的日光，生長仍難以延續。下一段旅程，前往光之花園。'},
 chapter2Intro:{title:'被灰霾收藏的日光。',text:'帶著森林的種子，你來到失光的溫室。玻璃老藤守著枯葉，流光守著最後的日照花床。找到來源，讓合適的風重新流過，再收集光之種。'},
 chapter2TurningPoint:{title:'風不會讓問題憑空消失。',text:'燃燒停止，灰霧卻仍滯留。老藤指向停轉的風廊：觀察室內外條件，讓來源控制、適當通風與過濾相互配合。光之種等待的是理解。'},
 chapter2Outro:{title:'光，終於穿過了灰霾。',text:'四顆光之種在祭壇相遇，葉片迎回陽光。流光望向寂靜的蝴蝶谷：「光與土壤回來了，傳遞生命的同伴卻還沒有回來。」你帶著新的光，走向谷地。'}
};
const key='floraverse.story.v1';
export function readStory(storage,chapter){try{const a=JSON.parse(storage.getItem(key));return Array.isArray(a)?a.filter(v=>v&&v.chapter===chapter&&typeof v.speaker==='string'&&typeof v.text==='string').slice(-12):[];}catch{return [];}}
export function rememberStory(storage,chapter,speaker,text){try{let a;const raw=storage.getItem(key);try{a=JSON.parse(raw??'null');}catch{a=[];}if(!Array.isArray(a))a=[];if(a.some(v=>v?.chapter===chapter&&v?.speaker===speaker&&v?.text===text))return true;a.push({chapter,speaker,text});storage.setItem(key,JSON.stringify(a.slice(-40)));return true;}catch{return false;}}
export function conversation(speaker,lines,index){return `<section class="story-conversation"><div class="story-portrait" aria-hidden="true">${speaker.includes('樹')||speaker.includes('藤')?'♧':'❧'}</div><div class="story-speech"><p class="story-speaker">${speaker}<span>${index+1} / ${lines.length}</span></p><p class="story-line">${lines[index]}</p><button class="story-next" id="story-next">${index===lines.length-1?'記入旅途筆記 ↗':'繼續對話 →'}</button></div></section>`;}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function storyJournal(storage,chapter){const entries=readStory(storage,chapter);return entries.length?`<details class="story-record"><summary>已記錄的對話與線索 · ${entries.length}</summary>${entries.map(v=>`<article><strong>${escape(v.speaker)}</strong><p>${escape(v.text)}</p></article>`).join('')}</details>`:'<p class="muted">拜訪同伴後，對話線索會收進這裡。</p>';}

