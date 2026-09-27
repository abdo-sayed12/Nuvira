import { useEffect, useRef, useState } from "react";

/* ================================================================
   useSpeech
   ----------------------------------------------------------------
   Owns every Web Speech API concern for the chat page:

     - Speech-to-text (microphone dictation into the draft field)
     - Text-to-speech ("read aloud" on assistant messages)
     - Text sanitization before it is spoken (strip markdown, URLs,
       emoji, etc. — the on-screen message itself is never touched)
     - Voice + language selection for both directions

   Nothing here knows about chat sessions, sending messages, or
   local storage — that lives in `useChat.ts`. The two hooks are
   composed together by the `ChatPage` orchestrator.
   ================================================================ */

/* ----------------------------------------------------------------
   MICROPHONE LANGUAGE
   ---------------------------------------------------------------- */

const getSmartMicLang = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const osLangs = navigator.languages || [navigator.language || "en-US"];

    const middleEast = [
      "Africa/Cairo",
      "Asia/Riyadh",
      "Asia/Dubai",
      "Asia/Amman",
      "Asia/Baghdad",
      "Asia/Damascus",
      "Asia/Jerusalem",
    ];

    if (
      middleEast.includes(tz) ||
      osLangs.some((l) => l.toLowerCase().startsWith("ar"))
    ) {
      return "ar-EG";
    }

    return osLangs[0] || "en-US";
  } catch (e) {
    return "ar-EG";
  }
};

/* ----------------------------------------------------------------
   TTS SANITIZATION
   ---------------------------------------------------------------- */

