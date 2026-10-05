import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class ServicesScreen extends StatelessWidget {
  const ServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Medical Services')),
      body: Stack(
        children: [
          CustomPaint(painter: GlassPainter(), child: Container()),
          Center(
            child: Text(
              'Lab Analysis • Prescriptions • Diagnostics',
              style: TextStyle(color: Colors.white, fontSize: 18),
            ),
          ),
        ],
      ),
    );
  }
}
