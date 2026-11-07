import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js/+esm';


// Zolton avatar — About page draft. Mounts into <div id="zolton-avatar"></div>.
const BASE=new URL('./',import.meta.url).href;
const HOST=document.getElementById('zolton-avatar')||(()=>{const d=document.createElement('div');d.id='zolton-avatar';document.body.prepend(d);return d;})();
if(!document.querySelector('link[data-zav-font]')){const l=document.createElement('link');l.rel='stylesheet';l.dataset.zavFont='1';l.href='https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=JetBrains+Mono:wght@500&display=swap';document.head.appendChild(l);}
{const st=document.createElement('style');st.textContent='#zolton-avatar{\n  --sky-top:#2f74d6; --sky-low:#a9d4ff; --ink:#0d1b33; --glass:rgba(255,255,255,.62);\n  --glass-line:rgba(255,255,255,.85); --accent:#ff6a1f; --chip:#e9f2ff; --chip-ink:#12305e;\n  --font-ui:"Sora",system-ui,-apple-system,"Segoe UI",sans-serif; --font-mono:"JetBrains Mono",ui-monospace,Menlo,monospace;\n  color-scheme:light;\n}\n#zolton-avatar{position:relative;width:100%;height:100vh;min-height:620px;overflow:hidden;background:transparent;color:var(--ink);font-family:var(--font-ui)}\n#zolton-avatar #stage{position:absolute;inset:0;display:block;width:100%;height:100%;touch-action:none;background:transparent}\n#zolton-avatar .badge{position:absolute;top:calc(12px + env(safe-area-inset-top,0px));left:max(16px,env(safe-area-inset-left,0px));\n  display:flex;align-items:center;gap:10px;padding:8px 14px;border-radius:999px;background:var(--glass);\n  border:1px solid var(--glass-line);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);font-size:13px;font-weight:600}\n#zolton-avatar .badge .dot{width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px rgba(255,106,31,.25)}\n#zolton-avatar .badge .mono{font-family:var(--font-mono);font-weight:500;font-size:11px;opacity:.7}\n#zolton-avatar .dock{position:absolute;left:0;right:0;bottom:0;padding-bottom:calc(14px + env(safe-area-inset-bottom,0px));\n  padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));\n  display:flex;justify-content:center;pointer-events:none}\n#zolton-avatar .panel{pointer-events:auto;max-width:980px;width:100%;display:flex;flex-direction:column;gap:10px;padding:12px 14px;border-radius:18px;\n  background:var(--glass);border:1px solid var(--glass-line);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);\n  box-shadow:0 10px 30px rgba(13,27,51,.15)}\n#zolton-avatar .row{display:flex;flex-wrap:wrap;gap:6px;align-items:center}\n#zolton-avatar .label{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;opacity:.6;margin-right:4px;min-width:74px}\n#zolton-avatar button{font:600 12.5px var(--font-ui);color:var(--chip-ink);background:var(--chip);border:1px solid rgba(18,48,94,.12);\n  border-radius:999px;padding:7px 12px;cursor:pointer;transition:transform .12s ease,background .12s ease}\n#zolton-avatar button:hover{background:#fff}\n#zolton-avatar button:active{transform:scale(.96)}\n#zolton-avatar button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\n#zolton-avatar button.on{background:var(--ink);color:#fff;border-color:var(--ink)}\n#zolton-avatar button.go{background:var(--accent);color:#fff;border-color:var(--accent)}\n#zolton-avatar .hint{font-size:11.5px;opacity:.7}\n#zolton-avatar .cmset{font-size:11.5px;opacity:.75;width:100%;line-height:1.35}\n#zolton-avatar .hidebtn{position:absolute;top:calc(12px + env(safe-area-inset-top,0px));right:max(16px,env(safe-area-inset-right,0px));background:var(--glass);border-color:var(--glass-line);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}\n#zolton-avatar .panel{max-height:calc(100vh - 90px);overflow-y:auto}\n@media (max-width:899px){#zolton-avatar .panel{max-height:40vh}}\n\n@media (min-width:900px){#zolton-avatar .dock{left:auto;right:0;top:calc(112px + env(safe-area-inset-top,0px));bottom:0;width:340px;align-items:flex-start;padding-left:0}\n#zolton-avatar .panel{max-height:100%;gap:12px}\n#zolton-avatar .row{gap:5px}\n#zolton-avatar .label{width:100%;min-width:0}}\n#zolton-avatar #loader{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none}\n#zolton-avatar #loader .box{display:flex;flex-direction:column;gap:8px;align-items:center;font-size:13px;font-weight:600}\n#zolton-avatar #loader .bar{width:220px;height:6px;border-radius:3px;background:rgba(255,255,255,.5);overflow:hidden}\n#zolton-avatar #loader .bar i{display:block;height:100%;width:0;background:var(--accent);transition:width .2s}\n#zolton-avatar [hidden]{display:none!important}\n@media (max-width:560px){#zolton-avatar .label{min-width:0;width:100%}\n#zolton-avatar .panel{padding:10px}}\n\n@media (prefers-reduced-motion:reduce){#zolton-avatar button{transition:none}}\n\n#zolton-avatar .panel .row{background:rgba(255,255,255,.55);border:1px solid rgba(18,48,94,.10);border-radius:14px;padding:10px 10px 11px;gap:6px}\n#zolton-avatar .panel .label{width:100%;min-width:0;font-size:11px;opacity:.75;margin:0 0 2px}\n#zolton-avatar button{margin:0;line-height:1.2;text-transform:none;letter-spacing:0}\n#zolton-avatar canvas{display:block}\n#zolton-avatar *{box-sizing:border-box}\n\n#zolton-avatar .badge,#zolton-avatar .hidebtn{top:96px}\n@media (min-width:900px){#zolton-avatar .dock{top:146px;bottom:72px}}\n@media (max-width:899px){#zolton-avatar .dock{padding-bottom:72px}}\n';document.head.appendChild(st);}
HOST.innerHTML='\n\n<canvas id="stage" aria-label="3D preview of Zolton the jet-pack pilot"></canvas>\n<div class="badge"><span class="dot"></span>Zolton &middot; About (draft) <span class="mono" id="state">loading</span></div>\n<div id="loader"><div class="box"><span id="loadtxt">Loading Zolton… 0%</span><div class="bar"><i id="loadbar"></i></div></div></div>\n<button id="b-hide" class="hidebtn">Hide controls</button>\n<div class="dock"><div class="panel" id="panel">\n  <div class="row"><span class="label">Action</span>\n    <button class="go" id="b-intro">Play intro</button>\n    <button id="b-fly">Fly in</button>\n    <button id="b-yoga">Yoga on a cloud</button>\n    <button id="b-wave">Wave</button>\n    <button id="b-talk">Talk</button>\n    <button id="b-turn">Turn around</button>\n    <button id="b-react">Surprise me</button>\n  </div>\n  <div class="row"><span class="label">Camera</span>\n    <button id="c-full" class="on">Full body</button>\n    <button id="c-face">Face close-up</button>\n  </div>\n  <div class="row"><span class="label">Style</span>\n    <button id="s-real">Realistic</button>\n    <button id="s-cartoon" class="on">Cartoon</button>\n    <button id="s-spider">Spider-Verse</button>\n  </div>\n  <div class="row"><span class="label">Lighting</span>\n    <button id="li-day" class="on">Day</button>\n    <button id="li-golden">Golden hour</button>\n    <button id="li-night">Night</button>\n    <button id="li-studio">Studio</button>\n  </div>\n  <div class="row"><span class="label">Gear</span>\n    <button id="g-hat">Cap</button>\n    <button id="g-goggles">HUD glasses</button>\n    <button id="g-scarf" class="on">Scarf</button>\n  </div>\n  <div class="row" id="faces"><span class="label">Expression</span></div>\n  <div class="row" id="zav-comments" hidden><span class="label">Comments</span>\n    <button id="b-comment" hidden>Comment mode: Off</button>\n    <span class="cmset" id="cmset"></span>\n  </div>\n  <div class="hint" id="hint">Move your mouse (or drag on a phone): his eyes, head and body follow you. Click him for a reaction.</div>\n</div></div>\n\n';
const PRESETS={"neutral":{},"happy":{"shape":{"Smile":2.2,"BrowUp":0.39},"blink":0.3},"bigSmile":{"shape":{"Smile":3.6,"JawOpen":0.16,"BrowUp":0.6},"blink":0.35},"laughing":{"shape":{"Smile":3.6,"JawOpen":0.75,"BrowUp":1.3},"blink":0.7},"wink":{"shape":{"Smirk_L":2.2,"BrowUp_R":0.78},"blinkL":1.0},"serious":{"shape":{"BrowAngry":0.75,"Frown":0.78},"blink":0.1},"determined":{"shape":{"BrowAngry":2.1,"Frown":0.65,"Smirk_R":0.6},"blink":0.25},"angry":{"shape":{"BrowAngry":3.6,"Frown":2.08,"JawOpen":0.12},"blink":0.3},"surprised":{"shape":{"BrowUp":2.86,"JawOpen":0.55,"Pucker":0.8},"blink":0.0},"skeptical":{"shape":{"BrowUp_L":2.6,"BrowAngry_R":2.1,"Smirk_R":1.2},"blinkR":0.25,"lookX":0.5},"sad":{"shape":{"BrowSad":3.08,"Frown":2.6},"blink":0.2,"lookY":-0.5},"zen":{"shape":{"Smile":1.4,"BrowUp":0.25},"blink":0.22},"happyOpen":{"shape":{"Smile":2.2,"BrowUp":0.39},"blink":0}};
const LABELS={happyOpen:'Happy (eyes open)',zen:'Zen',neutral:'Neutral',happy:'Happy',bigSmile:'Big smile',laughing:'Laughing',wink:'Wink',serious:'Serious',determined:'Determined',angry:'Angry',surprised:'Surprised',skeptical:'Skeptical',sad:'Sad'};

const canvas=document.getElementById('stage');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,premultipliedAlpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=0.92;
let look='cartoon', lightName='day'; const backings=[]; const swaps=[], inks=[], misprints=[];
// ink outline: back-face hull pushed out in screen space by a fixed pixel width; follows skinning + face morphs
const INK_RES={value:new THREE.Vector2(1,1)};
function inkMaterial(px,col=0x0b0814,off=[0,0]){
  const m=new THREE.MeshLambertMaterial({color:0x000000,emissive:col,side:THREE.BackSide});
  m.onBeforeCompile=(sh)=>{ sh.uniforms.uRes=INK_RES; sh.uniforms.uPx={value:px}; sh.uniforms.uOff={value:new THREE.Vector2(off[0],off[1])};
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform vec2 uRes; uniform float uPx; uniform vec2 uOff;')
    .replace('#include <project_vertex>',`#include <project_vertex>
      vec3 nV=normalize(normalMatrix*objectNormal);
      vec2 nc=(projectionMatrix*vec4(nV,0.0)).xy*uRes; float ln=length(nc);
      if(ln>1e-5) gl_Position.xy+=(nc/ln)*(uPx*2.0/uRes)*gl_Position.w;
      gl_Position.xy+=uOff*2.0/uRes*gl_Position.w;
      gl_Position.z+=0.0004*gl_Position.w;`); };
  m.customProgramCacheKey=()=>'ink'+px+'_'+off.join('_'); return m;
}
const scene=new THREE.Scene();
// sky gradient background
let skyTex=null; // built below from skyCanvas

const camera=new THREE.PerspectiveCamera(30,1,0.05,400);
camera.position.set(0.25,1.2,6.4); const camTarget=new THREE.Vector3(0,1.02,0);
scene.add(new THREE.HemisphereLight(0xfff6ec,0x7d7468,1.0));
const key=new THREE.DirectionalLight(0xfff3e6,1.7); key.position.set(-2.5,4,5); scene.add(key);
const rim=new THREE.DirectionalLight(0xd8ecff,1.0); rim.position.set(3,2.5,-4); scene.add(rim);
const hemi=scene.children.find(o=>o.isHemisphereLight);

