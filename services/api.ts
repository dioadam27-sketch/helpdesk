import { LeaveRequest, RequestStatus, ComplaintRequest } from '../types';

// URL Deployment Baru
const GAS_API_URL: string = 'https://script.google.com/macros/s/AKfycbwsD9AJH85jYnEcHsE_JujXeVLkrg8d5fL_Ztgrh6NtMQdqqu5-1Z-gdpAQN7xOpNZU/exec'; 
const PHP_API_URL: string = 'https://pkkii.pendidikan.unair.ac.id/helpdesk/api.php';

export const api = {
  isConfigured: (): boolean => {
    return PHP_API_URL !== '';
  },

  // --- FAST FETCHING ---
  
  // Expose local data getter for Instant UI Load
  getLocalData: () => {
    const req = localStorage.getItem('leaveRequests_lite');
    const comp = localStorage.getItem('complaints');
    return {
      requests: req ? JSON.parse(req) : [],
      complaints: comp ? JSON.parse(comp) : []
    };
  },
  
  fetchAll: async (): Promise<{ requests: LeaveRequest[], complaints: ComplaintRequest[] }> => {
    if (!api.isConfigured()) return api.getLocalData();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Fast 8s timeout for PHP

    try {
      // Call PHP API for fast text retrieval
      const response = await fetch(`${PHP_API_URL}?action=readAll`, { 
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'omit',
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      
      // Map PHP response to frontend types
      // PHP returns evidenceUrl in evidenceUrl column, we map it to evidenceBase64 or handle it in UI
      // But for compatibility, let's just ensure the structure matches
      
      const requests = Array.isArray(data.requests) ? data.requests.map((r: any) => ({
        ...r,
        evidenceBase64: r.evidenceUrl, // Map URL from DB to frontend prop
        hasEvidence: !!r.evidenceUrl
      })) : [];
      
      const complaints = Array.isArray(data.complaints) ? data.complaints : [];

      // Cache metadata only
      localStorage.setItem('leaveRequests_lite', JSON.stringify(requests));
      localStorage.setItem('complaints', JSON.stringify(complaints));

      return { requests, complaints };
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Fetch failed, using cache:", error);
      return api.getLocalData();
    }
  },

  // LAZY LOAD: Not needed anymore as URL is direct, but kept for compatibility if needed
  fetchEvidence: async (id: string): Promise<string | null> => {
     // With PHP/Drive URL, we don't need to fetch base64 anymore.
     // The URL is already in the request object.
     return null; 
  },

  // --- MIGRATION UTILS ---
  
  migrateData: async (): Promise<{ success: boolean, message: string }> => {
    try {
      // Call Server-Side Migration Script (migrate.php)
      // This avoids CORS issues and is much faster
      const response = await fetch('https://pkkii.pendidikan.unair.ac.id/helpdesk/migrate.php', {
        method: 'GET',
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        return { success: true, message: result.message };
      } else {
        throw new Error(result.message || "Gagal migrasi data");
      }

    } catch (e: any) {
      return { success: false, message: e.message || "Terjadi kesalahan migrasi" };
    }
  },

  importCSV: async (): Promise<{ success: boolean, message: string }> => {
    try {
      const response = await fetch('https://pkkii.pendidikan.unair.ac.id/helpdesk/import_csv.php', {
        method: 'GET',
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        return { success: true, message: result.message };
      } else {
        throw new Error(result.message || "Gagal import CSV");
      }

    } catch (e: any) {
      return { success: false, message: e.message || "Terjadi kesalahan import CSV" };
    }
  },

  // --- OPTIMIZED UPLOAD (MAX 1MB) ---

  compressImage: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // 1. Cek ukuran file mentah dulu (Safety check agar browser tidak hang loading file 50MB)
      if (file.size > 20 * 1024 * 1024) {
        reject(new Error("File asli terlalu besar (>20MB). Harap gunakan gambar yang lebih kecil."));
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Resize ke max 800px lebar
          const scaleSize = MAX_WIDTH / img.width;
          
          // Jika gambar kecil, jangan di-resize (pakai ukuran asli), tapi kalau besar resize
          const width = (scaleSize < 1) ? MAX_WIDTH : img.width;
          const height = (scaleSize < 1) ? img.height * scaleSize : img.height;

          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // --- SMART COMPRESSION LOOP ---
          // Mulai dari kualitas 0.7, turunkan jika masih > 1MB
          let quality = 0.7;
          let compressedData = canvas.toDataURL('image/jpeg', quality);
          
          // Rumus estimasi ukuran base64 ke byte: (length * 3) / 4
          let sizeInBytes = (compressedData.length * 3) / 4;
          const MAX_SIZE_BYTES = 1024 * 1024; // 1 MB

          while (sizeInBytes > MAX_SIZE_BYTES && quality > 0.1) {
            quality -= 0.1;
            compressedData = canvas.toDataURL('image/jpeg', quality);
            sizeInBytes = (compressedData.length * 3) / 4;
          }

          // Final Check
          if (sizeInBytes > MAX_SIZE_BYTES) {
            reject(new Error(`Gagal mengompres gambar. Ukuran akhir (${(sizeInBytes / 1024 / 1024).toFixed(2)} MB) masih di atas batas 1 MB.`));
          } else {
            resolve(compressedData);
          }
        };
        img.onerror = (err) => reject(new Error("Gagal memuat gambar. File mungkin rusak."));
      };
      reader.onerror = (err) => reject(new Error("Gagal membaca file."));
    });
  },

  createRequest: async (request: LeaveRequest): Promise<boolean> => {
    // Simpan optimis di local
    const local = JSON.parse(localStorage.getItem('leaveRequests_lite') || '[]');
    const reqLite = { ...request, evidenceBase64: undefined, hasEvidence: true };
    localStorage.setItem('leaveRequests_lite', JSON.stringify([...local, reqLite]));

    if (!api.isConfigured()) return true;

    try {
      let finalEvidenceUrl = '';

      // 1. Upload Image to GAS (if exists)
      if (request.evidenceBase64 && request.evidenceBase64.startsWith('data:')) {
         const gasResponse = await fetch(GAS_API_URL, {
            method: 'POST',
            redirect: 'follow',
            credentials: 'omit',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
              action: 'upload', 
              data: {
                evidenceBase64: request.evidenceBase64,
                studentName: request.studentName,
                studentId: request.studentId
              }
            })
         });
         const gasResult = await gasResponse.json();
         if (gasResult.status === 'success') {
            finalEvidenceUrl = gasResult.url;
         } else {
            console.error("GAS Upload Failed:", gasResult);
            // Continue anyway, maybe without image
         }
      }

      // 2. Save Text Data to PHP
      const phpPayload = { ...request, evidenceBase64: finalEvidenceUrl }; // Send URL instead of base64
      
      const response = await fetch(PHP_API_URL, {
        method: 'POST',
        redirect: 'follow',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', data: phpPayload })
      });
      const result = await response.json();
      return result.status === 'success';
    } catch (error) { 
      console.error("Create Request Failed:", error);
      return false; 
    }
  },

  createComplaint: async (complaint: ComplaintRequest): Promise<boolean> => {
    const local = JSON.parse(localStorage.getItem('complaints') || '[]');
    localStorage.setItem('complaints', JSON.stringify([...local, complaint]));

    if (!api.isConfigured()) return true;

    try {
      const response = await fetch(PHP_API_URL, {
        method: 'POST',
        redirect: 'follow',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createComplaint', data: complaint })
      });
      const result = await response.json();
      return result.status === 'success';
    } catch (error) { return false; }
  },

  deleteComplaint: async (id: string): Promise<boolean> => {
    const local: ComplaintRequest[] = JSON.parse(localStorage.getItem('complaints') || '[]');
    const updated = local.filter(req => req.id !== id);
    localStorage.setItem('complaints', JSON.stringify(updated));

    if (!api.isConfigured()) return true;

    try {
      const response = await fetch(PHP_API_URL, {
        method: 'POST',
        redirect: 'follow',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteComplaint', id: id })
      });
      const result = await response.json();
      return result.status === 'success';
    } catch (error) { return false; }
  },

  deleteRequest: async (id: string): Promise<boolean> => {
    const local: LeaveRequest[] = JSON.parse(localStorage.getItem('leaveRequests_lite') || '[]');
    const updated = local.filter(req => req.id !== id);
    localStorage.setItem('leaveRequests_lite', JSON.stringify(updated));

    if (!api.isConfigured()) return true;

    try {
      const response = await fetch(PHP_API_URL, {
        method: 'POST',
        redirect: 'follow',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteRequest', id: id })
      });
      const result = await response.json();
      return result.status === 'success';
    } catch (error) { return false; }
  },

  updateStatus: async (id: string, status: RequestStatus, rejectionReason?: string): Promise<boolean> => {
    const local: LeaveRequest[] = JSON.parse(localStorage.getItem('leaveRequests_lite') || '[]');
    const updated = local.map(req => req.id === id ? { ...req, status, rejectionReason } : req);
    localStorage.setItem('leaveRequests_lite', JSON.stringify(updated));

    if (!api.isConfigured()) return true;

    try {
      const response = await fetch(PHP_API_URL, {
        method: 'POST',
        redirect: 'follow',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateStatus', id: id, status: status, rejectionReason: rejectionReason })
      });
      const result = await response.json();
      return result.status === 'success';
    } catch (error) { return false; }
  },

  updateComplaint: async (id: string, note: string): Promise<boolean> => {
    const local: ComplaintRequest[] = JSON.parse(localStorage.getItem('complaints') || '[]');
    const updated = local.map(comp => comp.id === id ? { ...comp, adminNote: note } : comp);
    localStorage.setItem('complaints', JSON.stringify(updated));

    if (!api.isConfigured()) return true;

    try {
      const response = await fetch(PHP_API_URL, {
        method: 'POST',
        redirect: 'follow',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateComplaint', id: id, adminNote: note })
      });
      const result = await response.json();
      return result.status === 'success';
    } catch (error) { return false; }
  }
};