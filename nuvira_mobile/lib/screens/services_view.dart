import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/app_theme.dart';
import '../theme/app_localization.dart';

class MedicalServicesView extends StatefulWidget {
  const MedicalServicesView({super.key});

  @override
  State<MedicalServicesView> createState() => _MedicalServicesViewState();
}

class _MedicalServicesViewState extends State<MedicalServicesView> {
  int _activeCategoryIndex = 0; // 0: Labs, 1: Scans, 2: Clinics

  Future<void> _launchPhone(String number) async {
    final Uri url = Uri.parse('tel:$number');
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAr = AppLocalization.isArabic(context);
    final isMobile = AppTheme.isMobile(context);
    final hPad = AppTheme.screenPadding(context);
    final topPad = isMobile ? 72.0 : 100.0;

    final categories = [
      {'icon': '🧪', 'en': 'Laboratories', 'ar': 'معامل التحاليل'},
      {'icon': '☢️', 'en': 'Scan Centers', 'ar': 'مراكز الأشعة'},
      {'icon': '🏥', 'en': 'Clinics', 'ar': 'العيادات'},
    ];

    return SingleChildScrollView(
      padding: EdgeInsets.only(
          top: topPad, bottom: 40, left: hPad, right: hPad),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 900),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Badge
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: AppTheme.turquoise.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                      color: AppTheme.turquoise.withOpacity(0.3)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('⚡ ',
                        style: TextStyle(fontSize: 14)),
                    Text(
                      isAr
                          ? 'خدمات طبية معتمدة'
                          : 'Certified Medical Services',
                      style: const TextStyle(
                          color: AppTheme.turquoise,
                          fontWeight: FontWeight.bold,
                          fontSize: 13),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Text(
                  isAr
                      ? 'احجز التحاليل، الأشعة، والعيادات عبر الإنترنت بأسعار مخفضة حصرياً لمستخدمي نوفيرا.'
                      : 'Book labs, scans, and clinics online at discounted prices exclusively for Nuvira users.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: Colors.white70,
                      fontSize: isMobile ? 14 : 18),
                ),
              ),
              const SizedBox(height: 28),

              // Category Tabs — horizontal scroll on mobile
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children:
                      List.generate(categories.length, (index) {
                    final isActive =
                        _activeCategoryIndex == index;
                    return Padding(
                      padding:
                          EdgeInsets.only(right: index < 2 ? 10 : 0),
                      child: InkWell(
                        onTap: () => setState(
                            () => _activeCategoryIndex = index),
                        borderRadius: BorderRadius.circular(30),
                        child: Container(
                          padding: EdgeInsets.symmetric(
                              horizontal: isMobile ? 16 : 24,
                              vertical: isMobile ? 10 : 12),
                          decoration: BoxDecoration(
                            color: isActive
                                ? AppTheme.turquoise
                                    .withOpacity(0.2)
                                : Colors.white.withOpacity(0.05),
                            borderRadius:
                                BorderRadius.circular(30),
                            border: Border.all(
                                color: isActive
                                    ? AppTheme.turquoise
                                    : Colors.white
                                        .withOpacity(0.1)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                  categories[index]['icon']!,
                                  style: const TextStyle(
                                      fontSize: 16)),
                              const SizedBox(width: 6),
                              Text(
                                isAr
                                    ? categories[index]['ar']!
                                    : categories[index]['en']!,
                                style: TextStyle(
                                  color: isActive
                                      ? Colors.white
                                      : Colors.white70,
                                  fontWeight: isActive
                                      ? FontWeight.bold
                                      : FontWeight.normal,
                                  fontSize:
                                      isMobile ? 13 : 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
                ),
              ),
              const SizedBox(height: 28),

              // Content
              if (_activeCategoryIndex == 0)
                _buildLabsContent(isAr, isMobile),
              if (_activeCategoryIndex == 1)
                _buildScansContent(isAr, isMobile),
              if (_activeCategoryIndex == 2)
                _buildClinicsContent(isAr, isMobile),
            ],
          ),
        ),
      ),
    );
  }

