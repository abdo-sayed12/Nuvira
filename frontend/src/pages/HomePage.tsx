import { Activity, Apple, ArrowRight, BedDouble, Brain, Dumbbell, HeartPulse, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useState, useEffect } from "react";
import { AnimatedWaveText } from "../components/AnimatedWaveText";

const translations: Record<string, any> = {
  en: { eyebrow: "Evidence before answers", title1: "Your Evidence-Grounded", title2: "Health Assistant", desc: "Get clear health information grounded in trusted medical sources. Nuvira makes its evidence visible, so you can explore everyday health questions with context—not guesswork.", start: "Start a conversation", explore: "Explore topics", disclaimer: "Nuvira provides educational information only. It does not diagnose, prescribe personal doses, or replace a clinician or emergency services.", signal: "Care signal", signalTitle: "Helpful, transparent, careful.", grounded: "Grounded answers", groundedDesc: "Retrieved evidence informs every answer. If the evidence is not enough, Nuvira says so.", aware: "Emergency-aware by design", awareDesc: "Potential emergency signals receive a prominent, immediate safety message.", familiar: "Start somewhere familiar", everyday: "Everyday health topics", askOwn: "Ask your own question →", t1: "Heart health", d1: "Learn about warning signs and cardiovascular wellbeing.", t2: "Blood pressure", d2: "Evidence-led information on hypertension.", t3: "Diabetes", d3: "General education from trusted global health sources.", t4: "Pain & posture", d4: "Back, neck, ergonomics, and movement wellbeing.", t5: "Sleep & wellness", d5: "Healthy routines that support daily wellbeing.", t6: "Digestive health", d6: "Educational information on IBS and common topics.", exploreTopic: "Explore →" },
  ar: { eyebrow: "الأدلة قبل الإجابات", title1: "مساعدك الصحي المبني", title2: "على الأدلة الطبية", desc: "احصل على معلومات صحية واضحة من مصادر طبية موثوقة. Nuvira يوضح مصادره لتستكشف أسئلتك اليومية بناءً على سياق علمي، وليس التخمين.", start: "ابدأ محادثة", explore: "استكشف المواضيع", disclaimer: "Nuvira يقدم معلومات تعليمية فقط. ولا يُشخص أو يصف أدوية أو يحل محل الطبيب أو الطوارئ.", signal: "إشارة العناية", signalTitle: "مفيد، شفاف، وحذر.", grounded: "إجابات موثقة", groundedDesc: "الأدلة توجه كل إجابة. إذا كانت الأدلة غير كافية، سيخبرك النظام بذلك.", aware: "الوعي بحالات الطوارئ", awareDesc: "إشارات الطوارئ المحتملة تتلقى رسالة تحذيرية واضحة وفورية.", familiar: "ابدأ من مكان مألوف", everyday: "مواضيع صحية يومية", askOwn: "اسأل سؤالك الخاص ←", t1: "صحة القلب", d1: "تعرف على العلامات التحذيرية وسلامة القلب.", t2: "ضغط الدم", d2: "معلومات موثقة حول ارتفاع ضغط الدم.", t3: "السكري", d3: "تعليم عام من مصادر صحية عالمية موثوقة.", t4: "الألم والوضعية", d4: "صحة الظهر، الرقبة، وبيئة العمل.", t5: "النوم والراحة", d5: "روتين صحي يدعم العافية اليومية.", t6: "صحة الجهاز الهضمي", d6: "معلومات تعليمية حول القولون والمواضيع الشائعة.", exploreTopic: "استكشف ←" },
  fr: { eyebrow: "Les preuves avant les réponses", title1: "Votre Assistant de Santé", title2: "Basé sur des Preuves", desc: "Obtenez des informations de santé claires basées sur des sources fiables.", start: "Commencer une conversation", explore: "Explorer les sujets", disclaimer: "Informations éducatives uniquement. Ne remplace pas un médecin.", signal: "Signal de soin", signalTitle: "Utile, transparent, prudent.", grounded: "Réponses documentées", groundedDesc: "Basé sur les preuves récupérées.", aware: "Conscient des urgences", awareDesc: "Les signaux d'urgence reçoivent un avertissement immédiat.", familiar: "Commencez par un sujet", everyday: "Sujets de santé quotidiens", askOwn: "Posez votre propre question →", t1: "Santé cardiaque", d1: "Signes d'alerte et bien-être.", t2: "Pression artérielle", d2: "Hypertension et surveillance.", t3: "Diabète", d3: "Éducation générale des sources de confiance.", t4: "Douleur et posture", d4: "Dos, cou et ergonomie.", t5: "Sommeil et bien-être", d5: "Routines saines pour le bien-être.", t6: "Santé digestive", d6: "Informations sur la digestion.", exploreTopic: "Explorer →" },
  de: { eyebrow: "Beweise vor Antworten", title1: "Ihr evidenzbasierter", title2: "Gesundheitsassistent", desc: "Erhalten Sie klare Gesundheitsinformationen aus vertrauenswürdigen Quellen.", start: "Unterhaltung beginnen", explore: "Themen erkunden", disclaimer: "Nur zu Bildungszwecken. Ersetzt keinen Arzt.", signal: "Pflegesignal", signalTitle: "Hilfreich, transparent, vorsichtig.", grounded: "Fundierte Antworten", groundedDesc: "Basierend auf abgerufenen Beweisen.", aware: "Notfallbewusst", awareDesc: "Notfallsignale erhalten sofortige Warnungen.", familiar: "Beginnen Sie hier", everyday: "Alltägliche Gesundheitsthemen", askOwn: "Eigene Frage stellen →", t1: "Herzgesundheit", d1: "Warnzeichen und Wohlbefinden.", t2: "Blutdruck", d2: "Informationen zu Bluthochdruck.", t3: "Diabetes", d3: "Allgemeine Bildung aus vertrauenswürdigen Quellen.", t4: "Schmerz & Haltung", d4: "Rücken, Nacken und Ergonomie.", t5: "Schlaf & Wellness", d5: "Gesunde Routinen.", t6: "Verdauung", d6: "Informationen zur Verdauung.", exploreTopic: "Erkunden →" },
  es: { eyebrow: "Evidencia antes de respuestas", title1: "Tu Asistente de Salud", title2: "Basado en Evidencia", desc: "Obtén información clara basada en fuentes médicas confiables.", start: "Iniciar conversación", explore: "Explorar temas", disclaimer: "Solo información educativa. No reemplaza a un médico.", signal: "Señal de cuidado", signalTitle: "Útil, transparente, cuidadoso.", grounded: "Respuestas fundamentadas", groundedDesc: "Respaldado por evidencia recuperada.", aware: "Consciente de emergencias", awareDesc: "Las señales de emergencia reciben una alerta.", familiar: "Comienza aquí", everyday: "Temas de salud diarios", askOwn: "Haz tu propia pregunta →", t1: "Salud del corazón", d1: "Señales de advertencia y bienestar.", t2: "Presión arterial", d2: "Información sobre hipertensión.", t3: "Diabetes", d3: "Educación general de fuentes confiables.", t4: "Dolor y postura", d4: "Espalda, cuello y ergonomía.", t5: "Sueño y bienestar", d5: "Rutinas saludables.", t6: "Salud digestiva", d6: "Información sobre digestión.", exploreTopic: "Explorar →" },
  it: { eyebrow: "Prove prima delle risposte", title1: "Il tuo Assistente Sanitario", title2: "Basato sulle Prove", desc: "Ottieni informazioni chiare sulla salute da fonti affidabili.", start: "Inizia conversazione", explore: "Esplora argomenti", disclaimer: "Solo informazioni educative.", signal: "Segnale di cura", signalTitle: "Utile, trasparente.", grounded: "Risposte fondate", groundedDesc: "Basate su prove recuperate.", aware: "Consapevole delle emergenze", awareDesc: "I segnali di emergenza ricevono un avviso.", familiar: "Inizia da qui", everyday: "Argomenti di salute", askOwn: "Fai la tua domanda →", t1: "Salute del cuore", d1: "Segnali di pericolo.", t2: "Pressione sanguigna", d2: "Info sull'ipertensione.", t3: "Diabete", d3: "Educazione generale.", t4: "Dolore e postura", d4: "Schiena e postura.", t5: "Sonno e benessere", d5: "Routine sane.", t6: "Salute digestiva", d6: "Informazioni sull'apparato digerente.", exploreTopic: "Esplora →" },
  ru: { eyebrow: "Доказательства прежде всего", title1: "Ваш медицинский ассистент", title2: "На основе доказательств", desc: "Получайте понятную информацию из надежных источников.", start: "Начать разговор", explore: "Темы", disclaimer: "Только в образовательных целях.", signal: "Сигнал заботы", signalTitle: "Полезный, прозрачный.", grounded: "Обоснованные ответы", groundedDesc: "На основе проверенных данных.", aware: "Учет экстренных ситуаций", awareDesc: "Предупреждения об опасности.", familiar: "Начните здесь", everyday: "Повседневные темы здоровья", askOwn: "Задать свой вопрос →", t1: "Здоровье сердца", d1: "Признаки заболеваний.", t2: "Кровяное давление", d2: "Информация о гипертонии.", t3: "Диабет", d3: "Общая информация.", t4: "Боль и осанка", d4: "Спина и эргономика.", t5: "Сон и здоровье", d5: "Здоровые привычки.", t6: "Пищеварение", d6: "Информация о пищеварении.", exploreTopic: "Изучить →" },
  zh: { eyebrow: "证据先于答案", title1: "您的基于证据的", title2: "健康助手", desc: "从可靠的医疗来源获取清晰的健康信息。", start: "开始对话", explore: "探索主题", disclaimer: "仅提供教育信息。不替代医生。", signal: "关怀信号", signalTitle: "有用，透明，谨慎。", grounded: "有根据的答案", groundedDesc: "每个答案都基于检索到的证据。", aware: "紧急情况意识", awareDesc: "紧急信号会立即收到安全警告。", familiar: "从熟悉的开始", everyday: "日常健康主题", askOwn: "提出您自己的问题 →", t1: "心脏健康", d1: "了解警告信号。", t2: "血压", d2: "高血压的循证信息。", t3: "糖尿病", d3: "一般健康教育。", t4: "疼痛与姿势", d4: "背部，颈部和人体工程学。", t5: "睡眠与健康", d5: "健康的日常生活。", t6: "消化健康", d6: "消化系统信息。", exploreTopic: "探索 →" },
  ja: { eyebrow: "答えの前に証拠を", title1: "証拠に基づいた", title2: "あなたの健康アシスタント", desc: "信頼できる医療情報源からの明確な情報を。", start: "会話を始める", explore: "トピックを見る", disclaimer: "教育目的のみです。医師の代わりにはなりません。", signal: "ケアシグナル", signalTitle: "有用、透明、慎重。", grounded: "根拠のある回答", groundedDesc: "検索された証拠に基づいています。", aware: "緊急時の対応", awareDesc: "緊急の兆候には警告を発します。", familiar: "身近なことから", everyday: "日常の健康トピック", askOwn: "自分で質問する →", t1: "心臓の健康", d1: "警告サインと健康。", t2: "血圧", d2: "高血圧について。", t3: "糖尿病", d3: "一般的な教育。", t4: "痛みと姿勢", d4: "背中、首、人間工学。", t5: "睡眠と健康", d5: "健康的な習慣。", t6: "消化器の健康", d6: "消化に関する情報。", exploreTopic: "見る →" },
  ko: { eyebrow: "답변 전 증거", title1: "당신의 증거 기반", title2: "건강 어시스턴트", desc: "신뢰할 수 있는 정보원으로부터 명확한 건강 정보를 얻으세요.", start: "대화 시작하기", explore: "주제 탐색하기", disclaimer: "교육 목적으로만 제공됩니다. 의사를 대신하지 않습니다.", signal: "케어 신호", signalTitle: "유용하고 투명하며 신중함.", grounded: "근거 있는 답변", groundedDesc: "검색된 증거를 기반으로 합니다.", aware: "비상 상황 인식", awareDesc: "비상 신호에는 즉각적인 경고가 제공됩니다.", familiar: "익숙한 것부터 시작", everyday: "일상적인 건강 주제", askOwn: "질문하기 →", t1: "심장 건강", d1: "경고 신호 및 웰빙.", t2: "혈압", d2: "고혈압에 대한 정보.", t3: "당뇨병", d3: "일반적인 교육.", t4: "통증 및 자세", d4: "등, 목, 인체공학.", t5: "수면 및 웰빙", d5: "건강한 일상.", t6: "소화기 건강", d6: "소화에 대한 정보.", exploreTopic: "탐색 →" },
  tr: { eyebrow: "Cevaplardan önce kanıt", title1: "Kanıta Dayalı", title2: "Sağlık Asistanınız", desc: "Güvenilir tıbbi kaynaklara dayanan net sağlık bilgileri alın.", start: "Sohbet başlat", explore: "Konuları keşfet", disclaimer: "Yalnızca eğitim amaçlıdır. Bir doktorun yerini almaz.", signal: "Bakım sinyali", signalTitle: "Yardımcı, şeffaf, dikkatli.", grounded: "Temellendirilmiş cevaplar", groundedDesc: "Cevaplar kanıtlara dayanır.", aware: "Acil durum farkındalığı", awareDesc: "Acil durumlarda hemen uyarı verilir.", familiar: "Bildik bir yerden başla", everyday: "Günlük sağlık konuları", askOwn: "Kendi sorunuzu sorun →", t1: "Kalp sağlığı", d1: "Uyarı işaretleri ve sağlık.", t2: "Kan basıncı", d2: "Hipertansiyon hakkında bilgi.", t3: "Diyabet", d3: "Genel eğitim.", t4: "Ağrı ve duruş", d4: "Sırt, boyun ve ergonomi.", t5: "Uyku ve yaşam", d5: "Sağlıklı rutinler.", t6: "Sindirim sağlığı", d6: "Sindirim hakkında bilgi.", exploreTopic: "Keşfet →" }
};

