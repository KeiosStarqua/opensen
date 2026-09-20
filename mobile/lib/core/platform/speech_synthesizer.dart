import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_tts/flutter_tts.dart';

/// Reads a chunk aloud for "listen and repeat". Implementations must never
/// throw into the UI: a missing engine simply makes speech unavailable.
abstract class SpeechSynthesizer {
  bool get isAvailable;

  Future<void> speak(String text, {double rate = 0.45});

  Future<void> stop();

  Future<void> dispose();
}

/// Used in tests and on platforms without a TTS engine.
class SilentSpeechSynthesizer implements SpeechSynthesizer {
  const SilentSpeechSynthesizer();

  @override
  bool get isAvailable => false;

  @override
  Future<void> speak(String text, {double rate = 0.45}) async {}

  @override
  Future<void> stop() async {}

  @override
  Future<void> dispose() async {}
}

/// System text-to-speech through `flutter_tts` (offline on Android, iOS,
/// macOS and Windows).
class FlutterTtsSynthesizer implements SpeechSynthesizer {
  FlutterTtsSynthesizer() : _tts = FlutterTts();

  final FlutterTts _tts;
  bool _configured = false;
  bool _broken = false;

  @override
  bool get isAvailable =>
      !_broken &&
      !kIsWeb &&
      (Platform.isAndroid ||
          Platform.isIOS ||
          Platform.isMacOS ||
          Platform.isWindows);

  @override
  Future<void> speak(String text, {double rate = 0.45}) async {
    if (!isAvailable || text.trim().isEmpty) return;
    try {
      await _configure();
      await _tts.setSpeechRate(rate.clamp(0.1, 1.0).toDouble());
      await _tts.speak(text);
    } catch (_) {
      _broken = true;
    }
  }

  @override
  Future<void> stop() async {
    if (!isAvailable) return;
    try {
      await _tts.stop();
    } catch (_) {
      // Stopping an idle engine is harmless.
    }
  }

  @override
  Future<void> dispose() => stop();

  Future<void> _configure() async {
    if (_configured) return;
    await _tts.setLanguage('en-US');
    await _tts.setPitch(1.0);
    await _tts.awaitSpeakCompletion(true);
    _configured = true;
  }
}
