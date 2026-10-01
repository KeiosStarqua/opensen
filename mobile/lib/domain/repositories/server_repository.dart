import '../entities/server_status.dart';

/// The OpenSen backend as seen by the app. Implementations must not throw:
/// network and server failures are reported inside [ServerStatus].
abstract class ServerRepository {
  /// Base URL the app talks to, for display.
  String get baseUrl;

  Future<ServerStatus> checkStatus();
}
