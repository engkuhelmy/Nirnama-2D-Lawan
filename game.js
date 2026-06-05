// game.js - Core Game Engine for Nirnama: Rentak Pendekar (MVP)

// ================= GLOBAL CONFIGURATION & DATA =================
const canvas = document.querySelector('#gameCanvas');
const c = canvas.getContext('2d');

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 576;
const FLOOR_HEIGHT = 80;
const gravityBase = 0.8;

// Character Statistics Configuration
const CHARACTER_PRESETS = {
    nirnama: {
        name: 'Nirnama',
        color: '#ff3333', // Glowing Red
        maxHealth: 100,
        speed: 5.5,
        mass: 1.0,
        range: 60,
        damage: 10,
        width: 52,
        height: 145,
        description: 'Balanced Shoto. Good reach and fireballs.'
    },
    nadira: {
        name: 'Nadira',
        color: '#00ff66', // Glowing Green
        maxHealth: 100,
        speed: 4.8,
        mass: 0.9,
        range: 120, // Extended weapon range
        damage: 8,
        width: 46,
        height: 154,
        description: 'Zoner. High range attacks using scarf/spear.'
    },
    jagad: {
        name: 'Jagad',
        color: '#ffea00', // Glowing Yellow
        maxHealth: 90, // Lower health
        speed: 7.2, // Very fast
        mass: 0.8,
        range: 50,
        damage: 11,
        width: 44,
        height: 122,
        description: 'Rushdown. Rapid movement and charge lunge.'
    },
    syaitan: {
        name: 'Sang Syaitan',
        color: '#aa00ff', // Glowing Purple
        maxHealth: 130, // High health
        speed: 3.5, // Slow
        mass: 1.8, // Heavy
        range: 40,
        damage: 14,
        width: 76,
        height: 178,
        description: 'Grappler Boss. Unblockable command grabs, heavy mass.'
    }
};

// State Variables
let currentPlayerName = '';
let gameMode = 'sp'; // 'sp' = Solo vs CPU, 'vs' = Local Multiplayer
let p1Char = 'nirnama';
let p2Char = 'nadira';
let p1Wins = 0;
let p2Wins = 0;
let roundNumber = 1;
let roundTime = 99;
let timerId = null;
let gameActive = false;
let isPaused = false;
let roundOver = false;

// Entities and Lists
let player1 = null;
let player2 = null;
let projectiles = [];
let particles = [];

// Screen Shake and Hitstop
let shakeTimer = 0;
let shakeAmount = 0;
let hitstopFrames = 0;

// Floating Canvas Texts
let floatingTexts = [];

// Nirnama Sprite Sheet Assets
const nirnamaSpriteImg = new Image();
let spriteSheetLoaded = false;
let transparentCanvas = null;
let transparentCtx = null;
let spriteSheetWidth = 1024; // Default width
let spriteSheetHeight = 1024; // Default height
let nirnamaPreviewDataUrl = null;

nirnamaSpriteImg.onload = () => {
    spriteSheetWidth = nirnamaSpriteImg.naturalWidth || nirnamaSpriteImg.width || 2048;
    spriteSheetHeight = nirnamaSpriteImg.naturalHeight || nirnamaSpriteImg.height || 2048;

    transparentCanvas = document.createElement('canvas');
    transparentCanvas.width = spriteSheetWidth;
    transparentCanvas.height = spriteSheetHeight;
    transparentCtx = transparentCanvas.getContext('2d');
    transparentCtx.drawImage(nirnamaSpriteImg, 0, 0);
    
    try {
        const imgData = transparentCtx.getImageData(0, 0, spriteSheetWidth, spriteSheetHeight);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Remove cream or pure white backgrounds (chroma keying)
            if (r > 230 && g > 220 && b > 190) {
                data[i + 3] = 0; // Alpha = 0
            }
        }
        transparentCtx.putImageData(imgData, 0, 0);
        
        // Generate clean preview for character select screen (Idle pose)
        const cellW = spriteSheetWidth / 4;
        const cellH = spriteSheetHeight / 4;
        const scale = spriteSheetWidth / 1024;
        
        const psw = Math.round(224 * scale);
        const psh = Math.round(224 * scale);
        const psx = Math.round(0 * cellW + (16 * scale));
        const psy = Math.round(0 * cellH + (16 * scale));
        
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = psw;
        previewCanvas.height = psh;
        const previewCtx = previewCanvas.getContext('2d');
        previewCtx.drawImage(transparentCanvas, psx, psy, psw, psh, 0, 0, psw, psh);
        nirnamaPreviewDataUrl = previewCanvas.toDataURL();
        
        spriteSheetLoaded = true;
        
        // Update character select screen if it was already updated
        if (typeof updateCharacterSelectUI === 'function') {
            updateCharacterSelectUI();
        }
    } catch (err) {
        console.error("Gagal melakukan chroma keying pada sprite sheet:", err);
        spriteSheetLoaded = true;
        transparentCanvas = nirnamaSpriteImg; // Fallback
    }
};
nirnamaSpriteImg.src = 'nirnama_sprites.jpg';

// Nadira Sprite Sheet Assets
const nadiraSpriteImg = new Image();
let nadiraSpriteSheetLoaded = false;
let nadiraTransparentCanvas = null;
let nadiraTransparentCtx = null;
let nadiraSpriteSheetWidth = 1024; // Default width
let nadiraSpriteSheetHeight = 1024; // Default height
let nadiraPreviewDataUrl = null;

nadiraSpriteImg.onload = () => {
    nadiraSpriteSheetWidth = nadiraSpriteImg.naturalWidth || nadiraSpriteImg.width || 1024;
    nadiraSpriteSheetHeight = nadiraSpriteImg.naturalHeight || nadiraSpriteImg.height || 1024;

    nadiraTransparentCanvas = document.createElement('canvas');
    nadiraTransparentCanvas.width = nadiraSpriteSheetWidth;
    nadiraTransparentCanvas.height = nadiraSpriteSheetHeight;
    nadiraTransparentCtx = nadiraTransparentCanvas.getContext('2d');
    nadiraTransparentCtx.drawImage(nadiraSpriteImg, 0, 0);
    
    try {
        const imgData = nadiraTransparentCtx.getImageData(0, 0, nadiraSpriteSheetWidth, nadiraSpriteSheetHeight);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Remove pure white or cream background (chroma keying)
            if (r > 230 && g > 220 && b > 190) {
                data[i + 3] = 0; // Alpha = 0
            }
        }
        nadiraTransparentCtx.putImageData(imgData, 0, 0);
        
        // Generate clean preview for character select screen (Idle pose)
        // Nadira's Idle pose is at row 3, col 0 in the 4x4 sheet.
        const cellW = nadiraSpriteSheetWidth / 4;
        const cellH = nadiraSpriteSheetHeight / 4;
        const scale = nadiraSpriteSheetWidth / 1024;
        
        // Custom crop bounds for Nadira to avoid cutting her off:
        // sx_offset = 16, sy_offset = 10, sw = 224, sh = 236
        const psw = Math.round(224 * scale);
        const psh = Math.round(236 * scale);
        const psx = Math.round(0 * cellW + (16 * scale));
        const psy = Math.round(3 * cellH + (10 * scale));
        
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = psw;
        previewCanvas.height = psh;
        const previewCtx = previewCanvas.getContext('2d');
        previewCtx.drawImage(nadiraTransparentCanvas, psx, psy, psw, psh, 0, 0, psw, psh);
        nadiraPreviewDataUrl = previewCanvas.toDataURL();
        
        nadiraSpriteSheetLoaded = true;
        
        // Update character select screen if it was already updated
        if (typeof updateCharacterSelectUI === 'function') {
            updateCharacterSelectUI();
        }
    } catch (err) {
        console.error("Gagal melakukan chroma keying pada sprite sheet Nadira:", err);
        nadiraSpriteSheetLoaded = true;
        nadiraTransparentCanvas = nadiraSpriteImg; // Fallback
    }
};
nadiraSpriteImg.src = 'nadira_sprites.jpg';

// Jagad Sprite Sheet Assets
const jagadSpriteImg = new Image();
let jagadSpriteSheetLoaded = false;
let jagadTransparentCanvas = null;
let jagadTransparentCtx = null;
let jagadSpriteSheetWidth = 1024; // Default width
let jagadSpriteSheetHeight = 1024; // Default height
let jagadPreviewDataUrl = null;

jagadSpriteImg.onload = () => {
    jagadSpriteSheetWidth = jagadSpriteImg.naturalWidth || jagadSpriteImg.width || 1024;
    jagadSpriteSheetHeight = jagadSpriteImg.naturalHeight || jagadSpriteImg.height || 1024;

    jagadTransparentCanvas = document.createElement('canvas');
    jagadTransparentCanvas.width = jagadSpriteSheetWidth;
    jagadTransparentCanvas.height = jagadSpriteSheetHeight;
    jagadTransparentCtx = jagadTransparentCanvas.getContext('2d');
    jagadTransparentCtx.drawImage(jagadSpriteImg, 0, 0);
    
    try {
        const imgData = jagadTransparentCtx.getImageData(0, 0, jagadSpriteSheetWidth, jagadSpriteSheetHeight);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Remove pure white or cream background (chroma keying)
            if (r > 230 && g > 220 && b > 190) {
                data[i + 3] = 0; // Alpha = 0
            }
        }
        jagadTransparentCtx.putImageData(imgData, 0, 0);
        
        // Generate clean preview for character select screen (Idle pose)
        // Jagad's Idle pose is at row 3, col 0 in the 4x4 sheet.
        const cellW = jagadSpriteSheetWidth / 4;
        const cellH = jagadSpriteSheetHeight / 4;
        const scale = jagadSpriteSheetWidth / 1024;
        
        // Custom crop bounds for Jagad to avoid cutting him off:
        // sx_offset = 16, sy_offset = 16, sw = 224, sh = 224
        const psw = Math.round(224 * scale);
        const psh = Math.round(224 * scale);
        const psx = Math.round(0 * cellW + (16 * scale));
        const psy = Math.round(3 * cellH + (16 * scale));
        
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = psw;
        previewCanvas.height = psh;
        const previewCtx = previewCanvas.getContext('2d');
        previewCtx.drawImage(jagadTransparentCanvas, psx, psy, psw, psh, 0, 0, psw, psh);
        jagadPreviewDataUrl = previewCanvas.toDataURL();
        
        jagadSpriteSheetLoaded = true;
        
        // Update character select screen if it was already updated
        if (typeof updateCharacterSelectUI === 'function') {
            updateCharacterSelectUI();
        }
    } catch (err) {
        console.error("Gagal melakukan chroma keying pada sprite sheet Jagad:", err);
        jagadSpriteSheetLoaded = true;
        jagadTransparentCanvas = jagadSpriteImg; // Fallback
    }
};
jagadSpriteImg.src = 'jagad_sprites.jpg';

// Sang Syaitan Sprite Sheet Assets
const syaitanSpriteImg = new Image();
let syaitanSpriteSheetLoaded = false;
let syaitanTransparentCanvas = null;
let syaitanTransparentCtx = null;
let syaitanSpriteSheetWidth = 1024; // Default width
let syaitanSpriteSheetHeight = 1024; // Default height
let syaitanPreviewDataUrl = null;