const cleanTextForSpeech = (text: string): string => {
  if (!text) return "";

  let cleaned = text;

  // Remove URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, " ");

  // Remove markdown links
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove markdown emphasis
  cleaned = cleaned.replace(/(\*\*|__|\*|_)/g, "");

  // Remove markdown headings
  cleaned = cleaned.replace(/^#{1,6}\s*/gm, "");

  // Remove bullet characters
  cleaned = cleaned.replace(/^[\s]*[-*•◦▪▫]\s*/gm, "");

  /*
   * Remove emoji characters.
   * This prevents the browser from saying things like:
   *
   * "medical symbol"
   * "red flag"
   * "sparkles"
   */
  cleaned = cleaned.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, " ");

  // Remove variation selectors / zero width joiner
  cleaned = cleaned.replace(/[\uFE0E\uFE0F\u200D]/g, "");

  // Remove leftover markdown symbols
  cleaned = cleaned.replace(/[~`|]+/g, " ");

  // Normalize whitespace
  cleaned = cleaned.replace(/[ \t]{2,}/g, " ");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
};

/* ----------------------------------------------------------------
   TTS LANGUAGE
   ---------------------------------------------------------------- */

const getSpeechLanguage = (text: string, appLang: string): string => {
  if (!text.trim()) {
    return appLang === "ar" ? "ar-SA" : "en-US";
  }

  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = (text.match(/[A-Za-z]/g) || []).length;

  /*
   * Arabic takes priority.
   *
   * This is especially important for answers such as:
   *
   * "يُنصح بقياس blood pressure..."
   *
   * The answer is still Arabic.
   */
  if (arabicChars > 0 && arabicChars >= Math.max(1, latinChars * 0.15)) {
    return "ar-SA";
  }

  const languageMap: Record<string, string> = {
    ar: "ar-SA",
    en: "en-US",
    fr: "fr-FR",
    de: "de-DE",
    es: "es-ES",
    it: "it-IT",
    ru: "ru-RU",
    zh: "zh-CN",
    ja: "ja-JP",
    ko: "ko-KR",
    tr: "tr-TR",
  };

  return languageMap[appLang] || "en-US";
};

/* ----------------------------------------------------------------
   TTS VOICE SELECTION
   ---------------------------------------------------------------- */

const getBestSpeechVoice = (
  voices: SpeechSynthesisVoice[],
  language: string
): SpeechSynthesisVoice | null => {
  if (!voices.length) return null;

  const normalizedLanguage = language.toLowerCase();
  const languagePrefix = normalizedLanguage.split("-")[0];

  /*
   * 1. Exact language match.
   *
   * ar-SA -> ar-SA
   */
  const exact = voices.find(
    (voice) => voice.lang.toLowerCase() === normalizedLanguage
  );

  if (exact) return exact;

  /*
   * 2. Same language family.
   *
   * ar-SA -> ar-EG / ar-AE / ar-XA
   *
   * IMPORTANT:
   * Arabic will NEVER fallback to Spanish.
   */
  const sameLanguage = voices.find(
    (voice) => voice.lang.toLowerCase().split("-")[0] === languagePrefix
  );

  if (sameLanguage) return sameLanguage;

  /*
   * 3. No compatible voice.
   *
   * DO NOT select an arbitrary voice.
   */
  return null;
};

/* ----------------------------------------------------------------
   WAIT FOR BROWSER VOICES
   ---------------------------------------------------------------- */

const waitForSpeechVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    const speech = window.speechSynthesis;
    const existingVoices = speech.getVoices();

    if (existingVoices.length > 0) {
      resolve(existingVoices);
      return;
    }

    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;

      speech.removeEventListener("voiceschanged", finish);
      resolve(speech.getVoices());
    };

    speech.addEventListener("voiceschanged", finish);

    /*
     * Some browsers do not reliably
     * fire voiceschanged.
     */
    window.setTimeout(finish, 1000);
  });
};

/* ----------------------------------------------------------------
   HOOK
   ---------------------------------------------------------------- */

interface UseSpeechParams {
  /** Current app language ("en" | "ar" | ...), drives TTS language selection. */
  lang: string;
  /** The chat draft text box value, owned by useChat. */
  draft: string;
  /** Setter for the draft text box, owned by useChat. */
  setDraft: (value: string) => void;
  /** Surfaces speech errors through the same error banner as chat errors. */
  setError: (message: string | undefined) => void;
  /** Called when Enter is pressed in the input (without Shift) to send the message. */
  onSubmit: () => void;
}

export function useSpeech({
  lang,
  draft,
  setDraft,
  setError,
  onSubmit,
}: UseSpeechParams) {
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortAudioQueueRef = useRef(false);
  const speakingIdRef = useRef<string | null>(null);
  
  const baseTextRef = useRef("");
  const userEditedRef = useRef(false);

  /* ==============================================================
     CLEANUP ON UNMOUNT
     ============================================================== */

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  /* ==============================================================
     MICROPHONE
     ============================================================== */

  const toggleListening = () => {
    if (isListening) {
      userEditedRef.current = true;
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Voice not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = getSmartMicLang();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      userEditedRef.current = false;
      baseTextRef.current = draft;

      if (
        baseTextRef.current.trim().length > 0 &&
        !baseTextRef.current.endsWith(" ")
      ) {
        baseTextRef.current += " ";
      }
    };

    recognition.onresult = (event: any) => {
      if (userEditedRef.current) {
        return;
      }

      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        baseTextRef.current += finalTranscript + " ";
      }

      setDraft(baseTextRef.current + interimTranscript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  /* ==============================================================
     INPUT (dictation-aware)
     ============================================================== */

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);

    if (isListening && !userEditedRef.current) {
      userEditedRef.current = true;
      recognitionRef.current?.stop();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      isListening &&
      (e.key === "Backspace" || e.key === "Delete") &&
      !userEditedRef.current
    ) {
      userEditedRef.current = true;
      recognitionRef.current?.stop();
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (isListening) {
        userEditedRef.current = true;
        recognitionRef.current?.stop();
      }

      onSubmit();
    }
  };

  /* ==============================================================
     PROFESSIONAL TTS
     ============================================================== */

  async function toggleSpeech(id: string, text: string) {
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      abortAudioQueueRef.current = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setSpeakingId(null);
      speakingIdRef.current = null;
      return;
    }

    window.speechSynthesis.cancel();
    abortAudioQueueRef.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    setSpeakingId(id);
    speakingIdRef.current = id;

    const cleanText = cleanTextForSpeech(text);

    if (!cleanText) {
      setError("No readable text is available for speech.");
      setSpeakingId(null);
      speakingIdRef.current = null;
      return;
    }

    abortAudioQueueRef.current = false;

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText }),
      });

      if (!response.ok) throw new Error("Backend TTS failed");

      const audioBlob = await response.blob();
      if (abortAudioQueueRef.current || speakingIdRef.current !== id) return;

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setSpeakingId(null);
        speakingIdRef.current = null;
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setSpeakingId(null);
        speakingIdRef.current = null;
      };

      await audio.play();
      return;
    } catch (e) {
      console.warn("Backend TTS failed, falling back to browser speech synthesis", e);
    }

    // 2. Fallback to Browser Native TTS
    const targetLangCode = getSpeechLanguage(cleanText, lang);

    try {
      /*
       * Chrome/Edge sometimes return an empty
       * voice list during initial page load.
       */
      const voices = await waitForSpeechVoices();

      /*
       * Find ONLY a voice belonging to
       * the requested language.
       */
      const selectedVoice = getBestSpeechVoice(voices, targetLangCode);

      const utterance = new SpeechSynthesisUtterance(cleanText);

      /*
       * Explicitly tell the browser
       * which language should be spoken.
       */
      utterance.lang = targetLangCode;

      /*
       * Natural medical reading speed.
       */
      utterance.rate = targetLangCode.startsWith("ar-") ? 0.95 : 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      /*
       * Only assign a voice when it is
       * actually compatible with the language.
       *
       * This prevents:
       *
       * Arabic -> Spanish
       * Arabic -> German
       * Arabic -> random browser voice
       */
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        setSpeakingId(id);
        speakingIdRef.current = id;
      };

      utterance.onend = () => {
        setSpeakingId((current) => {
          if (current === id) speakingIdRef.current = null;
          return current === id ? null : current;
        });
      };

      utterance.onerror = (event) => {
        console.error("Nuvira TTS Error:", event);
        setSpeakingId((current) => {
          if (current === id) speakingIdRef.current = null;
          return current === id ? null : current;
        });
      };

      /*
       * Small delay improves reliability
       * in Chromium browsers.
       */
      window.setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch (speechError) {
          console.error("Nuvira Speech Start Error:", speechError);
          setSpeakingId(null);
        }
      }, 50);
    } catch (ttsError) {
      console.error("Nuvira TTS Initialization Error:", ttsError);
      setSpeakingId(null);
      setError("Voice playback is currently unavailable.");
    }
  }

  /* ==============================================================
     RESET (used when switching / starting a new conversation)
     ============================================================== */

  function resetSpeech() {
    window.speechSynthesis.cancel();
    setSpeakingId(null);
  }

  return {
    isListening,
    speakingId,
    toggleListening,
    toggleSpeech,
    handleInput,
    handleKeyDown,
    resetSpeech,
  };
}
