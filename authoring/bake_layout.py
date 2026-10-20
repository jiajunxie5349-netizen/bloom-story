"""Local authoring only. Derive collision from the exact transformed visible plant meshes."""
import bpy,json,sys,math
from pathlib import Path
from mathutils import Vector,Matrix
from mathutils.bvhtree import BVHTree
args=sys.argv[sys.argv.index('--')+1:]
source,request,terrain_file,output=map(Path,args)
bpy.ops.wm.open_mainfile(filepath=str(source))
layout=json.loads(request.read_text(encoding='utf-8'));terrain=json.loads(terrain_file.read_text(encoding='utf-8'))
roots={o.get('sceneId'):o for o in bpy.context.scene.objects if o.get('sceneId')}
assert set(roots)==set(layout['objects']),'Plant identifiers do not match the source model'
for key,t in layout['objects'].items():
 x,y,z=t['position'];o=roots[key];o.location=(x,-z,y);o.rotation_euler=(0,0,-t['yaw']);o.scale=(t['scale'],)*3
bpy.context.view_layer.update();vs=[];fs=[]
for key,root in roots.items():
 if key in layout.get('excludedPlantIds',[]):continue
 for o in root.children_recursive:
  if o.type!='MESH':continue
  offset=len(vs);vs.extend(o.matrix_world@v.co for v in o.data.vertices);fs.extend(tuple(offset+i for i in p.vertices) for p in o.data.polygons)
bvh=BVHTree.FromPolygons(vs,fs);blocked=[]
for i,h in enumerate(terrain['heights']):
 if h is None or h< -2.45:continue
 x=terrain['min']+i%terrain['size']*terrain['step'];z=terrain['min']+i//terrain['size']*terrain['step']
 if any(bvh.find_nearest(Vector((x,-z,h+y)),.25)[0] is not None for y in [.12,.30,.50,.70,.90,1.1,1.3,1.5]):blocked.append(i)
layout['blocked']=blocked;layout['source']='forest_vegetation_v18.glb; exact visible mesh BVH; radius 0.25; body samples 0.12–1.5';layout['meshSHA256']=layout['assetSHA256']
output.write_text(json.dumps(layout,separators=(',',':')),encoding='utf-8')
print('BAKED',len(roots),'plants;',len(blocked),'blocked terrain cells')
