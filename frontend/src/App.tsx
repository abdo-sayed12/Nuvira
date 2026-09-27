import { useState, useEffect } from "react";
import { TopNav, type Page } from "./components/TopNav";
import { ChatPage } from "./pages/ChatPage";
import { HomePage } from "./pages/HomePage";
import { SafetyPage } from "./pages/SafetyPage";
import { SourcesPage } from "./pages/SourcesPage";
import { MedicalServices } from "./pages/MedicalServices"; // 👈 استيراد صفحة الخدمات الجديدة
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, PhoneCall, ShieldAlert, X } from "lucide-react";
import { AuroraBackground } from "./components/AuroraBackground";
import { AuthProvider, useAuth } from "./auth";
import { AuthPage } from "./auth/pages/AuthPage";

// ملاحظة: تأكد إنك نقلت ملف MedicalServices.tsx جوه فولدر pages عشان الاستيراد ده يشتغل

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}

function AppContent() {
  const { user, isLoading: loading, status } = useAuth();
  const mfaRequired = false; // Temporary placeholder as MFA is not yet implemented in AuthContextValue
  // وسعنا نوع الـ Page (لو الـ TypeScript جاب خطأ هنا هنعدلها في الخطوة التانية)
  const [page, setPage] = useState<Page | "services">("home");
  const [initialPrompt, setInitialPrompt] = useState<string>();
  
  // 🌍 إدارة اللغة بشكل مركزي وعالمي للأبد (منع فقدانها عند الـ Refresh)
  const [lang, setLang] = useState<string>(() => {
    const saved = localStorage.getItem("nuvira_lang");
    return saved || "en";
  });

  // تحديث اللغة والاتجاه في جذر المستند وتخزينها فوراً عند أي تغير
  useEffect(() => {
    localStorage.setItem("nuvira_lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  
  // ==========================================
  // 1. حالات (States) نافذة التنبيه الطبي
  // ==========================================
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("nuvira_hide_disclaimer")) {
      const timer = setTimeout(() => setShowDisclaimer(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptDisclaimer = () => {
    if (dontShowAgain) {
      localStorage.setItem("nuvira_hide_disclaimer", "true");
    }
    setShowDisclaimer(false);
  };

  // ==========================================
  // 2. حالات (States) نظام الطوارئ الذكي
  // ==========================================
  const [showEmergency, setShowEmergency] = useState(false);
  const [emergencyInfo, setEmergencyInfo] = useState({ number: "", country: "", loading: true });

  const emergencyNumbers: Record<string, string> = {
    EG: "123", SA: "997", AE: "998", KW: "112", QA: "999", US: "911", GB: "999", EU: "112",
  };

  const handleEmergencyClick = async () => {
    setShowEmergency(true);
    setEmergencyInfo({ number: "", country: "", loading: true });
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      const num = emergencyNumbers[data.country_code] || "112";
      setEmergencyInfo({ number: num, country: data.country_name, loading: false });
    } catch (err) {
      setEmergencyInfo({ number: "123", country: "مصر (تلقائي)", loading: false });
    }
  };

  const startChat = (prompt?: string) => { 
    setInitialPrompt(prompt); 
    setPage("chat"); 
    window.scrollTo({ top: 0, behavior: "smooth" }); 
  };

  return (
    <div className="aurora-app flex min-h-screen flex-col justify-between relative selection:bg-teal-500 selection:text-white">
      <AuroraBackground tone={page === "services" ? "services" : page === "sources" ? "sources" : page === "safety" ? "safety" : "home"} />
      
      {/* النوافذ المنبثقة (Modals) مع تأثيرات حركية فائقة النعومة */}
      <AnimatePresence>
        {showDisclaimer && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-md px-4"
          >
            <motion.div 
              initial={{ scale: 0.92, y: 15, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center border border-slate-200 dark:border-slate-800"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center shadow-inner">
                <ShieldAlert size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Medical Disclaimer</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
                Nuvira provides AI-generated health information based on clinical evidence. It is <b className="text-slate-800 dark:text-slate-200">NOT</b> a substitute for a doctor. In case of an emergency, call your local medical services immediately.
              </p>
              
              <div className="flex items-center justify-center gap-2 mb-6 text-sm text-slate-500">
                <input 
                  type="checkbox" id="dontShow" 
                  checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-teal-600 rounded" 
                />
                <label htmlFor="dontShow" className="cursor-pointer select-none font-medium">Don't show this message again</label>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAcceptDisclaimer}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-colors shadow-lg shadow-teal-600/20"
              >
                I Understand & Agree
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {showEmergency && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-md px-4"
          >
            <motion.div 
              initial={{ scale: 0.92, y: 15, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center border-t-4 border-t-red-500 relative overflow-hidden"
            >
              <button onClick={() => setShowEmergency(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                <X size={20} />
              </button>
              
              <h2 className="text-2xl font-black text-red-500 flex items-center justify-center gap-2 mb-4">
                <AlertTriangle /> Emergency / طوارئ
              </h2>

              <div className="my-6 min-h-[60px] flex items-center justify-center">
                {emergencyInfo.loading ? (
                  <p className="text-slate-600 dark:text-slate-400 animate-pulse font-medium">
                    Detecting your location to find the local ambulance number...
                  </p>
                ) : (
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 mb-2">
                      Location detected: <b className="text-slate-800 dark:text-slate-200">{emergencyInfo.country}</b>
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      Local Ambulance: <b className="text-red-500 text-3xl tracking-wider block mt-1 font-black">{emergencyInfo.number}</b>
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 justify-center">
                {!emergencyInfo.loading && (
                  <motion.a 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    href={`tel:${emergencyInfo.number}`}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-colors"
                  >
                    <PhoneCall size={18} /> Call Ambulance
                  </motion.a>
                )}
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowEmergency(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-2xl transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* شريط التنقل العلوي */}
      <div className="relative z-10 flex min-h-screen flex-col">
      <TopNav page={page as any} setPage={setPage as any} />

      {/* محتوى الصفحات مع انتقالات حركية سلسة للغاية (Page Transitions) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.main
            key={page}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col"
          >
            {page === "home" && <HomePage startChat={startChat} />}
            {page === "chat" && (loading ? <div className="flex flex-1 items-center justify-center">Loading secure session...</div> : user && !mfaRequired ? <ChatPage initialPrompt={initialPrompt} /> : <AuthPage path="/login" />)}
            {page === "sources" && <SourcesPage />}
            {page === "safety" && <SafetyPage />}
            {/* 👈 الصفحة الرابعة أضيفت هنا */}
            {page === "services" && <MedicalServices />} 
          </motion.main>
        </AnimatePresence>
      </div>

      {/* الفوتر الاحترافي */}
      <footer className="premium-footer mt-auto border-t border-white/10 bg-slate-950/70 py-8 shadow-sm transition-colors duration-300">
        <div className="container-page flex flex-col justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Nuvira · Evidence-Grounded Health Intelligence System</p>
          <p className="font-medium text-teal-400">Not a diagnostic service. For medical emergencies, contact local services immediately.</p>
        </div>
      </footer>

      {/* زر الطوارئ العائم */}
      <motion.button 
        whileHover={{ scale: 1.08, y: -3 }}
        whileTap={{ scale: 0.94 }}
        onClick={handleEmergencyClick}
        className="fixed bottom-6 left-6 md:bottom-8 md:left-8 z-[1000] bg-red-500 hover:bg-red-600 text-white rounded-full px-6 py-3.5 shadow-[0_8px_25px_rgba(239,68,68,0.4)] flex items-center gap-2.5 font-bold transition-shadow rtl:left-auto rtl:right-6 md:rtl:right-8 cursor-pointer"
        title="Call Emergency Services"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        🚨 Emergency
      </motion.button>
      </div>
    </div>
  );
}