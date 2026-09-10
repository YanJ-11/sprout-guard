import { Game, PLANTS, LEVELS, BOARD } from './engine.js';
import { drawPlant, drawZombie, drawSun, drawMower, drawSticker } from './art.js';

const $ = id => document.getElementById(id);
const types = ['sunflower','peashooter','wallnut','snowpea','cherry'];
const store = {get(k,fallback){try{return JSON.parse(localStorage.getItem(`sprout.${k}`))??fallback}catch{return fallback}},set(k,v){try{localStorage.setItem(`sprout.${k}`,JSON.stringify(v))}catch{}}};
let game=null, selected=null, paused=false, view='home', hover=null, modalType='', returnFocus=null;
let completed=store.get('completed',[]), muted=!store.get('sound',false), audio=null;
let last=0, artTime=0, toastLeft=0, bannerLeft=0, flyers=[], hudStamp='';
const canvas=$('game-canvas'), ctx=canvas.getContext('2d'), hero=$('hero-canvas'), hctx=hero.getContext('2d');
const dpr=Math.min(devicePixelRatio||1,2);
canvas.width=1120*dpr;canvas.height=650*dpr;ctx.scale(dpr,dpr);
hero.width=700*dpr;hero.height=460*dpr;hctx.scale(dpr,dpr);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let background=null;

function rr(c,x,y,w,h,r,fill,stroke=null,lw=1){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke()}}
function ellipse(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill()}
function line(c,points,color,width=2){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke()}
function flower(c,x,y,s=1,color='#f3edcf'){c.save();c.translate(x,y);for(let i=0;i<5;i++){let a=i*Math.PI*2/5;ellipse(c,Math.cos(a)*4*s,Math.sin(a)*4*s,3*s,3*s,color)}ellipse(c,0,0,2*s,2*s,'#c5b277');c.restore()}
function shrub(c,x,y,s=1){ellipse(c,x,y,35*s,21*s,'#a8bb85');ellipse(c,x-24*s,y+7*s,24*s,16*s,'#b0c08d');ellipse(c,x+24*s,y+5*s,26*s,19*s,'#9bb47d')}
function fence(c,x,y,width,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);rr(c,0,-21,width/scale,9,3,'#efe8cf','#d7d2b4');for(let a=0;a<width/scale;a+=30){c.beginPath();c.moveTo(a,-35);c.lineTo(a+7,-43);c.lineTo(a+14,-35);c.lineTo(a+14,0);c.lineTo(a,0);c.closePath();c.fillStyle='#f8f1da';c.fill();c.strokeStyle='#d4ceb0';c.lineWidth=1.2;c.stroke()}c.restore()}
function house(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);rr(c,-53,-85,106,85,7,'#f5e6bb','#8a9272',2.2);c.beginPath();c.moveTo(-66,-83);c.quadraticCurveTo(0,-156,64,-83);c.closePath();c.fillStyle='#c5ac84';c.fill();c.strokeStyle='#87916e';c.lineWidth=3;c.stroke();rr(c,-35,-69,29,30,5,'#d0dbbb','#a9b493',2);line(c,[[-20,-68],[-20,-40]],'#f5e6bb',3);line(c,[[-34,-54],[-7,-54]],'#f5e6bb',3);rr(c,11,-49,27,49,[14,14,0,0],'#afbc8c','#8a9871',2);ellipse(c,30,-20,2,2,'#f5e2ad');rr(c,36,-127,15,34,2,'#b5a484','#87916e',2);c.restore()}

