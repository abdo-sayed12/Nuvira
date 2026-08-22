import { Menu, X, Sun, Moon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { BrandMark } from "./BrandMark";
import { motion, AnimatePresence } from "framer-motion";

export type Page = "home" | "chat" | "sources" | "safety";

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

export function TopNav({ page, setPage }: { page: Page; setPage: (page: Page) => void }) {
  const [open, setOpen] = useState(false);
  const links: { id: Page; label: string }[] = [
    { id: "home", label: "Home" }, 
    { id: "sources", label: "Sources" }, 
    { id: "safety", label: "Safety" }
  ];

  const go = (destination: Page) => { 
    setPage(destination); 
    setOpen(false); 
    window.scrollTo({ top: 0, behavior: "smooth" }); 
  };

  // ==========================================
  // 1. إعدادات الـ Dark Mode
  // ==========================================
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  // ==========================================
  // 2. إعدادات اللغات (مع الحفظ والاسترجاع من LocalStorage)
  // ==========================================
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  
  // 🚀 قراءة اللغة المحفوظة مسبقاً أو ضبط الإنجليزية كافتراضي
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem("care360_lang") || document.documentElement.lang || "en";
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // تطبيق اللغة واتجاه الصفحة فور تحميل المكون لأول مرة
  useEffect(() => {
    const savedLang = localStorage.getItem("care360_lang") || "en";
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
    localStorage.setItem("care360_lang", code);
    
    // تحديث اتجاه ولغة المستند لتعمل في كل الصفحات والصوت تلقائياً
    document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = code;
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur transition-colors duration-300">
      <div className="container-page flex h-16 items-center justify-between">
        
        {/* اللوجو */}
        <button aria-label="CARE360 home" onClick={() => go("home")}>
          <BrandMark />
        </button>

        {/* روابط الديسكتوب وأزرار التحكم */}
        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <button 
                key={link.id} 
                onClick={() => go(link.id)} 
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  page === link.id 
                    ? "bg-ocean-50 text-ocean-700 dark:bg-teal-900/30 dark:text-teal-400" 
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
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

            {/* زر الـ Dark Mode 🌓 */}
            <div 
              className="flex flex-col items-center justify-center cursor-pointer group"
              onClick={toggleTheme}
            >
              <div className="p-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 group-hover:border-teal-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-all duration-200">
                {isDark ? <Moon size={16} /> : <Sun size={16} />}
              </div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                {isDark ? "Dark Mode" : "Light Mode"}
              </span>
            </div>
          </div>

          <button onClick={() => go("chat")} className="button-primary hidden md:block py-2.5">
            Start chat
          </button>

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
            className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 px-5 py-3 md:hidden overflow-hidden"
          >
            <div className="flex justify-around border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <button onClick={() => setLangMenuOpen(!langMenuOpen)} className="flex flex-col items-center gap-1">
                <span className="text-2xl">🌍</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Language</span>
              </button>
              
              <button onClick={toggleTheme} className="flex flex-col items-center gap-1">
                <div className="p-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  {isDark ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Theme</span>
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

            {[...links, { id: "chat" as Page, label: "Start chat" }].map((link) => (
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