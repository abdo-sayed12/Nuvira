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

  const totalSets = 4;
  const sourcesCount = topMedicalSources.length; 
  const zSpacing = 500;
  const loopZ = sourcesCount * zSpacing; 
  const tunnelCards = Array(totalSets).fill(topMedicalSources).flat(); 

  const getTransform = (idx: number) => {
    const depth = idx * zSpacing;
    const side = idx % 4;
    const xRadius = 400; 
    const yRadius = 280; 
    const angle = 75;
    
    switch(side) {
      case 0: return `translateZ(${-depth}px) translateX(${-xRadius}px) rotateY(${angle}deg)`;
      case 1: return `translateZ(${-depth}px) translateX(${xRadius}px) rotateY(${-angle}deg)`;
      case 2: return `translateZ(${-depth}px) translateY(${-yRadius}px) rotateX(${-angle}deg)`;
      case 3: return `translateZ(${-depth}px) translateY(${yRadius}px) rotateX(${angle}deg)`;
      default: return "";
    }
  };

  return (
    <main className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-[#020617] flex flex-col font-sans">
      
      {/* Absolute overlay for titles */}
      <div className="absolute top-10 left-0 w-full z-30 pointer-events-none text-center px-4">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold uppercase tracking-wider mb-4 border border-teal-500/20 backdrop-blur-md shadow-[0_0_20px_rgba(45,212,191,0.2)]">
          <Globe size={14} /> {t.badge}
        </span>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] mb-3">
          {t.title}
        </h1>
        <p className="text-sm sm:text-base leading-relaxed text-slate-300 max-w-2xl mx-auto drop-shadow-lg">
          {t.subtitle}
        </p>
      </div>

      {/* Center Reticle / Light at end of tunnel */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-teal-500/20 blur-[100px] z-0 rounded-full pointer-events-none"></div>

      {/* 3D Tunnel Container */}
      <div 
        className="w-full flex-grow relative z-10 cursor-crosshair"
        style={{ perspective: "800px" }}
      >
        <div 
          className="w-full h-full absolute top-0 left-0 hover-pause"
          style={{ 
            transformStyle: "preserve-3d",
            animation: `tunnelFly 25s linear infinite`
          }}
        >
          {tunnelCards.map((source, idx) => (
            <a 
              key={idx} 
              href={source.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="absolute top-1/2 left-1/2 w-[320px] h-[190px] -ml-[160px] -mt-[95px] bg-slate-900/80 border border-teal-500/30 rounded-2xl p-5 flex flex-col justify-between hover:border-teal-400 hover:shadow-[0_0_40px_rgba(45,212,191,0.6)] transition-all duration-300 pointer-events-auto group hover:bg-slate-800/95"
              style={{ 
                transform: getTransform(idx),
                boxShadow: "inset 0 0 20px rgba(0,0,0,0.6)"
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-7 h-7 rounded-lg bg-teal-950/80 text-teal-400 flex items-center justify-center font-bold text-xs border border-teal-800/50 shadow-inner">
                    #{(idx % sourcesCount) + 1}
                  </span>
                  <ExternalLink size={16} className="text-slate-500 group-hover:text-teal-400 transition-colors" />
                </div>
                <h3 className="text-base font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                  {source.name}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400 line-clamp-3">
                  {source.desc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center gap-1.5 text-[11px] font-bold text-teal-500 uppercase tracking-wider">
                <span>{t.visitOfficial}</span>
                <ArrowRight size={12} className="rtl:-scale-x-100 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes tunnelFly {
          0% { transform: translateZ(0px); }
          100% { transform: translateZ(${loopZ}px); }
        }
        .hover-pause:hover {
          animation-play-state: paused !important;
        }
      `}</style>
    </main>
  );
}