// ---- comic look: stepped toon shading, halftone shadow dots, rim light, ink outlines, banded chrome ----
const TOON_RAMP=(()=>{const d=new Uint8Array([125,195,255]);const t=new THREE.DataTexture(d,3,1,THREE.RedFormat);t.minFilter=t.magFilter=THREE.NearestFilter;t.needsUpdate=true;return t;})();
const HALFTONE={size:{value:4.5*Math.min(devicePixelRatio,2)}};
function comicPatch(m,{dots=true,rimAmt=0.22,dotStart=0.95}={}){
  m.onBeforeCompile=(sh)=>{
    sh.uniforms.uDot=HALFTONE.size;
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uDot;')
    .replace('#include <opaque_fragment>',`
      float baseL=max(dot(diffuseColor.rgb,vec3(.299,.587,.114)),0.03);
      float shade=dot(outgoingLight,vec3(.299,.587,.114))/baseL;
      ${dots?`
      vec2 p=gl_FragCoord.xy/uDot; p=mat2(.7071,-.7071,.7071,.7071)*p;
      float dd=length(fract(p)-.5);
      float amt=clamp((${dotStart.toFixed(2)}-shade)/0.6,0.0,1.0);
      float rr=(0.16+0.34*amt)*step(0.1,amt); float dotm=1.0-smoothstep(rr-0.05,rr,dd);
      outgoingLight=mix(outgoingLight,outgoingLight*vec3(.42,.36,.62),dotm*0.85);`:''}
      vec3 vdir=normalize(vViewPosition);
      float fr=1.0-clamp(dot(normal,vdir),0.0,1.0);
      outgoingLight+=diffuseColor.rgb*step(0.72,fr)*${rimAmt.toFixed(2)}*vec3(1.0,.92,1.25);
      #include <opaque_fragment>`);
  };
  m.customProgramCacheKey=()=>'comic'+dots+rimAmt+dotStart;
}
function matcapTex(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
  g.fillStyle='#2b2f3d';g.beginPath();g.arc(128,128,128,0,7);g.fill();
  const bands=[['#4b5368',118],['#8792ac',104],['#c9d6ef',84],['#eef5ff',56]];
  bands.forEach(([col,r],i)=>{g.fillStyle=col;g.beginPath();g.ellipse(118-i*6,108-i*8,r,r*0.92,-0.5,0,7);g.fill();});
  g.fillStyle='#ffffff';g.beginPath();g.ellipse(86,70,30,16,-0.7,0,7);g.fill();
  g.fillStyle='#ffb27a';g.beginPath();g.ellipse(170,206,40,12,0.2,0,7);g.fill(); // warm bounce from below
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const CHROME_CAP=matcapTex();
function toComic(m,variant='spider'){ if(m.isMeshBasicMaterial) return m;
  if(m===eyeMat||!m.isMeshStandardMaterial) return m;
  let c;
  if(/JetpackChrome|BuckleMetal|Material\.001/.test(m.name)){
    c=new THREE.MeshMatcapMaterial({matcap:CHROME_CAP,map:m.map,color:m.name==='Material.001'?new THREE.Color(1.25,1.25,1.25):m.color.clone().multiplyScalar(m.map?1.15:3.2),side:m.side});
    c.userData.outlineParameters={thickness:0.0048,color:[0.04,0.03,0.07]};
  } else {
    c=new THREE.MeshToonMaterial({color:m.color,map:m.map,gradientMap:TOON_RAMP,emissive:m.emissive,emissiveMap:m.emissiveMap,emissiveIntensity:m.emissiveIntensity,
      transparent:m.transparent,opacity:m.opacity,depthWrite:m.depthWrite,alphaTest:m.alphaTest,side:m.side});
    const inner=/Teeth|MouthInside|Tongue/.test(m.name);
    const sp=variant==='spider';
    comicPatch(c,{dots:sp&&!inner&&m.name!=='PalmRing'&&m.name!=='Cloud',rimAmt:inner?0:(sp?0.22:0.12)});
    c.userData.outlineParameters={thickness:/Teeth|MouthInside|Tongue|PalmRing/.test(m.name)?0.0:(/StrapBlack|Buckle/.test(m.name)?0.0034:0.0048),color:[0.04,0.03,0.07],visible:!inner};
  }
  c.name=m.name; c.toneMapped=false; return c;
}
const LIGHTS={
  day:   {sky:['#2f74d6','#7fb8f5','#cfe6ff'],hemi:[0xfff6ec,0x7d7468,1.0],key:[0xfff3e6,1.7,[-2.5,4,5]],rim:[0xd8ecff,1.0,[3,2.5,-4]],exp:0.92,cloud:[0xffffff,0.85,true],stars:false,glow:1},
  golden:{sky:['#3d4f96','#e58c68','#ffd59c'],hemi:[0xffd9b0,0x6b4a3a,0.75],key:[0xffad60,2.3,[-4,1.5,3.5]],rim:[0xff8656,1.7,[4,2,-3]],exp:0.95,cloud:[0xffc9a8,0.85,true],stars:false,glow:1.4},
  night: {sky:['#040a1c','#10254d','#27426f'],hemi:[0x6d84c8,0x0d1020,0.42],key:[0xa8bfff,0.85,[-3,4,2]],rim:[0x7fd0ff,1.5,[3,3,-4]],exp:1.0,cloud:[0x52648f,0.5,true],stars:true,glow:6},
  studio:{sky:['#dfe3ea','#c9ced7','#b9bfca'],hemi:[0xffffff,0x8a8f99,1.1],key:[0xffffff,2.0,[-2,3,4]],rim:[0xffffff,1.6,[2.5,3,-3]],exp:0.9,cloud:[0xffffff,0,false],stars:false,glow:1}
};
const skyCanvas=document.createElement('canvas'); skyCanvas.width=2; skyCanvas.height=256;
function setSky(cols){const g=skyCanvas.getContext('2d');const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,cols[0]);gr.addColorStop(.65,cols[1]);gr.addColorStop(1,cols[2]);g.fillStyle=gr;g.fillRect(0,0,2,256);skyTex.needsUpdate=true;}
function applyEnv(){
  const P=LIGHTS[lightName], toon=look!=='real';
  hemi.color.set(P.hemi[0]); hemi.groundColor.set(P.hemi[1]); hemi.intensity=P.hemi[2]*(toon?1.15:1);
  key.color.set(P.key[0]); key.intensity=P.key[1]*(toon?1.25:1); key.position.set(...P.key[2]);
  rim.color.set(P.rim[0]); rim.intensity=P.rim[1]*(toon?0.6:1); rim.position.set(...P.rim[2]);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = P.exp;
  stars.visible=false; state.glow=P.glow;
  for(const c of clouds){ c.visible=false; c.material.color.set(P.cloud[0]); c.material.map = CLOUD_SOFT; c.material.opacity = P.cloud[1]; c.material.needsUpdate=true; }
  for(const c of yogaCloud.children){ c.material.color.set(P.cloud[2]?P.cloud[0]:0xffffff); c.material.opacity=c.userData.baseOpacity*(lightName==='night'?0.75:1); }
}
function setStyle(l){ look=l;
  for(const s of swaps) s.mesh.material = l==='real'?s.real:(l==='cartoon'?s.cartoon:s.spider);
  for(const k of inks) k.visible = l!=='real';
  for(const [o,b] of backings) b.material=o.material;
  for(const k of misprints) k.visible = l==='spider';
  applyEnv();
  for(const id of ['real','cartoon','spider']) document.getElementById('s-'+id).classList.toggle('on',id===l);
}
function setLight(n){ lightName=n; applyEnv(); for(const id of Object.keys(LIGHTS)) document.getElementById('li-'+id).classList.toggle('on',id===n); }
const setLook=setStyle;
for(const id of ['real','cartoon','spider']) document.getElementById('s-'+id).onclick=()=>setStyle(id);
for(const id of Object.keys(LIGHTS)) document.getElementById('li-'+id).onclick=()=>setLight(id);
// night stars
skyTex=new THREE.CanvasTexture(skyCanvas); skyTex.colorSpace=THREE.SRGBColorSpace; scene.background=null; renderer.setClearColor(0x000000,0);
const stars=(()=>{const n=500,a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=(Math.random()-.5)*260;a[i*3+1]=-10+Math.random()*90;a[i*3+2]=-120-Math.random()*40;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(a,3));
  const p=new THREE.Points(g,new THREE.PointsMaterial({color:0xeaf2ff,size:0.55,sizeAttenuation:true,transparent:true,opacity:0.9,depthWrite:false}));p.visible=false;scene.add(p);return p;})();

// soft clouds (sprites)
function cloudTex(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
 for(let i=0;i<9;i++){const x=60+Math.random()*136,y=110+Math.random()*50,r=40+Math.random()*45;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill();}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function comicCloudTex(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
 const lobes=[];for(let i=0;i<7;i++)lobes.push([55+Math.random()*146,118+Math.random()*34,26+Math.random()*30]);for(let x=70;x<=186;x+=29)lobes.push([x,150,24]);
 const draw=(col,dy,k)=>{g.fillStyle=col;lobes.forEach(([x,y,r])=>{g.beginPath();g.arc(x,y+dy,r*k,0,7);g.fill();});};
 draw('#1b2a55',3,1.04); draw('#b9d3f5',0,1); g.save();g.beginPath();g.rect(0,0,256,132);g.clip();draw('#ffffff',-6,0.94);g.restore();
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const CLOUD_SOFT=cloudTex(), CLOUD_COMIC=comicCloudTex();
const clouds=[];{const ct=CLOUD_SOFT;for(let i=0;i<10;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:ct,transparent:true,depthWrite:false,opacity:.85}));
 const z=-25-Math.random()*80;s.position.set((Math.random()-.5)*(30-z*0.8),-2+Math.random()*9,z);const k=6+Math.random()*10;s.scale.set(k*1.8,k,1);s.visible=false;scene.add(s);clouds.push(s);}}

const root=new THREE.Group(); scene.add(root);
let mixer, actions={}, morphMeshes=[], eyeMat=null, bones={}, flames=[], palmNodes={}, footNozzle={};
const hand={L:0,R:0,tL:0,tR:0,puffT:3,puffSide:'L',puffLeft:0,prevTz:0};
const state={cloudRise:-1,mode:'loading',t:0,thrust:1,glow:1,yoga:false,seated:false,poseW:0,armW:0,cloudK:0,turnT:-1,cam:'full',expr:'neutral',exprHold:0,talkT:0};
const shapeNow={}, shapeTarget={};
let blinkL=0,blinkR=0,blinkTargetL=0,blinkTargetR=0,autoBlinkT=2.5,lookX=0,lookY=0;
const pointer={x:0,y:0,has:false,lastMove:0};

function setStatus(s){document.getElementById('state').textContent=s;}

// ---- eye shell material (iris that moves + eyelids that blink) ----
function makeEyeMaterial(mask){
  const m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.45,metalness:0,transparent:true,alphaTest:0.02,depthWrite:true});
  m.onBeforeCompile=(sh)=>{
    sh.uniforms.eyeMask={value:mask}; sh.uniforms.blinkL={value:0}; sh.uniforms.blinkR={value:0};
    sh.uniforms.lookX={value:0}; sh.uniforms.lookY={value:0}; sh.uniforms.skinColor={value:new THREE.Color(0.78,0.279,0.13)};
    m.userData.u=sh.uniforms;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vRest;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvRest=position;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 vRest; uniform sampler2D eyeMask; uniform float blinkL,blinkR,lookX,lookY; uniform vec3 skinColor;`)
    .replace('#include <map_fragment>',`
float xB=vRest.x, zB=vRest.y;
vec4 mk=texture2D(eyeMask,vec2((xB+0.12)/0.24,(zB-1.57)/0.24));
float side=step(0.0,xB);
float cx=mix(-0.03192,0.03355,side), cz=mix(1.66612,1.66624,side);
float bl=mix(blinkR,blinkL,side);
vec2 dd=vec2(xB-cx-lookX*0.0045, zB-cz-lookY*0.003)/0.0069;
float d=length(dd);
vec3 pupil=vec3(.005,.005,.008),deep=vec3(.01,.08,.2),mid=vec3(.06,.38,.75),outer=vec3(.03,.2,.48),limb=vec3(.01,.04,.1),sclera=vec3(.72,.72,.70);
vec3 col = d<0.40?pupil: d<0.44?mix(pupil,deep,(d-0.40)/0.04): d<0.62?mix(deep,mid,(d-0.44)/0.18): d<0.86?mix(mid,outer,(d-0.62)/0.24): d<0.97?mix(outer,limb,(d-0.86)/0.11): d<1.0?mix(limb,sclera,(d-0.97)/0.03): sclera;
float hl=1.0-step(0.17,length(dd-vec2(0.3,0.32)));
float vpos=mk.g;
col*=mix(1.0,0.55,clamp((vpos-0.55)/0.45,0.0,1.0));
float thr=1.0-bl;
float lid=step(thr-0.001,vpos);
float band=step(thr-0.14,vpos)*min(bl*12.0,1.0);
col=mix(col,vec3(.02,.012,.01),band);
col=mix(col,skinColor,lid);
diffuseColor.rgb=col;
diffuseColor.a=max(mk.r,mk.b*lid);
float eyeHL=hl*(1.0-lid)*mk.r;`)
    .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(eyeHL*0.9);');
  };
  return m;
}

// ---- thruster flames ----
function flameMaterial(core){
  return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.OneFactor,blendDst:THREE.OneFactor,blendSrcAlpha:THREE.OneFactor,blendDstAlpha:THREE.OneFactor,premultipliedAlpha:true,side:THREE.DoubleSide,
    uniforms:{uI:{value:1},uT:{value:0},uCore:{value:core?1:0}},
    vertexShader:`varying float vY; varying vec3 vN; varying vec3 vV; uniform float uT;
      void main(){ vY=-position.y; vec3 p=position; p.x*=1.0+0.08*sin(uT*31.0+p.y*40.0); p.z*=1.0+0.08*cos(uT*27.0+p.y*35.0);
      vec4 mv=modelViewMatrix*vec4(p,1.0); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader:`varying float vY; varying vec3 vN; varying vec3 vV; uniform float uI,uCore;
      void main(){ float t=clamp(vY,0.0,1.0); float edge=pow(abs(dot(vN,vV)),uCore>0.5?0.6:1.6);
      float a=pow(1.0-t,1.6)*edge*uI; vec3 c=mix(vec3(0.15,0.5,1.0),vec3(0.9,0.97,1.0),pow(1.0-t,uCore>0.5?1.0:3.0));
      vec3 col=c*a*(uCore>0.5?1.4:0.9); gl_FragColor=vec4(col,clamp(max(col.r,max(col.g,col.b)),0.0,1.0)); }`});
}
function glowTex(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const gr=g.createRadialGradient(64,64,0,64,64,64);
 gr.addColorStop(0,'rgba(220,240,255,1)');gr.addColorStop(.25,'rgba(110,180,255,.7)');gr.addColorStop(1,'rgba(40,120,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}
const GLOW=glowTex();
function makeFlame(len,rad){ // flames are excluded from ink outlines
  const g=new THREE.Group();
  const outer=new THREE.ConeGeometry(rad,len,24,6,true); outer.rotateX(Math.PI); outer.translate(0,-len/2,0); outer.scale(1,1/len,1);
  const inner=new THREE.ConeGeometry(rad*0.45,len*0.6,18,4,true); inner.rotateX(Math.PI); inner.translate(0,-len*0.3,0); inner.scale(1,1/(len*0.6),1);
  const mo=flameMaterial(false), mi=flameMaterial(true); mo.userData.outlineParameters={visible:false}; mi.userData.outlineParameters={visible:false};
  const o=new THREE.Mesh(outer,mo), i=new THREE.Mesh(inner,mi); o.scale.y=len; i.scale.y=len*0.6;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.SrcAlphaFactor,blendDst:THREE.OneFactor,blendSrcAlpha:THREE.SrcAlphaFactor,blendDstAlpha:THREE.OneFactor,depthWrite:false,transparent:true}));
  s.scale.setScalar(rad*5);
  g.add(o,i,s); g.userData={o,i,s,mo,mi,len,rad}; g.renderOrder=10; scene.add(g); return g;
}

