import { AlertTriangle, BookOpenCheck, ShieldAlert, Stethoscope } from "lucide-react";
import { EmergencyCard } from "../components/EmergencyCard";
import { useState, useEffect } from "react";

const translations: Record<string, any> = {
  en: { eyebrow: "Safety, scope, and transparency", title: "Useful health information needs clear boundaries.", desc: "Nuvira is a health-information assistant designed to help people understand trusted source material, not to replace professional judgement, emergency services, diagnosis, or individual treatment planning.", notDoctor: "Not a doctor", notDoctorDesc: "Nuvira cannot diagnose conditions, examine you, or prescribe individualized medication doses.", evidence: "Evidence shown", evidenceDesc: "Answers are intended to be grounded in retrieved source material, and their official links are displayed.", emergency: "Emergency escalation", emergencyDesc: "Potential emergency patterns trigger a prominent deterministic warning before any LLM response.", whenToUse: "When to use professional care", whenToUseDesc: "Seek urgent professional advice for severe, sudden, persistent, worsening, or worrying symptoms. If someone may be having a heart attack, stroke, severe bleeding, seizure, fainting episode, or serious breathing difficulty, contact local emergency services immediately." },
  ar: { eyebrow: "الأمان والشفافية", title: "المعلومات الصحية المفيدة تحتاج حدوداً واضحة.", desc: "Nuvira هو مساعد معلومات صحية مصمم لمساعدة الناس على فهم المواد الطبية الموثوقة، وليس بديلاً عن التشخيص المهني أو الطوارئ.", notDoctor: "ليس طبيباً", notDoctorDesc: "Nuvira لا يمكنه تشخيص حالتك أو وصف أدوية.", evidence: "الأدلة معروضة", evidenceDesc: "الإجابات مبنية على المصادر المسترجعة مع إرفاق روابطها الرسمية.", emergency: "تصعيد الطوارئ", emergencyDesc: "أنماط الطوارئ المحتملة تطلق تحذيراً فورياً قبل أي استجابة.", whenToUse: "متى تستعين بالرعاية المهنية", whenToUseDesc: "اطلب المشورة الطبية العاجلة لأي أعراض خطيرة أو مفاجئة. في حالات الأزمات القلبية أو النزيف الحاد، اتصل بالطوارئ فوراً." },
  fr: { eyebrow: "Sécurité et transparence", title: "Les informations de santé utiles nécessitent des limites claires.", desc: "Nuvira est un assistant conçu pour aider à comprendre les sources de santé fiables, sans remplacer le diagnostic professionnel.", notDoctor: "Pas un médecin", notDoctorDesc: "Nuvira ne peut pas diagnostiquer ni prescrire.", evidence: "Preuves affichées", evidenceDesc: "Les réponses sont basées sur des sources avec leurs liens.", emergency: "Escalade d'urgence", emergencyDesc: "Les urgences potentielles déclenchent un avertissement.", whenToUse: "Quand consulter un professionnel", whenToUseDesc: "Consultez un professionnel pour des symptômes graves ou soudains." },
  de: { eyebrow: "Sicherheit und Transparenz", title: "Nützliche Gesundheitsinformationen brauchen klare Grenzen.", desc: "Nuvira ist ein Assistent, der hilft, vertrauenswürdige Quellen zu verstehen. Es ersetzt keine ärztliche Diagnose.", notDoctor: "Kein Arzt", notDoctorDesc: "Nuvira kann nicht diagnostizieren oder verschreiben.", evidence: "Beweise angezeigt", evidenceDesc: "Antworten basieren auf abgerufenen Quellen.", emergency: "Notfalleskalation", emergencyDesc: "Mögliche Notfälle lösen eine Warnung aus.", whenToUse: "Wann professionelle Hilfe benötigt wird", whenToUseDesc: "Suchen Sie bei schweren Symptomen dringend ärztlichen Rat." },
  es: { eyebrow: "Seguridad y transparencia", title: "La información de salud útil necesita límites claros.", desc: "Nuvira es un asistente diseñado para ayudar a comprender fuentes confiables, no para reemplazar un diagnóstico profesional.", notDoctor: "No es médico", notDoctorDesc: "Nuvira no puede diagnosticar ni prescribir.", evidence: "Evidencia mostrada", evidenceDesc: "Las respuestas se basan en fuentes oficiales.", emergency: "Escalada de emergencia", emergencyDesc: "Las posibles emergencias activan una advertencia.", whenToUse: "Cuándo acudir a un profesional", whenToUseDesc: "Busque atención médica urgente para síntomas graves." },
  it: { eyebrow: "Sicurezza e trasparenza", title: "Le informazioni sanitarie utili necessitano di limiti chiari.", desc: "Nuvira aiuta a comprendere fonti affidabili, non sostituisce il medico.", notDoctor: "Non è un medico", notDoctorDesc: "Nuvira non può diagnosticare o prescrivere.", evidence: "Prove mostrate", evidenceDesc: "Le risposte si basano su fonti verificate.", emergency: "Escalation di emergenza", emergencyDesc: "Le emergenze attivano un avviso.", whenToUse: "Quando rivolgersi a un professionista", whenToUseDesc: "Richiedi consulenza urgente per sintomi gravi." },
  ru: { eyebrow: "Безопасность и прозрачность", title: "Полезная информация нуждается в границах.", desc: "Nuvira — это ассистент для понимания надежных источников, а не замена врача.", notDoctor: "Не врач", notDoctorDesc: "Nuvira не ставит диагнозы и не выписывает лекарства.", evidence: "Доказательства", evidenceDesc: "Ответы основаны на проверенных данных.", emergency: "Экстренные случаи", emergencyDesc: "При экстренной ситуации выдается предупреждение.", whenToUse: "Когда нужна помощь врача", whenToUseDesc: "При тяжелых симптомах обратитесь к врачу." },
  zh: { eyebrow: "安全性和透明度", title: "有用的健康信息需要明确的边界。", desc: "Nuvira 是一个健康信息助手，帮助人们理解可靠的医疗信息，而不是替代专业诊断。", notDoctor: "不是医生", notDoctorDesc: "Nuvira 不能诊断或开处方。", evidence: "显示证据", evidenceDesc: "回答基于检索到的来源。", emergency: "紧急升级", emergencyDesc: "潜在的紧急情况会触发警告。", whenToUse: "何时寻求专业护理", whenToUseDesc: "对于严重或突发症状，请寻求紧急专业建议。" },
  ja: { eyebrow: "安全性と透明性", title: "有用な健康情報には明確な境界が必要です。", desc: "Nuviraは、専門的な診断を代行するものではありません。", notDoctor: "医師ではありません", notDoctorDesc: "診断や処方はできません。", evidence: "示される証拠", evidenceDesc: "回答は情報源に基づいています。", emergency: "緊急時の対応", emergencyDesc: "緊急時には警告が表示されます。", whenToUse: "専門家のケアが必要な場合", whenToUseDesc: "深刻な症状の場合は医師に相談してください。" },
  ko: { eyebrow: "안전 및 투명성", title: "유용한 건강 정보는 명확한 경계가 필요합니다.", desc: "Nuvira은 전문적인 진단을 대신하지 않습니다.", notDoctor: "의사가 아님", notDoctorDesc: "진단하거나 처방할 수 없습니다.", evidence: "표시된 증거", evidenceDesc: "답변은 출처를 기반으로 합니다.", emergency: "비상 에스컬레이션", emergencyDesc: "잠재적인 응급 상황은 경고를 트리거합니다.", whenToUse: "전문가의 진료가 필요할 때", whenToUseDesc: "심각한 증상에 대해서는 의사의 진찰을 받으세요." },
  tr: { eyebrow: "Güvenlik ve şeffaflık", title: "Faydalı sağlık bilgilerinin net sınırlara ihtiyacı vardır.", desc: "Nuvira profesyonel teşhisin yerini almaz.", notDoctor: "Doktor değil", notDoctorDesc: "Nuvira teşhis koyamaz veya reçete yazamaz.", evidence: "Gösterilen kanıtlar", evidenceDesc: "Cevaplar resmi kaynaklara dayanır.", emergency: "Acil durum tırmanışı", emergencyDesc: "Acil durumlarda uyarı verilir.", whenToUse: "Ne zaman profesyonel yardım alınmalı", whenToUseDesc: "Ciddi belirtiler için derhal doktora başvurun." }
};

