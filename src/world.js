import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Terrain } from './navigation.js';
import { addUnderstory } from './ground-cover.js';
import { createTaskSite } from './task-sites.js';
import { addForestAtmosphere } from './forest-atmosphere.js';
import { mapLayout } from './map-config.js';
import {breatheGuardian} from './guardian-life.js';
import {addLotus} from './lotus.js';
import {addLivingWorld} from './living-world.js';

export async function createWorld(canvas, settings, onStatus) {
  const base=import.meta.env.BASE_URL;
  const scene=new THREE.Scene(); scene.background=new THREE.Color('#08191b');scene.fog=new THREE.FogExp2('#273c36',.027);
  const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,150);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.debug.onShaderError=()=>{throw new Error('場景材質無法在此裝置編譯');};
  renderer.shadowMap.type=THREE.PCFShadowMap;renderer.info.autoReset=false;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
  const reflection=pmrem.fromScene(room,.08);scene.environment=reflection.texture;scene.environmentIntensity=.42;room.dispose();pmrem.dispose();
  const composer=new EffectComposer(renderer); composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.5,.65,.9);composer.addPass(bloom);composer.addPass(new OutputPass());
  const ambient=new THREE.HemisphereLight('#b3d2cb','#293627',1.4);scene.add(ambient);
  const moon=new THREE.DirectionalLight('#c7e8ff',2.2);moon.position.set(-15,30,12);moon.castShadow=true;moon.shadow.mapSize.set(1024,1024);Object.assign(moon.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:80});moon.shadow.bias=-.0008;scene.add(moon);
  const warm=new THREE.DirectionalLight('#d6be84',1.1);warm.position.set(15,10,-8);scene.add(warm);
  const draco=new DRACOLoader();draco.setDecoderPath(base+'draco/');draco.setWorkerLimit(2);
  const loader=new GLTFLoader();loader.setDRACOLoader(draco);
  let forest,guardian;
  try {
    onStatus('正在載入森林、守護者與地形…');
    const [f,g,res,collisionRes,v]=await Promise.all([loader.loadAsync(base+'models/forest_ground_v8.glb'),loader.loadAsync(base+'models/sprite_guardian_refined.glb'),fetch(base+'models/terrain_v8.json'),fetch(base+'models/collisions_v8.json'),loader.loadAsync(base+'models/forest_vegetation_v8.glb')]);
    if(!res.ok||!collisionRes.ok)throw new Error('地形或碰撞資料載入失敗');
    const terrain=new Terrain(await res.json(),await collisionRes.json());terrain.connect(...mapLayout.spawn);
    if(terrain.reachable.size<100)throw new Error('可行走地形不足');
    forest=f.scene;forest.add(v.scene); guardian=g.scene;
    const habitat={value:0},waterTime={value:0},waterHealth={value:0};
    const seasonalMaterials=[];
    const repairs=[0,1,2].map(()=>({value:new THREE.Vector4(0,0,0,0)}));
    const waterMaterial=new THREE.MeshStandardMaterial({color:'#5e503b',roughness:.29,metalness:.03,emissive:'#241b12',emissiveIntensity:0,envMapIntensity:.12});
    function worldSurface(material,fragment,uniforms={}){
      material.onBeforeCompile=shader=>{
        Object.assign(shader.uniforms,uniforms);
        shader.vertexShader='varying vec3 vHabitatPosition;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvHabitatPosition=(modelMatrix*vec4(transformed,1.0)).xyz;');
        shader.fragmentShader='uniform vec4 uRepair0;\nuniform vec4 uRepair1;\nuniform vec4 uRepair2;\nvarying vec3 vHabitatPosition;\nuniform float uHabitat;\nuniform float uWaterTime;\nfloat field(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat earthNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(field(i),field(i+vec2(1.,0.)),f.x),mix(field(i+vec2(0.,1.)),field(i+vec2(1.,1.)),f.x),f.y);}\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+fragment);
      };
      material.customProgramCacheKey=()=>fragment;
    }
    const shoreCanvas=document.createElement('canvas');shoreCanvas.width=shoreCanvas.height=terrain.size;const shoreContext=shoreCanvas.getContext('2d'),shoreImage=shoreContext.createImageData(terrain.size,terrain.size);
    terrain.heights.forEach((h,i)=>{const v=h==null?0:Math.max(0,Math.min(1,(h+3.05)/.65));shoreImage.data.set([v*255,v*255,v*255,255],i*4);});shoreContext.putImageData(shoreImage,0,0);const shoreMap=new THREE.CanvasTexture(shoreCanvas);shoreMap.flipY=false;
    worldSurface(waterMaterial,'vec2 wp=vHabitatPosition.xz;float drift=earthNoise(wp*.37+vec2(uWaterTime*.024,-uWaterTime*.015));float wave=sin(wp.x*1.3+wp.y*.7-uWaterTime*.7)+sin(wp.y*1.9-wp.x*.6+uWaterTime*.5);vec3 murky=mix(vec3(.015,.025,.024),vec3(.035,.052,.039),drift);vec3 clean=mix(vec3(.025,.095,.095),vec3(.055,.16,.15),drift);diffuseColor.rgb=mix(murky,clean,uHabitat);float bank=texture2D(uShore,(wp+36.)/72.).r;float foam=smoothstep(.55,.65,bank)*(1.-smoothstep(.72,.85,bank))*(.55+.45*sin(wp.x*5.+wp.y*4.+uWaterTime*.65));diffuseColor.rgb+=mix(vec3(.045,.033,.015),vec3(.10,.13,.10),uHabitat)*foam;diffuseColor.rgb+=vec3(.006,.009,.008)*pow(.5+.5*sin(wp.x*9.+wp.y*3.+uWaterTime*.7+earthNoise(wp*.5)*3.),16.);',{uWaterTime:waterTime,uHabitat:waterHealth,uShore:{value:shoreMap}});
    const shoreCompile=waterMaterial.onBeforeCompile;waterMaterial.onBeforeCompile=shader=>{shoreCompile(shader);shader.fragmentShader='uniform sampler2D uShore;\n'+shader.fragmentShader;};
    const compileWater=waterMaterial.onBeforeCompile;
    waterMaterial.onBeforeCompile=shader=>{compileWater(shader);shader.vertexShader='uniform float uWaterTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed+=normalize(normal)*(sin(position.x*.9+uWaterTime*.8)+cos(position.y*1.1-uWaterTime*.7))*.035;');shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=normalize(normal+vec3((sin(vHabitatPosition.x*2.3+vHabitatPosition.z*1.7+uWaterTime*.9)+sin(vHabitatPosition.x*1.2-vHabitatPosition.z*2.4+uWaterTime*.65))*.012,0.,(cos(vHabitatPosition.z*1.9+vHabitatPosition.x*1.4-uWaterTime*.7)+sin(vHabitatPosition.z*2.8-vHabitatPosition.x*1.2+uWaterTime*.45))*.012));');};
    const groundMaterial=new THREE.MeshStandardMaterial({color:'#a5a98c',roughness:.97,metalness:0});
    worldSurface(groundMaterial,'float heal=max(uHabitat*.25,max(uRepair0.w*(1.-smoothstep(1.,7.,distance(vHabitatPosition.xz,uRepair0.xy))),max(uRepair1.w*(1.-smoothstep(1.,7.,distance(vHabitatPosition.xz,uRepair1.xy))),uRepair2.w*(1.-smoothstep(1.,7.,distance(vHabitatPosition.xz,uRepair2.xy))))));float broad=earthNoise(vHabitatPosition.xz*.38);float fine=earthNoise(vHabitatPosition.xz*21.);vec3 dry=mix(vec3(.032,.014,.006),vec3(.08,.035,.014),broad);vec3 living=mix(vec3(.035,.07,.025),vec3(.10,.15,.055),broad);diffuseColor.rgb=mix(dry,living,heal)*(.8+fine*.26);',{uHabitat:habitat,uRepair0:repairs[0],uRepair1:repairs[1],uRepair2:repairs[2]});
    const waterMeshes=[];
    forest.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;
      if(o.name.toLowerCase().startsWith('water')){o.material=waterMaterial;o.castShadow=false;waterMeshes.push(o);}
      else if(!o.geometry.attributes.uv)o.material=groundMaterial;
      else for(const m of (Array.isArray(o.material)?o.material:[o.material])) {
        m.roughness=.94;m.metalness=.03;m.envMapIntensity=.25;seasonalMaterials.push({material:m,original:m.color.clone()});
        if(/Oxidized|Rust red|Weathered/.test(m.name))worldSurface(m,'float patina=earthNoise(vHabitatPosition.xz*8.+vHabitatPosition.yy*3.);float mottling=earthNoise(vHabitatPosition.xz*25.);diffuseColor.rgb*=.58+patina*.43+mottling*.16;');
      }
    });scene.add(forest);
    const player=new THREE.Group();guardian.scale.setScalar(.65);player.add(guardian);scene.add(player);
    guardian.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;if(o.name==='Sprite_Core'){o.material.color.set('#49622b');o.material.emissive.set('#8ca453');o.material.emissiveIntensity=.18;o.material.roughness=.6;}else if(/Hand/.test(o.name)){o.material.color.set('#9eaf72');o.material.emissiveIntensity=.18;}else if(!/Sprout/.test(o.name)){o.material.roughness=.83;o.material.metalness=.08;}});
    // Open leaf envelope around the existing core, matching the supplied character study.
    const cloak=guardian.getObjectByName('Sprite_Cloak');if(cloak)cloak.visible=false;
    const leafProfile=[new THREE.Vector2(.04,-.78),new THREE.Vector2(.23,-.57),new THREE.Vector2(.31,-.26),new THREE.Vector2(.34,.05),new THREE.Vector2(.39,.32),new THREE.Vector2(.29,.63),new THREE.Vector2(.13,.87),new THREE.Vector2(.015,1.09)];
    const leafShell=guardian.getObjectByName('Leaf_Envelope')??new THREE.Mesh(new THREE.LatheGeometry(leafProfile,24,.62,Math.PI*2-1.24),new THREE.MeshStandardMaterial({color:'#8e8052',roughness:.85,side:THREE.DoubleSide}));
    worldSurface(leafShell.material,'float veins=pow(.5+.5*sin(vHabitatPosition.y*18.+sin(vHabitatPosition.x*25.)*1.5),12.);float grain=earthNoise(vHabitatPosition.xz*70.);diffuseColor.rgb*=.74+grain*.28+veins*.14;');if(!leafShell.parent)guardian.add(leafShell);
    ['Hand_L','Hand_R','Orb_Hand_L','Orb_Hand_R'].forEach(n=>{const h=guardian.getObjectByName(n);if(h)h.visible=false;});
    const hands=[-1,1].map(side=>{const hand=new THREE.Mesh(new THREE.SphereGeometry(.105,24,16),new THREE.MeshStandardMaterial({color:'#c3cd88',roughness:.45,emissive:'#82944a',emissiveIntensity:.2}));hand.position.set(side*.28,.12,.36);guardian.add(hand);return hand;});
    const life=breatheGuardian(guardian,hands);
    const core=guardian.getObjectByName('Sprite_Core');if(core)core.position.y=.22;
    const halo=new THREE.Mesh(new THREE.RingGeometry(.34,.40,40),new THREE.MeshBasicMaterial({color:'#cdf6c6',transparent:true,opacity:.7,side:THREE.DoubleSide}));halo.rotation.x=-Math.PI/2;player.add(halo);halo.position.y=.07;halo.visible=false;
    const glow=new THREE.PointLight('#d1e8ad',.5,3);glow.position.y=1.3;player.add(glow);
    const terrainY=(x,z)=>terrain.height(x,z)??terrain.raw(x,z)??-1.5;
    function at(x,z){const [a,b]=terrain.nearest(x,z);return new THREE.Vector3(a,terrainY(a,b),b);}
    const spawn=at(...mapLayout.spawn);player.position.copy(spawn);
    const touchRay=new THREE.Raycaster(),ripples=[];
    const rippleGeometry=new THREE.RingGeometry(.12,.16,40);
    function touchWater(x,y){
      touchRay.setFromCamera(new THREE.Vector2(x,y),camera);const hit=touchRay.intersectObjects(waterMeshes,false)[0];
      if(!hit||hit.point.distanceTo(player.position)>4)return false;
      const ring=new THREE.Mesh(rippleGeometry,new THREE.MeshBasicMaterial({color:'#bed7cf',transparent:true,opacity:.65,depthWrite:false,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.copy(hit.point);ring.position.y+=.055;scene.add(ring);ripples.push({ring,age:0});return true;
    }
    const targets=[];
    function marker(type,index,x,z,label){
      const position=at(x,z),site=createTaskSite(type,index,label);site.group.position.copy(position);scene.add(site.group);
      const interactionPosition=position.clone().add(new THREE.Vector3(.7,.2,0));const t={...site,type,index,position,interactionPosition,crystal:site.focus,label};targets.push(t);
      if(site.rock&&index===0){t.obstacle={x:position.x+.9,z:position.z+.1,radius:site.radius};terrain.obstacles.push(t.obstacle);}
    }
    for(const t of mapLayout.sites)marker(t.type,t.index,t.x,t.z,t.label);
    const seed=targets.at(-1);
    const living=addLivingWorld(scene,terrain,targets);const npcs=living.npcs;
    const lotus=addLotus(scene,terrain);
    let guideTarget=null,hintTarget=null;
    // Task focus is optional and never draws a route through the forest.
    function guideTo(target){guideTarget=target?targets.find(t=>t.type===target.type&&t.index===target.index):null;return 0;}
    let randomSeed=27;const rand=()=>{randomSeed=(randomSeed*16807)%2147483647;return randomSeed/2147483647;};
    const atmosphere=addForestAtmosphere(scene,rand,groundMaterial,terrain);
    const growth=addUnderstory(scene,terrain,targets.filter(t=>t.type==='soil').map(t=>t.position),rand,targets);
    const dots=new Float32Array(180*3);for(let i=0;i<dots.length;i+=3){dots[i]=(rand()-.5)*32;dots[i+1]=rand()*7;dots[i+2]=(rand()-.5)*32;}
    const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=32;
    const glowContext=glowCanvas.getContext('2d'),gradient=glowContext.createRadialGradient(16,16,0,16,16,16);
    gradient.addColorStop(0,'rgba(255,255,255,1)');gradient.addColorStop(.25,'rgba(255,255,255,.65)');gradient.addColorStop(1,'rgba(255,255,255,0)');glowContext.fillStyle=gradient;glowContext.fillRect(0,0,32,32);
    const particles=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(dots,3)),new THREE.PointsMaterial({size:.08,color:'#b6e6ba',map:new THREE.CanvasTexture(glowCanvas),transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(particles);
    const localDots=new Float32Array(16*3),localColors=new Float32Array(16*3);
    const sparks=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(localDots,3)).setAttribute('color',new THREE.BufferAttribute(localColors,3)),new THREE.PointsMaterial({size:.055,map:particles.material.map,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));player.add(sparks);
    const pollutedWater=new THREE.Color('#241b36'),clearWater=new THREE.Color('#357a71'),darkFog=new THREE.Color('#3c3a32'),livingFog=new THREE.Color('#7b8d6a');
    let presentation=false,pointerX=0,pointerY=0,jumpHeight=0,jumpVelocity=0,jumpHeld=false;
    let yaw=0,pitch=.38,distance=8,targetDistance=8,quality=settings.quality,restoration=0;
    const velocity=new THREE.Vector3(),move=new THREE.Vector3(),desiredCamera=new THREE.Vector3(),look=new THREE.Vector3();
    const cameraRay=new THREE.Raycaster();cameraRay.far=12;
    const collisionArt=[];forest.traverse(o=>{if(o.isMesh&&!o.name.toLowerCase().startsWith('water'))collisionArt.push(o);});
    collisionArt.push(...lotus.collisionMeshes);let cameraCollisionTimer=0,occlusionDistance=12;
    function resize(){
      renderer.shadowMap.enabled=quality==='high';
      const max=quality==='high'?1.75:quality==='low'?1:1.5;
      renderer.setPixelRatio(Math.min(devicePixelRatio,max));renderer.setSize(innerWidth,innerHeight);composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(innerWidth,innerHeight);
      camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
    }resize();
    function rotate(dx,dy){cameraCollisionTimer=1;yaw-=dx*.004;pitch=THREE.MathUtils.clamp(pitch+dy*.003,-.12,1.05);}
    function zoom(d){cameraCollisionTimer=1;targetDistance=THREE.MathUtils.clamp(targetDistance+d*.008,2.5,11);}
    function setQuality(q){quality=q;resize();}
    function teleport(pos){const p=at(pos[0],pos[1]);player.position.copy(p);velocity.set(0,0,0);snapCamera();}
    function snapCamera(){look.copy(player.position).y+=1.2;camera.position.set(look.x+Math.sin(yaw)*distance,look.y+distance*Math.sin(pitch),look.z+Math.cos(yaw)*distance);camera.lookAt(look);}
    snapCamera();
    function update(dt,time,input,active,progress,stage,scan,reduced){
      if(active){
        const x=Number(input.has('KeyD')||input.has('ArrowRight'))-Number(input.has('KeyA')||input.has('ArrowLeft')),z=Number(input.has('KeyS')||input.has('ArrowDown'))-Number(input.has('KeyW')||input.has('ArrowUp'));
        move.set(x,0,z);if(move.lengthSq())move.normalize().applyAxisAngle(THREE.Object3D.DEFAULT_UP,yaw).multiplyScalar(settings.speed??3.3);
        velocity.lerp(move,1-Math.exp(-9*dt));
        const steps=Math.max(1,Math.ceil(velocity.length()*dt/.08));
        for(let s=0;s<steps;s++){
          let nx=player.position.x+velocity.x*dt/steps,nz=player.position.z+velocity.z*dt/steps;
          if(terrain.canMove(nx,player.position.z,player.position.y))player.position.x=nx;
          if(terrain.canMove(player.position.x,nz,player.position.y))player.position.z=nz;
          player.position.y=terrainY(player.position.x,player.position.z);
        }
        if(velocity.lengthSq()>.1)guardian.rotation.y+=Math.atan2(Math.sin(Math.atan2(velocity.x,velocity.z)-guardian.rotation.y),Math.cos(Math.atan2(velocity.x,velocity.z)-guardian.rotation.y))*(1-Math.exp(-10*dt));
      } else velocity.set(0,0,0);
      if(active&&input.has('Space')&&!jumpHeld&&jumpHeight===0)jumpVelocity=2.25;
      jumpHeld=active&&input.has('Space');if(jumpVelocity||jumpHeight){jumpVelocity-=6.5*dt;jumpHeight=Math.max(0,jumpHeight+jumpVelocity*dt);if(!jumpHeight)jumpVelocity=0;}
      life.update(time,dt,velocity,reduced,jumpHeight);
      for(let i=ripples.length-1;i>=0;i--){const r=ripples[i];r.age+=dt;r.ring.scale.setScalar(1+r.age*4);r.ring.material.opacity=Math.max(0,.65-r.age*.6);if(r.age>1.1){scene.remove(r.ring);r.ring.material.dispose();ripples.splice(i,1);}}
      distance=THREE.MathUtils.damp(distance,targetDistance,8,dt);
      look.copy(player.position);look.y+=1.25;
      desiredCamera.set(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
      // Only 8 art raycasts/sec; ground following uses O(1) precomputed terrain samples.
      cameraCollisionTimer+=dt;
      if(cameraCollisionTimer>.125){cameraCollisionTimer=0;scene.updateMatrixWorld(true);cameraRay.set(look,desiredCamera);cameraRay.far=distance;const hit=cameraRay.intersectObjects(collisionArt,false).find(h=>h.distance>1);occlusionDistance=hit?Math.max(1.2,hit.distance-.35):12;}
      desiredCamera.multiplyScalar(Math.min(distance,occlusionDistance)).add(look);
      const outer=Math.hypot(desiredCamera.x,desiredCamera.z);if(outer>36){desiredCamera.x*=36/outer;desiredCamera.z*=36/outer;}
      const floor=terrain.raw(desiredCamera.x,desiredCamera.z);if(floor!==null&&floor!==undefined)desiredCamera.y=Math.max(desiredCamera.y,floor+.35);
      camera.position.lerp(desiredCamera,1-Math.exp(-12*dt));camera.lookAt(look);
      restoration=THREE.MathUtils.damp(restoration,progress.ritual?1:progress.barriers.length*.06+progress.soils.length*.18,1,dt);
      habitat.value=restoration;waterTime.value=reduced?0:time;
      waterMaterial.color.lerpColors(pollutedWater,clearWater,restoration);
      waterMaterial.emissiveIntensity=0;waterHealth.value=THREE.MathUtils.damp(waterHealth.value,(progress.barriers.length===2?.2:0)+(progress.soils.includes(0)?.35:0)+(progress.soils.includes(1)?.25:0)+(progress.ritual?.2:0),.65,dt);ambient.intensity=.85+restoration*.85;moon.intensity=1.3-restoration*.3;warm.intensity=.25+restoration*2.8;seasonalMaterials.forEach(({material,original})=>material.color.copy(original).multiply(new THREE.Color().lerpColors(new THREE.Color('#95826b'),new THREE.Color(material.name.includes('leaf')?'#8fbd79':'#b9cca1'),restoration)));particles.material.opacity=.12+restoration*.53;scene.fog.color.lerpColors(darkFog,livingFog,restoration*.5);scene.background.copy(scene.fog.color);
      repairs.forEach((r,i)=>{const t=targets.find(t=>t.type==='soil'&&t.index===i);r.value.set(t.position.x,t.position.z,0,THREE.MathUtils.damp(r.value.w,progress.soils.includes(i)?1:0,1.8,dt));});
      atmosphere.update(restoration,quality);lotus.update(time,restoration,reduced);
      growth.update(repairs.map(r=>r.value.w),progress.ritual,quality,time,reduced);living.update(time,restoration,progress,reduced);
      const available=new Set(activeTargets(stage,progress));
      for(const t of targets){
        const done=t.type==='survey'?progress.scanned.includes(t.index)&&!(progress.scanned.length===3&&!progress.evidence):t.type==='isolate'?progress.barriers.includes(t.index):t.type==='soil'?progress.soils.includes(t.index):progress.ritual;
        t.group.visible=!(t.type==='isolate'&&t.index===1);
        t.ring.visible=(t.type===stage || (t.type==='ritual'&&stage==='reflect'))&&!done;
        if(t.type==='soil'&&t.index!==progress.soils.length)t.ring.visible=false;
        if(t.type==='survey'&&progress.scanned.length===3&&!progress.evidence)t.ring.visible=t.index===2;
        if(t.type==='isolate'&&done&&t.obstacle){t.rock.position.x=1.3;t.obstacle.x=t.position.x+1.3;}
        const siteDistance=Math.hypot(player.position.x-t.interactionPosition.x,player.position.z-t.interactionPosition.z);
        t.sign.visible=(((scan&&t===guideTarget&&siteDistance<12)||t===hintTarget)||(available.has(t)&&siteDistance<7))&&siteDistance>2.1;
        t.ring.visible=(t.ring.visible&&scan)||t===hintTarget;
        if(t.type==='soil'&&t.index===0&&done)t.objects.forEach(o=>o.visible=false);
        if(t.type==='soil'&&t.index===2)t.plantMaterial.color.set(done?'#718b49':'#6c5034');
        t.crystal.visible=!(t.type==='soil'&&t.index===0&&done);t.ring.material.opacity=t===guideTarget?.5:.12;
        if(stage==='reflect'&&t===seed)t.group.visible=!(t.type==='isolate'&&t.index===1);
        if(t.type==='ritual'){t.crystal.position.y=.45+(reduced?0:Math.sin(time*1.8)*.045);if(!reduced)t.crystal.rotation.y=time*.25;}
      }
      if(!reduced){particles.rotation.y=time*.015;particles.position.y=Math.sin(time*.3)*.2;}
      for(let i=0;i<16;i++){const t=reduced?i:time,angle=i*2.4+t*.35;localDots[i*3]=Math.cos(angle)*(.45+i%3*.18);localDots[i*3+1]=.8+(i%5)*.23+Math.sin(t*.7+i)*.1;localDots[i*3+2]=Math.sin(angle)*.65;const bright=reduced?.65:.3+.7*(.5+.5*Math.sin(t*1.4+i*3));localColors.set([bright*.85,bright,bright*.45],i*3);}sparks.geometry.attributes.position.needsUpdate=true;sparks.geometry.attributes.color.needsUpdate=true;
      particles.visible=quality!=='low';
      if(presentation==='pause'){camera.position.copy(player.position).add(new THREE.Vector3(3+(reduced?0:Math.sin(time*.06)*.3),2.6,4));camera.lookAt(player.position.clone().add(new THREE.Vector3(0,1.2,0)));}else if(presentation){camera.position.set(16+pointerX*1.3+(reduced?0:Math.sin(time*.04)*.25),12+pointerY*.7,24);camera.lookAt(0,-1,2);}
      renderer.info.reset();if(quality==='high')composer.render(dt);else renderer.render(scene,camera);
    }
    function activeTargets(stage,p){
      if(stage==='survey'&&p.scanned.length===3&&!p.evidence)return [targets.find(t=>t.type==='survey'&&t.index===2)];
      return targets.filter(t=>!(t.type==='isolate'&&t.index===1)&&(t.type===stage||(stage==='reflect'&&t.type==='ritual'))&&(t.type!=='soil'||t.index===p.soils.length)&&!(t.type==='survey'?p.scanned.includes(t.index):t.type==='isolate'?p.barriers.includes(t.index):false));
    }
    draco.dispose();onStatus('森林已準備好');
    return {renderer,player,terrain,targets,npcs,spawn,seed,resize,rotate,zoom,setQuality,teleport,update,activeTargets,touchWater,guideTo,
      hint(target){hintTarget=target?targets.find(t=>t.type===target.type&&t.index===target.index):null;},
      present(enabled,x=0,y=0){presentation=enabled;pointerX=x;pointerY=y;},
      bearing(p){return Math.atan2(p.x-player.position.x,-(p.z-player.position.z))+yaw;},
      resetCamera(){yaw=0;pitch=.38;targetDistance=8;snapCamera();},
      syncProgress(p){for(const t of targets){if(t.type==='isolate'&&t.obstacle){t.rock.position.x=p.barriers.includes(t.index)?1.3:.9;t.obstacle.x=t.position.x+t.rock.position.x;}if(t.type==='soil'&&t.index===0)t.objects.forEach(o=>o.visible=!p.soils.includes(0));}},
      rockProgress(t,f){if(t?.rock&&t.obstacle){t.rock.position.x=.9+f*.4;t.obstacle.x=t.position.x+t.rock.position.x;}},
      stats(){return {triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,geometries:renderer.info.memory.geometries};}
    };
  }catch(error){draco.dispose();composer.dispose();renderer.dispose();throw error;}
}

