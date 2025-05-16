// Основные игровые элементы
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const healthElement = document.getElementById('health');
const shieldElement = document.getElementById('shield');
const menu = document.getElementById('menu');
const gameContainer = document.getElementById('gameContainer');
const controlsInfo = document.getElementById('controlsInfo');
const startButton = document.getElementById('startButton');
const controlsButton = document.getElementById('controlsButton');
const backButton = document.getElementById('backButton');
const highscoresButton = document.getElementById('highscoresButton');
const highscoresMenu = document.getElementById('highscoresMenu');
const highscoresList = document.getElementById('highscoresList');
const pauseButton = document.getElementById('pauseButton');

// Настройки уровней
const levels = [
  { // Уровень 1
    name: "Астероидный пояс",
    asteroidSpeed: 1.5,
    spawnRate: 1500,
    bgColor: '#000033',
    enemies: ['asteroid'],
    requiredScore: 1000
  },
  { // Уровень 2
    name: "Вторжение НЛО",
    asteroidSpeed: 2,
    spawnRate: 1000,
    bgColor: '#1a1a2e',
    enemies: ['asteroid', 'ufo'],
    requiredScore: 3000
  },
  { // Босс
    name: "Финальный босс",
    asteroidSpeed: 0,
    spawnRate: 0,
    bgColor: '#330000',
    enemies: ['boss'],
    requiredScore: 999999 // Не требуется, переход по завершению уровня
  }
];

// Игровые переменные
let currentLevel = 0;
let score = 0;
let gameLoop;
let keys = {};
let gameOver = false;
let lastAsteroidTime = 0;
let lastShotTime = 0;
let shotInterval = 200;
let shootIntervalMobile;
let lastFrameTime = 0; // 

// Игровые объекты
const player = {
  x: canvas.width / 2,
  y: canvas.height - 80,
  width: 30,
  height: 30,
  speed: 6,
  health: 100,
  maxHealth: 100,
  shield: 0,
  maxShield: 100,
  weaponLevel: 1,
};

let bullets = [];
let asteroids = [];
let ufos = [];
let bosses = [];
let particles = [];
let stars = [];
let bonuses = [];

const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const shootBtn = document.getElementById('shootBtn');

// Обработчики для кнопок движения
leftBtn.addEventListener('touchstart', (e) => { 
    e.preventDefault();
    keys['ArrowLeft'] = true; 
});
leftBtn.addEventListener('touchend', (e) => { 
    e.preventDefault();
    keys['ArrowLeft'] = false; 
});

rightBtn.addEventListener('touchstart', (e) => { 
    e.preventDefault();
    keys['ArrowRight'] = true; 
});
rightBtn.addEventListener('touchend', (e) => { 
    e.preventDefault();
    keys['ArrowRight'] = false; 
});

// Обработчики для кнопки стрельбы (долгое нажатие)
shootBtn.addEventListener('touchstart', (e) => { 
    e.preventDefault();
    keys[' '] = true; 
    // Автоматическая стрельба при удержании
    shootIntervalMobile = setInterval(() => {
        if (!gameOver) shoot();
    }, shotInterval);
});

shootBtn.addEventListener('touchend', (e) => { 
    e.preventDefault();
    keys[' '] = false; 
    clearInterval(shootIntervalMobile);
});

function resizeCanvas() {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const maxWidth = Math.min(800, window.innerWidth * 0.95);
    const maxHeight = Math.min(600, window.innerHeight * 0.8);
    const ratio = 4/3; // Соотношение сторон 4:3
    
    if (maxWidth/maxHeight > ratio) {
        canvas.width = maxHeight * ratio;
        canvas.height = maxHeight;
    } else {
        canvas.width = maxWidth;
        canvas.height = maxWidth / ratio;
    }
    
    // Пересчитываем позицию игрока
    player.y = canvas.height - 80;
    player.x = canvas.width / 2;
    
    // Показываем/скрываем мобильные кнопки
    document.getElementById('mobileControls').style.display = 
        isMobile ? 'flex' : 'none';
}




