/* ================================================================
   CHAT HELPERS
   ----------------------------------------------------------------
   Pure, side-effect-free utilities shared across the chat feature:
   RTL/Arabic detection, translation dictionaries, message-language
   detection, and evidence-source URL formatting.

   Nothing in this file touches the DOM, Web Speech API, or React
   state — that logic lives in `hooks/useSpeech.ts` and
   `hooks/useChat.ts` respectively.
   ================================================================ */

/* ----------------------------------------------------------------
   RTL DETECTION
   ---------------------------------------------------------------- */

export const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

/* ----------------------------------------------------------------
   MESSAGE LANGUAGE DETECTION
   ---------------------------------------------------------------- */

export const detectMessageLanguage = (
  text: string,
  currentAppLang: string
): string => {
  if (!text?.trim()) {
    return currentAppLang === "ar" ? "ar-SA" : "en-US";
  }

  const arabicCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const latinCount = (text.match(/[A-Za-z]/g) || []).length;

  /*
   * Arabic gets priority because medical Arabic frequently
   * contains English medical terminology.
   */
  if (arabicCount > 0 && arabicCount >= Math.max(1, latinCount * 0.15)) {
    return "ar-SA";
  }

  if (/[\u4E00-\u9FFF]/.test(text)) {
    return "zh-CN";
  }

  if (/[\u3040-\u30ff]/.test(text)) {
    return "ja-JP";
  }

  if (/[\uAC00-\uD7AF]/.test(text)) {
    return "ko-KR";
  }

  if (/[\u0400-\u04FF]/.test(text)) {
    return "ru-RU";
  }

  const lower = text.toLowerCase();

  if (/\b(le|la|les|un|une|et|est|vous|nous|que|pour|c'est|des)\b/.test(lower)) {
    return "fr-FR";
  }

  if (/\b(der|die|das|und|ist|ein|eine|nicht|sie|ich|wir)\b/.test(lower)) {
    return "de-DE";
  }

  if (/\b(el|la|los|las|un|una|y|es|por|para|con)\b/.test(lower)) {
    return "es-ES";
  }

  if (/\b(il|la|i|le|un|una|e|è|per|con|sono|che)\b/.test(lower)) {
    return "it-IT";
  }

  if (/\b(bir|ve|bu|da|de|için|ile|olarak|bu gün)\b/.test(lower)) {
    return "tr-TR";
  }

  const map: Record<string, string> = {
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

  return map[currentAppLang] || "en-US";
};

/* ----------------------------------------------------------------
   EVIDENCE SOURCE URL FORMATTING
   ---------------------------------------------------------------- */

export const formatSourceUrl = (searchQuery: string, index: number) => {
  if (!searchQuery) return "#";

  const cleanQuery = searchQuery.split(" ").slice(0, 4).join(" ");
  const encodedQuery = encodeURIComponent(cleanQuery);
  const isAr = /[\u0600-\u06FF]/.test(searchQuery);

  if (isAr) {
    const arSites = [
      `https://www.who.int/ar/home/search?indexCatalogue=genericsearchindex1&searchQuery=${encodedQuery}`,
      `https://www.mayoclinic.org/ar/search/search-results?q=${encodedQuery}`,
      `https://altibbi.com/search?q=${encodedQuery}`,
      `https://www.webteb.com/search?q=${encodedQuery}`,
    ];

    return arSites[index % arSites.length];
  }

  const enSites = [
    `https://www.who.int/home/search?indexCatalogue=genericsearchindex1&searchQuery=${encodedQuery}`,
    `https://www.mayoclinic.org/search/search-results?q=${encodedQuery}`,
    `https://vsearch.nlm.nih.gov/vivisimo/cgi-bin/query-meta?query=${encodedQuery}`,
    `https://my.clevelandclinic.org/search?q=${encodedQuery}`,
    `https://www.nhs.uk/search/results?q=${encodedQuery}`,
  ];

  return enSites[index % enSites.length];
};

/* ----------------------------------------------------------------
   UI TRANSLATIONS
   ---------------------------------------------------------------- */

export const translations: Record<string, any> = {
  en: {
    welcomeTitle: "Health Information Intelligence",
    welcomeSub: "Evidence-grounded · Verified clinical safety boundaries",
    newChat: "New conversation",
    thisSession: "Chat History",
    noRecent: "Your past conversations will appear here.",
    placeholder: "Ask a general health question…",
    listening: "Listening now... Speak clearly!",
    pressEnter: "Press Enter for a new line; use Send when ready.",
    prompts: [
      "What are warning signs of a stroke?",
      "How does physical activity support health?",
      "General diet for diabetes?",
    ],
  },

  ar: {
    welcomeTitle: "مركز الذكاء الصحي المتطور",
    welcomeSub: "مبني على الأدلة العلمية · معايير أمان سريري معتمدة",
    newChat: "محادثة جديدة",
    thisSession: "سجل المحادثات",
    noRecent: "محادثاتك السابقة ستظهر هنا.",
    placeholder: "اطرح سؤالاً صحياً...",
    listening: "جاري الاستماع... تحدث بوضوح!",
    pressEnter: "اضغط Enter لسطر جديد. استخدم إرسال للبحث.",
    prompts: [
      "ما هي علامات السكتة الدماغية؟",
      "كيف تدعم الرياضة صحة القلب؟",
      "النظام الغذائي لمرضى السكري؟",
    ],
  },
};
