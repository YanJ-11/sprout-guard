/** A deterministic, DOM-free, five-lane garden defence simulation. */
export const BOARD = Object.freeze({ x: 210, y: 155, cols: 9, rows: 5, cellW: 86, cellH: 82 });

export const PLANTS = Object.freeze({
  sunflower: Object.freeze({ name: '向日葵', cost: 50, cooldown: 4.8, hp: 300, description: '定期送来 25 点阳光' }),
  peashooter: Object.freeze({ name: '豌豆射手', cost: 100, cooldown: 4.6, hp: 300, description: '向前发射豌豆，守护一整行' }),
  wallnut: Object.freeze({ name: '坚果', cost: 50, cooldown: 13, hp: 4000, description: '厚实又可靠，替伙伴挡住啃咬' }),
  snowpea: Object.freeze({ name: '寒冰射手', cost: 175, cooldown: 8, hp: 300, description: '冰豌豆让僵尸慢下来' }),
  cherry: Object.freeze({ name: '樱桃炸弹', cost: 150, cooldown: 24, hp: 300, description: '种下 1 秒后，清理周围九宫格' }),
});

export const LEVELS = Object.freeze([
  Object.freeze({
    id: 1, name: '晴日小院', subtitle: '在温柔的午后，守好第一座小花园。', duration: 160,
    waves: Object.freeze([
      Object.freeze({ at: 22, name: '午后访客', count: 5 }),
      Object.freeze({ at: 75, name: '小小队伍', count: 9 }),
      Object.freeze({ at: 127, name: '最后一波', count: 14 }),
    ]),
  }),
  Object.freeze({
    id: 2, name: '落日花园', subtitle: '路障、铁桶和快步客人，一起赶来赏花。', duration: 220,
    waves: Object.freeze([
      Object.freeze({ at: 24, name: '晚风来信', count: 6 }),
      Object.freeze({ at: 73, name: '路障小分队', count: 11 }),
      Object.freeze({ at: 126, name: '铁桶派对', count: 14 }),
      Object.freeze({ at: 180, name: '最后一波', count: 18 }),
    ]),
  }),
]);

const ZOMBIES = {
  basic: { hp: 180, speed: 14 },
  cone: { hp: 340, speed: 13 },
  bucket: { hp: 560, speed: 12 },
  runner: { hp: 110, speed: 25 },
};
const TYPES_BY_LEVEL = {
  1: [
    ['basic', 'basic', 'basic', 'basic', 'basic'],
    ['basic', 'basic', 'cone', 'basic', 'basic', 'cone', 'basic', 'cone', 'basic'],
    ['basic', 'cone', 'basic', 'runner', 'basic', 'cone', 'basic', 'cone', 'runner', 'basic', 'cone', 'basic', 'runner', 'basic'],
  ],
  2: [
    ['basic', 'basic', 'basic', 'cone', 'basic', 'basic'],
    ['basic', 'cone', 'basic', 'runner', 'basic', 'cone', 'basic', 'cone', 'basic', 'runner', 'cone'],
    ['cone', 'basic', 'bucket', 'basic', 'runner', 'cone', 'basic', 'cone', 'bucket', 'basic', 'runner', 'cone', 'basic', 'cone'],
    ['cone', 'bucket', 'basic', 'runner', 'cone', 'basic', 'bucket', 'cone', 'runner', 'basic', 'cone', 'bucket', 'basic', 'runner', 'cone', 'basic', 'cone', 'runner'],
  ],
};

export class Game {
  constructor(levelId = 1, { random = Math.random, onEvent = () => {} } = {}) {
    this.level = LEVELS.find((level) => level.id === Number(levelId)) || LEVELS[0];
    this.random = random;
    this.onEvent = onEvent;
    this.status = 'playing';
    this.time = 0;
    this.sun = this.level.id === 1 ? 150 : 175;
    this.plants = [];
    this.zombies = [];
    this.projectiles = [];
    this.suns = [];
    this.effects = [];
    this.mowers = Array.from({ length: BOARD.rows }, (_, row) => ({ row, x: 195, y: this._foot(row), active: false, used: false }));
    this.cooldowns = Object.fromEntries(Object.keys(PLANTS).map((type) => [type, 0]));
    this.wave = 0;
    this.kills = 0;
    this.collected = 0;
    this.planted = 0;
    this._id = 0;
    this._nextSkySun = 5;
    this._spawnIndex = 0;
    this.schedule = this._makeSchedule();
  }

