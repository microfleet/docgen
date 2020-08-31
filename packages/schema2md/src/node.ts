import { SchemaNode } from '@microfleet/schema-tools'

import { renderDefinitions, getGenericInfo, renderDefaultsOrExample } from './util'
import type { Renderer, RenderedNode } from './index'

export function renderNode(renderer: Renderer, node: SchemaNode): RenderedNode[] {
  const result = []
  result.push(...getGenericInfo(renderer, node))

  if (node.data.example) {
    result.push(...renderDefaultsOrExample(node.dataType, 'Example', node.data.example))
  }

  if (node.definitions) {
    result.push({p: '**Definitions**:' })
    result.push(renderDefinitions(renderer, node))
  }

  return result
}
