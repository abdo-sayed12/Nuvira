import React, { useState, useRef, useEffect } from "react";
import { CornerDownLeft, Mic, Send, Square, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";

import type { useChat } from "../../hooks/useChat";
import type { useSpeech } from "../../hooks/useSpeech";

// We assume api.ts has been updated to export api.transcribe if it was missing, 
// wait I didn't add api.transcribe to api.ts, I should do that. I'll import API_BASE from somewhere or just fetch.
import { supabase } from "../../auth/lib/supabase";
const API_BASE = (import.meta as any).env.VITE_API_BASE_URL ?? "/api";

interface ChatInputAreaProps {
  chat: ReturnType<typeof useChat>;
  speech: ReturnType<typeof useSpeech>;
}

export function ChatInputArea({ chat, speech }: ChatInputAreaProps) {
  const { draft, setDraft, loading, submit, send, stopGenerating, t } = chat;
  const { handleInput, handleKeyDown } = speech; // We bypass speech's native listening

  // Attachment state
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const speechRecognitionRef = useRef<any>(null);
  const speechBufferRef = useRef<string>("");

  // Cleanup
  useEffect(() => {
    return () => {
      if (filePreview && attachedFile?.type.startsWith('image/')) {
        URL.revokeObjectURL(filePreview);
      }
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch(e){}
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) clearInterval(animationFrameRef.current);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Only accept PDF and images
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      alert("Please upload a PDF or an Image.");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5MB.");
      return;
    }

    setAttachedFile(file);
    if (file.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null); // PDF preview uses an icon
    }
  };

  const clearAttachment = () => {
    setAttachedFile(null);
    if (filePreview && attachedFile?.type.startsWith('image/')) {
      URL.revokeObjectURL(filePreview);
    }
    setFilePreview(null);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || (!draft.trim() && !attachedFile)) return;
    
    let base64File: string | undefined = undefined;
    if (attachedFile) {
      base64File = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(attachedFile);
      });
    }

    clearAttachment();
    await send(draft, undefined, base64File);
  };

  const [speechLanguage, setSpeechLanguage] = useState(
    document.documentElement.dir === 'rtl' ? 'ar-EG' : 'en-US'
  );

  const startRecording = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Your browser does not support Speech Recognition.");
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLanguage;

      let currentDraft = draft.trim();
      if (currentDraft.length > 0) currentDraft += " ";

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalSegment = "";
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalSegment += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        currentDraft += finalSegment;
        setDraft(currentDraft + interimTranscript);
      };

      recognition.onerror = (e: any) => {
        console.error("Speech error", e);
      };
      
      recognition.onend = () => {
        stopAndTranscribe();
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      
      animationFrameRef.current = window.setInterval(() => {
        setAudioLevel(Math.random() * 255);
      }, 100);

    } catch (err) {
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopAndTranscribe = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) clearInterval(animationFrameRef.current);
    setAudioLevel(0);
  };

  const cancelRecording = () => {
    stopAndTranscribe();
  };

  return (
    <div className="bg-transparent px-4 pb-4 sm:px-8 sm:pb-6 pt-2 transition-colors duration-300 w-full shrink-0">
      <div className="max-w-[780px] mx-auto w-full">
        {/* CHIPS */}
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto custom-scrollbar pb-1" style={{ marginBottom: "8px" }}>
          {t.prompts.map((prompt: string) => (
            <button
              key={prompt}
              onClick={() => void send(prompt)}
              className="shrink-0 text-teal-200 transition-colors border hover:border-cyan-400 hover:text-cyan-200 hover:bg-cyan-900/30"
              style={{
                padding: "5px 12px",
                fontSize: "0.78rem",
                borderRadius: "999px",
                background: "rgba(10, 16, 28, 0.5)",
                border: "1px solid rgba(16, 185, 129, 0.15)",
                backdropFilter: "blur(10px)"
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* ATTACHMENT THUMBNAIL */}
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 max-w-fit shadow-md">
            {attachedFile.type.startsWith('image/') && filePreview ? (
              <img src={filePreview} alt="Preview" className="w-10 h-10 object-cover rounded-md" />
            ) : (
              <div className="w-10 h-10 flex items-center justify-center bg-slate-700/50 rounded-md">
                <FileText size={20} className="text-teal-400" />
              </div>
            )}
            <div className="flex flex-col flex-1 min-w-[120px] max-w-[200px]">
              <span className="text-xs text-slate-200 truncate font-medium">{attachedFile.name}</span>
              <span className="text-[10px] text-slate-400">{(attachedFile.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <button type="button" onClick={clearAttachment} className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full transition-colors">
              <X size={16} />
            </button>
          </div>
        )}

        {/* RECORDING OVERLAY OR NORMAL INPUT */}
        {isRecording ? (
          <div className="relative flex items-center justify-between gap-3 shadow-lg"
            style={{
              minHeight: "48px",
              padding: "6px 16px",
              borderRadius: "20px",
              background: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              backdropFilter: "blur(16px)"
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
              <span className="text-red-400 font-mono text-sm font-medium">
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
              </span>
            </div>
            
            <div className="flex-1 flex items-center justify-center gap-1 overflow-hidden h-[30px] px-4">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="w-1 bg-red-400/80 rounded-full transition-all duration-75"
                     style={{ height: `${Math.max(4, (audioLevel / 255) * 24 * (1 - Math.abs(i - 7) / 7))}px` }} />
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <button type="button" onClick={cancelRecording} className="text-slate-400 hover:text-white px-2 py-1 text-sm font-medium transition-colors">
                Cancel
              </button>
              <button type="button" onClick={stopAndTranscribe} className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 flex items-center justify-center transition-colors shadow-md">
                <Square size={16} fill="currentColor" />
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleCustomSubmit}
            className="relative flex items-end gap-2 shadow-lg transition-all focus-within:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
            style={{
              minHeight: "48px",
              padding: "6px 12px",
              borderRadius: "20px",
              background: "rgba(15, 23, 42, 0.65)",
              border: "1px solid rgba(16, 185, 129, 0.28)",
              backdropFilter: "blur(16px)"
            }}
          >
            {/* ATTACH BUTTON */}
            <label className="relative flex shrink-0 items-center justify-center transition-all duration-300 rounded-full bg-transparent text-slate-400 hover:bg-slate-700/50 hover:text-teal-400 cursor-pointer"
              style={{ width: "36px", height: "36px", marginBottom: "1px" }}
              title="Attach PDF or Image"
            >
              <Paperclip size={18} className="relative z-10" />
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
            </label>

            {/* TEXTAREA */}
            <textarea
              rows={1}
              value={draft}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              className="flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm text-slate-100 outline-none placeholder:text-slate-400/70 font-sans custom-scrollbar self-center"
              style={{ minHeight: "36px", maxHeight: "150px" }}
              maxLength={4000}
              dir="auto"
            />

            {/* LANGUAGE SELECTOR & MICROPHONE */}
            {!draft.trim() && !loading && !attachedFile && (
              <div className="flex items-center gap-1">
                <select
                  value={speechLanguage}
                  onChange={(e) => setSpeechLanguage(e.target.value)}
                  className="bg-transparent text-slate-400 text-[10px] outline-none cursor-pointer border border-slate-700/50 rounded px-1 py-1 hover:text-teal-400"
                  title="Speech Language"
                >
                  <option value="ar-EG">🇪🇬 AR</option>
                  <option value="en-US">🇺🇸 EN</option>
                  <option value="fr-FR">🇫🇷 FR</option>
                  <option value="es-ES">🇪🇸 ES</option>
                  <option value="zh-CN">🇨🇳 ZH</option>
                </select>
                <button
                  type="button"
                  onClick={startRecording}
                  className="relative flex shrink-0 items-center justify-center transition-all duration-300 rounded-full bg-transparent text-teal-500 hover:bg-teal-500/10 hover:text-teal-400"
                  style={{ width: "32px", height: "32px", marginBottom: "1px" }}
                  title="Use Microphone"
                >
                  <Mic size={18} className="relative z-10" />
                </button>
              </div>
            )}

            {/* SEND / STOP */}
            {loading ? (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); stopGenerating(); }}
                className="button-primary bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-full shrink-0 flex items-center justify-center shadow-md hover:scale-105 transition-transform"
                style={{ width: "36px", height: "36px", marginBottom: "1px", padding: 0 }}
                aria-label="Stop Generating"
              >
                <Square size={14} fill="currentColor" />
              </button>
            ) : (draft.trim() || attachedFile) ? (
              <button
                disabled={loading || isRecording}
                className="button-primary rounded-full shrink-0 flex items-center justify-center shadow-md hover:scale-105 transition-transform disabled:opacity-30 disabled:hover:scale-100"
                style={{ width: "36px", height: "36px", marginBottom: "1px", background: "linear-gradient(135deg, #0d9488, #059669)", border: "none", padding: 0 }}
                aria-label="Send question"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rtl:-scale-x-100 shrink-0" style={{ flexShrink: 0 }}>
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            ) : null}
          </form>
        )}

        <p className="flex justify-center items-center gap-1.5 text-slate-400" style={{ fontSize: "0.72rem", opacity: 0.6, marginTop: "4px" }}>
          <CornerDownLeft size={11} className="text-teal-400 rtl:-scale-x-100" />
          {t.pressEnter}
        </p>
      </div>
    </div>
  );
}
