// Galaxy Hopper - Pinguim Espacial
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const HUD = { level: document.getElementById('level'), score: document.getElementById('score'), lives: document.getElementById('lives'), message: document.getElementById('message') };
const startBtn = document.getElementById('start');
const muteBtn = document.getElementById('mute');

canvas.width = 900; canvas.height = 500;

const SPRITES = { penguin: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxMjAgMTIwJz48ZWxsaXBzZSBjeD0nNjAnIGN5PSc4MCcgcng9JzM0JyByeT0nMjgnIGZpbGw9JyNmZmYnLz48cGF0aCBkPSdNMzYgNzggQzM2IDU0LDg0IDU0LDg0IDc4IEM4NCAxMDAsMzYgMTAwLDM2IDc4IFonIGZpbGw9JyMwYjJiM2EnLz48Y2lyY2xlIGN4PSc0OCcgY3k9JzU2JyByPSc4JyBmaWxsPScjZmZmJy8+PGNpcmNsZSBjeD0nNzInIGN5PSc1Nicgcj0nOCcgZmlsbD0nI2ZmZicvPjxjaXJjbGUgY3g9JzQ4JyBjeT0nNTgnIHI9JzMnIGZpbGw9JyMwMDAnLz48Y2lyY2xlIGN4PSc3MicgY3k9JzU4JyByPSczJyBmaWxsPScjMDAwJy8+PC9zdmc+', meteor: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA2NCA2NCc+PHBhdGggZD0nTTIsMjAgQzIwLDEwIDQwLDYgNTYsMTggQzYyLDIyIDU4LDM4IDQ0LDQ0IEMzMCw1MCAxOCw1MiA4LDQ2IEMtMiw0MCAyLDI4IDIsMjAgWicgZmlsbD0nI2VmNDQ0NCcvPjwvc3ZnPg==', star: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNCAyNCc+PHBvbHlnb24gcG9pbnRzPScxMiwyIDE0LjUsOSAyMiw5IDE2LDEzLjUgMTgsMjEgMTIsMTYuNSA2LDIxIDgsMTMuNSAyLDkgOS41LDknIGZpbGw9JyNmZmQxNjYnLz48L3N2Zz4=', planet: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxMjAgMTIwJz48Y2lyY2xlIGN4PSc2MCcgY3k9JzYwJyByPSc0MCcgZmlsbD0nIzhjYzZmZicvPjwvc3ZnPg==' };

const IMAGES = {};
for(const k in SPRITES){ IMAGES[k] = new Image(); IMAGES[k].src = SPRITES[k]; }

let keys = {}, running = false;
let player, meteors = [], items = [], planets = [], score = 0, level = 1, lives = 3, spawnTick = 0, mute = false;

function rand(min,max){ return Math.random()*(max-min)+min; }
function dist(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return Math.sqrt(dx*dx+dy*dy); }

class Planet {
  constructor(x,y,scale,speed,alpha){ this.x = x; this.y = y; this.scale = scale; this.speed = speed; this.alpha = alpha; }
  draw(){ ctx.save(); ctx.globalAlpha = this.alpha; ctx.drawImage(IMAGES.planet, this.x, this.y, IMAGES.planet.width*this.scale, IMAGES.planet.height*this.scale); ctx.restore(); }
  update(dt){ this.x -= this.speed*dt; if(this.x < -200) this.x = canvas.width + rand(50,200); }
}

class Meteor {
  constructor(x,y,r,speed,angle){ this.x = x; this.y = y; this.r = r; this.speed = speed; this.angle = angle; }
  update(dt){ this.x += Math.cos(this.angle)*this.speed*dt; this.y += Math.sin(this.angle)*this.speed*dt; }
  draw(){ ctx.drawImage(IMAGES.meteor, this.x - this.r, this.y - this.r, this.r*2, this.r*2); }
}

class Item {
  constructor(x,y,r){ this.x = x; this.y = y; this.r = r; }
  draw(){ ctx.drawImage(IMAGES.star, this.x - this.r, this.y - this.r, this.r*2, this.r*2); }
}

class Player {
  constructor(){ this.x = canvas.width/2; this.y = canvas.height - 110; this.w = 64; this.h = 64; this.speed = 260; this.sprite = IMAGES.penguin; }
  update(dt){ 
    if(keys['ArrowLeft']||keys['a']) this.x -= this.speed*dt;
    if(keys['ArrowRight']||keys['d']) this.x += this.speed*dt;
    if(keys['ArrowUp']||keys['w']) this.y -= this.speed*dt;
    if(keys['ArrowDown']||keys['s']) this.y += this.speed*dt;
    this.x = Math.max(40, Math.min(canvas.width-40, this.x));
    this.y = Math.max(40, Math.min(canvas.height-40, this.y));
  }
  draw(){ ctx.drawImage(this.sprite, this.x - this.w/2, this.y - this.h/2, this.w, this.h); }
}

