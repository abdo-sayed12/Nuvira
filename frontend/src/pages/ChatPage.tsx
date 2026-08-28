import { useRef } from "react";
import { PanelLeft, Sparkles } from "lucide-react";

import { ChatInputArea } from "../components/chat/ChatInputArea";
import { ChatSidebar } from "../components/chat/ChatSidebar";
import { MessageBubble } from "../components/chat/MessageBubble";
import { useChat } from "../hooks/useChat";
import { useSpeech } from "../hooks/useSpeech";

/* ================================================================
   ChatPage
   ----------------------------------------------------------------
   Orchestrator only. All state and business logic live in
   `useChat` (messages, sessions, sending) and `useSpeech` (Web
   Speech API, TTS, mic handling). All markup lives in ChatSidebar,
   MessageBubble, and ChatInputArea. This file just wires them
   together and lays out the page shell.
   ================================================================ */

export function ChatPage({ initialPrompt }: { initialPrompt?: string }) {
  /*
   * useChat needs to be able to stop in-progress speech whenever a
   * session switches (new chat, loading history, or deleting the
   * active session) — but it must not know the Web Speech API
   * exists. A ref bridges the two hooks: useChat calls whatever
   * `onSessionChange` currently points to, and we keep that ref
   * pointed at `speech.resetSpeech` on every render. This covers
   * every call site inside useChat (including deleteSession's
   * internal call to newConversation), not just the ones wired up
   * directly in this component's JSX.
   */
  const resetSpeechRef = useRef<() => void>(() => {});

  const chat = useChat({
    initialPrompt,
    onSessionChange: () => resetSpeechRef.current(),
  });

  const speech = useSpeech({
    lang: chat.lang,
    draft: chat.draft,
    setDraft: chat.setDraft,
    setError: chat.setError,
    onSubmit: () => void chat.send(),
  });

  resetSpeechRef.current = speech.resetSpeech;

  const { messages, loading, error, sidebarOpen, setSidebarOpen, t } = chat;

  return (
    <main className="container-page py-6 sm:py-8">
      <div className="surface flex min-h-[calc(100dvh-9rem)] overflow-hidden animate-cube-in bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 transition-colors duration-300">
        <ChatSidebar chat={chat} />

        <section className="flex min-w-0 flex-1 flex-col bg-slate-50/30 dark:bg-slate-950 transition-colors duration-300">
          {/* HEADER */}

          <header className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-6 py-4 sticky top-0 z-20 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                className="rounded-xl p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-teal-600 dark:text-teal-400 lg:hidden transition"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <PanelLeft size={20} />
              </button>

              <div>
                <h1 className="font-black text-xl tracking-tight bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 dark:from-teal-400 dark:to-emerald-300 bg-clip-text text-transparent flex items-center gap-2">
                  <Sparkles size={20} className="text-teal-500 animate-pulse" />
                  {t.welcomeTitle}
                </h1>

                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.welcomeSub}
                </p>
              </div>
            </div>
          </header>

          {/* MESSAGES */}

          <div className="flex-1 space-y-6 overflow-y-auto p-5 pb-24 sm:p-8 sm:pb-8 custom-scrollbar relative">
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                index={index}
                messages={messages}
                chat={chat}
                speech={speech}
              />
            ))}

            {/* LOADING */}

            {loading && (
              <div className="max-w-xs rounded-3xl rounded-bl-sm border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 shadow-sm animate-zipper">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-teal-500" />
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-teal-500 [animation-delay:150ms]" />
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-teal-500 [animation-delay:300ms]" />
                  <span className="text-xs text-slate-400 font-medium ml-2">
                    CARE360 is thinking...
                  </span>
                </div>
              </div>
            )}

            {/* ERROR */}

            {error && (
              <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-300 animate-cube-in">
                {error}
              </div>
            )}
          </div>

          <ChatInputArea chat={chat} speech={speech} />
        </section>
      </div>
    </main>
  );
}
