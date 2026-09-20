import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/bootstrap.dart';
import 'core/di/providers.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final bootstrap = await AppBootstrap.run();
  runApp(
    ProviderScope(
      overrides: [
        databaseProvider.overrideWith((ref) => bootstrap.database),
        initialSettingsProvider.overrideWith((ref) => bootstrap.settings),
      ],
      child: const OpenSenApp(),
    ),
  );
}
