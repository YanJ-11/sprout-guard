/* Original, resolution-independent picture-book characters. Coordinates are in CSS pixels. */
const C = {
  ink: '#715846', cream: '#fff7df', pale: '#f9edd1', leaf: '#a6bf83',
  green: '#b8cd92', darkLeaf: '#819b68', pink: '#edae9e', yellow: '#f3cf75',
  blue: '#b6d9d7', blueDark: '#82b4b9', zombie: '#c4cfad', coat: '#aebba5',
};

function oval(ctx, x, y, rx, ry, fill, stroke = C.ink, width = 2.2, rotation = 0) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = width; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function path(ctx, points, fill, stroke = C.ink, width = 2.2) {
  ctx.beginPath();
  for (const [op, ...p] of points) ctx[op](...p);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}
function stroke(ctx, points, color = C.ink, width = 2) { path(ctx, points, null, color, width); }
function setup(ctx, x, y, scale, facing = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale * facing, scale);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
}
function ground(ctx, width = 25) { oval(ctx, 0, -1, width, 5, 'rgba(91,106,63,.15)', null); }
function cheek(ctx, x, y, r = 5) { oval(ctx, x, y, r, r * .53, C.pink, null); }
function eye(ctx, x, y, r = 2.35) {
  oval(ctx, x, y, r, r * 1.18, C.ink, null);
  oval(ctx, x - .55, y - .8, .65, .75, '#fffcef', null);
}
function smile(ctx, x, y, width = 5) {
  stroke(ctx, [['moveTo', x - width, y], ['quadraticCurveTo', x, y + 5, x + width, y]], C.ink, 1.65);
}
function leaf(ctx, x, y, angle = 0, scale = 1, color = C.leaf) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale);
  path(ctx, [['moveTo',0,0], ['bezierCurveTo',-17,-1,-28,-16,-29,-23], ['bezierCurveTo',-10,-25,3,-14,0,0], ['closePath']], color, C.ink, 1.8);
  stroke(ctx, [['moveTo',-1,-3], ['quadraticCurveTo',-9,-12,-22,-19]], C.darkLeaf, 1.25);
  ctx.restore();
}
function shine(ctx, x, y, rx = 6, ry = 2.5, rotation = -.55) {
  oval(ctx, x, y, rx, ry, 'rgba(255,255,240,.65)', null, 0, rotation);
}
function stem(ctx, bend = 0, color = C.leaf) {
  stroke(ctx, [['moveTo',0,-5], ['quadraticCurveTo',bend,-19,0,-43]], C.ink, 9);
  stroke(ctx, [['moveTo',0,-5], ['quadraticCurveTo',bend,-19,0,-43]], color, 5.2);
}
function star(ctx, x, y, radius, color = C.yellow, rotation = 0) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(rotation);
  const pts = [];
  for(let i=0;i<10;i++) {
    const a=-Math.PI/2+i*Math.PI/5, r=i%2?radius*.47:radius;
    pts.push([i?'lineTo':'moveTo',Math.cos(a)*r,Math.sin(a)*r]);
  }
  pts.push(['closePath']); path(ctx,pts,color,C.ink,1.4); ctx.restore();
}

function sunflower(ctx, time) {
  stem(ctx, Math.sin(time * 2) * 2);
  leaf(ctx,-2,-7,-.18,.75); leaf(ctx,2,-9,1.6,.72);
  ctx.save(); ctx.translate(Math.sin(time * 1.8) * 1.7,-46); ctx.rotate(Math.sin(time*1.8)*.035);
  for(let i=0;i<11;i++) {
    const a=i*Math.PI*2/11;
    oval(ctx,Math.sin(a)*22,-Math.cos(a)*22,7.8,12.2,i%2?'#f5d58b':'#f9dfa0',C.ink,1.8,-a);
  }
  oval(ctx,0,0,19.5,19.5,'#e5b77a');
  oval(ctx,0,2,16.8,15.8,'#efc791',null);
  shine(ctx,-8,-10,6,2.7);
  cheek(ctx,-10,5,5); cheek(ctx,10,5,5);
  eye(ctx,-6,-1); eye(ctx,6,-1); smile(ctx,0,6,4);
  for(const [x,y] of [[-12,-4],[11,-6],[-3,13],[6,12]]) oval(ctx,x,y,.8,.8,'#c49669',null);
  ctx.restore();
}

