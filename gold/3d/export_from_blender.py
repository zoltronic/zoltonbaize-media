import bpy, json, os, numpy as np, math
OUT="/Users/zoltbot/Desktop/Premier case study search/Premier Project - 11302024/Blender_Rebuild_v4_CARVED/06_Web_Hero/three"
s=bpy.context.scene
cube=s.objects["WF_BumpCube"]; piv=s.objects["WF_Pivot"]; cam=s.objects["Camera"]
s.frame_start=0; s.frame_end=206; s.render.fps=60
# --- textures ---
def img_to_np(img):
    w,h=img.size; a=np.empty(w*h*4,dtype=np.float32); img.pixels.foreach_get(a); return a.reshape(h,w,4)
def save_png(path,arr):  # arr HxWx3 or HxWx1 float 0..1
    h,w=arr.shape[:2]
    if arr.shape[2]==1: arr=np.repeat(arr,3,axis=2)
    rgba=np.concatenate([arr,np.ones((h,w,1),np.float32)],axis=2)
    im=bpy.data.images.new(os.path.basename(path),w,h,alpha=True); im.pixels.foreach_set(rgba.astype(np.float32).ravel()); im.filepath_raw=path; im.file_format="PNG"; im.save(); bpy.data.images.remove(im)
def downscale(a,n):  # box filter to n x n (integer factor)
    h,w=a.shape[:2]; f=h//n; return a[:n*f,:n*f].reshape(n,f,n,f,-1).mean(axis=(1,3))
H=img_to_np(bpy.data.images["WF_height_R110.png"])[:,:,0:1]   # height 0..1 (letters dish down)
L=img_to_np(bpy.data.images["WF_lettermask.png"])[:,:,0:1]
H2=downscale(H,2048)[:,:,0]; L2=downscale(L,2048)
# normal map from height: Blender Bump Distance 0.44 on a 2m cube face -> height units per texel
DIST=0.44; texel=2.0/2048.0
gx=(np.roll(H2,-1,axis=1)-np.roll(H2,1,axis=1))/(2*texel)*DIST
gy=(np.roll(H2,-1,axis=0)-np.roll(H2,1,axis=0))/(2*texel)*DIST
# image rows: Blender pixel row 0 is the bottom, so +y in the array is +v (OpenGL convention, what three.js expects)
nx=-gx; ny=-gy; nz=np.ones_like(H2)
nl=np.sqrt(nx*nx+ny*ny+nz*nz); nx/=nl; ny/=nl; nz/=nl
N=np.stack([nx*0.5+0.5, ny*0.5+0.5, nz*0.5+0.5],axis=2)
save_png(os.path.join(OUT,"wf_normal_2k.png"),N.astype(np.float32))
save_png(os.path.join(OUT,"wf_letters_2k.png"),np.clip(L2,0,1).astype(np.float32))
# HDRI (LDR png used by the render): save a copy
env=bpy.data.images["Roof_blurred.png.001"]; E=img_to_np(env)[:,:,0:3]
save_png(os.path.join(OUT,"env_roof_1k.png"),E.astype(np.float32))
# --- material / camera timeline ---
nt=cube.data.materials[0].node_tree
rows=[]
for f in range(0,207):
    s.frame_set(f)
    rows.append([f, round(nt.nodes["GainWhite"].outputs[0].default_value,4), round(nt.nodes["Emission.001"].inputs["Strength"].default_value,4)])
mat={"frames":rows,"columns":["frame","gainWhite","whiteStrength"],"base":{"color":[0.905,0.628,0.297],"metallic":1.0,"roughness":0.12,"coat":0.3,"coatRoughness":0.02,"anisotropy":0.15,"specular":0.95},"bumpDistance":DIST,"emissionSteady":1.15,"flatLockup":{"start":208,"note":"not used in the web cut"}}
json.dump(mat,open(os.path.join(OUT,"material.json"),"w"))
lights=[]
for o in s.objects:
    if o.type=="LIGHT" and not o.hide_render:
        d=o.data; mw=o.matrix_world
        lights.append({"name":o.name,"type":d.type,"shape":getattr(d,"shape",None),"size":getattr(d,"size",None),"size_y":getattr(d,"size_y",None) if getattr(d,"shape",None)=="RECTANGLE" else getattr(d,"size",None),"energy":d.energy,"color":list(d.color),"matrix_world":[list(r) for r in mw]})
json.dump({"lights":lights,"world":{"env":"env_roof_1k.png","strength":0.85},"camera":{"lens":50.0,"sensor":36.0,"fit":"HORIZONTAL","lens_portrait":82.0,"shift_y_landscape":-0.03,"shift_y_portrait":-0.142},"fps":60,"frames":[0,206],"landing_frame":138,"bloom":{"threshold":0.75,"strength":0.45,"size":7}},open(os.path.join(OUT,"scene.json"),"w"))
# --- glTF: cube + pivot + camera with baked animation; simple material so the exporter does not mangle the node graph ---
simple=bpy.data.materials.new("WF_Gold_Simple"); simple.use_nodes=True
bsdf=simple.node_tree.nodes["Principled BSDF"]; bsdf.inputs["Base Color"].default_value=(0.905,0.628,0.297,1); bsdf.inputs["Metallic"].default_value=1.0; bsdf.inputs["Roughness"].default_value=0.12
cube.data.materials[0]=simple
# strip the keyed camera shift so the export is neutral
ad=cam.data.animation_data
if ad and ad.action:
    try:
        for fc in list(ad.action.fcurves): ad.action.fcurves.remove(fc)
    except Exception:
        for layer in ad.action.layers:
            for st in layer.strips:
                try:
                    cb=st.channelbag(ad.action_slot)
                    for fc in list(cb.fcurves): cb.fcurves.remove(fc)
                except Exception: pass
cam.data.shift_y=0.0
for o in s.objects: o.select_set(False)
for o in (cube,piv,cam): o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,"wf_cube.glb"),export_format="GLB",use_selection=True,export_apply=True,export_animations=True,export_frame_range=True,export_frame_step=1,export_force_sampling=True,export_animation_mode="SCENE",export_cameras=True,export_lights=False,export_materials="EXPORT",export_image_format="NONE",export_yup=True,export_texcoords=True,export_normals=True,export_skins=False,export_morph=False)
print("EXPORT_DONE")