function renderHero(t){
  const c=hctx;c.clearRect(0,0,700,460);
  const grad=c.createRadialGradient(385,231,60,385,230,305);grad.addColorStop(0,'#e9eacd');grad.addColorStop(.75,'#f0f0dc');grad.addColorStop(1,'#f9f7ee00');c.fillStyle=grad;c.fillRect(0,0,700,460);
  drawSticker(c,'cloud',170+Math.sin(t*.2)*4,114,1.03,t);drawSticker(c,'cloud',529,109,.81,t);
  drawSun(c,439,66,27,t);c.save();c.globalAlpha=.3;ellipse(c,371,372,253,35,'#a3ad7b');c.restore();
  ellipse(c,376,322,270,82,'#c0cd9e');ellipse(c,375,308,267,76,'#cfdbad');
  shrub(c,191,240,.75);shrub(c,539,249,1);fence(c,206,250,327,.9);house(c,190,255,.78);
  c.save();c.beginPath();c.ellipse(376,306,250,64,0,0,Math.PI*2);c.clip();
  for(let row=0;row<4;row++)for(let col=0;col<8;col++){const x=132+col*65+(row%2)*14,y=256+row*29;c.fillStyle=(row+col)%2?'#c7d4a5':'#bccd97';c.fillRect(x,y,65,29)}c.restore();
  for(const [x,y,s] of [[148,322,.9],[257,366,.8],[436,367,.7],[593,322,.8],[578,285,.7],[345,245,.7],[308,360,.6]]){flower(c,x,y,s);line(c,[[x+11,y+5],[x+10,y],[x+14,y+3]],'#a2b586',1.5)}
  drawPlant(c,'sunflower',299,272,1.38,t);drawPlant(c,'peashooter',392,295,1.47,t);
  drawPlant(c,'wallnut',281,337,1.13,t);drawPlant(c,'sunflower',202,333,1.28,t+.8);
  drawZombie(c,'basic',534,319,1.49,t);drawPlant(c,'cherry',372,354,.72,t);
  drawSticker(c,'mushroom',134,285,.52,t);drawSticker(c,'heart',451,195,.42,t);
  for(let i=0;i<3;i++){const x=438+i*26;c.globalAlpha=.8-i*.13;ellipse(c,x,241-Math.sin(t*2+i)*1.7,5,5,'#a1bc78');ellipse(c,x-1.5,239,1.4,1.4,'#eff4d9')}c.globalAlpha=1;
  line(c,[[566,177],[568,167]],'#c3b176',2);line(c,[[562,172],[572,172]],'#c3b176',2);
}

function buildBackground(level){
  const bg=document.createElement('canvas');bg.width=1120*dpr;bg.height=650*dpr;const c=bg.getContext('2d');c.scale(dpr,dpr);const dusk=level===2;
  c.fillStyle=dusk?'#e9e1c9':'#e9eed4';c.fillRect(0,0,1120,650);
  const sky=c.createLinearGradient(0,0,0,150);sky.addColorStop(0,dusk?'#efdfc8':'#eff2dc');sky.addColorStop(1,dusk?'#e5dec3':'#e1e9c6');c.fillStyle=sky;c.fillRect(0,0,1120,153);
  ellipse(c,982,141,146,45,dusk?'#c6caa6':'#c8d5ac');ellipse(c,190,133,117,35,dusk?'#d3d0ac':'#d6dfb8');
  c.globalAlpha=.26;drawSticker(c,'cloud',817,99,.7,0);drawSticker(c,'cloud',679,77,.8,0);c.globalAlpha=1;
  fence(c,219,143,799,.78);shrub(c,1042,142,.9);shrub(c,172,143,.67);
  rr(c,192,146,813,432,17,'#a9bb8460');rr(c,204,151,785,420,13,dusk?'#b7bd8d':'#b5c78e','#a4b781',2);
  c.save();c.beginPath();c.roundRect(210,155,774,410,8);c.clip();
  for(let row=0;row<5;row++)for(let col=0;col<9;col++){
    const x=210+col*86,y=155+row*82;c.fillStyle=dusk?((row+col)%2?'#c2c79b':'#b9c18e'):((row+col)%2?'#c8d8a4':'#bdcf97');c.fillRect(x,y,86,82);
    c.strokeStyle=dusk?'#aeb78735':'#aabf8530';c.lineWidth=1;c.strokeRect(x+.5,y+.5,86,82);
    for(let j=0;j<3;j++){const px=x+15+((row*17+col*13+j*21)%59),py=y+17+((row*29+col*19+j*14)%52);line(c,[[px-3,py+1],[px-1,py-3],[px+1,py+1],[px+3,py-2]],dusk?'#abb78365':'#a9bf7f65',1.3)}
    if((row*9+col)%7===0)flower(c,x+68,y+18,.46,dusk?'#e9dbbe':'#eef0cd');
  }c.restore();
  // The warm pebble path separates the gate from the playable lawn.
  rr(c,1007,159,73,404,20,dusk?'#dfd3b4':'#dedbb9');
  for(let i=0;i<11;i++){const x=1025+(i%2)*27,y=177+i*34;ellipse(c,x,y,10+i%3*2,5,'#cec9a65c');line(c,[[x-3,y-1],[x+3,y-2]],'#f5eed35c',1.2)}
  rr(c,179,162,27,399,10,'#d9dabb');for(let i=0;i<5;i++)line(c,[[181,237+i*82],[204,237+i*82]],'#c3caa8',1);
  for(const [x,y,s] of [[202,591,.7],[967,595,.8],[1001,573,.65],[1091,364,.8],[1092,216,.75],[159,593,.6],[659,588,.6]])flower(c,x,y,s,dusk?'#e5bb9c':'#f6e8b8');
  for(let i=0;i<16;i++){const x=238+i*45,y=584+(i%3)*3;line(c,[[x-4,y+5],[x-1,y-1],[x+1,y+5],[x+4,y+1]],'#b1bf8c',1.4)}
  c.fillStyle='#91a06f';c.font='9px "Microsoft YaHei",sans-serif';c.textAlign='center';for(let i=0;i<9;i++)c.fillText(String(i+1),253+i*86,145);
  return bg;
}

