import { ExternalLink, Globe, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

const translations: Record<string, any> = {
  en: {
    title: "Trusted Global Sources",
    subtitle: "The top-tier healthcare authorities and research institutions backing our evidence-based clinical accuracy.",
    visitOfficial: "Visit Official Site",
    badge: "Verified Authorities",
  },
  ar: {
    title: "أقوى المصادر الطبية",
    subtitle: "أبرز الهيئات الصحية والمؤسسات البحثية المعتمدة عالمياً لضمان دقة المعلومات الطبية.",
    visitOfficial: "زيارة الموقع الرسمي",
    badge: "جهات معتمدة",
  }
};

const topMedicalSources = [
  { name: "World Health Organization (WHO)", desc: "The directing and coordinating authority for health within the United Nations system.", url: "https://www.who.int" },
  { name: "Mayo Clinic", desc: "Top-ranked hospital and medical research center for clinical excellence and patient care.", url: "https://www.mayoclinic.org" },
  { name: "National Institutes of Health (NIH)", desc: "The primary agency of the U.S. government responsible for biomedical and public health research.", url: "https://www.nih.gov" },
  { name: "Centers for Disease Control (CDC)", desc: "Leading national public health institute of the United States protecting public health safety.", url: "https://www.cdc.gov" },
  { name: "Cleveland Clinic", desc: "Renowned academic medical center providing expert clinical care and health research.", url: "https://my.clevelandclinic.org" },
  { name: "Harvard Health", desc: "The authoritative consumer health education division of Harvard Medical School.", url: "https://www.health.harvard.edu" },
  { name: "Johns Hopkins", desc: "World-class biomedical research institution and premier medical school.", url: "https://www.hopkinsmedicine.org" },
  { name: "NHS (UK)", desc: "Comprehensive publicly funded healthcare system providing trusted clinical guidelines.", url: "https://www.nhs.uk" },
  { name: "MedlinePlus", desc: "The world's largest medical library, providing trusted health information from the U.S. NLM.", url: "https://medlineplus.gov" },
  { name: "WebMD", desc: "Leading provider of health information services, consumer health news, and clinical insights.", url: "https://www.webmd.com" }
];

export function SourcesPage() {
  const [lang, setLang] = useState(document.documentElement.lang || 'en');
  useEffect(() => {
    const observer = new MutationObserver(() => setLang(document.documentElement.lang || 'en'));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    return () => observer.disconnect();
  }, []);
  
  const t = translations[lang] || translations.en;

  const row1 = topMedicalSources;
  const row2 = [...topMedicalSources].reverse();
  const row3 = [...topMedicalSources.slice(5), ...topMedicalSources.slice(0, 5)];

  const MarqueeRow = ({ items, direction, speed }: { items: typeof topMedicalSources, direction: 'left' | 'right', speed: number }) => (
    <div className="flex w-full overflow-hidden" dir="ltr">
      <div 
        className={`flex gap-4 sm:gap-6 px-2 sm:px-3 min-w-max will-change-transform ${direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {[...items, ...items].map((source, i) => (
          <a 
            key={i} 
            href={source.url} 
            target="_blank" 
            rel="noopener noreferrer"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            className="flex-shrink-0 w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] bg-slate-900/80 hover:bg-slate-800 border border-slate-700/50 rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_40px_rgba(45,212,191,0.15)] hover:border-teal-500/40 group cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="w-10 h-10 rounded-2xl bg-slate-800 text-teal-400 flex items-center justify-center font-bold text-sm border border-slate-700/50 group-hover:bg-teal-950/50 transition-colors">
                  #{ (topMedicalSources.findIndex(s => s.name === source.name) + 1) }
                </span>
                <ExternalLink size={20} className="text-slate-500 group-hover:text-teal-400 transition-colors" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-200 group-hover:text-white leading-tight">
                {source.name}
              </h3>
            </div>
            
            <div>
              <p className="text-sm text-slate-400 line-clamp-3 mb-5">
                {source.desc}
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-teal-500 uppercase tracking-widest">
                <span>{t.visitOfficial}</span>
                <ArrowRight size={14} className="rtl:-scale-x-100 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );

  return (
    <main className="relative w-full min-h-[calc(100vh-64px)] bg-[#020617] flex flex-col font-sans py-12 overflow-hidden">
      
      {/* Title Section */}
      <div className="relative z-20 text-center px-4 mb-10 flex-shrink-0">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold uppercase tracking-wider mb-4 border border-teal-500/20 backdrop-blur-md shadow-[0_0_20px_rgba(45,212,191,0.1)]">
          <Globe size={14} /> {t.badge}
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4">
          {t.title}
        </h1>
        <p className="text-base sm:text-lg leading-relaxed text-slate-400 max-w-2xl mx-auto">
          {t.subtitle}
        </p>
      </div>

      {/* Marquee Rows Container */}
      <div className="relative z-10 flex flex-col gap-4 sm:gap-6 pause-on-hover flex-grow justify-center py-4">
        {/* Left/Right Fade Gradients */}
        <div className="absolute inset-y-0 left-0 w-16 sm:w-48 bg-gradient-to-r from-[#020617] to-transparent z-20 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-16 sm:w-48 bg-gradient-to-l from-[#020617] to-transparent z-20 pointer-events-none"></div>

        <MarqueeRow items={row1} direction="left" speed={60} />
        <MarqueeRow items={row2} direction="right" speed={70} />
        <MarqueeRow items={row3} direction="left" speed={65} />
      </div>

      <style>{`
        @keyframes marqueeLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marqueeRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee-left {
          animation: marqueeLeft linear infinite;
        }
        .animate-marquee-right {
          animation: marqueeRight linear infinite;
        }
        /* Pause all animations when hovering anywhere over the container */
        .pause-on-hover:hover .animate-marquee-left,
        .pause-on-hover:hover .animate-marquee-right {
          animation-play-state: paused !important;
        }
      `}</style>
    </main>
  );
}