function resizeCanvas() {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const maxWidth = Math.min(800, window.innerWidth * 0.95);
    const maxHeight = Math.min(600, window.innerHeight * 0.8);
    const ratio = 4/3; // Соотношение сторон 4:3
    
    if (maxWidth/maxHeight > ratio) {
        canvas.width = maxHeight * ratio;
        canvas.height = maxHeight;
    } else {
        canvas.width = maxWidth;
        canvas.height = maxWidth / ratio;
    }
    
    // Пересчитываем позицию игрока
    player.y = canvas.height - 80;
    player.x = canvas.width / 2;
    
    // Показываем/скрываем мобильные кнопки
    document.getElementById('mobileControls').style.display = 
        isMobile ? 'flex' : 'none';
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Инициализация при загрузке

// Инициализация звездного фона
function initStars() {
  stars = Array(200).fill().map(() => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 1.5,
    alpha: Math.random() * 0.8 + 0.2,
    speed: Math.random() * 0.5 + 0.1
  }));
}

// Управление
document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if (e.key === ' ') e.preventDefault();
});
document.addEventListener('keyup', (e) => keys[e.key] = false);

// Создание объектов
function createAsteroid() {
  const now = Date.now();
  const level = levels[currentLevel];
  
  if (now - lastAsteroidTime > level.spawnRate) {
    const size = Math.random() < 0.2 ? 'large' : 'small';
    const asteroidWidth = size === 'large' ? 80 : 40;
    
    asteroids.push({
      x: Math.random() * (canvas.width - asteroidWidth),
      y: -asteroidWidth,
      width: asteroidWidth,
      height: asteroidWidth,
      speed: size === 'large' ? 1 : 2,
      health: size === 'large' ? 3 : 1,
      size: size
    });
    
    lastAsteroidTime = now;
  }
}

function createUFO() {
  ufos.push({
    x: Math.random() * canvas.width,
    y: 50,
    width: 60,
    height: 30,
    speed: 3,
    health: 5,
    shootInterval: 2000,
    lastShot: 0
  });
}

function createBoss() {
  bosses.push({
    x: canvas.width/2 - 100,
    y: 50,
    width: 250, // Увеличили размер
    height: 100,
    health: 200, // Увеличили здоровье
    pattern: 'horizontal',
    moveSpeed: 4, // Увеличили скорость
    shootInterval: 1000,
    lastShot: 0,
    phase: 1, // Добавили фазы боя
    invulnerable: false // Для фазовых переходов
  });
}

// Игровая логика
function movePlayer() {
  if (keys['ArrowLeft'] && player.x > 20) player.x -= player.speed;
  if (keys['ArrowRight'] && player.x < canvas.width - 50) player.x += player.speed;
  if (keys[' ']) shoot();
}

function shoot() {
    const now = Date.now();
    if (now - lastShotTime < shotInterval) return;

    const bulletCount = player.weaponLevel;
    const spreadAngle = 10; // Угол разброса
    
    for (let i = 0; i < bulletCount; i++) {
        const angle = (i - (bulletCount - 1) / 2) * (spreadAngle / (bulletCount - 1 || 1));
        bullets.push({
            x: player.x + player.width/2 - 2.5,
            y: player.y - 10,
            width: 5,
            height: 15,
            speed: 9,
            angle: angle * Math.PI / 180,
            isEnemy: false
        });
    }

    lastShotTime = now;
}

function updateObjects() {
  // Обновление пуль (добавляем обработку угла)
  bullets.forEach(bullet => {
    if (bullet.isEnemy) {
      bullet.y -= bullet.speed;
      if (bullet.angle !== undefined) {
        bullet.x += Math.cos(bullet.angle) * 5;
        bullet.y += Math.sin(bullet.angle) * 5;
      }
    } else {
      bullet.y -= bullet.speed;
      bullet.x += Math.sin(bullet.angle) * bullet.speed * 0.5;
    }
  });
  bullets = bullets.filter(b => b.y > -20 && b.y < canvas.height + 20 && b.x > -20 && b.x < canvas.width + 20);

  // Обновление астероидов
  asteroids.forEach(asteroid => asteroid.y += asteroid.speed);
  asteroids = asteroids.filter(a => a.y < canvas.height + 50);

  // Обновление НЛО
  ufos.forEach(ufo => {
    ufo.y += ufo.speed * 0.5;
    ufo.x += Math.sin(Date.now()/1000) * 2;
  });
  ufos = ufos.filter(u => u.y < canvas.height + 50);

  // Обновление частиц
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.02;
  });
  particles = particles.filter(p => p.life > 0);

  // Обновление звезд
  stars.forEach(star => {
    star.y += star.speed;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  });

  // Обновление бонусов
  bonuses.forEach(bonus => bonus.y += 2);
  bonuses = bonuses.filter(b => b.y < canvas.height && b.lifespan-- > 0);
}




