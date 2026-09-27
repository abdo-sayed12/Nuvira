import { useEffect, useRef } from "react";
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

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0 && messages[messages.length - 1].role === "user") {
      messagesContainerRef.current.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length]);

  return (
    <main className="w-full" style={{ height: "calc(100vh - 88px)", maxHeight: "calc(100vh - 88px)", overflow: "hidden" }}>
      <div className="flex h-full animate-cube-in">
        <ChatSidebar chat={chat} />

        <section 
          className="flex min-w-0 flex-1 flex-col transition-colors duration-300 relative"
          style={{
            background: "rgba(10, 16, 28, 0.42)",
            backdropFilter: "blur(22px)",
            WebkitBackdropFilter: "blur(22px)",
            borderLeft: "1px solid rgba(6, 182, 212, 0.18)",
            overflow: "hidden",
            boxShadow: "inset 1px 0 0 rgba(255,255,255,0.05)"
          }}
        >
          {/* HEADER */}

          <header className="flex items-center justify-between border-b border-white/5 bg-transparent px-6 py-4 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button
                className="rounded-xl p-2.5 hover:bg-white/10 text-teal-400 lg:hidden transition"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <PanelLeft size={20} />
              </button>

              <div>
                <h1 className="font-black text-xl tracking-tight bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent flex items-center gap-2">
                  <Sparkles size={20} className="text-teal-400 animate-pulse" />
                  {t.welcomeTitle}
                </h1>

                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  {t.welcomeSub}
                </p>
              </div>
            </div>
          </header>

          {/* MESSAGES */}

          <div 
            id="messages-container"
            ref={messagesContainerRef}
            className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-8 custom-scrollbar relative"
            style={{ overscrollBehavior: "contain", scrollBehavior: "smooth" }}
          >
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
              <div className="w-[98%] max-w-3xl rounded-3xl rounded-bl-sm rtl:rounded-bl-3xl rtl:rounded-br-sm border border-emerald-500/30 bg-gradient-to-r from-[#0a101c]/90 to-[#0a101c]/60 backdrop-blur-xl px-6 py-5 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-zipper relative overflow-hidden flex flex-col justify-center gap-3">
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-violet-500/10 animate-pulse" />
                <div className="flex items-center gap-3">
                   <div className="flex items-center justify-center relative w-8 h-8">
                     <div className="absolute inset-0 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
                     <div className="absolute inset-1 rounded-full border-2 border-cyan-400/30 border-b-cyan-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                   </div>
                   <span className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 animate-pulse">
                     Nuvira is analyzing...
                   </span>
                </div>
                <div className="flex items-center gap-1 h-3 pl-11 rtl:pr-11 rtl:pl-0">
                  <div className="h-full w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <div className="h-3/4 w-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:100ms]" />
                  <div className="h-full w-1 bg-violet-400 rounded-full animate-bounce [animation-delay:200ms]" />
                  <div className="h-1/2 w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  <div className="h-5/6 w-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:400ms]" />
                </div>
              </div>
            )}

            {/* ERROR */}

            {error && (
              <div className="rounded-2xl border border-red-900/50 bg-red-900/20 p-4 text-sm text-red-300 animate-cube-in">
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
