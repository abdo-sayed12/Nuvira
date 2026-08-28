import { useState, useEffect } from "react";
import { Activity, Stethoscope, Microscope, Calendar, Phone, Building2, Wallet, MessageCircle } from "lucide-react";

// هامش الربح الثابت الخاص بالتطبيق (تقدر تغيره في أي وقت)
const APP_COMMISSION = 50;

// رقم واتساب خدمة عملاء تطبيقك (حط رقمك هنا عشان الحجوزات تيجي عليه)
const ADMIN_WHATSAPP = "201000000000"; 

// ==========================================
// 1. قاموس الترجمة لواجهة الصفحة (11 لغة)
// ==========================================
const uiTranslations: Record<string, any> = {
  ar: { title: "الخدمات الطبية المعتمدة", subtitle: "احجز تحاليلك وأشعتك وعياداتك أونلاين بأسعار مخفضة حصرياً لحاملي تطبيق CARE360.", labs: "معامل التحاليل", scans: "مراكز الأشعة", clinics: "العيادات الطبية", currency: "ج.م", bookNow: "تأكيد الحجز (واتساب)", payment: "الدفع عبر فودافون كاش أو إنستاباي", phoneOnly: "هذه العيادة تتطلب الحجز الهاتفي المباشر حالياً", callNow: "اتصل الآن", msgHello: "مرحباً CARE360 👋%0Aأريد تأكيد حجز في:", msgTotal: "السعر الإجمالي:", msgPay: "برجاء إرسال تفاصيل الدفع." },
  en: { title: "Certified Medical Services", subtitle: "Book labs, scans, and clinics online at discounted prices exclusively for CARE360 users.", labs: "Laboratories", scans: "Scan Centers", clinics: "Clinics", currency: "EGP", bookNow: "Confirm Booking (WhatsApp)", payment: "Payment via Vodafone Cash or InstaPay", phoneOnly: "This clinic requires direct phone booking currently", callNow: "Call Now", msgHello: "Hello CARE360 👋%0AI want to confirm a booking at:", msgTotal: "Total Price:", msgPay: "Please send payment details." },
  fr: { title: "Services Médicaux Certifiés", subtitle: "Réservez laboratoires, scanners et cliniques en ligne à des prix réduits.", labs: "Laboratoires", scans: "Centres d'imagerie", clinics: "Cliniques", currency: "EGP", bookNow: "Confirmer la réservation", payment: "Paiement via Vodafone Cash ou InstaPay", phoneOnly: "Cette clinique nécessite une réservation par téléphone", callNow: "Appeler", msgHello: "Bonjour CARE360 👋%0AJe souhaite confirmer une réservation à:", msgTotal: "Prix total:", msgPay: "Veuillez envoyer les détails de paiement." },
  de: { title: "Zertifizierte Medizinische Dienste", subtitle: "Buchen Sie Labore, Scans und Kliniken online zu ermäßigten Preisen.", labs: "Labore", scans: "Scan-Zentren", clinics: "Kliniken", currency: "EGP", bookNow: "Buchung bestätigen", payment: "Zahlung über Vodafone Cash / InstaPay", phoneOnly: "Dieser Anbieter erfordert eine telefonische Buchung", callNow: "Jetzt anrufen", msgHello: "Hallo CARE360 👋%0AIch möchte eine Buchung bestätigen bei:", msgTotal: "Gesamtpreis:", msgPay: "Bitte senden Sie die Zahlungsdetails." },
  es: { title: "Servicios Médicos Certificados", subtitle: "Reserve laboratorios, escáneres y clínicas en línea a precios reducidos.", labs: "Laboratorios", scans: "Centros de escaneo", clinics: "Clínicas", currency: "EGP", bookNow: "Confirmar reserva", payment: "Pago a través de Vodafone Cash o InstaPay", phoneOnly: "Este proveedor requiere reserva telefónica directa", callNow: "Llamar ahora", msgHello: "Hola CARE360 👋%0AQuiero confirmar una reserva en:", msgTotal: "Precio total:", msgPay: "Por favor envíe los detalles de pago." },
  it: { title: "Servizi Medici Certificati", subtitle: "Prenota laboratori, scansioni e cliniche online a prezzi scontati.", labs: "Laboratori", scans: "Centri di scansione", clinics: "Cliniche", currency: "EGP", bookNow: "Conferma Prenotazione", payment: "Pagamento tramite Vodafone Cash o InstaPay", phoneOnly: "Questo fornitore richiede prenotazione telefonica", callNow: "Chiama ora", msgHello: "Ciao CARE360 👋%0AVoglio confermare una prenotazione presso:", msgTotal: "Prezzo totale:", msgPay: "Si prega di inviare i dettagli di pagamento." },
  ru: { title: "Сертифицированные медицинские услуги", subtitle: "Бронируйте лаборатории, сканирование и клиники онлайн со скидкой.", labs: "Лаборатории", scans: "Центры сканирования", clinics: "Клиники", currency: "EGP", bookNow: "Подтвердить бронирование", payment: "Оплата через Vodafone Cash или InstaPay", phoneOnly: "Этот провайдер требует бронирования по телефону", callNow: "Позвонить сейчас", msgHello: "Здравствуйте, CARE360 👋%0AЯ хочу подтвердить бронирование в:", msgTotal: "Итоговая цена:", msgPay: "Пожалуйста, отправьте реквизиты для оплаты." },
  zh: { title: "认证医疗服务", subtitle: "在线预订实验室、扫描和诊所，享受 CARE360 用户的专属折扣价。", labs: "实验室", scans: "影像中心", clinics: "诊所", currency: "EGP", bookNow: "确认预订 (WhatsApp)", payment: "通过 Vodafone Cash 或 InstaPay 付款", phoneOnly: "此提供商目前需要直接电话预订", callNow: "立即致电", msgHello: "你好 CARE360 👋%0A我想确认在以下地点的预订：", msgTotal: "总价：", msgPay: "请发送付款详情。" },
  ja: { title: "認定医療サービス", subtitle: "CARE360ユーザー限定の割引価格でオンライン予約が可能です。", labs: "研究所", scans: "スキャンセンター", clinics: "クリニック", currency: "EGP", bookNow: "予約を確定する", payment: "Vodafone Cash または InstaPay での支払い", phoneOnly: "このプロバイダーは電話予約が必要です", callNow: "今すぐ電話する", msgHello: "こんにちは CARE360 👋%0A以下の予約を確定したいです：", msgTotal: "合計金額：", msgPay: "支払いの詳細を送信してください。" },
  ko: { title: "인증된 의료 서비스", subtitle: "CARE360 사용자를 위한 할인된 가격으로 온라인 예약하세요.", labs: "실험실", scans: "스캔 센터", clinics: "클리닉", currency: "EGP", bookNow: "예약 확인", payment: "Vodafone Cash 또는 InstaPay를 통한 결제", phoneOnly: "이 제공업체는 전화 예약이 필요합니다", callNow: "지금 전화하기", msgHello: "안녕하세요 CARE360 👋%0A다음 예약 확인을 원합니다:", msgTotal: "총 가격:", msgPay: "결제 세부 정보를 보내주세요." },
  tr: { title: "Sertifikalı Tıbbi Hizmetler", subtitle: "Laboratuvarları, taramaları ve klinikleri indirimli fiyatlarla çevrimiçi ayırtın.", labs: "Laboratuvarlar", scans: "Tarama Merkezleri", clinics: "Klinikler", currency: "EGP", bookNow: "Rezervasyonu Onayla", payment: "Vodafone Cash veya InstaPay ile ödeme", phoneOnly: "Bu sağlayıcı doğrudan telefonla rezervasyon gerektirir", callNow: "Şimdi Ara", msgHello: "Merhaba CARE360 👋%0AŞu adresteki rezervasyonumu onaylamak istiyorum:", msgTotal: "Toplam Fiyat:", msgPay: "Lütfen ödeme detaylarını gönderin." }
};

