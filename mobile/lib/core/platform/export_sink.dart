import 'dart:convert' show utf8;
import 'dart:io';

import 'package:flutter/foundation.dart' show kIsWeb;
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
/// On web there is no file system, so the file is handed over from memory
/// (the browser downloads or shares it).
class ShareExportSink implements ExportSink {
  const ShareExportSink();

  @override
  Future<void> deliver({
    required String fileName,
    required String content,
    String? message,
  }) async {
    final XFile file;
    if (kIsWeb) {
      file = XFile.fromData(
        utf8.encode(content),
        name: fileName,
        mimeType: 'text/plain',
      );
    } else {
      final directory = await getTemporaryDirectory();
      final written = File(p.join(directory.path, fileName));
      await written.writeAsString(content, flush: true);
      file = XFile(written.path);
    }
    await SharePlus.instance.share(
      ShareParams(
        files: <XFile>[file],
        fileNameOverrides: <String>[fileName],
        text: message,
        subject: 'OpenSen · Anki export',
      ),
    );
  }
}