export enum LeaveType {
  SICK = 'Sakit',
  FAMILY = 'Acara Keluarga',
  COMPETITION = 'Lomba/Dispensasi',
  OTHER = 'Lainnya'
}

export enum RequestStatus {
  PENDING = 'Menunggu',
  APPROVED = 'Disetujui',
  REJECTED = 'Ditolak'
}

export interface LeaveRequest {
  id: string;
  studentName: string;
  studentId: string; // NIM
  studentClass: string; // Kelas
  courseName: string;
  lecturerName: string;
  date: string;
  type: LeaveType;
  reason: string;
  evidenceBase64?: string; // Optional karena lazy load
  hasEvidence?: boolean; // Flag untuk UI
  generatedLetter?: string;
  status: RequestStatus;
  rejectionReason?: string; // Alasan penolakan dari admin
  createdAt: number;
}

export interface ComplaintRequest {
  id: string;
  studentName: string;
  studentId: string;
  studentClass: string; // Kelas
  category: 'Fasilitas' | 'Akademik' | 'Pelayanan' | 'Lainnya';
  description: string;
  adminNote?: string; // Catatan penanganan dari admin
  createdAt: number;
}