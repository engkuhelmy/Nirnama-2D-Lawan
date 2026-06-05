<?php
// api.php - Backend API for Nirnama: Rentak Pendekar
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? '';

// Helper to return error response
function respondError($message) {
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}

// Helper to return success response
function respondSuccess($data = []) {
    echo json_encode(array_merge(['success' => true], $data));
    exit;
}

switch ($action) {
    case 'register':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            respondError('Kaedah HTTP tidak dibenarkan. Gunakan POST.');
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $name = trim($input['name'] ?? '');
        
        if (empty($name)) {
            respondError('Nama tidak boleh kosong.');
        }
        
        if (strlen($name) < 2 || strlen($name) > 20) {
            respondError('Nama mestilah antara 2 hingga 20 aksara.');
        }

        try {
            // Check if player already exists
            $stmt = $pdo->prepare("SELECT id FROM players WHERE name = :name");
            $stmt->execute(['name' => $name]);
            $player = $stmt->fetch();

            if ($player) {
                // Already registered, just return success
                respondSuccess(['message' => 'Selamat kembali, Pendekar ' . htmlspecialchars($name) . '!']);
            } else {
                // Register new player
                $insert = $pdo->prepare("INSERT INTO players (name) VALUES (:name)");
                $insert->execute(['name' => $name]);
                respondSuccess(['message' => 'Pendaftaran berjaya. Selamat datang, Pendekar ' . htmlspecialchars($name) . '!']);
            }
        } catch (PDOException $e) {
            respondError('Gagal mendaftar: ' . $e->getMessage());
        }
        break;

    case 'save_match':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            respondError('Kaedah HTTP tidak dibenarkan. Gunakan POST.');
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $player1 = trim($input['player1'] ?? '');
        $player2 = trim($input['player2'] ?? '');
        $char1 = trim($input['char1'] ?? '');
        $char2 = trim($input['char2'] ?? '');
        $winner = trim($input['winner'] ?? '');
        $score1 = intval($input['score1'] ?? 0);
        $score2 = intval($input['score2'] ?? 0);

        if (empty($player1) || empty($player2) || empty($char1) || empty($char2) || empty($winner)) {
            respondError('Data perlawanan tidak lengkap.');
        }

        try {
            // Ensure both players exist in database (e.g. CPU or temporary players can be Auto-registered)
            foreach ([$player1, $player2] as $name) {
                if (strtolower($name) !== 'cpu' && strtolower($name) !== 'computer') {
                    $stmt = $pdo->prepare("INSERT OR IGNORE INTO players (name) VALUES (:name)");
                    $stmt->execute(['name' => $name]);
                }
            }

            // Insert match record
            $insert = $pdo->prepare("
                INSERT INTO matches (player1, player2, char1, char2, winner, score1, score2)
                VALUES (:player1, :player2, :char1, :char2, :winner, :score1, :score2)
            ");
            $insert->execute([
                'player1' => $player1,
                'player2' => $player2,
                'char1' => $char1,
                'char2' => $char2,
                'winner' => $winner,
                'score1' => $score1,
                'score2' => $score2
            ]);

            respondSuccess(['message' => 'Rekod perlawanan berjaya disimpan!']);
        } catch (PDOException $e) {
            respondError('Gagal menyimpan perlawanan: ' . $e->getMessage());
        }
        break;

    case 'leaderboard':
        try {
            $query = "
                SELECT 
                    name,
                    (SELECT COUNT(*) FROM matches WHERE winner = name) as wins,
                    (SELECT COUNT(*) FROM matches WHERE (player1 = name OR player2 = name) AND winner != name) as losses,
                    (SELECT COUNT(*) FROM matches WHERE player1 = name OR player2 = name) as total_matches
                FROM players
                WHERE name != 'CPU'
                ORDER BY wins DESC, total_matches ASC
                LIMIT 10
            ";
            $stmt = $pdo->query($query);
            $leaderboard = $stmt->fetchAll();
            
            respondSuccess(['leaderboard' => $leaderboard]);
        } catch (PDOException $e) {
            respondError('Gagal mendapatkan papan markah: ' . $e->getMessage());
        }
        break;

    default:
        respondError('Aksi tidak sah.');
        break;
}