function updateBoss() {
  bosses.forEach(boss => {
    // Улучшенное движение босса
    if (boss.pattern === 'horizontal') {
      boss.x += boss.moveSpeed;
      if (boss.x > canvas.width - boss.width || boss.x < 0) {
        boss.moveSpeed *= -1.1; // Ускоряемся после отскока
      }
    }

    // Улучшенная стрельба
    const now = Date.now();
    if (now - boss.lastShot > boss.shootInterval) {
      // Основная атака - прямо в игрока
      const angleToPlayer = Math.atan2(
        player.y - (boss.y + boss.height), 
        player.x - (boss.x + boss.width/2)
      );
         for (let i = -1; i <= 1; i++) {
        bullets.push({
          x: boss.x + boss.width/2,
          y: boss.y + boss.height,
          width: 15,
          height: 25,
          speed: -7,
          angle: angleToPlayer + (i * 0.3),
          isEnemy: true
        });
      }

      boss.lastShot = now;
    }
  });
    }



// Проверки столкновений
function checkCollisions() {


  // Пули с астероидами
  asteroids.forEach((asteroid, aIdx) => {
    bullets.forEach((bullet, bIdx) => {
      if (!bullet.isEnemy && checkRectCollision(bullet, asteroid)) {
        asteroid.health--;
        bullets.splice(bIdx, 1);
        
        if (asteroid.health <= 0) {
          createExplosion(asteroid.x + asteroid.width/2, asteroid.y + asteroid.height/2);
          score += asteroid.size === 'large' ? 50 : 20;
          
          if (asteroid.size === 'large') {
            for (let i = 0; i < 3; i++) {
              asteroids.push({
                x: asteroid.x + Math.random() * asteroid.width,
                y: asteroid.y + Math.random() * asteroid.height,
                width: 40,
                height: 40,
                speed: 2 + Math.random() * 2,
                health: 1,
                size: 'small'
              });
            }
          }
          
          if (Math.random() < 0.2) {
            bonuses.push({
              x: asteroid.x,
              y: asteroid.y,
              type: ['health', 'shield', 'weapon'][Math.floor(Math.random() * 3)],
              lifespan: 300
            });
          }
          
          asteroids.splice(aIdx, 1);
        }
      }
    });
  });

  // Пули с НЛО
  ufos.forEach((ufo, uIdx) => {
    bullets.forEach((bullet, bIdx) => {
      if (!bullet.isEnemy && checkRectCollision(bullet, ufo)) {
        ufo.health--;
        bullets.splice(bIdx, 1);
        
        if (ufo.health <= 0) {
          createExplosion(ufo.x + ufo.width/2, ufo.y + ufo.height/2);
          score += 100;
          ufos.splice(uIdx, 1);
        }
      }
    });
  });

// В проверке столкновений пуль с боссом:
bosses.forEach((boss, bossIdx) => {
  bullets.forEach((bullet, bIdx) => {
    if (!bullet.isEnemy && checkRectCollision(bullet, boss) && !boss.invulnerable) {
      boss.health--;
      bullets.splice(bIdx, 1);
      
      // Переход между фазами
      if (boss.health === 150 || boss.health === 80) {
        boss.invulnerable = true;
        boss.phase++;
        // Эффект трансформации
        for (let i = 0; i < 50; i++) {
          particles.push({
            x: boss.x + boss.width/2,
            y: boss.y + boss.height/2,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            size: 5 + Math.random() * 10,
            life: 1.5,
            color: `hsl(${Math.random() * 60 + 300}, 100%, 50%)`
          });
        }
        setTimeout(() => boss.invulnerable = false, 2000);
      }
      
      if (boss.health <= 0) {
        createExplosion(boss.x + boss.width/2, boss.y + boss.height/2, 100);
        score += 5000;
        bosses.splice(bossIdx, 1);
        setTimeout(() => {
          alert(`ПОБЕДА! Босс уничтожен! Финальный счёт: ${score}`);
          saveHighscore();
          gameContainer.style.display = 'none';
          menu.style.display = 'flex';
        }, 1000);
      }
    }
  });
});

  // Вражеские пули с игроком
bullets.forEach((bullet, bIdx) => {
  if (bullet.isEnemy && checkRectCollision(bullet, player)) {
    bullets.splice(bIdx, 1);
    
    if (player.shield > 0) {
      player.shield = Math.max(0, player.shield - 10); // Увеличим урон от пуль босса
    } else {
      player.health -= 10;
    }
    
    if (player.health <= 0) {
      gameOver = true;
      cancelAnimationFrame(gameLoop);
      setTimeout(() => {
        alert(`Корабль уничтожен! Счёт: ${score}`);
        saveHighscore();
        gameContainer.style.display = 'none';
        menu.style.display = 'flex';
      }, 50);
    }
  }
});

 [...asteroids].forEach((obj, index) => {
    if (checkRectCollision(obj, player)) {
      // Создаем взрыв на месте астероида
      createExplosion(obj.x + obj.width/2, obj.y + obj.height/2);
      
      // Наносим урон игроку
      if (player.shield > 0) {
        player.shield = Math.max(0, player.shield - 15);
      } else {
        player.health -= 15;
      }
      
      // Удаляем астероид
      asteroids.splice(index, 1);
      
      // Проверяем здоровье игрока
      if (player.health <= 0) {
        gameOver = true;
        cancelAnimationFrame(gameLoop);
        setTimeout(() => {
          alert(`Корабль уничтожен! Счёт: ${score}`);
          saveHighscore();
          gameContainer.style.display = 'none';
          menu.style.display = 'flex';
        }, 50);
      }
    }
  });


  // Бонусы с игроком
  bonuses.forEach((bonus, idx) => {
    if (checkCircleCollision(player, bonus)) {
      applyBonus(bonus.type);
      bonuses.splice(idx, 1);
    }
  });
}