// ---- scarf: push it out a little and draw it on top where it touches the jacket ----
function fixScarf(model){
  let sc=null; model.traverse(o=>{ if(o.isMesh&&/Scarf/.test(o.name)) sc=o; }); if(!sc) return;
  sc.userData.scarf=true; gear.scarf=sc;
  const g=sc.geometry, pos=g.attributes.position, nor=g.attributes.normal; if(!nor) return;
  g.computeBoundingBox(); const dl=g.boundingBox.getSize(new THREE.Vector3()).length();
  const v=new THREE.Vector3(), mn=new THREE.Vector3(1e9,1e9,1e9), mx=new THREE.Vector3(-1e9,-1e9,-1e9);
  for(let i=0;i<pos.count;i+=5){ v.fromBufferAttribute(pos,i); if(sc.isSkinnedMesh) sc.applyBoneTransform(i,v); v.applyMatrix4(sc.matrixWorld); mn.min(v); mx.max(v); }
  const dw=mx.sub(mn).length(); const k=0.011*dl/Math.max(dw,1e-6);
  for(let i=0;i<pos.count;i++){ pos.setXYZ(i,pos.getX(i)+nor.getX(i)*k,pos.getY(i)+nor.getY(i)*k,pos.getZ(i)+nor.getZ(i)*k); }
  pos.needsUpdate=true; g.computeBoundingSphere();
  sc.renderOrder=1;
}
// ---- gear: aviator cap + goggles, built around his measured head and pinned to the Head bone ----
const HEAD_OFF=new THREE.Vector3();
const gear={hat:null,goggles:null,scarf:null,scarfOn:true,trims:[]};
function ringTube(cx,cy,cz,rx,rz,tilt,tube,n=72){
  const pts=[]; for(let i=0;i<n;i++){ const a=i/n*Math.PI*2; const x=Math.sin(a)*rx, z0=Math.cos(a)*rz;
    pts.push(new THREE.Vector3(cx+x, cy + z0*Math.sin(tilt), cz + z0*Math.cos(tilt))); }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,true),n*2,tube,10,true);
}
function buildGear(model){
  const OFF=HEAD_OFF.clone();
  const head=bones.mixamorigHead; if(!head) return;
  const navy=new THREE.MeshStandardMaterial({name:'CapNavy',color:0x1c2546,roughness:0.88});
  const orange=new THREE.MeshStandardMaterial({name:'CapOrange',color:0xff6a1f,roughness:0.6});
  const seamM=new THREE.MeshStandardMaterial({name:'CapSeam',color:0x10162c,roughness:0.9});
  // ---------- snapback cap, fitted to the skull: the head is trimmed at the hat line while the cap is on ----------
  // hat-line plane (rest pose, world): front edge on the forehead just above the brows, back edge low on the skull
  const Pf=new THREE.Vector3(0,1.701,0.100).add(OFF), Pb=new THREE.Vector3(0,1.640,-0.115).add(OFF);
  const n=new THREE.Vector3(0,-(Pf.z-Pb.z),(Pf.y-Pb.y)).normalize(); // points down/forward = the side we keep
  const below=(p)=>n.dot(p.clone().sub(Pf));
  const C=new THREE.Vector3(0.004,1.668,-0.006).add(OFF), R=new THREE.Vector3(0.104,0.13,0.126);            // >0 keeps, <0 is under the cap
  // 1) "hat version" of the head: drop triangles that sit fully under the cap (ears left alone)
  const trim=(mesh)=>{ const g=mesh.geometry, P=g.attributes.position, I=g.index; if(!I) return;
    const w=[], v=new THREE.Vector3();
    for(let i=0;i<P.count;i++){ v.fromBufferAttribute(P,i); mesh.applyBoneTransform(i,v); v.applyMatrix4(mesh.matrixWorld); w.push(v.clone()); }
    const src=I.array, keep=[];
    for(let t=0;t<src.length;t+=3){ const a=w[src[t]],b=w[src[t+1]],c=w[src[t+2]];
      const inCap=(q)=>below(q)<-0.004;
      const under=inCap(a)||inCap(b)||inCap(c); const ear=Math.abs(a.x)>0.088||Math.abs(b.x)>0.088||Math.abs(c.x)>0.088;
      if(!(under&&!ear)) keep.push(src[t],src[t+1],src[t+2]); }
    { // remove small disconnected islands left near the cap (stray hair cards)
      const key=i=>{ const q=w[i]; return (q.x*2000|0)+','+(q.y*2000|0)+','+(q.z*2000|0); }; const id=new Map(); const vid=new Int32Array(P.count);
      for(let i=0;i<P.count;i++){ const k=key(i); if(!id.has(k)) id.set(k,id.size); vid[i]=id.get(k); }
      const par=new Int32Array(id.size).map((_,i)=>i); const f=x=>{ while(par[x]!==x){ par[x]=par[par[x]]; x=par[x]; } return x; };
      for(let t=0;t<keep.length;t+=3){ const a2=f(vid[keep[t]]),b2=f(vid[keep[t+1]]),c2=f(vid[keep[t+2]]); par[a2]=b2; par[f(c2)]=f(b2); }
      const cnt=new Map(), hi=new Map(); for(let t=0;t<keep.length;t+=3){ const r=f(vid[keep[t]]); cnt.set(r,(cnt.get(r)||0)+1); const yy=w[keep[t]].y; hi.set(r,Math.max(hi.get(r)||-9,yy)); }
      const out=[]; for(let t=0;t<keep.length;t+=3){ const r=f(vid[keep[t]]); if(cnt.get(r)<400&&hi.get(r)>Pb.y-0.02) continue; out.push(keep[t],keep[t+1],keep[t+2]); } keep.length=0; keep.push(...out); }
    gear.trims.push({g,full:I,hat:new THREE.BufferAttribute(src.length>65535*3||P.count>65535?new Uint32Array(keep):new Uint16Array(keep),1)}); };
  model.traverse(o=>{ if(o.isSkinnedMesh&&o.material&&/d58e4479/.test(o.material.name)){ trim(o); if(o.userData.backing) trim(o.userData.backing); } });
  // 2) crown: ellipsoid fitted round the skull, cut exactly on the hat-line plane
  // structured 6-panel crown: base ring sits on the hat-line plane round the skull; each panel rises nearly vertically then rolls into a flat-ish top
  const up=n.clone().negate(); const Cb=Pf.clone().lerp(Pb,0.5); const fwd=Pf.clone().sub(Pb).normalize(); const side=new THREE.Vector3(1,0,0);
  const RX=0.104, RF=0.113, RB=0.116, HH=0.128, PW=2.5, LEAN=0.012;
  const base=(az)=>{ const z=Math.cos(az), x=Math.sin(az); const rz=z>0?RF:RB; return Cb.clone().add(side.clone().multiplyScalar(x*RX)).add(fwd.clone().multiplyScalar(z*rz)); };
  const crown=(az,t)=>{ const b=base(az), k=Math.pow(Math.max(0,1-Math.pow(t,PW)),1/PW); return Cb.clone().add(b.sub(Cb).multiplyScalar(k)).add(up.clone().multiplyScalar(HH*t)).add(fwd.clone().multiplyScalar(-LEAN*t)); };
  const ell=(az,el)=>crown(az,Math.max(0,Math.min(1,el/(Math.PI/2))));
  const el0=(az)=>0;
  const NA=64, NS=20, pos=[], idx=[], rows=[];
  for(let i=0;i<=NA;i++){ const az=i/NA*Math.PI*2; for(let j=0;j<=NS;j++){ const t=j/NS; const p=crown(az,t); pos.push(p.x,p.y,p.z); } }
  for(let i=0;i<NA;i++) for(let j=0;j<NS;j++){ const a=i*(NS+1)+j,b=(i+1)*(NS+1)+j; idx.push(a,b,a+1, b,b+1,a+1); }
  const crownG=new THREE.BufferGeometry(); crownG.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); crownG.setIndex(idx); crownG.computeVertexNormals();
  const cap=new THREE.Group(); cap.name='CapGroup';
  const crownM=new THREE.Mesh(crownG,new THREE.MeshStandardMaterial({name:'CapNavy',color:0x1c2546,roughness:0.88,side:THREE.DoubleSide})); crownM.name='CapCrown'; cap.add(crownM);
  const surf=(az,s)=>{ const p=crown(az,s); const q=crown(az,Math.min(1,s+0.02)); return p.add(p.clone().sub(Cb).normalize().multiplyScalar(0.0012)); };
  // 6 panel seams (one down the centre front like the sheet), top button, 4 eyelets
  for(let i=0;i<6;i++){ const az=i/6*Math.PI*2; const pts=[]; for(let j=0;j<=16;j++) pts.push(surf(az,0.02+j/16*0.97));
    const sm=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,0.0013,5),seamM); sm.name='CapSeam'; cap.add(sm); }
  const btn=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.013,0.006,24),orange); btn.name='CapButton'; btn.position.copy(crown(0,1)).add(up.clone().multiplyScalar(0.002)); btn.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),up); cap.add(btn);
  for(const az of [Math.PI/6*1.0+0.5,-(Math.PI/6+0.5),Math.PI*0.82,-Math.PI*0.82]){ const e=new THREE.Mesh(new THREE.TorusGeometry(0.0055,0.0019,8,20),orange); e.name='CapEyelet';
    const p=surf(az,0.72); e.position.copy(p); e.lookAt(p.clone().add(p.clone().sub(C))); cap.add(e); }
  // flat brim: navy top, orange edge and underside (sheet)
  const fe=surf(0,0.0), bw=0.1, bd=0.1;
  const sh=new THREE.Shape(); sh.moveTo(-bw,0); sh.bezierCurveTo(-bw,bd*0.9,-bw*0.45,bd,0,bd); sh.bezierCurveTo(bw*0.45,bd,bw,bd*0.9,bw,0); sh.quadraticCurveTo(0,0.035,-bw,0);
  const brimG=new THREE.ExtrudeGeometry(sh,{depth:0.006,bevelEnabled:true,bevelThickness:0.0015,bevelSize:0.0015,bevelSegments:2,curveSegments:24}); brimG.rotateX(Math.PI/2);
  const brimTop=new THREE.MeshStandardMaterial({name:'CapNavy',color:0x1c2546,roughness:0.88});
  const brim=new THREE.Mesh(brimG,[brimTop,orange]); brim.name='CapBrim'; brim.position.set(C.x,fe.y-0.001,fe.z-0.026); brim.rotation.x=0.03; cap.add(brim);
  const under=new THREE.Mesh(new THREE.ShapeGeometry(sh,24).rotateX(Math.PI/2),orange); under.name='CapBrimUnder'; under.position.y=-0.0062; under.rotation.y=0; brim.add(under);
  const edgePts=[]; for(let i=0;i<=40;i++){ const a2=Math.PI*(1-i/40); edgePts.push(new THREE.Vector3(Math.cos(a2)*bw*0.99,0,Math.sin(a2)*bd*0.99)); }
  const edge=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edgePts),60,0.0035,8),orange); edge.name='CapBrimEdge'; edge.position.y=-0.003; brim.add(edge);
  // back snap strap with holes
  const strapPts=[]; for(let i=0;i<=12;i++) strapPts.push(surf(Math.PI+(-0.5+i/12*1.0),0.06));
  const strap=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(strapPts),24,0.0055,6),orange); strap.name='CapStrap'; cap.add(strap);
  // ---------- HUD shield glasses, from the turnaround sheet: one wraparound visor with a nose notch, black frame with a flat top bar,
  // glowing blue edge lines down the sides and along the bottom, a blue light bar top-centre, angular temples with /// lights and orange tips ----------
  const frameM=new THREE.MeshStandardMaterial({name:'GlassFrame',color:0x1b1e25,roughness:0.42,metalness:0.35,side:THREE.DoubleSide});
  const glowM=new THREE.MeshStandardMaterial({name:'GlassGlow',color:0x3a6dff,emissive:0x4a86ff,emissiveIntensity:3.2,roughness:0.3});
  const lensM=new THREE.MeshStandardMaterial({name:'GlassLens',color:0x2747c8,roughness:0.06,metalness:0.3,transparent:true,opacity:0.5,emissive:0x2a4cff,emissiveIntensity:0.55,depthWrite:false,side:THREE.DoubleSide});
  const tipM=new THREE.MeshStandardMaterial({name:'GlassTip',color:0xff6a1f,roughness:0.55});
  const gl=new THREE.Group(); gl.name='GlassesGroup';
  const ey=1.668, cz=0.004, rad=0.097, U=0.082, RXg=0.083, RZg=0.108, AM=1.12; // elliptical wrap: further out at the front, tight at the sides            // visor wraps a cylinder round the face; U = half arc-length
  const W=(u,v,d=0)=>{ const a=u/U*AM; return new THREE.Vector3(0.004+Math.sin(a)*(RXg+d), ey+v, cz+Math.cos(a)*(RZg+d)); };
  const top=(u)=>0.0155+0.0015*(1-Math.abs(u)/U);            // nearly flat top
  const bot=(u)=>{ const x=Math.abs(u); if(x<0.008) return 0.002; // nose notch
    if(x<0.014) return 0.002-(x-0.008)/0.006*0.018; if(x<0.06) return -0.016-0.003*Math.sin((x-0.014)/0.046*Math.PI); return -0.016+(x-0.06)/(U-0.06)*0.008; };
  // lens grid
  const NU=72, NV=10, lp=[], li=[];
  for(let i=0;i<=NU;i++){ const u=-U+2*U*i/NU, b0=bot(u), t0=top(u); for(let j=0;j<=NV;j++){ const v=b0+(t0-b0)*j/NV; const q=W(u,v,0.0015); lp.push(q.x,q.y,q.z); } }
  for(let i=0;i<NU;i++) for(let j=0;j<NV;j++){ const a0=i*(NV+1)+j, b0=(i+1)*(NV+1)+j; li.push(a0,b0,a0+1,b0,b0+1,a0+1); }
  const lensG=new THREE.BufferGeometry(); lensG.setAttribute('position',new THREE.Float32BufferAttribute(lp,3)); lensG.setIndex(li); lensG.computeVertexNormals();
  const lens=new THREE.Mesh(lensG,lensM); lens.name='GlassLens'; lens.renderOrder=5; gl.add(lens);
  const haloM=new THREE.MeshBasicMaterial({name:'GlassHalo',color:0x3f7bff,transparent:true,opacity:0.16,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
  const halo=new THREE.Mesh(lensG,haloM); halo.name='GlassHalo'; const hc=W(0,0,0.0015); halo.position.copy(hc).multiplyScalar(-0.06); halo.scale.setScalar(1.06); halo.renderOrder=6; gl.add(halo);
  const curve=(f,u0,u1,d,n=60)=>{ const pts=[]; for(let i=0;i<=n;i++){ const u=u0+(u1-u0)*i/n; pts.push(W(u,f(u),d)); } return new THREE.CatmullRomCurve3(pts); };
  const bloomM=new THREE.MeshBasicMaterial({name:'GlassHalo',color:0x4d8bff,transparent:true,opacity:0.28,blending:THREE.AdditiveBlending,depthWrite:false});
  const tube=(c,r,m,name,seg=80)=>{ const t=new THREE.Mesh(new THREE.TubeGeometry(c,seg,r,8),m); t.name=name; gl.add(t);
    if(m===glowM){ const b=new THREE.Mesh(new THREE.TubeGeometry(c,seg,r*3.2,8),bloomM); b.name='GlassHalo'; b.renderOrder=7; gl.add(b); } return t; };
  // frame: thick flat top bar (strip), rim along the bottom + sides
  const FP=[], FI=[]; const NB=60;
  for(let i=0;i<=NB;i++){ const u=-U-0.004+(2*U+0.008)*i/NB; for(const [v,d] of [[top(u)-0.002,0.0035],[top(u)+0.0055,0.002],[top(u)+0.0055,-0.005]]){ const q=W(u,v,d); FP.push(q.x,q.y,q.z); } }
  for(let i=0;i<NB;i++) for(let j=0;j<2;j++){ const a0=i*3+j, b0=(i+1)*3+j; FI.push(a0,b0,a0+1,b0,b0+1,a0+1); }
  const fg=new THREE.BufferGeometry(); fg.setAttribute('position',new THREE.Float32BufferAttribute(FP,3)); fg.setIndex(FI); fg.computeVertexNormals();
  const fbar=new THREE.Mesh(fg,frameM); fbar.name='GlassFrame'; gl.add(fbar);
  tube(curve(bot,-U,U,0.003,140),0.0028,frameM,'GlassFrame',160);
  for(const sx of [1,-1]){ const u=sx*U; const c=new THREE.CatmullRomCurve3([W(u,bot(u),0.003),W(u,(bot(u)+top(u))/2,0.003),W(u,top(u)+0.004,0.003)]); tube(c,0.0045,frameM,'GlassFrame',8); }
  // glow lines: inner edge of each side + along the bottom of each half, and the top-centre light bar
  const inset=(u)=>bot(u)+0.0045;
  for(const sx of [1,-1]){
    const u0=sx*0.019, u1=sx*(U-0.006);
    tube(curve(inset,Math.min(u0,u1),Math.max(u0,u1),0.0042,40),0.0014,glowM,'GlassGlow',50);
    const us=sx*(U-0.006); tube(new THREE.CatmullRomCurve3([W(us,inset(us),0.0042),W(us,top(us)-0.004,0.0042)]),0.0014,glowM,'GlassGlow',6);
  }
  tube(curve(u=>top(u)-0.002,-0.02,0.02,0.0046,12),0.0022,glowM,'GlassGlow',16);
  // nose pads
  for(const sx of [1,-1]){ const np=new THREE.Mesh(new THREE.SphereGeometry(0.0055,12,8),frameM); np.name='GlassFrame'; np.scale.set(0.7,1.3,0.6); np.position.copy(W(sx*0.0105,-0.005,-0.008)); gl.add(np); }
  // temples: hinge block, angular arm along the side of the head, three blue /// lights, orange tip behind the ear
  for(const sx of [1,-1]){
    const h0=W(sx*(U+0.003),top(sx*U)-0.004,-0.002);
    const hinge=new THREE.Mesh(new THREE.BoxGeometry(0.008,0.014,0.016),frameM); hinge.name='GlassFrame'; hinge.position.copy(h0); hinge.lookAt(W(sx*(U+0.02),top(sx*U)-0.004,-0.002)); gl.add(hinge);
    const a1=new THREE.Vector3(sx*0.089,ey+0.006,-0.02), a2=new THREE.Vector3(sx*0.091,ey,-0.066), a3=new THREE.Vector3(sx*0.087,ey-0.013,-0.088);
    const arm=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([h0,a1,a2]),20,0.0034,6),frameM); arm.name='GlassFrame'; arm.scale.set(1,1,1); gl.add(arm);
    const tip=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a2.clone().lerp(a1,0.35),a2,a3]),12,0.0034,6),tipM); tip.name='GlassTip'; gl.add(tip);
    for(let k=0;k<3;k++){ const t=0.25+k*0.13; const pp=h0.clone().lerp(a1,t); pp.x+=sx*0.0042;
      const bar=new THREE.Mesh(new THREE.BoxGeometry(0.0016,0.007,0.0028),glowM); bar.name='GlassGlow'; bar.position.copy(pp); bar.rotation.x=0.5; gl.add(bar); }
  }
  gl.position.add(OFF); // glasses were drawn in reference-head coordinates
  for(const g of [cap,gl]){ g.visible=false; scene.add(g); g.updateMatrixWorld(true); head.attach(g); }
  gear.hat=cap; gear.goggles=gl;
}
function updateGear(){ if(!gear.hat) return; const h=!!gear.hat.userData.on, g=!!gear.goggles.userData.on;
  gear.hat.visible=h; gear.goggles.visible=g; for(const t of gear.trims) t.g.setIndex(h?t.hat:t.full); if(gear.scarf) gear.scarf.visible=gear.scarfOn!==false;
  document.getElementById('g-hat').classList.toggle('on',h); document.getElementById('g-goggles').classList.toggle('on',g); document.getElementById('g-scarf').classList.toggle('on',gear.scarfOn!==false); }
