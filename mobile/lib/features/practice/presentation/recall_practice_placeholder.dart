import 'package:flutter/material.dart';

class RecallPracticePlaceholder extends StatelessWidget {
  const RecallPracticePlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Recall Practice')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Produce sentences from memory instead of recognizing them. Scheduled recall sessions will start here.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
