// Picks the SQLite factory for the current platform at compile time:
// native builds get `sqflite` / FFI, web builds get the WASM factory, so
// neither pulls in the other's platform libraries.
export 'database_factory_io.dart'
    if (dart.library.js_interop) 'database_factory_web.dart';