export function SafetyPage() {
  const [lang, setLang] = useState(document.documentElement.lang || 'en');
  useEffect(() => {
    const observer = new MutationObserver(() => setLang(document.documentElement.lang || 'en'));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    return () => observer.disconnect();
  }, []);
  const t = translations[lang] || translations.en;

  return (
    <main className="premium-page container-page py-12 sm:py-16 animate-cube-in transition-colors duration-300">
      <p className="eyebrow text-teal-600 dark:text-teal-400">{t.eyebrow}</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">{t.title}</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">{t.desc}</p>
      <div className="mt-10"><EmergencyCard arabic={lang === "ar"} /></div>
      <section className="mt-10 grid gap-6 md:grid-cols-3">
        <article className="premium-glass surface p-7 rounded-3xl hover:border-teal-300 dark:hover:border-teal-600 transition-colors">
          <Stethoscope className="text-teal-600 dark:text-teal-400" size={28} />
          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{t.notDoctor}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{t.notDoctorDesc}</p>
        </article>
        <article className="premium-glass surface p-7 rounded-3xl hover:border-teal-300 dark:hover:border-teal-600 transition-colors">
          <BookOpenCheck className="text-teal-600 dark:text-teal-400" size={28} />
          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{t.evidence}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{t.evidenceDesc}</p>
        </article>
        <article className="premium-glass surface p-7 rounded-3xl hover:border-teal-300 dark:hover:border-teal-600 transition-colors">
          <ShieldAlert className="text-teal-600 dark:text-teal-400" size={28} />
          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{t.emergency}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{t.emergencyDesc}</p>
        </article>
      </section>
      <section className="mt-10 rounded-3xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-900/10 p-7 shadow-sm">
        <div className="flex gap-4">
          <AlertTriangle className="shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" size={24} />
          <div>
            <h2 className="font-bold text-amber-950 dark:text-amber-400 text-lg">{t.whenToUse}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-amber-900/90 dark:text-amber-200/80">{t.whenToUseDesc}</p>
          </div>
        </div>
      </section>
    </main>
  );
}