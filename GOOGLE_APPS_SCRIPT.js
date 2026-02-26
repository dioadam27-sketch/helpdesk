/**
 * ==========================================
 * HELPDESK PDB - BACKEND V6.6 (With Complaint Notes)
 * ==========================================
 *
 * Folder Drive ID: 146UpB6l-XwptFo2oARfrlzgq5Za_Wyxy
 */

const SHEET_REQUESTS = "Requests";
const SHEET_COMPLAINTS = "Complaints";
const DRIVE_FOLDER_ID = "146UpB6l-XwptFo2oARfrlzgq5Za_Wyxy"; 

function doGet(e) {
  if (!e || !e.parameter) {
    return ContentService.createTextOutput("Status: Server Online. Akses via URL Web App.")
      .setMimeType(ContentService.MimeType.TEXT);
  }

  const action = e.parameter.action;
  
  try {
    if (action === 'readAll') {
      return response({
        requests: getRequestsLite(), 
        complaints: getComplaintsData()
      });
    }
    
    if (action === 'readEvidence') {
      const id = e.parameter.id;
      return response(getEvidenceById(id));
    }

    return response({status: 'error', message: 'Unknown action: ' + action});
  } catch (err) {
    return response({status: 'error', message: err.toString()});
  }
}

function doPost(e) {
  if (!e || !e.postData) {
    return response({status: 'error', message: 'No postData received.'});
  }

  const lock = LockService.getScriptLock();
  
  if (lock.tryLock(10000)) {
    try {
      const content = JSON.parse(e.postData.contents);
      const action = content.action;
      const data = content.data;

      if (action === 'create') return createRequest(data);
      if (action === 'upload') return uploadFile(data); // NEW ACTION
      if (action === 'createComplaint') return createComplaint(data);
      if (action === 'updateStatus') return updateStatus(content.id, content.status, content.rejectionReason);
      if (action === 'updateComplaint') return updateComplaint(content.id, content.adminNote);
      if (action === 'deleteComplaint') return deleteComplaint(content.id);
      if (action === 'deleteRequest') return deleteRequest(content.id);

      return response({status: 'error', message: 'Unknown action: ' + action});
    } catch (err) {
      return response({status: 'error', message: 'Server Error: ' + err.toString()});
    } finally {
      lock.releaseLock();
    }
  } else {
    return response({status: 'error', message: 'Server busy, please try again.'});
  }
}

// --- OPTIMIZED GETTERS ---

function getRequestsLite() {
  const sheet = getOrInsertSheet(SHEET_REQUESTS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const rows = data.slice(1);
  return rows.map(row => {
    // Column Index Mapping:
    // ID(0), Name(1), NIM(2), CLASS(3), Course(4), Lecturer(5), Date(6), Type(7), Reason(8), Evidence(9), Status(10), CreatedAt(11), Letter(12), RejectionReason(13)
    
    const evidenceRaw = String(row[9] || ""); 
    const isUrl = evidenceRaw.startsWith("http");

    return {
      id: row[0],
      studentName: row[1],
      studentId: row[2],
      studentClass: row[3], // Data Kelas
      courseName: row[4],
      lecturerName: row[5],
      date: row[6],
      type: row[7],
      reason: row[8],
      evidenceBase64: isUrl ? evidenceRaw : undefined, 
      hasEvidence: evidenceRaw ? true : false,
      status: row[10],
      createdAt: row[11],
      generatedLetter: row[12],
      rejectionReason: row[13] || ""
    };
  });
}

function getEvidenceById(id) {
  const sheet = getOrInsertSheet(SHEET_REQUESTS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
       return { 
         status: 'success', 
         evidenceBase64: data[i][9] 
       };
    }
  }
  return { status: 'error', message: 'Not found' };
}