// ==========================================
// 2. تحديث النوع ليدعم الترجمة (عربي وإنجليزي)
// ==========================================
type LocalizedText = { ar: string; en: string };

type Provider =
  | {
      id: number;
      name: LocalizedText;
      type: "lab" | "scan" | "clinic";
      description: LocalizedText;
      bookingType: "online";
      basePrice: number; // السعر الحقيقي للمعمل (الكود هيزود عليه العمولة أوتوماتيك)
      rating: string;
    }
  | {
      id: number;
      name: LocalizedText;
      type: "lab" | "scan" | "clinic";
      description: LocalizedText;
      bookingType: "phone";
      phone: string; // رقم العيادة لو الحجز بالتليفون العادي
      rating: string;
    };

// بيانات حقيقية وموسعة لأشهر المراكز والعيادات (مع دمج الترجمة)
const providers: Provider[] = [
  // ================= معامل التحاليل =================
  {
    id: 1,
    name: { ar: "معامل البرج", en: "Al Borg Labs" },
    type: "lab",
    description: { ar: "باقة تحاليل الاطمئنان الشامل (صورة دم، سكر، كبد، كلى).", en: "Comprehensive Checkup (CBC, Blood Sugar, Liver, Kidney)." },
    bookingType: "online",
    basePrice: 200, 
    rating: "4.9",
  },
  {
    id: 2,
    name: { ar: "معامل المختبر", en: "Al Mokhtabar Labs" },
    type: "lab",
    description: { ar: "تحاليل الغدة الدرقية والهرمونات والفيتامينات.", en: "Thyroid, Hormones, and Vitamins tests." },
    bookingType: "online",
    basePrice: 350, 
    rating: "4.8",
  },
  {
    id: 3,
    name: { ar: "معامل ألفا", en: "Alfa Labs" },
    type: "lab",
    description: { ar: "باقة دلالات الأورام والتحاليل المناعية المتقدمة.", en: "Tumor markers and advanced immunity profiles." },
    bookingType: "online",
    basePrice: 450, 
    rating: "4.7",
  },
  {
    id: 4,
    name: { ar: "معامل كايرو لاب", en: "Cairo Lab" },
    type: "lab",
    description: { ar: "تحاليل الحساسية واختبارات ما قبل الزواج الشاملة.", en: "Allergy testing and premarital comprehensive checkups." },
    bookingType: "phone",
    phone: "19400",
    rating: "4.6",
  },
  {
    id: 5,
    name: { ar: "رويال لاب", en: "Royal Lab" },
    type: "lab",
    description: { ar: "تحاليل السكر التراكمي ووظائف الكبد والكلى السريعة.", en: "HbA1c, fast liver and kidney functions tests." },
    bookingType: "online",
    basePrice: 280, 
    rating: "4.8",
  },

  // ================= مراكز الأشعة =================
  {
    id: 6,
    name: { ar: "مركز كايرو سكان", en: "Cairo Scan" },
    type: "scan",
    description: { ar: "أشعة مقطعية وموجات فوق صوتية بأحدث الأجهزة.", en: "CT Scans and Ultrasound with the latest technology." },
    bookingType: "online",
    basePrice: 500, 
    rating: "4.8",
  },
  {
    id: 7,
    name: { ar: "ألفا سكان", en: "Alfa Scan" },
    type: "scan",
    description: { ar: "أشعة رنين مغناطيسي (MRI) عالية الدقة المفتوحة.", en: "High-resolution Open MRI scans." },
    bookingType: "online",
    basePrice: 900, 
    rating: "4.9",
  },
  {
    id: 8,
    name: { ar: "تكنو سكان", en: "Techno Scan" },
    type: "scan",
    description: { ar: "أشعة بانوراما أسنان، وماموجرام رقمي للسيدات.", en: "Dental Panorama and Digital Mammogram." },
    bookingType: "phone",
    phone: "19234",
    rating: "4.7",
  },
  {
    id: 9,
    name: { ar: "مركز النيل للأشعة", en: "Nile Scan" },
    type: "scan",
    description: { ar: "مسح ذري بوزيتروني (PET/CT) وأشعة تداخلية.", en: "PET/CT and Interventional Radiology scans." },
    bookingType: "online",
    basePrice: 1500, 
    rating: "4.8",
  },
  {
    id: 10,
    name: { ar: "مركز مصر للأشعة", en: "Misr Radiology Center" },
    type: "scan",
    description: { ar: "موجات فوق صوتية ودوبلر ملون على الأوعية الدموية.", en: "Ultrasound and Color Doppler on blood vessels." },
    bookingType: "online",
    basePrice: 650, 
    rating: "4.6",
  },

  // ================= العيادات والمستشفيات =================
  {
    id: 11,
    name: { ar: "عيادة د. مجدي يعقوب (مركز أسوان)", en: "Dr. Magdi Yacoub Clinic" },
    type: "clinic",
    description: { ar: "استشاري جراحات القلب والأوعية الدموية.", en: "Consultant of Cardiovascular Surgery." },
    bookingType: "phone",
    phone: "19731",
    rating: "5.0",
  },
  {
    id: 12,
    name: { ar: "مستشفى كليوباترا", en: "Cleopatra Hospital" },
    type: "clinic",
    description: { ar: "كشف استشاري الباطنة والجهاز الهضمي والمناظير.", en: "Internal Medicine and Gastroenterology consultants." },
    bookingType: "online",
    basePrice: 400, 
    rating: "4.8",
  },
  {
    id: 13,
    name: { ar: "مستشفى دار الفؤاد", en: "Dar Al Fouad Hospital" },
    type: "clinic",
    description: { ar: "كشف استشاري أمراض المخ والأعصاب والعمود الفقري.", en: "Neurology and Spine Surgery consultants." },
    bookingType: "online",
    basePrice: 550, 
    rating: "4.9",
  },
  {
    id: 14,
    name: { ar: "مستشفى السعودي الألماني", en: "Saudi German Hospital" },
    type: "clinic",
    description: { ar: "كشف استشاري جراحة العظام وإصابات الملاعب المتقدمة.", en: "Orthopedic Surgery and Sports Injuries." },
    bookingType: "online",
    basePrice: 600, 
    rating: "4.7",
  },
  {
    id: 15,
    name: { ar: "عيادات أندلسية", en: "Andalusia Clinics" },
    type: "clinic",
    description: { ar: "كشف طب الأطفال وحديثي الولادة ورعاية المبتسرين.", en: "Pediatrics, Neonatology, and Premature Care." },
    bookingType: "phone",
    phone: "16781",
    rating: "4.8",
  },
  {
    id: 16,
    name: { ar: "مستشفى السلام الدولي", en: "As-Salam International Hospital" },
    type: "clinic",
    description: { ar: "كشف استشاري أمراض الصدر والجهاز التنفسي.", en: "Pulmonology and Respiratory System consultants." },
    bookingType: "online",
    basePrice: 700, 
    rating: "4.9",
  },
];