syaitanSpriteImg.onload = () => {
    syaitanSpriteSheetWidth = syaitanSpriteImg.naturalWidth || syaitanSpriteImg.width || 1024;
    syaitanSpriteSheetHeight = syaitanSpriteImg.naturalHeight || syaitanSpriteImg.height || 1024;

    syaitanTransparentCanvas = document.createElement('canvas');
    syaitanTransparentCanvas.width = syaitanSpriteSheetWidth;
    syaitanTransparentCanvas.height = syaitanSpriteSheetHeight;
    syaitanTransparentCtx = syaitanTransparentCanvas.getContext('2d');
    syaitanTransparentCtx.drawImage(syaitanSpriteImg, 0, 0);
    
    try {
        const imgData = syaitanTransparentCtx.getImageData(0, 0, syaitanSpriteSheetWidth, syaitanSpriteSheetHeight);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Remove pure white or cream background (chroma keying)
            if (r > 230 && g > 220 && b > 190) {
                data[i + 3] = 0; // Alpha = 0
            }
        }
        syaitanTransparentCtx.putImageData(imgData, 0, 0);
        
        // Generate clean preview for character select screen (Idle pose)
        // Syaitan's Idle pose is at row 3, col 0 in the 4x4 sheet.
        const cellW = syaitanSpriteSheetWidth / 4;
        const cellH = syaitanSpriteSheetHeight / 4;
        const scale = syaitanSpriteSheetWidth / 1024;
        
        // Custom crop bounds for Sang Syaitan to capture wings and horns:
        // sx_offset = 12, sy_offset = 12, sw = 232, sh = 232
        const psw = Math.round(232 * scale);
        const psh = Math.round(232 * scale);
        const psx = Math.round(0 * cellW + (12 * scale));
        const psy = Math.round(3 * cellH + (12 * scale));
        
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = psw;
        previewCanvas.height = psh;
        const previewCtx = previewCanvas.getContext('2d');
        previewCtx.drawImage(syaitanTransparentCanvas, psx, psy, psw, psh, 0, 0, psw, psh);
        syaitanPreviewDataUrl = previewCanvas.toDataURL();
        
        syaitanSpriteSheetLoaded = true;
        
        // Update character select screen if it was already updated
        if (typeof updateCharacterSelectUI === 'function') {
            updateCharacterSelectUI();
        }
    } catch (err) {
        console.error("Gagal melakukan chroma keying pada sprite sheet Sang Syaitan:", err);
        syaitanSpriteSheetLoaded = true;
        syaitanTransparentCanvas = syaitanSpriteImg; // Fallback
    }
};
syaitanSpriteImg.src = 'syaitan_sprites.jpg';

// Stage Background Assets
const stageBgImg = new Image();
let stageBgLoaded = false;

function loadStageBackground(charKey) {
    stageBgLoaded = false;
    stageBgImg.onload = () => {
        stageBgLoaded = true;
    };
    stageBgImg.onerror = () => {
        stageBgLoaded = false;
    };
    stageBgImg.src = `background/${charKey.toLowerCase()}.png`;
}


// Input Trackers
const keysPressed = {};

// Input history buffers for combos (max 8 keys, clear older than 1.5 seconds)
const p1InputHistory = [];
const p2InputHistory = [];
const INPUT_TIMEOUT = 1000; // ms to discard old combo inputs

// ================= UTILITIES & DOM CONTROLS =================

// Initialize database data on window load
window.addEventListener('DOMContentLoaded', () => {
    // Check if player name is saved in localStorage
    const savedName = localStorage.getItem('nirnama_player_name');
    if (savedName) {
        currentPlayerName = savedName;
        document.getElementById('displayPlayerName').innerText = currentPlayerName;
        showScreen('mainMenuScreen');
        loadLeaderboardData();
    } else {
        showScreen('loginScreen');
    }
});

// Navigate screens
function showScreen(screenId) {
    document.querySelectorAll('.screen-overlay').forEach(screen => {
        screen.classList.remove('active');
    });
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
    }
}

// Log in form submit
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('playerNameInput').value.trim();
    const errorDiv = document.getElementById('loginError');
    errorDiv.innerText = '';

    if (nameInput.length < 2 || nameInput.length > 20) {
        errorDiv.innerText = 'Nama mestilah antara 2 hingga 20 aksara.';
        return;
    }

    try {
        const response = await fetch('api.php?action=register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: nameInput })
        });
        const result = await response.json();

        if (result.success) {
            currentPlayerName = nameInput;
            localStorage.setItem('nirnama_player_name', nameInput);
            document.getElementById('displayPlayerName').innerText = currentPlayerName;
            showScreen('mainMenuScreen');
            loadLeaderboardData();
        } else {
            errorDiv.innerText = result.error || 'Ralat pendaftaran.';
        }
    } catch (err) {
        errorDiv.innerText = 'Gagal bersambung ke pelayan backend.';
        console.error(err);
    }
});

function logoutPlayer() {
    localStorage.removeItem('nirnama_player_name');
    currentPlayerName = '';
    document.getElementById('playerNameInput').value = '';
    showScreen('loginScreen');
}