function renderGame(t){
  const c=ctx;c.clearRect(0,0,1120,650);if(background)c.drawImage(background,0,0,1120,650);if(!game)return;
  if(hover&&selected){const x=BOARD.x+hover.col*86,y=BOARD.y+hover.row*82,occupied=game.plants.some(p=>p.row===hover.row&&p.col===hover.col);c.fillStyle=selected==='shovel'?'#f1c9a144':occupied?'#e09b8244':'#f9f3c365';c.fillRect(x+2,y+2,82,78);c.setLineDash([5,4]);rr(c,x+4,y+4,78,74,7,null,selected==='shovel'?'#b88b66':'#789557',1.5);c.setLineDash([]);if(selected!=='shovel'&&!occupied){c.globalAlpha=.4;drawPlant(c,selected,x+43,y+74,1,t);c.globalAlpha=1}}
  for(let row=0;row<5;row++){
    const mower=game.mowers.find(m=>m.row===row);if(mower&&(!mower.used||mower.active))drawMower(c,mower.x,mower.y,.62);
    for(const p of game.plants.filter(p=>p.row===row)){
      const grown=Math.min(1,p.age*4);c.save();drawPlant(c,p.type,p.x,p.y,.75+.25*grown,t+p.id*.21,{health:p.hp/p.maxHp,hurt:p.hurt||0});c.restore();
      if(p.hp<p.maxHp*.98){rr(c,p.x-20,p.y+4,40,4,2,'#7e916a40');rr(c,p.x-20,p.y+4,Math.max(0,40*p.hp/p.maxHp),4,2,p.hp/p.maxHp<.3?'#c78e73':'#7f9b62')}
    }
    for(const z of game.zombies.filter(z=>z.row===row).sort((a,b)=>a.x-b.x)){drawZombie(c,z.type,z.x,z.y,1,t+z.id*.2,{health:z.hp/z.maxHp,hurt:z.hurt||0,slow:z.slow>0,bite:z.bite});if(z.hp<z.maxHp){rr(c,z.x-17,z.y-91,34,3,2,'#807c5d35');rr(c,z.x-17,z.y-91,Math.max(0,34*z.hp/z.maxHp),3,2,z.slow>0?'#8bb2b4':'#b6a16e')}}
    for(const p of game.projectiles.filter(p=>p.row===row)){ellipse(c,p.x-7,p.y,9,4,p.type==='ice'?'#c1edf766':'#cfdf9b66');ellipse(c,p.x,p.y,7,7,p.type==='ice'?'#b9dfe5':'#98bb6e');c.strokeStyle=p.type==='ice'?'#7ba1aa':'#719553';c.lineWidth=1.4;c.stroke();ellipse(c,p.x-2,p.y-2,2.2,2.2,'#f8ffe3')}
  }
  for(const e of game.effects){const life=Math.max(0,1-e.age/e.duration);if(!Number.isFinite(life))continue;c.save();c.globalAlpha=life;if(e.type==='explode'){
    const r=20+Math.min(1,e.age/.35)*120;ellipse(c,e.x,e.y-25,r,r*.65,'#f5d58980');c.strokeStyle='#fff4c2';c.lineWidth=5;c.stroke();for(let i=0;i<12;i++){const a=i*Math.PI/6;drawSticker(c,i%2?'star':'heart',e.x+Math.cos(a)*r,e.y-10+Math.sin(a)*r*.7,.27,t)}c.fillStyle='#9b765b';c.font='bold 22px "Microsoft YaHei",sans-serif';c.textAlign='center';c.fillText('砰！',e.x,e.y-30);
  }else{for(let i=0;i<5;i++){let a=i*1.257+e.x;ellipse(c,e.x+Math.cos(a)*e.age*34,e.y-19+Math.sin(a)*e.age*25-e.age*15,3*life+1,3*life+1,e.type==='hit'?'#edf4c6':'#b2c58b')}}c.restore()}
  for(const s of game.suns){c.save();if(s.ttl-s.age<3)c.globalAlpha=.5+.5*Math.sin(t*7);ellipse(c,s.x,s.y+17,19,6,'#81945920');drawSun(c,s.x,s.y,22,t+s.id);c.restore()}
  for(const f of flyers){const p=Math.min(1,f.age/.65),ease=1-(1-p)**3;drawSun(c,f.x+(65-f.x)*ease,f.y+(55-f.y)*ease,22*(1-p*.45),t);c.save();c.globalAlpha=1-p;c.fillStyle='#8d8047';c.font='bold 17px Georgia';c.fillText('+25',f.x+18,f.y-15-p*38);c.restore()}
}

