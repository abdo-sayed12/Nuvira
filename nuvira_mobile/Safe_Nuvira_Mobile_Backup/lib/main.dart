import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/chat_screen.dart';
import 'theme/app_localization.dart';
import 'theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const NuviraApp());
}

class NuviraApp extends StatefulWidget {
  const NuviraApp({super.key});

  @override
  State<NuviraApp> createState() => _NuviraAppState();
}

class _NuviraAppState extends State<NuviraApp> {
  String _lang = 'ar';

  @override
  void initState() {
    super.initState();
    _loadLang();
  }

  Future<void> _loadLang() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('nuvira_lang');
    if (saved != null && mounted) {
      setState(() => _lang = saved.toLowerCase());
    }
  }

  Future<void> _changeLang(String code) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('nuvira_lang', code.toLowerCase());
    setState(() => _lang = code.toLowerCase());
  }

  @override
  Widget build(BuildContext context) {
    final isRtl = AppLocalization.isRtl(_lang);
    return MaterialApp(
      title: 'Nuvira',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      builder: (context, child) {
        return Directionality(
          textDirection: isRtl ? TextDirection.rtl : TextDirection.ltr,
          child: child ?? const SizedBox.shrink(),
        );
      },
      home: ChatScreen(
        lang: _lang,
        onLanguageChanged: _changeLang,
      ),
    );
  }
}