window.addEventListener('keydown', (e)=> keys[e.key]=true);
window.addEventListener('keyup', (e)=> keys[e.key]=false);

function spawnPlanetLayers(){ planets = []; for(let i=0;i<4;i++) planets.push(new Planet(rand(0,canvas.width), rand(10,140), 0.6+Math.random()*0.8, 10+Math.random()*20, 0.12+Math.random()*0.4)); }

function spawnMeteor(){ 
  const edge = Math.random();
  let x = rand(0,canvas.width), y = -40, angle = rand(0.2,1.8);
  if(edge < 0.25){ x = -40; y = rand(0,canvas.height/2); angle = rand(-0.3,0.5); }
  else if(edge < 0.5){ x = canvas.width+40; y = rand(0,canvas.height/2); angle = rand(2.6,3.8); }
  meteors.push(new Meteor(x,y,12+rand(8,30), 80+rand(20,140), angle));
}

function spawnItemSafe(){ 
  let tries = 0;
  while(tries < 30){
    const x = rand(60, canvas.width-60);
    const y = rand(60, canvas.height-140);
    const candidate = {x,y,r:14};
    let ok = true;
    for(const m of meteors){ if(dist(candidate,m) < m.r + 40) ok = false; }
    if(ok){ items.push(new Item(x,y,14)); return; }
    tries++;
  }
  items.push(new Item(rand(60,canvas.width-60), rand(60,canvas.height-140),14));
}

function resetGame(){
  score = 0; level = 1; lives = 3; meteors = []; items = []; spawnTick = 0;
  player = new Player();
  spawnPlanetLayers();
  for(let i=0;i<3;i++) spawnItemSafe();
  for(let i=0;i<2;i++) spawnMeteor();
  updateHUD();
  HUD.message.classList.add('hidden');
  running = true;
}

function updateHUD(){ HUD.level.innerText = 'Nível: ' + level; HUD.score.innerText = 'Pontos: ' + score; HUD.lives.innerText = 'Vidas: ' + lives; }

function checkCollisions(){
  for(let i=items.length-1;i>=0;i--){
    const it = items[i];
    const dx = player.x - it.x, dy = player.y - it.y;
    if(Math.sqrt(dx*dx+dy*dy) < it.r + 28){
      items.splice(i,1); score++; updateHUD();
      if(score % 5 === 0){ level++; HUD.level.innerText = 'Nível: ' + level; }
      if(Math.random() < 0.7) spawnMeteor();
      if(Math.random() < 0.6) spawnItemSafe();
    }
  }
  for(const m of meteors){
    const dx = player.x - m.x, dy = player.y - m.y;
    if(Math.sqrt(dx*dx+dy*dy) < m.r + 28){
      lives--; updateHUD();
      player.x = canvas.width/2; player.y = canvas.height-100;
      meteors = meteors.filter(mm => mm !== m);
      if(lives <= 0) gameOver();
      return;
    }
  }
}

function gameOver(){ running = false; HUD.message.textContent = 'Game Over! Pontos: ' + score + ' — clique em Começar pra tentar de novo.'; HUD.message.classList.remove('hidden'); }

let last = performance.now();
function loop(now){
  const dt = (now - last)/1000; last = now;
  if(running){
    planets.forEach(p => p.update(dt));
    meteors.forEach(m => m.update(dt));
    player.update(dt);
    spawnTick++;
    if(spawnTick % Math.max(60, 220 - level*20) === 0) spawnItemSafe();
    if(spawnTick % Math.max(100, 260 - level*15) === 0) spawnMeteor();
    checkCollisions();
  }
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let i=0;i<80;i++){ ctx.fillStyle = 'rgba(255,255,255,0.02)'; ctx.fillRect((i*73)%canvas.width, (i*47)%canvas.height, 2,2); }
  planets.forEach(p => p.draw());
  items.forEach(it => it.draw());
  meteors.forEach(m => m.draw());
  if(player) player.draw();
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(8,8,160,44);
  requestAnimationFrame(loop);
}
last = performance.now();
requestAnimationFrame(loop);

startBtn.addEventListener('click', ()=>{ resetGame(); });
muteBtn.addEventListener('click', ()=>{ mute = !mute; muteBtn.textContent = mute ? '🔇' : '🔈'; });

IMAGES.planet.onload = ()=>{ IMAGES.planet.width = 120; IMAGES.planet.height = 120; };
IMAGES.meteor.onload = ()=>{};
IMAGES.penguin.onload = ()=>{};
IMAGES.star.onload = ()=>{};