// Fetch Leaderboard
async function loadLeaderboardData() {
    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = '<tr><td colspan="6">Memuatkan data...</td></tr>';
    try {
        const response = await fetch('api.php?action=leaderboard');
        const data = await response.json();
        
        if (data.success && data.leaderboard) {
            tbody.innerHTML = '';
            if (data.leaderboard.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6">Tiada rekod lagi. Mulakan perlawanan pertama!</td></tr>';
                return;
            }
            data.leaderboard.forEach((row, idx) => {
                const total = parseInt(row.total_matches) || 0;
                const wins = parseInt(row.wins) || 0;
                const winRate = total > 0 ? Math.round((wins / total) * 100) + '%' : '0%';
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${idx + 1}</td>
                    <td class="highlight-text">${escapeHtml(row.name)}</td>
                    <td style="color: var(--neon-green)">${wins}</td>
                    <td style="color: var(--neon-red)">${row.losses}</td>
                    <td>${total}</td>
                    <td>${winRate}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6">Gagal memuatkan papan markah.</td></tr>';
        }
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6">Ralat pelayan. Cuba lagi.</td></tr>';
        console.error(err);
    }
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showLeaderboard() {
    loadLeaderboardData();
    showScreen('leaderboardScreen');
}

function hideLeaderboard() {
    showScreen('mainMenuScreen');
}

function showHelpMenu() {
    showScreen('helpScreen');
}

function hideHelpMenu() {
    if (gameActive && isPaused) {
        showScreen('pauseScreen');
    } else {
        showScreen('mainMenuScreen');
    }
}

function showHelpMenuInGame() {
    showScreen('helpScreen');
}

// Help tabs navigation
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Find matching button
    if (tabId === 'controlsTab') {
        document.querySelector('.tab-btn[onclick*="controlsTab"]').classList.add('active');
    } else {
        document.querySelector('.tab-btn[onclick*="combosTab"]').classList.add('active');
    }
    document.getElementById(tabId).classList.add('active');
}

// Character Selection Logic
function showCharacterSelect(mode) {
    gameMode = mode;
    p1Char = 'nirnama';
    p2Char = gameMode === 'sp' ? 'nadira' : 'jagad';
    
    document.getElementById('p2PanelTitle').innerText = gameMode === 'sp' ? 'CPU' : 'Player 2';
    
    updateCharacterSelectUI();
    showScreen('charSelectScreen');
}

function selectChar(charKey) {
    if (gameMode === 'sp') {
        // Player 1 select
        p1Char = charKey;
        // Auto pick a different character for CPU if same
        if (p1Char === p2Char) {
            const keys = Object.keys(CHARACTER_PRESETS);
            p2Char = keys.find(k => k !== p1Char);
        }
    } else {
        // Local multiplayer alternate clicks or dual selector
        // For simplicity: click sets P1, double click or toggle mode sets P2.
        // Let's implement cycling selector: click cycles P1, if P1 is same, move P2
        if (p1Char !== charKey) {
            p1Char = charKey;
        } else {
            // If clicking the already selected P1, change P2 instead
            const presets = Object.keys(CHARACTER_PRESETS);
            let index = presets.indexOf(p2Char);
            let nextIndex = (index + 1) % presets.length;
            if (presets[nextIndex] === p1Char) {
                nextIndex = (nextIndex + 1) % presets.length;
            }
            p2Char = presets[nextIndex];
        }
    }
    updateCharacterSelectUI();
}

function updateCharacterSelectUI() {
    // Reset selections classes
    document.querySelectorAll('.char-card').forEach(card => {
        card.classList.remove('selected', 'selected-p2', 'selected-p1p2');
        const char = card.getAttribute('data-char');
        if (char === p1Char && char === p2Char) {
            card.classList.add('selected-p1p2');
        } else if (char === p1Char) {
            card.classList.add('selected');
        } else if (char === p2Char) {
            card.classList.add('selected-p2');
        }
    });

    // Update P1 Details Panel
    const p1Data = CHARACTER_PRESETS[p1Char];
    document.getElementById('p1SelectedName').innerText = p1Data.name;
    document.getElementById('p1Preview').style.color = p1Data.color;
    document.getElementById('p1Preview').style.backgroundColor = p1Data.color + '1a';
    document.getElementById('p1Preview').style.borderColor = p1Data.color;
    
    if (p1Char === 'nirnama') {
        if (nirnamaPreviewDataUrl) {
            document.getElementById('p1Preview').style.backgroundImage = `url('${nirnamaPreviewDataUrl}')`;
            document.getElementById('p1Preview').style.backgroundSize = 'contain';
            document.getElementById('p1Preview').style.backgroundPosition = 'center';
            document.getElementById('p1Preview').style.backgroundRepeat = 'no-repeat';
        } else {
            document.getElementById('p1Preview').style.backgroundImage = "url('nirnama_sprites.jpg')";
            document.getElementById('p1Preview').style.backgroundSize = '320px 320px';
            document.getElementById('p1Preview').style.backgroundPosition = '-8px -8px';
            document.getElementById('p1Preview').style.backgroundRepeat = 'no-repeat';
        }
    } else if (p1Char === 'nadira') {
        if (nadiraPreviewDataUrl) {
            document.getElementById('p1Preview').style.backgroundImage = `url('${nadiraPreviewDataUrl}')`;
            document.getElementById('p1Preview').style.backgroundSize = 'contain';
            document.getElementById('p1Preview').style.backgroundPosition = 'center';
            document.getElementById('p1Preview').style.backgroundRepeat = 'no-repeat';
        } else {
            document.getElementById('p1Preview').style.backgroundImage = "url('nadira_sprites.jpg')";
            document.getElementById('p1Preview').style.backgroundSize = '320px 320px';
            document.getElementById('p1Preview').style.backgroundPosition = '-8px -8px';
            document.getElementById('p1Preview').style.backgroundRepeat = 'no-repeat';
        }
    } else if (p1Char === 'jagad') {
        if (jagadPreviewDataUrl) {
            document.getElementById('p1Preview').style.backgroundImage = `url('${jagadPreviewDataUrl}')`;
            document.getElementById('p1Preview').style.backgroundSize = 'contain';
            document.getElementById('p1Preview').style.backgroundPosition = 'center';
            document.getElementById('p1Preview').style.backgroundRepeat = 'no-repeat';
        } else {
            document.getElementById('p1Preview').style.backgroundImage = "url('jagad_sprites.jpg')";
            document.getElementById('p1Preview').style.backgroundSize = '320px 320px';
            document.getElementById('p1Preview').style.backgroundPosition = '-8px -8px';
            document.getElementById('p1Preview').style.backgroundRepeat = 'no-repeat';
        }
    } else if (p1Char === 'syaitan') {
        if (syaitanPreviewDataUrl) {
            document.getElementById('p1Preview').style.backgroundImage = `url('${syaitanPreviewDataUrl}')`;
            document.getElementById('p1Preview').style.backgroundSize = 'contain';
            document.getElementById('p1Preview').style.backgroundPosition = 'center';
            document.getElementById('p1Preview').style.backgroundRepeat = 'no-repeat';
        } else {
            document.getElementById('p1Preview').style.backgroundImage = "url('syaitan_sprites.jpg')";
            document.getElementById('p1Preview').style.backgroundSize = '320px 320px';
            document.getElementById('p1Preview').style.backgroundPosition = '-8px -8px';
            document.getElementById('p1Preview').style.backgroundRepeat = 'no-repeat';
        }
    } else {
        document.getElementById('p1Preview').style.backgroundImage = 'none';
    }
    
    // Fill stat bars
    document.getElementById('p1StatDamage').style.width = (p1Data.damage * 7) + '%';
    document.getElementById('p1StatSpeed').style.width = (p1Data.speed * 12) + '%';
    document.getElementById('p1StatRange').style.width = (p1Data.range / 1.5) + '%';

    // Update P2 Details Panel
    const p2Data = CHARACTER_PRESETS[p2Char];
    document.getElementById('p2SelectedName').innerText = p2Data.name;
    document.getElementById('p2Preview').style.color = p2Data.color;
    document.getElementById('p2Preview').style.backgroundColor = p2Data.color + '1a';
    document.getElementById('p2Preview').style.borderColor = p2Data.color;
    
    if (p2Char === 'nirnama') {
        if (nirnamaPreviewDataUrl) {
            document.getElementById('p2Preview').style.backgroundImage = `url('${nirnamaPreviewDataUrl}')`;
            document.getElementById('p2Preview').style.backgroundSize = 'contain';
            document.getElementById('p2Preview').style.backgroundPosition = 'center';
            document.getElementById('p2Preview').style.backgroundRepeat = 'no-repeat';
        } else {
            document.getElementById('p2Preview').style.backgroundImage = "url('nirnama_sprites.jpg')";
            document.getElementById('p2Preview').style.backgroundSize = '320px 320px';
            document.getElementById('p2Preview').style.backgroundPosition = '-8px -8px';
            document.getElementById('p2Preview').style.backgroundRepeat = 'no-repeat';
        }
    } else if (p2Char === 'nadira') {
        if (nadiraPreviewDataUrl) {
            document.getElementById('p2Preview').style.backgroundImage = `url('${nadiraPreviewDataUrl}')`;
            document.getElementById('p2Preview').style.backgroundSize = 'contain';
            document.getElementById('p2Preview').style.backgroundPosition = 'center';
            document.getElementById('p2Preview').style.backgroundRepeat = 'no-repeat';
        } else {
            document.getElementById('p2Preview').style.backgroundImage = "url('nadira_sprites.jpg')";
            document.getElementById('p2Preview').style.backgroundSize = '320px 320px';
            document.getElementById('p2Preview').style.backgroundPosition = '-8px -8px';
            document.getElementById('p2Preview').style.backgroundRepeat = 'no-repeat';
        }
    } else if (p2Char === 'jagad') {
        if (jagadPreviewDataUrl) {
            document.getElementById('p2Preview').style.backgroundImage = `url('${jagadPreviewDataUrl}')`;
            document.getElementById('p2Preview').style.backgroundSize = 'contain';
            document.getElementById('p2Preview').style.backgroundPosition = 'center';
            document.getElementById('p2Preview').style.backgroundRepeat = 'no-repeat';
        } else {
            document.getElementById('p2Preview').style.backgroundImage = "url('jagad_sprites.jpg')";
            document.getElementById('p2Preview').style.backgroundSize = '320px 320px';
            document.getElementById('p2Preview').style.backgroundPosition = '-8px -8px';
            document.getElementById('p2Preview').style.backgroundRepeat = 'no-repeat';
        }
    } else if (p2Char === 'syaitan') {
        if (syaitanPreviewDataUrl) {
            document.getElementById('p2Preview').style.backgroundImage = `url('${syaitanPreviewDataUrl}')`;
            document.getElementById('p2Preview').style.backgroundSize = 'contain';
            document.getElementById('p2Preview').style.backgroundPosition = 'center';
            document.getElementById('p2Preview').style.backgroundRepeat = 'no-repeat';
        } else {
            document.getElementById('p2Preview').style.backgroundImage = "url('syaitan_sprites.jpg')";
            document.getElementById('p2Preview').style.backgroundSize = '320px 320px';
            document.getElementById('p2Preview').style.backgroundPosition = '-8px -8px';
            document.getElementById('p2Preview').style.backgroundRepeat = 'no-repeat';
        }
    } else {
        document.getElementById('p2Preview').style.backgroundImage = 'none';
    }
    
    // Fill stat bars
    document.getElementById('p2StatDamage').style.width = (p2Data.damage * 7) + '%';
    document.getElementById('p2StatSpeed').style.width = (p2Data.speed * 12) + '%';
    document.getElementById('p2StatRange').style.width = (p2Data.range / 1.5) + '%';
}

function backToMenu() {
    showScreen('mainMenuScreen');
}

// ================= PARTICLE & PROJECTILE CLASSES =================

class Particle {
    constructor({ x, y, vx, vy, color, radius, decay }) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.radius = radius || Math.random() * 3 + 1;
        this.alpha = 1.0;
        this.decay = decay || 0.03;
    }

    draw() {
        c.save();
        c.globalAlpha = this.alpha;
        c.shadowBlur = 10;
        c.shadowColor = this.color;
        c.fillStyle = this.color;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fill();
        c.restore();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
    }
}

class Projectile {
    constructor({ x, y, vx, color, owner, damage }) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.color = color;
        this.owner = owner;
        this.damage = damage || 8;
        this.width = 40;
        this.height = 20;
        this.radius = 12;
    }

    draw() {
        c.save();
        c.shadowBlur = 20;
        c.shadowColor = this.color;
        c.fillStyle = this.color;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fill();
        
        // Glow trail
        c.globalAlpha = 0.4;
        c.beginPath();
        c.arc(this.x - this.vx * 1.5, this.y, this.radius * 0.8, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(this.x - this.vx * 3.0, this.y, this.radius * 0.5, 0, Math.PI * 2);
        c.fill();
        c.restore();
    }

    update() {
        this.x += this.vx;
        
        // Spawn tiny trail particles
        if (Math.random() < 0.3) {
            particles.push(new Particle({
                x: this.x,
                y: this.y,
                vx: -this.vx * 0.2 + (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                color: this.color,
                radius: Math.random() * 2 + 1,
                decay: 0.05
            }));
        }
    }
}

// ================= FIGHTER SPRITE CLASS =================

class Sprite {
    constructor({ position, velocity, color, characterPreset, isP2 }) {
        this.position = position;
        this.velocity = velocity;
        this.color = color;
        this.isP2 = isP2;
        this.preset = characterPreset;
        
        // Dimensions
        this.width = this.preset.width || 50;
        this.height = this.preset.height || 145;
        this.scaleY = 1.0; // Dynamic scale for crouching
        
        // Attributes
        this.maxHealth = this.preset.maxHealth;
        this.health = this.preset.maxHealth;
        this.speed = this.preset.speed;
        this.mass = this.preset.mass;
        this.baseDamage = this.preset.damage;
        
        // States
        this.isAttacking = false;
        this.attackType = ''; // 'light', 'heavy', 'special'
        this.attackCooldown = 0;
        this.isStunned = false;
        this.stunTimer = 0;
        this.isBlocking = false;
        this.isCrouching = false;
        this.facing = isP2 ? 'left' : 'right';
        
        // Charge variable (specifically for Jagad/Budak Kuning)
        this.chargeTimer = 0;
        this.chargeDashing = false;
        
        // Projectile attack flag
        this.projectileSpawned = false;

        // Knockdown & Death variables
        this.isKnockedDown = false;
        this.knockdownTimer = 0;
        this.consecutiveHits = 0;
        this.isDead = false;

        // Collision Boxes
        this.attackBox = {
            position: { x: this.position.x, y: this.position.y },
            width: this.preset.range,
            height: 50,
            offset: { x: 0, y: 30 }
        };
    }

    get actualHeight() {
        return this.height * this.scaleY;
    }

    get hurtBox() {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.width,
            height: this.actualHeight
        };
    }

    draw() {
        const headRadius = this.preset.name === 'Sang Syaitan' ? 22 : 14;
        const px = this.position.x;
        const py = this.position.y;
        const w = this.width;
        const h = this.actualHeight;
        
        const currentFloorLimit = CANVAS_HEIGHT - FLOOR_HEIGHT - h;
        const isOnFloor = py >= currentFloorLimit - 8;

        c.save();
        
        // Glow effect
        c.shadowBlur = 20;
        c.shadowColor = this.color;
        c.strokeStyle = this.color;
        c.fillStyle = this.color;
        c.lineWidth = 3.5;

        // Rotate character context to lie horizontal if Dead or Knocked Down on Floor
        if (this.isDead || (this.isKnockedDown && isOnFloor)) {
            const centerX = px + w / 2;
            const centerY = py + h - 10;
            c.translate(centerX, centerY);
            c.rotate(this.facing === 'right' ? Math.PI / 2 : -Math.PI / 2);
            c.translate(-centerX, -centerY);
        }

        // Jagad Sprite Rendering Engine
        if (this.preset.name === 'Jagad' && jagadSpriteSheetLoaded) {
            let col = 0;
            let row = 3; // Idle is (0,3)
            
            if (this.isDead) {
                col = 3; row = 3; // Defeated / Kneeling Down
            } else if (this.isKnockedDown) {
                col = 3; row = 3; // Knocked Down / Defeated
            } else if (this.isStunned) {
                col = 3; row = 3; // Hit Stun / kneeling down in pain
            } else if (this.isBlocking) {
                col = 2; row = 3; // Block
            } else if (this.isAttacking) {
                if (this.attackType === 'light') {
                    col = 0; row = 1; // Light Punch
                } else if (this.attackType === 'heavy') {
                    col = 2; row = 1; // Heavy Kick
                } else if (this.attackType === 'special') {
                    col = 3; row = 2; // Special Attack / Lunge Dash
                }
            } else if (this.velocity.y < 0) { // Jumping
                col = 2; row = 2; // Leap slash
            } else if (this.velocity.x !== 0) {
                // If lunging/charging fast, use sprint frame, else cycle walk
                if (this.chargeDashing || Math.abs(this.velocity.x) > 6) {
                    col = 3; row = 2; // Speed lunge sprint
                } else {
                    const walkFrame = Math.floor(Date.now() / 150) % 2;
                    col = walkFrame;
                    row = 0;
                }
            } else if (this.isCrouching) {
                col = 2; row = 0; // Crouch
            } else {
                col = 0; row = 3; // Idle
            }

            const cellW = jagadSpriteSheetWidth / 4;
            const cellH = jagadSpriteSheetHeight / 4;
            const scale = jagadSpriteSheetWidth / 1024;
            
            // Custom crop offsets to avoid cutoffs for Jagad:
            // sx_offset = 16, sy_offset = 16, sw = 224, sh = 224
            const sx = Math.round(col * cellW + (16 * scale));
            const sy = Math.round(row * cellH + (16 * scale));
            const sw = Math.round(224 * scale);
            const sh = Math.round(224 * scale);

            c.save();
            // Mirror image if facing left
            if (this.facing === 'left') {
                c.translate(px + w / 2, py + h / 2);
                c.scale(-1, 1);
                c.translate(-(px + w / 2), -(py + h / 2));
            }

            // Scale bounding draw dimensions larger to cover margins
            const drawW = w * 2.35;
            const drawH = h * 1.15;
            const dx = px - (drawW - w) / 2;
            const dy = py - (drawH - h);

            c.drawImage(jagadTransparentCanvas, sx, sy, sw, sh, dx, dy, drawW, drawH);
            c.restore();

            c.restore(); // Restore outer rotation context save
            return; // Exit draw loop immediately to prevent fallback wireframe
        }

        // Sang Syaitan Sprite Rendering Engine
        if (this.preset.name === 'Sang Syaitan' && syaitanSpriteSheetLoaded) {
            let col = 0;
            let row = 3; // Idle is (0,3)
            
            if (this.isDead) {
                col = 3; row = 3; // Defeated / Kneeling Down
            } else if (this.isKnockedDown) {
                col = 3; row = 3; // Knocked Down / Defeated
            } else if (this.isStunned) {
                col = 3; row = 3; // Hit Stun / kneeling down in pain
            } else if (this.isBlocking) {
                col = 2; row = 3; // Block
            } else if (this.isAttacking) {
                if (this.attackType === 'light') {
                    col = 0; row = 1; // Light Punch
                } else if (this.attackType === 'heavy') {
                    col = 2; row = 1; // Heavy Kick
                } else if (this.attackType === 'special') {
                    col = 3; row = 2; // Special Attack / Slam Grab lunge
                }
            } else if (this.velocity.y < 0) { // Jumping
                col = 2; row = 2; // Leap slash
            } else if (this.velocity.x !== 0) {
                // Alternates walking animation every 150ms
                const walkFrame = Math.floor(Date.now() / 150) % 2;
                col = walkFrame;
                row = 0;
            } else if (this.isCrouching) {
                col = 2; row = 0; // Crouch
            } else {
                col = 0; row = 3; // Idle
            }

            const cellW = syaitanSpriteSheetWidth / 4;
            const cellH = syaitanSpriteSheetHeight / 4;
            const scale = syaitanSpriteSheetWidth / 1024;
            
            // Custom crop offsets to avoid cutoffs for Sang Syaitan (wings & horns):
            // sx_offset = 12, sy_offset = 12, sw = 232, sh = 232
            const sx = Math.round(col * cellW + (12 * scale));
            const sy = Math.round(row * cellH + (12 * scale));
            const sw = Math.round(232 * scale);
            const sh = Math.round(232 * scale);

            c.save();
            // Mirror image if facing left
            if (this.facing === 'left') {
                c.translate(px + w / 2, py + h / 2);
                c.scale(-1, 1);
                c.translate(-(px + w / 2), -(py + h / 2));
            }

            // Scale bounding draw dimensions larger to cover margins
            const drawW = w * 2.35;
            const drawH = h * 1.15;
            const dx = px - (drawW - w) / 2;
            const dy = py - (drawH - h);

            c.drawImage(syaitanTransparentCanvas, sx, sy, sw, sh, dx, dy, drawW, drawH);
            c.restore();

            c.restore(); // Restore outer rotation context save
            return; // Exit draw loop immediately to prevent fallback wireframe
        }

        // Nadira Sprite Rendering Engine
        if (this.preset.name === 'Nadira' && nadiraSpriteSheetLoaded) {
            let col = 0;
            let row = 3; // Idle is (0,3)
            
            if (this.isDead) {
                col = 1; row = 3; // Knocked Down / Dead
            } else if (this.isKnockedDown) {
                col = 1; row = 3; // Knocked Down
            } else if (this.isStunned) {
                col = 2; row = 2; // Hit Stun / Damage
            } else if (this.isBlocking) {
                col = 3; row = 3; // Block
            } else if (this.isAttacking) {
                if (this.attackType === 'light') {
                    col = 0; row = 2; // Light Punch
                } else if (this.attackType === 'heavy') {
                    col = 1; row = 2; // Heavy Kick
                } else if (this.attackType === 'special') {
                    col = 3; row = 2; // Special Attack
                }
            } else if (this.velocity.y < 0) { // Jumping
                col = 3; row = 1; // Leap / Mid-air
            } else if (this.velocity.x !== 0) {
                // Animate Nadira's walk cycle across 4 frames in Row 0
                const walkFrame = Math.floor(Date.now() / 120) % 4;
                col = walkFrame;
                row = 0;
            } else if (this.isCrouching) {
                col = 0; row = 1; // Crouch
            } else {
                col = 0; row = 3; // Idle
            }

            const cellW = nadiraSpriteSheetWidth / 4;
            const cellH = nadiraSpriteSheetHeight / 4;
            const scale = nadiraSpriteSheetWidth / 1024;
            
            // Custom crop offsets to avoid cutoffs for Nadira:
            // sx_offset = 16, sy_offset = 10, sw = 224, sh = 236
            const sx = Math.round(col * cellW + (16 * scale));
            const sy = Math.round(row * cellH + (10 * scale));
            const sw = Math.round(224 * scale);
            const sh = Math.round(236 * scale);

            c.save();
            // Mirror image if facing left
            if (this.facing === 'left') {
                c.translate(px + w / 2, py + h / 2);
                c.scale(-1, 1);
                c.translate(-(px + w / 2), -(py + h / 2));
            }

            // Scale bounding draw dimensions larger to cover margins
            const drawW = w * 2.35;
            const drawH = h * 1.15;
            const dx = px - (drawW - w) / 2;
            const dy = py - (drawH - h);

            c.drawImage(nadiraTransparentCanvas, sx, sy, sw, sh, dx, dy, drawW, drawH);
            c.restore();

            c.restore(); // Restore outer rotation context save
            return; // Exit draw loop immediately to prevent fallback wireframe
        }

        // Nirnama Sprite Rendering Engine
        if (this.preset.name === 'Nirnama' && spriteSheetLoaded) {
            let col = 0;
            let row = 0;
            
            if (this.isDead) {
                col = 1; row = 3;
            } else if (this.isKnockedDown) {
                col = 1; row = 3;
            } else if (this.isStunned) {
                col = 1; row = 3;
            } else if (this.isBlocking) {
                col = 2; row = 3;
            } else if (this.isAttacking) {
                if (this.attackType === 'light') {
                    col = 0; row = 1; // Light Punch
                } else if (this.attackType === 'heavy') {
                    col = 1; row = 1; // Heavy Kick
                } else if (this.attackType === 'special') {
                    col = 0; row = 3; // Special Move Initial Stance
                }
            } else if (this.velocity.y < 0) { // Jumping
                col = 3; row = 1; // Anti-Air Uppercut Pose
            } else if (this.velocity.x !== 0) {
                const isMovingForward = (this.facing === 'right' && this.velocity.x > 0) || (this.facing === 'left' && this.velocity.x < 0);
                if (isMovingForward) {
                    col = 2; row = 0; // Walk Forward
                } else {
                    col = 3; row = 0; // Dash Backward
                }
            } else if (this.isCrouching) {
                col = 1; row = 0; // Crouch
            } else {
                // Check if game won and we are the winner to display victory pose
                const isGameOver = !gameActive && (p1Wins >= 2 || p2Wins >= 2);
                const isWinner = isGameOver && this.health > 0;
                if (isWinner) {
                    col = 3; row = 3; // Victory Pose
                } else {
                    col = 0; row = 0; // Idle
                }
            }

            const cellW = spriteSheetWidth / 4;
            const cellH = spriteSheetHeight / 4;
            const scale = spriteSheetWidth / 1024;
            
            const sx = Math.round(col * cellW + (16 * scale));
            const sy = Math.round(row * cellH + (16 * scale));
            const sw = Math.round(224 * scale);
            const sh = Math.round(224 * scale);

            c.save();
            // Mirror image if facing left
            if (this.facing === 'left') {
                c.translate(px + w / 2, py + h / 2);
                c.scale(-1, 1);
                c.translate(-(px + w / 2), -(py + h / 2));
            }

            // Scale bounding draw dimensions larger to cover margins
            const drawW = w * 2.35;
            const drawH = h * 1.15;
            const dx = px - (drawW - w) / 2;
            const dy = py - (drawH - h);

            c.drawImage(transparentCanvas, sx, sy, sw, sh, dx, dy, drawW, drawH);
            c.restore();

            c.restore(); // Restore outer rotation context save
            return; // Exit draw loop immediately to prevent fallback wireframe
        }

        // Apply stun overlay flickering (white/red flicker)
        if (this.isStunned && Math.floor(Date.now() / 50) % 2 === 0) {
            c.strokeStyle = '#ffffff';
            c.shadowColor = '#ffffff';
        }

        // Apply blocking blue shield visual
        if (this.isBlocking && !this.isDead && !this.isKnockedDown) {
            c.save();
            c.strokeStyle = 'cyan';
            c.shadowColor = 'cyan';
            c.lineWidth = 2.5;
            c.beginPath();
            const bx = this.facing === 'right' ? px + w + 10 : px - 10;
            c.arc(bx, py + h/2, h/2, -Math.PI/2, Math.PI/2, this.facing !== 'right');
            c.stroke();
            c.restore();
        }

        // ================= DRAW NEON SKELETON =================
        const centerX = px + w / 2;
        const neckY = py + 26;
        const headY = neckY - headRadius;
        const pelvisY = py + h * 0.65;
        const shoulderY = py + 39;
        const floorY = py + h;

        // 1. Draw Head (glowing circle)
        c.beginPath();
        c.arc(centerX, headY, headRadius, 0, Math.PI * 2);
        c.stroke();
        
        // Character Headgear Custom Decorations
        if (this.preset.name === 'Sang Syaitan') {
            // Demon Horns
            c.save();
            c.strokeStyle = '#aa00ff';
            c.lineWidth = 4;
            c.beginPath();
            c.moveTo(centerX - 8, headY - 14);
            c.quadraticCurveTo(centerX - 24, headY - 36, centerX - 26, headY - 26);
            c.moveTo(centerX + 8, headY - 14);
            c.quadraticCurveTo(centerX + 24, headY - 36, centerX + 26, headY - 26);
            c.stroke();
            c.restore();
        } else if (this.preset.name === 'Nirnama') {
            // Tanjak (Traditional Headwrap)
            c.save();
            c.fillStyle = this.color + '44';
            c.beginPath();
            const dir = this.facing === 'right' ? 1 : -1;
            c.moveTo(centerX - headRadius, headY);
            c.lineTo(centerX - 4 * dir, headY - headRadius - 10);
            c.lineTo(centerX + headRadius, headY - 2);
            c.closePath();
            c.fill();
            c.stroke();
            c.restore();
        } else if (this.preset.name === 'Nadira') {
            // Neck scarf wraps and trailing tails
            c.save();
            c.strokeStyle = '#00ffcc';
            c.shadowColor = '#00ffcc';
            c.lineWidth = 4;
            // Neckband
            c.beginPath();
            c.moveTo(centerX - 12, neckY);
            c.lineTo(centerX + 12, neckY);
            c.stroke();
            // Scarf trail
            const trailDir = this.facing === 'right' ? -1 : 1;
            c.beginPath();
            c.moveTo(centerX, neckY);
            c.quadraticCurveTo(centerX + trailDir * 35, neckY + 15, centerX + trailDir * 50, neckY + 45);
            c.stroke();
            c.restore();
        }

        // 2. Spine & Chest Armor Torso Polygon
        const shWidth = w * 0.45;
        const pelWidth = w * 0.35;
        
        c.save();
        c.fillStyle = this.color + '22'; // Translucent vest glow
        c.beginPath();
        c.moveTo(centerX - shWidth, shoulderY);
        c.lineTo(centerX + shWidth, shoulderY);
        c.lineTo(centerX + pelWidth, pelvisY);
        c.lineTo(centerX - pelWidth, pelvisY);
        c.closePath();
        c.fill();
        c.stroke();
        c.restore();

        // Inner spine detail
        c.beginPath();
        c.moveTo(centerX, neckY);
        c.lineTo(centerX, pelvisY);
        c.stroke();

        // 3. Shoulders Armor Pads
        c.save();
        c.fillStyle = this.color;
        c.beginPath();
        c.arc(centerX - shWidth, shoulderY, 6, 0, Math.PI * 2);
        c.arc(centerX + shWidth, shoulderY, 6, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.restore();

        if (this.preset.name === 'Sang Syaitan') {
            // Extra shoulder spikes
            c.beginPath();
            c.moveTo(centerX - shWidth, shoulderY);
            c.lineTo(centerX - shWidth - 12, shoulderY - 14);
            c.lineTo(centerX - shWidth + 5, shoulderY);
            c.moveTo(centerX + shWidth, shoulderY);
            c.lineTo(centerX + shWidth + 12, shoulderY - 14);
            c.lineTo(centerX + shWidth - 5, shoulderY);
            c.stroke();
        }

        // 4. Arms (Calculate joints based on state)
        let lHand = { x: centerX - w * 0.4, y: py + h * 0.45 };
        let rHand = { x: centerX + w * 0.4, y: py + h * 0.45 };
        let lElbow = { x: centerX - w * 0.3, y: py + h * 0.35 };
        let rElbow = { x: centerX + w * 0.3, y: py + h * 0.35 };

        if (this.isAttacking) {
            const ext = this.facing === 'right' ? 1 : -1;
            if (this.attackType === 'light') {
                if (this.facing === 'right') {
                    rElbow = { x: centerX + w * 0.6, y: shoulderY };
                    rHand = { x: centerX + w * 1.1, y: shoulderY - 5 };
                } else {
                    lElbow = { x: centerX - w * 0.6, y: shoulderY };
                    lHand = { x: centerX - w * 1.1, y: shoulderY - 5 };
                }
            } else if (this.attackType === 'heavy') {
                if (this.facing === 'right') {
                    rElbow = { x: centerX + w * 0.5, y: py + h * 0.1 };
                    rHand = { x: centerX + w * 1.3, y: py + h * 0.5 };
                } else {
                    lElbow = { x: centerX - w * 0.5, y: py + h * 0.1 };
                    lHand = { x: centerX - w * 1.3, y: py + h * 0.5 };
                }
                
                // Nadira's scarf line extension
                if (this.preset.name === 'Nadira') {
                    c.save();
                    c.strokeStyle = '#00ffcc';
                    c.shadowColor = '#00ffcc';
                    c.lineWidth = 5;
                    c.beginPath();
                    c.moveTo(centerX, shoulderY);
                    c.bezierCurveTo(centerX + ext * 60, py, centerX + ext * 100, py + h * 0.5, rHand.x, rHand.y);
                    c.stroke();
                    c.restore();
                }
            } else if (this.attackType === 'special') {
                if (this.preset.name === 'Nirnama') {
                    lHand = { x: centerX + ext * 40, y: shoulderY + 5 };
                    rHand = { x: centerX + ext * 45, y: shoulderY - 5 };
                } else if (this.preset.name === 'Nadira') {
                    rHand = { x: centerX + ext * 180, y: shoulderY };
                    rElbow = { x: centerX + ext * 90, y: shoulderY };
                } else if (this.preset.name === 'Jagad') {
                    lHand = { x: centerX - ext * 20, y: py + h * 0.4 };
                    rHand = { x: centerX + ext * 70, y: shoulderY };
                } else if (this.preset.name === 'Sang Syaitan') {
                    lElbow = { x: centerX - w * 0.8, y: shoulderY + 10 };
                    lHand = { x: centerX - w * 0.9, y: py + h * 0.6 };
                    rElbow = { x: centerX + w * 0.8, y: shoulderY + 10 };
                    rHand = { x: centerX + w * 0.9, y: py + h * 0.6 };
                }
            }
        }

        // Draw Left Arm
        c.beginPath();
        c.moveTo(centerX - shWidth, shoulderY);
        c.lineTo(lElbow.x, lElbow.y);
        c.lineTo(lHand.x, lHand.y);
        c.stroke();

        // Draw Right Arm
        c.beginPath();
        c.moveTo(centerX + shWidth, shoulderY);
        c.lineTo(rElbow.x, rElbow.y);
        c.lineTo(rHand.x, rHand.y);
        c.stroke();

        // Hand Joint dots
        c.save();
        c.fillStyle = this.color;
        c.beginPath();
        c.arc(lHand.x, lHand.y, 5, 0, Math.PI * 2);
        c.arc(rHand.x, rHand.y, 5, 0, Math.PI * 2);
        c.fill();
        c.restore();

        // 5. Pelvis
        c.beginPath();
        c.moveTo(centerX - pelWidth, pelvisY);
        c.lineTo(centerX + pelWidth, pelvisY);
        c.stroke();

        if (this.preset.name === 'Jagad') {
            // Waist sash belt decoration
            c.save();
            c.fillStyle = '#ffea0033';
            c.beginPath();
            c.rect(centerX - pelWidth - 4, pelvisY - 3, pelWidth * 2 + 8, 7);
            c.fill();
            c.stroke();
            c.restore();
        }

        // 6. Legs (Hip -> Knee -> Foot)
        let lKnee = { x: centerX - pelWidth - 5, y: py + h * 0.8 };
        let rKnee = { x: centerX + pelWidth + 5, y: py + h * 0.8 };
        let lFoot = { x: centerX - w * 0.4, y: floorY };
        let rFoot = { x: centerX + w * 0.4, y: floorY };

        if (this.isCrouching) {
            lKnee = { x: px - 10, y: py + h * 0.75 };
            rKnee = { x: px + w + 10, y: py + h * 0.75 };
            lFoot = { x: px - 15, y: floorY };
            rFoot = { x: px + w + 15, y: floorY };
        } else if (this.velocity.y < 0) {
            lKnee = { x: centerX - pelWidth, y: py + h * 0.75 };
            rKnee = { x: centerX + pelWidth, y: py + h * 0.75 };
            lFoot = { x: centerX - 10, y: py + h * 0.9 };
            rFoot = { x: centerX + 10, y: py + h * 0.9 };
        }

        // Draw Left Leg
        c.beginPath();
        c.moveTo(centerX - pelWidth, pelvisY);
        c.lineTo(lKnee.x, lKnee.y);
        c.lineTo(lFoot.x, lFoot.y);
        c.stroke();

        // Draw Right Leg
        c.beginPath();
        c.moveTo(centerX + pelWidth, pelvisY);
        c.lineTo(rKnee.x, rKnee.y);
        c.lineTo(rFoot.x, rFoot.y);
        c.stroke();

        // Knee & Foot Joint dots
        c.save();
        c.fillStyle = this.color;
        c.beginPath();
        c.arc(lKnee.x, lKnee.y, 5, 0, Math.PI * 2);
        c.arc(rKnee.x, rKnee.y, 5, 0, Math.PI * 2);
        c.arc(lFoot.x, lFoot.y, 5, 0, Math.PI * 2);
        c.arc(rFoot.x, rFoot.y, 5, 0, Math.PI * 2);
        c.fill();
        c.restore();

        // Draw weapon details on Nirnama
        if (this.preset.name === 'Nirnama' && !this.isCrouching && !this.isDead && !this.isKnockedDown) {
            c.save();
            c.strokeStyle = '#ffcc00';
            c.shadowColor = '#ffcc00';
            c.lineWidth = 2.5;
            c.beginPath();
            c.moveTo(centerX - 4, pelvisY - 10);
            c.lineTo(centerX - 12, pelvisY - 32);
            c.stroke();
            c.restore();
        }

        // Speed lines trail for Jagad lunge
        if (this.preset.name === 'Jagad' && this.chargeDashing) {
            c.save();
            c.globalAlpha = 0.35;
            c.lineWidth = 1;
            c.strokeStyle = 'yellow';
            const ghostOffset = this.facing === 'right' ? -35 : 35;
            c.beginPath();
            c.arc(centerX + ghostOffset, headY, headRadius, 0, Math.PI*2);
            c.stroke();
            c.beginPath();
            c.moveTo(centerX + ghostOffset, neckY);
            c.lineTo(centerX + ghostOffset, pelvisY);
            c.stroke();
            c.restore();
        }

        c.restore();
    }

    update() {
        // Attack Cooldown
        if (this.attackCooldown > 0) this.attackCooldown--;

        // Stun timer
        if (this.isStunned) {
            this.stunTimer--;
            if (this.stunTimer <= 0) {
                this.isStunned = false;
            }
        }

        // Knockdown timer checks
        if (this.isKnockedDown && this.knockdownTimer > 0) {
            this.knockdownTimer--;
            if (this.knockdownTimer <= 0 && !this.isDead) {
                this.isKnockedDown = false;
                this.consecutiveHits = 0;
            }
        }

        // Physics: position += velocity
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Crouching logic: compress height (only if not dead or knocked down)
        if (this.isCrouching && !this.isDead && !this.isKnockedDown) {
            this.scaleY = 0.65;
        } else {
            this.scaleY = 1.0;
        }

        // Floor Gravity Collision
        const currentFloorLimit = CANVAS_HEIGHT - FLOOR_HEIGHT - this.actualHeight;

        if (this.position.y + this.velocity.y >= currentFloorLimit) {
            this.position.y = currentFloorLimit;
            this.velocity.y = 0;
            // Stop horizontal slide on knockdown landing
            if (this.isKnockedDown || this.isDead) {
                this.velocity.x *= 0.75;
            }
        } else {
            // Apply gravity modified by character mass
            this.velocity.y += gravityBase * this.mass;
        }

        // Horizontal Decay (Friction) when not actively walking
        if (this.velocity.x !== 0 && !this.chargeDashing) {
            const decayFactor = (this.isDead || this.isKnockedDown) ? 0.94 : 0.82;
            this.velocity.x *= decayFactor;
            if (Math.abs(this.velocity.x) < 0.1) this.velocity.x = 0;
        }

        // Charge dashing speed control
        if (this.chargeDashing && !this.isDead && !this.isKnockedDown) {
            // Rapid charge particle emissions
            if (Math.random() < 0.4) {
                particles.push(new Particle({
                    x: this.position.x + this.width / 2,
                    y: this.position.y + this.actualHeight * 0.5,
                    vx: (this.facing === 'right' ? -1 : 1) * (Math.random() * 4 + 2),
                    vy: (Math.random() - 0.5) * 3,
                    color: 'yellow',
                    radius: Math.random() * 3 + 1,
                    decay: 0.04
                }));
            }
        }

        // Wall Bounds boundaries
        if (this.position.x < 0) this.position.x = 0;
        if (this.position.x + this.width > CANVAS_WIDTH) this.position.x = CANVAS_WIDTH - this.width;

        // Set Attack Box Position depending on orientation
        if (this.facing === 'right') {
            this.attackBox.position.x = this.position.x + this.width;
        } else {
            this.attackBox.position.x = this.position.x - this.attackBox.width;
        }
        
        // Attack Box height adjustments (crouch attacks lower down)
        this.attackBox.position.y = this.position.y + this.attackBox.offset.y + (this.isCrouching ? 35 : 0);

        this.draw();
    }

    attack(type) {
        if (this.attackCooldown > 0 || this.isStunned || this.isKnockedDown || this.isDead) return;

        this.isAttacking = true;
        this.attackType = type;
        
        // Configure attack properties based on type
        let activeFrames = 120; // 120ms attack active duration
        let cooldownFrames = 12;

        if (type === 'light') {
            this.attackBox.width = this.preset.range;
            this.attackBox.height = 40;
            this.attackBox.offset.y = 25;
            activeFrames = 100;
            cooldownFrames = 8;
        } else if (type === 'heavy') {
            this.attackBox.width = this.preset.range * 1.35;
            this.attackBox.height = 70;
            this.attackBox.offset.y = 15;
            activeFrames = 220;
            cooldownFrames = 24;
        } else if (type === 'special') {
            // Reset special flag
            this.projectileSpawned = false;
            
            if (this.preset.name === 'Nirnama') {
                // Fireball stance
                this.attackBox.width = this.preset.range;
                activeFrames = 180;
                cooldownFrames = 30;
            } else if (this.preset.name === 'Nadira') {
                // Scarf sweep
                this.attackBox.width = this.preset.range * 2.2; // Huge reach
                this.attackBox.height = 50;
                activeFrames = 250;
                cooldownFrames = 40;
            } else if (this.preset.name === 'Jagad') {
                // Charge Dash
                this.chargeDashing = true;
                this.attackBox.width = this.preset.range;
                activeFrames = 200;
                cooldownFrames = 35;
                // Move player at high velocity
                const dir = this.facing === 'right' ? 1 : -1;
                this.velocity.x = dir * 21;
            } else if (this.preset.name === 'Sang Syaitan') {
                // Close command grab
                this.attackBox.width = 45; // very short range
                this.attackBox.height = 100;
                this.attackBox.offset.y = 20;
                activeFrames = 220;
                cooldownFrames = 45;
            }
        }

        // Timer to reset attack state
        setTimeout(() => {
            this.isAttacking = false;
            this.chargeDashing = false;
        }, activeFrames);

        this.attackCooldown = cooldownFrames;
    }

    takeDamage(amount, stunTime, breakBlock = false) {
        if (this.isKnockedDown || this.isDead) return;

        let dmg = amount;
        let isBlocked = false;

        // Check blocking direction: block is triggered by holding opposite horizontal key
        if (this.isBlocking && !breakBlock) {
            isBlocked = true;
            dmg = Math.round(amount * 0.15); // Take 15% chip damage only
        }

        this.health -= dmg;
        if (this.health < 0) this.health = 0;

        // Spark effect
        const sparkColor = isBlocked ? 'cyan' : this.color;
        const sparkCount = isBlocked ? 6 : 15;
        const impactX = this.facing === 'right' ? this.position.x : this.position.x + this.width;
        
        for (let i = 0; i < sparkCount; i++) {
            particles.push(new Particle({
                x: impactX,
                y: this.position.y + this.actualHeight * 0.4 + (Math.random() - 0.5) * 40,
                vx: (this.facing === 'right' ? 1 : -1) * (Math.random() * 6 + 2) + (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 6 - 2,
                color: sparkColor,
                radius: Math.random() * 4 + 1.5,
                decay: Math.random() * 0.02 + 0.02
            }));
        }

        if (isBlocked) {
            // Knockback on block
            const dir = this.facing === 'right' ? -1 : 1;
            this.velocity.x = dir * 4;
            triggerHitstop(3); // Minor freeze
            
            this.consecutiveHits = 0; // Reset combos on block
            spawnFloatingText(impactX, this.position.y + 20, 'ADANG!', 'cyan');
        } else {
            this.consecutiveHits++;
            
            // Check knockdown triggers: 3 hits OR hit by a heavy/special attack OR health <= 0
            const shouldKnockdown = this.consecutiveHits >= 3 || this.attackType === 'heavy' || this.attackType === 'special' || this.health <= 0;
            
            if (this.health <= 0) {
                this.isDead = true;
                this.isStunned = false;
                this.isAttacking = false;
                this.chargeDashing = false;
                
                // KO Flying Arc
                const dir = this.facing === 'right' ? -1 : 1;
                this.velocity.x = dir * 8;
                this.velocity.y = -11;
                
                triggerHitstop(15); // Long dramatic freeze on KO
                triggerScreenShake(15, 400);
            } else if (shouldKnockdown) {
                this.isKnockedDown = true;
                this.knockdownTimer = 75; // Stand up after 1.25s
                this.isStunned = false;
                this.isAttacking = false;
                this.chargeDashing = false;
                
                // Knockdown Flying Arc
                const dir = this.facing === 'right' ? -1 : 1;
                this.velocity.x = dir * 9.5;
                this.velocity.y = -9.5;
                
                spawnFloatingText(impactX, this.position.y, 'JATUH!', 'yellow');
                
                triggerHitstop(6);
                triggerScreenShake(10, 250);
            } else {
                // Hitstun state
                this.isStunned = true;
                this.stunTimer = stunTime || 20;
                this.isAttacking = false;
                this.chargeDashing = false;

                // Knockback on damage
                const dir = this.facing === 'right' ? -1 : 1;
                this.velocity.x = dir * (amount * 0.7);
                this.velocity.y = -2; // slight pop up

                triggerHitstop(7); // Impact weight freeze
                triggerScreenShake(8, 200);
            }

            // Spawn floating damage text
            spawnFloatingText(impactX, this.position.y + 20, `-${dmg}`, '#ff3333');
        }
    }
}

// ================= INPUT SYSTEM & KEYBOARD CAPTURING =================

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    // Global ESC to pause
    if (e.key === 'Escape') {
        if (gameActive) {
            if (isPaused) resumeGame();
            else pauseGame();
        }
        return;
    }

    if (!gameActive || isPaused) return;

    keysPressed[key] = true;

    // Track input history for combos
    const now = Date.now();

    // PLAYER 1 KEYS
    if (['w', 'a', 's', 'd', 'f', 'g', 'r'].includes(key)) {
        p1InputHistory.push({ key, time: now });
        if (p1InputHistory.length > 8) p1InputHistory.shift();
        checkComboP1();
        updateKeyLogUI('p1KeyLog', p1InputHistory);
    }

    // PLAYER 2 KEYS (Only in VS mode)
    if (gameMode === 'vs') {
        if (['arrowup', 'arrowleft', 'arrowdown', 'arrowright', 'k', 'l', 'i'].includes(key)) {
            p2InputHistory.push({ key, time: now });
            if (p2InputHistory.length > 8) p2InputHistory.shift();
            checkComboP2();
            updateKeyLogUI('p2KeyLog', p2InputHistory);
        }
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    keysPressed[key] = false;
});

function updateKeyLogUI(elementId, history) {
    const container = document.getElementById(elementId);
    if (!container) return;
    container.innerHTML = '';
    
    const maxVisible = 6;
    const items = history.slice(-maxVisible);
    
    items.forEach(input => {
        const span = document.createElement('span');
        span.className = 'key-badge';
        
        let label = input.key;
        if (label === 'arrowup') label = '▲';
        else if (label === 'arrowdown') label = '▼';
        else if (label === 'arrowleft') label = '◀';
        else if (label === 'arrowright') label = '▶';
        else if (label === ' ') label = 'SPC';
        
        span.innerText = label;
        container.appendChild(span);
    });
}

// Clear outdated inputs in key queues
function cleanOldInputs() {
    const now = Date.now();
    
    while(p1InputHistory.length > 0 && now - p1InputHistory[0].time > INPUT_TIMEOUT) {
        p1InputHistory.shift();
        updateKeyLogUI('p1KeyLog', p1InputHistory);
    }

    while(p2InputHistory.length > 0 && now - p2InputHistory[0].time > INPUT_TIMEOUT) {
        p2InputHistory.shift();
        updateKeyLogUI('p2KeyLog', p2InputHistory);
    }
}

// Combo Sequence Decoders
function checkComboP1() {
    if (!player1 || player1.isStunned || player1.isKnockedDown || player1.isDead || player1.attackCooldown > 0) return;

    const sequence = p1InputHistory.map(h => h.key).join('');
    
    // 1. QCF (Quarter Circle Forward): Down, Down+Right, Right + Attack (s, d, f)
    // Map lenient sequence search
    if (sequence.includes('sdf') || sequence.includes('sf')) {
        if (player1.preset.name === 'Nirnama') {
            player1.attack('special');
            showComboFeedback('p1ComboText', 'PUKULAN ANGIN!');
            p1InputHistory.length = 0; // Clear buffer
        }
    } 
    // 2. QCB (Quarter Circle Backward): Down, Down+Left, Left + Attack (s, a, f)
    else if (sequence.includes('saf') || sequence.includes('sf')) {
        if (player1.preset.name === 'Nadira') {
            player1.attack('special');
            showComboFeedback('p1ComboText', 'TETHER STRIKE!');
            p1InputHistory.length = 0;
        }
    } 
    // 3. Double Down: Down, Down + Kick (s, s, g)
    else if (sequence.includes('ssg') || sequence.includes('sg')) {
        if (player1.preset.name === 'Sang Syaitan') {
            player1.attack('special');
            showComboFeedback('p1ComboText', 'GENGGAMAN MAUT!');
            p1InputHistory.length = 0;
        }
    }
}

function checkComboP2() {
    if (!player2 || player2.isStunned || player2.isKnockedDown || player2.isDead || player2.attackCooldown > 0) return;

    const sequence = p2InputHistory.map(h => h.key).join('');
    
    // Arrow combinations
    const down = 'arrowdown';
    const right = 'arrowright';
    const left = 'arrowleft';
    
    // QCF: Down, Right + K (Light Attack)
    if ((sequence.includes(down + right + 'k') || sequence.includes(down + 'k')) && player2.preset.name === 'Nirnama') {
        player2.attack('special');
        showComboFeedback('p2ComboText', 'PUKULAN ANGIN!');
        p2InputHistory.length = 0;
    }
    // QCB: Down, Left + K (Light Attack)
    else if ((sequence.includes(down + left + 'k') || sequence.includes(down + 'k')) && player2.preset.name === 'Nadira') {
        player2.attack('special');
        showComboFeedback('p2ComboText', 'TETHER STRIKE!');
        p2InputHistory.length = 0;
    }
    // Double Down + L (Heavy Attack)
    else if (sequence.includes(down + down + 'l') && player2.preset.name === 'Sang Syaitan') {
        player2.attack('special');
        showComboFeedback('p2ComboText', 'GENGGAMAN MAUT!');
        p2InputHistory.length = 0;
    }
}

function showComboFeedback(elementId, comboName) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerText = comboName;
    el.classList.add('active');
    setTimeout(() => {
        el.classList.remove('active');
    }, 1200);
}

// ================= MOVEMENT & ACTION UPDATER (CONTROLS) =================

function processInputs() {
    if (!player1 || !player2 || !gameActive || isPaused) return;

    cleanOldInputs();

    // ------------------ PLAYER 1 MOVEMENT ------------------
    if (!player1.isStunned && !player1.isKnockedDown && !player1.isDead) {
        // Horizontal Movement
        player1.velocity.x = 0;
        
        // Crouch State
        player1.isCrouching = keysPressed['s'] === true;

        if (keysPressed['d']) {
            player1.velocity.x = player1.speed;
            player1.facing = 'right';
            
            // Increment Jagad charge timer if holding forward
            if (player1.preset.name === 'Jagad') {
                player1.chargeTimer = 0; // Reset charge if moving forward
            }
        } else if (keysPressed['a']) {
            player1.velocity.x = -player1.speed;
            player1.facing = 'left';

            // Charge logic for Jagad (Charge back [left] to lunge forward)
            if (player1.preset.name === 'Jagad') {
                player1.chargeTimer += 16.67; // Add frames (approx 60fps)
            }
        } else {
            // Jagad charge decays if not holding back
            if (player1.preset.name === 'Jagad' && player1.chargeTimer > 0) {
                player1.chargeTimer -= 8;
            }
        }

        // Blocking: Block if holding direction away from opponent
        const isP2RightOfP1 = player2.position.x > player1.position.x;
        if (isP2RightOfP1 && keysPressed['a']) {
            player1.isBlocking = true;
        } else if (!isP2RightOfP1 && keysPressed['d']) {
            player1.isBlocking = true;
        } else {
            player1.isBlocking = false;
        }

        // Jump
        const currentFloorLimit = CANVAS_HEIGHT - FLOOR_HEIGHT - player1.actualHeight;
        if (keysPressed['w'] && player1.position.y === currentFloorLimit && player1.velocity.y === 0) {
            player1.velocity.y = -18.5; // Jump strength
        }

        // Normal attacks
        if (keysPressed['f']) {
            player1.attack('light');
            keysPressed['f'] = false; // Trigger once per press
        } else if (keysPressed['g']) {
            player1.attack('heavy');
            keysPressed['g'] = false;
        } else if (keysPressed['r']) {
            // Quick easy shortcut special
            // Check Jagad charge requirement
            if (player1.preset.name === 'Jagad') {
                if (player1.chargeTimer >= 800) {
                    player1.attack('special');
                    showComboFeedback('p1ComboText', 'LARIAN KUNING!');
                    player1.chargeTimer = 0;
                } else {
                    // Flash yellow warning for uncharged
                    showComboFeedback('p1ComboText', 'TAHAN KIRI (1s) DAHULU!');
                }
            } else {
                player1.attack('special');
                const pName = player1.preset.name === 'Nirnama' ? 'PUKULAN ANGIN!' : 
                              player1.preset.name === 'Nadira' ? 'TETHER STRIKE!' : 'GENGGAMAN MAUT!';
                showComboFeedback('p1ComboText', pName);
            }
            keysPressed['r'] = false;
        }
    }

    // ------------------ PLAYER 2 MOVEMENT ------------------
    if (gameMode === 'vs') {
        if (!player2.isStunned && !player2.isKnockedDown && !player2.isDead) {
            player2.velocity.x = 0;
            player2.isCrouching = keysPressed['arrowdown'] === true;

            if (keysPressed['arrowright']) {
                player2.velocity.x = player2.speed;
                player2.facing = 'right';
                if (player2.preset.name === 'Jagad') player2.chargeTimer += 16.67; // charge if moving back (facing left, right is back)
            } else if (keysPressed['arrowleft']) {
                player2.velocity.x = -player2.speed;
                player2.facing = 'left';
                if (player2.preset.name === 'Jagad') player2.chargeTimer = 0;
            } else {
                if (player2.preset.name === 'Jagad' && player2.chargeTimer > 0) player2.chargeTimer -= 8;
            }

            // Blocking
            const isP1RightOfP2 = player1.position.x > player2.position.x;
            if (isP1RightOfP2 && keysPressed['arrowleft']) {
                player2.isBlocking = true;
            } else if (!isP1RightOfP2 && keysPressed['arrowright']) {
                player2.isBlocking = true;
            } else {
                player2.isBlocking = false;
            }

            // Jump
            const currentFloorLimit = CANVAS_HEIGHT - FLOOR_HEIGHT - player2.actualHeight;
            if (keysPressed['arrowup'] && player2.position.y === currentFloorLimit && player2.velocity.y === 0) {
                player2.velocity.y = -18.5;
            }

            // Normal attacks
            if (keysPressed['k']) {
                player2.attack('light');
                keysPressed['k'] = false;
            } else if (keysPressed['l']) {
                player2.attack('heavy');
                keysPressed['l'] = false;
            } else if (keysPressed['i']) {
                if (player2.preset.name === 'Jagad') {
                    if (player2.chargeTimer >= 800) {
                        player2.attack('special');
                        showComboFeedback('p2ComboText', 'LARIAN KUNING!');
                        player2.chargeTimer = 0;
                    } else {
                        showComboFeedback('p2ComboText', 'TAHAN KANAN (1s) DAHULU!');
                    }
                } else {
                    player2.attack('special');
                    const pName = player2.preset.name === 'Nirnama' ? 'PUKULAN ANGIN!' : 
                                  player2.preset.name === 'Nadira' ? 'TETHER STRIKE!' : 'GENGGAMAN MAUT!';
                    showComboFeedback('p2ComboText', pName);
                }
                keysPressed['i'] = false;
            }
        }
    } else {
        // CPU AI Mode
        updateCPUAI();
    }
}

// ================= SIMPLE CPU AI AGENT =================

let cpuActionTimer = 0;

function updateCPUAI() {
    if (!player2 || player2.isStunned || player2.isKnockedDown || player2.isDead || !gameActive || isPaused) return;

    cpuActionTimer++;

    const distance = Math.abs((player2.position.x + player2.width/2) - (player1.position.x + player1.width/2));
    const isP1Left = player1.position.x < player2.position.x;
    
    // Set facing direction
    player2.facing = isP1Left ? 'left' : 'right';
    player2.velocity.x = 0;

    // React to Player 1's attacks (Block Percentage)
    if (player1.isAttacking && distance < 180 && cpuActionTimer % 10 === 0) {
        const blockChance = 0.55; // 55% chance to block
        if (Math.random() < blockChance) {
            player2.isBlocking = true;
            if (Math.random() < 0.4) {
                player2.isCrouching = true; // Crouch block
            }
            return; // Stay blocking
        }
    } else {
        player2.isBlocking = false;
        player2.isCrouching = false;
    }

    // AI States depending on distance
    if (distance > 250) {
        // Move towards Player 1
        const dir = isP1Left ? -1 : 1;
        player2.velocity.x = dir * player2.speed * 0.7; // Walk speed
        
        // Accumulate charge for Jagad AI
        if (player2.preset.name === 'Jagad') {
            player2.chargeTimer += 16.67;
        }

        // High range projectile attacks
        if (cpuActionTimer % 90 === 0 && Math.random() < 0.4) {
            if (player2.preset.name === 'Nirnama') {
                player2.attack('special');
                showComboFeedback('p2ComboText', 'PUKULAN ANGIN!');
            }
        }
    } else if (distance > 80 && distance <= 250) {
        // Mid range behavior: walk, jump or special
        if (cpuActionTimer % 60 === 0) {
            const roll = Math.random();
            if (roll < 0.3) {
                // Jump in
                const currentFloorLimit = CANVAS_HEIGHT - FLOOR_HEIGHT - player2.actualHeight;
                if (player2.position.y === currentFloorLimit) {
                    player2.velocity.y = -17;
                    player2.velocity.x = (isP1Left ? -1 : 1) * player2.speed;
                }
            } else if (roll < 0.65) {
                // Special attacks
                if (player2.preset.name === 'Nadira') {
                    player2.attack('special');
                    showComboFeedback('p2ComboText', 'TETHER STRIKE!');
                } else if (player2.preset.name === 'Jagad' && player2.chargeTimer >= 800) {
                    player2.attack('special');
                    showComboFeedback('p2ComboText', 'LARIAN KUNING!');
                    player2.chargeTimer = 0;
                }
            } else {
                // Just keep walking in
                const dir = isP1Left ? -1 : 1;
                player2.velocity.x = dir * player2.speed;
            }
        }
    } else {
        // Close Range! Attack or Grab
        if (cpuActionTimer % 25 === 0) {
            const roll = Math.random();
            if (roll < 0.5) {
                player2.attack('light');
            } else if (roll < 0.8) {
                player2.attack('heavy');
            } else {
                // Sang Syaitan Grab AI
                if (player2.preset.name === 'Sang Syaitan') {
                    player2.attack('special');
                    showComboFeedback('p2ComboText', 'GENGGAMAN MAUT!');
                } else {
                    player2.attack('light');
                }
            }
        }
    }
}

// ================= SHAKE & HITSTOP =================

function triggerScreenShake(intensity, duration) {
    shakeIntensity = intensity;
    shakeTimer = duration;
}

function triggerHitstop(frames) {
    hitstopFrames = frames;
}

function applyScreenShakeEffect() {
    if (shakeTimer > 0) {
        const dx = (Math.random() - 0.5) * shakeIntensity;
        const dy = (Math.random() - 0.5) * shakeIntensity;
        canvas.style.transform = `translate(${dx}px, ${dy}px)`;
        shakeTimer -= 16.67; // subtract time elapsed
    } else {
        canvas.style.transform = 'translate(0px, 0px)';
    }
}

// ================= COLLISION LOGIC (AABB) =================

function checkAABBCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function checkCombatCollisions() {
    if (!player1 || !player2 || !gameActive || isPaused) return;

    // ------------------ PLAYER 1 ATTACK ------------------
    if (player1.isAttacking && !player1.isStunned) {
        // Map current attack box variables
        const aBox = {
            x: player1.attackBox.position.x,
            y: player1.attackBox.position.y,
            width: player1.attackBox.width,
            height: player1.attackBox.height
        };
        const hBox = player2.hurtBox;

        if (checkAABBCollision(aBox, hBox)) {
            // Register hit (temporarily turn off attacking so we don't trigger damage multiple times in one swing)
            player1.isAttacking = false;
            
            let dmg = player1.baseDamage;
            let stun = 24;
            let unblockable = false;

            if (player1.attackType === 'light') {
                dmg = Math.round(player1.baseDamage * 0.7);
                stun = 18;
            } else if (player1.attackType === 'heavy') {
                dmg = Math.round(player1.baseDamage * 1.35);
                stun = 30;
            } else if (player1.attackType === 'special') {
                if (player1.preset.name === 'Nirnama') {
                    // Fireball is separate, but direct sword push does some damage
                    dmg = Math.round(player1.baseDamage * 0.4);
                } else if (player1.preset.name === 'Nadira') {
                    dmg = Math.round(player1.baseDamage * 1.2);
                    stun = 35;
                } else if (player1.preset.name === 'Jagad') {
                    dmg = Math.round(player1.baseDamage * 1.5);
                    stun = 40;
                    unblockable = true; // Larian Kuning breaks blocks!
                } else if (player1.preset.name === 'Sang Syaitan') {
                    dmg = Math.round(player1.baseDamage * 1.8);
                    stun = 50;
                    unblockable = true; // Command grab is unblockable!
                }
            }

            player2.takeDamage(dmg, stun, unblockable);
            updateHUDHealth();
        }
    }

    // ------------------ PLAYER 1 PROJECTILE SPAWN ------------------
    if (player1.isAttacking && player1.attackType === 'special' && player1.preset.name === 'Nirnama' && !player1.projectileSpawned) {
        player1.projectileSpawned = true;
        const dir = player1.facing === 'right' ? 1 : -1;
        projectiles.push(new Projectile({
            x: player1.position.x + (player1.facing === 'right' ? player1.width + 10 : -20),
            y: player1.position.y + 40,
            vx: dir * 13,
            color: player1.color,
            owner: 'p1',
            damage: 8
        }));
    }

    // ------------------ PLAYER 2 ATTACK ------------------
    if (player2.isAttacking && !player2.isStunned) {
        const aBox = {
            x: player2.attackBox.position.x,
            y: player2.attackBox.position.y,
            width: player2.attackBox.width,
            height: player2.attackBox.height
        };
        const hBox = player1.hurtBox;

        if (checkAABBCollision(aBox, hBox)) {
            player2.isAttacking = false;
            
            let dmg = player2.baseDamage;
            let stun = 24;
            let unblockable = false;

            if (player2.attackType === 'light') {
                dmg = Math.round(player2.baseDamage * 0.7);
                stun = 18;
            } else if (player2.attackType === 'heavy') {
                dmg = Math.round(player2.baseDamage * 1.35);
                stun = 30;
            } else if (player2.attackType === 'special') {
                if (player2.preset.name === 'Nirnama') {
                    dmg = Math.round(player2.baseDamage * 0.4);
                } else if (player2.preset.name === 'Nadira') {
                    dmg = Math.round(player2.baseDamage * 1.2);
                    stun = 35;
                } else if (player2.preset.name === 'Jagad') {
                    dmg = Math.round(player2.baseDamage * 1.5);
                    stun = 40;
                    unblockable = true;
                } else if (player2.preset.name === 'Sang Syaitan') {
                    dmg = Math.round(player2.baseDamage * 1.8);
                    stun = 50;
                    unblockable = true;
                }
            }

            player1.takeDamage(dmg, stun, unblockable);
            updateHUDHealth();
        }
    }

    // ------------------ PLAYER 2 PROJECTILE SPAWN ------------------
    if (player2.isAttacking && player2.attackType === 'special' && player2.preset.name === 'Nirnama' && !player2.projectileSpawned) {
        player2.projectileSpawned = true;
        const dir = player2.facing === 'right' ? 1 : -1;
        projectiles.push(new Projectile({
            x: player2.position.x + (player2.facing === 'right' ? player2.width + 10 : -20),
            y: player2.position.y + 40,
            vx: dir * 13,
            color: player2.color,
            owner: 'p2',
            damage: 8
        }));
    }

    // ------------------ PROJECTILE COLLISIONS ------------------
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.update();

        // Bounds check
        if (proj.x < 0 || proj.x > CANVAS_WIDTH) {
            projectiles.splice(i, 1);
            continue;
        }

        // Check character collision
        const pBox = { x: proj.x - proj.radius, y: proj.y - proj.radius, width: proj.radius * 2, height: proj.radius * 2 };
        
        if (proj.owner === 'p1') {
            if (checkAABBCollision(pBox, player2.hurtBox)) {
                player2.takeDamage(proj.damage, 20);
                updateHUDHealth();
                projectiles.splice(i, 1);
            }
        } else {
            if (checkAABBCollision(pBox, player1.hurtBox)) {
                player1.takeDamage(proj.damage, 20);
                updateHUDHealth();
                projectiles.splice(i, 1);
            }
        }
    }
}

