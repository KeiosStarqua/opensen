import 'dart:io' show Platform;

import 'package:sqflite/sqflite.dart' as sqflite;
import 'package:sqflite_common/sqlite_api.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart' as ffi;

/// `sqflite` on Android/iOS/macOS; the FFI factory on Windows/Linux, where
/// the plugin has no implementation.
DatabaseFactory resolveDatabaseFactory() {
  if (Platform.isWindows || Platform.isLinux) {
    ffi.sqfliteFfiInit();
    return ffi.databaseFactoryFfi;
  }
  return sqflite.databaseFactory;
}
