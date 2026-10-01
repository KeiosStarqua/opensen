/// OpenSen API base URL. Override per build:
/// `flutter run --dart-define=OPENSEN_API_URL=http://localhost:3000`.
const String openSenApiUrl = String.fromEnvironment(
  'OPENSEN_API_URL',
  defaultValue: 'https://api.opensen.taquangkhoi.com/',
);