// Push characters apart if colliding
function checkBodyCollisions() {
    if (!player1 || !player2) return;
    
    const h1 = player1.hurtBox;
    const h2 = player2.hurtBox;
    
    if (checkAABBCollision(h1, h2)) {
        // Overlap amount
        const overlapX = Math.min(h1.x + h1.width, h2.x + h2.width) - Math.max(h1.x, h2.x);
        
        // Push both characters equally back
        const p1Left = player1.position.x < player2.position.x;
        const dir = p1Left ? -1 : 1;
        
        player1.position.x += dir * (overlapX / 2);
        player2.position.x -= dir * (overlapX / 2);
    }
}

// HUD Health Update
function updateHUDHealth() {
    const p1Fill = document.getElementById('p1HealthBar');
    const p1Catch = document.getElementById('p1HealthCatchup');
    const p2Fill = document.getElementById('p2HealthBar');
    const p2Catch = document.getElementById('p2HealthCatchup');

    const p1Pct = (player1.health / player1.maxHealth) * 100;
    const p2Pct = (player2.health / player2.maxHealth) * 100;

    p1Fill.style.width = p1Pct + '%';
    p2Fill.style.width = p2Pct + '%';

    // Delayed catch up
    setTimeout(() => {
        p1Catch.style.width = p1Pct + '%';
        p2Catch.style.width = p2Pct + '%';
    }, 600);
}