function getComplaintsData() {
  const sheet = getOrInsertSheet(SHEET_COMPLAINTS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const rows = data.slice(1);
  return rows.map(row => ({
    // ID(0), Name(1), NIM(2), Class(3), Category(4), Desc(5), CreatedAt(6), AdminNote(7)
    id: row[0],
    studentName: row[1],
    studentId: row[2],
    studentClass: row[3], // Data Kelas
    category: row[4],
    description: row[5],
    createdAt: row[6],
    adminNote: row[7] || "" // Column H
  }));
}

// --- WRITE FUNCTIONS ---

function uploadFile(data) {
  try {
    if (!DRIVE_FOLDER_ID) throw new Error("Folder ID belum disetting");
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    
    // Parse Base64
    const parts = data.evidenceBase64.split(",");
    const contentType = parts[0].split(":")[1].split(";")[0]; 
    const base64Data = parts[1];
    
    const fileName = `${data.studentName}_${data.studentId}_${Date.now()}.jpg`;
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, fileName);
    
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileUrl = `https://drive.google.com/uc?export=view&id=${file.getId()}`;
    
    return response({status: 'success', url: fileUrl});
  } catch (e) {
    return response({status: 'error', message: e.toString()});
  }
}

function createRequest(data) {
  const sheet = getOrInsertSheet(SHEET_REQUESTS);
  let evidenceContent = "";

  if (data.evidenceBase64 && data.evidenceBase64.includes("base64,")) {
    try {
      if (!DRIVE_FOLDER_ID) throw new Error("Folder ID belum disetting");
      const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      const parts = data.evidenceBase64.split(",");
      const contentType = parts[0].split(":")[1].split(";")[0]; 
      const base64Data = parts[1];
      const fileName = `${data.studentName}_${data.studentId}_${Date.now()}.jpg`;
      const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, fileName);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      evidenceContent = `https://drive.google.com/uc?export=view&id=${file.getId()}`;
    } catch (e) {
      evidenceContent = "ERROR_UPLOAD: " + e.toString();
    }
  } else {
    evidenceContent = data.evidenceBase64 || "";
  }

  const safeDate = data.date ? "'" + data.date : "";

  sheet.appendRow([
    data.id,
    data.studentName,
    data.studentId,
    data.studentClass,
    data.courseName,
    data.lecturerName,
    safeDate,
    data.type,
    data.reason,
    evidenceContent,
    data.status,
    data.createdAt,
    data.generatedLetter,
    "" // Placeholder for Rejection Reason
  ]);
  
  return response({status: 'success'});
}

function createComplaint(data) {
  const sheet = getOrInsertSheet(SHEET_COMPLAINTS);
  sheet.appendRow([
    data.id,
    data.studentName,
    data.studentId,
    data.studentClass,
    data.category,
    data.description,
    data.createdAt,
    "" // Placeholder for Admin Note
  ]);
  return response({status: 'success'});
}

function updateStatus(id, newStatus, rejectionReason) {
  const sheet = getOrInsertSheet(SHEET_REQUESTS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      // Update Status (Col 11 / Index 10)
      sheet.getRange(i + 1, 11).setValue(newStatus);
      
      // Update Rejection Reason (Col 14 / Index 13) if provided
      if (rejectionReason) {
        sheet.getRange(i + 1, 14).setValue(rejectionReason);
      }
      return response({status: 'success'});
    }
  }
  
  return response({status: 'error', message: 'ID not found'});
}

function updateComplaint(id, note) {
  const sheet = getOrInsertSheet(SHEET_COMPLAINTS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      // Update Admin Note (Col 8 / Index 7) -> Column H
      sheet.getRange(i + 1, 8).setValue(note);
      return response({status: 'success'});
    }
  }
  
  return response({status: 'error', message: 'ID not found'});
}

function deleteComplaint(id) {
  const sheet = getOrInsertSheet(SHEET_COMPLAINTS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return response({status: 'success'});
    }
  }

  return response({status: 'error', message: 'ID not found'});
}

function deleteRequest(id) {
  const sheet = getOrInsertSheet(SHEET_REQUESTS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return response({status: 'success'});
    }
  }

  return response({status: 'error', message: 'ID not found'});
}

// --- HELPER FUNCTIONS ---

function getOrInsertSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (sheetName === SHEET_REQUESTS) {
      // Added RejectionReason header
      sheet.appendRow(["ID", "StudentName", "StudentID", "Class", "Course", "Lecturer", "Date", "Type", "Reason", "Evidence", "Status", "CreatedAt", "GeneratedLetter", "RejectionReason"]);
    } else if (sheetName === SHEET_COMPLAINTS) {
      // Added AdminNote header
      sheet.appendRow(["ID", "StudentName", "StudentID", "Class", "Category", "Description", "CreatedAt", "AdminNote"]);
    }
  }
  return sheet;
}

function response(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}