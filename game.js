

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const canvaswidth = window.innerWidth;
const canvasheight = window.innerHeight;
canvas.width = canvaswidth;
canvas.height = canvasheight;

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

let player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 100,
    width: 50,
    height: 50,
    vy: 0
}
//obstacles aka red enimies
function obstacle(x, y, width, height, speed, direction) {
    this.x = x;
    this.y =  y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.direction = direction; // 1 = right -1 = left
};
let obstacles = [];

obstacles.push (new obstacle(800, canvas.height - 400, 50, 50, 3, 1));
obstacles.push (new obstacle(canvas.width / 2 + 100, canvas.height - 50, 50, 50, 3, -1));

const keys = {};
const gravity = 0.5;
let level = 1;
let timer = 0;
let gameState = "start"; // "start", "playing", "gameover"
let wasOnGround = false;
let platforms = [];

//reset game
function resetGame() {
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 100;
    player.vy = 0;

    for (o of obstacles) {
    o.x = Math.random() * (canvas.width - o.width);
    o.y = canvas.height - o.height;
    o.speed = 3;
    o.direction = 1;
    }
    level = 1;
    timer = 0;
}

//particle system

let particles = [];
let bgParticles = [];

function spawnParticles(x, y, amount, alpha, color) {
    for (let i = 0; i < amount; i++) {
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 4 + 2,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            alpha: alpha,
            color: color,
        })
    }
}

//falling enemies
let fallingEnemies = [];
function FallingEnemy(x, y, width, height) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.vy = 0;
    this.active = false;
    this.groundTimer = 0;

};

fallingEnemies.push (new FallingEnemy(400, canvas.height - 500, 50, 50));
fallingEnemies.push (new FallingEnemy(800, canvas.height - 500, 50, 80));

//background particles
function initBackgroundParticles(count) {
    for (let i = 0; i < count; i++) {
        bgParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 3,
            alpha: Math.random() * 0.5 + 0.3
        });
    }
}

//key detection
document.addEventListener("keyup", (e) => {
    keys[e.code] = false;
});
document.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    
    if (e.code === "Enter") {
        if (gameState === "start" || gameState === "gameover") {
           resetGame();
           gameState = "playing";
        }
    }
});


//collision detection
function isColliding(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

//platforms
function Platform(x, y, width, height, speed = 0, direction = 1) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.direction = direction;
    this.groundTimer = 0;
};

platforms.push(new Platform(0, canvas.height - 120, 200, 10, 1, 1));
platforms.push(new Platform(250, canvas.height - 200, 200, 10, 1, 1));
platforms.push(new Platform(500, canvas.height - 280, 200, 10, 1, 1));
platforms.push(new Platform(750, canvas.height - 360, 200, 10, 1, 1));
platforms.push(new Platform(1000, canvas.height - 420, 200, 10, 1, 1));


function onGround() {
    return player.y +player.height >= canvas.height;
}

