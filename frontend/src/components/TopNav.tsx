import { Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { BrandMark } from "./BrandMark";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../auth";

export type Page = "home" | "chat" | "sources" | "safety" | "services";

const languages = [
  { code: "ar", label: "🇪🇬 العربية" },
  { code: "en", label: "🇺🇸 English" },
  { code: "fr", label: "🇫🇷 Français" },
  { code: "de", label: "🇩🇪 Deutsch" },
  { code: "es", label: "🇪🇸 Español" },
  { code: "it", label: "🇮🇹 Italiano" },
  { code: "ru", label: "🇷🇺 Русский" },
  { code: "zh", label: "🇨🇳 中文" },
  { code: "ja", label: "🇯🇵 日本語" },
  { code: "ko", label: "🇰🇷 한국어" },
  { code: "tr", label: "🇹🇷 Türkçe" },
];

// ==========================================
// قاموس الترجمة الخاص بالشريط العلوي 🌍
// ==========================================
const navTranslations: Record<string, any> = {
  ar: { home: "الرئيسية", sources: "المصادر", safety: "الأمان", services: "الخدمات الطبية", startChat: "ابدأ المحادثة", language: "اللغة" },
  en: { home: "Home", sources: "Sources", safety: "Safety", services: "Medical Services", startChat: "Start chat", language: "Language" },
  fr: { home: "Accueil", sources: "Sources", safety: "Sécurité", services: "Services Médicaux", startChat: "Démarrer le chat", language: "Langue" },
  de: { home: "Startseite", sources: "Quellen", safety: "Sicherheit", services: "Medizinische Dienste", startChat: "Chat starten", language: "Sprache" },
  es: { home: "Inicio", sources: "Fuentes", safety: "Seguridad", services: "Servicios Médicos", startChat: "Iniciar chat", language: "Idioma" },
  it: { home: "Home", sources: "Fonti", safety: "Sicurezza", services: "Servizi Medici", startChat: "Inizia chat", language: "Lingua" },
  ru: { home: "Главная", sources: "Источники", safety: "Безопасность", services: "Мед. услуги", startChat: "Начать чат", language: "Язык" },
  zh: { home: "首页", sources: "来源", safety: "安全", services: "医疗服务", startChat: "开始聊天", language: "语言" },
  ja: { home: "ホーム", sources: "ソース", safety: "安全性", services: "医療サービス", startChat: "チャット開始", language: "言語" },
  ko: { home: "홈", sources: "출처", safety: "안전", services: "의료 서비스", startChat: "채팅 시작", language: "언어" },
  tr: { home: "Ana Sayfa", sources: "Kaynaklar", safety: "Güvenlik", services: "Tıbbi Hizmetler", startChat: "Sohbete başla", language: "Dil" }
};

export function TopNav({ page, setPage }: { page: Page; setPage: (page: Page) => void }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  
  // ==========================================
  // 1. تفعيل الوضع الداكن دائماً
  // ==========================================
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.theme = 'dark';
  }, []);

  // ==========================================
  // 2. إعدادات اللغات (مع الحفظ والاسترجاع من LocalStorage)
  // ==========================================
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  
  // 🚀 قراءة اللغة المحفوظة مسبقاً أو ضبط الإنجليزية كافتراضي
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem("nuvira_lang") || document.documentElement.lang || "en";
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // تطبيق اللغة واتجاه الصفحة فور تحميل المكون لأول مرة
  useEffect(() => {
    const savedLang = localStorage.getItem("nuvira_lang") || "en";
    setCurrentLang(savedLang);
    document.documentElement.lang = savedLang;
    document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
  }, []);

  // لقفل القائمة المنسدلة عند الضغط خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (code: string) => {
    setCurrentLang(code);
    setLangMenuOpen(false);
    
    // 🚀 حفظ الاختيار في الذاكرة المحلية للأبد
    localStorage.setItem("nuvira_lang", code);
    
    // تحديث اتجاه ولغة المستند لتعمل في كل الصفحات والصوت تلقائياً
    document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = code;
  };

  // جلب الترجمة حسب اللغة الحالية
  const t = navTranslations[currentLang] || navTranslations.en;

  // الروابط متصلة بالترجمة الديناميكية
  const links: { id: Page; label: string }[] = [
    { id: "home", label: t.home }, 
    { id: "sources", label: t.sources }, 
    { id: "safety", label: t.safety },
    { id: "services", label: t.services }
  ];

  const go = (destination: Page) => { 
    setPage(destination); 
    setOpen(false); 
    window.scrollTo({ top: 0, behavior: "smooth" }); 
  };

  return (
    <header className="premium-nav sticky top-0 z-30 border-b border-white/10 bg-slate-950/55 backdrop-blur-xl transition-colors duration-300">
      <div className="container-page flex h-16 items-center justify-between">
        
        {/* اللوجو */}
        <button aria-label="Nuvira home" onClick={() => go("home")}>
          <BrandMark />
        </button>

        {/* روابط الديسكتوب وأزرار التحكم */}
        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <button 
                key={link.id} 
                onClick={() => go(link.id)} 
                  className={`premium-nav-link rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  page === link.id 
                    ? "premium-nav-active text-cyan-300"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4 border-l border-slate-200 dark:border-slate-700 pl-4 rtl:border-l-0 rtl:border-r rtl:pr-4 rtl:pl-0">
            
            {/* زر الكرة الأرضية 🌍 */}
            <div className="relative" ref={dropdownRef}>
              <div 
                className="flex flex-col items-center justify-center cursor-pointer group"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
              >
                <button className="text-xl group-hover:scale-110 transition-transform duration-200">🌍</button>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {currentLang.toUpperCase()}
                </span>
              </div>

              {/* القائمة المنسدلة للغات */}
              <AnimatePresence>
                {langMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden rtl:right-auto rtl:left-0"
                  >
                    <div className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => changeLanguage(lang.code)}
                          className={`w-full text-left rtl:text-right px-4 py-2.5 text-sm font-medium transition-colors hover:bg-ocean-50 dark:hover:bg-teal-900/20 ${
                            currentLang === lang.code ? "text-teal-600 dark:text-teal-400 bg-ocean-50/50 dark:bg-teal-900/10" : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          <button onClick={() => go("chat")} className="button-primary hidden md:block py-2.5">
            {t.startChat}
          </button>
          {user && <button onClick={() => void logout()} className="hidden text-sm font-semibold text-slate-300 hover:text-white md:block">Sign out</button>}

          {/* القائمة الجانبية للموبايل */}
          <button 
            className="rounded-lg p-2 text-slate-700 dark:text-slate-300 md:hidden" 
            aria-label="Toggle navigation" 
            aria-expanded={open} 
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* محتوى قائمة الموبايل عند الفتح */}
      <AnimatePresence>
        {open && (
          <motion.nav 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 bg-slate-950/95 px-5 py-3 md:hidden overflow-hidden"
          >
            <div className="flex justify-around border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <button onClick={() => setLangMenuOpen(!langMenuOpen)} className="flex flex-col items-center gap-1">
                <span className="text-2xl">🌍</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.language}</span>
              </button>
              
            </div>

            {langMenuOpen && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className="text-left rtl:text-right px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}

            {[...links, { id: "chat" as Page, label: t.startChat }].map((link) => (
              <button 
                key={link.id} 
                onClick={() => go(link.id)} 
                className="block w-full rounded-lg px-3 py-3 text-left rtl:text-right text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-ocean-50 dark:hover:bg-slate-800"
              >
                {link.label}
              </button>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}