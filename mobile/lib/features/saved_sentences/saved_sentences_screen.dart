import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/di/providers.dart';
import '../../core/routing/app_routes.dart';
import '../../core/theme/phosphor_icons.dart';
import '../../domain/repositories/account_gateway.dart';
import '../../domain/repositories/saved_sentence_repository.dart';
import 'saved_sentence_providers.dart';

/// Paste a sentence heard or read outside the app. The list is the account
/// store, so the same sentences show up on the web.
class SavedSentencesScreen extends ConsumerStatefulWidget {
  const SavedSentencesScreen({super.key});

  @override
  ConsumerState<SavedSentencesScreen> createState() =>
      _SavedSentencesScreenState();
}

class _SavedSentencesScreenState extends ConsumerState<SavedSentencesScreen> {
  final TextEditingController _sentence = TextEditingController();
  final TextEditingController _email = TextEditingController();
  final TextEditingController _password = TextEditingController();
  String? _formError;
  bool _saving = false;
  bool _signingIn = false;

  @override
  void dispose() {
    _sentence.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _formError = null;
    });
    try {
      await ref.read(saveHeardSentenceUseCaseProvider).call(_sentence.text);
      _sentence.clear();
      ref.invalidate(savedSentencesProvider);
    } on FormatException catch (error) {
      _formError = error.message;
    } on SavedSentenceAccessException catch (error) {
      _formError = error.toString();
    } catch (error) {
      _formError = '$error';
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _signIn() async {
    setState(() {
      _signingIn = true;
      _formError = null;
    });
    try {
      final token = await ref.read(accountGatewayProvider).signIn(
            email: _email.text,
            password: _password.text,
          );
      await ref.read(learnerSessionProvider).writeToken(token);
      _password.clear();
      ref.invalidate(savedSentencesProvider);
    } on AccountSignInException catch (error) {
      _formError = error.message;
    } catch (error) {
      _formError = '$error';
    } finally {
      if (mounted) setState(() => _signingIn = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final sentences = ref.watch(savedSentencesProvider);
    final needsSignIn =
        sentences.hasError && sentences.error is SavedSentenceAccessException;

    return Scaffold(
      appBar: AppBar(title: const Text('Sentences you heard')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: <Widget>[
          Text(
            'Paste a sentence you heard or read. It stays on your account.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          if (needsSignIn) ...<Widget>[
            Text(
              'Sign in with the same account you use on the web.',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              autocorrect: false,
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            TextField(
              controller: _password,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Password'),
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: _signingIn ? null : _signIn,
              child: Text(_signingIn ? 'Signing in…' : 'Sign in'),
            ),
          ] else ...<Widget>[
            TextField(
              controller: _sentence,
              minLines: 2,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'Sentence',
                hintText: 'Could you say that again?',
              ),
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: _saving ? null : _save,
              child: Text(_saving ? 'Saving…' : 'Save sentence'),
            ),
          ],
          if (_formError != null) ...<Widget>[
            const SizedBox(height: 8),
            Text(
              _formError!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: 24),
          sentences.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => needsSignIn
                ? const SizedBox.shrink()
                : Text('$error'),
            data: (items) {
              if (items.isEmpty) {
                return const Text(
                  'Nothing saved yet. Add a sentence you want to say later.',
                );
              }
              return Column(
                children: <Widget>[
                  for (final item in items)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: PhosphorIcon(PhosphorIconsRegular.quotes),
                      title: Text(item.text),
                      trailing: PhosphorIcon(PhosphorIconsRegular.caretRight),
                      onTap: () =>
                          context.push(AppRoutes.savedSentence(item.id)),
                    ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}
