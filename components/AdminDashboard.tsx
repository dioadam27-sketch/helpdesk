import React, { useState } from 'react';
import { LeaveRequest, RequestStatus, ComplaintRequest } from '../types';
import { Check, X, Eye, Loader2, RefreshCw, Trash2, AlertTriangle, AlertOctagon, FileImage, ExternalLink, ImageOff, MessageSquareX, MessageSquare, CheckCircle2, ArrowUpDown, Calendar, Download } from 'lucide-react';
import { api } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AdminDashboardProps {
  requests: LeaveRequest[];
  complaints?: ComplaintRequest[];
  onUpdateStatus: (id: string, status: RequestStatus, reason?: string) => void;
  onUpdateComplaint: (id: string, note: string) => void;
  onRefresh: () => void;
  onDeleteRequest: (id: string) => void;
  onDeleteComplaint: (id: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ requests, complaints = [], onUpdateStatus, onUpdateComplaint, onRefresh, onDeleteRequest, onDeleteComplaint }) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'complaints'>('requests');
  const [loadingProofId, setLoadingProofId] = useState<string | null>(null);
  const [viewingProof, setViewingProof] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false); 
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'request' | 'complaint' | null>(null);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Replaced modal state with inline target ID
  const [complaintTargetId, setComplaintTargetId] = useState<string | null>(null);
  const [complaintNote, setComplaintNote] = useState('');
  
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleExport = () => {
    const doc = new jsPDF();

    if (activeTab === 'requests') {
      const tableColumn = ["ID", "Tanggal", "Nama", "NIM", "Kelas", "Matkul", "Jenis", "Alasan", "Status"];
      const tableRows: any[] = [];

      requests.forEach(req => {
        const requestData = [
          req.id,
          new Date(Number(req.createdAt) || 0).toLocaleString('id-ID'),
          req.studentName,
          req.studentId,
          req.studentClass,
          req.courseName,
          req.type,
          req.reason,
          req.status
        ];
        tableRows.push(requestData);
      });

      doc.text("Laporan Izin Masuk", 14, 15);
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 59, 115] } // #003B73
      });
      doc.save(`Data_Izin_Masuk_${new Date().toISOString().split('T')[0]}.pdf`);

    } else {
      const tableColumn = ["ID", "Tanggal", "Nama", "NIM", "Kelas", "Kategori", "Deskripsi", "Tanggapan"];
      const tableRows: any[] = [];

      complaints.forEach(comp => {
        // Handle timestamp correctly - check if it's numeric (milliseconds) or string date
        let dateStr = '-';
        if (comp.createdAt) {
          const isNumeric = /^\d+$/.test(comp.createdAt);
          const date = new Date(isNumeric ? parseInt(comp.createdAt) : comp.createdAt);
          dateStr = date.toLocaleString('id-ID');
        }

        const complaintData = [
          comp.id,
          dateStr,
          comp.studentName,
          comp.studentId,
          comp.studentClass,
          comp.category,
          comp.description,
          comp.adminNote || '-'
        ];
        tableRows.push(complaintData);
      });

      doc.text("Laporan Komplain", 14, 15);
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [255, 199, 0], textColor: [0, 59, 115] } // #FFC700
      });
      doc.save(`Data_Komplain_${new Date().toISOString().split('T')[0]}.pdf`);
    }
  };

  const handleViewProof = async (req: LeaveRequest) => {
    setImgError(false);
    
    // If clicking the same proof, close it (toggle)
    if (viewingProof === req.evidenceBase64 || viewingProof === req.evidenceUrl) {
       setViewingProof(null);
       return;
    }

    if (req.evidenceBase64) {
      setViewingProof(req.evidenceBase64);
      return;
    }
    
    // If no base64 but has URL, try to fetch or use URL directly
    if (req.evidenceUrl) {
       // Try to use URL directly first if it's an image
       if (req.evidenceUrl.match(/\.(jpeg|jpg|gif|png)$/) != null) {
          setViewingProof(req.evidenceUrl);
          return;
       }
    }

    setLoadingProofId(req.id);
    const base64 = await api.fetchEvidence(req.id);
    setLoadingProofId(null);
    
    if (base64) {
       // Update the request object locally so we don't fetch again
       req.evidenceBase64 = base64;
       setViewingProof(base64);
    } else if (req.evidenceUrl) {
       // Fallback to URL if fetch fails
       setViewingProof(req.evidenceUrl);
    } else {
       alert("Gagal mengambil data gambar.");
    }
  };

  const requestDelete = (id: string, type: 'request' | 'complaint') => {
    setConfirmDeleteId(id);
    setDeleteType(type);
  }

  const executeDelete = () => {
    if (!confirmDeleteId || !deleteType) return;
    
    if (deleteType === 'complaint') {
      onDeleteComplaint(confirmDeleteId);
    } else {
      onDeleteRequest(confirmDeleteId);
    }
    
    setConfirmDeleteId(null);
    setDeleteType(null);
  }

  const openRejectModal = (id: string) => {
    setRejectTargetId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const submitRejection = () => {
    if (rejectTargetId) {
      onUpdateStatus(rejectTargetId, RequestStatus.REJECTED, rejectReason || "Tidak ada alasan spesifik.");
      setRejectModalOpen(false);
      setRejectTargetId(null);
    }
  };

  const toggleComplaintResponse = (id: string, currentNote?: string) => {
    if (complaintTargetId === id) {
      setComplaintTargetId(null);
      setComplaintNote('');
    } else {
      setComplaintTargetId(id);
      setComplaintNote(currentNote || '');
    }
  };

  const submitComplaintResponse = () => {
    if (complaintTargetId) {
      onUpdateComplaint(complaintTargetId, complaintNote);
      setComplaintTargetId(null);
      setComplaintNote('');
    }
  }

  const renderReasonText = (text: any) => {
    if (text === null || text === undefined || text === '') return <span className="text-slate-400 italic">-</span>;
    const textStr = String(text);
    const cleanText = textStr.replace(/^"|"$/g, '').trim();
    const isImageLike = cleanText.startsWith('data:image') || (cleanText.length > 200 && !cleanText.includes(' ')) || cleanText.includes('base64,');

    if (isImageLike) {
      return (
        <span className="flex items-center gap-2 text-slate-400 italic select-none">
          <FileImage className="w-3 h-3 text-[#003B73]" />
          <span className="text-[10px]">(Gambar terdeteksi di kolom teks)</span>
        </span>
      );
    }
    return `"${textStr}"`;
  };

  const getSortedRequests = () => {
    const sorted = [...requests];
    return sorted.sort((a, b) => {
      const dateA = new Date(Number(a.createdAt) || 0).getTime();
      const dateB = new Date(Number(b.createdAt) || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };

  const getSortedComplaints = () => {
    const sorted = [...complaints];
    return sorted.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };

  const formatDate = (timestamp: string) => {
    if (!timestamp) return '-';
    // Check if timestamp is numeric (milliseconds)
    const isNumeric = /^\d+$/.test(timestamp);
    const date = new Date(isNumeric ? parseInt(timestamp) : timestamp);
    
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
        <h2 className="text-xl font-extrabold text-[#003B73] uppercase tracking-wide">Administrator Console</h2>
        <div className="flex gap-2">
           <button 
             onClick={handleExport}
             className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-sm text-xs font-bold text-slate-600 transition-colors"
             title="Export Data ke CSV"
           >
             <Download className="w-3.5 h-3.5" />
             EXPORT
           </button>
           <button 
             onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
             className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-sm text-xs font-bold text-slate-600 transition-colors"
           >
             <ArrowUpDown className="w-3.5 h-3.5" />
             {sortOrder === 'newest' ? 'TERBARU' : 'TERLAMA'}
           </button>
           <button onClick={handleManualRefresh} className={`p-2 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-sm ${isRefreshing ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-4 h-4 text-[#003B73]" />
           </button>
        </div>
      </div>

      <div className="flex gap-2">
         <button onClick={() => setActiveTab('requests')} className={`flex-1 py-3 text-xs font-bold uppercase border-b-2 transition-colors ${activeTab === 'requests' ? 'border-[#003B73] text-[#003B73]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Izin Masuk</button>
         <button onClick={() => setActiveTab('complaints')} className={`flex-1 py-3 text-xs font-bold uppercase border-b-2 transition-colors ${activeTab === 'complaints' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Komplain</button>
      </div>

      {activeTab === 'requests' && (
        <div className="grid gap-4">
          {getSortedRequests().map((req) => (
             <div key={req.id} className="bg-white border border-slate-200 p-4 rounded-xl hover:border-[#003B73]/30 transition-all flex flex-col md:flex-row gap-4 shadow-sm">
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${req.status === RequestStatus.APPROVED ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : req.status === RequestStatus.REJECTED ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-amber-50 border-amber-200 text-amber-600'}`}>
                        {req.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{req.studentId} • {req.studentClass}</span>
                      <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                        <Calendar className="w-3 h-3" />
                        {formatDate(req.createdAt)}
                      </span>
                   </div>
                   <h3 className="text-slate-900 font-bold truncate text-base">{req.studentName}</h3>
                   <p className="text-xs text-slate-500 font-medium mt-1 truncate">{req.courseName} • {req.type}</p>
                   
                   <div className="text-xs text-slate-600 mt-2 p-2 bg-slate-50 rounded border border-slate-100 max-h-20 overflow-hidden text-ellipsis break-all">
                      {renderReasonText(req.reason)}
                   </div>

                   {/* Inline Delete Confirmation */}
                   {confirmDeleteId === req.id && deleteType === 'request' && (
                     <div className="mt-4 p-4 bg-rose-50 rounded-lg border border-rose-100 animate-slideDown">
                        <div className="flex flex-col items-center text-center space-y-3">
                           <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                              <AlertOctagon className="w-5 h-5" />
                              HAPUS DATA INI?
                           </div>
                           <p className="text-xs text-rose-500">Data yang dihapus tidak dapat dikembalikan lagi.</p>
                           <div className="flex gap-3 w-full max-w-xs pt-1">
                              <button 
                                 onClick={() => { setConfirmDeleteId(null); setDeleteType(null); }}
                                 className="flex-1 py-2 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold rounded border border-slate-200 transition-colors"
                              >
                                 BATAL
                              </button>
                              <button 
                                 onClick={executeDelete}
                                 className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
                              >
                                 YA, HAPUS
                              </button>
                           </div>
                        </div>
                     </div>
                   )}

                   {/* Inline Image Viewer */}
                   {viewingProof && (viewingProof === req.evidenceBase64 || viewingProof === req.evidenceUrl) && (
                     <div className="mt-4 p-4 bg-slate-100 rounded-lg border border-slate-200 animate-slideDown">
                        <div className="flex justify-between items-center mb-3 border-b border-slate-200 pb-2">
                           <h4 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                              <FileImage className="w-3 h-3 text-[#003B73]" /> BUKTI DOKUMEN
                           </h4>
                           <div className="flex gap-2">
                              {req.evidenceUrl && (
                                 <a href={req.evidenceUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-blue-500 hover:bg-blue-100 rounded" title="Buka di Tab Baru">
                                    <ExternalLink className="w-3 h-3" />
                                 </a>
                              )}
                              <button onClick={() => setViewingProof(null)} className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded">
                                 <X className="w-3 h-3" />
                              </button>
                           </div>
                        </div>
                        <div className="flex justify-center bg-white p-2 rounded border border-slate-200 min-h-[150px]">
                           {imgError ? (
                              <div className="text-center py-8">
                                 <ImageOff className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                 <p className="text-slate-400 text-xs">Gagal memuat gambar.</p>
                                 {req.evidenceUrl && (
                                    <a href={req.evidenceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[10px] font-bold text-blue-600 hover:underline">
                                       Buka Link Asli
                                    </a>
                                 )}
                              </div>
                           ) : (
                              <img 
                                 src={viewingProof} 
                                 className="max-w-full max-h-[400px] object-contain rounded" 
                                 onError={() => setImgError(true)}
                              />
                           )}
                        </div>
                     </div>
                   )}

                   {req.status === RequestStatus.REJECTED && req.rejectionReason && (
                     <div className="mt-2 flex items-start gap-2 bg-rose-50 border border-rose-100 p-2 rounded">
                        <MessageSquareX className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-rose-600 italic font-medium">
                          "{req.rejectionReason}"
                        </p>
                     </div>
                   )}
                </div>

                <div className="flex flex-row md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4 min-w-[120px]">
                   <button 
                      onClick={() => handleViewProof(req)}
                      disabled={loadingProofId === req.id}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded text-xs font-bold"
                    >
                      {loadingProofId === req.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Eye className="w-3 h-3"/>}
                      BUKTI
                   </button>
                   
                   {req.status === RequestStatus.PENDING && (
                     <>
                        <button onClick={() => onUpdateStatus(req.id, RequestStatus.APPROVED)} className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded text-xs font-bold">
                           <Check className="w-3 h-3" /> ACC
                        </button>
                        <button onClick={() => openRejectModal(req.id)} className="flex items-center justify-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded text-xs font-bold">
                           <X className="w-3 h-3" /> TOLAK
                        </button>
                     </>
                   )}

                   <button 
                      onClick={() => requestDelete(req.id, 'request')}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 border border-slate-200 hover:border-rose-200 rounded text-xs font-bold transition-colors"
                    >
                      <Trash2 className="w-3 h-3"/>
                      HAPUS
                   </button>
                </div>
             </div>
          ))}
        </div>
      )}

      {activeTab === 'complaints' && (
        <div className="grid gap-4">
           {getSortedComplaints().map((comp) => (
              <div key={comp.id} className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row gap-4 shadow-sm">
                 <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                       <AlertTriangle className="w-3 h-3 text-amber-500" />
                       <span className="text-xs font-bold text-amber-600">{comp.category}</span>
                       <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                         <Calendar className="w-3 h-3" />
                         {formatDate(comp.createdAt)}
                       </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium line-clamp-3">{comp.description}</p>
                    <p className="text-xs text-slate-400 mt-2">Oleh: {comp.studentName} ({comp.studentId} - {comp.studentClass})</p>

                     {comp.adminNote && (
                       <div className="mt-3 bg-[#003B73]/5 border border-[#003B73]/10 p-2.5 rounded flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#003B73] shrink-0 mt-0.5" />
                          <div className="flex flex-col">
                             <span className="text-[10px] text-[#003B73] font-bold uppercase mb-0.5">Tanggapan Admin</span>
                             <p className="text-xs text-slate-600">"{comp.adminNote}"</p>
                          </div>
                       </div>
                    )}

                    {/* Inline Complaint Response Form */}
                    {complaintTargetId === comp.id && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100 animate-slideDown">
                         <div className="flex flex-col space-y-3">
                            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm border-b border-blue-200 pb-2">
                               <MessageSquare className="w-4 h-4" />
                               TANGGAPAN ADMIN
                            </div>
                            
                            <textarea
                              className="w-full bg-white border border-blue-200 rounded-lg p-3 text-slate-800 text-sm focus:border-blue-400 outline-none min-h-[100px] resize-none placeholder:text-slate-400"
                              placeholder="Tulis tanggapan..."
                              value={complaintNote}
                              onChange={(e) => setComplaintNote(e.target.value)}
                              autoFocus
                            />

                            <div className="flex gap-3 pt-1">
                               <button 
                                  onClick={() => { setComplaintTargetId(null); setComplaintNote(''); }}
                                  className="flex-1 py-2 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold rounded border border-slate-200 transition-colors"
                               >
                                  BATAL
                               </button>
                               <button 
                                  onClick={submitComplaintResponse}
                                  className="flex-1 py-2 bg-[#003B73] hover:bg-[#004b91] text-white text-xs font-bold rounded shadow-sm transition-colors"
                               >
                                  SIMPAN
                               </button>
                            </div>
                         </div>
                      </div>
                    )}
                 </div>
                 
                 <div className="flex flex-row md:flex-col gap-2 justify-start md:justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4 min-w-[130px]">
                   <button 
                      onClick={() => toggleComplaintResponse(comp.id, comp.adminNote)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 border rounded text-xs font-bold transition-colors flex-1 md:flex-auto ${complaintTargetId === comp.id ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white hover:bg-blue-50 text-blue-600 border-blue-200'}`}
                    >
                      <MessageSquare className="w-3 h-3" />
                      {comp.adminNote ? 'EDIT' : 'TANGGAPI'}
                   </button>
                   
                   <button 
                     onClick={() => requestDelete(comp.id, 'complaint')}
                     className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 border border-slate-200 hover:border-rose-200 rounded text-xs font-bold transition-colors flex-1 md:flex-auto"
                   >
                     <Trash2 className="w-3 h-3"/>
                     HAPUS
                   </button>
                 </div>
              </div>
           ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 bg-rose-50 rounded-full flex items-center justify-center border border-rose-100">
                  <MessageSquareX className="w-4 h-4 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">TOLAK IZIN</h3>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-slate-500 font-bold">Alasan Penolakan</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 text-sm focus:border-rose-400 outline-none min-h-[100px] resize-none placeholder:text-slate-400"
                  placeholder="Contoh: Bukti tidak valid..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex gap-3 w-full pt-2">
                <button 
                  onClick={() => { setRejectModalOpen(false); setRejectTargetId(null); }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded transition-colors"
                >
                  BATAL
                </button>
                <button 
                  onClick={submitRejection}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
                >
                  KONFIRMASI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Response Modal - Removed in favor of inline accordion */}


      {/* Delete Confirmation */}
      {/* Removed old modal - now using inline accordion */}
    </div>
  );
};

export default AdminDashboard;