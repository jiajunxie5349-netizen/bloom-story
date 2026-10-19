// Only imported by Vite's local configuration. Never imported by the game.
import {readFile,writeFile,mkdir,rename,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {validateLayout,layoutSignature} from '../src/scene-layout.js';
import {Terrain} from '../src/navigation.js';
import {mapLayout} from '../src/map-config.js';
export function authoringPlugin(){
 let busy=false;
 return {name:'local-scene-authoring',configureServer(server){
  server.middlewares.use('/__scene/save',async(req,res)=>{
   const send=(code,data)=>{res.statusCode=code;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(data));};
   const origin='http://'+req.headers.host;
   if(req.method!=='POST'||!/^127\.0\.0\.1:\d+$/.test(req.headers.host??'')||req.headers.origin!==origin||req.headers['x-bloom-editor']!=='1'||!req.headers['content-type']?.startsWith('application/json'))return send(403,{error:'僅限本機開發者畫面儲存'});
   if(busy)return send(409,{error:'上一份配置仍在檢查，請稍候'});
   busy=true;
   try{
    let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>200000)throw Error('配置檔太大');}
    const root=server.config.root,model=resolve(root,'public/models');
    const manifest=JSON.parse(await readFile(resolve(model,'scene-manifest.json'),'utf8')),data=JSON.parse(await readFile(resolve(model,'terrain_v12.json'),'utf8'));
    const request=JSON.parse(body),layout=validateLayout(request,manifest,new Terrain(data));
    // Whitelist persisted fields. The browser cannot supply its own collision mask.
    const clean={version:1,assetSHA256:manifest.assetSHA256,objects:Object.fromEntries(Object.entries(layout.objects).map(([id,t])=>[id,{position:t.position,yaw:t.yaw,scale:t.scale}]))};
    const directory=resolve(root,'.scene-drafts');await mkdir(directory,{recursive:true});const stamp=Date.now(),input=resolve(directory,stamp+'-request.json'),output=resolve(directory,stamp+'-baked.json');await writeFile(input,JSON.stringify(clean));
    const blender=process.env.BLOOM_BLENDER??'C:/Program Files/Blender Foundation/Blender 5.0/blender.exe';
    const blend=process.env.BLOOM_SCENE_BLEND??resolve(root,'authoring/scene-source.blend');
    await new Promise((ok,fail)=>{let log='';const p=spawn(blender,['--background','--python',resolve(root,'authoring/bake_layout.py'),'--',blend,input,resolve(model,'terrain_v12.json'),output],{windowsHide:true});const timer=setTimeout(()=>{p.kill();fail(Error('碰撞重建逾時，原正式配置仍保留'));},120000);p.stdout.on('data',b=>{log=(log+b).slice(-2000);});p.stderr.on('data',b=>{log=(log+b).slice(-2000);});p.on('error',e=>{clearTimeout(timer);fail(Error('找不到本機 Blender 或場景來源：'+e.message));});p.on('close',code=>{clearTimeout(timer);code===0?ok():fail(Error('碰撞重建失敗，請確認場景來源檔可讀取'));});});
    const baked=JSON.parse(await readFile(output,'utf8'));baked.layoutSignature=layoutSignature(baked);if(!Array.isArray(baked.blocked)||!baked.blocked.every(i=>Number.isInteger(i)&&i>=0&&i<data.heights.length))throw Error('碰撞資料不完整');
    const terrain=new Terrain(data,baked);if(!terrain.canMove(...mapLayout.spawn,terrain.height(...mapLayout.spawn)))throw Error('植株擋住玩家安全起點；原配置未變更');terrain.connect(...mapLayout.spawn);
    for(const site of mapLayout.sites){const path=terrain.pathTo(...mapLayout.spawn,site.x,site.z),last=path.at(-1);if(!last||Math.hypot(last[0]-site.x,last[2]-site.z)>1.7)throw Error('配置擋住任務通道：'+site.label);}
    let dry=0;for(let i=0;i<data.heights.length;i++){const [x,z]=terrain.coordinates(i);if(terrain.canMove(x,z,data.heights[i]))dry++;}
    if(terrain.safe.size/dry<.99)throw Error('植株切斷了森林通路；原正式配置未變更');
    const target=resolve(model,'scene-layout.json');await copyFile(target,resolve(directory,stamp+'-previous.json'));const temporary=target+'.tmp';await writeFile(temporary,JSON.stringify(baked));await rename(temporary,target);
    send(200,{ok:true,plants:Object.keys(clean.objects).length,reachable:terrain.safe.size,message:'已儲存到遊戲來源配置；需發布網站後，其他玩家才會看到。'});
   }catch(e){send(400,{error:e.message});}finally{busy=false;}
  });
 }};
}
