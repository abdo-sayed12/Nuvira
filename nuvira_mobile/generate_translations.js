const fs = require('fs');

const extractTranslations = (path, name) => {
    let content = fs.readFileSync(path, 'utf8');
    let regex = /const (translations|uiTranslations|navTranslations).*?= ({[\s\S]*?});/s;
    if (path.includes('HomePage')) regex = /const translations:.*?= ({[\s\S]*?});/s;
    
    let match = content.match(regex);
    if (!match) return null;
    let objText = match[2];
    
    // We can evaluate it
    let result;
    try {
        result = eval('(' + objText + ')');
    } catch (e) {
        // Fallback for tricky syntax
        let code = 'const result = ' + objText + '; module.exports = result;';
        fs.writeFileSync('temp_eval.js', code);
        result = require('./temp_eval.js');
        fs.unlinkSync('temp_eval.js');
    }
    return result;
}

const files = [
    { file: '../frontend/src/pages/HomePage.tsx', prefix: 'home_' },
    { file: '../frontend/src/pages/MedicalServices.tsx', prefix: 'services_' },
    { file: '../frontend/src/pages/SafetyPage.tsx', prefix: 'safety_' },
    { file: '../frontend/src/pages/SourcesPage.tsx', prefix: 'sources_' },
    { file: '../frontend/src/components/TopNav.tsx', prefix: 'nav_' }
];

let allLangs = ['ar', 'en', 'fr', 'de', 'es', 'it', 'ru', 'zh', 'ja', 'ko', 'tr'];
let finalDict = {};

allLangs.forEach(lang => {
    finalDict[lang] = {};
});

files.forEach(f => {
    try {
        let translations = extractTranslations(f.file, '');
        if (translations) {
            allLangs.forEach(lang => {
                if (translations[lang]) {
                    Object.keys(translations[lang]).forEach(k => {
                        finalDict[lang][f.prefix + k] = translations[lang][k];
                    });
                }
            });
        }
    } catch(e) {}
});

// Add extra custom strings
const extras = {
      'chat_history': { ar: 'سجل المحادثات', en: 'CHAT HISTORY' },
      'new_conversation': { ar: 'محادثة جديدة', en: 'New conversation' },
      'pinned': { ar: '📌 المحادثات المثبتة', en: '📌 PINNED' },
      'recent': { ar: '🕒 المحادثات الأخيرة', en: '🕒 RECENT' },
      'health_info_intel': { ar: 'ذكاء المعلومات الصحية', en: 'Health Information Intelligence' },
      'evidence_grounded_boundaries': { ar: 'مدعوم بالأدلة • حدود أمان سريرية محققة', en: 'Evidence-grounded • Verified clinical safety boundaries' },
      'copyright': { ar: '© 2026 نوفيرا - نظام الذكاء الصحي المبني على الأدلة', en: '© 2026 Nuvira · Evidence-Grounded Health Intelligence System' },
      'disclaimer': { ar: 'ليس خدمة تشخيصية. للحالات الطارئة، اتصل بخدمات الطوارئ فوراً.', en: 'Not a diagnostic service. For medical emergencies, contact local services immediately.' },
      'emergency': { ar: 'طوارئ', en: 'Emergency' },
      'welcome': { ar: 'مرحباً بك في نوفيرا. اطرح سؤالاً صحياً.', en: 'Welcome to Nuvira. Ask a health information question.' },
      'show_evidence': { ar: 'سأعرض لك الأدلة الطبية التي استندت إليها.', en: 'I will show the evidence I use.' },
      'ask_question': { ar: 'اسأل سؤالاً صحياً عاماً...', en: 'Ask a general health question...' },
      'suggestion_1': { ar: 'ما هي علامات التحذير من السكتة الدماغية؟', en: 'What are warning signs of a stroke?' },
      'suggestion_2': { ar: 'النظام الغذائي العام لمرض السكري؟', en: 'General diet for diabetes?' },
      'suggestion_3': { ar: 'كيف يحافظ النشاط البدني على الصحة؟', en: 'How does physical activity support health?' },
      'copy_question': { ar: 'نسخ السؤال', en: 'Copy Question' },
      'inline_edit': { ar: 'تعديل', en: 'Inline Edit' },
      'references': { ar: '📚 المراجع الطبية الداعمة', en: '📚 Supporting Medical References' },
      'read_aloud': { ar: 'قراءة النص', en: 'Read Aloud' },
      'copy': { ar: 'نسخ', en: 'Copy' },
};

Object.keys(extras).forEach(k => {
    finalDict['ar'][k] = extras[k]['ar'];
    finalDict['en'][k] = extras[k]['en'];
    // fill missing for other langs with EN
    allLangs.forEach(lang => {
        if (lang !== 'ar' && lang !== 'en') {
            finalDict[lang][k] = extras[k]['en'];
        }
    });
});

let output = `class AppTranslations {
  static const Map<String, Map<String, String>> translations = {
`;

allLangs.forEach(lang => {
    output += `    '${lang}': {\n`;
    Object.keys(finalDict[lang]).forEach(k => {
        let val = finalDict[lang][k];
        if (val) {
            val = val.replace(/'/g, "\\'").replace(/\n/g, '\\n');
            output += `      '${k}': '${val}',\n`;
        }
    });
    output += `    },\n`;
});

output += `  };

  static String get(String lang, String key) {
    if (!translations.containsKey(lang)) {
      lang = 'en';
    }
    return translations[lang]![key] ?? translations['en']![key] ?? key;
  }
}
`;

fs.writeFileSync('lib/theme/app_translations.dart', output);
console.log('Translations generated.');
