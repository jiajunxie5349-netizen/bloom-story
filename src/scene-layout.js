import {keepChapterOnePlant} from './chapter-one-density.js';
// Data only: shared by the game and the removable local authoring tools.
export function validateLayout(layout, manifest, terrain) {
  if (layout?.version !== 1 || layout.assetSHA256 !== manifest.assetSHA256 || !layout.objects || Array.isArray(layout.objects)) throw Error('場景版本與模型不相符');
  const ids=Object.keys(manifest.objects);
  if(Object.keys(layout.objects).length!==ids.length)throw Error('配置必須包含所有植株');
  for(const id of ids){
    const t=layout.objects[id];
    if(!t || !Array.isArray(t.position)||t.position.length!==3||!t.position.every(Number.isFinite)||!Number.isFinite(t.yaw)||!Number.isFinite(t.scale)||t.scale<.6||t.scale>1.6||Math.abs(t.yaw)>Math.PI*2)throw Error('物件調整數值不合法：'+id);
    const [x,y,z]=t.position,h=terrain.height(x,z);
    if(Math.hypot(x,z)>34||h==null||h< -2.3||Math.abs(y-h)>.06)throw Error('植株必須落在可用陸地並貼合地面：'+id);
  }
  return layout;
}
export function applyLayout(root, layout) {
  const objects=new Map();root.traverse(o=>{if(o.userData.sceneId)objects.set(o.userData.sceneId,o);});
  for(const [id,t] of Object.entries(layout.objects)){
    const o=objects.get(id);if(!o)throw Error('模型缺少完整植株：'+id);
    o.visible=keepChapterOnePlant(id);if(!o.visible)o.traverse(child=>child.visible=false);o.position.fromArray(t.position);o.rotation.set(0,t.yaw,0);o.scale.setScalar(t.scale);
  }
  root.updateMatrixWorld(true);return objects;
}
// Detect accidental pose edits without a corresponding collision rebuild.
export function layoutSignature(layout){
 const text=JSON.stringify(Object.keys(layout.objects).sort().map(id=>{const t=layout.objects[id];return [id,t.position,t.yaw,t.scale];}));
 let hash=2166136261;for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}return (hash>>>0).toString(16);
}