function pea(ctx, time, snow) {
  const green=snow?'#c0dfd9':'#b6d18e';
  const shade=snow?'#96c4c6':'#91b274';
  stem(ctx,0,shade); leaf(ctx,-1,-5,-.05,.75,green); leaf(ctx,2,-7,1.65,.78,green);
  ctx.save(); ctx.translate(Math.sin(time*2.2)*.9,-44); ctx.rotate(Math.sin(time*2)*.027);
  if(snow) {
    path(ctx,[['moveTo',-15,-12],['lineTo',-19,-25],['lineTo',-8,-21],['lineTo',-3,-29],['lineTo',3,-20],['lineTo',12,-24],['lineTo',11,-13],['closePath']],'#e7f2ea',C.ink,1.8);
  } else {
    path(ctx,[['moveTo',-15,-11],['bezierCurveTo',-32,-16,-31,-29,-22,-25],['quadraticCurveTo',-12,-23,-10,-14],['closePath']],shade,C.ink,1.8);
  }
  oval(ctx,-1,0,21,19.5,green);
  path(ctx,[['moveTo',10,-10],['bezierCurveTo',19,-8,21,-10,25,-12],['lineTo',25,12],['quadraticCurveTo',18,8,10,11],['closePath']],green,C.ink,2.2);
  oval(ctx,26,0,9,12.5,shade);
  oval(ctx,28,0,4.4,7.2,snow?'#639297':'#647e4d',C.ink,1.6);
  shine(ctx,-9,-11,6,2.6); shine(ctx,23,-6,2,3,0);
  cheek(ctx,1,8,5); eye(ctx,2,-4,2.6);
  if(snow) {
    stroke(ctx,[['moveTo',-12,1],['lineTo',-6,6],['moveTo',-12,6],['lineTo',-6,1]],'#f3fff7',1.6);
    oval(ctx,-9,3.5,1.5,1.5,'#f4fff8',null);
  }
  ctx.restore();
}

function wallnut(ctx, time, health) {
  ctx.save(); ctx.rotate(Math.sin(time*1.6)*.018);
  path(ctx,[['moveTo',-23,-4],['bezierCurveTo',-33,-20,-27,-51,-15,-61],['bezierCurveTo',-9,-68,0,-64,3,-65],['bezierCurveTo',18,-66,27,-54,27,-34],['bezierCurveTo',29,-17,24,-3,16,-2],['quadraticCurveTo',-4,2,-23,-4],['closePath']],'#d8b184');
  path(ctx,[['moveTo',-20,-8],['bezierCurveTo',-26,-23,-19,-55,-9,-58],['bezierCurveTo',-2,-60,1,-52,7,-57],['bezierCurveTo',21,-50,23,-28,18,-11],['quadraticCurveTo',0,1,-20,-8],['closePath']],'#e8c798',null);
  stroke(ctx,[['moveTo',-13,-53],['quadraticCurveTo',-19,-48,-15,-43],['quadraticCurveTo',-11,-39,-16,-35]],'#bf976c',1.6);
  stroke(ctx,[['moveTo',14,-49],['quadraticCurveTo',19,-43,15,-38]],'#bf976c',1.6);
  stroke(ctx,[['moveTo',-18,-23],['quadraticCurveTo',-22,-18,-18,-14]],'#bf976c',1.5);
  stroke(ctx,[['moveTo',15,-20],['quadraticCurveTo',11,-15,15,-9]],'#bf976c',1.5);
  shine(ctx,-11,-55,7,2.7);
  cheek(ctx,-14,-27,5); cheek(ctx,14,-27,5);
  if(health < .35) {
    stroke(ctx,[['moveTo',-11,-35],['lineTo',-6,-31],['lineTo',-11,-28]],C.ink,2);
    stroke(ctx,[['moveTo',11,-35],['lineTo',6,-31],['lineTo',11,-28]],C.ink,2);
    stroke(ctx,[['moveTo',-4,-22],['quadraticCurveTo',0,-26,4,-22]],C.ink,1.7);
  } else {
    eye(ctx,-8,-33); eye(ctx,8,-33); smile(ctx,0,-25,4.5);
  }
  if(health < .7) stroke(ctx,[['moveTo',4,-65],['lineTo',-1,-55],['lineTo',5,-48],['lineTo',1,-41]],'#967452',2);
  if(health < .35) stroke(ctx,[['moveTo',-27,-30],['lineTo',-18,-23],['lineTo',-20,-15],['lineTo',-12,-8]],'#967452',2);
  ctx.restore();
}

