import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import '../theme/app_localization.dart';
import '../theme/app_theme.dart';

class EmergencyModal extends StatefulWidget {
  final String lang;
  const EmergencyModal({super.key, required this.lang});

  static void show(BuildContext context, String lang) {
    showDialog(
      context: context,
      builder: (_) => EmergencyModal(lang: lang),
    );
  }

  @override
  State<EmergencyModal> createState() => _EmergencyModalState();
}

class _EmergencyModalState extends State<EmergencyModal> {
  bool _loading = true;
  String _country = 'Egypt';
  String _number = '123';

  @override
  void initState() {
    super.initState();
    _detect();
  }

  Future<void> _detect() async {
    final info = await ApiService.detectEmergencyInfo();
    if (mounted) {
      setState(() {
        _country = info['country'] ?? 'Egypt';
        _number = info['number'] ?? '123';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = (String k) => AppLocalization.tr(widget.lang, k);
    return Dialog(
      backgroundColor: const Color(0xFF0E1626),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: AppTheme.dangerRed, width: 1.5),
      ),
      child: Padding(
        padding: const EdgeInsets.all(22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              t('emerg_modal_title'),
              style: const TextStyle(
                color: AppTheme.dangerRed,
                fontSize: 20,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 16),
            if (_loading)
              const Padding(
                padding: EdgeInsets.all(20),
                child: CircularProgressIndicator(color: AppTheme.dangerRed),
              )
            else ...[
              Text(
                '${t('location_detected')} $_country',
                style: const TextStyle(color: Colors.white70, fontSize: 14),
              ),
              const SizedBox(height: 6),
              Text(
                t('local_ambulance'),
                style: const TextStyle(color: Colors.white54, fontSize: 13),
              ),
              const SizedBox(height: 6),
              Text(
                _number,
                style: const TextStyle(
                  color: AppTheme.turquoise,
                  fontSize: 40,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.dangerRed,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: () async {
                        final uri = Uri.parse('tel:$_number');
                        if (await canLaunchUrl(uri)) {
                          await launchUrl(uri);
                        }
                      },
                      icon: const Icon(Icons.phone_in_talk, size: 18),
                      label: Text(
                        t('call_ambulance'),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text(
                      t('cancel'),
                      style: const TextStyle(color: Colors.white70),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