  // ── DATA ──
  Widget _buildLabsContent(bool isAr, bool isMobile) {
    return _buildServiceGrid(isMobile, [
      _svc(isAr ? 'معامل البرج' : 'Al Borg Labs', 4.9,
          isAr ? 'باقة تحاليل الاطمئنان الشامل (صورة دم، سكر، كبد، كلى).' : 'Comprehensive Checkup (CBC, Blood Sugar, Liver, Kidney).',
          price: 250, isAr: isAr),
      _svc(isAr ? 'معامل المختبر' : 'Al Mokhtabar Labs', 4.8,
          isAr ? 'تحاليل الغدة الدرقية والهرمونات والفيتامينات.' : 'Thyroid, Hormones, and Vitamins tests.',
          price: 400, isAr: isAr),
      _svc(isAr ? 'معامل ألفا' : 'Alfa Labs', 4.7,
          isAr ? 'باقة دلالات الأورام والتحاليل المناعية المتقدمة.' : 'Tumor markers and advanced immunity profiles.',
          price: 500, isAr: isAr),
      _svc(isAr ? 'معامل كايرو لاب' : 'Cairo Lab', 4.6,
          isAr ? 'تحاليل الحساسية واختبارات ما قبل الزواج الشاملة.' : 'Allergy testing and premarital comprehensive checkups.',
          phone: '19400', isAr: isAr),
      _svc(isAr ? 'رويال لاب' : 'Royal Lab', 4.8,
          isAr ? 'تحاليل السكر التراكمي ووظائف الكبد والكلى السريعة.' : 'HbA1c, fast liver and kidney functions tests.',
          price: 330, isAr: isAr),
    ]);
  }

  Widget _buildScansContent(bool isAr, bool isMobile) {
    return _buildServiceGrid(isMobile, [
      _svc(isAr ? 'مركز كايرو سكان' : 'Cairo Scan', 4.8,
          isAr ? 'أشعة مقطعية وموجات فوق صوتية بأحدث الأجهزة.' : 'CT Scans and Ultrasound with the latest technology.',
          price: 550, isAr: isAr),
      _svc(isAr ? 'ألفا سكان' : 'Alfa Scan', 4.9,
          isAr ? 'أشعة رنين مغناطيسي (MRI) عالية الدقة المفتوحة.' : 'High-resolution Open MRI scans.',
          price: 950, isAr: isAr),
      _svc(isAr ? 'تكنو سكان' : 'Techno Scan', 4.7,
          isAr ? 'أشعة بانوراما أسنان، وماموجرام رقمي للسيدات.' : 'Dental Panorama and Digital Mammogram.',
          phone: '19234', isAr: isAr),
      _svc(isAr ? 'مركز النيل للأشعة' : 'Nile Scan', 4.8,
          isAr ? 'مسح ذري بوزيتروني (PET/CT) وأشعة تداخلية.' : 'PET/CT and Interventional Radiology scans.',
          price: 1550, isAr: isAr),
      _svc(isAr ? 'مركز مصر للأشعة' : 'Misr Radiology Center', 4.6,
          isAr ? 'موجات فوق صوتية ودوبلر ملون على الأوعية الدموية.' : 'Ultrasound and Color Doppler on blood vessels.',
          price: 700, isAr: isAr),
    ]);
  }

  Widget _buildClinicsContent(bool isAr, bool isMobile) {
    return _buildServiceGrid(isMobile, [
      _svc(isAr ? 'عيادة د. مجدي يعقوب (مركز أسوان)' : 'Dr. Magdi Yacoub Clinic', 5.0,
          isAr ? 'استشاري جراحات القلب والأوعية الدموية.' : 'Consultant of Cardiovascular Surgery.',
          phone: '19731', isAr: isAr),
      _svc(isAr ? 'مستشفى كليوباترا' : 'Cleopatra Hospital', 4.8,
          isAr ? 'كشف استشاري الباطنة والجهاز الهضمي والمناظير.' : 'Internal Medicine and Gastroenterology consultants.',
          price: 450, isAr: isAr),
      _svc(isAr ? 'مستشفى دار الفؤاد' : 'Dar Al Fouad Hospital', 4.9,
          isAr ? 'كشف استشاري أمراض المخ والأعصاب والعمود الفقري.' : 'Neurology and Spine Surgery consultants.',
          price: 600, isAr: isAr),
      _svc(isAr ? 'مستشفى السعودي الألماني' : 'Saudi German Hospital', 4.7,
          isAr ? 'كشف استشاري جراحة العظام وإصابات الملاعب المتقدمة.' : 'Orthopedic Surgery and Sports Injuries.',
          price: 650, isAr: isAr),
      _svc(isAr ? 'عيادات أندلسية' : 'Andalusia Clinics', 4.8,
          isAr ? 'كشف طب الأطفال وحديثي الولادة ورعاية المبتسرين.' : 'Pediatrics, Neonatology, and Premature Care.',
          phone: '16781', isAr: isAr),
      _svc(isAr ? 'مستشفى السلام الدولي' : 'As-Salam International Hospital', 4.8,
          isAr ? 'كشف استشاري أمراض الصدر والجهاز التنفسي.' : 'Pulmonology and Respiratory System consultants.',
          price: 750, isAr: isAr),
    ]);
  }

