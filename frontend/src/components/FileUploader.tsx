import { FileUp, LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";
import { api } from "../lib/api";

const allowed = [".pdf", ".docx", ".txt", ".md", ".csv", ".xlsx"];

export function FileUploader() {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<{ text: string; progress: number; error?: boolean } | null>(null);
  async function choose(file?: File) {
    if (!file) return;
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!allowed.includes(extension) || file.size > 20 * 1024 * 1024) { setState({ text: "Use PDF, DOCX, TXT, MD, CSV, or XLSX files up to 20 MB.", progress: 0, error: true }); return; }
    try {
      setState({ text: `Uploading ${file.name}`, progress: 0 });
      const upload = await api.upload(file, (progress) => setState({ text: `Uploading ${file.name}`, progress }));
      setState({ text: "Indexing trusted document…", progress: 100 });
      const result = await api.ingest([upload.document_id]);
      setState({ text: `Added to evidence index (${result.chunks_upserted} chunks).`, progress: 100 });
    } catch (error) { setState({ text: error instanceof Error ? error.message : "Upload failed", progress: 0, error: true }); }
  }
  return <div><input ref={input} className="hidden" type="file" accept={allowed.join(",")} onChange={(e) => void choose(e.target.files?.[0])} /><button className="button-secondary w-full" onClick={() => input.current?.click()}><FileUp size={17} /> Add a trusted document</button>{state && <div className={`mt-2 rounded-lg p-2.5 text-xs ${state.error ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-600"}`}><div className="flex items-center gap-2">{!state.error && state.progress < 100 && <LoaderCircle className="animate-spin" size={14} />}{state.text}</div>{!state.error && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-ocean-600 transition-all" style={{ width: `${state.progress}%` }} /></div>}</div>}</div>;
}
