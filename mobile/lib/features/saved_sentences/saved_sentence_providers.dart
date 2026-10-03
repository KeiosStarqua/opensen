import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/di/providers.dart';
import '../../domain/entities/saved_sentence.dart';

final savedSentencesProvider = FutureProvider<List<SavedSentence>>(
  (ref) => ref.watch(savedSentenceRepositoryProvider).list(),
);

final savedSentenceProvider = FutureProvider.family<SavedSentence?, String>(
  (ref, id) => ref.watch(savedSentenceRepositoryProvider).getById(id),
);
