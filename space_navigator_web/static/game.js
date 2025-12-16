//Map Data and Configuration
const mapData = {
    map1: [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1], [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
        [1,0,0,0,1,0,1,0,1,0,1,0,0,0,1], [1,1,1,0,1,0,0,0,0,0,1,0,1,1,1], [1,1,1,0,1,0,1,1,1,0,1,0,1,1,1], 
        [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1], [1,0,1,1,1,1,0,1,0,1,1,1,1,0,1], [1,0,0,1,1,0,0,1,0,0,1,1,0,0,1],
        [1,1,0,0,0,0,0,0,0,0,0,0,0,1,1], [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    map2: [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], [1,1,1,0,0,0,0,0,0,0,0,0,1,1,1], [1,0,0,0,1,1,0,1,0,1,1,0,0,0,1],
        [1,0,1,0,0,1,0,0,0,1,0,0,1,0,1], [1,0,1,1,0,1,1,0,1,1,0,1,1,0,1], [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,0,1,0,1,1,1,0,1,0,1,1,1], [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1], [1,0,1,0,1,1,1,0,1,1,1,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1], [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const CELL_SIZE = 40; 
const ROWS = 11; 
const COLS = 15; 
const GOAL_R = ROWS - 2; 
const GOAL_C = COLS - 2;

canvas.width = COLS * CELL_SIZE;
canvas.height = ROWS * CELL_SIZE;

let gameState = {
    grid: [],
    player: {r:1, c:1}, 
    comets: [],
    startTime: 0,
    interval: null,
    isPlaying: false
};

async function startGame() {
    const difficulty = document.getElementById('difficulty').value;
    const mapStyle = document.getElementById('map-style').value;
    const fixedGrid = mapData[mapStyle];

    document.getElementById('loading').style.display = 'block';
    document.getElementById('loading').innerText = 'Generating Comet Paths (SA)...';
    
    const response = await fetch('/api/generate-level', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
            difficulty: difficulty, 
            mapStyle: mapStyle, 
            grid: fixedGrid, 
            rows: ROWS, 
            cols: COLS 
        })
    });
    
    const data = await response.json();
    
    gameState.grid = data.grid;
    gameState.comets = data.comets; 
    gameState.player = {r:1, c:1}; 
    gameState.startTime = Date.now();
    gameState.isPlaying = true;
    
    document.getElementById('loading').style.display = 'none';
    
    if (gameState.interval) clearInterval(gameState.interval);
    gameState.interval = setInterval(gameLoop, 100); 
    
    window.removeEventListener('keydown', handleInput); 
    window.addEventListener('keydown', handleInput);
}

function handleInput(e) {
    if(!gameState.isPlaying) return;
    let nr = gameState.player.r;
    let nc = gameState.player.c;
    
    if(e.key === 'ArrowUp') nr--;
    else if(e.key === 'ArrowDown') nr++;
    else if(e.key === 'ArrowLeft') nc--;
    else if(e.key === 'ArrowRight') nc++;
    else return; 

    if(nr >= 0 && nc >= 0 && nr < ROWS && nc < COLS && gameState.grid[nr][nc] !== 1) {
        gameState.player.r = nr;
        gameState.player.c = nc;
    }
    
    if(gameState.player.r === GOAL_R && gameState.player.c === GOAL_C) endGame(true);
}

function gameLoop() {
    if(!gameState.isPlaying) return;
    
    let time = ((Date.now() - gameState.startTime) / 1000).toFixed(1);
    document.getElementById('timer').innerText = time;
    
    gameState.comets.forEach(comet => {
        if(comet.type === 'moving' && comet.path.length > 0) {
            const tick = Math.floor(Date.now() / 500) % comet.path.length;
            const pos = comet.path[tick];
            comet.currentR = pos[0];
            comet.currentC = pos[1];
            
            if(comet.currentR === gameState.player.r && comet.currentC === gameState.player.c) {
                endGame(false);
            }
        }
    });

    draw();
}

function draw() {
    ctx.clearRect(0,0, canvas.width, canvas.height);
    
    // Draw Grid 
    for(let r=0; r<ROWS; r++) { 
        for(let c=0; c<COLS; c++) {
            if(r === GOAL_R && c === GOAL_C) {
                ctx.fillStyle = '#00ff00'; 
                ctx.fillRect(c*CELL_SIZE, r*CELL_SIZE, CELL_SIZE, CELL_SIZE);
            } else if (gameState.grid[r][c] === 1) {
                ctx.fillStyle = '#444'; 
                ctx.fillRect(c*CELL_SIZE, r*CELL_SIZE, CELL_SIZE, CELL_SIZE);
            } else {
                ctx.fillStyle = '#111'; 
                ctx.fillRect(c*CELL_SIZE, r*CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
    
    gameState.comets.forEach(c => {
        const drawR = c.currentR || c.start[0];
        const drawC = c.currentC || c.start[1];
        
        ctx.fillStyle = c.type === 'moving' ? 'red' : 'yellow';
        ctx.beginPath();
        ctx.arc(drawC * CELL_SIZE + CELL_SIZE/2, drawR * CELL_SIZE + CELL_SIZE/2, CELL_SIZE/4, 0, Math.PI*2);
        ctx.fill();
    });
    
    ctx.fillStyle = '#00ffff'; 
    ctx.fillRect(gameState.player.c*CELL_SIZE + 5, gameState.player.r*CELL_SIZE + 5, CELL_SIZE-10, CELL_SIZE-10);
}

function endGame(win) {
    gameState.isPlaying = false;
    clearInterval(gameState.interval);
    
    let time = parseFloat(document.getElementById('timer').innerText);
    let score = win ? Math.max(0, 5000 - (time * 50)) : 0; 
    
    document.getElementById('score').innerText = score.toFixed(0);
    alert(win ? `Victory! Score: ${score.toFixed(0)}` : "Crash! You hit an asteroid.");
    
    let history = JSON.parse(localStorage.getItem('scores') || '[]');
    history.push({date: new Date().toLocaleTimeString(), score: score.toFixed(0), win: win});
    localStorage.setItem('scores', JSON.stringify(history));
    updateScoreList();
}

function updateScoreList() {
    let history = JSON.parse(localStorage.getItem('scores') || '[]');
    const list = document.getElementById('score-list');
    list.innerHTML = history.slice(-5).reverse().map(s => 
        `<li>${s.win ? 'WIN' : 'LOSS'} - ${s.score} pts</li>`
    ).join('');
}

updateScoreList();