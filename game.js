const ASSET_VERSION="v530",c=document.getElementById("world"),ctx=c.getContext("2d"),I={},D=["N","NE","E","SE","S","SW","W","NW"];
function L(k,f){let i=new Image;i.src=f+"?v="+ASSET_VERSION;I[k]=i}L("bg","garden_background.png");["tree","bush_green","bush_flowers","flower_bed","wheelbarrow","birdbath_pool","bench","lantern","gate_left","gate_right","mailbox","bin","bin_full"].forEach(n=>L(n,n+".png"));D.forEach(d=>{L("p"+d,"player_"+d+".png");L("t"+d,"truck_"+d+".png")});for(let i=1;i<=4;i++)L("l"+i,"leaf_0"+i+".png");
let running=false,paused=false,joy={x:0,y:0},p={x:720,y:590,d:"S"},leaves=[],scoreN=0,totalPoints=0,binN=0,emptiedN=0,truck={on:false,x:-250,y:840,d:"E",t:0};
function spr(im,x,y,w,h){if(im?.complete&&im.naturalWidth){ctx.save();ctx.globalAlpha=1;ctx.drawImage(im,x-w/2,y-h,w,h);ctx.restore()}}
function dir(x,y){if(Math.hypot(x,y)<.1)return p.d;let a=(Math.atan2(y,x)*180/Math.PI+360)%360;return D[Math.round((a+90)/45)%8]}
function pointInBlock(x,y,b){return x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.h}
function nearSegment(px,py,x1,y1,x2,y2,r){
  const vx=x2-x1,vy=y2-y1,wx=px-x1,wy=py-y1;
  const c1=vx*wx+vy*wy,c2=vx*vx+vy*vy;
  const t=Math.max(0,Math.min(1,c1/c2));
  return Math.hypot(px-(x1+t*vx),py-(y1+t*vy))<r;
}
function leafAllowed(x,y){
  // Nur innerhalb der tatsächlichen Rasenfläche des Grundstücks.
  if(x<285||x>1260||y<245||y>765)return false;
  if(y<330 && x<690)return false;       // Haus/Beet links oben
  if(y<390 && x<590)return false;
  if(y<470 && x<410)return false;       // linke Blumenbeete
  if(y>690 && x<390)return false;       // Beet/Zaun links unten
  if(y>720 && x>1080)return false;      // Einfahrt/Gehweg rechts unten
  if(x>1190 && y>575)return false;      // Zaun/Gehweg rechts
  if(BLOCKS.some(b=>pointInBlock(x,y,b)))return false;

  // Keine Blätter auf dem Steinweg zur Haustür.
  if(nearSegment(x,y,525,360,875,610,42))return false;

  // Keine Blätter auf Einfahrt, an Tor, Mülltonne, Baum oder Schubkarre.
  if(Math.hypot(x-955,y-690)<125)return false;
  if(Math.hypot(x-1125,y-425)<130)return false;
  if(Math.hypot(x-875,y-350)<110)return false;
  if(x>720 && y>610)return false;
  return true;
}
function seededRandom(seed){
  let s=seed>>>0;
  return ()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296}
}
function makeLeaves(n){
  // Absichtlich deterministisch: Blätter bleiben bei jedem Start an denselben Bodenpositionen.
  const rnd=seededRandom(5102026),a=[];let tries=0;
  while(a.length<n&&tries++<20000){
    const x=285+rnd()*975,y=245+rnd()*520;
    if(leafAllowed(x,y))a.push({x,y,k:1+(a.length%4),on:true});
  }
  return a;
}
function reset(){scoreN=totalPoints=binN=emptiedN=0;p={x:720,y:590,d:"S"};leaves=makeLeaves(100);ui()}
function ui(){leafCount.textContent=scoreN;score.textContent=totalPoints;binFill.textContent=binN;taskLeaves.textContent=totalPoints;taskBin.textContent=binN;empties.textContent=emptiedN;leafBar.style.width=Math.min(100,totalPoints)+"%";binBar.style.width=Math.min(100,binN)+"%"}

// V4.8: real dynamic world objects. No background-crop occlusion.
const fixed=[
  // [asset, anchorX, anchorY, drawWidth, drawHeight]
  ["wheelbarrow",875,350,175,132],
  ["tree",1125,425,245,300],
  ["bin",955,690,118,158]
];

