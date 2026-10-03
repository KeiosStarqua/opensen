import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/di/providers.dart';
import '../../core/theme/phosphor_icons.dart';
import '../../domain/entities/saved_sentence.dart';
import '../../domain/services/answer_matcher.dart';
import 'saved_sentence_providers.dart';

/// Listen, then produce the saved sentence. This is the existing recall
/// check for one sentence. It does not write an FSRS review.
class SavedSentenceStudyScreen extends ConsumerStatefulWidget {
  const SavedSentenceStudyScreen({super.key, required this.id});

  final String id;

  @override
  ConsumerState<SavedSentenceStudyScreen> createState() =>
      _SavedSentenceStudyScreenState();
}

class _SavedSentenceStudyScreenState
    extends ConsumerState<SavedSentenceStudyScreen> {
  final TextEditingController _typed = TextEditingController();
  String? _result;

  @override
  void dispose() {
    _typed.dispose();
    super.dispose();
  }

  Future<void> _speak(String text) async {
    final speech = ref.read(speechSynthesizerProvider);
    final settings = ref.read(settingsProvider);
    if (!speech.isAvailable || !settings.ttsEnabled) return;
    await speech.speak(text, rate: settings.speechRate);
  }

  void _check(SavedSentence sentence) {
    final score = AnswerMatcher.similarity(sentence.text, _typed.text);
    setState(() {
      _result = AnswerMatcher.isCorrect(score)
          ? "That's the sentence."
          : 'Not quite — listen again and try once more.';
    });
  }

  @override
  Widget build(BuildContext context) {
    final sentence = ref.watch(savedSentenceProvider(widget.id));
    return Scaffold(
      appBar: AppBar(title: const Text('Study this sentence')),
      body: sentence.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Padding(
          padding: const EdgeInsets.all(16),
          child: Text('$error'),
        ),
        data: (item) {
          if (item == null) {
            return const Padding(
              padding: EdgeInsets.all(16),
              child: Text('That sentence is not on this account.'),
            );
          }
          return ListView(
            padding: const EdgeInsets.all(16),
            children: <Widget>[
              Text(
                item.text,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => _speak(item.text),
                icon: PhosphorIcon(PhosphorIconsRegular.speakerHigh),
                label: const Text('Listen'),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _typed,
                minLines: 2,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: 'Say or type the sentence',
                ),
              ),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () => _check(item),
                child: const Text('Check'),
              ),
              if (_result != null) ...<Widget>[
                const SizedBox(height: 12),
                Text(_result!),
              ],
            ],
          );
        },
      ),
    );
  }
}
