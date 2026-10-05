import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class SourcesScreen extends StatelessWidget {
  const SourcesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sources')),
      body: Stack(
        children: [
          CustomPaint(painter: GlassPainter(), child: Container()),
          Center(
            child: Text(
              'Verified Medical Sources\n(WHO, NICE, AAO, AAN, AHA, ADA)',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white, fontSize: 18),
            ),
          ),
        ],
      ),
    );
  }
}
