export type RiskLevel = "normal" | "caution" | "urgent";

export interface Source {
  source_id: string;
  title: string;
  organization: string;
  url: string;
  topic: string;
  language: string;
  source_type: string;
  publication_date?: string | null;
  ingestion_timestamp?: string | null;
  content_hash?: string | null;
  relevance?: number | null;
  status: "manifested" | "indexed";
}

export interface ChatReply {
  conversation_id: string;
  answer: string;
  risk_level?: RiskLevel;
  sources: Source[];
  retrieval?: {
    chunks_used: number;
    generation_mode:
      | "groq"
      | "grounded_fallback"
      | "safety";
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  body: string;
  reply?: ChatReply;
}

const API_BASE =
  (import.meta as any).env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000/api";

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(
    `${API_BASE}${path}`,
    {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    }
  );

  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({}));

    throw new Error(
      body.detail ||
        `Request failed (${response.status})`
    );
  }

  return response.json() as Promise<T>;
}

export const api = {
  chat: (
    message: string,
    conversation_id?: string
  ) =>
    request<ChatReply>("/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        conversation_id,
      }),
    }),

  sources: () =>
    request<Source[]>("/sources"),

  transcribe: async (
    audioBlob: Blob
  ) => {
    const formData = new FormData();

    formData.append(
      "file",
      audioBlob,
      "voice_input.webm"
    );

    const response = await fetch(
      `${API_BASE}/transcribe`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const err = await response
        .json()
        .catch(() => ({}));

      throw new Error(
        err.detail ||
          "Transcription failed"
      );
    }

    return response.json() as Promise<{
      text: string;
    }>;
  },

  async upload(
    file: File,
    onProgress: (
      percentage: number
    ) => void
  ): Promise<{
    document_id: string;
  }> {
    return new Promise(
      (resolve, reject) => {
        const xhr =
          new XMLHttpRequest();

        xhr.open(
          "POST",
          `${API_BASE}/documents/upload`
        );

        xhr.upload.onprogress =
          (event) => {
            if (
              event.lengthComputable
            ) {
              onProgress(
                Math.round(
                  (event.loaded /
                    event.total) *
                    100
                )
              );
            }
          };

        xhr.onerror = () =>
          reject(
            new Error(
              "Network error while uploading"
            )
          );

        xhr.onload = () => {
          try {
            const body =
              JSON.parse(
                xhr.responseText
              ) as {
                document_id?: string;
                detail?: string;
              };

            if (
              xhr.status >= 200 &&
              xhr.status < 300 &&
              body.document_id
            ) {
              resolve({
                document_id:
                  body.document_id,
              });
            } else {
              reject(
                new Error(
                  body.detail ||
                    "Upload failed"
                )
              );
            }
          } catch {
            reject(
              new Error(
                "Upload failed"
              )
            );
          }
        };

        const data =
          new FormData();

        data.append(
          "file",
          file
        );

        xhr.send(data);
      }
    );
  },

  ingest: (
    document_ids: string[]
  ) =>
    request<{
      chunks_upserted: number;
    }>("/documents/ingest", {
      method: "POST",
      body: JSON.stringify({
        document_ids,
      }),
    }),

  submitFeedback: (
    message_id: string,
    feedback: "up" | "down"
  ) =>
    request<{
      success: boolean;
    }>("/feedback", {
      method: "POST",
      body: JSON.stringify({
        message_id,
        feedback,
      }),
    }),
};