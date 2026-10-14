import './style.css';
import './workbench.css';
import { mountWorkbench } from './workbench.js';
import { ForestAudio } from './audio.js';
import { template } from './ui.js';
import { freshProgress,loadProgress,saveProgress,progressPercent,stageOf,canUnlock } from './progress.js';
import { stages,chapters,observations,films } from './content.js';
document.querySelector('#app').innerHTML=template;
const $=s=>document.querySelector(s);
let storage;try{storage=window.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw Error('unavailable');}};}
const qaMode=import.meta.env.DEV&&new URLSearchParams(location.search).has('qa');
if(qaMode){const originalStorage=storage;storage={getItem:k=>originalStorage.getItem('floraverse.qa.'+k),setItem:(k,v)=>originalStorage.setItem('floraverse.qa.'+k,v)};}
let progress=loadProgress(storage),settings={quality:'balanced',volume:.25,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,sound:false};
try{const s=JSON.parse(storage.getItem('floraverse.settings'));if(['low','balanced','high'].includes(s?.quality))settings.quality=s.quality;if(Number.isFinite(s?.volume))settings.volume=Math.max(0,Math.min(1,s.volume));if(typeof s?.reduced==='boolean')settings.reduced=s.reduced;}catch{}
const forestAudio=new ForestAudio();
let disposeBench=null;
let world=null,mode='menu',busy=false,scan=false,drag=false,held=0,nearest=null,lastTarget='',time=0,last=performance.now(),lastHud=0,frames=0,fps=0,fpsTimer=0,filmDone=null;
const keys=new Set();
document.body.classList.toggle('reduced-motion',settings.reduced);
$('#stars').innerHTML=Array.from({length:32},(_,i)=>`<i style="--x:${(i*37)%100}%;--y:${(i*23)%80}%;--d:${i%7}s"></i>`).join('');
function clearInput(){keys.clear();scan=false;drag=false;held=0;$('#scan-overlay').hidden=true;}
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,4800);}
function persist(){if(world)progress.position=[world.player.position.x,world.player.position.z];if(!saveProgress(storage,progress))toast('此瀏覽器無法保存進度；本次旅程仍可繼續。');updateMenu();}
function updateMenu(){const n=progressPercent(progress);$('#journey').innerHTML=(n>0?'繼續旅程':'開始旅程')+' <span>↗</span>';renderChapters();}
function renderChapters(){
  $('#chapter-grid').innerHTML=chapters.map((c,i)=>{
    const unlocked=i===1||(i===2&&canUnlock(progress));
    const status=c.ready?(progressPercent(progress)?`修復 ${progressPercent(progress)}%`:'可開始旅程'):i===0?'開發中':unlocked?'已解鎖 · 開發中':'未解鎖 · 開發中';
    return `<button class="chapter-card ${c.biome} ${!c.ready?'unavailable':''}" data-chapter="${i}" ${!c.ready?'aria-disabled="true"':''}><div class="card-art"><span class="card-number">${c.n}</span><span class="card-symbol">${c.icon}</span><span class="card-status">${status}</span><div class="card-hill"></div></div><div class="card-caption"><h3>${c.title}<span>${c.ready?'↗':'○'}</span></h3><p>${c.theme}</p></div></button>`;
  }).join('');
  document.querySelectorAll('[data-chapter]').forEach(el=>el.onclick=()=>Number(el.dataset.chapter)===1?startJourney():toast(Number(el.dataset.chapter)===2&&canUnlock(progress)?'光之花園已解鎖，關卡仍在製作中。':'這段旅程仍在製作中，先從種子森林開始吧。'));
}
function closeDialog(){disposeBench?.();disposeBench=null;$('#dialog').classList.remove('fieldwork');if($('#dialog').open)$('#dialog').close();clearInput();}
function showHome(){mode='menu';clearInput();closeDialog();$('#menu').hidden=false;$('#hud').hidden=true;$('#cinematic').hidden=true;$('#loading').hidden=true;$('#home').hidden=false;$('#chapter-view').hidden=true;$('#webgl-canvas').classList.remove('active');updateMenu();$('#journey').focus();}
function openDialog(kicker,html){disposeBench?.();disposeBench=null;clearInput();$('#dialog-kicker').textContent=kicker;$('#dialog-content').innerHTML=html;$('#dialog').showModal();}
$('#dialog-close').onclick=closeDialog;$('#dialog').addEventListener('cancel',e=>{e.preventDefault();closeDialog();});
function help(){openDialog('HOW TO EXPLORE',`<h2>慢慢走，森林會等你。</h2><p>WASD 移動，左鍵拖曳可上下左右轉動視角，滾輪拉近拉遠。角色會沿可行走地面前進，水池與陡坡無法通行。</p><ul class="help-list"><li><kbd>右鍵</kbd> 按住開啟生態透視鏡。</li><li><kbd>E</kbd> 接近池岸樣本、閘石、土壤或植物，按一次即可互動。近景可點選或拖放，Esc 返回探索。</li><li><kbd>Esc</kbd> 暫停、返回主畫面或重新定位。</li><li><kbd>H</kbd> 隨時查看操作說明。</li></ul><p class="muted">跟隨方向提示尋找當前任務。自由探索、不計時、不扣分；解謎可撤銷、查看提示與重新嘗試。這個版本使用鍵鼠模擬儀式，無需攝影機。</p><button id="help-ok" class="primary wide">準備好了 →</button>`);$('#help-ok').onclick=closeDialog;}
async function setSound(value){
 settings.sound=await forestAudio.set(value,settings.volume);
 if(value&&!settings.sound)toast('此裝置暫時無法播放環境音。');
 $('#sound-toggle').classList.toggle('on',settings.sound);$('#sound-toggle').setAttribute('aria-label',settings.sound?'關閉環境音':'開啟環境音');
}
function saveSettings(){try{storage.setItem('floraverse.settings',JSON.stringify(settings));}catch{}document.body.classList.toggle('reduced-motion',settings.reduced);world?.setQuality(settings.quality);setSound(settings.sound);}
function showSettings(){openDialog('SETTINGS',`<h2>找到舒服的節奏</h2><label class="setting-row">畫質<select id="quality"><option value="low">流暢 · 降低解析度</option><option value="balanced">均衡 · 建議</option><option value="high">精緻 · 加入柔光</option></select></label><p class="muted">若畫面不順，先選「流暢」。精緻模式啟用 Bloom，會增加顯示卡負擔。</p><label class="setting-row">環境音<input type="checkbox" id="sound-check"></label><label class="setting-row">音量<input id="volume" type="range" min="0" max="1" step=".05"></label><label class="setting-row">減少動態效果<input type="checkbox" id="reduced-check"></label><button class="primary wide" id="settings-ok">儲存設定</button>`);
  $('#quality').value=settings.quality;$('#volume').value=settings.volume;$('#reduced-check').checked=settings.reduced;$('#sound-check').checked=settings.sound;
  $('#settings-ok').onclick=()=>{settings.quality=$('#quality').value;settings.volume=Number($('#volume').value);settings.reduced=$('#reduced-check').checked;settings.sound=$('#sound-check').checked;saveSettings();closeDialog();};
}
function codex(){openDialog('FIELD NOTES',`<h2>森林的觀察筆記</h2><p>每次觀測，都是理解土地的起點。</p>${observations.map((o,i)=>`<article class="note"><h3>${progress.scanned.includes(i)?'✧ '+o.name:'○ 未發現的筆記'}</h3><p>${progress.scanned.includes(i)?o.finding:'進入種子森林，使用生態透視鏡完成觀測後解鎖。'}</p></article>`).join('')}<p class="muted">遊戲中的即時復甦是藝術化表現，真實復育需要專業治理、時間與持續監測。</p>`);}
function pause(){if(mode!=='playing'||$('#dialog').open)return;persist();const stats=world.stats();openDialog('TAKE A BREATH',`<h2>在微光中，歇一會兒。</h2><p>種子森林 · 修復 ${progressPercent(progress)}%</p><div class="pause-actions"><button class="primary" id="resume">繼續旅程 →</button><button class="glass" id="pause-settings">畫面與聲音設定</button><button class="glass" id="recover">回到安全起點</button><button class="glass" id="return-menu">儲存並回主畫面</button><button class="text-button" id="restart">重新開始本章</button></div><p class="muted">目前約 ${fps} FPS · ${stats.triangles.toLocaleString()} 三角面 · ${stats.calls} 次繪製<br>效能數字是當前瀏覽器的即時觀測。</p>`);
  $('#resume').onclick=closeDialog;$('#pause-settings').onclick=()=>{closeDialog();showSettings();};$('#recover').onclick=()=>{world.teleport([world.spawn.x,world.spawn.z]);world.resetCamera();persist();closeDialog();toast('已返回安全起點，任務進度保留。');};$('#return-menu').onclick=()=>{persist();showHome();};
  $('#restart').onclick=()=>{closeDialog();openDialog('A NEW BEGINNING','<h2>重新開始種子森林？</h2><p>這會清除本章的任務進度與觀察紀錄。</p><button class="primary wide" id="confirm-restart">確認重新開始</button><button class="text-button wide" id="cancel-restart">保留旅程</button>');$('#cancel-restart').onclick=closeDialog;$('#confirm-restart').onclick=()=>{progress=freshProgress();world.syncProgress(progress);world.teleport([world.spawn.x,world.spawn.z]);persist();closeDialog();updateHud();};};
}
async function ensureWorld(){
  if(world)return true;$('#loading').hidden=false;$('#loading-back').hidden=true;
  try{const {createWorld}=await import('./world.js');world=await createWorld($('#webgl-canvas'),settings,t=>$('#loading-text').textContent=t);$('#loading').hidden=true;return true;}
  catch(error){console.error(error);$('#loading-text').textContent='森林載入失敗。請確認網路、模型檔案與 WebGL 可用，再重新進入。';$('#loading-back').hidden=false;return false;}
}
async function startJourney(){if(busy)return;busy=true;$('#menu').hidden=true;const ok=await ensureWorld();busy=false;if(!ok)return;
  $('#webgl-canvas').classList.add('active');
  world.syncProgress(progress);if(progress.position)world.teleport(progress.position);
  const begin=()=>{mode='playing';$('#hud').hidden=false;clearInput();updateHud();if(progressPercent(progress)===0)help();};
  if(progressPercent(progress)===0)playFilm('chapter1Intro',begin);else begin();
}
function playFilm(key,done){
  clearInput();mode='film';filmDone=done;$('#hud').hidden=true;$('#cinematic').hidden=false;const v=$('#story-video');v.pause();v.removeAttribute('src');v.load();v.hidden=true;$('#film-status').textContent='';$('#film-fallback').hidden=false;
  const outro=key.endsWith('Outro');$('#film-title').textContent=outro?'森林，記得你的回應。':'有些希望，正安靜地等待。';$('#film-text').textContent=outro?'你辨認污染、阻止擴散，並為土壤重新生長創造條件。把這份觀察與關心，帶回真實的生活。':'沉睡的種子藏在森林深處。循著溪流，找出土地失去生機的原因。先觀察，再行動。';$('#film-continue').textContent=outro?'回到主畫面 →':'走進種子森林 →';
  if(films[key]){v.src=import.meta.env.BASE_URL+films[key];v.hidden=false;$('#film-fallback').hidden=true;$('#film-continue').textContent='跳過影片 →';v.volume=settings.volume;v.play().catch(()=>$('#film-status').textContent='請按影片上的播放鍵開始，或選擇跳過。');}
}
function finishFilm(){if(!filmDone)return;const done=filmDone;filmDone=null;$('#story-video').pause();$('#story-video').removeAttribute('src');$('#story-video').load();$('#cinematic').hidden=true;clearInput();done();}
$('#story-video').onended=finishFilm;$('#story-video').onerror=()=>{if(!filmDone)return;$('#story-video').hidden=true;$('#film-fallback').hidden=false;$('#film-status').textContent='影片無法載入，可繼續旅程。';};$('#film-continue').onclick=finishFilm;
function updateHud(){const s=stages[stageOf(progress)];$('#objective-title').textContent=s.title;$('#objective-text').textContent=s.text;$('#stage-label').textContent=s.short;$('#percent').textContent=`${progressPercent(progress)}%`;$('#chapter-progress').value=progressPercent(progress);}
function milestone(){persist();updateHud();held=0;}
function workbench(kind,complete){
 openDialog('HANDS IN THE FOREST','<div id="fieldwork-root"></div>');
 disposeBench=mountWorkbench($('#fieldwork-root'),kind,progress.drafts[kind],draft=>{progress.drafts[kind]=draft;persist();},()=>{complete();delete progress.drafts[kind];milestone();closeDialog();forestAudio.play('success');if(kind==='transfer')playFilm('chapter1Outro',showHome);else toast('修復已記錄，回到森林觀察這一區的改變。');},type=>forestAudio.play(type));
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
  $('#awaken-seed').onclick=()=>{progress.ritual=true;milestone();closeDialog();forestAudio.play('success');toast('修復達 80% 並完成喚醒。第二章已解鎖，內容仍在製作中；回到種子完成綜合驗證。');};
 }
 if(stage==='reflect')workbench('transfer',()=>progress.reflection=true);
}
$('#journey').onclick=startJourney;$('#show-chapters').onclick=()=>{$('#home').hidden=true;$('#chapter-view').hidden=false;$('#back-home').focus();};$('#back-home').onclick=showHome;$('#brand').onclick=e=>{e.preventDefault();showHome();};$('#loading-back').onclick=showHome;$('#open-settings').onclick=showSettings;$('#sound-toggle').onclick=()=>setSound(!settings.sound);$('#open-codex').onclick=codex;$('#pause-button').onclick=pause;$('#help-button').onclick=help;
$('#open-about').onclick=()=>openDialog('ABOUT FLORAVERSE','<h2>看見自己的成長，<br>也讓世界回應你的存在。</h2><p>《Bloom Story 尋找失落花園》是一場關於生態修復的沉浸旅程，以親自然設計、注意力恢復理論與柔和的自然意象作為創作方向。</p><p>第一章以土壤生態為主題，透過證據比對、水路解謎、近景清理、土壤與植被配置，練習理解行動與環境之間的關係。</p><p class="muted">目前開放第一章鍵鼠體驗。其他章節、攝影機儀式與正式劇情影片仍在製作中。進度儲存在目前瀏覽器，不會跨裝置同步。</p>');
window.addEventListener('keydown',e=>{
  if(mode!=='playing')return;
  if(e.code==='Escape'){if(!$('#dialog').open){e.preventDefault();pause();}return;}
  if($('#dialog').open)return;
  if(e.code==='KeyH'&&!e.repeat){help();return;}
  if(['KeyW','KeyA','KeyS','KeyD','KeyE','Space'].includes(e.code))e.preventDefault();
  keys.add(e.code);
  if(e.code==='KeyE'&&!e.repeat){const stage=stageOf(progress);const candidates=world?.activeTargets(stage,progress)??[];const t=candidates.find(t=>Math.hypot(t.position.x-world.player.position.x,t.position.z-world.player.position.z)<1.8);if(t&&stages[stage].duration===0)doAction(t,stage);}
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
function tick(now){requestAnimationFrame(tick);const realDt=(now-last)/1000,dt=Math.min(realDt,.05);last=now;if(document.hidden||!world||mode==='menu'||mode==='lost'){forestAudio.update(false,world?.player.position??{x:0,z:0});return;}
  time+=dt;const active=mode==='playing'&&!$('#dialog').open;forestAudio.update(active,world.player.position,progress.soils.length/3);const stage=stageOf(progress);
  try{world.update(dt,time,keys,active,progress,stage,scan,settings.reduced);}catch(error){console.error(error);clearInput();persist();mode='lost';$('#hud').hidden=true;$('#loading').hidden=false;$('#loading-text').textContent='場景繪製中斷。進度已保存，請重新整理頁面後選擇「流暢」畫質。';$('#loading-back').hidden=false;return;}
  frames++;fpsTimer+=realDt;if(fpsTimer>1){fps=Math.round(frames/fpsTimer);frames=0;fpsTimer=0;}
  $('#scan-overlay').hidden=!(scan&&active);
  if(!active){$('#interaction').hidden=true;return;}
  const targets=world.activeTargets(stage,progress);nearest=null;
  for(const t of targets){const distance=Math.hypot(t.position.x-world.player.position.x,t.position.z-world.player.position.z);if(!nearest||distance<nearest.distance)nearest={...t,distance};}
  const id=nearest?nearest.type+nearest.index:'';if(id!==lastTarget){held=0;lastTarget=id;}
  const near=nearest&&nearest.distance<1.8;$('#interaction').hidden=!near;
  if(near){$('#target-label').textContent=nearest.label;$('#interaction-text').textContent=stages[stage].action;
    if(stages[stage].duration>0&&keys.has('KeyE')&&(stage!=='survey'||scan)){
      held+=dt;$('#hold-progress').value=held/stages[stage].duration;if(stage==='isolate')world.rockProgress(nearest,held/stages[stage].duration);
      if(held>=stages[stage].duration)doAction(nearest,stage);
    }else{held=0;$('#hold-progress').value=0;}
  }else held=0;
  if(now-lastHud>150){lastHud=now;$('#wayfinder').hidden=!nearest;
    if(nearest){$('#wayfinder-text').textContent=nearest.label+' · '+nearest.distance.toFixed(1)+' m';$('#wayfinder-arrow').textContent=near?'✧':'↑';$('#wayfinder-arrow').style.transform=`rotate(${world.bearing(nearest.position)}rad)`;}
  }
}
updateMenu();requestAnimationFrame(tick);


// Development-only journey fixture. Removed by Vite from production builds.
if(import.meta.env.DEV&&qaMode){
 const button=document.createElement('button');button.textContent='測試專用：移至下一互動點';button.style.cssText='position:fixed;bottom:65px;right:24px;z-index:50;padding:12px;background:#d4ddae;color:#182b1c;border:0;border-radius:6px';
 button.onclick=()=>{if(!world||mode!=='playing'||$('#dialog').open)return;const t=world.activeTargets(stageOf(progress),progress)[0];if(t){world.teleport([t.position.x,t.position.z]);clearInput();}};
 document.body.append(button);
}