function checkLevelProgress() {
  if (currentLevel < levels.length - 1 && score >= levels[currentLevel].requiredScore) {
    currentLevel++;
    
    // Очистка врагов
    asteroids = [];
    ufos = [];
    
    // Эффект перехода
    ctx.fillStyle = 'gold';
    ctx.font = '50px Arial';
    ctx.fillText(`УРОВЕНЬ ${currentLevel + 1}: ${levels[currentLevel].name}`, 
                 canvas.width/2 - 300, canvas.height/2);
    
    // Спавн босса на последнем уровне
    if (currentLevel === levels.length - 1) {
      setTimeout(createBoss, 2000);
    }
  }
}

// Вспомогательные функции
function checkRectCollision(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}

function checkCircleCollision(rect, circle) {
  const centerX = rect.x + rect.width/2;
  const centerY = rect.y + rect.height/2;
  const distance = Math.sqrt(Math.pow(centerX - (circle.x + 10), 2) + 
                             Math.pow(centerY - (circle.y + 10), 2));
  return distance < 30;
}

function applyBonus(type) {
  switch (type) {
    case 'health':
      player.health = Math.min(player.maxHealth, player.health + 30);
      break;
    case 'shield':
      player.shield = Math.min(player.maxShield, player.shield + 30);
      break;
    case 'weapon':
      player.weaponLevel = Math.min(3, player.weaponLevel + 1);
      shotInterval = Math.max(50, shotInterval - 50);
      break;
  }
  healthElement.textContent = player.health;
  shieldElement.textContent = player.shield;
}

function createExplosion(x, y, size = 1) {
  const particlesCount = size === 1 ? 20 : 100;
  for(let i = 0; i < particlesCount; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 8 * size,
      vy: (Math.random() - 0.5) * 8 * size,
      size: (2 + Math.random() * 4) * size,
      life: (0.8 + Math.random() * 0.4) * size,
      color: size === 1 ? 
        `hsl(${Math.random() * 40 + 20}, 70%, 50%)` :
        `hsl(${Math.random() * 60 + 10}, 100%, 50%)`
    });
  }
}

