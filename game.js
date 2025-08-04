// ==================== PHẦN THÊM MỚI ĐẦU FILE ====================
// Kiểm tra thiết bị mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let canvasScale = 1; // Tỉ lệ scale canvas cho mobile

// Biến điều khiển cảm ứng
let touchStartX = 0;
let touchStartY = 0;

// ==================== PHẦN TẢI HÌNH ẢNH (GIỮ NGUYÊN) ====================
const logoImg = new Image();
logoImg.src = 'images/logo.png';
let isLogoLoaded = false;
logoImg.onload = () => {
    isLogoLoaded = true;
    console.log('Logo loaded');
};
logoImg.onerror = () => console.error('Error loading logo');

const bgImage = new Image();
bgImage.src = 'images/background.jpg';
let isBgLoaded = false;
bgImage.onload = function() {
    isBgLoaded = true;
    console.log('Ảnh background đã tải xong!');
};
bgImage.onerror = function() {
    console.error('Không thể tải ảnh background!');
};

// ==================== PHẦN KHAI BÁO BIẾN (CẬP NHẬT) ====================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const pauseBtn = document.getElementById('pause-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const gameOverScreen = document.getElementById('game-over');

// Thêm biến cho nút điều khiển mobile
const jumpBtn = document.getElementById('jump-btn');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');

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

// ==================== PHẦN NHÂN VẬT (CẬP NHẬT) ====================
const player = {
    x: 100,
    y: canvas.height / 2,
    radius: 30,
    velocity: 0,
    jumpForce: -10,
    color: '#90e0ef',
    showWaterEffect: true,
    moveLeft: false, // Thêm mới cho điều khiển mobile
    moveRight: false, // Thêm mới cho điều khiển mobile
    speedX: 0, // Thêm mới cho di chuyển ngang
    maxSpeedX: 4, // Thêm mới cho di chuyển ngang
    
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
        // Vật lý nhân vật
        this.velocity += gravity;
        this.y += this.velocity;
        
        // Di chuyển ngang (phần thêm mới cho mobile)
        if (this.moveLeft) this.speedX = -this.maxSpeedX;
        else if (this.moveRight) this.speedX = this.maxSpeedX;
        else this.speedX = 0;
        
        this.x += this.speedX;
        
        // Giới hạn màn hình
        if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            gameOver();
        }
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.velocity = 0;
        }
        
        // Giới hạn màn hình ngang (phần thêm mới)
        if (this.x - this.radius < 0) this.x = this.radius;
        if (this.x + this.radius > canvas.width) this.x = canvas.width - this.radius;
    },
    
    jump() {
        if (gameRunning && !gamePaused) {
            this.velocity = this.jumpForce;
        }
    }
};

// ==================== PHẦN CHƯỚNG NGẠI VẬT (GIỮ NGUYÊN) ====================
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

// ==================== PHẦN HỆ THỐNG GAME (CẬP NHẬT) ====================
function initGame() {
    // Thêm sự kiện cho mobile (phần thêm mới)
    if (isMobile) {
        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            player.jump();
        });
        
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            player.moveLeft = true;
        });
        
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            player.moveRight = true;
        });
        
        leftBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            player.moveLeft = false;
        });
        
        rightBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            player.moveRight = false;
        });
        
        canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: false });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touchEndX = e.touches[0].clientX;
            const touchEndY = e.touches[0].clientY;
            const dy = touchEndY - touchStartY;
            
            if (dy < -30) { // Swipe lên để nhảy
                player.jump();
            }
        }, { passive: false });
    }
    
    // Sự kiện bàn phím (giữ nguyên)
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') player.jump();
    });
    
    // Các sự kiện khác (giữ nguyên)
    restartBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    playAgainBtn.addEventListener('click', startGame);
    
    // Khởi tạo kích thước canvas (phần thêm mới)
    resizeCanvas();
    showStartScreen();
}

// ==================== PHẦN THÊM MỚI: RESIZE CANVAS ====================
function resizeCanvas() {
    const maxWidth = Math.min(window.innerWidth * 0.95, 600);
    const maxHeight = Math.min(window.innerHeight * 0.7, 800);
    
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    canvasScale = maxWidth / 600;
    
    // Điều chỉnh cho mobile
    if (isMobile) {
        player.radius = 30 * canvasScale;
        player.jumpForce = -10 * canvasScale;
        player.maxSpeedX = 4 * canvasScale;
    }
    
    player.x = 100 * canvasScale;
    player.y = canvas.height / 2;
}

// Thêm sự kiện resize window (phần thêm mới)
window.addEventListener('resize', () => {
    resizeCanvas();
    if (gameRunning) {
        obstacles.list.forEach(obstacle => {
            obstacle.y = obstacle.y / canvas.height * canvas.height;
        });
    }
});

// ==================== CÁC HÀM GAME LOOP (GIỮ NGUYÊN) ====================
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
    player.moveLeft = false;
    player.moveRight = false;
    
    scoreElement.textContent = score;
    gameOverScreen.style.display = 'none';
    gameRunning = true;
    gamePaused = false;
    pauseBtn.textContent = "Pause";
    
    animationId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    finalScoreElement.textContent = `Score: ${score}`;
    gameOverScreen.style.display = 'flex';
}

function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    pauseBtn.textContent = gamePaused ? "Resume" : "Pause";
    
    if (!gamePaused) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

function showStartScreen() {
    gameOverScreen.style.display = 'flex';
    document.querySelector('#game-over h2').textContent = "";
    finalScoreElement.textContent = isMobile ? "TAP to JUMP" : "SPACE to JUMP";
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

// Khởi động game khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', initGame);
