import 'dart:math' as math;
import 'package:flutter/material.dart';

class AnimatedAuroraBackground extends StatefulWidget {
  final Widget child;
  const AnimatedAuroraBackground({super.key, required this.child});

  @override
  State<AnimatedAuroraBackground> createState() => _AnimatedAuroraBackgroundState();
}

class _AnimatedAuroraBackgroundState extends State<AnimatedAuroraBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 14),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        RepaintBoundary(
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, _) {
              return CustomPaint(
                painter: _AuroraPainter(_controller.value),
                size: Size.infinite,
              );
            },
          ),
        ),
        widget.child,
      ],
    );
  }
}

class _AuroraPainter extends CustomPainter {
  final double progress;
  _AuroraPainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    canvas.drawRect(rect, Paint()..color = const Color(0xFF030711));

    final shift = (progress - 0.5) * 90;

    // شعاع الشفق الفيروزي القطري
    final beam1 = Paint()
      ..shader = RadialGradient(
        colors: [
          const Color(0xFF00D4B2).withOpacity(0.24),
          const Color(0xFF059669).withOpacity(0.08),
          Colors.transparent,
        ],
      ).createShader(Rect.fromCircle(
        center: Offset(size.width * 0.25 + shift, size.height * 0.28 - shift * 0.5),
        radius: size.width * 0.75,
      ));
    canvas.drawRect(rect, beam1);

    // شعاع الشفق البنفسجي والأزرق
    final beam2 = Paint()
      ..shader = RadialGradient(
        colors: [
          const Color(0xFF6366F1).withOpacity(0.20),
          const Color(0xFF00BBF9).withOpacity(0.07),
          Colors.transparent,
        ],
      ).createShader(Rect.fromCircle(
        center: Offset(size.width * 0.78 - shift, size.height * 0.65 + shift * 0.4),
        radius: size.width * 0.8,
      ));
    canvas.drawRect(rect, beam2);

    // نجوم فضائية خفيفة عالية الأداء
    final starPaint = Paint()..color = Colors.white.withOpacity(0.35);
    final rnd = math.Random(42);
    for (int i = 0; i < 35; i++) {
      final dx = rnd.nextDouble() * size.width;
      final dy = rnd.nextDouble() * size.height;
      final radius = (i % 3 == 0) ? 1.3 : 0.8;
      canvas.drawCircle(Offset(dx, dy), radius, starPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _AuroraPainter oldDelegate) =>
      (oldDelegate.progress - progress).abs() > 0.01;
}