  Map<String, dynamic> _svc(String title, double rating, String desc,
      {int? price, String? phone, required bool isAr}) {
    return {
      'title': title,
      'rating': rating,
      'desc': desc,
      'price': price,
      'phone': phone,
      'isAr': isAr,
    };
  }

  Widget _buildServiceGrid(bool isMobile, List<Map<String, dynamic>> services) {
    if (isMobile) {
      return Column(
        children: services
            .map((s) => Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: _buildServiceCard(s),
                ))
            .toList(),
      );
    }

    // Desktop: Wrap with fixed width
    return Wrap(
      spacing: 20,
      runSpacing: 20,
      alignment: WrapAlignment.center,
      children: services.map((s) => SizedBox(
        width: 280,
        child: _buildServiceCard(s),
      )).toList(),
    );
  }

  Widget _buildServiceCard(Map<String, dynamic> s) {
    final String title = s['title'];
    final double rating = s['rating'];
    final String desc = s['desc'];
    final int? price = s['price'];
    final String? phone = s['phone'];
    final bool isAr = s['isAr'];
    final currency = AppLocalization.translate(context, 'services_currency');
    final isMobile = AppTheme.isMobile(context);

    return Container(
      padding: EdgeInsets.all(isMobile ? 16 : 20),
      decoration: BoxDecoration(
        color: AppTheme.cardBg.withOpacity(0.8),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Title + rating
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(title,
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: isMobile ? 15 : 17,
                        fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 6, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.amber.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.star,
                        color: Colors.amber, size: 12),
                    const SizedBox(width: 3),
                    Text(rating.toString(),
                        style: const TextStyle(
                            color: Colors.amber,
                            fontWeight: FontWeight.bold,
                            fontSize: 11)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(desc,
              style: TextStyle(
                  color: Colors.white.withOpacity(0.6),
                  fontSize: isMobile ? 12 : 13,
                  height: 1.4)),
          const SizedBox(height: 14),

          // Divider
          Divider(
              color: Colors.white.withOpacity(0.08), height: 1),
          const SizedBox(height: 14),

          if (price != null) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${price + 80} $currency',
                  style: TextStyle(
                      color: Colors.white.withOpacity(0.35),
                      decoration: TextDecoration.lineThrough,
                      fontSize: 11),
                ),
                Row(
                  crossAxisAlignment:
                      CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(price.toString(),
                        style: TextStyle(
                            color: AppTheme.turquoise,
                            fontSize: isMobile ? 22 : 26,
                            fontWeight: FontWeight.w900)),
                    const SizedBox(width: 4),
                    Text(currency,
                        style: TextStyle(
                            color: Colors.white.withOpacity(0.6),
                            fontSize: 12,
                            fontWeight: FontWeight.bold)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.emeraldGreen,
                  padding: EdgeInsets.symmetric(
                      vertical: isMobile ? 12 : 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.chat,
                    color: Colors.white, size: 16),
                label: Text(
                    AppLocalization.translate(
                        context, 'services_bookNow'),
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 13)),
                onPressed: () =>
                    _launchWhatsApp(title, price),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              AppLocalization.translate(
                  context, 'services_payment'),
              style: TextStyle(
                  color: Colors.white.withOpacity(0.35),
                  fontSize: 9,
                  fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
          ] else if (phone != null) ...[
            Text(
              AppLocalization.translate(
                  context, 'services_phoneOnly'),
              style: TextStyle(
                  color: Colors.white.withOpacity(0.5),
                  fontSize: 10,
                  fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor:
                      Colors.white.withOpacity(0.08),
                  padding: EdgeInsets.symmetric(
                      vertical: isMobile ? 12 : 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  side: BorderSide(
                      color: Colors.white.withOpacity(0.1)),
                ),
                icon: const Icon(Icons.phone,
                    color: Colors.blueAccent, size: 16),
                label: Text(
                    '${AppLocalization.translate(context, 'services_callNow')}: $phone',
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 13)),
                onPressed: () => _launchPhone(phone),
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _launchWhatsApp(String providerName, int finalPrice) async {
    final msgHello =
        AppLocalization.translate(context, 'services_msgHello');
    final msgTotal =
        AppLocalization.translate(context, 'services_msgTotal');
    final msgPay =
        AppLocalization.translate(context, 'services_msgPay');
    final currency =
        AppLocalization.translate(context, 'services_currency');

    final message =
        '$msgHello *$providerName*%0A$msgTotal *$finalPrice $currency*%0A$msgPay';
    final Uri url = Uri.parse(
        'https://wa.me/201000000000?text=$message');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }
}
