import { ExternalLink, Globe, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

const translations: Record<string, any> = {
  en: {
    title: "Trusted Global Medical Sources",
    subtitle: "The top-tier healthcare authorities, medical schools, and research institutions backing evidence-based clinical accuracy.",
    visitOfficial: "Visit Official Site",
    badge: "Verified Authorities",
  },
  ar: {
    title: "أقوى المصادر والمراجع الطبية العالمية",
    subtitle: "أبرز الهيئات الصحية، وكليات الطب، والمؤسسات البحثية المعتمدة عالمياً لضمان دقة المعلومات العلمية المبنية على الأدلة.",
    visitOfficial: "زيارة الموقع الرسمي",
    badge: "جهات معتمدة وموثوقة",
  }
};

const topMedicalSources = [
  { name: "World Health Organization (WHO)", desc: "The directing and coordinating authority for health within the United Nations system.", url: "https://www.who.int" },
  { name: "Mayo Clinic", desc: "Top-ranked hospital and medical research center for clinical excellence and patient care.", url: "https://www.mayoclinic.org" },
  { name: "National Institutes of Health (NIH)", desc: "The primary agency of the U.S. government responsible for biomedical and public health research.", url: "https://www.nih.gov" },
  { name: "Centers for Disease Control and Prevention (CDC)", desc: "Leading national public health institute of the United States protecting public health safety.", url: "https://www.cdc.gov" },
  { name: "Cleveland Clinic", desc: "Renowned academic medical center providing expert clinical care and health research.", url: "https://my.clevelandclinic.org" },
  { name: "Harvard Health Publishing", desc: "The authoritative consumer health education division of Harvard Medical School.", url: "https://www.health.harvard.edu" },
  { name: "Johns Hopkins Medicine", desc: "World-class biomedical research institution and premier medical school.", url: "https://www.hopkinsmedicine.org" },
  { name: "NHS (UK National Health Service)", desc: "Comprehensive publicly funded healthcare system providing trusted clinical guidelines.", url: "https://www.nhs.uk" },
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

  return (
    <main className="premium-page container-page py-12 sm:py-16 animate-cube-in">
      <div className="premium-glass surface rounded-3xl p-6 sm:p-10 shadow-sm transition-colors duration-300">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 text-xs font-bold uppercase tracking-wider mb-4 border border-teal-200/60 dark:border-teal-800/40">
            <Globe size={14} /> {t.badge}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            {t.title}
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400">
            {t.subtitle}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {topMedicalSources.map((source, idx) => (
            <a 
              key={idx} 
              href={source.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="premium-glass surface group p-6 rounded-3xl hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold text-xs">
                    #{idx + 1}
                  </span>
                  <ExternalLink size={18} className="text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {source.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {source.desc}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400">
                <span>{t.visitOfficial}</span>
                <ArrowRight size={13} className="rtl:-scale-x-100 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}