function initCards(){
  for(const [i,type]of types.entries()){
    const p=PLANTS[type],el=document.createElement('button');el.className='seed-card';el.dataset.type=type;el.setAttribute('aria-label',`${p.name}，${p.cost}阳光。${p.description}`);el.title=`${p.name} · ${p.cost} 阳光\n${p.description}\n快捷键 ${i+1}`;el.innerHTML=`<span class="key">${i+1}</span><canvas width="120" height="130" aria-hidden="true"></canvas><span class="seed-info"><span class="seed-name">${p.name}</span><span class="seed-price">${p.cost}</span></span><span class="seed-cooldown"></span><span class="cooldown-text"></span>`;
    const c=el.querySelector('canvas').getContext('2d');drawPlant(c,type,60,114,1.42,0);el.addEventListener('click',()=>select(type));$('seed-bank').append(el);
  }
  drawSun($('sun-icon').getContext('2d'),25,25,22);
}
function select(type){if(!game||paused||game.status!=='playing')return;initAudio();if(type!=='shovel'){const p=PLANTS[type];if(game.cooldowns[type]>0)return toast(`${p.name}还在休息，稍等 ${Math.ceil(game.cooldowns[type])} 秒`);if(game.sun<p.cost)return toast(`还差 ${p.cost-game.sun} 阳光，点击小太阳收集吧`)}selected=selected===type?null:type;updateSelection()}
function updateSelection(){for(const card of $('seed-bank').children)card.classList.toggle('selected',card.dataset.type===selected);$('shovel').classList.toggle('selected',selected==='shovel');$('shovel').setAttribute('aria-pressed',String(selected==='shovel'));$('plant-hint').textContent=selected==='shovel'?'点击要铲除的植物，再次点铲子可取消。':selected?`${PLANTS[selected].name} · ${PLANTS[selected].description}`:'先种向日葵，让阳光多起来。';canvas.style.cursor=selected==='shovel'?'crosshair':selected?'copy':'default'}
function updateHUD(){if(!game)return;const stamp=`${game.sun},${game.wave},${Math.floor(game.time)}`;if(stamp!==hudStamp){$('sun-count').textContent=game.sun;$('wave-count').textContent=`${game.wave} / ${game.level.waves.length} 波`;$('wave-label').textContent=game.wave===0?'第一批僵尸即将来访':game.elapsedRatio>=1?'守住最后一波！':`第 ${game.wave} 波 · 小院守护中`;$('wave-progress').style.width=`${game.elapsedRatio*100}%`;hudStamp=stamp}
  for(const card of $('seed-bank').children){const type=card.dataset.type,cd=game.cooldowns[type]||0;card.classList.toggle('unavailable',game.sun<PLANTS[type].cost||cd>0);card.setAttribute('aria-disabled',String(game.sun<PLANTS[type].cost||cd>0));card.setAttribute('aria-pressed',String(type===selected));card.querySelector('.seed-cooldown').style.height=`${cd/PLANTS[type].cooldown*100}%`;card.querySelector('.cooldown-text').textContent=cd>0?`${Math.ceil(cd)}s`:''}
}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');toastLeft=3.2}
function banner(message){$('wave-banner').querySelector('div').textContent=message;$('wave-banner').classList.add('show');bannerLeft=3}
function onEvent(e){if(e.type==='wave')banner(`第 ${e.wave||game?.wave||1} 波小访客来了！`);if(e.type==='mower')toast('小推车出动！这一行再多守一会儿。');if(e.type==='win'||e.type==='lose')queueMicrotask(()=>showResult(e.type==='win'));playSound(e.type)}
function startGame(level=1){
  closeModal(false);game=new Game(level,{onEvent});background=buildBackground(level);view='battle';selected=null;hover=null;paused=false;flyers=[];hudStamp='';$('home').hidden=true;$('battle').hidden=false;document.body.classList.add('is-playing');document.querySelector('.site-header').classList.add('compact');$('level-name').textContent=game.level.name;$('chapter-label').textContent=`CHAPTER 0${level}`;updateSelection();updateHUD();bannerLeft=0;$('wave-banner').classList.remove('show');toast('先种 2 株向日葵，再给来访的那一行种上射手。');initAudio();canvas.focus({preventScroll:true});if(matchMedia('(orientation: portrait)').matches)paused=true;
}
function goHome(){closeModal(false);view='home';game=null;paused=false;selected=null;hover=null;$('home').hidden=false;$('battle').hidden=true;document.body.classList.remove('is-playing');document.querySelector('.site-header').classList.remove('compact');refreshCompleted();$('start').focus({preventScroll:true})}
function refreshCompleted(){for(const id of [1,2])$(`complete-${id}`).textContent=completed.includes(id)?'✓ 已守护':''}
function showModal(type,html){returnFocus=document.activeElement;modalType=type;$('modal-content').innerHTML=html;$('modal').hidden=false;$('modal-close').hidden=type==='result';if(game?.status==='playing')paused=true;requestAnimationFrame(()=>($('modal-content').querySelector('button')||$('modal-close')).focus({preventScroll:true}))}
function closeModal(resume=true){$('modal').hidden=true;modalType='';if(resume&&game?.status==='playing'&&!matchMedia('(orientation: portrait)').matches)paused=false;returnFocus?.focus?.({preventScroll:true})}
function modalArt(mood='happy') {const el=document.querySelector('.modal-illustration');if(!el)return;const c=el.getContext('2d');c.clearRect(0,0,520,120);drawPlant(c,'sunflower',193,108,1.12,artTime);drawPlant(c,'peashooter',264,108,1.1,artTime);drawSticker(c,mood==='happy'?'heart':'cloud',330,72,.68,artTime);drawPlant(c,'cherry',332,111,.5,artTime)}
function showHelp(){showModal('help',`<div class="eyebrow">GARDEN HANDBOOK</div><h2 id="modal-title">小院守护手册</h2><p>点击植物卡，再点草坪，就种好啦。<br>守住 5 条草坪，不让僵尸走进左侧的小院。</p><div class="guide-plants">${types.map(t=>`<div class="guide-plant"><canvas data-plant="${t}" width="100" height="105"></canvas>${PLANTS[t].name}<small>☀ ${PLANTS[t].cost}</small></div>`).join('')}</div><div class="rules-list"><div class="rule"><strong>01 · 让阳光多起来</strong><p>点击掉落的阳光获得 25 阳光。先在左侧种向日葵，会持续生产阳光。</p></div><div class="rule"><strong>02 · 一行一行守护</strong><p>射手自动攻击同一行。坚果挡住僵尸，寒冰射手能让它们慢下来。</p></div><div class="rule"><strong>03 · 给花园一点帮手</strong><p>樱桃炸弹爆炸覆盖周围 3×3 格。卡片要等冷却，铲除不返还阳光。</p></div><div class="rule"><strong>04 · 守到最后就赢啦</strong><p>每行小推车只救场一次。所有波次清空即胜利，僵尸闯进小院则失败。</p></div></div><div class="modal-actions"><button class="primary-btn" id="got-it">明白啦，开始守护</button></div><p>电脑：1–5 选植物，6 选铲子，空格暂停，Esc 取消选择。<br>手机：横屏点按即可，右上角可尝试全屏。</p>`);document.querySelectorAll('[data-plant]').forEach(el=>drawPlant(el.getContext('2d'),el.dataset.plant,50,92,1.15,0));$('got-it').onclick=()=>closeModal()}
function showPause(){if(!game||game.status!=='playing')return;showModal('pause',`<div class="eyebrow">TAKE A LITTLE BREAK</div><canvas class="modal-illustration" width="520" height="120"></canvas><h2 id="modal-title">花园等你回来</h2><p>阳光和小伙伴都暂停了，慢慢来。</p><div class="modal-actions"><button class="primary-btn" id="resume">继续守护 <span>→</span></button><button class="secondary-btn" id="retry">重新开始</button><button class="secondary-btn" id="back-home">返回小院</button></div>`);modalArt();$('resume').onclick=()=>closeModal();$('retry').onclick=()=>confirmRestart();$('back-home').onclick=()=>goHome()}
function confirmRestart(){const id=game.level.id;showModal('restart',`<div class="eyebrow">A FRESH LITTLE START</div><h2 id="modal-title">重新种一次花园？</h2><p>这一局会从头开始，已经获得的通关记录会保留。</p><div class="modal-actions"><button class="primary-btn" id="restart-now">重新开始</button><button class="secondary-btn" id="keep-playing">继续这一局</button></div>`);$('restart-now').onclick=()=>startGame(id);$('keep-playing').onclick=()=>closeModal()}
function showResult(won){if(!game)return;paused=true;selected=null;updateSelection();const id=game.level.id;if(won&&!completed.includes(id)){completed.push(id);store.set('completed',completed)}showModal('result',`<div class="eyebrow">${won?'A LITTLE GARDEN, A BIG VICTORY':'EVERY SEED GETS ANOTHER CHANCE'}</div><canvas class="modal-illustration" width="520" height="120"></canvas><h2 id="modal-title">${won?'好天气，被你守住了！':'小院需要再一点勇气'}</h2><p>${won?`「${game.level.name}」守护成功。谢谢你，勇敢的小园丁。`:'有小访客溜进来了。重新种下希望，再来一次吧。'}</p><div class="stats"><div><strong>${game.kills}</strong><span>拦住的小访客</span></div><div><strong>${game.planted}</strong><span>种下的植物</span></div><div><strong>${Math.floor(game.time/60)}:${String(Math.floor(game.time%60)).padStart(2,'0')}</strong><span>守护时光</span></div></div>${!won?'<p class="modal-hint">试试先种 4–5 株向日葵，优先给有僵尸的行补上射手。</p>':''}<div class="modal-actions"><button class="primary-btn" id="result-play">${won&&id===1?'去落日花园 →':'再守护一次 ↗'}</button><button class="secondary-btn" id="result-home">返回小院</button></div>`);modalArt(won?'happy':'sad');$('result-play').onclick=()=>startGame(won&&id===1?2:id);$('result-home').onclick=goHome;refreshCompleted()}

