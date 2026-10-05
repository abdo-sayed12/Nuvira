import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/app_theme.dart';
import '../theme/app_localization.dart';

class SourcesView extends StatelessWidget {
  const SourcesView({super.key});

  @override
  Widget build(BuildContext context) {
    final isAr = AppLocalization.isArabic(context);
    final isMobile = AppTheme.isMobile(context);
    final hPad = AppTheme.screenPadding(context);
    final topPad = isMobile ? 72.0 : 100.0;

    final sources = [
      {'title': 'World Health Organization (WHO)', 'desc': 'The directing and coordinating authority for health within the United Nations system.', 'url': 'https://www.who.int'},
      {'title': 'Mayo Clinic', 'desc': 'Top-ranked hospital and medical research center for clinical excellence and patient care.', 'url': 'https://www.mayoclinic.org'},
      {'title': 'National Institutes of Health (NIH)', 'desc': 'The primary agency of the U.S. government responsible for biomedical and public health research.', 'url': 'https://www.nih.gov'},
      {'title': 'Centers for Disease Control (CDC)', 'desc': 'Leading national public health institute of the United States protecting public health safety.', 'url': 'https://www.cdc.gov'},
      {'title': 'Cleveland Clinic', 'desc': 'Renowned academic medical center providing expert clinical care and health research.', 'url': 'https://my.clevelandclinic.org'},
      {'title': 'Harvard Health', 'desc': 'The authoritative consumer health education division of Harvard Medical School.', 'url': 'https://www.health.harvard.edu'},
      {'title': 'Johns Hopkins', 'desc': 'World-class biomedical research institution and premier medical school.', 'url': 'https://www.hopkinsmedicine.org'},
      {'title': 'NHS (UK)', 'desc': 'Comprehensive publicly funded healthcare system providing trusted clinical guidelines.', 'url': 'https://www.nhs.uk'},
      {'title': 'MedlinePlus', 'desc': 'The world\'s largest medical library, providing trusted health information from the U.S. NLM.', 'url': 'https://medlineplus.gov'},
      {'title': 'WebMD', 'desc': 'Leading provider of health information services, consumer health news, and clinical insights.', 'url': 'https://www.webmd.com'},
    ];

    // For desktop, keep the marquee rows. For mobile, use a simple grid.
    if (isMobile) {
      return _buildMobileLayout(context, sources, topPad, hPad);
    }

    // Desktop: original marquee layout
    final row1 = List<Map<String, String>>.from(sources);
    final row2 = List<Map<String, String>>.from(sources.reversed);
    final row3 = [...sources.sublist(5), ...sources.sublist(0, 5)];

    return SingleChildScrollView(
      padding: EdgeInsets.only(top: topPad, bottom: 40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          _buildHeader(context, hPad),
          const SizedBox(height: 48),
          _MarqueeRow(items: row1, speed: 60, isLeftToRight: false, isAr: isAr, allSources: sources),
          const SizedBox(height: 20),
          _MarqueeRow(items: row2, speed: 70, isLeftToRight: true, isAr: isAr, allSources: sources),
          const SizedBox(height: 20),
          _MarqueeRow(items: row3, speed: 65, isLeftToRight: false, isAr: isAr, allSources: sources),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, double hPad) {
    final isMobile = AppTheme.isMobile(context);
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: hPad),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: AppTheme.turquoise.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.turquoise.withOpacity(0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('🌐 ', style: TextStyle(fontSize: 14)),
                Text(
                  AppLocalization.translate(context, 'sources_badge').toUpperCase(),
                  style: const TextStyle(color: AppTheme.turquoise, fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Text(
            AppLocalization.translate(context, 'sources_title'),
            style: TextStyle(
                color: Colors.white,
                fontSize: isMobile ? 26 : 42,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.5),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          Text(
            AppLocalization.translate(context, 'sources_subtitle'),
            textAlign: TextAlign.center,
            style: TextStyle(
                color: Colors.white.withOpacity(0.6),
                fontSize: isMobile ? 14 : 18),
          ),
        ],
      ),
    );
  }

  Widget _buildMobileLayout(
      BuildContext context, List<Map<String, String>> sources, double topPad, double hPad) {
    return SingleChildScrollView(
      padding: EdgeInsets.only(top: topPad, bottom: 40),
      child: Column(
        children: [
          _buildHeader(context, hPad),
          const SizedBox(height: 24),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: hPad),
            child: Column(
              children: sources.asMap().entries.map((entry) {
                final index = entry.key;
                final source = entry.value;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _MobileSourceCard(
                    number: '#${index + 1}',
                    title: source['title']!,
                    desc: source['desc']!,
                    url: source['url']!,
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Mobile Source Card ──
class _MobileSourceCard extends StatelessWidget {
  final String number;
  final String title;
  final String desc;
  final String url;

  const _MobileSourceCard({
    required this.number,
    required this.title,
    required this.desc,
    required this.url,
  });

  Future<void> _launchUrl(String urlString) async {
    final Uri uri = Uri.parse(urlString);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => _launchUrl(url),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.cardBg.withOpacity(0.8),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withOpacity(0.08)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppTheme.spaceNavy,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white.withOpacity(0.1)),
              ),
              alignment: Alignment.center,
              child: Text(number,
                  style: const TextStyle(
                      color: AppTheme.turquoise,
                      fontWeight: FontWeight.bold,
                      fontSize: 12)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(desc,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          color: Colors.white.withOpacity(0.5),
                          fontSize: 12,
                          height: 1.3)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Text(
                        AppLocalization.translate(context, 'sources_visitOfficial').toUpperCase(),
                        style: const TextStyle(
                            color: AppTheme.turquoise,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                            fontSize: 10),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.arrow_forward,
                          color: AppTheme.turquoise, size: 12),
                    ],
                  ),
                ],
              ),
            ),
            const Icon(Icons.open_in_new,
                color: Colors.white38, size: 16),
          ],
        ),
      ),
    );
  }
}

