import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color spaceNavy = Color(0xFF050A14);
  static const Color darkNavy = Color(0xFF08101D);
  static const Color cardBg = Color(0xFF0C1626);
  static const Color cardInner = Color(0xFF101E33);
  static const Color emerald = Color(0xFF059669);
  static const Color lightEmerald = Color(0xFF10B981);
  static const Color turquoise = Color(0xFF00D4B2);
  static const Color dangerRed = Color(0xFFEF4444);
  static const Color glassDark = Color(0xFF0E192B);
  static const Color mutedText = Color(0xFF94A3B8);

  static const LinearGradient emeraldButtonGradient = LinearGradient(
    colors: [Color(0xFF059669), Color(0xFF10B981)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient primaryGradient = emeraldButtonGradient;

  static const LinearGradient webCardGradient = LinearGradient(
    colors: [Color(0xE60D1829), Color(0xF508101C)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cardGradient = webCardGradient;

  static ThemeData get darkTheme {
    final baseText = GoogleFonts.cairoTextTheme(ThemeData.dark().textTheme).apply(
      bodyColor: Colors.white,
      displayColor: Colors.white,
    );
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: spaceNavy,
      primaryColor: emerald,
      colorScheme: const ColorScheme.dark(
        primary: lightEmerald,
        secondary: turquoise,
        surface: cardBg,
        error: dangerRed,
      ),
      textTheme: baseText.copyWith(
        headlineLarge: baseText.headlineLarge?.copyWith(fontSize: 28, fontWeight: FontWeight.w900, height: 1.2),
        headlineMedium: baseText.headlineMedium?.copyWith(fontSize: 22, fontWeight: FontWeight.w800, height: 1.25),
        titleMedium: baseText.titleMedium?.copyWith(fontSize: 16, fontWeight: FontWeight.w700, height: 1.3),
        bodyMedium: baseText.bodyMedium?.copyWith(fontSize: 13.5, fontWeight: FontWeight.w500, height: 1.55),
        bodySmall: baseText.bodySmall?.copyWith(fontSize: 12, color: mutedText, height: 1.45),
      ),
    );
  }
}