function initAudio(){if(muted)return;try{if(!audio)audio=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{})}catch{muted=true;updateSoundButton()}}
function note(freq,duration=.1,delay=0,volume=.035,wave='sine'){if(muted||!audio||audio.state!=='running')return;const at=audio.currentTime+delay,o=audio.createOscillator(),g=audio.createGain();o.type=wave;o.frequency.setValueAtTime(freq,at);g.gain.setValueAtTime(.001,at);g.gain.exponentialRampToValueAtTime(volume,at+.012);g.gain.exponentialRampToValueAtTime(.001,at+duration);o.connect(g);g.connect(audio.destination);o.start(at);o.stop(at+duration+.02)}
function playSound(type){if(muted)return;switch(type){case'collect':note(784,.11);note(1046,.14,.08);break;case'plant':note(392,.11,0,.03,'triangle');note(523,.13,.07);break;case'shoot':note(270,.055,0,.007,'triangle');break;case'hit':note(170,.04,0,.005);break;case'explode':note(90,.35,0,.045,'triangle');note(65,.3,.07,.03);break;case'wave':note(330,.2,0,.045);note(294,.2,.21,.035);note(262,.3,.42);break;case'win':[523,659,784,1046].forEach((f,i)=>note(f,.3,i*.13,.055));break;case'lose':[392,349,294,262].forEach((f,i)=>note(f,.25,i*.18));break;case'shovel':note(180,.07,0,.02,'triangle');break;case'mower':note(130,.5,0,.015,'sawtooth');break}}
function updateSoundButton(){$('sound').classList.toggle('enabled',!muted);$('sound').title=muted?'开启音效':'关闭音效';$('sound').setAttribute('aria-label',$('sound').title);$('sound').setAttribute('aria-pressed',String(!muted))}