function cherries(ctx, time) {
  stroke(ctx,[['moveTo',-14,-37],['quadraticCurveTo',-12,-63,6,-64],['quadraticCurveTo',13,-52,15,-33]],C.ink,5);
  stroke(ctx,[['moveTo',-14,-37],['quadraticCurveTo',-12,-63,6,-64],['quadraticCurveTo',13,-52,15,-33]],C.darkLeaf,2.5);
  leaf(ctx,5,-60,1.5,.61,C.green);
  ctx.save(); ctx.translate(-14,-21); ctx.rotate(Math.sin(time*3)*.04);
  oval(ctx,0,0,17,19,'#df8f83'); oval(ctx,-1,-2,14,15.5,'#eca397',null);
  shine(ctx,-7,-10,5.5,2.7); cheek(ctx,-9,5,3.3); eye(ctx,-5,-1,2); eye(ctx,5,-1,2); smile(ctx,0,5,3.2);
  ctx.restore();
  ctx.save(); ctx.translate(15,-19); ctx.rotate(-Math.sin(time*3)*.04);
  oval(ctx,0,0,18,19,'#e39589'); oval(ctx,-1,-2,15,15.5,'#efb0a1',null);
  shine(ctx,-7,-10,5.5,2.7); cheek(ctx,10,5,3.3); eye(ctx,-5,-1,2); eye(ctx,5,-1,2);
  oval(ctx,1,6,2.4,2.8,C.ink,null); ctx.restore();
}

/** Draw a plant at its foot centre. time is seconds; state.health defaults to 1. */
export function drawPlant(ctx,type,x,y,scale=1,time=0,state={}) {
  setup(ctx,x,y,scale,state.facing === -1 ? -1 : 1);
  ground(ctx,type==='cherry'?29:25);
  const breath=Math.sin(time*2.1)*.012;
  ctx.scale(1-breath*.3,1+breath);
  switch(type) {
    case 'sunflower': sunflower(ctx,time); break;
    case 'snowpea': pea(ctx,time,true); break;
    case 'wallnut': wallnut(ctx,time,state.health ?? 1); break;
    case 'cherry': cherries(ctx,time); break;
    default: pea(ctx,time,false);
  }
  if(state.hurt>0) {
    ctx.globalAlpha=Math.min(1,state.hurt)*.75;
    star(ctx,-26,-56,5,'#fff8df',-.3); star(ctx,28,-39,3.5,'#fff8df',.3);
  }
  ctx.restore();
}

