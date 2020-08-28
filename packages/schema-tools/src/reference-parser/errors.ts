import { helpers as errorHelpers } from 'common-errors'

import type { ResolvedReference } from './index'
import type { JsonSchema } from './walk'

export const ReferenceError = errorHelpers.generateClass('ReferenceError', {
  args: [ 'message', 'parsedReference', 'node' ]
})

export type ReferenceError = {
  parsedReference: ResolvedReference,
  node: JsonSchema
}
