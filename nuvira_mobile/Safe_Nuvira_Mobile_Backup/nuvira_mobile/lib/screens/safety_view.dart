import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../theme/app_localization.dart';
import '../widgets/emergency_modal.dart';

class SafetyView extends StatelessWidget {
  const SafetyView({super.key});

  @override
  Widget build(BuildContext context) {
    final isMobile = AppTheme.isMobile(context);
    final hPad = AppTheme.screenPadding(context);
    final topPad = isMobile ? 72.0 : 100.0;

    return SingleChildScrollView(
      padding: EdgeInsets.only(
          top: topPad, bottom: 40, left: hPad, right: hPad),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 900),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                AppLocalization.translate(context, 'safety_eyebrow'),
                style: TextStyle(
                    color: AppTheme.turquoise,
                    fontSize: isMobile ? 13 : 16,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5),
              ),
              const SizedBox(height: 12),
              Text(
                AppLocalization.translate(context, 'safety_title'),
                style: TextStyle(
                    color: Colors.white,
                    fontSize: isMobile ? 26 : 42,
                    fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              Text(
                AppLocalization.translate(context, 'safety_desc'),
                style: TextStyle(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: isMobile ? 14 : 18),
              ),
              const SizedBox(height: 32),

              // Red emergency warning
              Container(
                padding: EdgeInsets.all(isMobile ? 16 : 24),
                decoration: BoxDecoration(
                  color: AppTheme.danger.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                      color: AppTheme.danger.withOpacity(0.3)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.warning_amber_rounded,
                        color: AppTheme.danger,
                        size: isMobile ? 24 : 32),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            AppLocalization.translate(
                                context, 'emergency_warning'),
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: isMobile ? 14 : 16,
                                fontWeight: FontWeight.bold,
                                height: 1.5),
                          ),
                          const SizedBox(height: 12),
                          InkWell(
                            onTap: () => EmergencyModal.show(context),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.phone,
                                    color: AppTheme.danger,
                                    size: isMobile ? 14 : 16),
                                const SizedBox(width: 8),
                                Flexible(
                                  child: Text(
                                    AppLocalization.translate(context,
                                        'call_emergency_services'),
                                    style: TextStyle(
                                        color: AppTheme.danger,
                                        fontWeight: FontWeight.bold,
                                        fontSize: isMobile ? 13 : 14,
                                        decoration:
                                            TextDecoration.underline),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Safety cards — always vertical on mobile
              LayoutBuilder(
                builder: (context, constraints) {
                  final isWide = constraints.maxWidth > 700;
                  final spacing = isWide ? 20.0 : 16.0;

                  final cards = [
                    _buildSafetyCard(
                      context: context,
                      title: '🛡️ ${AppLocalization.translate(context, 'safety_notDoctor')}',
                      desc: AppLocalization.translate(
                          context, 'safety_notDoctorDesc'),
                      isMobile: !isWide,
                    ),
                    _buildSafetyCard(
                      context: context,
                      title: '📖 ${AppLocalization.translate(context, 'safety_evidence')}',
                      desc: AppLocalization.translate(
                          context, 'safety_evidenceDesc'),
                      isMobile: !isWide,
                    ),
                    _buildSafetyCard(
                      context: context,
                      title: '⚠️ ${AppLocalization.translate(context, 'safety_emergency')}',
                      desc: AppLocalization.translate(
                          context, 'safety_emergencyDesc'),
                      isMobile: !isWide,
                    ),
                  ];

                  if (isWide) {
                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: cards
                          .map<Widget>((c) => Expanded(child: c))
                          .toList()
                        ..insert(1, SizedBox(width: spacing))
                        ..insert(3, SizedBox(width: spacing)),
                    );
                  }

                  return Column(
                    children: cards
                        .map((c) => Padding(
                            padding:
                                EdgeInsets.only(bottom: spacing),
                            child: c))
                        .toList(),
                  );
                },
              ),
              const SizedBox(height: 24),

              // Yellow info box
              Container(
                padding: EdgeInsets.all(isMobile ? 16 : 24),
                decoration: BoxDecoration(
                  color: Colors.amber.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                      color: Colors.amber.withOpacity(0.2)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline,
                        color: Colors.amber,
                        size: isMobile ? 24 : 32),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '⚠️ ${AppLocalization.translate(context, 'safety_whenToUse')}',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: isMobile ? 15 : 18,
                                fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            AppLocalization.translate(
                                context, 'safety_whenToUseDesc'),
                            style: TextStyle(
                                color: Colors.white.withOpacity(0.8),
                                fontSize: isMobile ? 13 : 16,
                                height: 1.5),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSafetyCard({
    required BuildContext context,
    required String title,
    required String desc,
    required bool isMobile,
  }) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 20 : 28),
      decoration: BoxDecoration(
        color: AppTheme.cardBg.withOpacity(0.6),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
            color: AppTheme.turquoise.withOpacity(0.15)),
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
        children: [
          Text(title,
              style: TextStyle(
                  color: Colors.white,
                  fontSize: isMobile ? 16 : 20,
                  fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Text(desc,
              style: TextStyle(
                  color: Colors.white.withOpacity(0.6),
                  fontSize: isMobile ? 13 : 16,
                  height: 1.5)),
        ],
      ),
    );
  }
}