function zombieHead(ctx,type,time,bite) {
  ctx.save(); ctx.translate(0,-61); ctx.rotate(Math.sin(time*2.4)*.027);
  oval(ctx,-19,1,5.5,7,C.zombie,C.ink,1.8);
  stroke(ctx,[['moveTo',-21,0],['quadraticCurveTo',-17,-3,-17,3]],'#96a181',1.3);
  path(ctx,[['moveTo',-15,-17],['bezierCurveTo',-7,-24,11,-22,18,-14],['bezierCurveTo',24,-6,24,7,18,15],['quadraticCurveTo',3,24,-12,15],['bezierCurveTo',-21,8,-22,-8,-15,-17],['closePath']],C.zombie);
  path(ctx,[['moveTo',-9,-16],['bezierCurveTo',1,-21,17,-14,17,-7],['quadraticCurveTo',2,-10,-9,-16],['closePath']],'#d9dfbe',null);
  shine(ctx,-7,-16,5,2.3);
  // The oversized cream eyes and tiny tooth keep these visitors friendly.
  oval(ctx,1,-2,7,8.3,'#fff9e7',C.ink,1.65);
  oval(ctx,15,-3,5.8,7,'#fff9e7',C.ink,1.65);
  eye(ctx,3,-.2,2.2); eye(ctx,17,-1,1.9);
  stroke(ctx,[['moveTo',-3,-12],['quadraticCurveTo',0,-14,3,-12]],C.ink,1.7);
  stroke(ctx,[['moveTo',13,-13],['lineTo',17,-11]],C.ink,1.7);
  oval(ctx,20,4,4,3.3,C.zombie,C.ink,1.5);
  cheek(ctx,-8,7,5); cheek(ctx,17,8,3);
  if(bite) {
    oval(ctx,7,12,6,3.7+Math.abs(Math.sin(time*13))*2,'#876551',C.ink,1.6);
    path(ctx,[['moveTo',5,9],['lineTo',5,12],['lineTo',9,12],['lineTo',9,9],['closePath']],C.cream,C.ink,1);
  } else {
    stroke(ctx,[['moveTo',0,12],['quadraticCurveTo',8,15,15,10]],C.ink,1.7);
    path(ctx,[['moveTo',5,13],['lineTo',5,17],['quadraticCurveTo',8,18,9,16],['lineTo',9,13]],C.cream,C.ink,1.3);
  }
  if(type==='cone') {
    path(ctx,[['moveTo',-19,-17],['lineTo',-5,-48],['quadraticCurveTo',-3,-52,0,-47],['lineTo',17,-17],['closePath']],'#eab087',C.ink,2);
    path(ctx,[['moveTo',-12,-32],['lineTo',8,-32],['lineTo',13,-23],['lineTo',-16,-23],['closePath']],'#fff0d0',null);
    path(ctx,[['moveTo',-19,-18],['quadraticCurveTo',-2,-13,18,-18],['quadraticCurveTo',22,-17,20,-12],['quadraticCurveTo',-2,-7,-23,-13],['quadraticCurveTo',-26,-17,-19,-18],['closePath']],'#e6a57e',C.ink,1.8);
    shine(ctx,-6,-36,5,1.8,-1.1);
  } else if(type==='bucket') {
    path(ctx,[['moveTo',-20,-17],['lineTo',-17,-37],['quadraticCurveTo',0,-44,18,-36],['lineTo',21,-16],['closePath']],'#afc2c1',C.ink,2);
    oval(ctx,1,-37,17.5,4.5,'#d1dfd8',C.ink,1.8);
    path(ctx,[['moveTo',-23,-17],['quadraticCurveTo',0,-11,23,-16],['lineTo',23,-11],['quadraticCurveTo',0,-6,-23,-12],['closePath']],'#cbd8cf',C.ink,1.8);
    stroke(ctx,[['moveTo',-17,-26],['bezierCurveTo',-34,-27,-30,-6,-18,-8]],C.ink,2.5);
    shine(ctx,-10,-27,7,2,-1.45);
    star(ctx,7,-24,5.5,'#f3d592',.15);
  } else if(type==='runner') {
    path(ctx,[['moveTo',-18,-12],['quadraticCurveTo',1,-19,20,-12],['lineTo',21,-7],['quadraticCurveTo',1,-13,-19,-6],['closePath']],'#eab4a1',C.ink,1.5);
    stroke(ctx,[['moveTo',-18,-11],['lineTo',-29,-13],['lineTo',-28,-7],['lineTo',-20,-7]],C.ink,1.6);
    path(ctx,[['moveTo',-19,-11],['lineTo',-29,-13],['lineTo',-28,-7],['lineTo',-20,-7],['closePath']],'#eab4a1',C.ink,1.4);
  } else {
    stroke(ctx,[['moveTo',-6,-21],['quadraticCurveTo',-9,-28,-13,-25],['moveTo',0,-22],['quadraticCurveTo',1,-29,5,-25]],C.ink,2.2);
  }
  ctx.restore();
}

