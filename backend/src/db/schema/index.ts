export * from './enums.js'
export * from './users.js'
export * from './content.js'
export * from './generation.js'
export * from './practice.js'

import * as enums from './enums.js'
import * as users from './users.js'
import * as content from './content.js'
import * as generation from './generation.js'
import * as practice from './practice.js'

export const schema = {
  ...enums,
  ...users,
  ...content,
  ...generation,
  ...practice,
}