// Collision rectangles are ground footprints only, never full sprite rectangles.
const BLOCKS=[
  // House body. Central entrance/steps corridor is deliberately open.
  {x:250,y:95,w:430,h:200},
  {x:250,y:295,w:205,h:78},
  {x:575,y:295,w:105,h:78},

  // Borders / flowerbeds / fences only.
  {x:0,y:225,w:270,h:175},
  {x:0,y:430,w:315,h:250},
  {x:0,y:790,w:610,h:234},
  {x:610,y:75,w:760,h:120},
  {x:1280,y:160,w:256,h:475},
  {x:1180,y:640,w:356,h:155},

  // Gate structures.
  {x:745,y:690,w:72,h:108},
  {x:1045,y:655,w:98,h:118},

  // Only physical footprints of dynamic objects.
  {x:1082,y:390,w:86,h:70},
  {x:838,y:323,w:76,h:52},
  {x:925,y:650,w:60,h:58}
];

function blocked(x,y){
  const r=18;
  return BLOCKS.some(b => x+r>b.x && x-r<b.x+b.w && y+r>b.y && y-r<b.y+b.h);
}
function movePlayer(dx,dy){
  const nx=Math.max(65,Math.min(1470,p.x+dx));
  const ny=Math.max(145,Math.min(930,p.y+dy));
  if(!blocked(nx,p.y)) p.x=nx;
  if(!blocked(p.x,ny)) p.y=ny;
}
function draw(){
  ctx.clearRect(0,0,1536,1024);
  if(I.bg?.complete && I.bg.naturalWidth) ctx.drawImage(I.bg,0,0,1536,1024);

  const q=[];

  // Separate transparent world sprites.
  fixed.forEach(o=>{
    const [name,x,y,w,h]=o;
    q.push({depth:y, f:()=>spr(I[name],x,y,w,h)});
  });

  // Leaves participate in the same depth system.
  leaves.forEach(l=>{
    if(l.on) q.push({depth:l.y, f:()=>spr(I["l"+l.k],l.x,l.y,30,18)});
  });

  // Player depth = feet/ground anchor.
  q.push({depth:p.y, f:()=>spr(I["p"+p.d],p.x,p.y,110,170)});

  // Truck depth = wheel/ground anchor.
  if(truck.on) q.push({depth:truck.y, f:()=>spr(I["t"+truck.d],truck.x,truck.y,290,190)});

  q.sort((a,b)=>a.depth-b.depth);
  q.forEach(o=>o.f());
}
let last=performance.now();function loop(t){let dt=Math.min(.033,(t-last)/1000);last=t;if(running&&!paused)update(dt);draw();requestAnimationFrame(loop)}
function update(dt){if(Math.hypot(joy.x,joy.y)>.1){movePlayer(joy.x*220*dt,joy.y*220*dt);p.d=dir(joy.x,joy.y)}leaves.forEach(l=>{if(l.on&&Math.hypot(l.x-p.x,l.y-p.y)<38){l.on=false;scoreN++;totalPoints++;ui()}});if(Math.hypot(p.x-955,p.y-690)<72&&scoreN){let n=Math.min(100-binN,scoreN);binN+=n;scoreN-=n;ui();if(binN>=100&&!truck.on)truck={on:true,x:-250,y:840,d:"E",t:0}}if(truck.on){truck.t+=dt;if(truck.t<4){let u=truck.t/4;truck.x=-250+u*1200;truck.y=850;truck.d="E"}else if(truck.t<6){truck.x=950;truck.d="NE";if(truck.t>5&&binN){binN=0;emptiedN++;ui()}}else if(truck.t<10){let u=(truck.t-6)/4;truck.x=950-u*1200;truck.d="W"}else truck.on=false}}
start.onclick=()=>{menu.classList.add("hidden");game.classList.remove("hidden");reset();running=true};menuBtn.onclick=()=>{running=false;game.classList.add("hidden");menu.classList.remove("hidden")};
const J=document.getElementById("joy"),S=document.getElementById("stick");let pid=null;function move(e){let r=J.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,m=Math.hypot(x,y),mx=52;if(m>mx){x=x/m*mx;y=y/m*mx}joy={x:x/mx,y:y/mx};S.style.transform=`translate(${x}px,${y}px)`}J.onpointerdown=e=>{pid=e.pointerId;J.setPointerCapture(pid);move(e)};J.onpointermove=e=>{if(e.pointerId===pid)move(e)};function end(e){if(e.pointerId!==pid)return;pid=null;joy={x:0,y:0};S.style.transform=""}J.onpointerup=end;J.onpointercancel=end;requestAnimationFrame(loop);
pause.onclick=()=>{paused=!paused;pause.innerHTML=(paused?"▶":"Ⅱ")+"<small>"+(paused?"WEITER":"PAUSE")+"</small>"};
