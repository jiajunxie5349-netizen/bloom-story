import './style.css';
import './workbench.css';
import './immersive.css';
import './journey.css';
import {loadGarden,gardenPercent} from './garden-data.js';
import {learning,tour} from './learning.js';
import {nearestInteraction,interactionRange} from './interaction.js';
import { mountWorkbench } from './workbench.js';
import { ForestAudio } from './audio.js';
import {taskBrief,drawJournalMap} from './task-guidance.js';
import { template } from './ui.js';
import { freshProgress,loadProgress,saveProgress,progressPercent,stageOf,canUnlock } from './progress.js';
import { stages,chapters,observations,films } from './content.js';
document.querySelector('#app').innerHTML=template;
const $=s=>document.querySelector(s);
let storage;try{storage=window.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw Error('unavailable');}};}
const qaMode=import.meta.env.DEV&&new URLSearchParams(location.search).has('qa');
if(qaMode){const originalStorage=storage;storage={getItem:k=>originalStorage.getItem('floraverse.qa.'+k),setItem:(k,v)=>originalStorage.setItem('floraverse.qa.'+k,v)};}
let progress=loadProgress(storage),settings={quality:'balanced',volume:.25,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,sound:true,audioVersion:2,speed:3.3};
try{const s=JSON.parse(storage.getItem('floraverse.settings'));if(['low','balanced','high'].includes(s?.quality))settings.quality=s.quality;if(Number.isFinite(s?.volume))settings.volume=Math.max(0,Math.min(1,s.volume));if([1.8,3.3,5].includes(s?.speed))settings.speed=s.speed;if(typeof s?.reduced==='boolean')settings.reduced=s.reduced;if(s?.audioVersion===2&&typeof s.sound==='boolean')settings.sound=s.sound;}catch{}
const forestAudio=new ForestAudio();
let disposeBench=null;
let worldPromise=null,menuFrame=0;
let qaRestorationPreview=false;
let world=null,mode='menu',busy=false,scan=false,drag=false,held=0,nearest=null,lastTarget='',time=0,last=performance.now(),lastHud=0,frames=0,fps=0,fpsTimer=0,filmDone=null;
const keys=new Set();
document.body.classList.toggle('reduced-motion',settings.reduced);
$('#stars').innerHTML=Array.from({length:32},(_,i)=>`<i style="--x:${(i*37)%100}%;--y:${(i*23)%80}%;--d:${i%7}s"></i>`).join('');
function clearInput(){keys.clear();scan=false;drag=false;held=0;$('#scan-overlay').hidden=true;}
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,4800);}
function persist(){if(world)progress.position=[world.player.position.x,world.player.position.z];if(!saveProgress(storage,progress))toast('此瀏覽器無法保存進度；本次旅程仍可繼續。');updateMenu();}
function hasJourney(){return progress.position!==null||progress.scanned.length>0||progress.evidence;}
function updateMenu(){const n=progressPercent(progress);$('#journey').innerHTML=(hasJourney()?'繼續旅程':'開始旅程')+' <span>↗</span>';renderChapters();}
function renderChapters(){
 const second=loadGarden(storage);
 $('#chapter-grid').innerHTML=chapters.map((c,i)=>{
  const available=i===1||(i===2&&canUnlock(progress));
  const status=i===1?`修復 ${progressPercent(progress)}%`:i===2?(available?`修復 ${gardenPercent(second)}% · 初版體驗`:'第一章 80% 並喚醒種子後解鎖'):'開發中';
  return `<div class="chapter-entry"><button class="chapter-card ${c.biome} ${!available?'unavailable':''}" data-chapter="${i}" ${!available?'aria-disabled="true"':''}><div class="card-art"><span class="card-number">${c.n}</span><span class="card-symbol">${c.icon}</span><span class="card-status">${status}</span><div class="card-hill"></div></div><div class="card-caption"><h3>${c.title}<span>${available?'↗':'○'}</span></h3><p>${c.theme}</p></div></button>${i===2?'<button id="garden-preview" class="text-button wide">先看看光之花園 · 不保存進度 ↗</button>':''}</div>`;
 }).join('');
 document.querySelectorAll('[data-chapter]').forEach(el=>el.onclick=()=>{const i=Number(el.dataset.chapter);if(i===1)startJourney();else if(i===2&&canUnlock(progress))startGarden(false);else toast(i===2?'先在種子森林達到 80% 並喚醒種子；也可先預覽溫室場景。':'這段旅程仍在製作中。');});
 $('#garden-preview').onclick=()=>startGarden(true);
}
async function startGarden(preview=false,test=false){
 if(busy||(!preview&&!test&&!canUnlock(progress)))return;
 busy=true;clearInput();closeDialog();if(world&&mode==='playing')persist();mode='chapter2';$('#menu').hidden=true;$('#hud').hidden=true;$('#webgl-canvas').style.visibility='hidden';forestAudio.update(false,{x:0,z:0});
 try{const {enterGarden}=await import('./garden.js');await enterGarden({settings,storage,audio:forestAudio,preview,qa:import.meta.env.DEV&&qaMode,onExit(){busy=false;$('#webgl-canvas').style.visibility='';showHome();}});busy=false;}catch(error){console.error(error);busy=false;$('#webgl-canvas').style.visibility='';showHome();toast('光之花園暫時無法載入，請稍後再試。');}
}
function closeDialog(){disposeBench?.();disposeBench=null;$('#dialog').classList.remove('fieldwork','pause-view');world?.present(mode==='menu');if($('#dialog').open)$('#dialog').close();clearInput();}
function showHome(){mode='menu';clearInput();closeDialog();$('#menu').hidden=false;$('#hud').hidden=true;$('#cinematic').hidden=true;$('#loading').hidden=true;$('#home').hidden=false;$('#chapter-view').hidden=true;$('#webgl-canvas').classList.toggle('active',Boolean(world));world?.present(true);updateMenu();$('#journey').focus();}
function openDialog(kicker,html){disposeBench?.();disposeBench=null;clearInput();$('#dialog-kicker').textContent=kicker;$('#dialog-content').innerHTML=html;$('#dialog').showModal();}
$('#dialog-close').onclick=closeDialog;$('#dialog').addEventListener('cancel',e=>{e.preventDefault();closeDialog();});
function help(){let page=0;const render=()=>{const [title,text,note]=tour[page];openDialog('新手介紹 · '+(page+1)+' / '+tour.length,`<section class="tour"><div class="tour-seed" aria-hidden="true">❧</div><h2>${title}</h2><p>${text}</p><p class="learning-idea">${note}</p><div class="tour-nav"><button id="tour-prev" class="text-button" ${page===0?'disabled':''}>← 上一步</button><button id="tour-next" class="primary">${page===tour.length-1?'回到旅程':'下一步 →'}</button></div><nav class="tour-index" aria-label="介紹章節">${tour.map((s,i)=>`<button data-tour="${i}" aria-current="${i===page?'step':'false'}" aria-label="${i+1} ${s[0]}">${i+1}</button>`).join('')}</nav></section>`);$('#tour-prev').onclick=()=>{page--;render();};$('#tour-next').onclick=()=>{if(page===tour.length-1)closeDialog();else{page++;render();}};document.querySelectorAll('[data-tour]').forEach(b=>b.onclick=()=>{page=Number(b.dataset.tour);render();});};render();}
function talk(t){const brief=taskBrief(progress);openDialog(t.index===0?'守望老樹 · 森林的記憶':'苔光 · 池岸的同伴',`<h2>${t.index===0?'先聽聽土地的聲音。':'別急著把一切都清走。'}</h2><p>${t.index===0?'「我看著雨水把坡上的泥沙帶進溪流。只讓池塘變漂亮，傷口仍會留在上游。先觀察三站的差異，才知道該從哪裡開始。」':'「我的落葉小屋被包裝袋蓋住了。落葉是庇護，塑膠卻不是。水看起來清了，也不代表所有問題都消失。」'}</p><p class="journal-label">你現在可以做的事</p><h3>${brief.title}</h3><p>${brief.name}：${brief.where}</p><ol>${brief.steps.map(s=>`<li>${s}</li>`).join('')}</ol><button id="npc-mark" class="primary">替我在地圖標出目標</button><button id="npc-tour" class="text-button">我想重新看新手介紹</button>`);$('#npc-mark').onclick=()=>{world.hint(brief.target);$('#mini-panel').hidden=false;$('#map-toggle').setAttribute('aria-expanded','true');closeDialog();};$('#npc-tour').onclick=help;}
function candidates(){return [...(world?.activeTargets(stageOf(progress),progress)??[]),...(world?.npcs??[])];}
function interact(){const t=nearestInteraction(world.player.position,candidates());if(t&&t.distance<interactionRange){if(t.type==='npc')talk(t);else doAction(t,stageOf(progress));}}
async function setSound(value){
 settings.sound=await forestAudio.set(value,settings.volume);
 if(value&&!settings.sound)toast('此裝置暫時無法播放環境音。');
 $('#hud-sound').textContent=settings.sound?'♪ 音效已開啟':'♪ 音效關閉 · 點此開啟';$('#hud-sound').setAttribute('aria-pressed',String(settings.sound));try{storage.setItem('floraverse.settings',JSON.stringify(settings));}catch{}
 $('#sound-toggle').classList.toggle('on',settings.sound);$('#sound-toggle').setAttribute('aria-label',settings.sound?'關閉環境音':'開啟環境音');
}
function saveSettings(){try{storage.setItem('floraverse.settings',JSON.stringify(settings));}catch{}document.body.classList.toggle('reduced-motion',settings.reduced);world?.setQuality(settings.quality);setSound(settings.sound);}
function showSettings(){openDialog('SETTINGS',`<h2>找到舒服的節奏</h2><label class="setting-row">畫質<select id="quality"><option value="low">流暢 · 降低解析度</option><option value="balanced">均衡 · 建議</option><option value="high">精緻 · 加入柔光</option></select></label><p class="muted">若畫面不順，先選「流暢」。精緻模式啟用 Bloom，會增加顯示卡負擔。</p><label class="setting-row">移動節奏<select id="move-speed"><option value="1.8">慢步 · 觀察</option><option value="3.3">自然 · 建議</option><option value="5">輕快 · 探索</option></select></label><label class="setting-row">環境音<input type="checkbox" id="sound-check"></label><label class="setting-row">音量<input id="volume" type="range" min="0" max="1" step=".05"></label><label class="setting-row">減少動態效果<input type="checkbox" id="reduced-check"></label><button class="glass wide" id="test-sound">試聽水聲</button><p id="sound-status" role="status"></p><button class="primary wide" id="settings-ok">儲存設定</button>`);
  $('#test-sound').onclick=async()=>{const ok=await forestAudio.set(true,Number($('#volume').value));if(ok){settings.sound=true;$('#sound-check').checked=true;forestAudio.play('water');$('#sound-status').textContent='已播放試聽水聲，可用音量滑桿調整。';}else $('#sound-status').textContent='瀏覽器未能啟動聲音，請確認分頁沒有被靜音。';};
  $('#quality').value=settings.quality;$('#move-speed').value=String(settings.speed);$('#volume').value=settings.volume;$('#reduced-check').checked=settings.reduced;$('#sound-check').checked=settings.sound;
  $('#settings-ok').onclick=()=>{settings.speed=Number($('#move-speed').value);settings.quality=$('#quality').value;settings.volume=Number($('#volume').value);settings.reduced=$('#reduced-check').checked;settings.sound=$('#sound-check').checked;saveSettings();closeDialog();};
}
function codex(){openDialog('FIELD NOTES',`<h2>森林的觀察筆記</h2><p>每次觀測，都是理解土地的起點。</p>${observations.map((o,i)=>`<article class="note"><h3>${progress.scanned.includes(i)?'✧ '+o.name:'○ 未發現的筆記'}</h3><p>${progress.scanned.includes(i)?o.finding:'進入種子森林，使用生態透視鏡完成觀測後解鎖。'}</p></article>`).join('')}<p class="muted">遊戲中的即時復甦是藝術化表現，真實復育需要專業治理、時間與持續監測。</p>`);}
function pause(){if(mode!=='playing'||$('#dialog').open)return;persist();const stats=world.stats();openDialog('TAKE A BREATH',`<h2>在微光中，歇一會兒。</h2><p>種子森林 · 修復 ${progressPercent(progress)}%</p><div class="pause-actions"><button class="primary" id="resume">繼續旅程 →</button><button class="glass" id="pause-tutorial">新手介紹 · 一步步認識森林</button><button class="glass" id="pause-settings">畫面與聲音設定</button><button class="glass" id="recover">回到安全起點</button><button class="glass" id="return-menu">儲存並回主畫面</button><button class="text-button" id="restart">重新開始本章</button></div><p class="muted">目前約 ${fps} FPS · ${stats.triangles.toLocaleString()} 三角面 · ${stats.calls} 次繪製<br>效能數字是當前瀏覽器的即時觀測。</p>`);
  $('#dialog').classList.add('pause-view');world.present('pause');$('#pause-tutorial').onclick=help;$('#resume').onclick=closeDialog;$('#pause-settings').onclick=()=>{closeDialog();showSettings();};$('#recover').onclick=()=>{world.teleport([world.spawn.x,world.spawn.z]);world.resetCamera();persist();closeDialog();toast('已返回安全起點，任務進度保留。');};$('#return-menu').onclick=()=>{persist();showHome();};
  $('#restart').onclick=()=>{closeDialog();openDialog('A NEW BEGINNING','<h2>重新開始種子森林？</h2><p>這會清除本章的任務進度與觀察紀錄。</p><button class="primary wide" id="confirm-restart">確認重新開始</button><button class="text-button wide" id="cancel-restart">保留旅程</button>');$('#cancel-restart').onclick=closeDialog;$('#confirm-restart').onclick=()=>{progress=freshProgress();world.syncProgress(progress);world.teleport([world.spawn.x,world.spawn.z]);persist();closeDialog();updateHud();};};
}
async function ensureWorld(preview=false){
  if(world)return true;if(worldPromise){if(!preview){$('#loading').hidden=false;$('#loading-back').hidden=true;}return worldPromise;}if(!preview){$('#loading').hidden=false;$('#loading-back').hidden=true;}
  worldPromise=(async()=>{
  try{const {createWorld}=await import('./world.js');world=await createWorld($('#webgl-canvas'),settings,t=>$('#loading-text').textContent=t);$('#loading').hidden=true;$('#menu').classList.add('has-world');$('#webgl-canvas').classList.add('active');world.present(mode==='menu');return true;}
  catch(error){console.error(error);$('#loading-text').textContent='森林載入失敗。請確認網路、模型檔案與 WebGL 可用，再重新進入。';$('#loading-back').hidden=false;return false;}
  })();const ok=await worldPromise;worldPromise=null;return ok;
}
async function startJourney(){if(busy)return;busy=true;await setSound(settings.sound);$('#menu').hidden=true;const ok=await ensureWorld();busy=false;if(!ok)return;
  $('#webgl-canvas').classList.add('active');world.present(false);world.resetCamera();
  world.syncProgress(progress);if(progress.position)world.teleport(progress.position);
  const begin=()=>{mode='playing';$('#hud').hidden=false;clearInput();updateHud();if(!hasJourney())help();};
  if(!hasJourney())playFilm('chapter1Intro',begin);else begin();
}
function playFilm(key,done){
  clearInput();mode='film';filmDone=done;$('#hud').hidden=true;$('#cinematic').hidden=false;const v=$('#story-video');v.pause();v.removeAttribute('src');v.load();v.hidden=true;$('#film-status').textContent='';$('#film-fallback').hidden=false;
  const outro=key.endsWith('Outro');$('#film-title').textContent=outro?'森林，記得你的回應。':'有些希望，正安靜地等待。';$('#film-text').textContent=outro?'你辨認污染、阻止擴散，並為土壤重新生長創造條件。把這份觀察與關心，帶回真實的生活。':'沉睡的種子藏在森林深處。循著溪流，找出土地失去生機的原因。先觀察，再行動。';$('#film-continue').textContent=outro?'回到主畫面 →':'走進種子森林 →';
  if(films[key]){v.src=import.meta.env.BASE_URL+films[key];v.hidden=false;$('#film-fallback').hidden=true;$('#film-continue').textContent='跳過影片 →';v.volume=settings.volume;v.play().catch(()=>$('#film-status').textContent='請按影片上的播放鍵開始，或選擇跳過。');}
}
function finishFilm(){if(!filmDone)return;const done=filmDone;filmDone=null;$('#story-video').pause();$('#story-video').removeAttribute('src');$('#story-video').load();$('#cinematic').hidden=true;clearInput();done();}
$('#story-video').onended=finishFilm;$('#story-video').onerror=()=>{if(!filmDone)return;$('#story-video').hidden=true;$('#film-fallback').hidden=false;$('#film-status').textContent='影片無法載入，可繼續旅程。';};$('#film-continue').onclick=finishFilm;
function updateHud(){const s=stages[stageOf(progress)];$('#objective-title').textContent=s.title;$('#objective-text').textContent=s.text;$('#stage-label').textContent=s.short;$('#percent').textContent=`${progressPercent(progress)}%`;$('#chapter-progress').value=progressPercent(progress);}
function milestone(){world?.hint(null);persist();updateHud();held=0;}
function workbench(kind,complete){
 openDialog('HANDS IN THE FOREST','<div id="fieldwork-root"></div>');
 disposeBench=mountWorkbench($('#fieldwork-root'),kind,progress.drafts[kind],draft=>{progress.drafts[kind]=draft;persist();},()=>{complete();delete progress.drafts[kind];milestone();closeDialog();forestAudio.play('success');if(kind==='transfer')playFilm('chapter1Outro',showHome);else toast('修復已記錄。下一步：'+taskBrief(progress).name+'。按 J 查看位置與完成條件。');},type=>forestAudio.play(type));
}
function observe(t){
 if(progress.scanned.length===3){workbench('evidence',()=>progress.evidence=true);return;}
 if(!progress.scanned.includes(t.index))progress.scanned.push(t.index);milestone();forestAudio.play('water');
 if(progress.scanned.length===3){workbench('evidence',()=>progress.evidence=true);return;}
 openDialog('ECOLOGICAL OBSERVATION',`<h2>${observations[t.index].name}</h2><p>${observations[t.index].finding}</p><p class="muted">已記錄 ${progress.scanned.length} / 3 處觀測。繼續觀察其他地點，再比對證據。</p><button class="primary wide" id="note-ok">收進生態圖鑑 →</button>`);$('#note-ok').onclick=closeDialog;
}
function doAction(t,stage){
 if(stage==='survey')observe(t);
 if(stage==='isolate')workbench('water',()=>{progress.barriers=[0,1];world.syncProgress(progress);});
 if(stage==='soil')workbench(['cleanup','soil','plants'][t.index],()=>{if(!progress.soils.includes(t.index))progress.soils.push(t.index);});
 if(stage==='ritual'){
  openDialog('A SEED OF HOPE','<h2>用雙手捧起新的希望</h2><p>你已完成五項修復。種子的光是藝術化的回應，真實復育仍需要適當治理與持續監測。</p><div class="ritual-seed" aria-hidden="true">❧</div><button id="awaken-seed" class="primary wide">張開雙手，捧起種子 →</button>');
  $('#awaken-seed').onclick=()=>{progress.ritual=true;milestone();closeDialog();forestAudio.play('success');toast('修復達 80% 並完成喚醒。第二章光之花園已解鎖；可回主畫面選章，也可留在種子森林完成綜合驗證。');};
 }
 if(stage==='reflect')workbench('transfer',()=>progress.reflection=true);
}
$('#open-tutorial').onclick=help;$('#map-toggle').onclick=()=>{const open=$('#mini-panel').hidden;$('#mini-panel').hidden=!open;$('#map-toggle').setAttribute('aria-expanded',String(open));$('#map-toggle').setAttribute('aria-label',open?'收起林間地圖 M':'開啟林間地圖 M');};$('#map-journal').onclick=()=>$('#guide-button').click();$('#interaction').onclick=interact;$('#journey').onclick=startJourney;$('#show-chapters').onclick=()=>{$('#home').hidden=true;$('#chapter-view').hidden=false;$('#back-home').focus();};$('#back-home').onclick=showHome;$('#brand').onclick=e=>{e.preventDefault();showHome();};$('#loading-back').onclick=showHome;$('#open-settings').onclick=showSettings;$('#sound-toggle').onclick=()=>setSound(!settings.sound);$('#hud-sound').onclick=()=>setSound(!settings.sound);$('#guide-button').onclick=()=>{const brief=taskBrief(progress);openDialog('旅途筆記 · 目前任務',`<h2>${brief.title}</h2><div class="journal-layout"><div><p class="journal-label">前往哪裡</p><p><strong>${brief.name}</strong><br>${brief.where}</p><p class="journal-label">到達後怎麼做</p><ol class="help-list">${brief.steps.map(step=>`<li>${step}</li>`).join('')}</ol><p class="journal-label">什麼才算完成</p><p>${brief.done}</p></div><div><canvas id="journal-map" width="340" height="300" role="img" aria-label="任務位置示意圖：北在上，藍點為玩家，亮色圈為目前目標"></canvas><p class="muted">北在上 · 藍點是你 · 亮圈是建議目標</p>${brief.target?'<button id="journal-mark" class="primary wide">在森林中標記這個地點</button>':''}</div></div>${brief.stations?`<p class="muted">${brief.stations.map(s=>(s.done?'✓ 已記錄：':'○ 未記錄：')+s.label).join('<br>')}</p>`:''}<details><summary>操作與整章旅程</summary><p class="muted">WASD 移動 · 拖曳轉動視角 · 滾輪縮放 · E 互動 · J 筆記 · Esc 暫停。先比對證據，再處理來源、池岸、坡地與植被，最後喚醒種子及驗證。</p></details><button id="journal-tutorial" class="text-button wide">新手介紹 · 從頭認識任務 →</button><button id="journal-codex" class="text-button wide">翻閱生態圖鑑 →</button>`);drawJournalMap($('#journal-map'),world,brief,progress);if(brief.target)$('#journal-mark').onclick=()=>{world.hint(brief.target);closeDialog();toast('已標記「'+brief.name+'」，靠近後按 E。沒有地面引導線。');};$('#journal-codex').onclick=codex;$('#journal-tutorial').onclick=help;};$('#open-codex').onclick=codex;$('#pause-button').onclick=pause;$('#help-button').onclick=help;
$('#open-about').onclick=()=>openDialog('ABOUT FLORAVERSE','<h2>看見自己的成長，<br>也讓世界回應你的存在。</h2><p>《Bloom Story 尋找失落花園》是一場關於生態修復的沉浸旅程，以親自然設計、注意力恢復理論與柔和的自然意象作為創作方向。</p><p>第一章以土壤生態為主題，透過證據比對、水路解謎、近景清理、土壤與植被配置，練習理解行動與環境之間的關係。</p><p class="muted">目前開放第一章與第二章鍵鼠初版體驗。後續章節、攝影機儀式與正式劇情影片仍在製作中。進度儲存在目前瀏覽器，不會跨裝置同步。</p>');
window.addEventListener('keydown',e=>{
  if(mode!=='playing')return;
  if(e.code==='Escape'){if(!$('#dialog').open){e.preventDefault();pause();}return;}
  if($('#dialog').open)return;
  if(e.code==='KeyM'&&!e.repeat){$('#map-toggle').click();return;}
  if(e.code==='KeyJ'&&!e.repeat){$('#guide-button').click();return;}
  if(e.code==='KeyH'&&!e.repeat){help();return;}
  if(['KeyW','KeyA','KeyS','KeyD','KeyE','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  keys.add(e.code);
  if(e.code==='KeyE'&&!e.repeat)interact();
});
window.addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='KeyE'){held=0;if(nearest?.type==='isolate'&&!progress.barriers.includes(nearest.index))world?.rockProgress(nearest,0);}});
const canvas=$('#webgl-canvas');canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{if(mode!=='playing'||$('#dialog').open)return;if(e.button===0){drag=true;canvas.setPointerCapture(e.pointerId);const r=canvas.getBoundingClientRect();if(world?.touchWater((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2))forestAudio.play('water');}if(e.button===2)scan=true;});
window.addEventListener('pointerup',e=>{if(e.button===0)drag=false;if(e.button===2){scan=false;held=0;}});
canvas.addEventListener('pointermove',e=>{if(drag&&mode==='playing'&&!$('#dialog').open)world?.rotate(e.movementX,e.movementY);});
canvas.addEventListener('wheel',e=>{if(mode==='playing'&&!$('#dialog').open){e.preventDefault();world?.zoom(e.deltaY);}},{passive:false});
window.addEventListener('blur',()=>{clearInput();if(mode==='playing'&&!$('#dialog').open)pause();});
document.addEventListener('visibilitychange',()=>{last=performance.now();if(document.hidden){clearInput();if(mode==='playing'&&!$('#dialog').open)pause();}});
window.addEventListener('resize',()=>world?.resize());window.addEventListener('pagehide',()=>{if(world)persist();});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();clearInput();toast('顯示卡連線中斷。進度已儲存，請重新整理頁面。');persist();mode='lost';});
function tick(now){requestAnimationFrame(tick);const realDt=(now-last)/1000,dt=Math.min(realDt,.05);last=now;if(mode==='chapter2')return;if(document.hidden||!world||mode==='lost'){forestAudio.update(false,world?.player.position??{x:0,z:0});return;}
  if(mode==='menu'&&now-menuFrame<33)return;menuFrame=now;
  time+=dt;const active=mode==='playing'&&!$('#dialog').open;forestAudio.update(active,world.player.position,progress.soils.length/3);const stage=stageOf(progress);
  if(import.meta.env.DEV&&qaMode&&$('#qa-position'))$('#qa-position').textContent=`位置 ${world.player.position.x.toFixed(2)},${world.player.position.z.toFixed(2)} · 速度 ${settings.speed}`;
  try{world.update(dt,time,keys,active,import.meta.env.DEV&&qaRestorationPreview?{...progress,barriers:[0,1],soils:[0,1,2],ritual:true}:progress,stage,scan,settings.reduced);}catch(error){console.error(error);clearInput();persist();mode='lost';$('#hud').hidden=true;$('#loading').hidden=false;$('#loading-text').textContent='場景繪製中斷。進度已保存，請重新整理頁面後選擇「流暢」畫質。';$('#loading-back').hidden=false;return;}
  frames++;fpsTimer+=realDt;if(fpsTimer>1){fps=Math.round(frames/fpsTimer);frames=0;fpsTimer=0;}
  $('#scan-overlay').hidden=!(scan&&active);
  if(!active){$('#interaction').hidden=true;return;}
  const targets=candidates();nearest=nearestInteraction(world.player.position,targets);
  world.npcs.forEach(n=>n.sign.visible=Math.hypot(n.position.x-world.player.position.x,n.position.z-world.player.position.z)<7);
  if(!$('#mini-panel').hidden&&now-lastHud>150){drawJournalMap($('#mini-map'),world,taskBrief(progress),progress);$('#map-current').textContent='藍點是你 · '+taskBrief(progress).name;}
  const id=nearest?nearest.type+nearest.index:'';if(id!==lastTarget){held=0;lastTarget=id;}
  const near=nearest&&nearest.distance<interactionRange;$('#interaction').hidden=!near;
  if(near){$('#target-label').textContent=nearest.label;$('#interaction-text').textContent=nearest.type==='npc'?'按 E · 聽聽森林的話':stage==='survey'?(progress.scanned.length===3?'按 E · 比對證據':'按 E · 收集樣本'):'按 E · '+taskBrief(progress).name;$('#hold-progress').hidden=stages[stage].duration===0;
    if(stages[stage].duration>0&&keys.has('KeyE')&&(stage!=='survey'||scan)){
      held+=dt;$('#hold-progress').value=held/stages[stage].duration;if(stage==='isolate')world.rockProgress(nearest,held/stages[stage].duration);
      if(held>=stages[stage].duration)doAction(nearest,stage);
    }else{held=0;$('#hold-progress').value=0;}
  }else held=0;
  if(now-lastHud>150){lastHud=now;$('#wayfinder').hidden=true;world.guideTo(nearest);
    $('#objective-text').textContent=nearest?(near?'現在按 E，調查「'+nearest.label+'」。':'下一步：找到「'+nearest.label+'」。觀察周圍的污染線索，靠近後按 E。'):stages[stage].text;
    $('#stage-label').textContent=stage==='survey'?'收集樣本 '+progress.scanned.length+' / 3，再比對證據':stages[stage].short;
    if(nearest){$('#wayfinder-text').textContent=(near?'按 E 調查 · ':'觀察 → ')+nearest.label+' · '+nearest.distance.toFixed(0)+' m';$('#wayfinder-arrow').textContent=near?'✧':'↑';$('#wayfinder-arrow').style.transform=`rotate(${world.bearing(nearest.position)}rad)`;}
  }
}
updateMenu();requestAnimationFrame(tick);
$('#menu').addEventListener('pointermove',e=>{if(mode==='menu'&&!settings.reduced)world?.present(true,(e.clientX/innerWidth-.5)*2,(e.clientY/innerHeight-.5)*2);});
requestAnimationFrame(()=>ensureWorld(true));