  get elapsedRatio() {
    return Math.min(1, this.time / this.level.duration);
  }

  _foot(row) {
    return BOARD.y + (row + 1) * BOARD.cellH - 8;
  }

  _emit(type, data = {}) {
    this.onEvent({ type, time: this.time, ...data });
  }

  _random() {
    const value = Number(this.random());
    return Number.isFinite(value) ? Math.max(0, Math.min(0.999999, value)) : 0.5;
  }

  _makeSchedule() {
    const result = [];
    for (let wave = 0; wave < this.level.waves.length; wave += 1) {
      const definition = this.level.waves[wave];
      const rows = [0, 1, 2, 3, 4];
      for (let i = rows.length - 1; i > 0; i -= 1) {
        const j = Math.floor(this._random() * (i + 1));
        [rows[i], rows[j]] = [rows[j], rows[i]];
      }
      // Every initial group covers the five lanes before returning to a lane.
      const spacing = wave === 0 ? 4.8 : (this.level.id === 1 ? 2.35 : 2.15);
      for (let i = 0; i < definition.count; i += 1) {
        result.push({ at: definition.at + i * spacing, row: rows[i % 5], type: TYPES_BY_LEVEL[this.level.id][wave][i], wave: wave + 1 });
      }
    }
    return result.sort((a, b) => a.at - b.at);
  }

