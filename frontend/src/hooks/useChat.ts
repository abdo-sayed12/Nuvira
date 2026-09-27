import { useEffect, useRef, useState } from "react";

import { api } from "../lib/api";
import type { ChatMessage } from "../types/api";
import { translations } from "../utils/chatHelpers";

/* ================================================================
   useChat
   ----------------------------------------------------------------
   Owns all chat state: the active message list, the session
   history sidebar (persisted to localStorage), sending/cancelling
   requests, per-message feedback, copy/share, and the in-place
   message editor.

   This hook knows nothing about the Web Speech API — TTS and
   microphone concerns live in `useSpeech.ts`. The `ChatPage`
   orchestrator wires the two together (e.g. resetting speech when
   a new conversation starts via `onSessionChange`).
   ================================================================ */

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  conversationId?: string;
}

const SESSIONS_STORAGE_KEY = "nuvira_chat_sessions";

interface UseChatParams {
  initialPrompt?: string;
  /**
   * Invoked whenever the active session is switched — starting a
   * new conversation, loading a saved one, or deleting the active
   * one (which internally starts a new conversation). Used by the
   * orchestrator to stop any in-progress speech synthesis /
   * recognition, without useChat needing to know Web Speech exists.
   */
  onSessionChange?: () => void;
}

export function useChat({ initialPrompt, onSessionChange }: UseChatParams) {
  const [lang, setLang] = useState(document.documentElement.lang || "en");

  const [feedbacks, setFeedbacks] = useState<Record<string, "up" | "down">>(
    {}
  );

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() =>
    crypto.randomUUID()
  );

  const [messages, setMessages] = useState<ChatMessage[]>(
    initialPrompt
      ? [
          {
            id: "welcome",
            role: "assistant",
            body: "Welcome to Nuvira. I can share general health information grounded in the sources shown below each answer.",
            isNewlyGenerated: false,
          },
        ]
      : [
          {
            id: "welcome",
            role: "assistant",
            body: "Welcome to Nuvira. Ask a health-information question. I will show the evidence I use.",
            isNewlyGenerated: false,
          },
        ]
  );

  const [draft, setDraft] = useState(initialPrompt ?? "");
  const [conversationId, setConversationId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState<string>();

  // Editing & Context Menu
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(
    null
  );
  const [editDraft, setEditDraft] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);

  /* ==============================================================
     CLOSE CONTEXT MENU
     ============================================================== */

  useEffect(() => {
    const handleClickOutside = () => setContextMenuId(null);

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  /* ==============================================================
     SAVE CHAT SESSIONS
     ============================================================== */

  useEffect(() => {
    if (messages.length > 1) {
      const firstUserMsg =
        messages.find((m) => m.role === "user")?.body || "New Conversation";

      const title =
        firstUserMsg.length > 28
          ? firstUserMsg.substring(0, 28) + "..."
          : firstUserMsg;

      setSessions((prev) => {
        const index = prev.findIndex((s) => s.id === currentSessionId);

        let updated;

        if (index >= 0) {
          updated = [...prev];
          updated[index] = {
            id: currentSessionId,
            title,
            messages,
            conversationId,
          };
        } else {
          updated = [
            { id: currentSessionId, title, messages, conversationId },
            ...prev,
          ];
        }

        try {
          localStorage.setItem(
            SESSIONS_STORAGE_KEY,
            JSON.stringify(updated)
          );
        } catch (err) {
          console.error(err);
        }

        return updated;
      });
    }
  }, [messages, currentSessionId, conversationId]);

  /* ==============================================================
     LANGUAGE OBSERVER
     ============================================================== */

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setLang(document.documentElement.lang || "en")
    );

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });

    return () => observer.disconnect();
  }, []);

  const t = translations[lang] || translations.en;

  /* ==============================================================
     SEND MESSAGE
     ============================================================== */

  async function send(value = draft, historyOverride?: typeof messages, fileBase64?: string) {
    const question = value.trim();

    if (!question && !fileBase64) return;
    if (loading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const queryText = question || "Attached document";

    setDraft("");
    setError(undefined);
    setLoading(true);

    const currentHistory = historyOverride || messages;

    const newUserMsg = {
      id: crypto.randomUUID(),
      role: "user" as const,
      body: queryText,
      timestamp: new Date().toISOString()
    };

    const nextMessages = [...currentHistory, newUserMsg];
    setMessages(nextMessages);

    // Extract history payload
    const historyPayload = currentHistory
      .filter(m => m.id !== "welcome")
      .map(m => ({
        role: m.role,
        content: m.body,
        timestamp: m.timestamp || new Date().toISOString()
      }));

    try {
      const reply = await api.chat(
        queryText, 
        conversationId, 
        historyPayload, 
        abortControllerRef.current.signal,
        fileBase64
      );

      setConversationId(reply.conversation_id);

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          body: reply.answer,
          reply,
          timestamp: new Date().toISOString(),
          isNewlyGenerated: true
        },
      ]);
    } catch (caught: any) {
      if (caught.name === "AbortError") {
        return; // Ignore aborted requests silently
      }
      setError(
        caught instanceof Error
          ? caught.message
          : "Error connecting to server."
      );
    } finally {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }

  /* ==============================================================
     STOP GENERATING
     ============================================================== */

  function stopGenerating() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
  }

  /* ==============================================================
     NEW CONVERSATION
     ============================================================== */

  function newConversation() {
    if (messages.length <= 1) return; // Prevent creating empty sessions if already empty
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);

    onSessionChange?.();

    setCurrentSessionId(crypto.randomUUID());

    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        body: "New conversation started. What would you like to learn about?",
        timestamp: new Date().toISOString(),
        isNewlyGenerated: false
      },
    ]);

    setConversationId(undefined);
    setError(undefined);
    setSidebarOpen(false);
  }

  /* ==============================================================
     LOAD SESSION
     ============================================================== */

  function loadSession(session: ChatSession) {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);

    onSessionChange?.();

    setCurrentSessionId(session.id);
    setMessages(session.messages.map(m => ({ ...m, isNewlyGenerated: false })));
    setConversationId(session.conversationId);
    setError(undefined);
    setSidebarOpen(false);
  }

  /* ==============================================================
     DELETE SESSION
     ============================================================== */

  function deleteSession(e: React.MouseEvent, id: string) {
    e.stopPropagation();

    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);

    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {}

    if (id === currentSessionId) {
      newConversation();
    }
  }

  /* ==============================================================
     FORM SUBMIT
     ============================================================== */

  function submit(event: React.FormEvent) {
    event.preventDefault();
    void send();
  }

  /* ==============================================================
     COPY
     ============================================================== */

  async function copy(id: string, text: string) {
    await navigator.clipboard?.writeText(text);

    setCopied(id);
    window.setTimeout(() => setCopied(undefined), 1800);
  }

  /* ==============================================================
     SHARE
     ============================================================== */

  async function handleShare(text: string) {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Nuvira Chat", text });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      await copy("share", text);
      alert("تم نسخ النص للحافظة");
    }
  }

  /* ==============================================================
     FEEDBACK
     ============================================================== */

  async function handleFeedback(id: string, type: "up" | "down") {
    setFeedbacks((prev) => ({ ...prev, [id]: type }));

    try {
      if ((api as any).submitFeedback) {
        await (api as any).submitFeedback(id, type);
      }
    } catch (err) {}
  }

  return {
    // language / translations
    lang,
    t,

    // messages & sending
    messages,
    setMessages,
    draft,
    setDraft,
    conversationId,
    loading,
    setLoading,
    error,
    setError,
    send,
    submit,
    stopGenerating,
    abortControllerRef,

    // sessions
    sessions,
    currentSessionId,
    sidebarOpen,
    setSidebarOpen,
    newConversation,
    loadSession,
    deleteSession,

    // per-message UI state
    copied,
    copy,
    handleShare,
    feedbacks,
    handleFeedback,
    contextMenuId,
    setContextMenuId,
    editingMessageId,
    setEditingMessageId,
    editDraft,
    setEditDraft,
  };
}