// Отрисовка
function drawBackground() {
  const level = levels[currentLevel];
  ctx.fillStyle = level.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  stars.forEach(star => {
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPlayer() {
  // Полоска здоровья
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(player.x - 10, player.y - 20, 50, 5);
  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(player.x - 10, player.y - 20, 50 * (player.health / player.maxHealth), 5);

  // Полоска щита
  if (player.shield > 0) {
    ctx.fillStyle = 'rgba(52, 152, 219, 0.7)';
    ctx.fillRect(player.x - 10, player.y - 28, 50 * (player.shield / player.maxShield), 3);
  }


  // Корабль
  ctx.save();
  ctx.translate(player.x + 15, player.y + 15);
  
  // Основной корпус
  ctx.fillStyle = '#2ecc71';
  ctx.beginPath();
  ctx.moveTo(-12, 12);
  ctx.lineTo(0, -12);
  ctx.lineTo(12, 12);
  ctx.closePath();
  ctx.fill();

  // Двигатель
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.moveTo(-8, 12);
  ctx.lineTo(0, 20);
  ctx.lineTo(8, 12);
  ctx.closePath();
  ctx.fill();

  // Улучшения оружия
  if (player.weaponLevel > 1) {
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.moveTo(-6, 12);
    ctx.lineTo(0, 18);
    ctx.lineTo(6, 12);
    ctx.closePath();
    ctx.fill();
  }

  if (player.weaponLevel > 2) {
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.moveTo(-4, 12);
    ctx.lineTo(0, 16);
    ctx.lineTo(4, 12);
    ctx.closePath();
    ctx.fill();
  }

  // Свечение
  ctx.beginPath();
  ctx.filter = 'blur(15px)';
  ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
  ctx.arc(0, 0, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.filter = 'none';

  // Щит
  if (player.shield > 0) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(52, 152, 219, 0.5)';
    ctx.lineWidth = 2;
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawBullets() {
  bullets.forEach(bullet => {
    // Свечение
    ctx.beginPath();
    ctx.fillStyle = bullet.isEnemy ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 223, 0, 0.3)';
    ctx.arc(bullet.x + bullet.width/2, bullet.y + bullet.height/2, 12, 0, Math.PI * 2);
    ctx.fill();

    // Пуля
    if (bullet.isEnemy) {
      ctx.fillStyle = '#ff0000';
    } else {
      ctx.fillStyle = player.weaponLevel === 1 ? '#ffd700' :
                     player.weaponLevel === 2 ? '#ff9f1c' : '#ff6b6b';
    }
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

function drawAsteroids() {
  asteroids.forEach(asteroid => {
    ctx.save();
    ctx.translate(asteroid.x + asteroid.width/2, asteroid.y + asteroid.height/2);
    
    // Форма астероида
    ctx.fillStyle = asteroid.size === 'large' ? '#5d6d7e' : '#7f8c8d';
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = asteroid.size === 'large' ? 40 : 20;
      ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    ctx.closePath();
    ctx.fill();

    // Здоровье
    if (asteroid.health > 1) {
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(-asteroid.width/2, -asteroid.height/2 - 15, asteroid.width, 5);
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(-asteroid.width/2, -asteroid.height/2 - 15, 
                  asteroid.width * (asteroid.health / 3), 5);
    }

    ctx.restore();
  });
}

function drawUFOs() {
  ufos.forEach(ufo => {
    ctx.save();
    ctx.translate(ufo.x + ufo.width/2, ufo.y + ufo.height/2);
    
    // Корпус
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.ellipse(0, 0, ufo.width/2, ufo.height/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Купол
    ctx.fillStyle = 'rgba(100, 200, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(0, -5, ufo.width/3, 0, Math.PI);
    ctx.fill();
    
    // Здоровье
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(-ufo.width/2, -ufo.height/2 - 15, ufo.width, 5);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(-ufo.width/2, -ufo.height/2 - 15, 
                ufo.width * (ufo.health / 5), 5);

    ctx.restore();
  });
}

function drawBosses() {
  bosses.forEach(boss => {
    ctx.save();
    ctx.translate(boss.x + boss.width/2, boss.y + boss.height/2);
    
    // Угрожающий красный цвет с градиентом
    const gradient = ctx.createRadialGradient(0, 0, 50, 0, 0, 120);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(1, '#990000');
    ctx.fillStyle = gradient;
    
    // Основной корпус с закруглениями
    ctx.beginPath();
    ctx.roundRect(-boss.width/2, -boss.height/2, boss.width, boss.height, 20);
    ctx.fill();
    
    // Ядро босса (мерцает)
    ctx.fillStyle = `hsl(${Date.now() % 360}, 100%, 50%)`;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Здоровье (сложная многоуровневая система)
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(-boss.width/2, -boss.height/2 - 30, boss.width, 15);
    
    const healthPercent = boss.health / 200;
    if (healthPercent > 0.66) {
      ctx.fillStyle = '#00ff00';
    } else if (healthPercent > 0.33) {
      ctx.fillStyle = '#ffff00';
    } else {
      ctx.fillStyle = '#ff0000';
    }
    ctx.fillRect(-boss.width/2, -boss.height/2 - 30, boss.width * healthPercent, 15);
    
    // Угрожающая надпись при малом здоровье
    if (healthPercent < 0.3) {
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('УНИЧТОЖЕНИЕ НЕИЗБЕЖНО!', 0, -60);
    }
    
    ctx.restore();
  });
}

function drawParticles() {
  particles.forEach(p => {
    ctx.beginPath();
    ctx.fillStyle = p.color;
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBonuses() {
  bonuses.forEach(bonus => {
    ctx.save();
    ctx.translate(bonus.x + 15, bonus.y + 15);
    
    // Свечение
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Иконка
    switch(bonus.type) {
      case 'health':
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-10, 0);
        ctx.lineTo(0, 10);
        ctx.lineTo(10, 0);
        ctx.closePath();
        ctx.fill();
        break;
      case 'shield':
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'weapon':
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(-10, -5, 20, 10);
        ctx.fillRect(-5, -10, 10, 20);
        break;
    }
    
    ctx.restore();
  });
}

function drawHUD() {
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Уровень: ${currentLevel + 1}`, 20, 30);
  ctx.fillText(`След. уровень: ${levels[currentLevel].requiredScore - score}`, 20, 60);
}

function draw() {
  drawBackground();
  drawParticles();
  drawBullets();
  drawAsteroids();
  drawUFOs();
  drawBosses();
  drawBonuses();
  drawPlayer();
  drawHUD();
}

// Игровой цикл
function gameStep(timestamp) {
    if (gameOver) return;

    const level = levels[currentLevel];

    // Ограничиваем FPS для экономии батареи
    if (!lastFrameTime) lastFrameTime = timestamp;
    const deltaTime = timestamp - lastFrameTime;
    if (deltaTime < 16) { // ~60 FPS
        gameLoop = requestAnimationFrame(gameStep);
        return;
    }
    lastFrameTime = timestamp;

    // Обновление
    movePlayer();
    if (level.enemies.includes('asteroid') && timestamp - lastAsteroidTime > level.spawnRate) {
        createAsteroid();
        lastAsteroidTime = timestamp;
    }
    if (level.enemies.includes('ufo') && Math.random() < 0.002) createUFO();
    
    updateObjects();
    if (bosses.length > 0) updateBoss();
    checkCollisions();
    checkLevelProgress();

    // Отрисовка
    draw();

    // Обновление интерфейса
    scoreElement.textContent = score;
    healthElement.textContent = player.health;
    shieldElement.textContent = player.shield;

    gameLoop = requestAnimationFrame(gameStep);
}

// Управление игрой
function resetGame() {
  // Сброс состояния
  bullets = [];
  asteroids = [];
  ufos = [];
  bosses = [];
  particles = [];
  bonuses = [];
  currentLevel = 0;
  score = 0;
  gameOver = false;

  // Сброс игрока
  player.x = canvas.width / 2;
  player.y = canvas.height - 80;
  player.health = 100;
  player.shield = 0;
  player.weaponLevel = 1;
  shotInterval = 200;

  initStars();
}

function startGame() {
  menu.style.display = 'none';
  gameContainer.style.display = 'block';
  resetGame();
  gameLoop = requestAnimationFrame(gameStep);
}

function showControls() {
  menu.style.display = 'none';
  controlsInfo.style.display = 'block';
}

function backToMenu() {
  controlsInfo.style.display = 'none';
  highscoresMenu.style.display = 'none';
  menu.style.display = 'flex';
}

function showHighscores() {
  highscores = JSON.parse(localStorage.getItem('highscores')) || [];
  highscores.sort((a, b) => b.score - a.score);

  highscoresList.innerHTML = highscores.slice(0, 10).map((entry, index) => `
    <div class="highscore-item">
      #${index + 1} Счёт: ${entry.score} (${entry.date})
    </div>
  `).join('');
}

function saveHighscore() {
  highscores.push({
    score: score,
    date: new Date().toLocaleString()
  });
  localStorage.setItem('highscores', JSON.stringify(highscores));
}

// Инициализация
initStars();
startButton.addEventListener('click', startGame);
controlsButton.addEventListener('click', showControls);
backButton.addEventListener('click', backToMenu);
highscoresButton.addEventListener('click', () => {
  menu.style.display = 'none';
  highscoresMenu.style.display = 'flex';
  showHighscores();
});
pauseButton.addEventListener('click', () => {
  gameOver = true;
  cancelAnimationFrame(gameLoop);
  gameContainer.style.display = 'none';
  menu.style.display = 'flex';
});