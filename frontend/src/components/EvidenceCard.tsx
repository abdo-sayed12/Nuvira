import { ExternalLink, ShieldCheck } from "lucide-react";
import type { Source } from "../types/api";

export function EvidenceCard({ source }: { source: Source }) {
  return <article className="rounded-xl border border-ocean-100 bg-ocean-50/50 p-3.5 text-sm">
    <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-1.5 text-xs font-bold text-ocean-700"><ShieldCheck size={14} /> Evidence source</div><h4 className="mt-1 font-semibold text-ink">{source.title}</h4><p className="mt-0.5 text-xs text-slate-600">{source.organization} · {source.topic.replaceAll("_", " ")}</p></div>{source.relevance !== undefined && source.relevance !== null && <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-ocean-700">{Math.round(source.relevance * 100)}%</span>}</div>
    <a href={source.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 font-semibold text-ocean-700 hover:text-ocean-600">Open official source <ExternalLink size={14} /></a>
  </article>;
}

