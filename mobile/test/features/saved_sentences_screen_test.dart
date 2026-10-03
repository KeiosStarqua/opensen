import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:opensen/core/di/providers.dart';
import 'package:opensen/core/platform/speech_synthesizer.dart';
import 'package:opensen/domain/entities/learner_settings.dart';
import 'package:opensen/domain/entities/saved_sentence.dart';
import 'package:opensen/domain/repositories/saved_sentence_repository.dart';
import 'package:opensen/features/saved_sentences/saved_sentence_study_screen.dart';
import 'package:opensen/features/saved_sentences/saved_sentences_screen.dart';

class _MemorySentences implements SavedSentenceRepository {
  final List<SavedSentence> items = <SavedSentence>[];

  @override
  Future<SavedSentence> save(String text) async {
    final sentence = SavedSentence(
      id: 's${items.length + 1}',
      text: text,
      createdAt: DateTime.utc(2026, 10, 3),
    );
    items.add(sentence);
    return sentence;
  }

  @override
  Future<List<SavedSentence>> list() async => List<SavedSentence>.of(items);

  @override
  Future<SavedSentence?> getById(String id) async {
    for (final item in items) {
      if (item.id == id) return item;
    }
    return null;
  }

  @override
  Future<SavedSentence?> update(String id, String text) async {
    for (var index = 0; index < items.length; index++) {
      if (items[index].id != id) continue;
      final next = SavedSentence(
        id: id,
        text: text,
        createdAt: items[index].createdAt,
      );
      items[index] = next;
      return next;
    }
    return null;
  }
}

Finder _fieldLabeled(String label) {
  return find.ancestor(
    of: find.text(label),
    matching: find.byType(TextField),
  );
}

void main() {
  testWidgets('saves a sentence and studies that exact text', (tester) async {
    final store = _MemorySentences();
    final router = GoRouter(
      routes: <RouteBase>[
        GoRoute(
          path: '/',
          builder: (context, state) => const SavedSentencesScreen(),
        ),
        GoRoute(
          path: '/saved/:id',
          builder: (context, state) => SavedSentenceStudyScreen(
            id: state.pathParameters['id']!,
          ),
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          savedSentenceRepositoryProvider.overrideWith((ref) => store),
          speechSynthesizerProvider.overrideWith(
            (ref) => const SilentSpeechSynthesizer(),
          ),
          initialSettingsProvider.overrideWith(
            (ref) => const LearnerSettings(onboardingComplete: true),
          ),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Nothing saved yet. Add a sentence you want to say later.'), findsOneWidget);
    expect(find.byType(TextField), findsNothing);

    await tester.tap(find.text('Add a sentence'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), 'Could you say that again?');
    await tester.tap(find.text('Save sentence'));
    await tester.pumpAndSettle();

    expect(store.items.single.text, 'Could you say that again?');
    expect(find.byType(ListTile), findsOneWidget);

    await tester.tap(find.byType(ListTile));
    await tester.pumpAndSettle();

    expect(find.text('Study this sentence'), findsOneWidget);
    await tester.enterText(
      _fieldLabeled('Say or type the sentence'),
      'Could you say that again?',
    );
    await tester.tap(find.text('Check'));
    await tester.pump();

    expect(find.text("That's the sentence."), findsOneWidget);
    expect(store.items, hasLength(1));
  });

  testWidgets('an edited sentence is what the list and the study step use', (
    tester,
  ) async {
    final store = _MemorySentences();
    store.items.add(
      SavedSentence(
        id: 's1',
        text: 'Could you say that again?',
        createdAt: DateTime.utc(2026, 10, 3),
      ),
    );
    final router = GoRouter(
      routes: <RouteBase>[
        GoRoute(
          path: '/',
          builder: (context, state) => const SavedSentencesScreen(),
        ),
        GoRoute(
          path: '/saved/:id',
          builder: (context, state) => SavedSentenceStudyScreen(
            id: state.pathParameters['id']!,
          ),
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          savedSentenceRepositoryProvider.overrideWith((ref) => store),
          speechSynthesizerProvider.overrideWith(
            (ref) => const SilentSpeechSynthesizer(),
          ),
          initialSettingsProvider.overrideWith(
            (ref) => const LearnerSettings(onboardingComplete: true),
          ),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byType(ListTile));
    await tester.pumpAndSettle();

    await tester.enterText(_fieldLabeled('Sentence'), 'Could you repeat that?');
    await tester.tap(find.text('Save changes'));
    await tester.pumpAndSettle();

    expect(find.text('Could you repeat that?'), findsWidgets);
    await tester.enterText(
      _fieldLabeled('Say or type the sentence'),
      'Could you repeat that?',
    );
    await tester.tap(find.text('Check'));
    await tester.pump();
    expect(find.text("That's the sentence."), findsOneWidget);

    await tester.pageBack();
    await tester.pumpAndSettle();
    expect(find.text('Could you repeat that?'), findsOneWidget);
    expect(find.text('Could you say that again?'), findsNothing);
    expect(store.items.single.text, 'Could you repeat that?');
  });
}
