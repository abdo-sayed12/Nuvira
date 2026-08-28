import {
  Check,
  Clipboard,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Share2,
  Square,
  ThumbsDown,
  ThumbsUp,
  Volume2,
} from "lucide-react";

import { EmergencyCard } from "../EmergencyCard";
import type { useChat } from "../../hooks/useChat";
import type { useSpeech } from "../../hooks/useSpeech";
import type { ChatMessage } from "../../types/api";
import { formatSourceUrl, isArabic } from "../../utils/chatHelpers";

/* ================================================================
   MARKDOWN-LITE RENDERING
   ----------------------------------------------------------------
   Renders the lightweight markdown subset used by CARE360 answers:
   emoji-prefixed section headers, **bold**, "- " / "* " bullets,
   "1. " numbered lists, and blank-line spacing. This never uses
   dangerouslySetInnerHTML — every fragment is built from React
   elements, so there is no HTML-injection surface even though the
   text originates from the assistant.
   ================================================================ */

const renderFormattedMessage = (text: string) => {
  if (!text) return null;

  const lines = text.split("\n");

  const parseBold = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-teal-900 dark:text-teal-200">
            {part.slice(2, -2)}
          </strong>
        );
      }

      return part;
    });
  };

  return lines.map((line, idx) => {
    const trimmed = line.trim();

    const isHeader = /^[🩺💡🚩📋👨‍⚕️📚]/.test(trimmed);

    if (isHeader) {
      return (
        <div
          key={idx}
          className="font-extrabold text-base mt-4 mb-2 text-teal-700 dark:text-teal-400 flex items-center gap-2 border-b border-teal-100 dark:border-slate-800 pb-1.5"
        >
          {parseBold(line)}
        </div>
      );
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      return (
        <div
          key={idx}
          className="flex items-start gap-2 my-1.5 rtl:space-x-reverse pl-2 rtl:pr-2"
        >
          <span className="text-teal-500 font-bold mt-0.5">•</span>
          <span className="flex-1">{parseBold(trimmed.substring(2))}</span>
        </div>
      );
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);

      if (numMatch) {
        return (
          <div
            key={idx}
            className="flex items-start gap-2 my-1.5 rtl:space-x-reverse pl-2 rtl:pr-2"
          >
            <span className="font-bold text-teal-600 dark:text-teal-400 min-w-[20px]">
              {numMatch[1]}.
            </span>
            <span className="flex-1">{parseBold(numMatch[2])}</span>
          </div>
        );
      }
    }

    if (!trimmed) {
      return <div key={idx} className="h-1.5" />;
    }

    return (
      <p key={idx} className="my-1 leading-relaxed">
        {parseBold(line)}
      </p>
    );
  });
};

/* ================================================================
   MessageBubble
   ================================================================ */

interface MessageBubbleProps {
  message: ChatMessage;
  index: number;
  messages: ChatMessage[];
  chat: ReturnType<typeof useChat>;
  speech: ReturnType<typeof useSpeech>;
}