document.getElementById('g-hat').onclick=()=>{ if(gear.hat){gear.hat.userData.on=!gear.hat.userData.on; updateGear();} };
document.getElementById('g-goggles').onclick=()=>{ if(gear.goggles){gear.goggles.userData.on=!gear.goggles.userData.on; updateGear();} };
document.getElementById('g-scarf').onclick=()=>{ gear.scarfOn=gear.scarfOn===false; updateGear(); };
// ---- the cloud he sits on in yoga mode ----
const yogaCloud=(()=>{ const g=new THREE.Group(); g.name='YogaCloud';
  // same soft sprite clouds as the sky: a little cumulus built from 12 billboards, behind, under and around him (none in front of his lap)
  const texs=[cloudTex(),cloudTex(),cloudTex()];
  const puffs=[ // x, y, z, width, height, opacity
    [0,0.02,-0.32,2.1,1.0,0.95],[-0.62,-0.02,-0.2,1.5,0.8,0.9],[0.64,-0.01,-0.22,1.55,0.8,0.9],
    [0,-0.06,0.0,2.2,1.05,0.95],[-0.5,-0.08,0.1,1.4,0.75,0.9],[0.52,-0.07,0.12,1.4,0.75,0.9],
    [0,-0.16,0.32,1.9,0.85,0.9],[-0.78,-0.12,0.16,1.0,0.55,0.85],[0.8,-0.11,0.14,1.0,0.55,0.85],
    [-0.3,-0.2,0.42,1.1,0.55,0.85],[0.32,-0.21,0.43,1.1,0.55,0.85],[0,-0.24,-0.05,2.4,0.9,0.7]];
  puffs.forEach(([x,y,z,w,h,o],i)=>{ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:texs[i%3],transparent:true,depthWrite:false,opacity:o})); sp.name='Cloud'; sp.position.set(x,y,z); sp.scale.set(w,h,1); sp.userData.baseOpacity=o; g.add(sp); });
  g.position.set(0,0.8,0.06); g.scale.setScalar(0.001); g.visible=false; return g; })();

// ---- in-context comments: pins stick to the body part you clicked and follow him as he moves ----
const cm={api:null,ctl:null,mode:false,arming:false,on:false,threads:[],last:0};
let testAction='Fly in';
function setTest(a){ testAction=a; for(const [id,l] of [['b-intro','Intro'],['b-fly','Fly in'],['b-yoga','Yoga'],['b-wave','Wave'],['b-talk','Talk'],['b-turn','Turn']]){ const b=document.getElementById(id); if(b){ b.classList.toggle('go',l===a); } } setCommentBtn(); reportPins(true); }
// the "test mode" a comment belongs to: action + style + lighting + camera + gear. Each combination is its own comment set.
function testKey(){ const on=id=>document.getElementById(id)?.classList.contains('on');
  const st=on('s-cartoon')?'Cartoon':on('s-spider')?'SpiderVerse':'Realistic';
  const li=on('li-golden')?'Golden':on('li-night')?'Night':on('li-studio')?'Studio':'Day';
  const gear=[on('g-hat')?'Cap':'',on('g-goggles')?'Glasses':'',on('g-scarf')?'':'NoScarf'].filter(Boolean).join('+')||'NoGear';
  return [testAction,st,li,state.cam==='face'?'Face':'Full',gear].join('/'); }