  plant(type, row, col) {
    if (this.status !== 'playing') return { ok: false, reason: '这一局已经结束啦' };
    const definition = Object.prototype.hasOwnProperty.call(PLANTS, type) ? PLANTS[type] : null;
    if (!definition) return { ok: false, reason: '请先选一张植物卡片' };
    if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row >= BOARD.rows || col < 0 || col >= BOARD.cols) {
      return { ok: false, reason: '把植物种在草坪格子里吧' };
    }
    if (this.plants.some((plant) => plant.row === row && plant.col === col)) return { ok: false, reason: '这个格子已经有小伙伴啦' };
    if (this.cooldowns[type] > 0.001) return { ok: false, reason: '卡片还在休息，稍等一下' };
    if (this.sun < definition.cost) return { ok: false, reason: '阳光还不够，收集一些再来吧' };
    const plant = {
      id: ++this._id, type, row, col,
      x: BOARD.x + (col + 0.5) * BOARD.cellW, y: this._foot(row),
      hp: definition.hp, maxHp: definition.hp, age: 0, hurt: 0,
      shootIn: 0.25, sunIn: 8.5 + this._random(),
    };
    this.sun -= definition.cost;
    this.cooldowns[type] = definition.cooldown;
    this.plants.push(plant);
    this.planted += 1;
    this.effects.push({ type: 'puff', x: plant.x, y: plant.y, age: 0, duration: 0.45 });
    this._emit('plant', { plant, plantType: type, row, col, cost: definition.cost });
    return { ok: true, reason: '' };
  }

  removePlant(row, col) {
    if (this.status !== 'playing') return false;
    const index = this.plants.findIndex((plant) => plant.row === row && plant.col === col);
    if (index < 0) return false;
    const [plant] = this.plants.splice(index, 1);
    this.effects.push({ type: 'leaf', x: plant.x, y: plant.y - 20, age: 0, duration: 0.55 });
    this._emit('shovel', { plant, row, col });
    return true;
  }

  collectSun(id) {
    if (this.status !== 'playing') return false;
    const index = this.suns.findIndex((sun) => sun.id === id);
    if (index < 0) return false;
    const [sun] = this.suns.splice(index, 1);
    this.sun += sun.value;
    this.collected += sun.value;
    this.effects.push({ type: 'sparkle', x: sun.x, y: sun.y, age: 0, duration: 0.6, value: sun.value });
    this._emit('collect', { id: sun.id, x: sun.x, y: sun.y, value: sun.value });
    return true;
  }

  update(dt) {
    if (this.status !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
    let remaining = dt;
    while (remaining > 1e-8 && this.status === 'playing') {
      const step = Math.min(0.05, remaining);
      this._step(step);
      remaining -= step;
    }
  }

  _makeSun(x, y, source) {
    const sky = source === 'sky';
    const sun = {
      id: ++this._id, x, y, value: 25, age: 0, ttl: sky ? 19 : 21,
      targetY: sky ? BOARD.y + 35 + this._random() * (BOARD.rows * BOARD.cellH - 65) : y + 22,
      source,
    };
    this.suns.push(sun);
    this._emit('sun', { sun, source });
  }

  _spawn(entry) {
    const definition = ZOMBIES[entry.type] || ZOMBIES.basic;
    this.zombies.push({
      id: ++this._id, type: entry.type, row: entry.row, x: 1030, y: this._foot(entry.row),
      hp: definition.hp, maxHp: definition.hp, age: 0, hurt: 0, slow: 0, bite: false,
      speed: definition.speed, biteIn: 0,
    });
  }

  _damage(zombie, damage, source) {
    if (zombie.hp <= 0) return;
    zombie.hp -= damage;
    zombie.hurt = 0.16;
    this._emit('hit', { target: 'zombie', id: zombie.id, x: zombie.x, y: zombie.y - 36, damage, source });
    if (zombie.hp <= 0) {
      this.kills += 1;
      this.effects.push({ type: 'puff', x: zombie.x, y: zombie.y - 20, age: 0, duration: 0.65, zombie: true });
    }
  }

  _finish(status) {
    if (this.status !== 'playing') return;
    this.status = status;
    this._emit(status === 'won' ? 'win' : 'lose', { kills: this.kills, collected: this.collected, planted: this.planted });
  }

  _step(dt) {
    this.time += dt;
    for (const type of Object.keys(this.cooldowns)) this.cooldowns[type] = Math.max(0, this.cooldowns[type] - dt);
    for (const effect of this.effects) effect.age += dt;
    this.effects = this.effects.filter((effect) => effect.age < effect.duration);

    while (this.wave < this.level.waves.length && this.time + 1e-7 >= this.level.waves[this.wave].at) {
      this.wave += 1;
      this._emit('wave', { wave: this.wave, name: this.level.waves[this.wave - 1].name, final: this.wave === this.level.waves.length });
    }
    while (this._spawnIndex < this.schedule.length && this.time + 1e-7 >= this.schedule[this._spawnIndex].at) {
      this._spawn(this.schedule[this._spawnIndex]);
      this._spawnIndex += 1;
    }
    if (this.time + 1e-7 >= this._nextSkySun) {
      this._makeSun(BOARD.x + 40 + this._random() * (BOARD.cols * BOARD.cellW - 80), 115, 'sky');
      this._nextSkySun += 8;
    }
    for (const sun of this.suns) {
      sun.age += dt;
      sun.y = Math.min(sun.targetY, sun.y + (sun.source === 'sky' ? 34 : 26) * dt);
    }
    this.suns = this.suns.filter((sun) => sun.age < sun.ttl);

    for (const plant of this.plants) {
      if (plant.hp <= 0) continue;
      plant.age += dt;
      plant.hurt = Math.max(0, plant.hurt - dt);
      if (plant.type === 'sunflower') {
        plant.sunIn -= dt;
        if (plant.sunIn <= 0) {
          this._makeSun(plant.x + (this._random() - 0.5) * 32, plant.y - 53, 'sunflower');
          plant.sunIn += 17;
        }
      } else if (plant.type === 'cherry' && plant.age + 1e-7 >= 1) {
        for (const zombie of this.zombies) {
          if (zombie.hp > 0 && Math.abs(zombie.row - plant.row) <= 1 && Math.abs(zombie.x - plant.x) <= BOARD.cellW * 1.5) {
            this._damage(zombie, 1800, 'cherry');
          }
        }
        plant.hp = 0;
        this.effects.push({ type: 'explode', x: plant.x, y: plant.y - 32, age: 0, duration: 0.85, radius: BOARD.cellW * 1.5 });
        this._emit('explode', { x: plant.x, y: plant.y - 32, row: plant.row, col: plant.col });
      } else if (plant.type === 'peashooter' || plant.type === 'snowpea') {
        plant.shootIn = Math.max(0, plant.shootIn - dt);
        if (plant.shootIn <= 0 && this.zombies.some((zombie) => zombie.hp > 0 && zombie.row === plant.row && zombie.x >= plant.x + 14)) {
          const projectile = {
            id: ++this._id, type: plant.type === 'snowpea' ? 'ice' : 'pea', row: plant.row,
            x: plant.x + 30, y: plant.y - 40, age: 0,
          };
          this.projectiles.push(projectile);
          plant.shootIn = plant.type === 'snowpea' ? 1.45 : 1.3;
          this._emit('shoot', { plantId: plant.id, plantType: plant.type, projectile, x: projectile.x, y: projectile.y });
        }
      }
    }
    this.plants = this.plants.filter((plant) => plant.hp > 0);

    for (const projectile of this.projectiles) {
      const nextX = projectile.x + 295 * dt;
      // Swept collision chooses the first living zombie along the shot's path.
      const target = this.zombies.filter((zombie) => zombie.hp > 0 && zombie.row === projectile.row && zombie.x + 25 >= projectile.x && zombie.x - 25 <= nextX)
        .sort((a, b) => a.x - b.x)[0];
      projectile.age += dt;
      if (target) {
        this._damage(target, projectile.type === 'ice' ? 20 : 22, projectile.type);
        if (projectile.type === 'ice' && target.hp > 0) target.slow = 4;
        this.effects.push({ type: 'hit', x: target.x - 15, y: projectile.y, age: 0, duration: 0.2, ice: projectile.type === 'ice' });
        projectile.dead = true;
      } else {
        projectile.x = nextX;
      }
    }
    this.projectiles = this.projectiles.filter((projectile) => !projectile.dead && projectile.x < 1105);

    for (const zombie of this.zombies) {
      if (zombie.hp <= 0) continue;
      zombie.age += dt;
      zombie.hurt = Math.max(0, zombie.hurt - dt);
      zombie.slow = Math.max(0, zombie.slow - dt);
      const factor = zombie.slow > 0 ? 0.48 : 1;
      const nextX = zombie.x - zombie.speed * factor * dt;
      const target = this.plants.filter((plant) => plant.hp > 0 && plant.row === zombie.row && plant.x <= zombie.x + 16 && nextX <= plant.x + 38)
        .sort((a, b) => b.x - a.x)[0];
      zombie.bite = Boolean(target);
      if (target) {
        zombie.x = Math.max(zombie.x, target.x + 33);
        zombie.biteIn -= dt * factor;
        if (zombie.biteIn <= 0) {
          zombie.biteIn += 0.5;
          target.hp -= 14;
          target.hurt = 0.17;
          this._emit('eat', { zombieId: zombie.id, plantId: target.id, x: target.x, y: target.y - 25, damage: 14 });
          if (target.hp <= 0) this.effects.push({ type: 'leaf', x: target.x, y: target.y - 20, age: 0, duration: 0.5 });
        }
      } else {
        zombie.x = nextX;
        zombie.biteIn = 0;
      }
      const mower = this.mowers[zombie.row];
      if (zombie.x <= BOARD.x - 23 && mower && !mower.used) {
        mower.used = true;
        mower.active = true;
        this._emit('mower', { row: mower.row, x: mower.x, y: mower.y });
      }
      if (zombie.x < 115 && (!mower || !mower.active)) this._finish('lost');
    }

    for (const mower of this.mowers) {
      if (!mower.active) continue;
      const nextX = mower.x + 340 * dt;
      for (const zombie of this.zombies) {
        if (zombie.hp > 0 && zombie.row === mower.row && zombie.x + 28 >= mower.x - 32 && zombie.x - 28 <= nextX + 35) this._damage(zombie, 10000, 'mower');
      }
      mower.x = nextX;
      if (mower.x > 1110) mower.active = false;
    }
    this.plants = this.plants.filter((plant) => plant.hp > 0);
    this.zombies = this.zombies.filter((zombie) => zombie.hp > 0);
    if (this.status === 'playing' && this._spawnIndex >= this.schedule.length && this.zombies.length === 0) this._finish('won');
  }
}