export function MessageBubble({
  message,
  index,
  messages,
  chat,
  speech,
}: MessageBubbleProps) {
  const {
    editingMessageId,
    setEditingMessageId,
    editDraft,
    setEditDraft,
    contextMenuId,
    setContextMenuId,
    copied,
    copy,
    handleShare,
    feedbacks,
    handleFeedback,
    send,
  } = chat;

  const { speakingId, toggleSpeech } = speech;

  return (
    <div
      className={`group animate-zipper flex flex-col ${
        message.role === "user"
          ? "ml-auto rtl:mr-auto rtl:ml-0 items-end max-w-2xl"
          : "max-w-3xl items-start"
      }`}
    >
      <div
        dir={isArabic(message.body) ? "rtl" : "ltr"}
        className={
          message.role === "user"
            ? "select-none relative rounded-3xl rounded-br-sm rtl:rounded-br-3xl rtl:rounded-bl-sm bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4 text-sm leading-relaxed text-white font-medium shadow-md shadow-teal-900/10 space-y-2 cursor-default"
            : "rounded-3xl rounded-bl-sm rtl:rounded-bl-3xl rtl:rounded-br-sm border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 px-6 py-6 text-sm leading-relaxed text-slate-800 dark:text-slate-100 shadow-sm"
        }
      >
        {message.reply && message.reply.risk_level === "urgent" && (
          <div className="mb-4">
            <EmergencyCard arabic={isArabic(message.body)} />
          </div>
        )}

        {/* EDIT */}

        {editingMessageId === message.id ? (
          <div className="w-full min-w-[250px] flex flex-col gap-3 font-sans">
            <textarea
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              className="w-full bg-white/20 dark:bg-black/20 text-white rounded-xl p-3 outline-none text-sm resize-none placeholder-white/50 border border-white/20"
              rows={3}
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingMessageId(null)}
                className="px-4 py-1.5 bg-black/10 hover:bg-black/20 rounded-lg text-xs font-bold transition"
              >
                إلغاء
              </button>

              <button
                onClick={() => {
                  setEditingMessageId(null);

                  const historyCut = messages.slice(0, index);
                  void send(editDraft, historyCut);
                }}
                className="px-4 py-1.5 bg-teal-800 hover:bg-teal-900 shadow-sm rounded-lg text-xs font-bold transition"
              >
                حفظ وإرسال
              </button>
            </div>
          </div>
        ) : (
          <div className="font-sans space-y-1.5">
            {message.role === "assistant" ? (
              renderFormattedMessage(message.body)
            ) : (
              <div className="whitespace-pre-wrap">{message.body}</div>
            )}
          </div>
        )}

        {/* SOURCES */}

        {message.reply && message.reply.sources.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              Verified Sources:
            </span>

            {message.reply.sources.map((s, idx) => (
              <a
                key={s.source_id}
                href={formatSourceUrl(s.title || s.topic || "health", idx)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-teal-50/80 dark:bg-slate-800 border border-teal-200/60 dark:border-slate-700 px-3.5 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 dark:hover:text-white transition shadow-2xs"
                title={s.title}
              >
                <span className="w-4 h-4 rounded-full bg-teal-200 dark:bg-teal-900 text-teal-900 dark:text-teal-100 flex items-center justify-center text-[10px] font-bold">
                  {idx + 1}
                </span>
                <span className="max-w-[160px] truncate">{s.title}</span>
                <ExternalLink size={12} className="opacity-70" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* USER CONTEXT MENU */}

      {message.role === "user" && !editingMessageId && (
        <div
          className={`mt-1 flex w-full px-2 ${
            isArabic(message.body) ? "justify-start" : "justify-end"
          }`}
        >
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();

                setContextMenuId(
                  contextMenuId === message.id ? null : message.id
                );
              }}
              className="p-1.5 text-slate-400 hover:text-teal-600 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all opacity-70 hover:opacity-100 shadow-sm cursor-pointer"
              title="خيارات الرسالة"
            >
              <MoreHorizontal size={18} />
            </button>

            {contextMenuId === message.id && (
              <div
                onClick={(e) => e.stopPropagation()}
                className={`absolute top-full mt-2 bg-white dark:bg-slate-800 shadow-2xl rounded-xl border border-slate-200 dark:border-slate-600 flex flex-col overflow-hidden z-[100] text-slate-800 dark:text-slate-200 text-sm min-w-[160px] animate-cube-in ${
                  isArabic(message.body) ? "left-0" : "right-0"
                }`}
              >
                <button
                  onClick={() => {
                    setContextMenuId(null);
                    setEditingMessageId(message.id);
                    setEditDraft(message.body);
                  }}
                  className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between gap-3 font-semibold transition"
                >
                  تعديل
                  <Pencil size={15} className="text-teal-600 dark:text-teal-400" />
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-700/60" />

                <button
                  onClick={() => {
                    void copy(message.id, message.body);
                    setContextMenuId(null);
                  }}
                  className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between gap-3 font-semibold transition"
                >
                  نسخ
                  <Clipboard size={15} className="text-teal-600 dark:text-teal-400" />
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-700/60" />

                <button
                  onClick={() => {
                    void handleShare(message.body);
                    setContextMenuId(null);
                  }}
                  className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between gap-3 font-semibold transition"
                >
                  مشاركة
                  <Share2 size={15} className="text-teal-600 dark:text-teal-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ASSISTANT TOOLBAR */}

      {message.role === "assistant" && index > 0 && (
        <div className="mt-2.5 flex items-center gap-1.5 rtl:flex-row-reverse bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl px-2 py-1 shadow-2xs opacity-60 hover:opacity-100 transition-opacity">
          {/* COPY */}

          <button
            onClick={() => void copy(message.id, message.body)}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 transition"
            title="Copy"
          >
            {copied === message.id ? (
              <Check size={15} className="text-emerald-600" />
            ) : (
              <Clipboard size={15} />
            )}
          </button>

          {/* SPEECH */}

          <button
            onClick={() => void toggleSpeech(message.id, message.body)}
            className={`rounded-xl p-1.5 transition ${
              speakingId === message.id
                ? "text-red-500 bg-red-50 dark:bg-red-900/20"
                : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400"
            }`}
            title={speakingId === message.id ? "Stop Reading" : "Read aloud"}
          >
            {speakingId === message.id ? (
              <Square size={15} fill="currentColor" />
            ) : (
              <Volume2 size={15} />
            )}
          </button>

          {/* RETRY */}

          <button
            onClick={() => {
              const previous = messages[index - 1];

              if (previous?.role === "user") {
                void send(previous.body, messages.slice(0, index - 1));
              }
            }}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 transition"
            title="Retry"
          >
            <RotateCcw size={15} />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-0.5" />

          {/* LIKE */}

          <button
            onClick={() => void handleFeedback(message.id, "up")}
            className={`rounded-xl p-1.5 transition ${
              feedbacks[message.id] === "up"
                ? "text-teal-600 bg-teal-50 dark:bg-teal-900/30"
                : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400"
            }`}
            title="Helpful"
          >
            <ThumbsUp
              size={15}
              className={feedbacks[message.id] === "up" ? "fill-teal-600 dark:fill-teal-500" : ""}
            />
          </button>

          {/* DISLIKE */}

          <button
            onClick={() => void handleFeedback(message.id, "down")}
            className={`rounded-xl p-1.5 transition ${
              feedbacks[message.id] === "down"
                ? "text-red-600 bg-red-50 dark:bg-red-900/30"
                : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400"
            }`}
            title="Not helpful"
          >
            <ThumbsDown
              size={15}
              className={feedbacks[message.id] === "down" ? "fill-red-600 dark:fill-red-500" : ""}
            />
          </button>
        </div>
      )}
    </div>
  );
}