export function MedicalServices() {
  const [activeTab, setActiveTab] = useState<"lab" | "scan" | "clinic">("lab");

  // ==========================================
  // 3. الاستماع التلقائي لتغيير لغة التطبيق
  // ==========================================
  const [lang, setLang] = useState(document.documentElement.lang || 'ar');
  const isRtl = lang === 'ar';

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setLang(document.documentElement.lang || 'ar');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    return () => observer.disconnect();
  }, []);

  const t = uiTranslations[lang] || uiTranslations.en;
  
  // دالة ذكية لاختيار لغة النص حسب لغة التطبيق (تظهر عربي للعرب وإنجليزي للأجانب)
  const getLocText = (textObj: LocalizedText) => lang === 'ar' ? textObj.ar : textObj.en;

  const filteredProviders = providers.filter((p) => p.type === activeTab);

  // 🚀 الدالة الفعلية للحجز بالواتساب مع دعم اللغة
  const handleRealBooking = (providerName: string, finalPrice: number) => {
    const message = `${t.msgHello} *${providerName}*%0A${t.msgTotal} *${finalPrice} ${t.currency}*%0A${t.msgPay}`;
    const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="premium-page min-h-screen p-6 md:p-12 font-sans transition-colors duration-300" dir={isRtl ? "rtl" : "ltr"}>
      
      <header className="mb-10 text-center animate-cube-in">
        <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent inline-flex items-center gap-3">
          <Activity size={36} className="text-teal-500" />
          {t.title}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm md:text-base max-w-2xl mx-auto">
          {t.subtitle}
        </p>
      </header>

      <div className="flex justify-center gap-4 mb-10 overflow-x-auto pb-4 custom-scrollbar">
        <button
          onClick={() => setActiveTab("lab")}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm whitespace-nowrap ${
            activeTab === "lab"
              ? "bg-teal-600 text-white shadow-teal-600/30 scale-105"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-800"
          }`}
        >
          <Microscope size={20} /> {t.labs}
        </button>
        <button
          onClick={() => setActiveTab("scan")}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm whitespace-nowrap ${
            activeTab === "scan"
              ? "bg-emerald-600 text-white shadow-emerald-600/30 scale-105"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800"
          }`}
        >
          <Building2 size={20} /> {t.scans}
        </button>
        <button
          onClick={() => setActiveTab("clinic")}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm whitespace-nowrap ${
            activeTab === "clinic"
              ? "bg-blue-600 text-white shadow-blue-600/30 scale-105"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800"
          }`}
        >
          <Stethoscope size={20} /> {t.clinics}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {filteredProviders.map((provider) => {
          // 💡 المعادلة الديناميكية لحساب السعر النهائي للمريض
          const finalPriceForPatient = provider.bookingType === "online" 
            ? provider.basePrice + APP_COMMISSION 
            : 0;

          return (
            <div
              key={provider.id}
              className="premium-glass rounded-3xl p-6 shadow-xl flex flex-col transition-all hover:-translate-y-1 hover:shadow-2xl group animate-zipper"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  {getLocText(provider.name)}
                </h2>
                <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 text-xs font-black px-2.5 py-1 rounded-lg flex items-center gap-1 border border-yellow-200 dark:border-yellow-800 shrink-0">
                  ⭐ {provider.rating}
                </span>
              </div>
              
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 flex-1 leading-relaxed">
                {getLocText(provider.description)}
              </p>

              {provider.bookingType === "online" ? (
                <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-5">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-400 dark:text-slate-500 text-xs line-through font-semibold">
                      {finalPriceForPatient + 80} {t.currency}
                    </span>
                    <div className={`flex items-baseline gap-1 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                      <span className="text-3xl font-black text-teal-600 dark:text-teal-400">
                        {finalPriceForPatient}
                      </span>
                      <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{t.currency}</span>
                    </div>
                  </div>
                  
                  {/* الزرار الفعلي اللي بيحول لواتساب */}
                  <button
                    onClick={() => handleRealBooking(getLocText(provider.name), finalPriceForPatient)}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-teal-600/20"
                  >
                    <MessageCircle size={18} /> {t.bookNow}
                  </button>
                  <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-bold flex items-center justify-center gap-1">
                    <Wallet size={12} /> {t.payment}
                  </p>
                </div>
              ) : (
                <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-5">
                  <div className="mb-4">
                    <span className="block text-xs text-slate-400 dark:text-slate-500 mb-1 font-semibold text-center">
                      {t.phoneOnly}
                    </span>
                  </div>
                  
                  <a
                    href={`tel:${provider.phone}`}
                    className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
                  >
                    <Phone size={18} className="text-blue-500" /> {t.callNow}: <span dir="ltr">{provider.phone}</span>
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}