/** A positive facing value looks right. Zombies look left by default. */
export function drawZombie(ctx,type,x,y,scale=1,time=0,state={}) {
  setup(ctx,x,y,scale,state.facing===1?1:-1); ground(ctx,24);
  const fast=type==='runner', phase=time*(fast?8:4.3), walk=state.bite?0:Math.sin(phase);
  const bob=state.bite?Math.sin(time*5)*.4:Math.abs(Math.sin(phase))*1.4;
  ctx.translate(0,-bob); ctx.rotate((state.bite?.035:walk*.018));
  const trousers=fast?'#bca29c':'#aaa89d', jacket=fast?'#e3bfa3':C.coat;
  // Separate feet and bent knees make slow shuffling readable even at small sizes.
  stroke(ctx,[['moveTo',-8,-25],['lineTo',-9+walk*2,-12],['lineTo',-11-walk*4,-4]],C.ink,10);
  stroke(ctx,[['moveTo',-8,-25],['lineTo',-9+walk*2,-12],['lineTo',-11-walk*4,-4]],trousers,6.3);
  oval(ctx,-7-walk*4,-3,10,4.2,'#887969',C.ink,1.8);
  stroke(ctx,[['moveTo',8,-25],['lineTo',8-walk*2,-12],['lineTo',9+walk*4,-4]],C.ink,10);
  stroke(ctx,[['moveTo',8,-25],['lineTo',8-walk*2,-12],['lineTo',9+walk*4,-4]],trousers,6.3);
  oval(ctx,13+walk*4,-3,10,4.2,'#9a8771',C.ink,1.8);
  // Far arm, cream shirt, relaxed jacket, and the very small tie.
  stroke(ctx,[['moveTo',8,-42],['lineTo',19,-34],['lineTo',30,-36+walk]],C.ink,9);
  stroke(ctx,[['moveTo',8,-42],['lineTo',19,-34],['lineTo',30,-36+walk]],jacket,5.7);
  oval(ctx,31,-35+walk,5.5,4.2,C.zombie,C.ink,1.6);
  path(ctx,[['moveTo',-13,-49],['quadraticCurveTo',-2,-52,10,-48],['lineTo',16,-24],['lineTo',8,-21],['lineTo',2,-24],['lineTo',-4,-21],['lineTo',-16,-23],['closePath']],jacket);
  path(ctx,[['moveTo',-3,-48],['lineTo',8,-47],['lineTo',8,-25],['lineTo',0,-23],['closePath']],C.cream,C.ink,1.4);
  path(ctx,[['moveTo',1,-48],['lineTo',5,-48],['lineTo',7,-43],['lineTo',4,-40],['lineTo',8,-31],['lineTo',4,-27],['lineTo',0,-32],['lineTo',2,-41],['lineTo',0,-44],['closePath']],fast?'#ba887b':'#c49a88',C.ink,1.2);
  path(ctx,[['moveTo',-5,-50],['lineTo',-10,-40],['lineTo',-4,-40],['lineTo',-6,-34],['lineTo',1,-25]],null,C.ink,1.4);
  path(ctx,[['moveTo',10,-47],['lineTo',15,-40],['lineTo',10,-38]],null,C.ink,1.4);
  // A stitched patch makes the costume feel handmade.
  path(ctx,[['moveTo',-13,-32],['lineTo',-6,-33],['lineTo',-5,-26],['lineTo',-12,-25],['closePath']],fast?'#f1d394':'#d9c7a4',C.ink,1.1);
  stroke(ctx,[['moveTo',-12,-31],['lineTo',-10,-28],['moveTo',-8,-31],['lineTo',-7,-28]],'#a88c6e',.9);
  stroke(ctx,[['moveTo',-11,-43],['quadraticCurveTo',-6,-35,3,-35],['lineTo',20,-31+(state.bite?Math.sin(time*11)*1.2:walk)]],C.ink,10);
  stroke(ctx,[['moveTo',-11,-43],['quadraticCurveTo',-6,-35,3,-35],['lineTo',20,-31+(state.bite?Math.sin(time*11)*1.2:walk)]],jacket,6.5);
  oval(ctx,22,-31+(state.bite?Math.sin(time*11)*1.2:walk),6.5,4.7,C.zombie,C.ink,1.7);
  stroke(ctx,[['moveTo',23,-33],['lineTo',27,-33],['moveTo',24,-30],['lineTo',27,-30]],'#96a180',1.1);
  zombieHead(ctx,type,time,!!state.bite);
  if(state.slow) {
    ctx.globalAlpha=.85;
    for(const [sx,sy] of [[-22,-47],[24,-16],[-15,-8]]) {
      stroke(ctx,[['moveTo',sx-3,sy],['lineTo',sx+3,sy],['moveTo',sx,sy-3],['lineTo',sx,sy+3],['moveTo',sx-2,sy-2],['lineTo',sx+2,sy+2]],'#edfdf4',1.8);
    }
    ctx.globalAlpha=1;
  }
  if(state.hurt>0) {
    ctx.globalAlpha=Math.min(1,state.hurt)*.8;
    star(ctx,-26,-68,5.5,'#fff2bb',-.3); star(ctx,27,-47,4,'#fff7df',.2);
  }
  ctx.restore();
}

/** A collectible sunshine token, centred at x/y rather than foot anchored. */
export function drawSun(ctx,x,y,r=22,time=0) {
  ctx.save(); ctx.translate(x,y); ctx.lineJoin='round'; ctx.lineCap='round';
  const k=r/22; ctx.scale(k,k);
  ctx.rotate(Math.sin(time*.9)*.055);
  const pts=[];
  for(let i=0;i<24;i++) {
    const a=-Math.PI/2+i*Math.PI/12, rad=i%2?17.5:23.5;
    pts.push([i?'lineTo':'moveTo',Math.cos(a)*rad,Math.sin(a)*rad]);
  }
  pts.push(['closePath']); path(ctx,pts,'#f4d482','#b4945c',1.6);
  oval(ctx,0,0,16,16,'#ffe8a1','#c2a168',1.4);
  shine(ctx,-6,-8,5.3,2.4); cheek(ctx,-8,4,3.4); cheek(ctx,8,4,3.4);
  eye(ctx,-4.6,-1,1.8); eye(ctx,4.6,-1,1.8); smile(ctx,0,4,3.3);
  ctx.restore();
}

