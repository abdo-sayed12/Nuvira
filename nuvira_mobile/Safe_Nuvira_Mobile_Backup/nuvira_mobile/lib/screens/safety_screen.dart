import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class SafetyScreen extends StatelessWidget {
  const SafetyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Clinical Safety')),
      body: Stack(
        children: [
          CustomPaint(painter: GlassPainter(), child: Container()),
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.warning_amber_rounded, color: Colors.amber, size: 64),
                const SizedBox(height: 16),
                const Text(
                  'Emergency & Safety Boundaries',
                  style: TextStyle(color: Colors.white, fontSize: 18),
                ),
                const SizedBox(height: 32),
                ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.call),
                  label: const Text('Call Emergency Services'),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                )
              ],
            ),
          ),
        ],
      ),
    );
  }
}