function point(event){const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)*1120/r.width,y:(event.clientY-r.top)*650/r.height}}
function cell(p){const col=Math.floor((p.x-BOARD.x)/BOARD.cellW),row=Math.floor((p.y-BOARD.y)/BOARD.cellH);return row>=0&&row<5&&col>=0&&col<9?{row,col}:null}
canvas.addEventListener('pointermove',e=>{hover=cell(point(e))});canvas.addEventListener('pointerleave',()=>hover=null);
canvas.addEventListener('pointerdown',e=>{e.preventDefault();if(!game||paused||game.status!=='playing')return;initAudio();const p=point(e);const sun=[...game.suns].reverse().find(s=>Math.hypot(s.x-p.x,s.y-p.y)<32);if(sun){const f={x:sun.x,y:sun.y,age:0};if(game.collectSun(sun.id))flyers.push(f);updateHUD();return}const target=cell(p);if(!target)return;if(!selected)return toast('先点左侧植物卡，再点草坪种植。');if(selected==='shovel'){if(game.removePlant(target.row,target.col)){selected=null;updateSelection()}else toast('这里还没有植物哦。')}else{const result=game.plant(selected,target.row,target.col);if(result.ok){selected=null;updateSelection()}else toast(result.reason||'暂时不能种在这里。')}updateHUD()});
canvas.addEventListener('contextmenu',e=>{e.preventDefault();selected=null;updateSelection()});
$('start').onclick=()=>startGame(1);document.querySelectorAll('[data-level]').forEach(el=>el.onclick=()=>startGame(Number(el.dataset.level)));
$('pause').onclick=showPause;$('help').onclick=showHelp;$('modal-close').onclick=()=>closeModal();$('shovel').onclick=()=>select('shovel');$('portrait-back').onclick=goHome;
$('brand').onclick=()=>{if(game?.status==='playing')showPause();else goHome()};
$('sound').onclick=()=>{muted=!muted;store.set('sound',!muted);initAudio();updateSoundButton();if(!muted)note(659,.16)};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement){await document.exitFullscreen()}else{await document.documentElement.requestFullscreen();try{await screen.orientation.lock('landscape')}catch{}}}catch{if(view==='battle')toast('当前浏览器不支持全屏，横放手机也能完整游玩。');else{showModal('fullscreen','<h2 id="modal-title">横屏也能好好玩</h2><p>当前浏览器不支持网页全屏。<br>手机横放后，花园会自动适配屏幕。</p><div class="modal-actions"><button class="primary-btn" id="fullscreen-ok">知道啦</button></div>');$('fullscreen-ok').onclick=()=>closeModal()}}};
document.addEventListener('keydown',e=>{
  if(!$('modal').hidden){if((e.key==='Escape'&&modalType!=='result')||(e.code==='Space'&&modalType==='pause')){e.preventDefault();closeModal()}if(e.key==='Tab'){const buttons=[...$('modal').querySelectorAll('button:not([hidden])')].filter(b=>b.getClientRects().length);const first=buttons[0],end=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();end?.focus()}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first?.focus()}}return}
  if(view!=='battle'||!game)return;if(e.repeat)return;
  if(e.code==='Space'){e.preventDefault();showPause()}else if(e.key==='Escape'){selected=null;updateSelection()}else if('12345'.includes(e.key)&&e.key.length===1){e.preventDefault();select(types[Number(e.key)-1])}else if(e.key==='6'){e.preventDefault();select('shovel')}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game?.status==='playing'&&!paused)showPause()});
const portrait=matchMedia('(orientation: portrait)');portrait.addEventListener('change',e=>{if(game?.status!=='playing')return;if(e.matches){paused=true}else if($('modal').hidden){showPause()}});
function frame(ms){const dt=Math.min(.05,(ms-last)/1000||0);last=ms;artTime+=dt;if(view==='home'){renderHero(reduced?0:artTime)}else if(game){if(!paused)game.update(dt);flyers.forEach(f=>f.age+=paused?0:dt);flyers=flyers.filter(f=>f.age<.7);if(toastLeft>0){toastLeft-=dt;if(toastLeft<=0)$('toast').classList.remove('show')}if(bannerLeft>0&&!paused){bannerLeft-=dt;if(bannerLeft<=0)$('wave-banner').classList.remove('show')}renderGame(reduced?0:game.time);updateHUD()}requestAnimationFrame(frame)}
initCards();updateSoundButton();refreshCompleted();requestAnimationFrame(frame);