export function drawMower(ctx,x,y,scale=1) {
  setup(ctx,x,y,scale); ground(ctx,24);
  stroke(ctx,[['moveTo',-10,-15],['lineTo',-23,-38],['lineTo',-32,-38]],C.ink,5);
  stroke(ctx,[['moveTo',-10,-15],['lineTo',-23,-38],['lineTo',-32,-38]],'#c3c3ad',2.5);
  path(ctx,[['moveTo',-19,-17],['quadraticCurveTo',-15,-25,-3,-24],['lineTo',12,-24],['quadraticCurveTo',22,-22,24,-10],['lineTo',-22,-10],['closePath']],'#e8b0a0');
  path(ctx,[['moveTo',-10,-24],['lineTo',-8,-32],['quadraticCurveTo',0,-35,8,-31],['lineTo',10,-24],['closePath']],'#bfd0b1',C.ink,1.7);
  oval(ctx,-12,-8,7.5,7.5,'#938675',C.ink,1.8); oval(ctx,16,-8,7.5,7.5,'#938675',C.ink,1.8);
  oval(ctx,-12,-8,3.2,3.2,'#ddd3b8',null); oval(ctx,16,-8,3.2,3.2,'#ddd3b8',null);
  shine(ctx,4,-21,8,1.8,0);
  stroke(ctx,[['moveTo',0,-18],['lineTo',2,-15],['lineTo',5,-18]],C.ink,1.5);
  ctx.restore();
}

/** Small decorative motifs; characters and sunshine also work as sticker types. */
export function drawSticker(ctx,type,x,y,scale=1,time=0) {
  if(['sunflower','peashooter','wallnut','snowpea','cherry'].includes(type)) return drawPlant(ctx,type,x,y,scale,time);
  if(['basic','cone','bucket','runner','zombie'].includes(type)) return drawZombie(ctx,type==='zombie'?'basic':type,x,y,scale,time);
  if(type==='sun') return drawSun(ctx,x,y-22*scale,22*scale,time);
  setup(ctx,x,y,scale);
  if(type==='heart') {
    path(ctx,[['moveTo',0,-3],['bezierCurveTo',-34,-22,-20,-41,-7,-29],['lineTo',0,-22],['lineTo',7,-29],['bezierCurveTo',20,-41,34,-22,0,-3],['closePath']],'#eeb6a6');
    shine(ctx,-12,-25,5,2.5);
  } else if(type==='star') {
    star(ctx,0,-21,21,'#f1d798',Math.sin(time)*.05); eye(ctx,-5,-22,1.8); eye(ctx,5,-22,1.8); smile(ctx,0,-16,3);
  } else if(type==='cloud') {
    path(ctx,[['moveTo',-24,-4],['bezierCurveTo',-43,-5,-41,-27,-24,-26],['bezierCurveTo',-21,-46,8,-46,12,-28],['bezierCurveTo',32,-35,42,-15,28,-6],['quadraticCurveTo',0,0,-24,-4],['closePath']],'#fff9e9','#cfbea1',1.8);
    eye(ctx,-5,-18,1.8); eye(ctx,7,-18,1.8); smile(ctx,1,-12,3.5); cheek(ctx,-13,-12,4); cheek(ctx,15,-12,4);
  } else if(type==='mushroom') {
    path(ctx,[['moveTo',-9,-23],['lineTo',-12,-4],['quadraticCurveTo',0,2,12,-4],['lineTo',9,-23],['closePath']],'#f2e3c4');
    path(ctx,[['moveTo',-24,-22],['bezierCurveTo',-23,-52,22,-54,25,-22],['quadraticCurveTo',0,-13,-24,-22],['closePath']],'#e4afa0');
    oval(ctx,-10,-31,5.5,4.7,'#fff0d7',null); oval(ctx,8,-36,6,5,'#fff0d7',null); oval(ctx,17,-24,3,2,'#fff0d7',null);
    eye(ctx,-4,-10,1.5); eye(ctx,4,-10,1.5); smile(ctx,0,-6,2);
  } else {
    leaf(ctx,0,-2,.17,1.12,C.green); leaf(ctx,2,-1,1.7,.84,'#c6d6a5');
  }
  ctx.restore();
}
