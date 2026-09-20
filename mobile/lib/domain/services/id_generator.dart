/// Client-generated ids so content created offline never collides.
abstract class IdGenerator {
  String next();
}

/// Deterministic ids for tests and seed derivation.
class SequentialIdGenerator implements IdGenerator {
  SequentialIdGenerator({this.prefix = 'id'});

  final String prefix;
  int _counter = 0;

  @override
  String next() => '$prefix-${++_counter}';
}