const ray=new THREE.Raycaster(), ndc=new THREE.Vector2();
const PART_BY_BONE=[[/Head|Neck/,'Head'],[/Spine2|Spine1/,'Chest'],[/Spine$|Hips/,'Waist'],[/LeftShoulder|LeftArm$/,'Left shoulder'],[/RightShoulder|RightArm$/,'Right shoulder'],[/LeftForeArm/,'Left forearm'],[/RightForeArm/,'Right forearm'],[/LeftHand/,'Left hand'],[/RightHand/,'Right hand'],[/LeftUpLeg/,'Left thigh'],[/RightUpLeg/,'Right thigh'],[/LeftLeg/,'Left shin'],[/RightLeg/,'Right shin'],[/LeftFoot|LeftToe/,'Left boot'],[/RightFoot|RightToe/,'Right boot']];
function partName(obj,bone,mat){
  const n=(obj.name||'')+' '+(mat&&mat.name||'');
  if(/Teeth|MouthInside|Tongue|Gums/.test(n)) return 'Mouth';
  if(/Cap/.test(n)) return 'Cap'; if(/Glass/.test(n)) return 'HUD glasses'; if(/Jetpack/.test(n)) return 'Jet pack';
  if(/Scarf/.test(n)) return 'Scarf'; if(/Boot/.test(n)) return 'Boots'; if(/Strap|Buckle|Ring/.test(n)) return 'Harness'; if(/Cloud/.test(n)) return 'Cloud';
  if(/d58e4479|Eyes/.test(n)) return 'Face';
  for(const [re,l] of PART_BY_BONE) if(re.test(bone.name)) return l; return 'Body';
}
function stateLine(){ const on=id=>document.getElementById(id)?.classList.contains('on');
  const pick=(ids)=>{ for(const [id,l] of ids) if(on(id)) return l; return ''; };
  const expr=[...document.querySelectorAll('#faces button.on')].map(b=>b.textContent).join('')||'';
  return [state.seated?'Yoga':(state.mode||''), pick([['s-real','Realistic'],['s-cartoon','Cartoon'],['s-spider','Spider-Verse']]), pick([['li-day','Day'],['li-golden','Golden hour'],['li-night','Night'],['li-studio','Studio']]),
    state.cam==='face'?'Face cam':'Full body', expr, on('g-hat')?'Cap':'', on('g-goggles')?'Glasses':'', on('g-scarf')?'':'No scarf'].filter(Boolean).join(', '); }
function nearestBone(p){ let best=null,bd=1e9; const v=new THREE.Vector3(); for(const k in bones){ if(/ScarfTail|End$|Index|Middle|Ring|Pinky|Thumb/.test(k)) continue; bones[k].getWorldPosition(v); const d=v.distanceToSquared(p); if(d<bd){bd=d;best=bones[k];} } return best; }
async function commentAt(e){
  if(!cm.ctl) return;
  const r=canvas.getBoundingClientRect(); ndc.set(((e.clientX-r.left)/r.width)*2-1, -((e.clientY-r.top)/r.height)*2+1);
  ray.setFromCamera(ndc,camera);
  const targets=[]; root.traverse(o=>{ if(o===yogaCloud||o.parent===yogaCloud) return; if(o.isMesh&&o.visible&&!inks.includes(o)&&!misprints.includes(o)&&o.material&&!(o.material.name||'').startsWith('Glass')) targets.push(o); });
  yogaCloud.visible && yogaCloud.traverse(o=>{ if(o.isMesh) targets.push(o); });
  const hits=ray.intersectObjects(targets,false).filter(h=>{ let o=h.object; while(o){ if(!o.visible) return false; o=o.parent; } return true; });
  const at={x:e.pageX,y:e.pageY};
  let anchor, label, detail;
  if(hits.length){ const h=hits[0]; const mat=Array.isArray(h.object.material)?h.object.material[h.face?.materialIndex||0]:h.object.material;
    const isCloud=yogaCloud.visible && h.object.parent===yogaCloud; const bone=isCloud?null:nearestBone(h.point);
    const part=isCloud?'Cloud':partName(h.object,bone,mat);
    const host=isCloud?yogaCloud:bone; const lp=host.worldToLocal(h.point.clone());
    const f=n=>n.toFixed(3);
    anchor=`[${testKey()}] ${part} @${isCloud?'Cloud':bone.name.replace('mixamorig','')}:${f(lp.x)},${f(lp.y)},${f(lp.z)}`;
    label=part; detail=stateLine();
  } else { anchor=`[${testKey()}] View @screen:${(e.clientX/innerWidth).toFixed(3)},${(e.clientY/innerHeight).toFixed(3)}`; label='This view'; detail=stateLine(); }
  try{ await cm.ctl.compose(anchor.slice(0,120),at,{label,detail}); }catch(err){ console.warn('comment',err&&err.code); }
  setCommentBtn();
}
const _pv=new THREE.Vector3();
function anchorPoint(a){
  const m=/@([A-Za-z0-9_]+):(-?[\d.]+),(-?[\d.]+)(?:,(-?[\d.]+))?$/.exec(a); if(!m) return undefined;
  if(m[1]==='screen') return {x:+m[2]*innerWidth+scrollX,y:+m[3]*innerHeight+scrollY};
  const host=m[1]==='Cloud'?yogaCloud:bones['mixamorig'+m[1]]; if(!host||(m[1]==='Cloud'&&!yogaCloud.visible)) return null;
  _pv.set(+m[2],+m[3],+(m[4]||0)); host.localToWorld(_pv); _pv.project(camera);
  if(_pv.z>1||Math.abs(_pv.x)>1.05||Math.abs(_pv.y)>1.05) return null;
  const r=canvas.getBoundingClientRect(); return {x:r.left+scrollX+(_pv.x+1)/2*r.width, y:r.top+scrollY+(1-_pv.y)/2*r.height};
}
function reportPins(force){
  if(!cm.ctl||!cm.threads.length) return; const now=performance.now(); if(!force&&now-cm.last<66) return; cm.last=now;
  const key='['+testKey()+']'; let shown=0;
  const map={}; for(const t of cm.threads){ const tk=(/^\[[^\]]*\]/.exec(t.anchor)||[''])[0];
    if(tk&&tk!==key){ map[t.id]=null; continue; } let p=anchorPoint(t.anchor);
    if(p===undefined){ try{ const el=document.querySelector(t.anchor); if(el){ const b=el.getBoundingClientRect(); p={x:b.left+scrollX+b.width/2,y:b.top+scrollY+b.height/2}; } else p=null; }catch(_){ p=null; } }
    map[t.id]=p; if(p) shown++; }
  cm.ctl.placed(map); cm.shown=shown;
}
function setCommentBtn(){ const b=document.getElementById('b-comment'); if(!b) return;
  const set=document.getElementById('cmset');
  if(!cm.ctl){ b.hidden=true; if(set) set.textContent='Comments are available when this page is opened in Claude.'; return; }
  b.hidden=false; b.classList.toggle('on',cm.on); b.textContent=cm.on?'Comment mode: On':'Comment mode: Off';
  if(set){ const k=testKey().split('/'); const n=cm.threads.filter(t=>t.anchor.startsWith('['+testKey()+']')).length;
    set.textContent=`This test set: ${k.join(' · ')} — ${n} comment${n===1?'':'s'}. Change any setting above to start a separate set.`; }
  document.getElementById('hint').textContent=cm.on?'Click any part of him (or a control) to leave a comment pinned there. Pins follow him as he moves.':'Move your mouse (or drag on a phone): his eyes, head and body follow you. Click him for a reaction.'; }
(async()=>{ try{
  if(typeof claude==='undefined'||!claude.use) return; const api=await claude.use('comments'); if(!api) return; cm.api=api;
  cm.ctl=await api.customAnchors({
    mode:(on)=>{ cm.mode=on; if(on) cm.on=true; else { cm.on=false; cm.threads=[]; } setCommentBtn(); },
    threads:(list)=>{ cm.threads=list; reportPins(true); setCommentBtn(); },
    reveal:(id)=>{ const t=cm.threads.find(x=>x.id===id); if(t&&/^(Face|Mouth|Head|Cap|HUD glasses)/.test(t.anchor)) setCam('face'); reportPins(true); },
    composing:()=>{},
  });
  setCommentBtn();
  // any setting change switches to that test mode's comment set
  document.querySelector('.dock').addEventListener('click',()=>setTimeout(()=>{ setCommentBtn(); reportPins(true); },0));
}catch(err){ console.warn('comments unavailable',err&&err.code); } })();
setCommentBtn();
document.getElementById('b-comment').onclick=(e)=>{ e.stopPropagation(); if(!cm.ctl) return; cm.on=!cm.on; if(!cm.on&&cm.mode) cm.ctl.exitMode(); setCommentBtn(); };

// ---- load ----
const texLoader=new THREE.TextureLoader();
const mask=texLoader.load(BASE+'eye_mask.png',t=>{t.colorSpace=THREE.NoColorSpace;t.needsUpdate=true;});
mask.colorSpace=THREE.NoColorSpace; mask.minFilter=THREE.LinearFilter; mask.generateMipmaps=false;

