<?php
// Simple desktop redirection: if NOT mobile, redirect to index.php
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
$isMobile = false;
$mobileKeywords = ['Mobile', 'Android', 'iPhone', 'iPad', 'Windows Phone', 'BlackBerry', 'Opera Mini', 'Opera Mobi'];
foreach ($mobileKeywords as $keyword) {
    if (stripos($userAgent, $keyword) !== false) {
        $isMobile = true;
        break;
    }
}
if (!$isMobile) {
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="ms">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Nirnama: Rentak Pendekar - Mobile Edition</title>
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Outfit:wght@300;500;700;900&display=swap" rel="stylesheet">
    <!-- Desktop styling sheets -->
    <link rel="stylesheet" href="style.css">
    
    <!-- Mobile specific GameBoy layout styling overrides -->
    <style>
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: #0b0c10;
            font-family: 'Outfit', sans-serif;
            user-select: none;
            -webkit-user-select: none;
            touch-action: none;
        }

        /* Portrait layout split */
        .gb-container {
            display: flex;
            flex-direction: column;
            width: 100vw;
            height: 100vh;
            background-color: #1a1c24;
            position: relative;
        }

        /* 1. GameBoy Screen Bezel (Top Half) */
        .gb-screen-bezel {
            height: 48%;
            width: 100%;
            background-color: #121319;
            box-shadow: 0 4px 15px rgba(0,0,0,0.8);
            border-bottom: 6px solid #2d313c;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            box-sizing: border-box;
            padding: 10px;
        }

        /* Power LED Light */
        .gb-power-led {
            position: absolute;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }

        .led-light {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #ff3333;
            box-shadow: 0 0 10px #ff3333;
            animation: pulse-led 2s infinite alternate;
        }

        .led-label {
            font-family: 'Orbitron', sans-serif;
            font-size: 0.5rem;
            color: #666;
            letter-spacing: 0.5px;
        }

        @keyframes pulse-led {
            0% { opacity: 0.6; box-shadow: 0 0 4px #ff3333; }
            100% { opacity: 1; box-shadow: 0 0 12px #ff3333; }
        }

        /* Viewport of Game Screen */
        .gb-screen-viewport {
            width: 90%;
            height: 94%;
            background-color: #0f111a;
            border: 4px solid #08090c;
            border-radius: 8px;
            position: relative;
            overflow: hidden;
            box-shadow: inset 0 0 20px rgba(0,0,0,0.9);
        }

        /* Adjust overlays and containers to lock to top viewport */
        .gb-screen-viewport .screen-overlay {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            min-height: auto !important;
            padding: 10px !important;
            box-sizing: border-box;
            background: rgba(13, 17, 28, 0.95) !important;
            display: none;
            justify-content: center;
            align-items: center;
            overflow-y: auto !important;
        }

        .gb-screen-viewport .screen-overlay.active {
            display: flex !important;
        }

        /* Responsive canvas scale to viewport */
        .gb-screen-viewport .canvas-wrapper {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .gb-screen-viewport canvas {
            width: 100% !important;
            height: auto !important;
            aspect-ratio: 16/9 !important;
            max-height: 100% !important;
            object-fit: contain;
        }

        /* Glass Cards adaptation for small screens */
        .gb-screen-viewport .glass-card {
            width: 96% !important;
            max-width: 100% !important;
            padding: 12px !important;
            margin: 0 auto !important;
            border-radius: 6px !important;
        }

        .gb-screen-viewport h1, .gb-screen-viewport h2 {
            font-size: 1.25rem !important;
            margin-bottom: 8px !important;
        }

        .gb-screen-viewport p.description, .gb-screen-viewport p.welcome-text {
            font-size: 0.75rem !important;
            margin-bottom: 10px !important;
        }

        /* Adjust character list and details layout inside character select screen overlay */
        .gb-screen-viewport .select-panels {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
            max-height: 180px;
            overflow-y: auto;
            padding-right: 2px;
        }

        .gb-screen-viewport .player-select-panel {
            padding: 8px !important;
            flex-direction: row !important;
            align-items: center !important;
            gap: 10px !important;
        }

        .gb-screen-viewport .char-avatar-container {
            width: 60px !important;
            height: 60px !important;
            margin-bottom: 0 !important;
        }

        .gb-screen-viewport .char-preview-box {
            width: 35px !important;
            height: 55px !important;
        }

        .gb-screen-viewport .char-stats {
            flex-grow: 1;
        }

        .gb-screen-viewport .stat-row {
            margin-bottom: 2px !important;
            font-size: 0.65rem !important;
        }

        .gb-screen-viewport .char-list-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            grid-template-rows: repeat(2, 1fr) !important;
            gap: 6px !important;
        }

        .gb-screen-viewport .char-card {
            padding: 6px 8px !important;
            gap: 6px !important;
        }

        .gb-screen-viewport .char-info h4 {
            font-size: 0.8rem !important;
        }

        .gb-screen-viewport .char-info p {
            display: none !important; /* Hide descriptions to save space */
        }

        /* HUD overlays size adjust */
        .gb-screen-viewport .hud-container {
            width: 98% !important;
            margin-top: 5px !important;
            margin-bottom: 0px !important;
            grid-template-columns: 1fr 60px 1fr !important;
        }

        .gb-screen-viewport .hud-name {
            font-size: 0.75rem !important;
        }

        .gb-screen-viewport .hud-char {
            font-size: 0.6rem !important;
        }

        .gb-screen-viewport .health-bar-container {
            height: 12px !important;
        }

        .gb-screen-viewport .hud-timer {
            height: 38px !important;
            width: 50px !important;
        }

        .gb-screen-viewport #roundTimerText {
            font-size: 1.15rem !important;
        }

        .gb-screen-viewport .hud-round-label {
            font-size: 0.5rem !important;
        }

        .gb-screen-viewport .announcer-text {
            font-size: 1.5rem !important;
        }

        .gb-screen-viewport .combo-feedback {
            font-size: 0.9rem !important;
        }

        .gb-screen-viewport .training-overlay {
            display: none !important; /* Hide keylogs overlay to maximize canvas visibility */
        }

        /* Leaderboard table adjustments */
        .gb-screen-viewport .table-container {
            max-height: 160px;
        }

        .gb-screen-viewport .leaderboard-table th, .gb-screen-viewport .leaderboard-table td {
            padding: 6px 8px !important;
            font-size: 0.75rem !important;
        }

        /* Help screen scroll */
        .gb-screen-viewport .tab-content {
            max-height: 170px !important;
        }

        .gb-screen-viewport .controls-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
        }

        /* 2. GameBoy Controller (Bottom Half) */
        .gb-controller {
            height: 52%;
            width: 100%;
            background: linear-gradient(135deg, #32353f, #1b1d22);
            box-shadow: inset 0 8px 16px rgba(0,0,0,0.5);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px 25px 20px;
            box-sizing: border-box;
            position: relative;
        }

        /* Brand text */
        .gb-brand {
            font-family: 'Orbitron', sans-serif;
            font-weight: 900;
            font-size: 0.85rem;
            color: #4f5263;
            letter-spacing: 3px;
            text-transform: uppercase;
            text-shadow: 0 1px 1px rgba(255,255,255,0.05);
            margin-bottom: 5px;
        }

        .gb-brand span {
            color: var(--neon-red);
            text-shadow: 0 0 5px rgba(255, 51, 51, 0.4);
        }

        /* Controls Area Grid */
        .gb-controls-row {
            display: flex;
            width: 100%;
            justify-content: space-between;
            align-items: center;
            flex-grow: 1;
        }

        /* D-Pad (Cross Controller Button) */
        .gb-dpad-wrapper {
            position: relative;
            width: 120px;
            height: 120px;
        }

        .gb-dpad {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(3, 1fr);
            width: 100%;
            height: 100%;
            background-color: #111216;
            border-radius: 50%;
            box-shadow: 0 4px 10px rgba(0,0,0,0.4), inset 0 2px 5px rgba(255,255,255,0.05);
            padding: 8px;
            box-sizing: border-box;
        }

        .dpad-btn {
            background-color: #24252e;
            border: none;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #555;
            font-size: 1.1rem;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.6);
            transition: background-color 0.1s, color 0.1s;
            position: relative;
        }

        .dpad-btn:active, .dpad-btn.active {
            background-color: var(--neon-blue);
            color: #fff;
            box-shadow: 0 0 10px var(--neon-blue);
        }

        .dpad-up {
            grid-column: 2;
            grid-row: 1;
            border-radius: 4px 4px 0 0;
            border-bottom: 1px solid #111;
        }

        .dpad-left {
            grid-column: 1;
            grid-row: 2;
            border-radius: 4px 0 0 4px;
            border-right: 1px solid #111;
        }

        .dpad-center {
            grid-column: 2;
            grid-row: 2;
            background-color: #24252e;
            box-shadow: none;
            cursor: default;
        }

        .dpad-right {
            grid-column: 3;
            grid-row: 2;
            border-radius: 0 4px 4px 0;
            border-left: 1px solid #111;
        }

        .dpad-down {
            grid-column: 2;
            grid-row: 3;
            border-radius: 0 0 4px 4px;
            border-top: 1px solid #111;
        }

        /* Action Buttons Area */
        .gb-actions-wrapper {
            display: flex;
            align-items: center;
            gap: 12px;
            background-color: rgba(0,0,0,0.2);
            padding: 10px 14px;
            border-radius: 40px;
            box-shadow: inset 0 2px 5px rgba(0,0,0,0.4);
            transform: rotate(-10deg);
        }

        .action-btn {
            width: 54px;
            height: 54px;
            border-radius: 50%;
            border: 2px solid #111;
            color: #fff;
            font-family: 'Orbitron', sans-serif;
            font-weight: 900;
            font-size: 1.1rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.1);
            transition: transform 0.05s, box-shadow 0.05s;
        }

        .action-btn span.label {
            font-size: 0.55rem;
            font-weight: 400;
            color: rgba(255,255,255,0.7);
            margin-top: 1px;
            text-transform: uppercase;
        }

        .action-btn:active {
            transform: scale(0.92);
            box-shadow: 0 1px 2px rgba(0,0,0,0.6);
        }

        /* Punch button */
        .btn-punch {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border-color: #1e3a8a;
            box-shadow: 0 4px 6px rgba(0,0,0,0.4), 0 0 5px rgba(59, 130, 246, 0.4);
        }
        .btn-punch:active {
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.8);
        }

        /* Kick button */
        .btn-kick {
            background: linear-gradient(135deg, #10b981, #047857);
            border-color: #064e3b;
            box-shadow: 0 4px 6px rgba(0,0,0,0.4), 0 0 5px rgba(16, 185, 129, 0.4);
        }
        .btn-kick:active {
            box-shadow: 0 0 15px rgba(16, 185, 129, 0.8);
        }

        /* Power button */
        .btn-power {
            background: linear-gradient(135deg, #ef4444, #b91c1c);
            border-color: #7f1d1d;
            box-shadow: 0 4px 6px rgba(0,0,0,0.4), 0 0 5px rgba(239, 68, 68, 0.4);
        }
        .btn-power:active {
            box-shadow: 0 0 15px rgba(239, 68, 68, 0.8);
        }

        /* Bottom menu buttons (Select & Start) */
        .gb-menu-row {
            display: flex;
            gap: 25px;
            margin-top: 10px;
        }

        .menu-btn-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
        }

        .menu-pill {
            width: 50px;
            height: 12px;
            background-color: #24252e;
            border: 2px solid #111;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.05);
            cursor: pointer;
            transform: rotate(-25deg);
        }

        .menu-pill:active {
            background-color: #4f5263;
        }

        .menu-btn-label {
            font-family: 'Orbitron', sans-serif;
            font-size: 0.55rem;
            font-weight: 700;
            color: #4f5263;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
    </style>
</head>
<body>
    <!-- CRT Scanline Effect Overlay -->
    <div class="crt-overlay"></div>

    <div class="gb-container">
        <!-- 1. Top Screen Bezel Frame -->
        <div class="gb-screen-bezel">
            <div class="gb-power-led">
                <div class="led-light"></div>
                <span class="led-label">POWER</span>
            </div>
            
            <!-- Game Screen Viewport -->
            <div class="gb-screen-viewport" id="mobileViewport">
                
                <!-- ================= LOGIN / REGISTRATION SCREEN ================= -->
                <div id="loginScreen" class="screen-overlay active">
                    <div class="glass-card login-card">
                        <h1 class="game-logo">NIRNAMA</h1>
                        <h2 class="sub-logo">RENTAK PENDEKAR</h2>
                        <p class="description">Sediakan diri anda untuk pertarungan pendekar Tanah Melayu!</p>
                        
                        <form id="loginForm" class="login-form">
                            <div class="input-group">
                                <label for="playerNameInput">Nama Pendekar</label>
                                <input type="text" id="playerNameInput" placeholder="Nama anda..." autocomplete="off" required>
                            </div>
                            <button type="submit" class="btn btn-primary btn-glow">Daftar Masuk</button>
                        </form>
                        <div class="form-error" id="loginError"></div>
                    </div>
                </div>

                <!-- ================= MAIN MENU SCREEN ================= -->
                <div id="mainMenuScreen" class="screen-overlay">
                    <div class="glass-card menu-card">
                        <h1 class="logo-text-glow">NIRNAMA</h1>
                        <p class="welcome-text">Selamat datang, <span id="displayPlayerName" class="highlight-text">Pahlawan</span></p>
                        
                        <div class="menu-buttons">
                            <button class="btn btn-menu btn-glow" onclick="showCharacterSelect('sp')">Lawan Komputer (CPU)</button>
                            <button class="btn btn-menu" onclick="showLeaderboard()">Papan Pendekar (Leaderboard)</button>
                            <button class="btn btn-menu" onclick="showHelpMenu()">Bantuan & Combo</button>
                            <button class="btn btn-danger btn-sm" onclick="logoutPlayer()">Tukar Nama</button>
                        </div>
                    </div>
                </div>

                <!-- ================= LEADERBOARD MODAL ================= -->
                <div id="leaderboardScreen" class="screen-overlay">
                    <div class="glass-card table-card">
                        <h2>PAPAN PENDEKAR</h2>
                        <div class="table-container">
                            <table class="leaderboard-table">
                                <thead>
                                    <tr>
                                        <th>Pos</th>
                                        <th>Pendekar</th>
                                        <th>W</th>
                                        <th>L</th>
                                        <th>Win %</th>
                                    </tr>
                                </thead>
                                <tbody id="leaderboardBody">
                                    <!-- Loaded via API -->
                                </tbody>
                            </table>
                        </div>
                        <button class="btn btn-secondary btn-sm" onclick="hideLeaderboard()">Kembali</button>
                    </div>
                </div>

                <!-- ================= HELP & COMBO MODAL ================= -->
                <div id="helpScreen" class="screen-overlay">
                    <div class="glass-card help-card">
                        <h2>BANTUAN & COMBO</h2>
                        
                        <div class="help-tabs">
                            <button class="tab-btn active" onclick="switchTab('controlsTab')">Butang</button>
                            <button class="tab-btn" onclick="switchTab('combosTab')">Combo Kuasa</button>
                        </div>

                        <div id="controlsTab" class="tab-content active">
                            <div class="controls-grid">
                                <div class="control-column">
                                    <h3>Virtual Controller</h3>
                                    <ul>
                                        <li><strong>D-Pad ◀ / ▶</strong>: Jalan Kiri / Kanan</li>
                                        <li><strong>D-Pad ▲</strong>: Lompat</li>
                                        <li><strong>D-Pad ▼</strong>: Tunduk / Tangkis</li>
                                        <li><strong>Butang T</strong>: Tumbuk (Punch)</li>
                                        <li><strong>Butang S</strong>: Sepak (Kick)</li>
                                        <li><strong>Butang K</strong>: Kuasa Khas (Special)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div id="combosTab" class="tab-content">
                            <div class="combo-list">
                                <div class="combo-item">
                                    <span class="char-badge badge-nirnama">Nirnama</span>
                                    <div class="combo-details">
                                        <h4>Pukulan Angin (Hadouken)</h4>
                                        <p class="combo-keys">▼ ➔ ▼▶ ➔ ▶ + T / Butang K</p>
                                    </div>
                                </div>
                                <div class="combo-item">
                                    <span class="char-badge badge-nadira">Nadira</span>
                                    <div class="combo-details">
                                        <h4>Tether Strike (Sweep)</h4>
                                        <p class="combo-keys">▼ ➔ ▼◀ ➔ ◀ + T / Butang K</p>
                                    </div>
                                </div>
                                <div class="combo-item">
                                    <span class="char-badge badge-jagad">Jagad</span>
                                    <div class="combo-details">
                                        <h4>Larian Kuning (Dash)</h4>
                                        <p class="combo-keys">Tahan ◀ (1s) ➔ ▶ + T / Butang K</p>
                                    </div>
                                </div>
                                <div class="combo-item">
                                    <span class="char-badge badge-syaitan">Sang Syaitan</span>
                                    <div class="combo-details">
                                        <h4>Genggaman Maut (Grab)</h4>
                                        <p class="combo-keys">▼ ➔ ▼ + S / Butang K</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button class="btn btn-secondary btn-sm mt-2" onclick="hideHelpMenu()">Kembali</button>
                    </div>
                </div>

                <!-- ================= CHARACTER SELECT SCREEN ================= -->
                <div id="charSelectScreen" class="screen-overlay">
                    <div class="glass-card select-card">
                        <h2>PILIH PENDEKAR</h2>
                        <div class="select-panels">
                            <!-- Player 1 Selection -->
                            <div class="player-select-panel" id="p1SelectPanel">
                                <h3>P1: <span id="p1SelectedName">Nirnama</span></h3>
                                <div class="char-avatar-container">
                                    <div class="char-preview-box" id="p1Preview" style="background-color: red;"></div>
                                </div>
                                <div class="char-stats">
                                    <div class="stat-row"><span>Dmg:</span><div class="stat-bar"><div class="stat-fill" id="p1StatDamage" style="width: 70%;"></div></div></div>
                                    <div class="stat-row"><span>Spd:</span><div class="stat-bar"><div class="stat-fill" id="p1StatSpeed" style="width: 60%;"></div></div></div>
                                    <div class="stat-row"><span>Rng:</span><div class="stat-bar"><div class="stat-fill" id="p1StatRange" style="width: 50%;"></div></div></div>
                                </div>
                            </div>

                            <!-- Characters List -->
                            <div class="char-list-grid">
                                <div class="char-card selected" data-char="nirnama" onclick="selectChar('nirnama')">
                                    <div class="char-color-indicator" style="background-color: red;"></div>
                                    <div class="char-info"><h4>Nirnama</h4></div>
                                </div>
                                <div class="char-card" data-char="nadira" onclick="selectChar('nadira')">
                                    <div class="char-color-indicator" style="background-color: #00ff66;"></div>
                                    <div class="char-info"><h4>Nadira</h4></div>
                                </div>
                                <div class="char-card" data-char="jagad" onclick="selectChar('jagad')">
                                    <div class="char-color-indicator" style="background-color: yellow;"></div>
                                    <div class="char-info"><h4>Jagad</h4></div>
                                </div>
                                <div class="char-card" data-char="syaitan" onclick="selectChar('syaitan')">
                                    <div class="char-color-indicator" style="background-color: #aa00ff;"></div>
                                    <div class="char-info"><h4>Syaitan</h4></div>
                                </div>
                            </div>

                            <!-- Player 2 / CPU Selection -->
                            <div class="player-select-panel" id="p2SelectPanel">
                                <h3><span id="p2PanelTitle">CPU</span>: <span id="p2SelectedName">Nadira</span></h3>
                                <div class="char-avatar-container">
                                    <div class="char-preview-box" id="p2Preview" style="background-color: #00ff66;"></div>
                                </div>
                                <div class="char-stats">
                                    <div class="stat-row"><span>Dmg:</span><div class="stat-bar"><div class="stat-fill" id="p2StatDamage" style="width: 50%;"></div></div></div>
                                    <div class="stat-row"><span>Spd:</span><div class="stat-bar"><div class="stat-fill" id="p2StatSpeed" style="width: 70%;"></div></div></div>
                                    <div class="stat-row"><span>Rng:</span><div class="stat-bar"><div class="stat-fill" id="p2StatRange" style="width: 80%;"></div></div></div>
                                </div>
                            </div>
                        </div>

                        <div class="select-controls">
                            <button class="btn btn-secondary btn-sm" onclick="backToMenu()">Batal</button>
                            <button class="btn btn-primary btn-sm btn-glow" id="startGameBtn" onclick="startGame()">MULA</button>
                        </div>
                    </div>
                </div>

                <!-- ================= GAMEPLAY ARENA ================= -->
                <div id="gamePlayScreen" class="screen-overlay">
                    <div class="hud-container">
                        <!-- P1 Info -->
                        <div class="hud-player p1-hud">
                            <div class="player-meta">
                                <span class="hud-name" id="hudP1Name">Nirnama (P1)</span>
                                <span class="hud-char" id="hudP1Char">Nirnama</span>
                            </div>
                            <div class="health-bar-container">
                                <div class="health-bar-fill" id="p1HealthBar"></div>
                                <div class="health-bar-red-catchup" id="p1HealthCatchup"></div>
                            </div>
                            <div class="wins-indicator" id="p1Wins">
                                <span class="round-win-dot"></span>
                                <span class="round-win-dot"></span>
                            </div>
                        </div>

                        <!-- Timer -->
                        <div class="hud-timer">
                            <span id="roundTimerText">99</span>
                            <span id="roundNumberText" class="hud-round-label">ROUND 1</span>
                        </div>

                        <!-- P2 Info -->
                        <div class="hud-player p2-hud">
                            <div class="player-meta text-right">
                                <span class="hud-name" id="hudP2Name">CPU</span>
                                <span class="hud-char" id="hudP2Char">Nadira</span>
                            </div>
                            <div class="health-bar-container">
                                <div class="health-bar-fill" id="p2HealthBar"></div>
                                <div class="health-bar-red-catchup" id="p2HealthCatchup"></div>
                            </div>
                            <div class="wins-indicator text-right" id="p2Wins">
                                <span class="round-win-dot"></span>
                                <span class="round-win-dot"></span>
                            </div>
                        </div>
                    </div>

                    <!-- Announcer messages -->
                    <div class="announcer-container">
                        <div id="announcerMessage" class="announcer-text"></div>
                    </div>

                    <div class="combo-feedback p1-combo-feedback" id="p1ComboText"></div>
                    <div class="combo-feedback p2-combo-feedback" id="p2ComboText"></div>

                    <!-- Canvas Wrapper -->
                    <div class="canvas-wrapper">
                        <canvas id="gameCanvas" width="1024" height="576"></canvas>
                    </div>
                </div>

                <!-- ================= PAUSE MODAL ================= -->
                <div id="pauseScreen" class="screen-overlay">
                    <div class="glass-card menu-card text-center">
                        <h2>PAUSE</h2>
                        <div class="menu-buttons">
                            <button class="btn btn-primary btn-sm" onclick="resumeGame()">Sambung</button>
                            <button class="btn btn-danger btn-sm" onclick="quitGameToMenu()">Keluar</button>
                        </div>
                    </div>
                </div>

                <!-- ================= GAME OVER SCREEN ================= -->
                <div id="gameOverScreen" class="screen-overlay">
                    <div class="glass-card result-card">
                        <h1 id="victoryTitle" class="victory-title">NIRNAMA MENANG!</h1>
                        <p id="victoryDetails">Pemain menewaskan CPU.</p>

                        <div class="result-stats">
                            <div class="result-stat-item">
                                <span class="label">P1</span>
                                <span class="val" id="resP1Name">Pahlawan</span>
                                <span class="val text-small" id="resP1Char">Nirnama</span>
                            </div>
                            <div class="vs-text">VS</div>
                            <div class="result-stat-item">
                                <span class="label">CPU</span>
                                <span class="val" id="resP2Name">CPU</span>
                                <span class="val text-small" id="resP2Char">Nadira</span>
                            </div>
                        </div>

                        <div class="menu-buttons mt-1">
                            <button class="btn btn-primary btn-sm btn-glow" onclick="rematch()">Lawan Semula</button>
                            <button class="btn btn-secondary btn-sm" onclick="quitGameToMenu()">Utama</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <!-- 2. Bottom Controller Section (GameBoy Pad) -->
        <div class="gb-controller">
            <div class="gb-brand"><span>RENTAK</span> PENDEKAR</div>
            
            <div class="gb-controls-row">
                <!-- Retro D-Pad Controller -->
                <div class="gb-dpad-wrapper">
                    <div class="gb-dpad">
                        <button class="dpad-btn dpad-up" id="btnUp">▲</button>
                        <button class="dpad-btn dpad-left" id="btnLeft">◀</button>
                        <div class="dpad-btn dpad-center"></div>
                        <button class="dpad-btn dpad-right" id="btnRight">▶</button>
                        <button class="dpad-btn dpad-down" id="btnDown">▼</button>
                    </div>
                </div>
                
                <!-- Action Buttons: T (Punch), S (Kick), K (Power) -->
                <div class="gb-actions-wrapper">
                    <button class="action-btn btn-punch" id="btnPunch">
                        T
                        <span class="label">Punch</span>
                    </button>
                    <button class="action-btn btn-kick" id="btnKick">
                        S
                        <span class="label">Kick</span>
                    </button>
                    <button class="action-btn btn-power" id="btnPower">
                        K
                        <span class="label">Power</span>
                    </button>
                </div>
            </div>
            
            <!-- Menu Pills: SELECT (Help), START (Pause/Esc) -->
            <div class="gb-menu-row">
                <div class="menu-btn-container">
                    <button class="menu-pill" id="btnSelect"></button>
                    <span class="menu-btn-label">SELECT</span>
                </div>
                <div class="menu-btn-container">
                    <button class="menu-pill" id="btnStart"></button>
                    <span class="menu-btn-label">START</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Core Logic JS -->
    <script src="game.js"></script>

    <!-- Key events dispatch script for mobile controls -->
    <script>
        // Set game mode to single player by default for mobile
        gameMode = 'sp';

        // Keyboard mapping simulator
        function setupVirtualButton(elementId, keyChar) {
            const btn = document.getElementById(elementId);
            if (!btn) return;

            const triggerPress = (e) => {
                e.preventDefault();
                btn.classList.add('active');
                
                // Dispatch keydown
                window.dispatchEvent(new KeyboardEvent('keydown', {
                    key: keyChar,
                    keyCode: keyChar.charCodeAt(0),
                    bubbles: true
                }));
            };

            const triggerRelease = (e) => {
                e.preventDefault();
                btn.classList.remove('active');
                
                // Dispatch keyup
                window.dispatchEvent(new KeyboardEvent('keyup', {
                    key: keyChar,
                    keyCode: keyChar.charCodeAt(0),
                    bubbles: true
                }));
            };

            // Support both Touch Events (Mobile) and Mouse Click Events (Desktop debugging)
            btn.addEventListener('touchstart', triggerPress, { passive: false });
            btn.addEventListener('touchend', triggerRelease, { passive: false });
            btn.addEventListener('mousedown', triggerPress);
            btn.addEventListener('mouseup', triggerRelease);
            btn.addEventListener('mouseleave', triggerRelease);
        }

        // Bind buttons to P1 controls
        setupVirtualButton('btnLeft', 'a');     // Left
        setupVirtualButton('btnRight', 'd');    // Right
        setupVirtualButton('btnUp', 'w');       // Jump
        setupVirtualButton('btnDown', 's');     // Crouch
        setupVirtualButton('btnPunch', 'f');    // Light Punch (T)
        setupVirtualButton('btnKick', 'g');     // Heavy Kick (S)
        setupVirtualButton('btnPower', 'r');    // Special Move (K)

        // START behaves like Escape key (Pause/Resume) or submit actions
        const startBtn = document.getElementById('btnStart');
        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Escape',
                    bubbles: true
                }));
            });
        }

        // SELECT triggers combo help menu visibility toggling
        const selectBtn = document.getElementById('btnSelect');
        if (selectBtn) {
            selectBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const helpScreen = document.getElementById('helpScreen');
                if (helpScreen) {
                    if (helpScreen.classList.contains('active')) {
                        hideHelpMenu();
                    } else {
                        showHelpMenu();
                    }
                }
            });
        }

        // Prevent standard long-press context menus on mobile gameplay screen
        document.addEventListener('contextmenu', e => e.preventDefault());
    </script>
</body>
</html>
