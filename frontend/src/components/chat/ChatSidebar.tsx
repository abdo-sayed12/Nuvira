import { MessageCirclePlus, Trash2 } from "lucide-react";

import type { useChat } from "../../hooks/useChat";

/* ================================================================
   ChatSidebar
   ----------------------------------------------------------------
   Pure presentation: the "New conversation" button plus the list
   of saved sessions (title, active-state highlight, delete). All
   state and persistence live in `useChat`.
   ================================================================ */

interface ChatSidebarProps {
  chat: ReturnType<typeof useChat>;
}

export function ChatSidebar({ chat }: ChatSidebarProps) {
  const {
    sessions,
    currentSessionId,
    sidebarOpen,
    newConversation,
    loadSession,
    deleteSession,
    t,
  } = chat;

  return (
    <aside
      className={`${
        sidebarOpen
          ? "absolute inset-y-0 left-0 z-30 flex animate-zipper"
          : "hidden"
      } w-80 shrink-0 flex-col border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-5 lg:static lg:flex shadow-xl lg:shadow-none rtl:border-r-0 rtl:border-l`}
    >
      <button
        onClick={newConversation}
        className="button-primary w-full flex justify-center items-center gap-2 py-3.5 shadow-md rounded-2xl"
      >
        <MessageCirclePlus size={18} />
        {t.newChat}
      </button>

      <div className="mt-6 flex-1 overflow-y-auto custom-scrollbar">
        <p className="px-2 text-xs font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-3">
          {t.thisSession}
        </p>

        <div className="space-y-1.5">
          {sessions.length ? (
            sessions.map((item) => (
              <div key={item.id} className="group relative flex items-center">
                <button
                  onClick={() => loadSession(item)}
                  className={`block w-full truncate rounded-2xl px-4 py-3 text-left rtl:text-right text-sm font-medium transition pr-9 ${
                    currentSessionId === item.id
                      ? "bg-teal-500 text-white shadow-md shadow-teal-500/20 font-bold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
                  }`}
                >
                  {item.title}
                </button>

                <button
                  onClick={(e) => deleteSession(e, item.id)}
                  className="absolute right-3 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition p-1"
                  title="Delete Chat"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          ) : (
            <p className="px-2 py-4 text-sm text-slate-400 dark:text-slate-500 text-center italic">
              لا توجد محادثات سابقة
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