export function HomePage({ startChat }: { startChat: (prompt?: string) => void }) {
  const [lang, setLang] = useState(document.documentElement.lang || 'en');
  const shouldReduceMotion = useReducedMotion();
  useEffect(() => {
    const observer = new MutationObserver(() => setLang(document.documentElement.lang || 'en'));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    return () => observer.disconnect();
  }, []);
  
  const t = translations[lang] || translations.en;

  const topics = [
    [HeartPulse, t.t1, t.d1],
    [Activity, t.t2, t.d2],
    [Apple, t.t3, t.d3],
    [Dumbbell, t.t4, t.d4],
    [BedDouble, t.t5, t.d5],
    [Brain, t.t6, t.d6],
  ] as const;

  return (
    <main className="premium-page animate-cube-in transition-colors duration-300">
      <section className="container-page grid gap-12 py-16 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease: [0.22, 1, 0.36, 1] }}>
          <p className="eyebrow text-teal-600 dark:text-teal-400">{t.eyebrow}</p>
          <motion.h1
            aria-label={`${t.title1} ${t.title2}`}
            className="font-display mt-4 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl"
          >
            <AnimatedWaveText text={t.title1} />{" "}
            <span className="text-teal-600 dark:text-teal-400">
              <AnimatedWaveText text={t.title2} />
            </span>
          </motion.h1>
          <motion.p
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: shouldReduceMotion ? 0.15 : 0.7, delay: shouldReduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-2xl text-lg leading-8 text-slate-300"
          >{t.desc}</motion.p>
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: shouldReduceMotion ? 0.15 : 0.6, delay: shouldReduceMotion ? 0 : 1.02, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <motion.button whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.02 }} whileTap={shouldReduceMotion ? undefined : { scale: 0.975 }} transition={{ type: "spring", stiffness: 380, damping: 28 }} className="button-primary text-base px-6 py-3" onClick={() => startChat()}>{t.start} <ArrowRight size={19} className="rtl:-scale-x-100 inline-block ml-2 rtl:mr-2 rtl:ml-0" /></motion.button>
            <motion.button whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.015 }} whileTap={shouldReduceMotion ? undefined : { scale: 0.975 }} transition={{ type: "spring", stiffness: 380, damping: 28 }} className="button-secondary button-glass text-base px-6 py-3" onClick={() => document.getElementById("topics")?.scrollIntoView({ behavior: "smooth" })}>{t.explore}</motion.button>
          </motion.div>
          <p className="mt-6 max-w-xl text-xs leading-5 text-slate-500">{t.disclaimer}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .7, delay: .1 }} className="premium-glass surface overflow-hidden p-6 sm:p-8 shadow-xl rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">{t.signal}</p>
              <h2 className="font-display mt-1 text-2xl font-bold text-white"><AnimatedWaveText text={t.signalTitle} /></h2>
            </div>
            <span className="rounded-2xl bg-teal-100/80 dark:bg-teal-900/50 p-3 text-teal-700 dark:text-teal-300"><ShieldCheck size={32} /></span>
          </div>
          <div className="mt-7 space-y-4">
            <div className="premium-glass rounded-2xl p-4 shadow-sm">
              <div className="flex gap-3.5">
                <Sparkles className="shrink-0 text-teal-600 dark:text-teal-400 mt-0.5" size={20} />
                <div>
                  <h3 className="font-display font-bold text-white">{t.grounded}</h3>
                  <p className="mt-1 text-sm leading-5 text-slate-400">{t.groundedDesc}</p>
                </div>
              </div>
            </div>
            <div className="premium-glass rounded-2xl p-4 shadow-sm">
              <div className="flex gap-3.5">
                <Stethoscope className="shrink-0 text-teal-600 dark:text-teal-400 mt-0.5" size={20} />
                <div>
                  <h3 className="font-display font-bold text-white">{t.aware}</h3>
                  <p className="mt-1 text-sm leading-5 text-slate-400">{t.awareDesc}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="topics" className="border-y border-white/10 bg-slate-950/20 py-16 transition-colors duration-300">
        <div className="container-page">
          <p className="eyebrow text-teal-600 dark:text-teal-400">{t.familiar}</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-bold tracking-tight text-white"><AnimatedWaveText text={t.everyday} /></h2>
            <button onClick={() => startChat()} className="text-sm font-bold text-teal-700 dark:text-teal-400 hover:text-teal-800 transition">{t.askOwn}</button>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map(([Icon, title, description]) => (
              <button key={title as string} onClick={() => startChat(`Tell me about ${title}.`)} className="premium-glass group p-6 text-left rtl:text-right transition hover:-translate-y-1 hover:border-cyan-300/50 hover:shadow-xl rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 flex items-center justify-center text-cyan-300 group-hover:bg-cyan-400 group-hover:text-slate-950 transition-colors">
                  <Icon size={24} />
                </div>
                <h3 className="font-display mt-5 text-lg font-bold text-white">{title as string}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{description as string}</p>
                <span className="mt-5 inline-block text-sm font-bold text-teal-700 dark:text-teal-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">{t.exploreTopic}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}