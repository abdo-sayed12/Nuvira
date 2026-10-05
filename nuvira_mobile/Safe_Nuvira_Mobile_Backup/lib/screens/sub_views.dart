import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/app_localization.dart';
import '../theme/app_theme.dart';
import '../widgets/emergency_modal.dart';

class WebEmergencyFooter extends StatelessWidget {
  final String lang;
  const WebEmergencyFooter({super.key, required this.lang});

  @override
  Widget build(BuildContext context) {
    final t = (String k) => AppLocalization.tr(lang, k);
    final isAr = lang.toLowerCase() == 'ar';
    return Container(
      margin: const EdgeInsets.only(top: 28),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF040811).withOpacity(0.95),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.07)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.dangerRed,
                  foregroundColor: Colors.white,
                  elevation: 8,
                  shadowColor: AppTheme.dangerRed.withOpacity(0.5),
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: () => EmergencyModal.show(context, lang),
                icon: const Icon(Icons.warning_amber_rounded, size: 19),
                label: Text(
                  t('emergency'),
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  t('tagline'),
                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            isAr
                ? 'ليست خدمة تشخيص طبي. في حالات الطوارئ الطبية، اتصل بخدمات الإسعاف المحلية فوراً.'
                : 'Not a diagnostic service. For medical emergencies, contact local services immediately.',
            style: const TextStyle(
              color: AppTheme.turquoise,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class HomeView extends StatelessWidget {
  final String lang;
  final VoidCallback onStartChat;
  final VoidCallback onExploreServices;

  const HomeView({
    super.key,
    required this.lang,
    required this.onStartChat,
    required this.onExploreServices,
  });

  @override
  Widget build(BuildContext context) {
    final t = (String k) => AppLocalization.tr(lang, k);
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(18, 22, 18, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            t('hero_badge').replaceAll('✨ ', '').toUpperCase(),
            style: const TextStyle(
              color: AppTheme.turquoise,
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.4,
            ),
          ),
          const SizedBox(height: 12),
          ShaderMask(
            shaderCallback: (bounds) => const LinearGradient(
              colors: [Color(0xFF34D399), Color(0xFF10B981), Color(0xFF00D4B2)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ).createShader(bounds),
            child: Text(
              t('hero_title'),
              style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    height: 1.18,
                  ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            t('hero_desc'),
            style: const TextStyle(color: AppTheme.mutedText, fontSize: 14.5, height: 1.6),
          ),
          const SizedBox(height: 24),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              Container(
                decoration: BoxDecoration(
                  gradient: AppTheme.emeraldButtonGradient,
                  borderRadius: BorderRadius.circular(30),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.emerald.withOpacity(0.4),
                      blurRadius: 18,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                  ),
                  onPressed: onStartChat,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(t('start_chat_btn'), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5)),
                      const SizedBox(width: 8),
                      const Icon(Icons.arrow_forward_rounded, size: 18),
                    ],
                  ),
                ),
              ),
              OutlinedButton(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  backgroundColor: Colors.white.withOpacity(0.03),
                  side: BorderSide(color: Colors.white.withOpacity(0.16)),
                  padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                ),
                onPressed: onExploreServices,
                child: Text(
                  t('explore_services_btn'),
                  style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.w700, fontSize: 14),
                ),
              ),
            ],
          ),
          const SizedBox(height: 28),
          // بطاقة CARE SIGNAL المطابقة لموقع الويب
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              gradient: AppTheme.webCardGradient,
              borderRadius: BorderRadius.circular(26),
              border: Border.all(color: Colors.white.withOpacity(0.09)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.45),
                  blurRadius: 24,
                  offset: const Offset(0, 12),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.verified_user_rounded, color: AppTheme.turquoise, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      t('care_signal').toUpperCase(),
                      style: const TextStyle(
                        color: AppTheme.turquoise,
                        fontWeight: FontWeight.w800,
                        fontSize: 12.5,
                        letterSpacing: 1.1,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  t('care_title'),
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, height: 1.25),
                ),
                const SizedBox(height: 18),
                _webInnerSignalCard(
                  Icons.description_outlined,
                  t('grounded_title'),
                  t('grounded_desc'),
                ),
                const SizedBox(height: 12),
                _webInnerSignalCard(
                  Icons.health_and_safety_outlined,
                  t('emerg_aware_title'),
                  t('emerg_aware_desc'),
                ),
              ],
            ),
          ),
          WebEmergencyFooter(lang: lang),
        ],
      ),
    );
  }

  Widget _webInnerSignalCard(IconData icon, String title, String subtitle) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF111D30).withOpacity(0.85),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFF0A2E2A),
              borderRadius: BorderRadius.circular(13),
              border: Border.all(color: AppTheme.turquoise.withOpacity(0.25)),
            ),
            child: Icon(icon, color: AppTheme.turquoise, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15.5)),
                const SizedBox(height: 5),
                Text(subtitle, style: const TextStyle(color: AppTheme.mutedText, fontSize: 13, height: 1.45)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class SourcesView extends StatelessWidget {
  final String lang;
  const SourcesView({super.key, required this.lang});

  static const List<Map<String, String>> _sources = [
    {'rank': '#1', 'name': 'World Health Organization (WHO)', 'arName': 'منظمة الصحة العالمية (WHO)', 'desc': 'The directing and coordinating authority for health within the United Nations system.', 'arDesc': 'السلطة التوجيهية والتنسيقية للصحة العامة والمبادئ السريرية ضمن منظومة الأمم المتحدة.', 'url': 'https://www.who.int'},
    {'rank': '#2', 'name': 'Mayo Clinic', 'arName': 'مايو كلينك (Mayo Clinic)', 'desc': 'Top-ranked hospital and medical research center for clinical excellence and patient care.', 'arDesc': 'أعلى مستشفى ومركز أبحاث طبية عالمي للتميز السريري ورعاية المرضى.', 'url': 'https://www.mayoclinic.org'},
    {'rank': '#3', 'name': 'National Institutes of Health (NIH)', 'arName': 'المعاهد الوطنية للصحة (NIH)', 'desc': 'The primary agency of the U.S. government responsible for biomedical and public health research.', 'arDesc': 'الوكالة الحكومية الرئيسية المسؤولة عن الأبحاث الطبية الحيوية وأبحاث الصحة العامة.', 'url': 'https://www.nih.gov'},
    {'rank': '#4', 'name': 'Centers for Disease Control (CDC)', 'arName': 'مراكز مكافحة الأمراض والوقاية منها (CDC)', 'desc': 'Leading national public health institute dedicated to protecting public health and safety.', 'arDesc': 'المعهد الوطني الرائد المكرس لحماية الصحة العامة والسلامة الطبية والوقاية من الأمراض.', 'url': 'https://www.cdc.gov'},
    {'rank': '#5', 'name': 'Cleveland Clinic', 'arName': 'كليفلاند كلينك (Cleveland Clinic)', 'desc': 'Renowned academic medical center providing expert clinical care and peer-reviewed guidelines.', 'arDesc': 'مركز طبي أكاديمي مرموق يقدم رعاية سريرية متخصصة وإرشادات طبية محكمة.', 'url': 'https://my.clevelandclinic.org'},
    {'rank': '#6', 'name': 'Cochrane Library', 'arName': 'مكتبة كوكرين الطبية (Cochrane)', 'desc': 'Global independent network of researchers producing high-quality systematic health reviews.', 'arDesc': 'شبكة عالمية مستقلة من الباحثين والأطباء لإنتاج مراجعات منهجية عالية الجودة للأدلة الطبية.', 'url': 'https://www.cochranelibrary.com'},
    {'rank': '#7', 'name': 'Johns Hopkins Medicine', 'arName': 'جونز هوبكنز الطبية (Johns Hopkins)', 'desc': 'World-class biomedical research institution and trusted clinical authority.', 'arDesc': 'مؤسسة أبحاث طبية حيوية عالمية ومرجعية سريرية موثوقة في كافة التخصصات.', 'url': 'https://www.hopkinsmedicine.org'},
    {'rank': '#8', 'name': 'NHS (UK)', 'arName': 'هيئة الخدمات الصحية الوطنية البريطانية (NHS)', 'desc': 'Comprehensive publicly funded healthcare system providing trusted clinical guidance.', 'arDesc': 'نظام الرعاية الصحية البريطاني المعتمد لتقديم الأدلة السريرية الموثوقة.', 'url': 'https://www.nhs.uk'},
    {'rank': '#9', 'name': 'MedlinePlus', 'arName': 'ميدلاين بلس (MedlinePlus)', 'desc': 'The world’s largest medical library service provided by the National Library of Medicine.', 'arDesc': 'أكبر خدمة مكتبة طبية في العالم مقدمة من المكتبة الوطنية للطب.', 'url': 'https://medlineplus.gov'},
    {'rank': '#10', 'name': 'WebMD', 'arName': 'ويب إم دي (WebMD)', 'desc': 'Leading provider of health information services, clinical reference, and medical news.', 'arDesc': 'المزود الرائد لخدمات المعلومات الصحية والمراجع السريرية والدوائية الموثقة.', 'url': 'https://www.webmd.com'},
  ];

  @override
  Widget build(BuildContext context) {
    final t = (String k) => AppLocalization.tr(lang, k);
    final isAr = lang.toLowerCase() == 'ar';

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(18, 20, 18, 32),
      itemCount: _sources.length + 2,
      itemBuilder: (context, index) {
        // الهيدر المركزي الفخم المطابق لصورة الويب
        if (index == 0) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF092626),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppTheme.turquoise.withOpacity(0.35)),
                  ),
                  child: Text(
                    t('sources_badge'),
                    style: const TextStyle(
                      color: AppTheme.turquoise,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.1,
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  t('sources_title'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 30,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    height: 1.18,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  t('sources_desc'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: AppTheme.mutedText,
                    fontSize: 14,
                    height: 1.55,
                  ),
                ),
              ],
            ),
          );
        }

        if (index == _sources.length + 1) {
          return WebEmergencyFooter(lang: lang);
        }

        // كارت المصدر المطابق 100% لتصميم الويب الأصلي
        final s = _sources[index - 1];
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            gradient: AppTheme.webCardGradient,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.white.withOpacity(0.08)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.35),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(24),
              onTap: () async {
                final uri = Uri.parse(s['url']!);
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              },
              child: Padding(
                padding: const EdgeInsets.all(22),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // الصف العلوي: شارة الرقم #1 على اليسار وأيقونة الفتح على اليمين
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 7),
                          decoration: BoxDecoration(
                            color: const Color(0xFF072222),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppTheme.turquoise.withOpacity(0.25)),
                          ),
                          child: Text(
                            s['rank']!,
                            style: const TextStyle(
                              color: AppTheme.turquoise,
                              fontWeight: FontWeight.w900,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        const Icon(
                          Icons.open_in_new_rounded,
                          color: Colors.white38,
                          size: 19,
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    // اسم الجهة الطبية بخط عريض وبارز
                    Text(
                      isAr ? s['arName']! : s['name']!,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 20,
                        height: 1.25,
                      ),
                    ),
                    const SizedBox(height: 10),
                    // الوصف الطبي
                    Text(
                      isAr ? s['arDesc']! : s['desc']!,
                      style: const TextStyle(
                        color: AppTheme.mutedText,
                        fontSize: 13.5,
                        height: 1.55,
                      ),
                    ),
                    const SizedBox(height: 18),
                    // رابط VISIT OFFICIAL SITE → باللون الفيروزي
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          t('visit_site').replaceAll('↗', '').trim().toUpperCase(),
                          style: const TextStyle(
                            color: AppTheme.turquoise,
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1.1,
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Icon(
                          Icons.arrow_forward_rounded,
                          color: AppTheme.turquoise,
                          size: 15,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class SafetyView extends StatelessWidget {
  final String lang;
  const SafetyView({super.key, required this.lang});

  @override
  Widget build(BuildContext context) {
    final t = (String k) => AppLocalization.tr(lang, k);
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(18, 20, 18, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF092626),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.turquoise.withOpacity(0.35)),
            ),
            child: Text(
              t('safety_badge'),
              style: const TextStyle(color: AppTheme.turquoise, fontSize: 11.5, fontWeight: FontWeight.w800),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            t('safety_title'),
            style: const TextStyle(fontSize: 27, fontWeight: FontWeight.w900, height: 1.2),
          ),
          const SizedBox(height: 10),
          Text(
            t('safety_desc'),
            style: const TextStyle(color: AppTheme.mutedText, fontSize: 14, height: 1.55),
          ),
          const SizedBox(height: 22),
          // صندوق التحذير الطبي الطارئ المطابق للويب
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  const Color(0xFF2A0E17).withOpacity(0.92),
                  const Color(0xFF180910).withOpacity(0.95),
                ],
              ),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: AppTheme.dangerRed.withOpacity(0.55)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.warning_amber_rounded, color: AppTheme.dangerRed, size: 24),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        t('safety_emerg_box'),
                        style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700, height: 1.45),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.dangerRed,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: () => EmergencyModal.show(context, lang),
                  icon: const Icon(Icons.phone_in_talk, size: 18),
                  label: Text(t('call_emerg_now'), style: const TextStyle(fontWeight: FontWeight.w800)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          _safetyCard(Icons.shield_outlined, t('not_doc_title'), t('not_doc_desc')),
          const SizedBox(height: 14),
          _safetyCard(Icons.menu_book_rounded, t('evidence_title'), t('evidence_desc')),
          const SizedBox(height: 14),
          _safetyCard(Icons.notification_important_outlined, t('escalation_title'), t('escalation_desc')),
          WebEmergencyFooter(lang: lang),
        ],
      ),
    );
  }

  Widget _safetyCard(IconData icon, String title, String desc) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppTheme.webCardGradient,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFF092626),
              borderRadius: BorderRadius.circular(13),
              border: Border.all(color: AppTheme.turquoise.withOpacity(0.25)),
            ),
            child: Icon(icon, color: AppTheme.turquoise, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16.5)),
                const SizedBox(height: 6),
                Text(desc, style: const TextStyle(color: AppTheme.mutedText, fontSize: 13.5, height: 1.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class MedicalServicesView extends StatefulWidget {
  final String lang;
  const MedicalServicesView({super.key, required this.lang});

  @override
  State<MedicalServicesView> createState() => _MedicalServicesViewState();
}

class _MedicalServicesViewState extends State<MedicalServicesView> {
  int _cat = 0;

  static const List<List<Map<String, dynamic>>> _items = [
    [
      {'name': 'Al Borg Labs', 'arName': 'معامل البرج (Al Borg)', 'rating': '4.8', 'desc': 'Comprehensive Checkup (CBC, Blood Sugar, Liver, Kidney).', 'arDesc': 'باقة الفحص الشامل (صورة دم كاملة، سكر، وظائف كبد وكلى).', 'old': '500 EGP', 'price': '250', 'phone': null},
      {'name': 'Al Mokhtabar Labs', 'arName': 'معامل المختبر (Al Mokhtabar)', 'rating': '4.9', 'desc': 'Thyroid, Hormones, and Vitamins comprehensive tests.', 'arDesc': 'تحاليل الغدة الدرقية والهرمونات والفيتامينات الشاملة.', 'old': '800 EGP', 'price': '400', 'phone': null},
      {'name': 'Alfa Lab', 'arName': 'ألفا لاب (Alfa Lab)', 'rating': '4.7', 'desc': 'Tumor markers and advanced immunity profiles.', 'arDesc': 'دلالات الأورام وفحوصات المناعة المتقدمة والدقيقة.', 'old': '1000 EGP', 'price': '500', 'phone': null},
      {'name': 'Cairo Lab', 'arName': 'كايرو لاب (Cairo Lab)', 'rating': '4.6', 'desc': 'Allergy testing and prenatal comprehensive checkups.', 'arDesc': 'اختبارات الحساسية والفحوصات الدورية الشاملة.', 'old': null, 'price': null, 'phone': '19989'},
      {'name': 'Royal Lab', 'arName': 'رويال لاب (Royal Lab)', 'rating': '4.5', 'desc': 'HbA1c, fast liver and kidney functions tests.', 'arDesc': 'السكر التراكمي ووظائف الكبد والكلى السريعة.', 'old': '660 EGP', 'price': '330', 'phone': null},
    ],
    [
      {'name': 'Cairo Scan', 'arName': 'كايرو سكان (Cairo Scan)', 'rating': '4.8', 'desc': 'CT Scans and Ultrasound with the latest technology.', 'arDesc': 'أشعة مقطعية وسونار بأحدث الأجهزة الرقمية.', 'old': '1100 EGP', 'price': '550', 'phone': null},
      {'name': 'Alfa Scan', 'arName': 'ألفا سكان (Alfa Scan)', 'rating': '4.9', 'desc': 'High-resolution Open MRI scans.', 'arDesc': 'أشعة الرنين المغناطيسي المفتوح عالي الدقة.', 'old': '1900 EGP', 'price': '950', 'phone': null},
      {'name': 'Techno Scan', 'arName': 'تكنو سكان (Techno Scan)', 'rating': '4.7', 'desc': 'Dental Panorama and Digital Mammograms.', 'arDesc': 'بانوراما الأسنان والماموجرام الرقمي المتقدم.', 'old': null, 'price': null, 'phone': '19234'},
      {'name': 'Nile Scan', 'arName': 'نايل سكان (Nile Scan)', 'rating': '4.8', 'desc': 'PET-CT and Interventional Radiology scans.', 'arDesc': 'المسح الذري والأشعة التداخلية المتخصصة.', 'old': '3100 EGP', 'price': '1550', 'phone': null},
      {'name': 'Misr Radiology Center', 'arName': 'مركز مصر للأشعة', 'rating': '4.6', 'desc': 'Ultrasound and Color Doppler on blood vessels.', 'arDesc': 'موجات فوق صوتية ودوبلر ملون على الأوعية الدموية.', 'old': '1400 EGP', 'price': '700', 'phone': null},
    ],
    [
      {'name': 'Dr. Magdi Yacoub Clinic', 'arName': 'مؤسسة د. مجدي يعقوب للقلب', 'rating': '5.0', 'desc': 'Consultant of Cardiovascular Surgery.', 'arDesc': 'استشارات وجراحات القلب والأوعية الدموية.', 'old': null, 'price': null, 'phone': '19731'},
      {'name': 'Cleopatra Hospital', 'arName': 'مستشفى كليوباترا', 'rating': '4.8', 'desc': 'Internal Medicine and Gastroenterology consultants.', 'arDesc': 'عيادات الباطنة والجهاز الهضمي والكبد.', 'old': '900 EGP', 'price': '450', 'phone': null},
      {'name': 'Dar Al Fouad Hospital', 'arName': 'مستشفى دار الفؤاد', 'rating': '4.9', 'desc': 'Neurology and Spine Surgery consultants.', 'arDesc': 'استشاريو المخ والأعصاب وجراحات العمود الفقري.', 'old': '1200 EGP', 'price': '600', 'phone': null},
      {'name': 'Saudi German Hospital', 'arName': 'المستشفى السعودي الألماني', 'rating': '4.7', 'desc': 'Orthopedic Surgery and Sports Injuries.', 'arDesc': 'جراحات العظام والمفاصل وإصابات الملاعب.', 'old': '1300 EGP', 'price': '650', 'phone': null},
      {'name': 'Andalusia Clinics', 'arName': 'عيادات أندلسية التخصصية', 'rating': '4.6', 'desc': 'Pediatrics, Neonatology, and Premature Care.', 'arDesc': 'طب الأطفال وحديثي الولادة والرعاية المتكاملة.', 'old': null, 'price': null, 'phone': '16781'},
      {'name': 'As-Salam International Hospital', 'arName': 'مستشفى السلام الدولي', 'rating': '4.8', 'desc': 'Pulmonology and Respiratory System consultants.', 'arDesc': 'استشاريو الصدر والجهاز التنفسي والحساسية.', 'old': '1500 EGP', 'price': '750', 'phone': null},
    ],
  ];

  @override
  Widget build(BuildContext context) {
    final t = (String k) => AppLocalization.tr(widget.lang, k);
    final isAr = widget.lang.toLowerCase() == 'ar';
    final currentList = _items[_cat];

    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 20, 18, 32),
      children: [
        Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF092626),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.turquoise.withOpacity(0.35)),
            ),
            child: Text(
              t('services_badge'),
              style: const TextStyle(color: AppTheme.turquoise, fontSize: 11.5, fontWeight: FontWeight.w800),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          t('services_title'),
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, height: 1.2),
        ),
        const SizedBox(height: 8),
        Text(
          t('services_desc'),
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppTheme.mutedText, fontSize: 13.5, height: 1.5),
        ),
        const SizedBox(height: 18),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _catChip(0, t('tab_labs')),
              const SizedBox(width: 10),
              _catChip(1, t('tab_scans')),
              const SizedBox(width: 10),
              _catChip(2, t('tab_clinics')),
            ],
          ),
        ),
        const SizedBox(height: 18),
        ...currentList.map((item) {
          final title = isAr ? item['arName'] : item['name'];
          final desc = isAr ? item['arDesc'] : item['desc'];
          return Container(
            margin: const EdgeInsets.only(bottom: 15),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppTheme.webCardGradient,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: Colors.white.withOpacity(0.08)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.amber.withOpacity(0.14),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.amber.withOpacity(0.3)),
                      ),
                      child: Text(
                        '⭐ ${item['rating']}',
                        style: const TextStyle(color: Colors.amber, fontSize: 12.5, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(desc, style: const TextStyle(color: AppTheme.mutedText, fontSize: 13.5, height: 1.5)),
                const SizedBox(height: 16),
                if (item['price'] != null) ...[
                  Row(
                    children: [
                      Text(
                        item['old'],
                        style: const TextStyle(
                          color: Colors.white38,
                          fontSize: 13,
                          decoration: TextDecoration.lineThrough,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'EGP ${item['price']}',
                        style: const TextStyle(
                          color: AppTheme.turquoise,
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      gradient: AppTheme.emeraldButtonGradient,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: () async {
                        final msg = Uri.encodeComponent(
                            'مرحباً Nuvira، أرغب في حجز ($title) بسعر الخصم ${item['price']} ج.م. برجاء إرسال تفاصيل الدفع.');
                        final uri = Uri.parse('https://wa.me/201000000000?text=$msg');
                        await launchUrl(uri, mode: LaunchMode.externalApplication);
                      },
                      icon: const Icon(Icons.check_circle_outline, size: 18),
                      label: Text(t('book_whatsapp'), style: const TextStyle(fontWeight: FontWeight.w800)),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Center(
                    child: Text(
                      t('payment_note'),
                      style: const TextStyle(color: Colors.white54, fontSize: 11.5),
                    ),
                  ),
                ] else ...[
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: AppTheme.turquoise),
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: () async {
                        final uri = Uri.parse('tel:${item['phone']}');
                        await launchUrl(uri);
                      },
                      icon: const Icon(Icons.phone, size: 17, color: AppTheme.turquoise),
                      label: Text('${t('call_now')} ${item['phone']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ],
            ),
          );
        }),
        WebEmergencyFooter(lang: widget.lang),
      ],
    );
  }

  Widget _catChip(int idx, String label) {
    final active = _cat == idx;
    return GestureDetector(
      onTap: () => setState(() => _cat = idx),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
        decoration: BoxDecoration(
          gradient: active ? AppTheme.emeraldButtonGradient : null,
          color: active ? null : AppTheme.cardBg,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: active ? AppTheme.turquoise : Colors.white12),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: Colors.white,
            fontWeight: active ? FontWeight.w800 : FontWeight.w600,
            fontSize: 13.5,
          ),
        ),
      ),
    );
  }
}
