import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Terrain } from './navigation.js';

export async function createWorld(canvas, settings, onStatus) {
  const base=import.meta.env.BASE_URL;
  const scene=new THREE.Scene(); scene.background=new THREE.Color('#08191b');scene.fog=new THREE.FogExp2('#08191b',.021);
  const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,150);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
  renderer.debug.onShaderError=()=>{throw new Error('場景材質無法在此裝置編譯');};
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
  const reflection=pmrem.fromScene(room,.08);scene.environment=reflection.texture;scene.environmentIntensity=.42;room.dispose();pmrem.dispose();
  const composer=new EffectComposer(renderer); composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.5,.65,.9);composer.addPass(bloom);composer.addPass(new OutputPass());
  const ambient=new THREE.HemisphereLight('#b3d2cb','#293627',1.4);scene.add(ambient);
  const moon=new THREE.DirectionalLight('#c7e8ff',2.2);moon.position.set(-15,30,12);scene.add(moon);
  const warm=new THREE.DirectionalLight('#d6be84',1.1);warm.position.set(15,10,-8);scene.add(warm);
  const draco=new DRACOLoader();draco.setDecoderPath(base+'draco/');draco.setWorkerLimit(2);
  const loader=new GLTFLoader();loader.setDRACOLoader(draco);
  let forest,guardian;
  try {
    onStatus('正在載入森林、守護者與地形…');
    const [f,g,res]=await Promise.all([loader.loadAsync(base+'models/forest_refined.glb'),loader.loadAsync(base+'models/sprite_guardian_refined.glb'),fetch(base+'models/terrain.json')]);
    if(!res.ok)throw new Error('地形資料載入失敗');
    const terrain=new Terrain(await res.json());terrain.connect(0,5);
    if(terrain.reachable.size<100)throw new Error('可行走地形不足');
    forest=f.scene; guardian=g.scene;
    const habitat={value:0},waterTime={value:0};
    const waterMaterial=new THREE.MeshStandardMaterial({color:'#241b36',roughness:.24,metalness:.45,emissive:'#392252',emissiveIntensity:.2});
    function worldSurface(material,fragment,uniforms={}){
      material.onBeforeCompile=shader=>{
        Object.assign(shader.uniforms,uniforms);
        shader.vertexShader='varying vec3 vHabitatPosition;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvHabitatPosition=(modelMatrix*vec4(transformed,1.0)).xyz;');
        shader.fragmentShader='varying vec3 vHabitatPosition;\nuniform float uHabitat;\nuniform float uWaterTime;\nfloat field(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat earthNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(field(i),field(i+vec2(1.,0.)),f.x),mix(field(i+vec2(0.,1.)),field(i+vec2(1.,1.)),f.x),f.y);}\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+fragment);
      };
      material.customProgramCacheKey=()=>fragment;
    }
    worldSurface(waterMaterial,'vec2 wp=vHabitatPosition.xz;float flow=sin(wp.x*.8+sin(wp.y*.7+uWaterTime*.19)*2.+earthNoise(wp*.6)*3.);float vein=pow(1.-abs(flow),14.);float ripples=sin(wp.x*4.+uWaterTime*.7)*sin(wp.y*3.-uWaterTime*.5);diffuseColor.rgb=diffuseColor.rgb*(.75+ripples*.12)+mix(vec3(.24,.045,.43),vec3(.03,.13,.12),uHabitat)*vein;', {uWaterTime:waterTime,uHabitat:habitat});
    const groundMaterial=new THREE.MeshStandardMaterial({color:'#a5a98c',roughness:.97,metalness:0});
    worldSurface(groundMaterial,'float broad=earthNoise(vHabitatPosition.xz*.38);float fine=earthNoise(vHabitatPosition.xz*21.);vec3 dry=mix(vec3(.035,.033,.027),vec3(.09,.084,.055),broad);vec3 living=mix(vec3(.035,.07,.025),vec3(.10,.15,.055),broad);diffuseColor.rgb=mix(dry,living,uHabitat)*(.8+fine*.26);',{uHabitat:habitat});
    forest.traverse(o=>{if(!o.isMesh)return;
      if(o.name.toLowerCase().startsWith('water'))o.material=waterMaterial;
      else if(!o.geometry.attributes.uv)o.material=groundMaterial;
      else for(const m of (Array.isArray(o.material)?o.material:[o.material])) {
        m.roughness=.57;m.metalness=.62;m.envMapIntensity=.8;
        if(/Oxidized|Rust red|Weathered/.test(m.name))worldSurface(m,'float patina=earthNoise(vHabitatPosition.xz*8.+vHabitatPosition.yy*3.);float mottling=earthNoise(vHabitatPosition.xz*25.);diffuseColor.rgb*=.58+patina*.43+mottling*.16;');
      }
    });scene.add(forest);
    const player=new THREE.Group();guardian.scale.setScalar(.65);player.add(guardian);scene.add(player);
    guardian.traverse(o=>{if(!o.isMesh)return;if(o.name==='Sprite_Core'){o.material.color.set('#c8d8a0');o.material.emissive.set('#a6cb68');o.material.emissiveIntensity=.8;o.material.roughness=.25;}else{o.material.color.set('#8a8054');o.material.roughness=.83;o.material.metalness=.08;}});
    // Open leaf envelope around the existing core, matching the supplied character study.
    const cloak=guardian.getObjectByName('Sprite_Cloak');if(cloak)cloak.visible=false;
    const leafProfile=[new THREE.Vector2(.04,-.78),new THREE.Vector2(.23,-.57),new THREE.Vector2(.31,-.26),new THREE.Vector2(.34,.05),new THREE.Vector2(.39,.32),new THREE.Vector2(.29,.63),new THREE.Vector2(.13,.87),new THREE.Vector2(.015,1.09)];
    const leafShell=guardian.getObjectByName('Leaf_Envelope')??new THREE.Mesh(new THREE.LatheGeometry(leafProfile,24,.62,Math.PI*2-1.24),new THREE.MeshStandardMaterial({color:'#8e8052',roughness:.85,side:THREE.DoubleSide}));
    worldSurface(leafShell.material,'float veins=pow(.5+.5*sin(vHabitatPosition.y*18.+sin(vHabitatPosition.x*25.)*1.5),12.);float grain=earthNoise(vHabitatPosition.xz*70.);diffuseColor.rgb*=.74+grain*.28+veins*.14;');if(!leafShell.parent)guardian.add(leafShell);
    const core=guardian.getObjectByName('Sprite_Core');if(core)core.position.y=.22;
    const halo=new THREE.Mesh(new THREE.RingGeometry(.34,.40,40),new THREE.MeshBasicMaterial({color:'#cdf6c6',transparent:true,opacity:.7,side:THREE.DoubleSide}));halo.rotation.x=-Math.PI/2;player.add(halo);halo.position.y=.07;
    const glow=new THREE.PointLight('#a6ffd6',2,5);glow.position.y=1.3;player.add(glow);
    const terrainY=(x,z)=>terrain.height(x,z)??terrain.raw(x,z)??-1.5;
    function at(x,z){const [a,b]=terrain.nearest(x,z);return new THREE.Vector3(a,terrainY(a,b),b);}
    const spawn=at(0,5);player.position.copy(spawn);
    const targets=[];
    function marker(type,index,x,z,label){
      const position=at(x,z),group=new THREE.Group();group.position.copy(position);
      const mat=new THREE.MeshStandardMaterial({color:type==='survey'?'#c1b7ff':'#c5f4c7',emissive:type==='survey'?'#8171db':'#73c79a',emissiveIntensity:1.3,roughness:.35});
      const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.28),mat);crystal.position.y=1.1;group.add(crystal);
      const ring=new THREE.Mesh(new THREE.RingGeometry(.65,.72,40),new THREE.MeshBasicMaterial({color:'#b6efdb',transparent:true,opacity:.6,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.06;group.add(ring);
      if(type==='isolate'){
        const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.65,0),new THREE.MeshStandardMaterial({color:'#6e7d76',roughness:.95}));rock.position.set(.1,.55,.2);group.add(rock);group.userData.rock=rock;
        const track=new THREE.Mesh(new THREE.BoxGeometry(1.6,.04,.12),new THREE.MeshBasicMaterial({color:'#a8dbc7'}));track.position.y=.08;group.add(track);
      }
      scene.add(group);targets.push({type,index,position,group,crystal,ring,label});
    }
    marker('survey',0,7,4,'溪流沉積物');marker('survey',1,10,-4,'土壤中的碎片');marker('survey',2,-7,9,'沉睡的種子');
    marker('isolate',0,8,0,'上游截流石');marker('isolate',1,5,9,'支流截流石');
    marker('soil',0,11,6,'碎片清理區');marker('soil',1,-6,11,'污染土壤區');marker('soil',2,0,13,'棲地恢復區');
    marker('ritual',0,0,8,'生命種子');
    const seed=targets.at(-1);
    // Batched new growth; geometry and materials are shared across all plants.
    const flowerGeo=new THREE.IcosahedronGeometry(.17,0);
    const flowers=new THREE.InstancedMesh(flowerGeo,new THREE.MeshStandardMaterial({color:'#e9d8ae',emissive:'#89ad71',emissiveIntensity:.25}),160);
    const temp=new THREE.Object3D(); const flowerPositions=[];
    let randomSeed=27; const rand=()=>{randomSeed=(randomSeed*16807)%2147483647;return randomSeed/2147483647;};
    for(let i=0;i<160;i++){
      const a=rand()*Math.PI*2,r=1+rand()*11;flowerPositions.push(at(Math.cos(a)*r,8+Math.sin(a)*r));
      temp.position.copy(flowerPositions[i]);temp.scale.setScalar(.001);temp.updateMatrix();flowers.setMatrixAt(i,temp.matrix);
    }scene.add(flowers);flowers.frustumCulled=false;
    const dots=new Float32Array(180*3);for(let i=0;i<dots.length;i+=3){dots[i]=(rand()-.5)*32;dots[i+1]=rand()*7;dots[i+2]=(rand()-.5)*32;}
    const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=32;
    const glowContext=glowCanvas.getContext('2d'),gradient=glowContext.createRadialGradient(16,16,0,16,16,16);
    gradient.addColorStop(0,'rgba(255,255,255,1)');gradient.addColorStop(.25,'rgba(255,255,255,.65)');gradient.addColorStop(1,'rgba(255,255,255,0)');glowContext.fillStyle=gradient;glowContext.fillRect(0,0,32,32);
    const particles=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(dots,3)),new THREE.PointsMaterial({size:.08,color:'#b6e6ba',map:new THREE.CanvasTexture(glowCanvas),transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(particles);
    const pollutedWater=new THREE.Color('#241b36'),clearWater=new THREE.Color('#357a71');
    let yaw=0,pitch=.38,distance=8,targetDistance=8,quality=settings.quality,restoration=0,lastGrowth=-1;
    const velocity=new THREE.Vector3(),move=new THREE.Vector3(),desiredCamera=new THREE.Vector3(),look=new THREE.Vector3();
    const cameraRay=new THREE.Raycaster();cameraRay.far=12;
    const collisionArt=[];forest.traverse(o=>{if(o.isMesh&&!o.name.toLowerCase().startsWith('water'))collisionArt.push(o);});
    let cameraCollisionTimer=0,occlusionDistance=12;
    function resize(){
      const max=quality==='high'?1.5:quality==='low'?.8:1;
      renderer.setPixelRatio(Math.min(devicePixelRatio,max));renderer.setSize(innerWidth,innerHeight);composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(innerWidth,innerHeight);
      camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
    }resize();
    function rotate(dx,dy){yaw-=dx*.004;pitch=THREE.MathUtils.clamp(pitch+dy*.003,.12,.9);}
    function zoom(d){targetDistance=THREE.MathUtils.clamp(targetDistance+d*.008,3,12);}
    function setQuality(q){quality=q;resize();}
    function teleport(pos){const p=at(pos[0],pos[1]);player.position.copy(p);velocity.set(0,0,0);snapCamera();}
    function snapCamera(){look.copy(player.position).y+=1.2;camera.position.set(look.x+Math.sin(yaw)*distance,look.y+distance*Math.sin(pitch),look.z+Math.cos(yaw)*distance);camera.lookAt(look);}
    snapCamera();
    function update(dt,time,input,active,progress,stage,scan,reduced){
      if(active){
        const x=Number(input.has('KeyD'))-Number(input.has('KeyA')),z=Number(input.has('KeyS'))-Number(input.has('KeyW'));
        move.set(x,0,z);if(move.lengthSq())move.normalize().applyAxisAngle(THREE.Object3D.DEFAULT_UP,yaw).multiplyScalar(3.3);
        velocity.lerp(move,1-Math.exp(-9*dt));
        const steps=Math.max(1,Math.ceil(velocity.length()*dt/.08));
        for(let s=0;s<steps;s++){
          let nx=player.position.x+velocity.x*dt/steps,nz=player.position.z+velocity.z*dt/steps;
          if(terrain.canMove(nx,player.position.z,player.position.y))player.position.x=nx;
          if(terrain.canMove(player.position.x,nz,player.position.y))player.position.z=nz;
          player.position.y=terrainY(player.position.x,player.position.z);
        }
        if(velocity.lengthSq()>.1)guardian.rotation.y=THREE.MathUtils.damp(guardian.rotation.y,Math.atan2(velocity.x,velocity.z),10,dt);
      } else velocity.set(0,0,0);
      guardian.position.y=1.1+(reduced?0:Math.sin(time*1.7)*.13);
      distance=THREE.MathUtils.damp(distance,targetDistance,8,dt);
      look.copy(player.position);look.y+=1.25;
      desiredCamera.set(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
      // Only 8 art raycasts/sec; ground following uses O(1) precomputed terrain samples.
      cameraCollisionTimer+=dt;
      if(cameraCollisionTimer>.125){cameraCollisionTimer=0;scene.updateMatrixWorld(true);cameraRay.set(look,desiredCamera);cameraRay.far=distance;const hit=cameraRay.intersectObjects(collisionArt,false).find(h=>h.distance>1);occlusionDistance=hit?Math.max(1.2,hit.distance-.35):12;}
      desiredCamera.multiplyScalar(Math.min(distance,occlusionDistance)).add(look);camera.position.lerp(desiredCamera,1-Math.exp(-12*dt));camera.lookAt(look);
      restoration=THREE.MathUtils.damp(restoration,progress.ritual?1:progress.soils.length*.12,1,dt);
      habitat.value=restoration;waterTime.value=reduced?0:time;
      waterMaterial.color.lerpColors(pollutedWater,clearWater,restoration);
      waterMaterial.emissiveIntensity=.35*(1-restoration);ambient.intensity=1.4+restoration*.6;moon.intensity=2.2+restoration*.8;
      if(Math.abs(lastGrowth-restoration)>.005){
        lastGrowth=restoration;
        flowerPositions.forEach((p,i)=>{temp.position.copy(p);temp.position.y+=restoration*.35;temp.scale.setScalar(Math.max(.001,restoration));temp.updateMatrix();flowers.setMatrixAt(i,temp.matrix);});flowers.instanceMatrix.needsUpdate=true;
      }
      for(const t of targets){
        const done=t.type==='survey'?progress.scanned.includes(t.index):t.type==='isolate'?progress.barriers.includes(t.index):t.type==='soil'?progress.soils.includes(t.index):progress.ritual;
        t.group.visible=(t.type===stage || (t.type==='ritual'&&stage==='reflect'))&&!done;
        if(t.type==='isolate'&&done){t.group.visible=true;t.group.userData.rock.position.x=1;}
        t.crystal.visible=!done||(stage==='reflect'&&t===seed);t.ring.visible=t.crystal.visible;
        if(stage==='reflect'&&t===seed)t.group.visible=true;
        if(t.group.visible){t.crystal.position.y=1.1+(reduced?0:Math.sin(time*1.8+t.index)*.15);if(!reduced)t.crystal.rotation.y=time*.4;}
      }
      if(!reduced){particles.rotation.y=time*.015;particles.position.y=Math.sin(time*.3)*.2;}
      particles.visible=quality!=='low';
      if(quality==='high')composer.render(dt);else renderer.render(scene,camera);
    }
    function activeTargets(stage,p){return targets.filter(t=>(t.type===stage || (stage==='reflect'&&t.type==='ritual')) && !(t.type==='survey'?p.scanned.includes(t.index):t.type==='isolate'?p.barriers.includes(t.index):t.type==='soil'?p.soils.includes(t.index):false));}
    draco.dispose();onStatus('森林已準備好');
    return {renderer,player,terrain,targets,spawn,seed,resize,rotate,zoom,setQuality,teleport,update,activeTargets,
      bearing(p){return Math.atan2(p.x-player.position.x,-(p.z-player.position.z))+yaw;},
      resetCamera(){yaw=0;pitch=.38;targetDistance=8;snapCamera();},
      syncProgress(p){for(const t of targets)if(t.type==='isolate')t.group.userData.rock.position.x=p.barriers.includes(t.index)?1:.1;},
      rockProgress(t,f){if(t?.group.userData.rock)t.group.userData.rock.position.x=.1+f*.9;},
      stats(){return {triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,geometries:renderer.info.memory.geometries};}
    };
  }catch(error){draco.dispose();composer.dispose();renderer.dispose();throw error;}
}
