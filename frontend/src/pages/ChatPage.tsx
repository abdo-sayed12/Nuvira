import { Check, Clipboard, CornerDownLeft, MessageCirclePlus, PanelLeft, RotateCcw, Send, ThumbsDown, ThumbsUp, Mic, ExternalLink, Volume2, Square, Trash2, Sparkles, Paperclip, X, FileText } from "lucide-react";
import { FormEvent, useMemo, useState, useRef, useEffect } from "react";
import { EmergencyCard } from "../components/EmergencyCard";
import { FileUploader } from "../components/FileUploader";
import { api } from "../lib/api";
import type { ChatMessage } from "../types/api";

const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

const getSmartMicLang = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const osLangs = navigator.languages || [navigator.language || 'en-US'];
    const middleEast = ['Africa/Cairo', 'Asia/Riyadh', 'Asia/Dubai', 'Asia/Amman', 'Asia/Baghdad', 'Asia/Damascus', 'Asia/Jerusalem'];
    if (middleEast.includes(tz) || osLangs.some(l => l.startsWith('ar'))) return 'ar-EG';
    return osLangs[0];
  } catch(e) { return 'ar-EG'; }
};

const detectMessageLanguage = (text: string, currentAppLang: string): string => {
  if (!text) return 'en-US';
  if (/[\u0600-\u06FF]/.test(text)) return 'ar-SA';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh-CN';
  if (/[\u3040-\u30ff]/.test(text)) return 'ja-JP';
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko-KR';
  if (/[\u0400-\u04FF]/.test(text)) return 'ru-RU';

  const lower = text.toLowerCase();
  if (/\b(le|la|les|un|une|et|est|vous|nous|que|pour|c'est|les|des)\b/.test(lower)) return 'fr-FR';
  if (/\b(der|die|das|und|ist|ein|eine|nicht|sie|ich|wir)\b/.test(lower)) return 'de-DE';
  if (/\b(el|la|los|las|un|una|y|es|por|para|con|los)\b/.test(lower)) return 'es-ES';
  if (/\b(il|la|i|le|un|una|e|è|per|con|sono|che)\b/.test(lower)) return 'it-IT';
  if (/\b(bir|ve|bu|da|de|için|ile|olarak|bu gün)\b/.test(lower)) return 'tr-TR';

  const map: Record<string, string> = {
    ar: 'ar-SA', en: 'en-US', fr: 'fr-FR', de: 'de-DE',
    es: 'es-ES', it: 'it-IT', ru: 'ru-RU', zh: 'zh-CN',
    ja: 'ja-JP', ko: 'ko-KR', tr: 'tr-TR'
  };
  return map[currentAppLang] || 'en-US';
};

const formatSourceUrl = (searchQuery: string, index: number) => {
  if (!searchQuery) return "#";
  const cleanQuery = searchQuery.split(" ").slice(0, 4).join(" ");
  const encodedQuery = encodeURIComponent(cleanQuery);
  const isAr = /[\u0600-\u06FF]/.test(searchQuery);

  if (isAr) {
    const arSites = [
      `https://www.who.int/ar/home/search?indexCatalogue=genericsearchindex1&searchQuery=${encodedQuery}`,
      `https://www.mayoclinic.org/ar/search/search-results?q=${encodedQuery}`,
      `https://altibbi.com/search?q=${encodedQuery}`,
      `https://www.webteb.com/search?q=${encodedQuery}`
    ];
    return arSites[index % arSites.length];
  } else {
    const enSites = [
      `https://www.who.int/home/search?indexCatalogue=genericsearchindex1&searchQuery=${encodedQuery}`,
      `https://www.mayoclinic.org/search/search-results?q=${encodedQuery}`,
      `https://vsearch.nlm.nih.gov/vivisimo/cgi-bin/query-meta?query=${encodedQuery}`,
      `https://my.clevelandclinic.org/search?q=${encodedQuery}`,
      `https://www.nhs.uk/search/results?q=${encodedQuery}`
    ];
    return enSites[index % enSites.length];
  }
};

const renderFormattedMessage = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');

  const parseBold = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-teal-900 dark:text-teal-200">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return lines.map((line, idx) => {
    const trimmed = line.trim();
    const isHeader = /^[🩺💡🚩📋👨‍⚕️📚]/.test(trimmed);

    if (isHeader) {
      return (
        <div key={idx} className="font-extrabold text-base mt-4 mb-2 text-teal-700 dark:text-teal-400 flex items-center gap-2 border-b border-teal-100 dark:border-slate-800 pb-1.5">
          {parseBold(line)}
        </div>
      );
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <div key={idx} className="flex items-start gap-2 my-1.5 rtl:space-x-reverse pl-2 rtl:pr-2">
          <span className="text-teal-500 font-bold mt-0.5">•</span>
          <span className="flex-1">{parseBold(trimmed.substring(2))}</span>
        </div>
      );
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1.5 rtl:space-x-reverse pl-2 rtl:pr-2">
            <span className="font-bold text-teal-600 dark:text-teal-400 min-w-[20px]">{numMatch[1]}.</span>
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

const translations: Record<string, any> = {
  en: { welcomeTitle: "Health Information Intelligence", welcomeSub: "Evidence-grounded · Verified clinical safety boundaries", newChat: "New conversation", thisSession: "Chat History", noRecent: "Your past conversations will appear here.", uploadNote: "Only upload authorized documents. Avoid personal records.", placeholder: "Ask a general health question or upload a file…", listening: "Listening now... Speak clearly!", pressEnter: "Press Enter for a new line; use Send when ready.", prompts: ["What are warning signs of a stroke?", "How does physical activity support health?", "General diet for diabetes?"] },
  ar: { welcomeTitle: "مركز الذكاء الصحي المتطور", welcomeSub: "مبني على الأدلة العلمية · معايير أمان سريري معتمدة", newChat: "محادثة جديدة", thisSession: "سجل المحادثات", noRecent: "محادثاتك السابقة ستظهر هنا.", uploadNote: "ارفع المستندات المصرح بها فقط. تجنب السجلات الشخصية.", placeholder: "اطرح سؤالاً صحياً أو ارفع ملفاً/تقريراً...", listening: "جاري الاستماع... تحدث بوضوح!", pressEnter: "اضغط Enter لسطر جديد. استخدم إرسال للبحث.", prompts: ["ما هي علامات السكتة الدماغية؟", "كيف تدعم الرياضة صحة القلب؟", "النظام الغذائي لمرضى السكري؟"] }
};

interface ChatSession {
  id: string;
  title: string;
  messages: (ChatMessage & { fileName?: string })[];
  conversationId?: string;
}

export function ChatPage({ initialPrompt }: { initialPrompt?: string }) {
  const [lang, setLang] = useState(document.documentElement.lang || 'en');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<Record<string, "up" | "down">>({});

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem("care360_chat_sessions");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => crypto.randomUUID());

  const [messages, setMessages] = useState<(ChatMessage & { fileName?: string })[]>(initialPrompt ? [{ id: "welcome", role: "assistant", body: "Welcome to CARE360. I can share general health information grounded in the sources shown below each answer." }] : [{ id: "welcome", role: "assistant", body: "Welcome to CARE360. Ask a health-information question. I will show the evidence I use." }]);
  const [draft, setDraft] = useState(initialPrompt ?? "");
  const [conversationId, setConversationId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState<string>();
  
  const [selectedFile, setSelectedFile] = useState<{ name: string; type: string; base64: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef("");
  const userEditedRef = useRef(false);

  useEffect(() => {
    if (messages.length > 1) {
      const firstUserMsg = messages.find(m => m.role === "user")?.body || "New Conversation";
      const title = firstUserMsg.length > 28 ? firstUserMsg.substring(0, 28) + "..." : firstUserMsg;

      setSessions(prev => {
        const index = prev.findIndex(s => s.id === currentSessionId);
        let updated;
        if (index >= 0) {
          updated = [...prev];
          updated[index] = { id: currentSessionId, title, messages, conversationId };
        } else {
          updated = [{ id: currentSessionId, title, messages, conversationId }, ...prev];
        }
        try {
          localStorage.setItem("care360_chat_sessions", JSON.stringify(updated));
        } catch (err) {
          console.error(err);
        }
        return updated;
      });
    }
  }, [messages, currentSessionId, conversationId]);

  useEffect(() => {
    const observer = new MutationObserver(() => setLang(document.documentElement.lang || 'en'));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    return () => {
      observer.disconnect();
      window.speechSynthesis.cancel();
    };
  }, []);
  
  const t = translations[lang] || translations.en;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        name: file.name,
        type: file.type,
        base64: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const toggleListening = () => {
    if (isListening) {
      userEditedRef.current = true;
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setError("Voice not supported."); return; }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = getSmartMicLang(); 
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onstart = () => {
      setIsListening(true);
      userEditedRef.current = false;
      baseTextRef.current = draft;
      if (baseTextRef.current.trim().length > 0 && !baseTextRef.current.endsWith(' ')) baseTextRef.current += ' ';
    };
    
    recognition.onresult = (event: any) => {
      if (userEditedRef.current) return;
      let interimTranscript = '', finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        else interimTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript) baseTextRef.current += finalTranscript + ' ';
      setDraft(baseTextRef.current + interimTranscript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    if (isListening && !userEditedRef.current) {
      userEditedRef.current = true;
      recognitionRef.current?.stop();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isListening && (e.key === "Backspace" || e.key === "Delete") && !userEditedRef.current) {
      userEditedRef.current = true;
      recognitionRef.current?.stop();
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isListening) { userEditedRef.current = true; recognitionRef.current?.stop(); }
      void send();
    }
  };

  async function send(value = draft) {
    const question = value.trim();
    if (!question && !selectedFile) return;
    if (loading) return;

    const queryText = question || (selectedFile ? `Analyze this file: ${selectedFile.name}` : "");
    const fileToSend = selectedFile;
    
    setDraft(""); 
    setSelectedFile(null);
    setError(undefined); 
    setLoading(true);

    // إضافة الملف المرفوع لرسالة المستخدم عشان يفضل ظاهر في الشات
    setMessages((current) => [...current, { 
      id: crypto.randomUUID(), 
      role: "user", 
      body: queryText, 
      fileName: fileToSend?.name 
    }]);

    try {
      const reply = await api.chat(queryText, conversationId);
      setConversationId(reply.conversation_id);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", body: reply.answer, reply }]);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Error connecting to server."); }
    finally { setLoading(false); }
  }

  function newConversation() {
    setCurrentSessionId(crypto.randomUUID());
    setMessages([{ id: crypto.randomUUID(), role: "assistant", body: "New conversation started. What would you like to learn about?" }]);
    setConversationId(undefined);
    setError(undefined);
    setSidebarOpen(false);
  }

  function loadSession(session: ChatSession) {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setConversationId(session.conversationId);
    setError(undefined);
    setSidebarOpen(false);
  }

  function deleteSession(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    try {
      localStorage.setItem("care360_chat_sessions", JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    if (id === currentSessionId) {
      newConversation();
    }
  }

  function submit(event: FormEvent) { event.preventDefault(); void send(); }
  async function copy(id: string, text: string) { await navigator.clipboard?.writeText(text); setCopied(id); window.setTimeout(() => setCopied(undefined), 1800); }
  
  function toggleSpeech(id: string, text: string) {
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const targetLangCode = detectMessageLanguage(text, lang);
      utterance.lang = targetLangCode;
      utterance.rate = 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const matchingVoice = voices.find(v => v.lang === targetLangCode || v.lang.startsWith(targetLangCode.split('-')[0]));
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      
      window.speechSynthesis.speak(utterance);
      setSpeakingId(id);
    }
  }

  async function handleFeedback(id: string, type: "up" | "down") {
    setFeedbacks((prev) => ({ ...prev, [id]: type }));
    try {
      if ((api as any).submitFeedback) {
        await (api as any).submitFeedback(id, type);
      }
    } catch (err) {
      console.error("Failed to send feedback", err);
    }
  }

  return (
    <main className="container-page py-6 sm:py-8">
      <div className="surface flex min-h-[calc(100vh-9rem)] overflow-hidden animate-cube-in bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 transition-colors duration-300">
        
        <aside className={`${sidebarOpen ? "absolute inset-y-0 left-0 z-30 flex animate-zipper" : "hidden"} w-80 shrink-0 flex-col border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-5 lg:static lg:flex shadow-xl lg:shadow-none rtl:border-r-0 rtl:border-l`}>
          <button onClick={newConversation} className="button-primary w-full flex justify-center items-center gap-2 py-3.5 shadow-md rounded-2xl">
            <MessageCirclePlus size={18} /> {t.newChat}
          </button>
          
          <div className="mt-6 flex-1 overflow-y-auto custom-scrollbar">
            <p className="px-2 text-xs font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-3">{t.thisSession}</p>
            <div className="space-y-1.5">
              {sessions.length ? sessions.map((item) => (
                <div key={item.id} className="group relative flex items-center">
                  <button 
                    onClick={() => loadSession(item)} 
                    className={`block w-full truncate rounded-2xl px-4 py-3 text-left rtl:text-right text-sm font-medium transition pr-9 ${currentSessionId === item.id ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'}`}
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
              )) : <p className="px-2 py-4 text-sm text-slate-400 dark:text-slate-500 text-center italic">لا توجد محادثات سابقة</p>}
            </div>
          </div>

          <div className="mt-auto border-t border-slate-200/60 dark:border-slate-800 pt-5">
            <FileUploader />
            <p className="mt-3 text-xs leading-5 text-slate-400 dark:text-slate-500">{t.uploadNote}</p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-slate-50/30 dark:bg-slate-950 transition-colors duration-300">
          
          <header className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-6 py-4 sticky top-0 z-20 shadow-xs">
            <div className="flex items-center gap-3">
              <button className="rounded-xl p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-teal-600 dark:text-teal-400 lg:hidden transition" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <PanelLeft size={20} />
              </button>
              <div>
                <h1 className="font-black text-xl tracking-tight bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 dark:from-teal-400 dark:to-emerald-300 bg-clip-text text-transparent flex items-center gap-2">
                  <Sparkles size={20} className="text-teal-500 animate-pulse" /> {t.welcomeTitle}
                </h1>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{t.welcomeSub}</p>
              </div>
            </div>
          </header>

          <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-8 custom-scrollbar">
            {messages.map((message, index) => (
              <div key={message.id} className={`animate-zipper flex flex-col ${message.role === "user" ? "ml-auto rtl:mr-auto rtl:ml-0 items-end max-w-2xl" : "max-w-3xl items-start"}`}>
                
                <div dir={isArabic(message.body) ? "rtl" : "ltr"} className={message.role === "user" ? "rounded-3xl rounded-br-sm rtl:rounded-br-3xl rtl:rounded-bl-sm bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4 text-sm leading-relaxed text-white font-medium shadow-md shadow-teal-900/10 space-y-2" : "rounded-3xl rounded-bl-sm rtl:rounded-bl-3xl rtl:rounded-br-sm border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 px-6 py-6 text-sm leading-relaxed text-slate-800 dark:text-slate-100 shadow-sm"}>
                  
                  {/* عرض الملف المرفوع داخل فقاعة رسالة المستخدم لكي لا يختفي أبداً */}
                  {message.fileName && (
                    <div className="inline-flex items-center gap-2 bg-white/20 dark:bg-black/20 px-3 py-1.5 rounded-xl text-xs font-bold text-white mb-2 border border-white/20">
                      <FileText size={14} />
                      <span>{message.fileName}</span>
                    </div>
                  )}

                  {message.reply && message.reply.risk_level === "urgent" && <div className="mb-4"><EmergencyCard arabic={isArabic(message.body)} /></div>}
                  
                  <div className="font-sans space-y-1.5">
                    {message.role === "assistant" ? renderFormattedMessage(message.body) : <div className="whitespace-pre-wrap">{message.body}</div>}
                  </div>
                  
                  {message.reply && message.reply.sources.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Verified Sources:</span>
                      {message.reply.sources.map((s, idx) => (
                        <a 
                          key={s.source_id} 
                          href={formatSourceUrl(s.title || s.topic || "health", idx)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1.5 rounded-full bg-teal-50/80 dark:bg-slate-800 border border-teal-200/60 dark:border-slate-700 px-3.5 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 dark:hover:text-white transition shadow-2xs" 
                          title={s.title}
                        >
                          <span className="w-4 h-4 rounded-full bg-teal-200 dark:bg-teal-900 text-teal-900 dark:text-teal-100 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                          <span className="max-w-[160px] truncate">{s.title}</span>
                          <ExternalLink size={12} className="opacity-70" />
                        </a>
                      ))}
                    </div>
                  )}
                  
                </div>

                {message.role === "assistant" && index > 0 && (
                  <div className="mt-2.5 flex items-center gap-1.5 rtl:flex-row-reverse bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl px-2 py-1 shadow-2xs">
                    <button onClick={() => void copy(message.id, message.body)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 transition" title="Copy">
                      {copied === message.id ? <Check size={15} className="text-emerald-600" /> : <Clipboard size={15} />}
                    </button>
                    
                    <button onClick={() => toggleSpeech(message.id, message.body)} className={`rounded-xl p-1.5 transition ${speakingId === message.id ? "text-red-500 bg-red-50 dark:bg-red-900/20" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400"}`} title={speakingId === message.id ? "Stop Reading" : "Read aloud"}>
                      {speakingId === message.id ? <Square size={15} fill="currentColor" /> : <Volume2 size={15} />}
                    </button>
                    
                    <button onClick={() => { const previous = messages[index - 1]; if (previous?.role === "user") void send(previous.body); }} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 transition" title="Retry">
                      <RotateCcw size={15} />
                    </button>
                    
                    <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-0.5" />

                    <button onClick={() => handleFeedback(message.id, "up")} className={`rounded-xl p-1.5 transition ${feedbacks[message.id] === "up" ? "text-teal-600 bg-teal-50 dark:bg-teal-900/30" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400"}`} title="Helpful">
                      <ThumbsUp size={15} className={feedbacks[message.id] === "up" ? "fill-teal-600 dark:fill-teal-500" : ""} />
                    </button>
                    
                    <button onClick={() => handleFeedback(message.id, "down")} className={`rounded-xl p-1.5 transition ${feedbacks[message.id] === "down" ? "text-red-600 bg-red-50 dark:bg-red-900/30" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400"}`} title="Not helpful">
                      <ThumbsDown size={15} className={feedbacks[message.id] === "down" ? "fill-red-600 dark:fill-red-500" : ""} />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="max-w-xs rounded-3xl rounded-bl-sm border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 shadow-sm animate-zipper">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-teal-500" />
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-teal-500 [animation-delay:150ms]" />
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-teal-500 [animation-delay:300ms]" />
                  <span className="text-xs text-slate-400 font-medium ml-2">CARE360 is thinking...</span>
                </div>
              </div>
            )}
            
            {error && <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-300 animate-cube-in">{error}</div>}
          </div>

          <div className="border-t border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl p-4 sm:p-6 transition-colors duration-300">
            <div className="mb-3 flex flex-wrap gap-2">
              {t.prompts.map((prompt: string) => (
                <button key={prompt} onClick={() => void send(prompt)} className="rounded-full border border-teal-200/60 dark:border-slate-700 bg-teal-50/50 dark:bg-slate-800/80 px-4 py-1.5 text-xs font-bold text-teal-900 dark:text-teal-300 transition hover:bg-teal-100 hover:border-teal-300">
                  {prompt}
                </button>
              ))}
            </div>

            {selectedFile && (
              <div className="mb-3 flex items-center justify-between bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 px-4 py-2 rounded-2xl animate-cube-in">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <FileText size={18} className="text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="text-xs font-bold text-teal-900 dark:text-teal-200 truncate">{selectedFile.name}</span>
                </div>
                <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-red-500 transition p-1">
                  <X size={16} />
                </button>
              </div>
            )}

            <form onSubmit={submit} className="flex items-end gap-3 rounded-3xl border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 shadow-sm transition-all focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10">
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,.pdf,.txt,.doc,.docx" 
              />

              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 dark:bg-slate-800 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-slate-700 hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm group"
                title="Upload Image or Document"
              >
                <span className="absolute inset-0 rounded-2xl bg-teal-400/20 group-hover:animate-ping opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <Paperclip size={19} className="relative z-10 transition-transform group-hover:rotate-12" />
              </button>

              <button 
                type="button"
                onClick={toggleListening}
                className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.7)] scale-105' 
                    : 'bg-teal-50 dark:bg-slate-800 text-teal-600 dark:text-teal-400 hover:bg-teal-100 hover:scale-105 active:scale-95'
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
              
              <button disabled={(!draft.trim() && !selectedFile) || loading} className="button-primary h-12 w-12 rounded-2xl p-0 shrink-0 flex items-center justify-center shadow-lg hover:scale-105 transition-transform" aria-label="Send question">
                <Send size={18} className="rtl:-scale-x-100" />
              </button>
            </form>

            <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
              <CornerDownLeft size={13} className="text-teal-600 dark:text-teal-400 rtl:-scale-x-100" /> {t.pressEnter}
            </p>
          </div>

        </section>
      </div>
    </main>
  );
}