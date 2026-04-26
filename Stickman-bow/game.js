
// ============================================
// STICKMAN BOW GAME
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameRunning = false;
let score = 0;
let level = 1;
let arrows = [];
let targets = [];
let particles = [];

// Player (Stickman)
const player = {
    x: 100,
    y: 350,
    width: 40,
    height: 80,
    armAngle: 0,
    bowDrawn: false,
    drawPower: 0
};

// Arrow properties
const arrow = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    active: false,
    length: 40
};

// Target properties
const target = {
    x: 0,
    y: 0,
    radius: 25,
    hit: false
};

// Mouse state
let mouse = {
    x: 0,
    y: 0,
    isDown: false,
    startX: 0,
    startY: 0
};

// Game settings
const GRAVITY = 0.3;
const MAX_POWER = 25;
const TARGET_SPEED = 2;

// Initialize game
function init() {
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    
    // Touch support
    canvas.addEventListener('touchstart', onTouchStart);
    canvas.addEventListener('touchmove', onTouchMove);
    canvas.addEventListener('touchend', onTouchEnd);
    
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('saveScoreBtn').addEventListener('click', showSaveScoreModal);
    
    // Load leaderboard
    loadLeaderboard();
    
    // Start game loop
    gameLoop();
}

// Load leaderboard from Firebase
function loadLeaderboard() {
    if (typeof getLeaderboard === 'function') {
        getLeaderboard((scores) => {
            displayLeaderboard(scores);
        });
    } else {
        // Demo data if Firebase not configured
        displayLeaderboard([
            { name: 'Demo Player 1', score: 100, level: 1 },
            { name: 'Demo Player 2', score: 80, level: 1 },
            { name: 'Demo Player 3', score: 60, level: 1 }
        ]);
    }
}

// Display leaderboard
function displayLeaderboard(scores) {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '';
    
    scores.slice(0, 10).forEach((s, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <span>${index + 1}. ${s.name}</span>
            <span>${s.score} pts (Lv.${s.level})</span>
        `;
        list.appendChild(item);
    });
}

// Start game
function startGame() {
    gameRunning = true;
    score = 0;
    level = 1;
    arrows = [];
    targets = [];
    particles = [];
    
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('restartBtn').style.display = 'none';
    document.getElementById('saveScoreBtn').style.display = 'none';
    
    spawnTarget();
}

// Restart game
function restartGame() {
    startGame();
}

// Show save score modal
function showSaveScoreModal() {
    const playerName = prompt('Masukkan nama Anda:', 'Player');
    if (playerName && typeof saveScore === 'function') {
        saveScore(playerName, score, level)
            .then(() => {
                alert('Skor tersimpan!');
                loadLeaderboard();
            })
            .catch((error) => {
                console.error('Error saving score:', error);
                alert('Gagal menyimpan skor. Pastikan Firebase sudah dikonfigurasi!');
            });
    } else if (!playerName) {
        alert('Silakan masukkan nama!');
    } else {
        alert('Firebase belum dikonfigurasi. Edit file firebase-config.js untuk menghubungkan ke Firebase Anda.');
    }
}

// Mouse events
function onMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.isDown = true;
    mouse.startX = mouse.x;
    mouse.startY = mouse.y;
    player.bowDrawn = true;
}

function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    
    if (mouse.isDown) {
        const dx = mouse.startX - mouse.x;
        const dy = mouse.startY - mouse.y;
        player.drawPower = Math.min(Math.sqrt(dx * dx + dy * dy) / 10, MAX_POWER);
        player.armAngle = Math.atan2(dy, dx);
    }
}

function onMouseUp(e) {
    if (mouse.isDown && player.drawPower > 2) {
        shootArrow();
    }
    mouse.isDown = false;
    player.bowDrawn = false;
    player.drawPower = 0;
}

// Touch events
function onTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    mouse.x = touch.clientX - rect.left;
    mouse.y = touch.clientY - rect.top;
    mouse.isDown = true;
    mouse.startX = mouse.x;
    mouse.startY = mouse.y;
    player.bowDrawn = true;
}

function onTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    mouse.x = touch.clientX - rect.left;
    mouse.y = touch.clientY - rect.top;
    
    if (mouse.isDown) {
        const dx = mouse.startX - mouse.x;
        const dy = mouse.startY - mouse.y;
        player.drawPower = Math.min(Math.sqrt(dx * dx + dy * dy) / 10, MAX_POWER);
        player.armAngle = Math.atan2(dy, dx);
    }
}

function onTouchEnd(e) {
    e.preventDefault();
    if (mouse.isDown && player.drawPower > 2) {
        shootArrow();
    }
    mouse.isDown = false;
    player.bowDrawn = false;
    player.drawPower = 0;
}

// Shoot arrow
function shootArrow() {
    const angle = player.armAngle;
    const power = player.drawPower;
    
    arrows.push({
        x: player.x + 30,
        y: player.y - 20,
        vx: Math.cos(angle) * power,
        vy: Math.sin(angle) * power,
        angle: angle,
        active: true
    });
}

// Spawn target
function spawnTarget() {
    target.x = canvas.width - 50;
    target.y = Math.random() * (canvas.height - 150) + 75;
    target.hit = false;
    target.speedY = (Math.random() - 0.5) * TARGET_SPEED * (1 + level * 0.1);
}

// Create particles
function createParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1,
            color: color
        });
    }
}

// Update game
function update() {
    if (!gameRunning) return;
    
    // Update arrows
    arrows.forEach(arrow => {
        if (arrow.active) {
            arrow.x += arrow.vx;
            arrow.y += arrow.vy;
            arrow.vy += GRAVITY;
            arrow.angle = Math.atan2(arrow.vy, arrow.vx);
            
            // Check collision with target
            const dx = arrow.x - target.x;
            const dy = arrow.y - target.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < target.radius && !target.hit) {
                target.hit = true;
                arrow.active = false;
                score += 10 * level;
                createParticles(target.x, target.y, '#ff6b6b');
                
                // Level up every 50 points
                if (score >= level * 50) {
                    level++;
                }
                
                document.getElementById('score').textContent = score;
                document.getElementById('level').textContent = level;
                
                setTimeout(spawnTarget, 500);
            }
            
            // Remove if off screen
            if (arrow.x > canvas.width || arrow.y > canvas.height) {
                arrow.active = false;
            }
        }
    });
    
    // Update target
    if (!target.hit) {
        target.y += target.speedY;
        if (target.y < 50 || target.y > canvas.height - 50) {
            target.speedY *= -1;
        }
    }
    
    // Update particles
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
    });
    particles = particles.filter(p => p.life > 0);
    
    // Clean up arrows
    arrows = arrows.filter(a => a.active);
}

// Draw game
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground
    ctx.fillStyle = '#4a7c59';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    
    // Draw grass details
    ctx.fillStyle = '#5a8c69';
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, canvas.height - 50);
        ctx.lineTo(i + 10, canvas.height - 60);
        ctx.lineTo(i + 20, canvas.height - 50);
        ctx.fill();
    }
    
    // Draw stickman
    drawStickman();
    
    // Draw target
    drawTarget();
    
    // Draw arrows
    arrows.forEach(arrow => {
        drawArrow(arrow);
    });
    
    // Draw particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
    
    // Draw aim line
    if (player.bowDrawn && player.drawPower > 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(player.x + 30, player.y - 20);
        const aimX = player.x + 30 + Math.cos(player.armAngle) * player.drawPower * 5;
        const aimY = player.y - 20 + Math.sin(player.armAngle) * player.drawPower * 5;
        ctx.lineTo(aimX, aimY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw power indicator
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.fillText(`Power: ${Math.round(player.drawPower / MAX_POWER * 100)}%`, player.x - 20, player.y - 60);
    }
    
    // Draw game over overlay
    if (!gameRunning && score > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.font = '24px Arial';
        ctx.fillText(`Skor: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText(`Level: ${level}`, canvas.width / 2, canvas.height / 2 + 50);
        
        ctx.textAlign = 'left';
    }
}

// Draw stickman
function drawStickman() {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    
    // Head
    ctx.beginPath();
    ctx.arc(player.x, player.y - 60, 15, 0, Math.PI * 2);
    ctx.stroke();
    
    // Body
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 45);
    ctx.lineTo(player.x, player.y);
    ctx.stroke();
    
    // Legs
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x - 15, player.y + 30);
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + 15, player.y + 30);
    ctx.stroke();
    
    // Arms
    const armEndX = player.x + 30;
    const armEndY = player.y - 30;
    
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 35);
    ctx.lineTo(armEndX, armEndY);
    ctx.stroke();
    
    // Draw bow
    drawBow(armEndX, armEndY);
}

