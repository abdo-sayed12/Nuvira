import { MessageCirclePlus, Trash2, Pin } from "lucide-react";
import { useState, useEffect } from "react";
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

  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('nuvira_pinned_conversations') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('nuvira_pinned_conversations', JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  const togglePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPinnedIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    const aPinned = pinnedIds.includes(a.id);
    const bPinned = pinnedIds.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0; 
  });

  return (
    <aside
      className={`${
        sidebarOpen
          ? "absolute inset-y-0 left-0 z-30 flex animate-zipper"
          : "hidden"
      } w-80 shrink-0 flex-col p-5 lg:static lg:flex transition-all duration-300`}
      style={{
        height: "100%",
        width: "300px",
        background: "rgba(10, 16, 28, 0.42)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        overflow: "hidden"
      }}
    >
      <button
        onClick={newConversation}
        className="button-primary w-full flex justify-center items-center gap-2 py-3.5 shadow-md rounded-2xl shrink-0"
      >
        <MessageCirclePlus size={18} />
        {t.newChat}
      </button>

      <div 
        className="mt-6 flex-1 overflow-y-auto custom-scrollbar" 
        style={{ overscrollBehavior: "contain" }}
      >
        <p className="px-2 text-xs font-extrabold uppercase tracking-wider text-teal-400 mb-3">
          {t.thisSession}
        </p>

        <div className="space-y-1.5 pb-6">
          {sortedSessions.length ? (
            sortedSessions.map((item) => {
              const isPinned = pinnedIds.includes(item.id);
              const isActive = currentSessionId === item.id;
              
              return (
                <div key={item.id} className="group relative flex items-center">
                  <button
                    onClick={() => loadSession(item)}
                    className={`block w-full truncate rounded-2xl px-4 py-3 text-left rtl:text-right text-sm font-medium transition pr-16 border ${
                      isActive
                        ? "bg-teal-500/20 border-teal-400/40 text-teal-100 shadow-md shadow-teal-500/10 font-bold"
                        : "border-transparent text-slate-300 hover:bg-white/5 hover:border-white/10"
                    } ${isPinned && !isActive ? "border-emerald-500/30 bg-emerald-900/10 shadow-[0_0_15px_rgba(16,185,129,0.08)]" : ""}`}
                  >
                    {item.title}
                  </button>

                  <div className="absolute right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => togglePin(e, item.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isPinned ? "text-emerald-400 hover:text-emerald-300 bg-emerald-400/10" : "text-slate-400 hover:text-cyan-400 hover:bg-white/5"
                      }`}
                      title={isPinned ? "Unpin Chat" : "Pin Chat"}
                    >
                      <Pin size={14} className={isPinned ? "fill-emerald-400" : ""} />
                    </button>
                    <button
                      onClick={(e) => deleteSession(e, item.id)}
                      className="text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors p-1.5 rounded-lg"
                      title="Delete Chat"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  {isPinned && !isActive && (
                    <div className="absolute right-3 opacity-100 group-hover:opacity-0 transition-opacity pointer-events-none">
                      <Pin size={12} className="text-emerald-400/70 fill-emerald-400/70" />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="px-2 py-4 text-sm text-slate-500 text-center italic">
              لا توجد محادثات سابقة
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