// ── Desktop Marquee Row (preserved from original) ──
class _MarqueeRow extends StatefulWidget {
  final List<Map<String, String>> items;
  final int speed;
  final bool isLeftToRight;
  final bool isAr;
  final List<Map<String, String>> allSources;

  const _MarqueeRow({
    required this.items,
    required this.speed,
    required this.isLeftToRight,
    required this.isAr,
    required this.allSources,
  });

  @override
  State<_MarqueeRow> createState() => _MarqueeRowState();
}

class _MarqueeRowState extends State<_MarqueeRow>
    with SingleTickerProviderStateMixin {
  late ScrollController _scrollController;
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _animationController = AnimationController(
      vsync: this,
      duration: Duration(seconds: widget.speed),
    )..addListener(() {
        if (_scrollController.hasClients) {
          final maxScroll = _scrollController.position.maxScrollExtent;
          final value = _animationController.value;
          final scrollPosition = widget.isLeftToRight
              ? maxScroll * (1 - value)
              : maxScroll * value;
          _scrollController.jumpTo(scrollPosition);
        }
      });

    _animationController.repeat();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onHover(bool isHovering) {
    if (isHovering) {
      _animationController.stop();
    } else {
      _animationController.repeat();
    }
  }

  @override
  Widget build(BuildContext context) {
    final doubledItems = [
      ...widget.items,
      ...widget.items,
      ...widget.items,
      ...widget.items
    ];

    return MouseRegion(
      onEnter: (_) => _onHover(true),
      onExit: (_) => _onHover(false),
      child: SizedBox(
        height: 260,
        child: ListView.separated(
          controller: _scrollController,
          scrollDirection: Axis.horizontal,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 24),
          itemCount: doubledItems.length,
          separatorBuilder: (_, __) => const SizedBox(width: 20),
          itemBuilder: (context, index) {
            final source = doubledItems[index];
            final originalIndex = widget.allSources
                .indexWhere((s) => s['title'] == source['title']);

            return _DesktopSourceCard(
              number: '#${originalIndex + 1}',
              title: source['title']!,
              desc: source['desc']!,
              url: source['url']!,
              isAr: widget.isAr,
            );
          },
        ),
      ),
    );
  }
}

class _DesktopSourceCard extends StatelessWidget {
  final String number;
  final String title;
  final String desc;
  final String url;
  final bool isAr;

  const _DesktopSourceCard({
    required this.number,
    required this.title,
    required this.desc,
    required this.url,
    required this.isAr,
  });

  Future<void> _launchUrl(String urlString) async {
    final Uri uri = Uri.parse(urlString);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => _launchUrl(url),
      borderRadius: BorderRadius.circular(24),
      child: Container(
        width: 300,
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: AppTheme.cardBg.withOpacity(0.8),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.white.withOpacity(0.08)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: AppTheme.spaceNavy,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: Colors.white.withOpacity(0.1)),
                      ),
                      alignment: Alignment.center,
                      child: Text(number,
                          style: const TextStyle(
                              color: AppTheme.turquoise,
                              fontWeight: FontWeight.bold,
                              fontSize: 13)),
                    ),
                    const Icon(Icons.open_in_new,
                        color: Colors.white54, size: 18),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  title,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      height: 1.1),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  desc,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                      color: Colors.white.withOpacity(0.5),
                      fontSize: 13),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Text(
                      AppLocalization.translate(
                              context, 'sources_visitOfficial')
                          .toUpperCase(),
                      style: const TextStyle(
                          color: AppTheme.turquoise,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                          fontSize: 11),
                    ),
                    const SizedBox(width: 6),
                    const Icon(Icons.arrow_forward,
                        color: AppTheme.turquoise, size: 13),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