initBackgroundParticles(80);

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let onGroundNow = player.y + player.height >= canvas.height;
    let onPlatformNow = false;
    



    
    if (gameState === "start") {
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Press Enter to Start", canvas.width / 2, canvas.height / 2);
        requestAnimationFrame(gameLoop);
        return;
    }

    if (gameState === "gameover") {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.fillText("Game Over! Press Enter to Restart", canvas.width / 2, canvas.height / 2);
        requestAnimationFrame(gameLoop);
        return;
    }
    
    //levels and obstacle collision
    for (let o of obstacles) {
        if (isColliding(player, o)) {
            gameState = "gameover";
        }
    }


    timer++;
    if (timer % 300 === 0) {
        level++;
        for (let o of obstacles) {
            o.speed += 2;
        }
        console.log("level:", level);
        console.log("obstacle speed:", o.speed);
    } //every 5 second

    let prevBottom = player.y + player.height;

    //gravity player
    player.vy += gravity;
    player.y += player.vy;

    let currBottom = player.y + player.height;

    //platform collision
    
    for (let i = 0; i < platforms.length; i++) {
        let p = platforms[i];

        let horizontalyAligned = player.x + player.width > p.x && player.x < p.x + p.width;

        let crossedPlatformTop = prevBottom <= p.y && currBottom >= p.y && player.vy >= 0;

        if (horizontalyAligned && crossedPlatformTop) {
            onPlatformNow = true;
            player.y = p.y - player.height;
            player.vy = 0;
            player.x += p.speed * p.direction;
        } 
    }

    //ground collision
    const groundY = canvas.height;

    if (prevBottom <= groundY && currBottom >= groundY) {
        player.y = groundY - player.height;
        player.vy = 0;
        currBottom = player.y - player.height;
        onGroundNow = true;
    } else {
        onGroundNow = false;
    }
    
    
    //player movement
    if (keys["KeyA"]) player.x -= 7;
    if (keys["KeyD"]) player.x += 7;

    if (keys["Space"] && (onGroundNow || onPlatformNow)) {
        spawnParticles(player.x + player.width / 2, player.y + player.height - 10, 25, 1, {r: 0, g: 255, b: 0});
        player.vy = -12;
    }

    currBottom = player.y + player.height;

    if (onGroundNow && !wasOnGround) {
        player.y = canvas.height - player.height;
        player.vy = 0;

        //spawn particles
        spawnParticles(player.x + player.width, player.y + player.height - 5, 20, 1, {r: 0, g: 255, b:0});//bottom right particles

        spawnParticles(player.x, player.y + player.height - 5, 20, 1, {r: 0, g:255, b: 0});//bottom left particles
    }

    wasOnGround = onGroundNow;




    //obstacle movement
    for (o of obstacles) {
        o.x += o.speed * o.direction;

        if (o.x + o.width > canvas.width) {
            o.x = canvas.width - o.width;
            o.direction = -1;
        }
        if (o.x < 0) {
            o.x = 0;
            o.direction = 1;
        }

    //moving platforms
    for (let i = 0; i < platforms.length; i++) {
        let p = platforms[i]

        p.x += p.speed * p.direction;

        if (p.x < 0 || p.x + p.width > canvas.width) {
            p.direction *= -1;
        }


    }

    //drawing bacground
    let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#001f3f");
    gradient.addColorStop(1, "#0074D9");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);



    //trigger falling ememy
    for (let enemy of fallingEnemies) {
         let playerCenter = player.x + player.width / 2;
        let fallingEnemyCenter = enemy.x + enemy.width / 2;

        let horizontalDistance = Math.abs(playerCenter - fallingEnemyCenter);

        if (horizontalDistance < 100 && !enemy.active) {
            enemy.active = true;
        }

        if (enemy.active) {
            enemy.vy += gravity * 2;
            enemy.y += enemy.vy;
        }

        if (enemy.y + enemy.height >= canvas.height) {
            enemy.y = canvas.height - enemy.height;
            enemy.vy = 0;

            enemy.groundTimer++;

            if (enemy.groundTimer >= 30) {
                enemy.y = enemy.startY;
                enemy.x = enemy.startX;
                enemy.vy = 0;
                enemy.active = false;
                enemy.groundTimer = 0;
            }

        } else {
            enemy.groundTimer = 0;
        }
        if (isColliding(player, enemy)) {
            gameState = "gameover";
        }
}

    //drawing falling enemy
    for (let enemy of fallingEnemies) {
        ctx.fillStyle = "#E427F5";
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }
    




    //drawing platforms
    for (let i = 0; i < platforms.length; i++) {
        let p = platforms[i];
        ctx.fillStyle = "yellow";
        ctx.fillRect(p.x, p.y, p.width, p.height);
    }

    //drawing particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        p.vy += 0.1; // gravity effect on particles

        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.alpha})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);

        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }

    //drawing background particles

    for (let i = bgParticles.length -1; i >= 0; i--) {
        let p = bgParticles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    }





    wasOnGround = onGroundNow;

    ctx.fillStyle = "cyan";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    //drawing obstacles
    for (o of obstacles) {
        ctx.fillStyle = "red";
        ctx.fillRect(o.x, o.y, o.width, o.height);

    }
    

    requestAnimationFrame(gameLoop);


}

gameLoop();
