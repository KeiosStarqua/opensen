/// OpenSen API base URL. Override per build:
/// `flutter run --dart-define=OPENSEN_API_URL=http://localhost:3000`.
const String openSenApiUrl = String.fromEnvironment(
  'OPENSEN_API_URL',
  defaultValue: 'https://api.opensen.taquangkhoi.com/',
);

/// Same Neon Auth base URL as the web app. Empty until the build sets
/// `--dart-define=NEON_AUTH_BASE_URL=...`.
const String neonAuthBaseUrl = String.fromEnvironment(
  'NEON_AUTH_BASE_URL',
  defaultValue: '',
);
