import { SchemaArray } from '@microfleet/schema-tools'

import { getGenericInfo } from './util'
import type { Renderer, RenderedNode } from './index'

export function renderArray(renderer: Renderer, node: SchemaArray): RenderedNode[] {
  return [
    ...getGenericInfo(renderer, node),
    'Each item should be:',
    ...renderer.render(node.items)
  ]
}
