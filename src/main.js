import './style.css';
import { template } from './ui.js';
import { freshProgress,loadProgress,saveProgress,progressPercent,stageOf,canUnlock } from './progress.js';
import { stages,chapters,observations,soilQuestions,films } from './content.js';
document.querySelector('#app').innerHTML=template;
const $=s=>document.querySelector(s);
let storage;try{storage=window.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw Error('unavailable');}};}
let progress=loadProgress(storage),settings={quality:'balanced',volume:.25,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,sound:false};
try{const s=JSON.parse(storage.getItem('floraverse.settings'));if(['low','balanced','high'].includes(s?.quality))settings.quality=s.quality;if(Number.isFinite(s?.volume))settings.volume=Math.max(0,Math.min(1,s.volume));if(typeof s?.reduced==='boolean')settings.reduced=s.reduced;}catch{}
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
function closeDialog(){if($('#dialog').open)$('#dialog').close();clearInput();}
function showHome(){mode='menu';clearInput();closeDialog();$('#menu').hidden=false;$('#hud').hidden=true;$('#cinematic').hidden=true;$('#loading').hidden=true;$('#home').hidden=false;$('#chapter-view').hidden=true;$('#webgl-canvas').classList.remove('active');updateMenu();$('#journey').focus();}
function openDialog(kicker,html){clearInput();$('#dialog-kicker').textContent=kicker;$('#dialog-content').innerHTML=html;$('#dialog').showModal();}
$('#dialog-close').onclick=closeDialog;$('#dialog').addEventListener('cancel',e=>{e.preventDefault();closeDialog();});
function help(){openDialog('HOW TO EXPLORE',`<h2>慢慢走，森林會等你。</h2><p>WASD 移動，左鍵拖曳旋轉視角，滾輪調整距離。角色會沿可行走地面前進，水池與陡坡無法通行。</p><ul class="help-list"><li><kbd>右鍵</kbd> 按住開啟生態透視鏡。</li><li><kbd>E</kbd> 靠近微光標記互動；觀測、推石與儀式需要按住。</li><li><kbd>Esc</kbd> 暫停、返回主畫面或重新定位。</li><li><kbd>H</kbd> 隨時查看操作說明。</li></ul><p class="muted">跟隨方向提示尋找當前任務。不計時、不扣分；選擇後會提供解釋，也可以重新嘗試。這個版本使用鍵鼠模擬儀式，無需攝影機。</p><button id="help-ok" class="primary wide">準備好了 →</button>`);$('#help-ok').onclick=closeDialog;}
let audio=null,gain=null;
async function setSound(value){
  settings.sound=value;
  if(value){try{if(!audio){audio=new AudioContext();gain=audio.createGain();gain.connect(audio.destination);const noise=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate);const data=noise.getChannelData(0);let prev=0;for(let i=0;i<data.length;i++){prev=(prev+(Math.random()*2-1)*.015)/1.015;data[i]=prev;}const src=audio.createBufferSource();src.buffer=noise;src.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=650;src.connect(filter);filter.connect(gain);src.start();}await audio.resume();}catch{settings.sound=false;toast('此裝置暫時無法播放環境音。');}}
  if(gain)gain.gain.setTargetAtTime(settings.sound?settings.volume*.35:0,audio.currentTime,.3);
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
function observe(t){progress.scanned.push(t.index);milestone();openDialog('ECOLOGICAL OBSERVATION',`<h2>${observations[t.index].name}</h2><p>${observations[t.index].finding}</p><p class="muted">已記錄 ${progress.scanned.length} / 3 處觀測。${progress.scanned.length===3?'觀察顯示污染沿溪流擴散；接下來先隔離污染支流。':'沿著微光，繼續尋找其他證據。'}</p><button class="primary wide" id="note-ok">收進生態圖鑑 →</button>`);$('#note-ok').onclick=closeDialog;}
function soilPuzzle(t){const q=soilQuestions[t.index];openDialog('RESTORE THE SOIL',`<h2>${q.title}</h2><p>${q.text}</p><div class="choices">${q.choices.map((c,i)=>`<button class="glass" data-choice="${i}"><span>0${i+1}</span>${c}</button>`).join('')}</div><p id="answer-feedback" role="status"></p><button class="primary wide" id="soil-ok" hidden>完成修復規劃 →</button>`);
  document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{const correct=Number(b.dataset.choice)===q.correct;$('#answer-feedback').textContent=correct?q.why:'再想想：先阻止污染擴散，避免把問題轉移到別處；治理後還需要持續監測。';b.classList.toggle('incorrect',!correct);if(correct){document.querySelectorAll('[data-choice]').forEach(el=>el.disabled=true);b.classList.add('correct');$('#soil-ok').hidden=false;}});
  $('#soil-ok').onclick=()=>{progress.soils.push(t.index);milestone();closeDialog();toast(progress.soils.length===3?'修復規劃完成，回到生命種子旁吧。':'這片土地已完成修復規劃。真實復育還需要時間。');};
}
function reflection(){openDialog('BRING IT INTO YOUR WORLD','<h2>如果回到真實的森林…</h2><p>你發現溪流附近的土地可能受到污染，哪個修復順序比較合適？</p><div class="choices"><button class="glass" id="reflection-wrong">直接種花，讓土地看起來恢復生機</button><button class="glass" id="reflection-right">觀察檢測 → 控制污染源 → 適當治理 → 持續監測</button></div><p id="reflection-feedback" role="status"></p><button id="reflection-finish" class="primary wide" hidden>帶著希望，完成旅程 →</button>');
  $('#reflection-wrong').onclick=()=>$('#reflection-feedback').textContent='花朵盛開不代表污染已消失。先確認原因，才能讓修復有意義。';$('#reflection-right').onclick=()=>{$('#reflection-feedback').textContent='是的。生態修復是一段持續的照顧，而不只是讓景色變綠。';$('#reflection-finish').hidden=false;};$('#reflection-finish').onclick=()=>{progress.reflection=true;milestone();closeDialog();playFilm('chapter1Outro',showHome);};
}
function doAction(t,stage){
  if(stage==='survey')observe(t);
  if(stage==='isolate'){world.rockProgress(t,1);progress.barriers.push(t.index);milestone();toast(progress.barriers.length===2?'兩處污染支流已隔離。接下來處理土壤中留下的污染。':'截流石已就位。污染還沒有消失，繼續隔離另一處支流。');}
  if(stage==='soil')soilPuzzle(t);
  if(stage==='ritual'){progress.ritual=true;milestone();openDialog('A SEED OF HOPE','<h2>一顆種子，重新開始。</h2><p>森林的瞬間復甦，是對你行動的藝術化回應。真實的土地需要時間、適當治理與持續監測。</p><p>修復達 80%，第二章已解鎖，內容仍在製作中。完成生態回顧，可讓本章達到 100%。</p><button id="ritual-ok" class="primary wide">留在森林，完成回顧 →</button>');$('#ritual-ok').onclick=closeDialog;}
  if(stage==='reflect')reflection();
}
$('#journey').onclick=startJourney;$('#show-chapters').onclick=()=>{$('#home').hidden=true;$('#chapter-view').hidden=false;$('#back-home').focus();};$('#back-home').onclick=showHome;$('#brand').onclick=e=>{e.preventDefault();showHome();};$('#loading-back').onclick=showHome;$('#open-settings').onclick=showSettings;$('#sound-toggle').onclick=()=>setSound(!settings.sound);$('#open-codex').onclick=codex;$('#pause-button').onclick=pause;$('#help-button').onclick=help;
$('#open-about').onclick=()=>openDialog('ABOUT FLORAVERSE','<h2>看見自己的成長，<br>也讓世界回應你的存在。</h2><p>《Bloom Story 尋找失落花園》是一場關於生態修復的沉浸旅程，以親自然設計、注意力恢復理論與柔和的自然意象作為創作方向。</p><p>第一章以土壤生態為主題，透過觀察、隔離污染與修復選擇，練習理解行動與環境之間的關係。</p><p class="muted">目前開放第一章鍵鼠體驗。其他章節、攝影機儀式與正式劇情影片仍在製作中。進度儲存在目前瀏覽器，不會跨裝置同步。</p>');
window.addEventListener('keydown',e=>{
  if(mode!=='playing')return;
  if(e.code==='Escape'){if(!$('#dialog').open){e.preventDefault();pause();}return;}
  if($('#dialog').open)return;
  if(e.code==='KeyH'&&!e.repeat){help();return;}
  if(['KeyW','KeyA','KeyS','KeyD','KeyE','Space'].includes(e.code))e.preventDefault();
  keys.add(e.code);
  if(e.code==='KeyE'&&!e.repeat&&nearest&&nearest.distance<1.8){const stage=stageOf(progress);if(stages[stage].duration===0)doAction(nearest,stage);}
});
window.addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='KeyE'){held=0;if(nearest?.type==='isolate'&&!progress.barriers.includes(nearest.index))world?.rockProgress(nearest,0);}});
const canvas=$('#webgl-canvas');canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{if(mode!=='playing'||$('#dialog').open)return;if(e.button===0){drag=true;canvas.setPointerCapture(e.pointerId);}if(e.button===2)scan=true;});
window.addEventListener('pointerup',e=>{if(e.button===0)drag=false;if(e.button===2){scan=false;held=0;}});
canvas.addEventListener('pointermove',e=>{if(drag&&mode==='playing'&&!$('#dialog').open)world?.rotate(e.movementX,e.movementY);});
canvas.addEventListener('wheel',e=>{if(mode==='playing'&&!$('#dialog').open){e.preventDefault();world?.zoom(e.deltaY);}},{passive:false});
window.addEventListener('blur',()=>{clearInput();if(mode==='playing'&&!$('#dialog').open)pause();});
document.addEventListener('visibilitychange',()=>{last=performance.now();if(document.hidden){clearInput();if(mode==='playing'&&!$('#dialog').open)pause();}});
window.addEventListener('resize',()=>world?.resize());window.addEventListener('pagehide',()=>{if(world)persist();});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();clearInput();toast('顯示卡連線中斷。進度已儲存，請重新整理頁面。');persist();mode='lost';});
function tick(now){requestAnimationFrame(tick);const realDt=(now-last)/1000,dt=Math.min(realDt,.05);last=now;if(document.hidden||!world||mode==='menu'||mode==='lost')return;
  time+=dt;const active=mode==='playing'&&!$('#dialog').open;const stage=stageOf(progress);
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

