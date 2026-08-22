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
  risk_level: RiskLevel;
  sources: Source[];
  retrieval: { chunks_used: number; generation_mode: "groq" | "grounded_fallback" | "safety" };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  body: string;
  reply?: ChatReply;
}