// ================= GAME ENGINE INITIALIZER & LOOP =================

function initGame() {
    const p1Data = CHARACTER_PRESETS[p1Char];
    const p2Data = CHARACTER_PRESETS[p2Char];

    player1 = new Sprite({
        position: { x: 180, y: 100 },
        velocity: { x: 0, y: 0 },
        color: p1Data.color,
        characterPreset: p1Data,
        isP2: false
    });

    player2 = new Sprite({
        position: { x: CANVAS_WIDTH - 180 - (p2Data.name === 'Sang Syaitan' ? 65 : 50), y: 100 },
        velocity: { x: 0, y: 0 },
        color: p2Data.color,
        characterPreset: p2Data,
        isP2: true
    });

    projectiles = [];
    particles = [];
    p1InputHistory.length = 0;
    p2InputHistory.length = 0;
    updateKeyLogUI('p1KeyLog', p1InputHistory);
    updateKeyLogUI('p2KeyLog', p2InputHistory);

    updateHUDHealth();
    
    // Set Names on HUD
    document.getElementById('hudP1Name').innerText = currentPlayerName;
    document.getElementById('hudP1Char').innerText = p1Data.name;
    document.getElementById('hudP2Name').innerText = gameMode === 'sp' ? 'CPU' : 'Player 2';
    document.getElementById('hudP2Char').innerText = p2Data.name;

    updateHUDWins();
}

