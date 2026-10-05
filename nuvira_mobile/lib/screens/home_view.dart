import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../theme/app_localization.dart';

class HomeView extends StatelessWidget {
  final VoidCallback onStartChat;

  const HomeView({super.key, required this.onStartChat});

  @override
  Widget build(BuildContext context) {
    final t = (String key) => AppLocalization.translate(context, key);
    final isMobile = AppTheme.isMobile(context);
    final hPad = AppTheme.screenPadding(context);
    final topPad = isMobile ? 72.0 : 100.0;

    return SingleChildScrollView(
      padding: EdgeInsets.only(
          top: topPad, bottom: 40, left: hPad, right: hPad),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1100),
          child: isMobile
              ? _buildMobileLayout(context, t)
              : _buildDesktopLayout(context, t),
        ),
      ),
    );
  }

  Widget _buildDesktopLayout(
      BuildContext context, String Function(String) t) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(flex: 5, child: _buildHeroSection(context, t, false)),
        const SizedBox(width: 48),
        Expanded(flex: 4, child: _buildFeaturePanel(context, t, false)),
      ],
    );
  }

  Widget _buildMobileLayout(
      BuildContext context, String Function(String) t) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildHeroSection(context, t, true),
        const SizedBox(height: 32),
        _buildFeaturePanel(context, t, true),
      ],
    );
  }

  Widget _buildHeroSection(
      BuildContext context, String Function(String) t, bool isMobile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          t('evidence_before_answers'),
          style: TextStyle(
              color: AppTheme.turquoise,
              letterSpacing: 2,
              fontWeight: FontWeight.bold,
              fontSize: isMobile ? 12 : 14),
        ),
        const SizedBox(height: 12),
        ShaderMask(
          shaderCallback: (bounds) => const LinearGradient(
            colors: [AppTheme.emeraldGreen, AppTheme.turquoise],
          ).createShader(bounds),
          child: Text(
            t('your_evidence_grounded'),
            style: TextStyle(
                fontSize: isMobile ? 28 : 48,
                fontWeight: FontWeight.bold,
                color: Colors.white,
                height: 1.15),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          t('home_desc'),
          style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: isMobile ? 15 : 18,
              height: 1.5),
        ),
        const SizedBox(height: 28),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.emeraldGreen,
                padding: EdgeInsets.symmetric(
                    horizontal: isMobile ? 20 : 24,
                    vertical: isMobile ? 14 : 16),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30)),
              ),
              onPressed: onStartChat,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(t('startChat'),
                      style: TextStyle(
                          fontSize: isMobile ? 14 : 16,
                          color: Colors.white)),
                  const SizedBox(width: 8),
                  const Icon(Icons.arrow_forward,
                      size: 18, color: Colors.white),
                ],
              ),
            ),
            TextButton(
              style: TextButton.styleFrom(
                padding: EdgeInsets.symmetric(
                    horizontal: isMobile ? 20 : 24,
                    vertical: isMobile ? 14 : 16),
                side: BorderSide(
                    color: Colors.white.withOpacity(0.2)),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30)),
              ),
              onPressed: () {},
              child: Text(t('explore_topics'),
                  style: TextStyle(
                      fontSize: isMobile ? 14 : 16,
                      color: Colors.white)),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFeaturePanel(
      BuildContext context, String Function(String) t, bool isMobile) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 20 : 32),
      decoration: BoxDecoration(
        color: AppTheme.cardBg.withOpacity(0.6),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
            color: AppTheme.turquoise.withOpacity(0.15)),
        boxShadow: [
          BoxShadow(
            color: AppTheme.turquoise.withOpacity(0.04),
            blurRadius: 40,
            spreadRadius: -10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.verified_user,
                  color: AppTheme.turquoise, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(t('care_signal'),
                    style: const TextStyle(
                        color: AppTheme.turquoise,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                        fontSize: 13)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            t('helpful_transparent_careful'),
            style: TextStyle(
                color: Colors.white,
                fontSize: isMobile ? 18 : 24,
                fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),
          _buildFeatureCard(
            t('grounded_answers'),
            t('grounded_desc'),
            Icons.library_books,
            isMobile,
          ),
          const SizedBox(height: 12),
          _buildFeatureCard(
            t('emergency_aware'),
            t('emergency_desc'),
            Icons.warning_amber_rounded,
            isMobile,
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureCard(
      String title, String desc, IconData icon, bool isMobile) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 14 : 20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: EdgeInsets.all(isMobile ? 8 : 10),
            decoration: BoxDecoration(
                color: AppTheme.turquoise.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10)),
            child: Icon(icon,
                color: AppTheme.turquoise,
                size: isMobile ? 20 : 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: isMobile ? 14 : 16)),
                const SizedBox(height: 6),
                Text(desc,
                    style: TextStyle(
                        color: Colors.white.withOpacity(0.6),
                        fontSize: isMobile ? 12 : 14,
                        height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
