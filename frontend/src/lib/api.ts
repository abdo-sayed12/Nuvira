import type { ChatReply, Source } from "../types/api";

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  // 🚀 تم تحديث دالة الـ chat لاستقبال وإرسال ملفات الـ Base64 (صور أو مستندات) للباك إند
  chat: (message: string, conversation_id?: string, file_base64?: string) => 
    request<ChatReply>("/chat", { 
      method: "POST", 
      body: JSON.stringify({ message, conversation_id, file_base64 }) 
    }),
  
  sources: () => request<Source[]>("/sources"),
  
  async upload(file: File, onProgress: (percentage: number) => void): Promise<{ document_id: string }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/documents/upload`);
      xhr.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100)); };
      xhr.onerror = () => reject(new Error("Network error while uploading"));
      xhr.onload = () => {
        try {
          const body = JSON.parse(xhr.responseText) as { document_id?: string; detail?: string };
          if (xhr.status >= 200 && xhr.status < 300 && body.document_id) resolve({ document_id: body.document_id });
          else reject(new Error(body.detail || "Upload failed"));
        } catch { reject(new Error("Upload failed")); }
      };
      const data = new FormData();
      data.append("file", file);
      xhr.send(data);
    });
  },
  
  ingest: (document_ids: string[]) => request<{ chunks_upserted: number }>("/documents/ingest", { method: "POST", body: JSON.stringify({ document_ids }) }),

  submitFeedback: (message_id: string, feedback: "up" | "down") => 
    request<{ success: boolean }>("/feedback", { 
      method: "POST", 
      body: JSON.stringify({ message_id, feedback }) 
    }),
};