function updateHUDWins() {
    const p1Dots = document.querySelectorAll('#p1Wins .round-win-dot');
    const p2Dots = document.querySelectorAll('#p2Wins .round-win-dot');

    p1Dots.forEach((dot, idx) => {
        if (idx < p1Wins) dot.classList.add('active');
        else dot.classList.remove('active');
    });

    p2Dots.forEach((dot, idx) => {
        if (idx < p2Wins) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

function announce(msg, duration = 1500) {
    const el = document.getElementById('announcerMessage');
    el.innerText = msg;
    el.classList.add('active');
    setTimeout(() => {
        el.classList.remove('active');
    }, duration);
}

// Start Game Loop
function startGame() {
    p1Wins = 0;
    p2Wins = 0;
    roundNumber = 1;
    gameActive = true;
    isPaused = false;
    
    // Load character-specific home stage background from background folder
    loadStageBackground(p1Char);
    
    showScreen('gamePlayScreen');
    startRound();
    
    // Start drawing loop
    requestAnimationFrame(gameLoop);
}

function startRound() {
    roundTime = 99;
    roundOver = false;
    document.getElementById('roundTimerText').innerText = roundTime;
    document.getElementById('roundNumberText').innerText = `ROUND ${roundNumber}`;
    
    initGame();
    announce(`PUSINGAN ${roundNumber}`, 1000);
    
    setTimeout(() => {
        announce('MULAKAN!', 800);
        startTimer();
    }, 1200);
}

function startTimer() {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
        if (isPaused || !gameActive) return;
        
        roundTime--;
        document.getElementById('roundTimerText').innerText = roundTime;

        if (roundTime <= 0) {
            clearInterval(timerId);
            evaluateRoundEnd(true); // timeout
        }
    }, 1000);
}

function evaluateRoundEnd(isTimeout = false) {
    if (roundOver) return;
    roundOver = true;

    if (timerId) clearInterval(timerId);
    
    let roundWinner = null;
    let winReason = '';

    if (isTimeout) {
        if (player1.health > player2.health) {
            roundWinner = 1;
            winReason = 'Kelebihan Hayat';
        } else if (player2.health > player1.health) {
            roundWinner = 2;
            winReason = 'Kelebihan Hayat';
        } else {
            winReason = 'Seri!';
        }
    } else {
        if (player1.health <= 0) {
            roundWinner = 2;
            winReason = 'KO';
        } else if (player2.health <= 0) {
            roundWinner = 1;
            winReason = 'KO';
        }
    }

    if (roundWinner === 1) {
        p1Wins++;
        announce(`${currentPlayerName.toUpperCase()} MENANG!`, 2000);
    } else if (roundWinner === 2) {
        p2Wins++;
        const p2Label = gameMode === 'sp' ? 'CPU' : 'PLAYER 2';
        announce(`${p2Label} MENANG!`, 2000);
    } else {
        announce('SERI!', 2000);
    }

    updateHUDWins();

    setTimeout(() => {
        if (p1Wins >= 2) {
            endMatch(1);
        } else if (p2Wins >= 2) {
            endMatch(2);
        } else {
            roundNumber++;
            startRound();
        }
    }, 2500);
}

async function endMatch(winnerNum) {
    gameActive = false;
    if (timerId) clearInterval(timerId);

    const winnerName = winnerNum === 1 ? currentPlayerName : (gameMode === 'sp' ? 'CPU' : 'Player 2');
    const p2Label = gameMode === 'sp' ? 'CPU' : 'Player 2';
    
    // Populate Results Screen
    document.getElementById('victoryTitle').innerText = `${winnerName.toUpperCase()} MENANG!`;
    document.getElementById('victoryDetails').innerText = `Menang dalam ${roundNumber} pusingan!`;
    document.getElementById('resP1Name').innerText = currentPlayerName;
    document.getElementById('resP1Char').innerText = CHARACTER_PRESETS[p1Char].name;
    document.getElementById('resP2Name').innerText = p2Label;
    document.getElementById('resP2Char').innerText = CHARACTER_PRESETS[p2Char].name;

    showScreen('gameOverScreen');

    // Save match data to SQLite database via AJAX API
    try {
        const matchData = {
            player1: currentPlayerName,
            player2: p2Label,
            char1: CHARACTER_PRESETS[p1Char].name,
            char2: CHARACTER_PRESETS[p2Char].name,
            winner: winnerName,
            score1: p1Wins,
            score2: p2Wins
        };

        await fetch('api.php?action=save_match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(matchData)
        });
    } catch (err) {
        console.error('Gagal menyimpan rekod perlawanan ke SQLite:', err);
    }
}

