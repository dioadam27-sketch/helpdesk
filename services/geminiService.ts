import { GoogleGenAI, Type } from "@google/genai";
import { LeaveType } from "../types";

// Ensure API key is present
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-build' });

/**
 * Generates a formal leave letter/message based on student input.
 */
export const generateLeaveLetter = async (
  name: string,
  nim: string,
  course: string,
  lecturer: string,
  reason: string,
  type: LeaveType,
  date: string
): Promise<string> => {
  try {
    const prompt = `
      Buatkan pesan formal (untuk WhatsApp atau Email) dalam Bahasa Indonesia untuk dosen.
      Mahasiswa ini ingin meminta izin tidak hadir perkuliahan.
      
      Detail:
      - Nama Mahasiswa: ${name}
      - NIM: ${nim}
      - Mata Kuliah: ${course}
      - Nama Dosen: ${lecturer}
      - Tanggal Izin: ${date}
      - Kategori: ${type}
      - Alasan Spesifik: ${reason}

      Instruksi:
      - Gunakan bahasa yang sopan, formal, dan akademik.
      - Langsung berikan isi pesannya saja tanpa pembuka seperti "Berikut adalah draf pesan...".
      - Pastikan strukturnya: Salam pembuka, Perkenalan diri, Maksud izin, Penutup/Terima kasih.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster simple generation
      }
    });

    return response.text || "Maaf, gagal membuat surat izin.";
  } catch (error) {
    console.error("Error generating letter:", error);
    return "Terjadi kesalahan saat menghubungi AI. Silakan coba lagi.";
  }
};

/**
 * Analyzes an uploaded image (e.g., medical note) to extract key info.
 */
export const analyzeEvidence = async (base64Image: string): Promise<string> => {
  try {
    const prompt = `
      Analisis gambar ini. Ini kemungkinan adalah surat dokter, bukti tiket, atau surat undangan lomba.
      1. Apakah dokumen ini tampak valid/resmi?
      2. Ringkas informasi penting (Tanggal, Diagnosis/Keperluan).
      3. Jika sulit dibaca, katakan saja.
      
      Jawab dengan singkat dalam Bahasa Indonesia.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg/png handling in frontend
              data: base64Image
            }
          },
          {
            text: prompt
          }
        ]
      }
    });

    return response.text || "Tidak dapat menganalisis gambar.";
  } catch (error) {
    console.error("Error analyzing evidence:", error);
    return "Gagal menganalisis bukti. Pastikan gambar jelas.";
  }
};