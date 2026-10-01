/// What the app knows about the OpenSen server right now. The app stays
/// fully usable offline; this only reports whether online features can work.
class ServerStatus {
  const ServerStatus({
    required this.reachable,
    required this.contentAvailable,
    this.problem,
  });

  /// The API answered its health check.
  final bool reachable;

  /// Content endpoints (`/api/situations`) answered successfully.
  final bool contentAvailable;

  /// Short human-readable reason when something is not working.
  final String? problem;

  bool get healthy => reachable && contentAvailable;
}