// Draw bow
function drawBow(x, y) {
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 4;
    
    const bowAngle = player.bowDrawn ? player.armAngle : 0;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(bowAngle);
    
    // Bow arc
    ctx.beginPath();
    ctx.arc(0, 0, 25, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    
    // Bow string
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    if (player.bowDrawn) {
        const pullBack = player.drawPower * 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(-pullBack, 0);
        ctx.lineTo(0, 25);
        ctx.stroke();
        
        // Draw arrow on bow
        drawArrowOnBow(-pullBack, 0);
    } else {
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(0, 25);
        ctx.stroke();
    }
    
    ctx.restore();
}

// Draw arrow on bow
function drawArrowOnBow(x, y) {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 30, y);
    ctx.stroke();
    
    // Arrowhead
    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.moveTo(x + 30, y);
    ctx.lineTo(x + 25, y - 4);
    ctx.lineTo(x + 25, y + 4);
    ctx.closePath();
    ctx.fill();
    
    // Fletching
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 5, y - 4);
    ctx.lineTo(x - 3, y);
    ctx.lineTo(x - 5, y + 4);
    ctx.closePath();
    ctx.fill();
}

// Draw arrow in flight
function drawArrow(arrow) {
    ctx.save();
    ctx.translate(arrow.x, arrow.y);
    ctx.rotate(arrow.angle);
    
    // Arrow shaft
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(20, 0);
    ctx.stroke();
    
    // Arrowhead
    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(15, -4);
    ctx.lineTo(15, 4);
    ctx.closePath();
    ctx.fill();
    
    // Fletching
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(-25, -4);
    ctx.lineTo(-23, 0);
    ctx.lineTo(-25, 4);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

// Draw target
function drawTarget() {
    // Outer ring (red)
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Middle ring (white)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(target.x, target.y, target.radius * 0.66, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner ring (red)
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(target.x, target.y, target.radius * 0.33, 0, Math.PI * 2);
    ctx.fill();
    
    // Target stand
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(target.x, target.y + target.radius);
    ctx.lineTo(target.x, canvas.height - 50);
    ctx.stroke();
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
init();