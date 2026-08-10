import 'package:flutter/material.dart';

class ChunkLibraryPlaceholder extends StatelessWidget {
  const ChunkLibraryPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Chunk Library')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Browse high-frequency native phrases with swap patterns. Your saved chunks will appear here.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
