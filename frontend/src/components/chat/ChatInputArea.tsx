import { CornerDownLeft, Mic, Send, Square } from "lucide-react";

import type { useChat } from "../../hooks/useChat";
import type { useSpeech } from "../../hooks/useSpeech";

/* ================================================================
   ChatInputArea
   ----------------------------------------------------------------
   The quick-prompt chips, the textarea (with dictation-aware
   input/keydown handlers from useSpeech), the microphone toggle,
   and the send/stop-generating button.
   ================================================================ */

interface ChatInputAreaProps {
  chat: ReturnType<typeof useChat>;
  speech: ReturnType<typeof useSpeech>;
}

export function ChatInputArea({ chat, speech }: ChatInputAreaProps) {
  const { draft, loading, submit, send, stopGenerating, t } = chat;
  const { isListening, toggleListening, handleInput, handleKeyDown } = speech;

  return (
    <div className="border-t border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl p-4 sm:p-6 transition-colors duration-300">
      <div className="mb-3 flex flex-wrap gap-2">
        {t.prompts.map((prompt: string) => (
          <button
            key={prompt}
            onClick={() => void send(prompt)}
            className="rounded-full border border-teal-200/60 dark:border-slate-700 bg-teal-50/50 dark:bg-slate-800/80 px-4 py-1.5 text-xs font-bold text-teal-900 dark:text-teal-300 transition hover:bg-teal-100 hover:border-teal-300"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form
        onSubmit={submit}
        className="flex items-end gap-3 rounded-3xl border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 shadow-sm transition-all focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10"
      >
        {/* MICROPHONE */}

        <button
          type="button"
          onClick={toggleListening}
          className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${
            isListening
              ? "bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.7)] scale-105"
              : "bg-teal-50 dark:bg-slate-800 text-teal-600 dark:text-teal-400 hover:bg-teal-100 hover:scale-105 active:scale-95"
          }`}
          title={isListening ? "Stop Recording" : "Use Microphone"}
        >
          {isListening && (
            <span className="absolute inset-0 rounded-2xl bg-red-400 animate-ping opacity-30 pointer-events-none" />
          )}

          {isListening ? (
            <Square fill="currentColor" size={16} className="relative z-10 animate-bounce" />
          ) : (
            <Mic size={19} className="relative z-10" />
          )}
        </button>

        {/* TEXTAREA */}

        <textarea
          rows={2}
          value={draft}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? t.listening : t.placeholder}
          className="min-h-12 flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400 font-sans"
          maxLength={4000}
          dir="auto"
        />

        {/* SEND / STOP */}

        {loading ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              stopGenerating();
            }}
            className="button-primary bg-red-500 hover:bg-red-600 border-red-500 dark:border-red-600 h-12 w-12 rounded-2xl p-0 shrink-0 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            aria-label="Stop Generating"
          >
            <Square size={16} fill="currentColor" />
          </button>
        ) : (
          <button
            disabled={!draft.trim() || loading}
            className="button-primary h-12 w-12 rounded-2xl p-0 shrink-0 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            aria-label="Send question"
          >
            <Send size={18} className="rtl:-scale-x-100" />
          </button>
        )}
      </form>

      <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
        <CornerDownLeft size={13} className="text-teal-600 dark:text-teal-400 rtl:-scale-x-100" />
        {t.pressEnter}
      </p>
    </div>
  );
}