function rematch() {
    startGame();
}

function pauseGame() {
    isPaused = true;
    showScreen('pauseScreen');
}

function resumeGame() {
    isPaused = false;
    showScreen('gamePlayScreen');
}

function quitGameToMenu() {
    gameActive = false;
    if (timerId) clearInterval(timerId);
    showScreen('mainMenuScreen');
}

function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        alpha: 1.0,
        vy: -1.8,
        decay: 0.015
    });
}

// Primary Render Engine Loop
function gameLoop() {
    if (!gameActive) return;

    requestAnimationFrame(gameLoop);

    // If hitstop is active, freeze frames to emphasize impact weight
    if (hitstopFrames > 0) {
        hitstopFrames--;
        return; 
    }

    // 1. Clear Frame Canvas
    c.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Draw Parallax Grid Background (Traditional Arena Theme)
    drawArenaBackground();

    // 3. Process Inputs / CPU Decision Logic
    processInputs();

    // 4. Update Physics & Draw Characters
    if (player1 && player2) {
        player1.update();
        player2.update();

        // 5. Collision Checks
        checkCombatCollisions();
        checkBodyCollisions();
        
        // Check KO/Death condition
        if (player1.health <= 0 || player2.health <= 0) {
            evaluateRoundEnd(false);
        }
    }

    // 6. Draw Projectiles & Particles
    projectiles.forEach(proj => proj.draw());
    
    // Draw and prune particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }

    // 6.5 Draw and update floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.alpha -= ft.decay;
        
        c.save();
        c.globalAlpha = ft.alpha;
        c.font = 'bold 20px Orbitron';
        c.fillStyle = ft.color;
        c.shadowBlur = 10;
        c.shadowColor = ft.color;
        c.fillText(ft.text, ft.x, ft.y);
        c.restore();

        if (ft.alpha <= 0) {
            floatingTexts.splice(i, 1);
        }
    }

    // 7. Render Screen Shake
    applyScreenShakeEffect();
}