new GLTFLoader().load(BASE+'zolton.json',(gltf)=>{
  const model=gltf.scene; root.add(model);
  model.traverse(o=>{
    if(o.isBone) bones[o.name]=o;
    if(o.name.startsWith('PalmRing')) palmNodes[o.name.endsWith('L')?'L':'R']=o;
    if(o.isMesh){
      o.frustumCulled=false;
      (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ if(m.isMeshStandardMaterial && !/Chrome|Metal|Palm|Boot|Material\.001/.test(m.name)){ m.metalness=Math.min(m.metalness,0.1); m.roughness=Math.max(m.roughness,0.65); m.envMapIntensity=0.6; } });
      const mats=Array.isArray(o.material)?o.material:[o.material];
      mats.forEach(m=>{ if(/Strap|Scarf|Buckle|Ring|Palm|tripo_material_dd7f/.test(m.name)||/Strap|Scarf/.test(o.name)) m.side=THREE.DoubleSide; });
      if(o.morphTargetDictionary && 'Smile' in o.morphTargetDictionary) morphMeshes.push(o);
      if(o.name==='Eyes'||o.parent?.name==='Eyes'){ eyeMat=makeEyeMaterial(mask); o.material=eyeMat; o.renderOrder=2; }
    }
  });
  model.updateMatrixWorld(true);
  model.traverse(o=>{ if(o.isSkinnedMesh) o.skeleton.update(); });
  bones.mixamorigHead.getWorldPosition(HEAD_OFF).sub(new THREE.Vector3(0,1.568,-0.032));
  model.traverse(o=>{ if(!o.isSkinnedMesh||!o.material||o.material.name!=='MouthInside') return;
    const P=o.geometry.attributes.position, v=new THREE.Vector3(); const CZ=1.645+HEAD_OFF.y;
    // local->world linear map for this (single-bone) mesh, measured from vertex 0
    const W=(i,x,y,z)=>{ const q=new THREE.Vector3(x,y,z); o.applyBoneTransform(i,q); return q.applyMatrix4(o.matrixWorld); };
    const p0=new THREE.Vector3().fromBufferAttribute(P,0), w0=W(0,p0.x,p0.y,p0.z);
    const c1=W(0,p0.x+1,p0.y,p0.z).sub(w0), c2=W(0,p0.x,p0.y+1,p0.z).sub(w0), c3=W(0,p0.x,p0.y,p0.z+1).sub(w0);
    const inv=new THREE.Matrix3().set(c1.x,c2.x,c3.x, c1.y,c2.y,c3.y, c1.z,c2.z,c3.z).invert();
    for(let i=0;i<P.count;i++){ v.fromBufferAttribute(P,i); o.applyBoneTransform(i,v); v.applyMatrix4(o.matrixWorld);
      if(v.y>CZ){ const k=Math.min(1,(v.y-CZ)/0.012)*Math.max(0,Math.min(1,(v.z-0.074)/0.014)); const d=new THREE.Vector3(v.x*0.16*k,(v.y-CZ)*0.28,-0.004*Math.min(1,(v.y-CZ)/0.02)).applyMatrix3(inv); P.setXYZ(i,P.getX(i)+d.x,P.getY(i)+d.y,P.getZ(i)+d.z); } }
    P.needsUpdate=true; o.geometry.computeBoundingSphere(); });
  // neck + collar clean-up: drop every scarf-red triangle around the collar (head and body), and give the lower neck one clean skin tone
  (()=>{ const px=(tex)=>{ const im=tex&&tex.image; if(!im) return null; const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const g=c.getContext('2d'); g.drawImage(im,0,0); return {w:c.width,h:c.height,d:g.getImageData(0,0,c.width,c.height).data,flip:tex.flipY}; };
    const at=(P,u,v)=>{ const x=Math.min(P.w-1,Math.max(0,(u*P.w)|0)), y=Math.min(P.h-1,Math.max(0,((P.flip?1-v:v)*P.h)|0)); const i=(y*P.w+x)*4; return [P.d[i]/255,P.d[i+1]/255,P.d[i+2]/255]; };
    const hsv=([r,g,b])=>{ const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn||1e-6; let h= mx===r?((g-b)/d)%6 : mx===g?(b-r)/d+2 : (r-g)/d+4; h*=60; if(h<0) h+=360; return [h,(mx-mn)/(mx||1e-6),mx]; };
    const isRed=(c)=>{ const [h,sa,v]=hsv(c); return (h<13||h>338)&&sa>0.5&&v>0.18; };
    const Y0=OFFY=>0; const oy=HEAD_OFF.y;
    model.traverse(o=>{ if(!o.isSkinnedMesh||!o.material||!o.material.map) return; const isHeadM=/d58e4479/.test(o.material.name), isBody=/01a17fda/.test(o.material.name); if(!isHeadM&&!isBody) return;
      const P=px(o.material.map); if(!P) return; const g=o.geometry, pos=g.attributes.position, uv=g.attributes.uv, I=g.index; if(!uv||!I) return;
      const w=[]; const v=new THREE.Vector3(); for(let i=0;i<pos.count;i++){ v.fromBufferAttribute(pos,i); o.applyBoneTransform(i,v); v.applyMatrix4(o.matrixWorld); w.push(v.clone()); }
      const src=I.array, keep=[];
      for(let t=0;t<src.length;t+=3){ const ids=[src[t],src[t+1],src[t+2]]; const cy=(w[ids[0]].y+w[ids[1]].y+w[ids[2]].y)/3, cx=(w[ids[0]].x+w[ids[1]].x+w[ids[2]].x)/3, czz=(w[ids[0]].z+w[ids[1]].z+w[ids[2]].z)/3;
        const near = cy>1.43+oy && cy<(isHeadM?1.598:1.64)+oy && Math.hypot(cx,czz-(-0.03+HEAD_OFF.z))<0.16;
        if(near){ let n=0; for(const k of ids) if(isRed(at(P,uv.getX(k),uv.getY(k)))) n++; const mu=(uv.getX(ids[0])+uv.getX(ids[1])+uv.getX(ids[2]))/3, mv=(uv.getY(ids[0])+uv.getY(ids[1])+uv.getY(ids[2]))/3;
          if(isRed(at(P,mu,mv))) n++; if(isHeadM?n>=2:(n>=4&&cy>1.5+oy&&!(Math.abs(cx)<0.07&&czz>HEAD_OFF.z))) continue; }
        keep.push(...ids); }
      g.setIndex(keep);
      if(isHeadM){ // lower neck: re-point whole triangles (on their own copied vertices) at one clean skin pixel, so no stretched streaks or seam line
        let best=null; for(let i=0;i<pos.count&&!best;i++){ const q=w[i]; if(q.y<1.6+oy||q.y>1.63+oy||Math.abs(q.x)<0.05||Math.abs(q.x)>0.075) continue; const [h,sa,vv]=hsv(at(P,uv.getX(i),uv.getY(i))); if(h>12&&h<35&&sa>0.3&&sa<0.6&&vv>0.55&&vv<0.9) best=[uv.getX(i),uv.getY(i)]; }
        if(best){ const idx=g.index.array, tris=[]; for(let t=0;t<idx.length;t+=3){ const c=w[idx[t]].clone().add(w[idx[t+1]]).add(w[idx[t+2]]).multiplyScalar(1/3);
            const lim=(Math.abs(c.x)<0.03&&c.z>HEAD_OFF.z+0.01)?1.597:1.574; if(c.y<lim+oy&&Math.hypot(c.x,c.z-(-0.01+HEAD_OFF.z))<0.085) tris.push(t); }
          const n0=pos.count, add=tris.length*3; const grow=(attr)=>{ const A=new attr.array.constructor((attr.count+add)*attr.itemSize); A.set(attr.array); return new THREE.BufferAttribute(A,attr.itemSize,attr.normalized); };
          const names=Object.keys(g.attributes); const na={}; for(const k of names) na[k]=grow(g.attributes[k]);
          const nm={}; for(const k in g.morphAttributes) nm[k]=g.morphAttributes[k].map(grow);
          const ni=Array.from(idx); let nv=n0;
          for(const t of tris){ for(let k=0;k<3;k++){ const src=idx[t+k];
              for(const a of names){ const A=na[a], s2=A.itemSize; for(let c=0;c<s2;c++) A.array[nv*s2+c]=A.array[src*s2+c]; }
              for(const a in nm) for(const A of nm[a]){ const s2=A.itemSize; for(let c=0;c<s2;c++) A.array[nv*s2+c]=A.array[src*s2+c]; }
              na.uv.setXY(nv,best[0],best[1]); ni[t+k]=nv; nv++; } }
          for(const k of names) g.setAttribute(k,na[k]); for(const k in nm) g.morphAttributes[k]=nm[k];
          g.setIndex(ni); g.computeBoundingSphere(); } }
    }); })();
  // backing skin: a copy of the face shell pushed 1.5 mm inward, so any hairline seam in the scan shows skin, never sky
  model.traverse(o=>{ if(!o.isSkinnedMesh||!o.material||!/d58e4479/.test(o.material.name)) return;
    const g=o.geometry.clone(), P=g.attributes.position, N=g.attributes.normal; if(!N) return;
    const W=(i,x,y,z)=>{ const q=new THREE.Vector3(x,y,z); o.applyBoneTransform(i,q); return q.applyMatrix4(o.matrixWorld); };
    const p0=new THREE.Vector3().fromBufferAttribute(P,0), w0=W(0,p0.x,p0.y,p0.z), sc=W(0,p0.x+1,p0.y,p0.z).sub(w0).length();
    const k=0.0015/Math.max(sc,1e-9);
    for(let i=0;i<P.count;i++) P.setXYZ(i,P.getX(i)-N.getX(i)*k,P.getY(i)-N.getY(i)*k,P.getZ(i)-N.getZ(i)*k);
    const back=new THREE.SkinnedMesh(g,o.material); back.name='FaceBacking'; back.bind(o.skeleton,o.bindMatrix);
    back.morphTargetInfluences=o.morphTargetInfluences; back.morphTargetDictionary=o.morphTargetDictionary; back.frustumCulled=false;
    o.parent.add(back); back.position.copy(o.position); back.quaternion.copy(o.quaternion); back.scale.copy(o.scale); o.userData.backing=back; backings.push([o,back]); });
  fixScarf(model);
  buildGear(model);
  root.add(yogaCloud);
  // toon material sets (built once; Style buttons swap them)
  const meshList=[]; model.traverse(o=>{ if(o.isMesh) meshList.push(o); });
  meshList.forEach(o=>{
    const real=o.material; if(o.material===eyeMat) return;
    const mk=v=>Array.isArray(real)?real.map(m=>toComic(m,v)):toComic(real,v);
    const cartoon=mk('cartoon'); let comic=mk('spider');
    if(/d58e4479|Head_LOD_mesh/.test(o.name)){ // face: thinner ink so it doesn't poke through the lips, softer dots
      const fix=c=>{ if(!c.isMeshToonMaterial||c.userData.outlineParameters?.visible===false) return c; const f=new THREE.MeshToonMaterial().copy(c); f.name=c.name;
        comicPatch(f,{dots:true,rimAmt:0.18,dotStart:0.6}); f.userData.outlineParameters={thickness:0.0024,color:[0.04,0.03,0.07]}; return f; };
      comic=Array.isArray(comic)?comic.map(fix):fix(comic);
    }
    swaps.push({mesh:o,real,cartoon,spider:comic});
    if(o.userData.scarf){ for(const m of [real,cartoon,comic].flat()){ m.polygonOffset=true; m.polygonOffsetFactor=-1; m.polygonOffsetUnits=-6; } }
    const isHead=/d58e4479|Head_LOD_mesh/.test(o.name);
    const px = isHead?1.3 : /GlassLens|GlassGlow|GlassHalo|CapSeam|CapEyelet/.test(o.name)?0 : /Strap|Buckle|Ring|Glass|Cap/.test(o.name)?1.3 : /PalmRing/.test(o.name)?0 : 2.2;
    if(px>0){
      const inkM=inkMaterial(px*Math.min(devicePixelRatio,2));
      const ink = o.isSkinnedMesh ? new THREE.SkinnedMesh(o.geometry,inkM) : new THREE.Mesh(o.geometry,inkM);
      if(o.isSkinnedMesh){ ink.bind(o.skeleton,o.bindMatrix); }
      if(o.morphTargetInfluences){ ink.morphTargetInfluences=o.morphTargetInfluences; ink.morphTargetDictionary=o.morphTargetDictionary; }
      ink.frustumCulled=false; ink.renderOrder=-1; o.add(ink); inks.push(ink);
      if(!isHead && !/Strap|Buckle|Ring|Palm|Glass|Cap/.test(o.name)){ // Spider-Verse misprint: offset colour ghost behind the ink line
        const mm=inkMaterial(px*Math.min(devicePixelRatio,2)+0.6,0xff2f7d,[3.2,-2.2]);
        const mp = o.isSkinnedMesh ? new THREE.SkinnedMesh(o.geometry,mm) : new THREE.Mesh(o.geometry,mm);
        if(o.isSkinnedMesh){ mp.bind(o.skeleton,o.bindMatrix); }
        if(o.morphTargetInfluences){ mp.morphTargetInfluences=o.morphTargetInfluences; mp.morphTargetDictionary=o.morphTargetDictionary; }
        mp.frustumCulled=false; mp.renderOrder=-2; o.add(mp); misprints.push(mp);
      }
    }
  });
  setLook(look);
  // foot nozzles at heel bottoms (rest pose)
  model.updateMatrixWorld(true);
  for(const [s,x] of [['L',0.209],['R',-0.209]]){
    const fb=bones[s==='L'?'mixamorigLeftFoot':'mixamorigRightFoot']; const h=new THREE.Object3D();
    fb.add(h); h.position.copy(fb.worldToLocal(new THREE.Vector3(x,0.0,-0.128))); footNozzle[s]=h;
  }
  // jet pack canister nozzles (measured at the bottom of each canister, rest pose)
  const packNoz={};
  for(const [k,x] of [['L',0.067],['R',-0.067]]){ const h=new THREE.Object3D(); scene.add(h); h.position.set(x,1.085,-0.24); h.updateMatrixWorld(true); bones.mixamorigSpine2.attach(h); packNoz[k]=h; }
  // flames
  flames=[{node:palmNodes.L,dir:new THREE.Vector3(0.12,-1,-0.12).normalize(),f:makeFlame(0.34,0.034),ph:0},
          {node:palmNodes.R,dir:new THREE.Vector3(-0.12,-1,-0.12).normalize(),f:makeFlame(0.34,0.034),ph:1.3},
          {node:footNozzle.L,dir:new THREE.Vector3(0,-1,0.04).normalize(),f:makeFlame(0.5,0.05),ph:2.1},
          {node:footNozzle.R,dir:new THREE.Vector3(0,-1,0.04).normalize(),f:makeFlame(0.5,0.05),ph:3.7},
          {node:packNoz.L,dir:new THREE.Vector3(0,-1,-0.12).normalize(),f:makeFlame(0.62,0.04),ph:0.7,pack:true},
          {node:packNoz.R,dir:new THREE.Vector3(0,-1,-0.12).normalize(),f:makeFlame(0.62,0.04),ph:2.9,pack:true}];
  const handLight=new THREE.PointLight(0x7fb8ff,0.06,1.2); scene.add(handLight); state.handLight=handLight;
  const footLight=new THREE.PointLight(0x7fb8ff,0.0,1.6); scene.add(footLight); state.footLight=footLight;

  // ---- animations ----
  // rest pose snapshot: every frame starts from this, so the additive look/sway offsets never pile up
  model.traverse(o=>{ if(o.isBone) restPose.push([o,o.quaternion.clone(),o.position.clone()]); });
  mixer=new THREE.AnimationMixer(model);
  const UPPER=/Spine1|Spine2|Neck|Head|Shoulder|Arm|Hand/;
  const strip=(clip)=>{clip.tracks=clip.tracks.filter(t=>!t.name.startsWith('ScarfTail'));return clip;};
  const sub=(clip,name,keepUpper)=>{const c=clip.clone();c.name=name;c.tracks=c.tracks.filter(t=>!t.name.startsWith('ScarfTail')&&(UPPER.test(t.name.split('.')[0])===keepUpper));return c;};
  const clips=Object.fromEntries(gltf.animations.map(c=>[c.name,strip(c)]));
  actions.fly=mixer.clipAction(clips.Flying_InPlace);
  actions.hoverLow=mixer.clipAction(sub(clips.Hover,'hoverLow',false));
  actions.hoverUp=mixer.clipAction(sub(clips.Hover,'hoverUp',true));
  actions.wave=mixer.clipAction(sub(clips.Waving_Gesture,'waveUp',true));
  actions.talk=mixer.clipAction(sub(clips.Talking_Standing,'talkUp',true));
  actions.wave.setLoop(THREE.LoopRepeat,2); actions.wave.timeScale=0.75; actions.wave.clampWhenFinished=true;
  actions.talk.setLoop(THREE.LoopOnce,1); actions.talk.clampWhenFinished=true;
  mixer.addEventListener('finished',e=>{ if(e.action===actions.wave||e.action===actions.talk){ actions.hoverUp.reset().fadeIn(0.5).play(); e.action.fadeOut(0.5); state.mode=state.seated?'yoga':'hover'; setStatus(state.seated?'meditating':'hovering'); setExpr(state.seated?'zen':'happy');}});

  window.__z={actions,mixer,setLook,inks,scene,camera,renderer,hand,state,bones,root,restPose,gear,yogaCloud,setCam,setLight,updateGear,setPalm:(v)=>{PALM_SIGN=v;}};
  document.getElementById('loader').hidden=true;
  buildFaceButtons(); updateGear(); setTest('Intro'); playIntro();
  { const syncMode=()=>setLight(document.documentElement.classList.contains('zb-night')?'night':'day'); syncMode();
    new MutationObserver(syncMode).observe(document.documentElement,{attributes:true,attributeFilter:['class']}); }
},(e)=>{ if(e.total){const p=Math.round(e.loaded/e.total*100);document.getElementById('loadtxt').textContent=`Loading Zolton… ${p}%`;document.getElementById('loadbar').style.width=p+'%';}},
(err)=>{document.getElementById('loadtxt').textContent='Could not load the 3D model. Reload the page to try again. ['+(err&&(err.message||err.type||err.target&&err.target.status)||err)+' | '+location.href+']';console.error(err);});

