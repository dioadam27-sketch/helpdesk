<?php
/**
 * HELPDESK PDB - CSV IMPORT SCRIPT
 * Imports provided CSV data into MySQL
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");
require_once 'config.php';

// Data CSV (Hardcoded from user input)
$csvData = <<<EOD
ID,StudentName,StudentID,Course,Lecturer,Date,Type,Reason,Evidence,Status,CreatedAt,GeneratedLetter,,
1770853487666,Sawung Kusmahadi ,182231063,PDB07,Pengembangan Diri Kewirausahaan,"PUJI KARYANTO, S.S., M.Hum.",2026-02-11,Lomba/Dispensasi,Pelaksanaan Kegiatan Praktek Kerja Lapangan Mahasiswa Fisika,https://drive.google.com/uc?export=view&id=1VECFKWiYS-QwKd-YsD7_p8EWJkGjwkIK,Disetujui,1770853487666,,
1770853700266,Sawung Kusmahadi ,182231063,PDB07,Pengembangan Diri Kewirausahaan,"PUJI KARYANTO, S.S., M.Hum.",2026-02-11,Lomba/Dispensasi,"Pelaksanaan kegiatan praktek kerja lapangan mahasiswa fisika, mulai dari 13 Januari 2026 - 28 Maret 2026",https://drive.google.com/uc?export=view&id=1Sjd5NsmVTFd3IwWkaQNZHfb6Ctc5d71z,Disetujui,1770853700266,,
1771035132775,OKSAVIYANA ALFAREZI,187221097,PDB 07,Logika dan Pemikiran Kritis,"Ervan Kus Indarto, S.IP., M.IP.",2026-02-18,Acara Keluarga,UMROH,https://drive.google.com/uc?export=view&id=10kjLNdRf12pYt6NdxMGFWzqZ_TiaieGi,Disetujui,1771035132775,,
1771035666701,OKSAVIYANA ALFAREZI,187221097,PDB 07,Inovasi dan Kolaborasi Bisnis,"RETNAYU PRADANIE, S.Kep., Ns., M.Kep",2026-02-18,Acara Keluarga,UMROH,https://drive.google.com/uc?export=view&id=1iVBxjZDbd7XqWBhVak8bLe-E60MG5GEP,Disetujui,1771035666701,,
1771035758126,OKSAVIYANA ALFAREZI,187221097,PDB 07,Pengembangan Diri Kewirausahaan,"PUJI KARYANTO, S.S., M.Hum.",2026-02-18,Acara Keluarga,UMROH,https://drive.google.com/uc?export=view&id=12svsbf245arMGhSwufGY1C9H7CLaBhU_,Disetujui,1771035758126,,
1771035821466,OKSAVIYANA ALFAREZI,187221097,PDB 07,Inovasi dan Kolaborasi Bisnis,"RETNAYU PRADANIE, S.Kep., Ns., M.Kep",2026-02-19,Acara Keluarga,UMROH,https://drive.google.com/uc?export=view&id=1dj73OriU_4b6ZhSrBy8I8CLEZoIKRCHU,Disetujui,1771035821466,,
1771462376216,M. Zizou Rajendra Aryasatya,181251089,PDB12,Pengembangan Diri Kewirausahaan,"Dr. RETNO ADRIYANI, S.T., M.Kes.",2026-02-18,Lainnya,kebutuhan mendesak pengambilan jaket kerja,https://drive.google.com/uc?export=view&id=1kbgawaaSr2ysUGln0zV2WnixEA4S4V2o,Ditolak,1771462376216,,Harap melampirkan Surat Izin Tidak mengikuti Kuliah yang ditanda tangani Dosen Pemgampu
1771462491627,M. Zizou Rajendra Aryasatya,181251089,PDB12,Logika dan Pemikiran Kritis,"LYNDA ROSSYANTI, dr., M.Ked.Trop",2026-02-18,Lainnya,kebutuhan mendesak jadwal pengambilan jaket kerja,https://drive.google.com/uc?export=view&id=11YmAK2CPC96gHGqwsGWoFjTTvh1o05ZL,Ditolak,1771462491627,,Harap melampirkan Surat Izin Tidak mengikuti Kuliah yang ditanda tangani Dosen Pemgampu
1771547632104,Dinda Zakiyah Salsabila ,184251022,PDB-04,Pengembangan Diri Kewirausahaan,"Andini Dyah Sitawati, dr. Sp.KJ.",2026-02-18,Lomba/Dispensasi,Menjadi delegasi dari UKM Garuda Sakti untuk mengikuti sosialisasi Gemastik yang diselenggarakan oleh Ditmawa ,https://drive.google.com/uc?export=view&id=10fLj3Il8Gj9CL5qWH_ymYjv3YgO49G1w,Disetujui,1771547632110,,
1771556606559,NAYLA QUANESHIA SUANDY,181251030,PDB04,Pengembangan Diri Kewirausahaan,"Andini Dyah Sitawati, dr., Sp.KJ.",2026-02-18,Lomba/Dispensasi,Mengikuti kegiatan sosialisasi GEMASTIK yang diadakan oleh DITMAWA Universitas Airlangga.,https://drive.google.com/uc?export=view&id=1aKdrMso5iNbs4GNbtPUrCrTgn4w56Id_,Disetujui,1771556606559,,
1771591454801,Monica Kimberlie,151251008,14,Pengembangan Diri Kewirausahaan,"Ibu Siti Nuraini, S.E., M.E.",2026-02-18,Acara Keluarga,Perayaan imlek bersama keluarga,https://drive.google.com/uc?export=view&id=1oI9qpO8Kg-j21cuhDbd-DC8uNRofJ62c,Disetujui,1771591454802,,
1771591646455,Monica Kimberlie,151251008,PDB 14,Logika dan Pemikiran Kritis,"Dr. Sianiwati Goenharto, drg., MS.",2026-02-18,Acara Keluarga,Merayakan imlek bersama keluarga,https://drive.google.com/uc?export=view&id=1r1SR4ZMpPLdpCMpUwxsOa7VDQd6sZx4Y,Disetujui,1771591646455,,
1771739318840,HUNAFA AINUR RISKINA,151251281,PDB 17,Inovasi dan Kolaborasi Bisnis,"Dr. MAKHFUDLI, S.Kep.Ns., M.Ked.Trop",2026-02-12,Sakit,Sakit,https://drive.google.com/uc?export=view&id=1s-Woo7tzxms97OSkV1eFErJh9aXfNiiL,Disetujui,1771739318840,,
1771846442579,MIFTAKHUL ZILA AGNESIA,184251029,PDB 05,Inovasi dan Kolaborasi Bisnis,"ARIA AULIA NASTITI, S.Kep., Ns., M.Kep",2026-02-19,Sakit,Sakit dengan diagnosis a09 diarrhoea and gastroenteritis of presumed infectious origin c (Utama),https://drive.google.com/uc?export=view&id=1yL-y37wlvRQ1WjD8VgNQC56DDsDDxDNj,Disetujui,1771846442579,,
1771846530174,MIFTAKHUL ZILA AGNESIA,184251029,PDB 05,Data dan Pustaka,"Bian Shabri Putri Irwanto, S.KM., M.KKK",2026-02-19,Sakit,"Sakit dengan diagnosis a09 diarrhoea and gastroenteritis of presumed infectious origin c (Utama)""",https://drive.google.com/uc?export=view&id=1FaTOURTecBBAIlQWT_Or8u2img-KgKXf,Disetujui,1771846530174,,
1771979785685,Saifut Am Waroh,185251015,PDB03,Pengembangan Diri Kewirausahaan,"Sheila Maryam Gautama, dr., Sp.K.J.",2026-02-11,Sakit,Dikarenakan dalam kondisi sakit dan opname,https://drive.google.com/uc?export=view&id=17HLwTtUxwmOqnRCpler4DR5uFWs8Jgr8,Disetujui,1771979785686,,
1771979948754,Saifut Am Waroh,185251015,PDB03,Logika dan Pemikiran Kritis,"Dr. Lestari Sudaryanti, dr., M.Kes.",2026-02-11,Sakit,Sakit dengan diagnosis hematoma pada ginjal,https://drive.google.com/uc?export=view&id=1TreqN0V-JV_VfTmim0VAcWnPEi_S6XKB,Disetujui,1771979948754,,
1771980159099,Saifut Am Waroh,185251015,PDB03,Inovasi dan Kolaborasi Bisnis,"Sri Musta'ina, Dra., M.Kes.",2026-02-12,Sakit,Sakit dengan diagnosis hematoma pada ginjal,https://drive.google.com/uc?export=view&id=1p2v85xBntBY36ILa5TEJ3Kff6_qaMkjJ,Disetujui,1771980159099,,
1771980302584,Saifut Am Waroh,185251015,PDB03,Data dan Pustaka,"Mhd. Zamal Nasution, S.Si., M.Sc., Ph.D.",2026-02-12,Sakit,Sakit dengan diagnosis hematoma pada ginjal,https://drive.google.com/uc?export=view&id=16buPuVu-elcxbV7SJfWBROwohAnD-2Gy,Disetujui,1771980302584,,
1771980584655,Saifut Am Waroh,185251015,PDB03,Pengembangan Diri Kewirausahaan,"Sheila Maryam Gautama, dr., Sp.K.J.",2026-02-18,Sakit,Pemulihan setelah opname,https://drive.google.com/uc?export=view&id=1fmn5EAb4leta_rzIi1SM3eGx6bnLCxmo,Disetujui,1771980584655,,
1771980687819,Saifut Am Waroh,185251015,PDB03,Logika dan Pemikiran Kritis,"Dr. Lestari Sudaryanti, dr., M.Kes.",2026-02-18,Sakit,Pemulihan setelah opname,https://drive.google.com/uc?export=view&id=1T2pIXTRjIoOrv0WC3hyHk8p709uh6Rdl,Disetujui,1771980687819,,
1771980733274,OKSAVIYANA ALFAREZI ,187221097,PDB 07,Inovasi dan Kolaborasi Bisnis,"Retnayu Pradanie, S.Kep., Ns., M.Kep",2026-02-26,Acara Keluarga,Umrah,https://drive.google.com/uc?export=view&id=11-aBttxkxzjscKCAlneyFPRr1DYDTPGq,Disetujui,1771980733274,,
1771980804022,Saifut Am Waroh,185251015,PDB03,Inovasi dan Kolaborasi Bisnis,"Sri Musta'ina, Dra., M.Kes.",2026-02-19,Sakit,Pemulihan setelah opname,https://drive.google.com/uc?export=view&id=1ILrqLkhEVnEyg-ANT-ZFo4LfBO7dKkef,Disetujui,1771980804022,,
1771980858206,Saifut Am Waroh,185251015,PDB03,Data dan Pustaka,"Mhd. Zamal Nasution, S.Si., M.Sc., Ph.D.",2026-02-19,Sakit,Pemulihan setelah opname,https://drive.google.com/uc?export=view&id=1eCMvLTRJeoWlmr57H49OvZMd2yty4jpB,Disetujui,1771980858206,,
1771980882584,OKSAVIYANA ALFAREZI ,187221097,PDB 07,Logika dan Pemikiran Kritis,"ERVAN KUS INDARTO, S.IP., M.IP",2026-02-25,Acara Keluarga,umrah,https://drive.google.com/uc?export=view&id=1siXrNEW-TzWP86-EOumlcd9wTCHD41MR,Disetujui,1771980882584,,
1771980969841,OKSAVIYANA ALFAREZI ,187221097,PDB 07,Pengembangan Diri Kewirausahaan,"Puji karyanto, S.S., M.Hum.",2026-02-25,Acara Keluarga,umrah,https://drive.google.com/uc?export=view&id=1O25DVxHJJvkzcmZSJEE-0WuzoF2CF5ab,Disetujui,1771980969841,,
1771981218310,Saifut Am Waroh,185251015,PDB03,Pengembangan Diri Kewirausahaan,"Sheila Maryam Gautama, dr., Sp.K.J.",2026-02-25,Sakit,Opname operasi usus buntu,https://drive.google.com/uc?export=view&id=1zDEyvSbi_30UjDWEP60DMRtN6G94D_WO,Disetujui,1771981218310,,
1771981301984,Saifut Am Waroh,185251015,PDB03,Logika dan Pemikiran Kritis,"Dr. Lestari Sudaryanti, dr., M.Kes.",2026-02-25,Sakit,Opname operasi usus buntu,https://drive.google.com/uc?export=view&id=1B6_2YY8XCz8rQIvC_Zqx878mvL4b1Equ,Disetujui,1771981301984,,
1771987531227,RATU AULIA RAHMA,188251109,PDB 12,Pengembangan Diri Kewirausahaan,"Dr. RETNO ADRIYANI, S.T., M.Kes.",2026-02-18,Lomba/Dispensasi,Dispensai mata kuliah PDK karena mengikuti sosialisasi GEMASTIK,https://drive.google.com/uc?export=view&id=1qjOIv0eTGRbx7cJ1SP_n9oaeorYPPd_p,Disetujui,1771987531228,,
1771987688011,RATU AULIA RAHMA,188251109,PDB 12,Logika dan Pemikiran Kritis,"LYNDA ROSSYANTI, dr.,M.Ked.Trop",2026-02-18,Lomba/Dispensasi,Dispensasi mata kuliah LPK karena mengikuti sosialisasi GEMASTIK,https://drive.google.com/uc?export=view&id=19SE7MW1J7-54nMPD7Mxobpk0zLlb8kwj,Disetujui,1771987688011,,
1771990422381,Siti Dinda Safyla,184251025,PDB04,Inovasi dan Kolaborasi Bisnis,"Dr. Maftuchah Rochmanti, dr., M.Kes",2026-02-26,Sakit,Berhalangan hadir karena menjalani kontrol lanjutan perawatan saluran akar (Root Canal Treatment) di RSUD Tuban pada tanggal 26 Februari 2026.,https://drive.google.com/uc?export=view&id=1HRrmFfq_1eXT10Y_P1eIF0EEEYmNKSzK,Disetujui,1771990422381,,
EOD;

try {
    // Parse CSV
    $lines = explode("\n", trim($csvData));
    $header = str_getcsv(array_shift($lines)); // Skip header

    $count = 0;
    $errors = 0;

    $stmt = $pdo->prepare("INSERT IGNORE INTO requests (id, studentName, studentId, studentClass, courseName, lecturerName, date, type, reason, evidenceUrl, status, rejectionReason, generatedLetter, createdAt) 
            VALUES (:id, :studentName, :studentId, :studentClass, :courseName, :lecturerName, :date, :type, :reason, :evidenceUrl, :status, :rejectionReason, :generatedLetter, :createdAt)");

    foreach ($lines as $line) {
        if (empty(trim($line))) continue;
        
        $row = str_getcsv($line);
        
        // Mapping based on CSV structure:
        // 0: ID
        // 1: StudentName
        // 2: StudentID
        // 3: Class (PDB07) -> studentClass
        // 4: Course (Pengembangan Diri...) -> courseName
        // 5: Lecturer
        // 6: Date
        // 7: Type
        // 8: Reason
        // 9: Evidence
        // 10: Status
        // 11: CreatedAt
        // 12: GeneratedLetter (empty usually)
        // 13: RejectionReason (sometimes present in last col)

        if (count($row) < 12) {
            $errors++;
            continue;
        }

        $id = $row[0];
        $studentName = $row[1];
        $studentId = $row[2];
        $studentClass = $row[3];
        $courseName = $row[4];
        $lecturerName = $row[5];
        $date = $row[6];
        $type = $row[7];
        $reason = $row[8];
        $evidenceUrl = $row[9];
        $status = $row[10];
        $createdAt = $row[11];
        $generatedLetter = $row[12] ?? '';
        $rejectionReason = $row[13] ?? ''; // Assuming rejection reason is the last column if exists

        // Clean up data
        $status = ucfirst(strtolower($status)); // Ensure consistent casing

        $stmt->execute([
            ':id' => $id,
            ':studentName' => $studentName,
            ':studentId' => $studentId,
            ':studentClass' => $studentClass,
            ':courseName' => $courseName,
            ':lecturerName' => $lecturerName,
            ':date' => $date,
            ':type' => $type,
            ':reason' => $reason,
            ':evidenceUrl' => $evidenceUrl,
            ':status' => $status,
            ':rejectionReason' => $rejectionReason,
            ':generatedLetter' => $generatedLetter,
            ':createdAt' => $createdAt
        ]);

        if ($stmt->rowCount() > 0) {
            $count++;
        }
    }

    echo json_encode([
        'status' => 'success',
        'message' => "Import Selesai. $count data berhasil ditambahkan. $errors baris dilewati/error."
    ]);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
