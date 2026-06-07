<?php
// Simple mobile detection redirect
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
$isMobile = false;
$mobileKeywords = ['Mobile', 'Android', 'iPhone', 'iPad', 'Windows Phone', 'BlackBerry', 'Opera Mini', 'Opera Mobi'];
foreach ($mobileKeywords as $keyword) {
    if (stripos($userAgent, $keyword) !== false) {
        $isMobile = true;
        break;
    }
}
if ($isMobile) {
    header('Location: mobile.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="ms">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nirnama: Rentak Pendekar (2D Fighter MVP)</title>
    <!-- Google Fonts for premium appearance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Outfit:wght@300;500;700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- CRT Scanline Effect Overlay -->
    <div class="crt-overlay"></div>

    <!-- Main Application Container -->
    <div class="app-container">
        
        <!-- ================= LOGIN / REGISTRATION SCREEN ================= -->
        <div id="loginScreen" class="screen-overlay active">
            <div class="glass-card login-card">
                <h1 class="game-logo">NIRNAMA</h1>
                <h2 class="sub-logo">RENTAK PENDEKAR</h2>
                <p class="description">Sediakan diri anda untuk pertarungan pendekar teragung Tanah Melayu!</p>
                
                <form id="loginForm" class="login-form">
                    <div class="input-group">
                        <label for="playerNameInput">Nama Pendekar</label>
                        <input type="text" id="playerNameInput" placeholder="Masukkan nama anda..." autocomplete="off" required>
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
                <p class="welcome-text">Selamat datang, Pendekar <span id="displayPlayerName" class="highlight-text">Pahlawan</span></p>
                
                <div class="menu-buttons">
                    <button class="btn btn-menu btn-glow" onclick="showCharacterSelect('sp')">Solo: Lawan Komputer (CPU)</button>
                    <button class="btn btn-menu btn-glow" onclick="showCharacterSelect('vs')">Teman: Lawan P2 (Lokal)</button>
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
                                <th>Kedudukan</th>
                                <th>Pendekar</th>
                                <th>Menang</th>
                                <th>Kalah</th>
                                <th>Jumlah Lawan</th>
                                <th>Nisbah Menang</th>
                            </tr>
                        </thead>
                        <tbody id="leaderboardBody">
                            <!-- Loaded via API -->
                        </tbody>
                    </table>
                </div>
                <button class="btn btn-secondary" onclick="hideLeaderboard()">Kembali ke Menu</button>
            </div>
        </div>

        <!-- ================= HELP & COMBO MODAL ================= -->
        <div id="helpScreen" class="screen-overlay">
            <div class="glass-card help-card">
                <h2>MENU BANTUAN & COMBO</h2>
                
                <div class="help-tabs">
                    <button class="tab-btn active" onclick="switchTab('controlsTab')">Kawalan Butang</button>
                    <button class="tab-btn" onclick="switchTab('combosTab')">Combo Kuasa</button>
                </div>

                <div id="controlsTab" class="tab-content active">
                    <div class="controls-grid">
                        <div class="control-column">
                            <h3>Player 1 (Kiri)</h3>
                            <ul>
                                <li><strong>A / D</strong>: Bergerak Kiri / Kanan</li>
                                <li><strong>W</strong>: Lompat</li>
                                <li><strong>S</strong>: Tunduk / Tangkis Rendah</li>
                                <li><strong>F</strong>: Tumbukan (Ringan)</li>
                                <li><strong>G</strong>: Tetakan / Tendangan (Berat)</li>
                                <li><strong>R</strong>: Kuasa Khas (Mudah)</li>
                            </ul>
                        </div>
                        <div class="control-column">
                            <h3>Player 2 / CPU (Kanan)</h3>
                            <ul>
                                <li><strong>← / →</strong>: Bergerak Kiri / Kanan</li>
                                <li><strong>↑</strong>: Lompat</li>
                                <li><strong>↓</strong>: Tunduk / Tangkis Rendah</li>
                                <li><strong>K</strong>: Tumbukan (Ringan)</li>
                                <li><strong>L</strong>: Tetakan / Tendangan (Berat)</li>
                                <li><strong>I</strong>: Kuasa Khas (Mudah)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div id="combosTab" class="tab-content">
                    <div class="combo-list">
                        <div class="combo-item">
                            <span class="char-badge badge-nirnama">Nirnama</span>
                            <div class="combo-details">
                                <h4>Pukulan Angin (Hadouken Wave)</h4>
                                <p class="combo-keys">S ➔ S+D ➔ D + F (Bawah, Bawah-Kanan, Kanan + Punch) / R</p>
                                <p class="combo-desc">Melancarkan gelombang tenaga merah merentasi skrin.</p>
                            </div>
                        </div>
                        <div class="combo-item">
                            <span class="char-badge badge-cendana">Cendana</span>
                            <div class="combo-details">
                                <h4>Tether Strike (Scarf Sweep)</h4>
                                <p class="combo-keys">S ➔ S+A ➔ A + F (Bawah, Bawah-Kiri, Kiri + Punch) / R</p>
                                <p class="combo-desc">Menghulurkan selendang sakti jarak jauh untuk menyerang dan menolak musuh.</p>
                            </div>
                        </div>
                        <div class="combo-item">
                            <span class="char-badge badge-nadim">Nadim / Budak Kuning</span>
                            <div class="combo-details">
                                <h4>Larian Kuning (Dash Charge)</h4>
                                <p class="combo-keys">Tahan A (1 saat) ➔ D + F (Tahan Kiri, lepas tu Kanan + Punch) / R</p>
                                <p class="combo-desc">Larian deras yang melanggar dan memecahkan benteng pertahanan (block-breaker).</p>
                            </div>
                        </div>
                        <div class="combo-item">
                            <span class="char-badge badge-syaitan">Sang Syaitan</span>
                            <div class="combo-details">
                                <h4>Genggaman Maut (Command Grab)</h4>
                                <p class="combo-keys">S ➔ S + G (Bawah, Bawah + Kick) / R</p>
                                <p class="combo-desc">Serangan cengkaman dekat yang tidak boleh diadang (unblockable grab) & menghempas musuh.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <button class="btn btn-secondary mt-2" onclick="hideHelpMenu()">Kembali ke Menu</button>
            </div>
        </div>

        <!-- ================= CHARACTER SELECT SCREEN ================= -->
        <div id="charSelectScreen" class="screen-overlay">
            <div class="glass-card select-card">
                <h2>PILIH PENDEKAR</h2>
                <div class="select-panels">
                    <!-- Player 1 Selection -->
                    <div class="player-select-panel" id="p1SelectPanel">
                        <h3>Player 1: <span id="p1SelectedName">Nirnama</span></h3>
                        <div class="char-avatar-container">
                            <div class="char-preview-box" id="p1Preview" style="background-color: red;">
                                <!-- Will draw skeleton dynamically -->
                            </div>
                        </div>
                        <div class="char-stats">
                            <div class="stat-row"><span>Kerosakan (Damage):</span><div class="stat-bar"><div class="stat-fill" id="p1StatDamage" style="width: 70%;"></div></div></div>
                            <div class="stat-row"><span>Kelajuan (Speed):</span><div class="stat-bar"><div class="stat-fill" id="p1StatSpeed" style="width: 60%;"></div></div></div>
                            <div class="stat-row"><span>Jarak (Range):</span><div class="stat-bar"><div class="stat-fill" id="p1StatRange" style="width: 50%;"></div></div></div>
                        </div>
                    </div>

                    <!-- Characters List -->
                    <div class="char-list-grid">
                        <div class="char-card selected" data-char="nirnama" onclick="selectChar('nirnama')">
                            <div class="char-color-indicator" style="background-color: red;"></div>
                            <div class="char-info">
                                <h4>Nirnama</h4>
                                <p>Balanced / Shoto</p>
                            </div>
                        </div>
                        <div class="char-card" data-char="cendana" onclick="selectChar('cendana')">
                            <div class="char-color-indicator" style="background-color: #00ff66;"></div>
                            <div class="char-info">
                                <h4>Cendana</h4>
                                <p>Zoner / Mid-Range</p>
                            </div>
                        </div>
                        <div class="char-card" data-char="nadim" onclick="selectChar('nadim')">
                            <div class="char-color-indicator" style="background-color: yellow;"></div>
                            <div class="char-info">
                                <h4>Nadim</h4>
                                <p>Rushdown / Agile</p>
                            </div>
                        </div>
                        <div class="char-card" data-char="syaitan" onclick="selectChar('syaitan')">
                            <div class="char-color-indicator" style="background-color: #aa00ff;"></div>
                            <div class="char-info">
                                <h4>Sang Syaitan</h4>
                                <p>Heavy Grappler (Boss)</p>
                            </div>
                        </div>
                    </div>

                    <!-- Player 2 / CPU Selection -->
                    <div class="player-select-panel" id="p2SelectPanel">
                        <h3><span id="p2PanelTitle">CPU</span>: <span id="p2SelectedName">Cendana</span></h3>
                        <div class="char-avatar-container">
                            <div class="char-preview-box" id="p2Preview" style="background-color: #00ff66;">
                                <!-- Will draw skeleton dynamically -->
                            </div>
                        </div>
                        <div class="char-stats">
                            <div class="stat-row"><span>Kerosakan (Damage):</span><div class="stat-bar"><div class="stat-fill" id="p2StatDamage" style="width: 50%;"></div></div></div>
                            <div class="stat-row"><span>Kelajuan (Speed):</span><div class="stat-bar"><div class="stat-fill" id="p2StatSpeed" style="width: 70%;"></div></div></div>
                            <div class="stat-row"><span>Jarak (Range):</span><div class="stat-bar"><div class="stat-fill" id="p2StatRange" style="width: 80%;"></div></div></div>
                        </div>
                    </div>
                </div>

                <div class="select-controls">
                    <button class="btn btn-secondary" onclick="backToMenu()">Batal</button>
                    <button class="btn btn-primary btn-glow" id="startGameBtn" onclick="startGame()">MULA BERLAWAN</button>
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

                <!-- Timer & Info -->
                <div class="hud-timer">
                    <span id="roundTimerText">99</span>
                    <span id="roundNumberText" class="hud-round-label">ROUND 1</span>
                </div>

                <!-- P2 Info -->
                <div class="hud-player p2-hud">
                    <div class="player-meta text-right">
                        <span class="hud-name" id="hudP2Name">CPU</span>
                        <span class="hud-char" id="hudP2Char">Cendana</span>
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

            <!-- Combo indicators and announcer messages -->
            <div class="announcer-container">
                <div id="announcerMessage" class="announcer-text"></div>
            </div>

            <div class="combo-feedback p1-combo-feedback" id="p1ComboText"></div>
            <div class="combo-feedback p2-combo-feedback" id="p2ComboText"></div>

            <!-- Canvas Workspace (Centered 1024x576) -->
            <div class="canvas-wrapper">
                <canvas id="gameCanvas" width="1024" height="576"></canvas>
            </div>

            <!-- Key Logs / Training Overlay -->
            <div class="training-overlay">
                <div class="key-history">
                    <h4>P1 Input Log:</h4>
                    <div id="p1KeyLog" class="key-log-row"></div>
                </div>
                <div class="active-instructions">
                    <span>Tekan <strong>ESC</strong> untuk jeda</span> |
                    <span>Buka <strong>Menu Bantuan</strong> untuk melihat senarai kombo kuasa</span>
                </div>
                <div class="key-history text-right">
                    <h4>P2 Input Log:</h4>
                    <div id="p2KeyLog" class="key-log-row"></div>
                </div>
            </div>
        </div>

        <!-- ================= PAUSE MODAL ================= -->
        <div id="pauseScreen" class="screen-overlay">
            <div class="glass-card menu-card text-center">
                <h2>PERMAINAN DIJEDA</h2>
                <div class="menu-buttons">
                    <button class="btn btn-primary" onclick="resumeGame()">Sambung Semula</button>
                    <button class="btn btn-secondary" onclick="showHelpMenuInGame()">Bantuan & Combo</button>
                    <button class="btn btn-danger" onclick="quitGameToMenu()">Keluar Game</button>
                </div>
            </div>
        </div>

        <!-- ================= GAME OVER SCREEN ================= -->
        <div id="gameOverScreen" class="screen-overlay">
            <div class="glass-card result-card">
                <h1 id="victoryTitle" class="victory-title">NIRNAMA MENANG!</h1>
                <p id="victoryDetails">Pemain menewaskan CPU dalam 2 pusingan.</p>

                <div class="result-stats">
                    <div class="result-stat-item">
                        <span class="label">Pemain 1</span>
                        <span class="val" id="resP1Name">Ali</span>
                        <span class="val text-small" id="resP1Char">Nirnama</span>
                    </div>
                    <div class="vs-text">VS</div>
                    <div class="result-stat-item">
                        <span class="label">Pemain 2 / CPU</span>
                        <span class="val" id="resP2Name">CPU</span>
                        <span class="val text-small" id="resP2Char">Cendana</span>
                    </div>
                </div>

                <div class="menu-buttons mt-2">
                    <button class="btn btn-primary btn-glow" onclick="rematch()">Lawan Semula</button>
                    <button class="btn btn-secondary" onclick="quitGameToMenu()">Kembali ke Menu Utama</button>
                </div>
            </div>
        </div>

    </div>

    <!-- Core Logic JS -->
    <script src="game.js"></script>
</body>
</html>