// Development-only journey fixture. Removed by Vite from production builds.
if(import.meta.env.DEV&&qaMode){
 const gardenTest=document.createElement('button');gardenTest.textContent='測試專用：第二章完整任務';gardenTest.style.cssText='position:fixed;bottom:210px;right:24px;z-index:50;padding:12px';gardenTest.onclick=()=>startGarden(false,true);document.body.append(gardenTest);
 const button=document.createElement('button');button.textContent='測試專用：移至下一互動點';button.style.cssText='position:fixed;bottom:65px;right:24px;z-index:50;padding:12px;background:#d4ddae;color:#182b1c;border:0;border-radius:6px';
 button.onclick=()=>{if(!world||mode!=='playing'||$('#dialog').open)return;const t=world.activeTargets(stageOf(progress),progress)[0];if(t){world.teleport([t.position.x,t.position.z]);clearInput();}};
 document.body.append(button);
 const coordinate=document.createElement('output');coordinate.id='qa-position';coordinate.style.cssText='position:fixed;bottom:10px;right:20px;color:white;background:#13291f;padding:6px;z-index:60';document.body.append(coordinate);
 const npcButton=document.createElement('button');npcButton.textContent='測試專用：拜訪老樹';npcButton.style.cssText='position:fixed;bottom:165px;right:24px;z-index:50;padding:10px';npcButton.onclick=()=>{if(!world||mode!=='playing'||$('#dialog').open)return;const n=world.npcs[0];world.teleport([n.position.x+1,n.position.z]);};document.body.append(npcButton);
 const previewButton=document.createElement('button');previewButton.textContent='測試專用：復甦前後預覽';previewButton.style.cssText='position:fixed;right:24px;bottom:115px;z-index:50;padding:12px';previewButton.onclick=()=>{qaRestorationPreview=!qaRestorationPreview;};document.body.append(previewButton);
}
