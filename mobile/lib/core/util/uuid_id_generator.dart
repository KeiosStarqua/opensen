import 'package:uuid/uuid.dart';

import '../../domain/services/id_generator.dart';

class UuidIdGenerator implements IdGenerator {
  const UuidIdGenerator();

  static const Uuid _uuid = Uuid();

  @override
  String next() => _uuid.v4();
}