function drawArenaBackground() {
    if (stageBgLoaded) {
        c.drawImage(stageBgImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
        // Solid background
        c.fillStyle = '#0f1322';
        c.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Grid details (horizontal & perspective vertical lines)
        c.save();
        c.strokeStyle = 'rgba(50, 100, 255, 0.08)';
        c.lineWidth = 1;

        const gridSize = 40;
        // Horizontal lines
        for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) {
            c.beginPath();
            c.moveTo(0, y);
            c.lineTo(CANVAS_WIDTH, y);
            c.stroke();
        }
        // Vertical lines
        for (let x = 0; x < CANVAS_WIDTH; x += gridSize) {
            c.beginPath();
            c.moveTo(x, 0);
            c.lineTo(x, CANVAS_HEIGHT);
            c.stroke();
        }
        c.restore();
    }

    // Traditional Malay border motifs (Visual borders)
    c.save();
    c.strokeStyle = 'rgba(255, 204, 0, 0.15)'; // Golden accent lines
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(10, 10);
    c.lineTo(CANVAS_WIDTH - 10, 10);
    c.lineTo(CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
    c.lineTo(10, CANVAS_HEIGHT - 10);
    c.closePath();
    c.stroke();
    c.restore();

    // Draw solid floor
    c.save();
    if (stageBgLoaded) {
        // Translucent dark ground overlay so custom backgrounds show through
        c.fillStyle = 'rgba(28, 35, 58, 0.4)';
    } else {
        c.fillStyle = '#1c233a';
    }
    c.shadowBlur = 15;
    c.shadowColor = '#000000';
    c.fillRect(0, CANVAS_HEIGHT - FLOOR_HEIGHT, CANVAS_WIDTH, FLOOR_HEIGHT);

    // Floor surface glowing line
    c.strokeStyle = '#3b82f6';
    c.lineWidth = 3;
    c.shadowBlur = 10;
    c.shadowColor = '#3b82f6';
    c.beginPath();
    c.moveTo(0, CANVAS_HEIGHT - FLOOR_HEIGHT);
    c.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - FLOOR_HEIGHT);
    c.stroke();
    c.restore();
}
