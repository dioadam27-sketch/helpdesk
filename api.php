<?php
/**
 * HELPDESK PDB - PHP BACKEND API (Hybrid Version)
 * Handles text data storage in MySQL
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// --- DATABASE CONFIGURATION ---
$db_host = 'localhost';
$db_name = 'pkkiipendidikanu_helpdesk';
$db_user = 'pkkiipendidikanu_dioarsip';
$db_pass = '@Dioadam27';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Connection failed: ' . $e->getMessage()]);
    exit;
}

// --- ROUTING ---
$action = $_GET['action'] ?? '';

// For POST requests, we read from php://input
$input = json_decode(file_get_contents('php://input'), true);
if (!$action && isset($input['action'])) {
    $action = $input['action'];
}

switch ($action) {
    case 'readAll':
        readAll($pdo);
        break;
    case 'create':
        createRequest($pdo, $input['data'] ?? null);
        break;
    case 'createComplaint':
        createComplaint($pdo, $input['data'] ?? null);
        break;
    case 'updateStatus':
        updateStatus($pdo, $input);
        break;
    case 'updateComplaint':
        updateComplaint($pdo, $input);
        break;
    case 'deleteRequest':
        deleteRequest($pdo, $input['id'] ?? '');
        break;
    case 'deleteComplaint':
        deleteComplaint($pdo, $input['id'] ?? '');
        break;
    default:
        echo json_encode(['status' => 'error', 'message' => 'Invalid action: ' . $action]);
        break;
}

// --- ACTIONS ---

function readAll($pdo) {
    try {
        $stmtReq = $pdo->query("SELECT * FROM requests ORDER BY createdAt DESC");
        $requests = $stmtReq->fetchAll();

        $stmtComp = $pdo->query("SELECT * FROM complaints ORDER BY createdAt DESC");
        $complaints = $stmtComp->fetchAll();

        echo json_encode([
            'status' => 'success',
            'requests' => $requests,
            'complaints' => $complaints
        ]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}

function createRequest($pdo, $data) {
    if (!$data) {
        echo json_encode(['status' => 'error', 'message' => 'No data provided']);
        return;
    }

    try {
        $sql = "INSERT INTO requests (id, studentName, studentId, studentClass, courseName, lecturerName, date, type, reason, evidenceUrl, status, rejectionReason, generatedLetter, createdAt) 
                VALUES (:id, :studentName, :studentId, :studentClass, :courseName, :lecturerName, :date, :type, :reason, :evidenceUrl, :status, :rejectionReason, :generatedLetter, :createdAt)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => $data['id'],
            ':studentName' => $data['studentName'],
            ':studentId' => $data['studentId'],
            ':studentClass' => $data['studentClass'],
            ':courseName' => $data['courseName'],
            ':lecturerName' => $data['lecturerName'],
            ':date' => $data['date'],
            ':type' => $data['type'],
            ':reason' => $data['reason'],
            ':evidenceUrl' => $data['evidenceBase64'] ?? '', 
            ':status' => $data['status'] ?? 'Menunggu',
            ':rejectionReason' => $data['rejectionReason'] ?? '',
            ':generatedLetter' => $data['generatedLetter'] ?? '',
            ':createdAt' => $data['createdAt']
        ]);

        echo json_encode(['status' => 'success']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}

function createComplaint($pdo, $data) {
    if (!$data) {
        echo json_encode(['status' => 'error', 'message' => 'No data provided']);
        return;
    }

    try {
        $sql = "INSERT INTO complaints (id, studentName, studentId, studentClass, category, description, adminNote, createdAt) 
                VALUES (:id, :studentName, :studentId, :studentClass, :category, :description, :adminNote, :createdAt)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => $data['id'],
            ':studentName' => $data['studentName'],
            ':studentId' => $data['studentId'],
            ':studentClass' => $data['studentClass'],
            ':category' => $data['category'],
            ':description' => $data['description'],
            ':adminNote' => $data['adminNote'] ?? '',
            ':createdAt' => $data['createdAt']
        ]);

        echo json_encode(['status' => 'success']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}

function updateStatus($pdo, $input) {
    $id = $input['id'] ?? '';
    $status = $input['status'] ?? '';
    $rejectionReason = $input['rejectionReason'] ?? '';

    if (!$id || !$status) {
        echo json_encode(['status' => 'error', 'message' => 'Missing ID or Status']);
        return;
    }

    try {
        $sql = "UPDATE requests SET status = :status, rejectionReason = :rejectionReason WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':status' => $status,
            ':rejectionReason' => $rejectionReason,
            ':id' => $id
        ]);

        echo json_encode(['status' => 'success']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}

function updateComplaint($pdo, $input) {
    $id = $input['id'] ?? '';
    $adminNote = $input['adminNote'] ?? '';

    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'Missing ID']);
        return;
    }

    try {
        $sql = "UPDATE complaints SET adminNote = :adminNote WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':adminNote' => $adminNote,
            ':id' => $id
        ]);

        echo json_encode(['status' => 'success']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}

function deleteRequest($pdo, $id) {
    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'Missing ID']);
        return;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM requests WHERE id = :id");
        $stmt->execute([':id' => $id]);

        echo json_encode(['status' => 'success']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}

function deleteComplaint($pdo, $id) {
    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'Missing ID']);
        return;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM complaints WHERE id = :id");
        $stmt->execute([':id' => $id]);

        echo json_encode(['status' => 'success']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}
