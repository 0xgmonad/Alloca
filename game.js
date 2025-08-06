// ========== TẢI HÌNH ẢNH ==========
const logoImg = new Image();
logoImg.src = 'images/logo.png';
let isLogoLoaded = false;
logoImg.onload = () => isLogoLoaded = true;
logoImg.onerror = () => console.error('Error loading logo');

const bgImage = new Image();
bgImage.src = 'images/background.jpg';
let isBgLoaded = false;
bgImage.onload = () => isBgLoaded = true;
bgImage.onerror = () => console.error('Không thể tải ảnh background!');

// ========== KHAI BÁO BIẾN ==========
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const playAgainBtn = document.getElementById('play-again-btn');
const gameOverScreen = document.getElementById('game-over');

// Tải ảnh nhân vật
const characterImg = new Image();
characterImg.src = 'images/character.png';
let isImageLoaded = false;

// Biến game
let score = 0;
let gameRunning = false;
let gamePaused = false;
let animationId;
const gravity = 0.5;
const obstacleSpeedBase = 3;

// ========== NHÂN VẬT ==========
const player = {
    x: 100,
    y: canvas.height / 2,
    radius: 30,
    velocity: 0,
    jumpForce: -10,
    color: '#90e0ef',
    showWaterEffect: true,
    
    draw() {
        if (!isImageLoaded) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
            return;
        }

        const imgSize = this.radius * 2.5;
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(
            characterImg,
            this.x - imgSize/2,
            this.y - imgSize/2,
            imgSize,
            imgSize
        );
        ctx.restore();
    },
    
    update() {
        this.velocity += gravity;
        this.y += this.velocity;
        
        if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            gameOver();
        }
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.velocity = 0;
        }
    },
    
    jump() {
        if (gameRunning && !gamePaused) {
            this.velocity = this.jumpForce;
        }
    }
};

// ========== CHƯỚNG NGẠI VẬT ==========
const obstacles = {
    list: [],
    width: 80,
    gap: 250,
    minGapPosition: 50,
    speed: obstacleSpeedBase,
    logoSize: 80,
    
    create() {
        const gapPosition = Math.random() * (canvas.height - this.gap - 100) + this.minGapPosition;
        this.list.push({
            x: canvas.width,
            y: gapPosition,
            passed: false,
            logoVisible: true
        });
    },
    
    draw() {
        ctx.fillStyle = '#9900ff';
        this.list.forEach(obstacle => {
            ctx.fillRect(obstacle.x, 0, this.width, obstacle.y);
            ctx.fillRect(obstacle.x, obstacle.y + this.gap, this.width, canvas.height);
            
            ctx.fillStyle = 'rgba(40, 214, 98, 0.7)';
            ctx.fillRect(obstacle.x - 5, obstacle.y - 10, this.width + 10, 20);
            ctx.fillRect(obstacle.x - 5, obstacle.y + this.gap - 10, this.width + 10, 20);
            ctx.fillStyle = '#9900ff';
            
            if (obstacle.logoVisible && isLogoLoaded) {
                const logoX = obstacle.x + this.width/2 - this.logoSize/2;
                const logoY = obstacle.y + this.gap/2 - this.logoSize/2;
                
                ctx.save();
                ctx.beginPath();
                ctx.arc(logoX + this.logoSize/2, logoY + this.logoSize/2, 
                        this.logoSize/2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                
                ctx.drawImage(logoImg, logoX, logoY, this.logoSize, this.logoSize);
                ctx.restore();
            }
        });
    },
    
    update() {
        for (let i = this.list.length - 1; i >= 0; i--) {
            const obstacle = this.list[i];
            obstacle.x -= this.speed;
            
            if (!obstacle.passed && obstacle.x + this.width < player.x) {
                obstacle.passed = true;
                obstacle.logoVisible = false;
                score++;
                scoreElement.textContent = score;
                this.speed = obstacleSpeedBase + Math.floor(score / 5) * 0.5;
            }
            
            if (this.checkCollision(obstacle)) {
                gameOver();
                break;
            }
            
            if (obstacle.x + this.width < 0) {
                this.list.splice(i, 1);
            }
        }
    },
    
    checkCollision(obstacle) {
        return (
            player.x + player.radius > obstacle.x &&
            player.x - player.radius < obstacle.x + this.width &&
            (player.y - player.radius < obstacle.y || 
             player.y + player.radius > obstacle.y + this.gap)
        );
    }
};

// ========== HỆ THỐNG GAME ==========
function initGame() {
    characterImg.onload = () => isImageLoaded = true;
    characterImg.onerror = () => console.error('Không tải được ảnh nhân vật');
    
    // Sự kiện điều khiển PC
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') player.jump();
    });
    
    // Sự kiện cho mobile: touch
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        player.jump();
    });
    
    // Sự kiện click (dùng cho cả PC và mobile)
    canvas.addEventListener('click', () => player.jump());
    
    // Sự kiện nút Play Again
    playAgainBtn.addEventListener('click', startGame);
    
    // Màn hình bắt đầu
    showStartScreen();
}

function gameLoop() {
    if (!gameRunning || gamePaused) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground();
    player.update();
    player.draw();
    obstacles.update();
    obstacles.draw();
    
    if (animationId % 100 === 0) {
        obstacles.create();
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
    score = 0;
    obstacles.list = [];
    obstacles.speed = obstacleSpeedBase;
    player.y = canvas.height / 2;
    player.velocity = 0;
    
    scoreElement.textContent = score;
    gameOverScreen.style.display = 'none';
    gameRunning = true;
    gamePaused = false;
    
    animationId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    finalScoreElement.textContent = `Score: ${score}`;
    gameOverScreen.style.display = 'flex';
}

function showStartScreen() {
    gameOverScreen.style.display = 'flex';
    document.querySelector('#game-over h2').textContent = "";
    finalScoreElement.textContent = "SPACE to JUMP";
    playAgainBtn.textContent = "Start Game";
}

function drawBackground() {
    if (isBgLoaded) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#03045e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#023e8a';
        ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
    }
    
    ctx.fillStyle = '#023e8a';
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
    
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 30);
    const now = Date.now() / 1000;
    for (let x = 0; x <= canvas.width; x += 20) {
        ctx.lineTo(x, canvas.height - 30 + Math.sin(x / 10 + now) * 5);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 119, 182, 0.7)';
    ctx.fill();
}

// Khởi động game
document.addEventListener('DOMContentLoaded', initGame);