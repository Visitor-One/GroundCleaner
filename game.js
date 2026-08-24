const C=document.getElementById("world"),X=C.getContext("2d");
const menu=document.getElementById("menu"),game=document.getElementById("game");
const names=["N","NE","E","SE","S","SW","W","NW"];
const imgs={}; let ready=0;
function load(k,f){let i=new Image();i.src=f;i.onload=()=>ready++;imgs[k]=i}
load("bg","garden_background.png");load("bin","bin.png");load("binfull","bin_full.png");
load("tree","tree.png");load("bush","bush_green.png");load("flowers","bush_flowers.png");
load("bed","flower_bed.png");load("wheel","wheelbarrow.png");load("pool","birdbath_pool.png");
load("bench","bench.png");load("lamp","lantern.png");load("mail","mailbox.png");
load("fence","fence_straight.png");load("gateL","gate_left.png");load("gateR","gate_right.png");
for(let n of names){load("p"+n,"player_"+n+".png");load("t"+n,"truck_"+n+".png")}
for(let i=1;i<=4;i++)load("l"+i,"leaf_"+String(i).padStart(2,"0")+".png");

let running=false, score=0, binFill=0, held=0, dir="SE";
let p={x:690,y:600,s:220}, truck={active:false,t:0,x:-220,y:830,dir:"E"};
let leaves=[];
function reset(){
  score=binFill=held=0;p.x=690;p.y=600;dir="SE";
  leaves=Array.from({length:100},(_,i)=>({x:260+Math.random()*820,y:240+Math.random()*470,img:1+(i%4),live:true}));
  ui();
}
function ui(){leafCount.textContent=`🍂 ${held} / 100`;scoreEl.textContent=score;binFillEl.textContent=binFill}
const scoreEl=document.getElementById("score"),binFillEl=document.getElementById("binFill");
function chooseDir(dx,dy){if(Math.hypot(dx,dy)<.1)return dir;let a=Math.atan2(dy,dx)*180/Math.PI;let ix=Math.round((a+90)/45);return names[(ix+8)%8]}
function drawImg(im,x,y,w,h){if(im&&im.complete)X.drawImage(im,x-w/2,y-h,w,h)}
function render(){
  X.clearRect(0,0,1536,1024); if(imgs.bg.complete)X.drawImage(imgs.bg,0,0,1536,1024);
  // Every visible game object below is a PNG sprite; Canvas only composites images.
  let q=[];
  for(let l of leaves)if(l.live)q.push({y:l.y,fn:()=>drawImg(imgs["l"+l.img],l.x,l.y,36,36)});
  q.push({y:300,fn:()=>drawImg(imgs.bench,330,300,220,175)});
  q.push({y:335,fn:()=>drawImg(imgs.pool,1035,335,190,125)});
  q.push({y:390,fn:()=>drawImg(imgs.wheel,890,390,210,160)});
  q.push({y:475,fn:()=>drawImg(imgs.tree,1215,475,300,360)});
  q.push({y:510,fn:()=>drawImg(imgs.flowers,250,510,190,150)});
  q.push({y:560,fn:()=>drawImg(imgs.bush,390,560,180,140)});
  q.push({y:725,fn:()=>drawImg(imgs.gateL,930,725,180,190)});
  q.push({y:725,fn:()=>drawImg(imgs.gateR,1225,725,180,190)});
  q.push({y:730,fn:()=>drawImg(imgs.mail,1380,730,110,160)});
  q.push({y:670,fn:()=>drawImg(binFill>=95?imgs.binfull:imgs.bin,1030,670,110,150)});
  q.push({y:p.y,fn:()=>drawImg(imgs["p"+dir],p.x,p.y,120,180)});
  if(truck.active)q.push({y:truck.y,fn:()=>drawImg(imgs["t"+truck.dir],truck.x,truck.y,300,190)});
  q.sort((a,b)=>a.y-b.y);q.forEach(o=>o.fn());
}
let last=performance.now(),joy={x:0,y:0};
function loop(t){let dt=Math.min(.033,(t-last)/1000);last=t;if(running)update(dt);render();requestAnimationFrame(loop)}
function update(dt){
  if(Math.hypot(joy.x,joy.y)>.08){
    let dx=joy.x*p.s*dt,dy=joy.y*p.s*dt;p.x=Math.max(80,Math.min(1450,p.x+dx));p.y=Math.max(160,Math.min(900,p.y+dy));dir=chooseDir(joy.x,joy.y);
  }
  for(let l of leaves)if(l.live&&Math.hypot(l.x-p.x,l.y-p.y)<42){l.live=false;held++;score++;ui()}
  if(Math.hypot(p.x-1030,p.y-670)<70&&held){let put=Math.min(100-binFill,held);binFill+=put;held-=put;ui();if(binFill>=100&&!truck.active){truck.active=true;truck.t=0}}
  if(truck.active){truck.t+=dt;let t=truck.t;
    if(t<4){let u=t/4;truck.x=-180+u*1120;truck.y=850-70*Math.sin(u*Math.PI);truck.dir="E"}
    else if(t<6){truck.x=940;truck.y=850;truck.dir="NE";if(t>5.2)binFill=0,ui()}
    else if(t<10){let u=(t-6)/4;truck.x=940-u*1120;truck.y=850+40*Math.sin(u*Math.PI);truck.dir="W"}
    else truck.active=false;
  }
}
document.getElementById("start").onclick=()=>{menu.classList.add("hidden");game.classList.remove("hidden");reset();running=true};
document.getElementById("menuBtn").onclick=()=>{running=false;game.classList.add("hidden");menu.classList.remove("hidden")};

const joyEl=document.getElementById("joy"),stick=document.getElementById("stick");
let pid=null;
function setJoy(e){let r=joyEl.getBoundingClientRect(),x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2),m=Math.hypot(x,y),max=52;if(m>max){x=x/m*max;y=y/m*max}joy.x=x/max;joy.y=y/max;stick.style.transform=`translate(${x}px,${y}px)`}
joyEl.onpointerdown=e=>{pid=e.pointerId;joyEl.setPointerCapture(pid);setJoy(e)};
joyEl.onpointermove=e=>{if(e.pointerId===pid)setJoy(e)};
function end(e){if(e.pointerId!==pid)return;pid=null;joy.x=joy.y=0;stick.style.transform="translate(0,0)"}
joyEl.onpointerup=end;joyEl.onpointercancel=end;
requestAnimationFrame(loop);