// ---- behaviour ----
function setExpr(name,hold=0){ if(state.intro&&name!=='happyOpen'&&hold===0) name='happyOpen'; state.expr=name; state.exprHold=hold;
  for(const k in shapeTarget) shapeTarget[k]=0; const p=PRESETS[name]||{};
  for(const [k,v] of Object.entries(p.shape||{})) shapeTarget[k]=v;
  const b=p.blink??0; blinkTargetL=p.blinkL??b; blinkTargetR=p.blinkR??b; state.exprLook=[p.lookX??0,p.lookY??0];
  document.querySelectorAll('#faces button').forEach(x=>x.classList.toggle('on',x.dataset.k===name));
}
function buildFaceButtons(){const row=document.getElementById('faces');
  for(const k of Object.keys(PRESETS)){const b=document.createElement('button');b.id='f-'+k;b.dataset.k=k;b.textContent=LABELS[k];b.onclick=()=>setExpr(k,6);row.appendChild(b);} }
function flyIn(yoga=false){
  Object.values(actions).forEach(a=>a.stop());
  actions.fly.reset().setEffectiveWeight(1).play();
  state.cloudRise=-1; state.cloudDelay=0; state.mode='flying'; state.t=0; state.yoga=yoga; state.seated=false; state.poseW=0; state.armW=0; state.cloudK=0; state.turnT=-1;
  yogaCloud.visible=false; yogaCloud.scale.setScalar(0.001);
  setStatus(yoga?'flying to the cloud':'flying in'); setExpr('determined');
}
function startHover(){
  actions.fly.fadeOut(0.9);
  actions.hoverLow.reset().fadeIn(0.9).play(); actions.hoverUp.reset().fadeIn(0.9).play();
}
function upperAction(a,mode,expr){ if(state.mode==='flying'||state.mode==='braking') return;
  actions.hoverUp.fadeOut(0.4); actions.wave.stop(); actions.talk.stop(); a.reset().fadeIn(0.4).play();
  state.mode=mode; setStatus(mode); setExpr(expr); state.talkT=0; }
function playIntro(){ state.intro=true; state.introStep='fly'; state.introWait=1.0; flyIn(false); setExpr('happyOpen'); setStatus('intro: flying in'); }
// yoga: no fly-in. A cloud rises from below the frame, stops under him, then he settles onto it.
function sitOnCloud(){ if(state.seated||state.cloudRise>=0) return; state.turnT=-1; state.yoga=true; state.seated=true; state.mode='yoga'; setExpr(state.intro?'happyOpen':'zen'); yogaCloud.visible=false; state.cloudK=1; yogaCloud.scale.setScalar(1); state.cloudDelay=1.3; setStatus('into yoga pose'); }
document.getElementById('b-intro').onclick=()=>{ setTest('Intro'); playIntro(); };
document.getElementById('b-fly').onclick=()=>{ state.intro=false; setTest('Fly in'); flyIn(false); };
document.getElementById('b-yoga').onclick=()=>{ if(state.mode==='flying'||state.mode==='braking'||state.mode==='loading') return; state.intro=false; setTest('Yoga'); sitOnCloud(); };
document.getElementById('b-turn').onclick=()=>{ if(state.mode==='flying'||state.mode==='braking') return; setTest('Turn'); state.turnT=0; };
function setCam(c){ state.cam=c; document.getElementById('c-full').classList.toggle('on',c==='full'); document.getElementById('c-face').classList.toggle('on',c==='face'); }
document.getElementById('c-full').onclick=()=>setCam('full');
document.getElementById('c-face').onclick=()=>setCam('face');
document.getElementById('b-hide').onclick=()=>{ const p=document.getElementById('panel'); p.hidden=!p.hidden; document.getElementById('b-hide').textContent=p.hidden?'Show controls':'Hide controls'; };
document.getElementById('b-wave').onclick=()=>{ setTest('Wave'); upperAction(actions.wave,'waving','bigSmile'); };
document.getElementById('b-talk').onclick=()=>{ setTest('Talk'); upperAction(actions.talk,'talking','happy'); };
const REACT=['laughing','wink','surprised','skeptical','bigSmile','determined'];
function react(){ if(state.mode==='flying') return; if(state.seated){ setExpr(['laughing','wink','bigSmile','zen'][Math.floor(Math.random()*4)],2.2); return; } setExpr(REACT[Math.floor(Math.random()*REACT.length)],2.2); }
document.getElementById('b-react').onclick=react;
canvas.addEventListener('click',(e)=>{ if(cm.on){ commentAt(e); return; } react(); });
function onPointer(e){const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-(((e.clientY-r.top)/r.height)*2-1);pointer.has=true;pointer.lastMove=performance.now();}
window.addEventListener('pointermove',onPointer); window.addEventListener('pointerdown',onPointer);

// ---- per-frame helpers ----
const _q=new THREE.Quaternion(),_pq=new THREE.Quaternion(),_e=new THREE.Euler(),_v=new THREE.Vector3(),_up=new THREE.Vector3(0,-1,0);
function addWorldRot(bone,yaw,pitch){
  if(!bone) return; _e.set(pitch,yaw,0,'YXZ'); _q.setFromEuler(_e);
  bone.parent.getWorldQuaternion(_pq); const inv=_pq.clone().invert();
  const local=inv.multiply(_q).multiply(_pq); bone.quaternion.premultiply(local); bone.updateMatrixWorld(true);
}
const restPose=[];
let aim={x:0,y:0}, tilt={x:0,y:0,z:0}, trackW=0;
const ease=t=>1-Math.pow(1-t,3), easeIO=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const START=new THREE.Vector3(2.5,5.5,-70), HOME=new THREE.Vector3(0,0,0);
const clock=new THREE.Clock();
const camFull={pos:new THREE.Vector3(0.25,1.2,6.4),target:new THREE.Vector3(0,1.02,0)};
const camNowTarget=camFull.target.clone();
let twosAcc=0;
const YOGA_DROP=-0.36;

// lotus / easy-pose: aim each limb bone along a direction given in the character's own frame (+x his left, +y up, +z forward)
const _tq=new THREE.Quaternion(),_a=new THREE.Vector3(),_b=new THREE.Vector3(),_rq=new THREE.Quaternion(),_wq=new THREE.Quaternion(),_id=new THREE.Quaternion();
function aimBone(bone,child,dir,w){
  if(!bone||!child||w<=0.001) return;
  bone.getWorldPosition(_a); child.getWorldPosition(_b); _b.sub(_a).normalize();
  const t=dir.clone().normalize().applyQuaternion(_rq);
  _tq.setFromUnitVectors(_b,t); _wq.slerpQuaternions(_id,_tq,w);
  bone.parent.getWorldQuaternion(_pq); const inv=_pq.clone().invert();
  bone.quaternion.premultiply(inv.multiply(_wq).multiply(_pq)); bone.updateMatrixWorld(true);
}
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const LEG={topThighY:-0.02,topShinY:0.13,topShinZ:-0.26,botShinY:-0.13,botShinZ:-0.5};
const POSE_SPINE=[['mixamorigSpine','mixamorigSpine1',V(0,1,0.02),0.7],['mixamorigSpine1','mixamorigSpine2',V(0,1,0.03),0.7],['mixamorigSpine2','mixamorigNeck',V(0,1,0.06),0.7]];
const POSE_TOP=[ // right leg: folds first and rides on top (knee a little higher, shin lifted over the left shin)
  ['mixamorigRightUpLeg','mixamorigRightLeg',V(-0.69,LEG.topThighY,0.72),1],['mixamorigRightLeg','mixamorigRightFoot',V(0.9,LEG.topShinY,LEG.topShinZ),1],['mixamorigRightFoot','mixamorigRightToeBase',V(0.82,0.2,0.53),1]];
const POSE_BOT=[ // left leg: tucks in underneath
  ['mixamorigLeftUpLeg','mixamorigLeftLeg',V(0.71,-0.16,0.69),1],['mixamorigLeftLeg','mixamorigLeftFoot',V(-0.9,LEG.botShinY,LEG.botShinZ),1],['mixamorigLeftFoot','mixamorigLeftToeBase',V(-0.86,0.06,0.5),1]];
const POSE_LEGS=[...POSE_SPINE,...POSE_TOP,...POSE_BOT];
const POSE_ARMS=[
  ['mixamorigLeftArm','mixamorigLeftForeArm',V(0.34,-0.9,0.26),1],['mixamorigLeftForeArm','mixamorigLeftHand',V(0.42,-0.36,0.83),1],['mixamorigLeftHand','mixamorigLeftHandMiddle1',V(0.55,-0.25,0.8),1],
  ['mixamorigRightArm','mixamorigRightForeArm',V(-0.34,-0.9,0.26),1],['mixamorigRightForeArm','mixamorigRightHand',V(-0.42,-0.36,0.83),1],['mixamorigRightHand','mixamorigRightHandMiddle1',V(-0.55,-0.25,0.8),1]];
function applyPose(list,w){ root.getWorldQuaternion(_rq); for(const [b,c,d,k] of list) aimBone(bones[b],bones[c],d,w*k); }
const _p1=new THREE.Vector3(),_p2=new THREE.Vector3(),_p3=new THREE.Vector3(),_p4=new THREE.Vector3();
function aimBoneAt(bone,child,targetW,w){ if(!bone||!child||w<=0.001) return; bone.getWorldPosition(_a); child.getWorldPosition(_b); _b.sub(_a).normalize();
  const t=targetW.clone().sub(_a).normalize(); _tq.setFromUnitVectors(_b,t); _wq.slerpQuaternions(_id,_tq,w);
  bone.parent.getWorldQuaternion(_pq); const inv=_pq.clone().invert(); bone.quaternion.premultiply(inv.multiply(_wq).multiply(_pq)); bone.updateMatrixWorld(true); }
// roll a hand about its own axis so the palm faces up, then touch thumb and index (chin/jnana mudra)
function mudra(side,w){ const S=side==='L'?'Left':'Right', B=n=>bones['mixamorig'+S+'Hand'+n];
  const hand=bones['mixamorig'+S+'Hand']; if(!hand||!B('Middle1')||!B('Index1')||!B('Pinky1')) return;
  hand.getWorldPosition(_p1); B('Middle1').getWorldPosition(_p2); B('Index1').getWorldPosition(_p3); B('Pinky1').getWorldPosition(_p4);
  const ax=_p2.clone().sub(_p1).normalize(), across=_p3.clone().sub(_p4).normalize();
  let n=ax.clone().cross(across).normalize(); if(side==='R') n.negate(); n.multiplyScalar(PALM_SIGN);
  const up=new THREE.Vector3(0,1,0).applyQuaternion(_rq);
  const pn=n.clone().sub(ax.clone().multiplyScalar(n.dot(ax))).normalize(), pu=up.clone().sub(ax.clone().multiplyScalar(up.dot(ax))).normalize();
  let ang=Math.acos(Math.max(-1,Math.min(1,pn.dot(pu)))); if(pn.clone().cross(pu).dot(ax)<0) ang=-ang;
  _tq.setFromAxisAngle(ax,ang*w); hand.parent.getWorldQuaternion(_pq); const inv=_pq.clone().invert(); hand.quaternion.premultiply(inv.multiply(_tq).multiply(_pq)); hand.updateMatrixWorld(true);
  // thumb tip and index tip meet in a ring
  const tipT=B('Thumb4')||B('Thumb3'), tipI=B('Index4')||B('Index3'); if(!tipT||!tipI) return;
  tipT.getWorldPosition(_p1); tipI.getWorldPosition(_p2); const meet=_p1.clone().lerp(_p2,0.5);
  for(const k of [1,2,3]){ const b=B('Index'+k), c=B('Index'+(k+1)); if(b&&c) aimBoneAt(b,c,meet,w*0.8); }
  for(const k of [2,3]){ const b=B('Thumb'+k), c=B('Thumb'+(k+1)); if(b&&c){ tipI.getWorldPosition(_p2); aimBoneAt(b,c,meet,w*0.8);} }
}
let PALM_SIGN=1;

