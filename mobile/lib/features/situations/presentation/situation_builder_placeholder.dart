import 'package:flutter/material.dart';

class SituationBuilderPlaceholder extends StatelessWidget {
  const SituationBuilderPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Situation Builder')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Describe a real conversation you need. Situation Builder will turn it into memorization-ready dialogues.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
