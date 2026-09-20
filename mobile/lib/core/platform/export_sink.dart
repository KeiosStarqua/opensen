import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

/// Hands an export file to the learner (share sheet, save dialog, …).
abstract class ExportSink {
  Future<void> deliver({
    required String fileName,
    required String content,
    String? message,
  });
}

/// Writes the file to the temp directory and opens the platform share sheet.
class ShareExportSink implements ExportSink {
  const ShareExportSink();

  @override
  Future<void> deliver({
    required String fileName,
    required String content,
    String? message,
  }) async {
    final directory = await getTemporaryDirectory();
    final file = File(p.join(directory.path, fileName));
    await file.writeAsString(content, flush: true);
    await SharePlus.instance.share(
      ShareParams(
        files: <XFile>[XFile(file.path)],
        text: message,
        subject: 'OpenSen · Anki export',
      ),
    );
  }
}