function frame(){
  const rdt=clock.getDelta(); const realDt=Math.min(rdt,0.05); const now=performance.now()/1000;
  // Spider-Verse: character animates "on twos" (12 fps holds); camera, flames and sky stay smooth
  let dt=realDt, step=true;
  if(look==='spider'){ twosAcc+=realDt; if(twosAcc<1/12) step=false; else { dt=Math.min(twosAcc,0.12); twosAcc=0; } } else twosAcc=0;
  if(mixer && step){
    // flight path
    if(state.mode==='flying'||state.mode==='braking'){
      state.t+=Math.min(look==='spider'?dt:rdt,0.25); const T=2.8; const u=Math.min(state.t/T,1); const e=ease(u);
      root.position.lerpVectors(START,HOME,e); root.position.y+=Math.sin(u*Math.PI)*0.6;
      root.rotation.set(0,0,Math.sin(u*Math.PI)*-0.12);
      if(state.mode==='flying'&&state.t>1.75){ state.mode='braking'; startHover(); setExpr('surprised'); setStatus('braking'); }
      state.thrust = state.t<1.75?1.5:(state.t<3.2?2.3:1.0);
      if(state.yoga){ if(state.t>1.9){ yogaCloud.visible=true; state.cloudK=Math.min(1,state.cloudK+dt*0.9); }
        if(state.t>2.6){ state.seated=true; } }
      if(state.t>T+0.6){ if(state.yoga){ state.mode='yoga'; setStatus('meditating'); setExpr('zen'); } else { state.mode='hover'; setStatus('hovering'); setExpr('happy'); } }
    } else {
      root.position.x+=(HOME.x-root.position.x)*(1-Math.exp(-dt*3)); root.position.z+=(HOME.z-root.position.z)*(1-Math.exp(-dt*3));
      root.position.y = state.seated ? Math.sin(now*1.1)*0.03 : Math.sin(now*1.6)*0.045;
      const tgt = state.seated?0.0:1.0;
      state.thrust+= (tgt-state.thrust)*Math.min(1,dt*(state.seated?3:2));
    }
    // seat weights
    const seatTarget=state.seated?1:0, armTarget=(state.seated&&state.mode!=='waving'&&state.mode!=='talking')?1:0;
    state.poseW+=(seatTarget-state.poseW)*Math.min(1,dt*2.4); state.armW+=(armTarget-state.armW)*Math.min(1,dt*2.4);
    root.position.y += YOGA_DROP*state.poseW;
    if(yogaCloud.visible&&state.mode==='yoga'&&state.cloudK<1) state.cloudK=Math.min(1,state.cloudK+dt*0.9);
    if(state.cloudDelay>0){ state.cloudDelay-=dt; if(state.cloudDelay<=0){ state.cloudRise=0; yogaCloud.visible=true; yogaCloud.position.y=-3.6; setStatus('cloud rising'); } }
    if(yogaCloud.visible){ const k=state.cloudK; const sk=k<1?ease(k)*(1+0.08*Math.sin(k*Math.PI)):1; yogaCloud.scale.setScalar(Math.max(0.001,sk)); if(state.cloudRise>=0){ state.cloudRise+=dt; const u=Math.min(1,state.cloudRise/1.6), e=1-Math.pow(1-u,3); yogaCloud.position.y=-3.6+(0.8+3.6)*e; if(u>=1){ state.cloudRise=-1; setStatus('meditating'); } } else yogaCloud.position.y=0.8; }

    for(const [b,q,p] of restPose){ b.quaternion.copy(q); b.position.copy(p); }
    mixer.update(dt);
    root.updateMatrixWorld(true);
    // seated: legs and hips ignore the hover animation entirely (blend back to the still rest pose), so the folded legs and feet stay locked
    if(state.poseW>0.002){ for(const [b,q,pp] of restPose){ if(/Hips|UpLeg|Leg$|Foot|Toe/.test(b.name)){ b.quaternion.slerp(q,Math.min(1,state.poseW*1.2)); if(/Hips/.test(b.name)) b.position.lerp(pp,Math.min(1,state.poseW*1.2)); } } root.updateMatrixWorld(true); }
    if(state.poseW>0.002){ const sm=t=>t<=0?0:t>=1?1:t*t*(3-2*t); const pw=state.poseW;
      applyPose(POSE_SPINE,pw); applyPose(POSE_TOP,sm(pw*1.8)); applyPose(POSE_BOT,sm(pw*1.8-0.65)); const aw=Math.min(state.poseW,state.armW); applyPose(POSE_ARMS,aw); if(aw>0.01){ mudra('L',aw); mudra('R',aw);} }

    // intro sequencer
    if(state.intro){ if(state.introStep==='fly'&&state.mode==='hover'){ state.introWait=(state.introWait??1.0)-dt; if(state.introWait<=0){ state.introStep='turn'; state.turnT=0; setStatus('intro: turnaround'); } }
      else if(state.introStep==='cloud'){ state.introWait-=dt; if(state.introWait<=0){ state.introStep='done'; sitOnCloud(); } } }
    // turnaround: swing to the back (show the jet pack), hold, come back round
    let turnYaw=0;
    if(state.turnT>=0){ state.turnT+=dt; const a=1.5,h=1.8,t=state.turnT;
      turnYaw = t<a? Math.PI*easeIO(t/a) : t<a+h? Math.PI : t<2*a+h? Math.PI+Math.PI*easeIO((t-a-h)/a) : 0;
      if(t>=2*a+h){ state.turnT=-1; turnYaw=0; if(state.intro&&state.introStep==='turn'){ state.introStep='cloud'; state.introWait=0.5; } }
      setStatus(state.turnT<0?(state.seated?'meditating':'hovering'):'turning'); }

    // pointer / idle look target
    let tx,ty; const idle=!pointer.has||performance.now()-pointer.lastMove>4000;
    if(idle){ tx=Math.sin(now*0.37)*0.5; ty=Math.sin(now*0.23)*0.25; } else { tx=pointer.x; ty=pointer.y; }
    aim.x+=(tx-aim.x)*Math.min(1,dt*5); aim.y+=(ty-aim.y)*Math.min(1,dt*5);
    const tracking = state.mode==='flying'?0:(state.turnT>=0?0.15:(state.seated?0.45:1)); trackW+=(tracking-trackW)*Math.min(1,dt*2);
    const yaw=aim.x*0.65*trackW, pitch=-aim.y*0.35*trackW;
    addWorldRot(bones.mixamorigSpine2,yaw*0.2,pitch*0.15);
    addWorldRot(bones.mixamorigNeck,yaw*0.3,pitch*0.35);
    addWorldRot(bones.mixamorigHead,yaw*0.5,pitch*0.5);
    // body tilt toward pointer
    if(state.mode!=='flying'&&state.mode!=='braking'){
      const tk=state.turnT>=0?0:(state.seated?0:1);
      tilt.y+=(aim.x*0.28*tk-tilt.y)*Math.min(1,dt*3); tilt.x+=(-aim.y*0.06*tk-tilt.x)*Math.min(1,dt*3); tilt.z+=(-aim.x*0.07*tk-tilt.z)*Math.min(1,dt*3);
      root.rotation.set(tilt.x,tilt.y+turnYaw,tilt.z);
    }
    // scarf sway (kept small and mostly away from the chest)
    const sv=Math.sin(now*4.2), sw=Math.sin(now*3.1+1.1), sa=state.seated?0.5:1;
    if(bones.ScarfTail1){ addWorldRot(bones.ScarfTail1,sw*0.04*sa,(0.015+0.02*sv)*sa); addWorldRot(bones.ScarfTail2,sw*0.05*sa,(0.02+0.03*Math.sin(now*4.2-0.8))*sa); }

    // expressions
    if(state.exprHold>0){ state.exprHold-=dt; if(state.exprHold<=0) setExpr(state.seated?'zen':'happy'); }
    if(state.mode==='talking'){ state.talkT+=dt; shapeTarget.JawOpen=Math.max(0,0.25+0.25*Math.sin(state.talkT*13)*Math.sin(state.talkT*5.3)); }
    for(const k of Object.keys(shapeTarget)){ shapeNow[k]=(shapeNow[k]||0)+((shapeTarget[k]||0)-(shapeNow[k]||0))*Math.min(1,dt*9); }
    for(const m of morphMeshes){ const d=m.morphTargetDictionary; for(const k in d){ m.morphTargetInfluences[d[k]]=shapeNow[k]||0; } }
    // blinks
    autoBlinkT-=dt; let auto=0; if(autoBlinkT<0){ auto=Math.max(0,1-Math.abs(autoBlinkT+0.08)/0.08); if(autoBlinkT<-0.16) autoBlinkT=2.5+Math.random()*3; }
    blinkL+=(blinkTargetL-blinkL)*Math.min(1,dt*14); blinkR+=(blinkTargetR-blinkR)*Math.min(1,dt*14);
    const el=state.exprLook||[0,0];
    lookX+=(Math.max(-1,Math.min(1,aim.x*0.9+el[0]))-lookX)*Math.min(1,dt*10);
    lookY+=(Math.max(-1,Math.min(1,aim.y*0.7+el[1]))-lookY)*Math.min(1,dt*10);
    if(eyeMat?.userData.u){const u=eyeMat.userData.u; u.blinkL.value=Math.max(blinkL,auto); u.blinkR.value=Math.max(blinkR,auto); u.lookX.value=lookX; u.lookY.value=lookY;}

    // hand jets are stabilizers: off in cruise, full burn while braking, short puffs when he shifts balance; off when seated
    let gL=0,gR=0;
    if(state.mode==='braking'){ const k=state.t<3.2?2.3:Math.max(0,2.3-(state.t-3.2)*4); gL=gR=k*(state.seated?Math.max(0,1-state.poseW*1.5):1); }
    else if(state.mode!=='flying'&&!state.seated){
      const vz=(tilt.z-hand.prevTz)/Math.max(dt,1e-3);
      const a=Math.min(1.3,Math.max(0,Math.abs(vz)-0.015)*16);
      if(vz>0) gR=a; else gL=a;
      hand.puffT-=dt; if(hand.puffT<0){ hand.puffT=2.5+Math.random()*4; hand.puffLeft=0.28+Math.random()*0.2; hand.puffSide=Math.random()<0.5?'L':'R'; }
      if(hand.puffLeft>0){ hand.puffLeft-=dt; const k=0.9*Math.sin(Math.PI*Math.max(0,hand.puffLeft)/0.45); if(hand.puffSide==='L') gL=Math.max(gL,k); else gR=Math.max(gR,k); }
      if(state.turnT>=0){ gL=Math.max(gL,0.5); gR=Math.max(gR,0.5); } // steady counter-thrust while he spins
    }
    hand.prevTz=tilt.z;
    hand.L+=(gL-hand.L)*Math.min(1,dt*(gL>hand.L?14:6)); hand.R+=(gR-hand.R)*Math.min(1,dt*(gR>hand.R?14:6));
    root.updateMatrixWorld(true);
  }
  if(mixer){
    // flames follow nozzles (every frame, so they stay smooth even when the body holds on twos)
    let hl=new THREE.Vector3(), n=0, fl2=new THREE.Vector3(), m2=0;
    for(const fl of flames){ if(!fl.node) continue;
      fl.node.getWorldPosition(_v); fl.f.position.copy(_v);
      fl.f.quaternion.setFromUnitVectors(_up,fl.dir.clone().applyQuaternion(root.quaternion));
      const flick=1+0.12*Math.sin(now*29+fl.ph)+0.08*Math.sin(now*61+fl.ph*2);
      const isL=fl.node===palmNodes.L, isR=fl.node===palmNodes.R;
      const packI = state.mode==='flying'?1.7:(state.mode==='braking'?1.3:(state.seated?0.85:1.0));
      const base=fl.pack?packI:(isL?hand.L:isR?hand.R:state.thrust); fl.f.visible=base>0.03;
      const I=base*flick; const {o,i,s,mo,mi,len,rad}=fl.f.userData;
      o.scale.y=len*I; i.scale.y=len*0.6*I; s.scale.setScalar(rad*(2.2+0.8*I)); s.material.opacity=Math.min(0.8,0.3+0.18*I);
      mo.uniforms.uT.value=now+fl.ph; mi.uniforms.uT.value=now+fl.ph; mo.uniforms.uI.value=Math.min(1.4,0.8+0.25*I); mi.uniforms.uI.value=Math.min(1.5,0.9+0.3*I);
      if(isL||isR){hl.add(_v);n++;} else if(!fl.pack){fl2.add(_v);m2++;}
    }
    if(n&&state.handLight){hl.multiplyScalar(1/n);hl.y-=0.15;state.handLight.position.copy(hl);state.handLight.intensity=0.05*(hand.L+hand.R)*state.glow;}
    if(m2&&state.footLight){fl2.multiplyScalar(1/m2);fl2.y-=0.25;state.footLight.position.copy(fl2);state.footLight.intensity=(state.glow>2?0.09:0.0)*state.thrust*state.glow*0.25;}
    // camera: full body or face close-up (follows the head, works seated and while turning)
    const k=1-Math.exp(-realDt*3.2);
    if(state.cam==='face'&&bones.mixamorigHead){ bones.mixamorigHead.getWorldPosition(_v); _v.y+=0.09;
      camNowTarget.lerp(_v,k); camera.position.lerp(_b.set(_v.x+0.06,_v.y+0.02,_v.z+0.78),k); }
    else { camNowTarget.lerp(camFull.target,k); camera.position.lerp(camFull.pos,k); }
  }
  for(const c of clouds){ c.position.x+=realDt*0.25; if(c.position.x>40) c.position.x=-40; }
  camera.lookAt(camNowTarget);
  renderer.render(scene,camera); reportPins(false); requestAnimationFrame(frame);
}
function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);renderer.getDrawingBufferSize(INK_RES.value);camera.aspect=w/h;
  if(w>=900){ camera.setViewOffset(w,h,170,0,w,h); } else camera.setViewOffset(w,h,0,Math.round(h*0.17),w,h);
  camera.fov = w<h?42:30; camFull.pos.z = w<h?7.4:6.4; if(state.cam!=='face') camera.position.copy(camFull.pos); camera.updateProjectionMatrix();}
addEventListener('resize',resize); try{ new ResizeObserver(resize).observe(HOST); }catch(_){} resize(); requestAnimationFrame(frame);
