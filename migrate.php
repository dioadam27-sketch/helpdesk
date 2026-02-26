<?php
/**
 * HELPDESK PDB - MIGRATION SCRIPT
 * Fetches data from Google Apps Script and inserts into MySQL
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");
require_once 'config.php';

// --- CONFIGURATION ---
// URL Google Apps Script Anda
$GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwsD9AJH85jYnEcHsE_JujXeVLkrg8d5fL_Ztgrh6NtMQdqqu5-1Z-gdpAQN7xOpNZU/exec';

// --- MAIN LOGIC ---

try {
    // 1. Fetch Data from GAS
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$GAS_API_URL?action=readAll");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Optional: Disable SSL check if needed
    $response = curl_exec($ch);
    
    if (curl_errno($ch)) {
        throw new Exception('Curl error: ' . curl_error($ch));
    }
    curl_close($ch);

    $data = json_decode($response, true);

    if (!$data || ($data['status'] ?? '') !== 'success') {
        throw new Exception('Failed to fetch data from Google Sheets or invalid JSON');
    }

    $requests = $data['requests'] ?? [];
    $complaints = $data['complaints'] ?? [];
    
    $reqCount = 0;
    $compCount = 0;

    // 2. Insert Requests
    $stmtReq = $pdo->prepare("INSERT IGNORE INTO requests (id, studentName, studentId, studentClass, courseName, lecturerName, date, type, reason, evidenceUrl, status, rejectionReason, generatedLetter, createdAt) 
            VALUES (:id, :studentName, :studentId, :studentClass, :courseName, :lecturerName, :date, :type, :reason, :evidenceUrl, :status, :rejectionReason, :generatedLetter, :createdAt)");

    foreach ($requests as $req) {
        // Handle evidence: if it's a long base64 string, skip it to save space. If it's a URL, keep it.
        $evidence = $req['evidenceBase64'] ?? '';
        if (strlen($evidence) > 1000) {
            $evidence = ''; // Skip base64
        }

        $stmtReq->execute([
            ':id' => $req['id'],
            ':studentName' => $req['studentName'],
            ':studentId' => $req['studentId'],
            ':studentClass' => $req['studentClass'],
            ':courseName' => $req['courseName'],
            ':lecturerName' => $req['lecturerName'],
            ':date' => $req['date'],
            ':type' => $req['type'],
            ':reason' => $req['reason'],
            ':evidenceUrl' => $evidence,
            ':status' => $req['status'] ?? 'Menunggu',
            ':rejectionReason' => $req['rejectionReason'] ?? '',
            ':generatedLetter' => $req['generatedLetter'] ?? '',
            ':createdAt' => $req['createdAt']
        ]);
        if ($stmtReq->rowCount() > 0) $reqCount++;
    }

    // 3. Insert Complaints
    $stmtComp = $pdo->prepare("INSERT IGNORE INTO complaints (id, studentName, studentId, studentClass, category, description, adminNote, createdAt) 
            VALUES (:id, :studentName, :studentId, :studentClass, :category, :description, :adminNote, :createdAt)");

    foreach ($complaints as $comp) {
        $stmtComp->execute([
            ':id' => $comp['id'],
            ':studentName' => $comp['studentName'],
            ':studentId' => $comp['studentId'],
            ':studentClass' => $comp['studentClass'],
            ':category' => $comp['category'],
            ':description' => $comp['description'],
            ':adminNote' => $comp['adminNote'] ?? '',
            ':createdAt' => $comp['createdAt']
        ]);
        if ($stmtComp->rowCount() > 0) $compCount++;
    }

    echo json_encode([
        'status' => 'success',
        'message' => "Migrasi Berhasil. Requests: $reqCount, Complaints: $compCount data baru ditambahkan."
    ]);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
