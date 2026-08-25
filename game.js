const ASSET_VERSION="v470",c=document.getElementById("world"),ctx=c.getContext("2d"),I={},D=["N","NE","E","SE","S","SW","W","NW"];
function L(k,f){let i=new Image;i.src=f+"?v="+ASSET_VERSION;I[k]=i}L("bg","garden_background.png");["tree","bush_green","bush_flowers","flower_bed","wheelbarrow","birdbath_pool","bench","lantern","gate_left","gate_right","mailbox","bin","bin_full"].forEach(n=>L(n,n+".png"));D.forEach(d=>{L("p"+d,"player_"+d+".png");L("t"+d,"truck_"+d+".png")});for(let i=1;i<=4;i++)L("l"+i,"leaf_0"+i+".png");
let running=false,paused=false,joy={x:0,y:0},p={x:720,y:590,d:"S"},leaves=[],scoreN=0,totalPoints=0,binN=0,emptiedN=0,truck={on:false,x:-250,y:840,d:"E",t:0};
function spr(im,x,y,w,h){if(im?.complete&&im.naturalWidth)ctx.drawImage(im,x-w/2,y-h,w,h)}
function dir(x,y){if(Math.hypot(x,y)<.1)return p.d;let a=(Math.atan2(y,x)*180/Math.PI+360)%360;return D[Math.round((a+90)/45)%8]}
function reset(){scoreN=totalPoints=binN=emptiedN=0;p={x:720,y:590,d:"S"};leaves=Array.from({length:100},(_,i)=>({x:280+Math.random()*900,y:260+Math.random()*450,k:i%4+1,on:true}));ui()}
function ui(){leafCount.textContent=scoreN;score.textContent=totalPoints;binFill.textContent=binN;taskLeaves.textContent=totalPoints;taskBin.textContent=binN;empties.textContent=emptiedN;leafBar.style.width=Math.min(100,totalPoints)+"%";binBar.style.width=Math.min(100,binN)+"%"}

const fixed=[];

// V4.7 world collision map. Coordinates use the 1536x1024 game world.
const BLOCKS=[
  // house / terrace
  {x:190,y:70,w:500,h:320},
  // left flower beds / fence
  {x:45,y:280,w:360,h:205},
  {x:45,y:515,w:395,h:180},
  // lower-left border/fence
  {x:40,y:780,w:620,h:170},
  // rear fence and planting strip
  {x:570,y:75,w:760,h:115},
  // right planting/fence strip
  {x:1265,y:115,w:215,h:535},
  // front/right fence (leave driveway opening)
  {x:1130,y:635,w:355,h:155},
  // gate pillars / gate wings
  {x:650,y:665,w:95,h:155},
  {x:1015,y:640,w:145,h:165},
  // mailbox
  {x:985,y:545,w:60,h:90},
  // big tree trunk only: crown remains walk-behind capable
  {x:1120,y:300,w:105,h:105},
  // lower-left tree trunk
  {x:120,y:690,w:95,h:90}
];

function blocked(x,y){
  const r=20; // player's foot collision radius
  return BLOCKS.some(b=>x+r>b.x && x-r<b.x+b.w && y+r>b.y && y-r<b.y+b.h);
}
function movePlayer(dx,dy){
  let nx=Math.max(70,Math.min(1460,p.x+dx));
  let ny=Math.max(150,Math.min(920,p.y+dy));
  // axis-separated movement allows sliding along obstacles
  if(!blocked(nx,p.y)) p.x=nx;
  if(!blocked(p.x,ny)) p.y=ny;
}

// Foreground crops from the adopted background.
// They are redrawn only when the player is geometrically behind them.
// This gives real occlusion even while these objects are still baked into the current background.
const OCCLUDERS=[
  {x:1030,y:105,w:300,h:360,depthY:405}, // large right tree
  {x:35,y:590,w:205,h:290,depthY:790},   // lower-left tree
  {x:625,y:620,w:150,h:225,depthY:790},  // left gate/pillar
  {x:990,y:585,w:205,h:225,depthY:760}   // right gate/pillar
];
function redrawOccluders(){
  if(!I.bg?.complete) return;
  for(const o of OCCLUDERS){
    // Smaller Y = farther "behind" in the isometric scene.
    if(p.y < o.depthY && p.x > o.x-45 && p.x < o.x+o.w+45){
      ctx.drawImage(I.bg,o.x,o.y,o.w,o.h,o.x,o.y,o.w,o.h);
    }
  }
}

function draw(){ctx.clearRect(0,0,1536,1024);if(I.bg?.complete)ctx.drawImage(I.bg,0,0,1536,1024);let q=[];fixed.forEach(o=>q.push({y:o[2],f:()=>spr(I[o[0]],o[1],o[2],o[3],o[4])}));leaves.forEach(l=>l.on&&q.push({y:l.y,f:()=>spr(I["l"+l.k],l.x,l.y,35,35)}));q.push({y:p.y,f:()=>spr(I["p"+p.d],p.x,p.y,110,170)});if(truck.on)q.push({y:truck.y,f:()=>spr(I["t"+truck.d],truck.x,truck.y,290,190)});q.sort((a,b)=>a.y-b.y).forEach(o=>o.f());redrawOccluders()}
let last=performance.now();function loop(t){let dt=Math.min(.033,(t-last)/1000);last=t;if(running&&!paused)update(dt);draw();requestAnimationFrame(loop)}
function update(dt){if(Math.hypot(joy.x,joy.y)>.1){movePlayer(joy.x*220*dt,joy.y*220*dt);p.d=dir(joy.x,joy.y)}leaves.forEach(l=>{if(l.on&&Math.hypot(l.x-p.x,l.y-p.y)<38){l.on=false;scoreN++;totalPoints++;ui()}});if(Math.hypot(p.x-1035,p.y-690)<60&&scoreN){let n=Math.min(100-binN,scoreN);binN+=n;scoreN-=n;ui();if(binN>=100&&!truck.on)truck={on:true,x:-250,y:840,d:"E",t:0}}if(truck.on){truck.t+=dt;if(truck.t<4){let u=truck.t/4;truck.x=-250+u*1200;truck.y=850;truck.d="E"}else if(truck.t<6){truck.x=950;truck.d="NE";if(truck.t>5&&binN){binN=0;emptiedN++;ui()}}else if(truck.t<10){let u=(truck.t-6)/4;truck.x=950-u*1200;truck.d="W"}else truck.on=false}}
start.onclick=()=>{menu.classList.add("hidden");game.classList.remove("hidden");reset();running=true};menuBtn.onclick=()=>{running=false;game.classList.add("hidden");menu.classList.remove("hidden")};
const J=document.getElementById("joy"),S=document.getElementById("stick");let pid=null;function move(e){let r=J.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,m=Math.hypot(x,y),mx=52;if(m>mx){x=x/m*mx;y=y/m*mx}joy={x:x/mx,y:y/mx};S.style.transform=`translate(${x}px,${y}px)`}J.onpointerdown=e=>{pid=e.pointerId;J.setPointerCapture(pid);move(e)};J.onpointermove=e=>{if(e.pointerId===pid)move(e)};function end(e){if(e.pointerId!==pid)return;pid=null;joy={x:0,y:0};S.style.transform=""}J.onpointerup=end;J.onpointercancel=end;requestAnimationFrame(loop);
pause.onclick=()=>{paused=!paused;pause.innerHTML=(paused?"▶":"Ⅱ")+"<small>"+(paused?"WEITER":"PAUSE")+"</small>"};
