import { DataObject } from "json2md"
import { SchemaNode } from '@microfleet/schema-tools'

import { renderDefinitions, getGenericInfo, renderDefaultsOrExample } from './util'
import type { Renderer } from './index'

export function renderNode(renderer: Renderer, node: SchemaNode, level: number): (DataObject|string)[] {
  const result = []
  result.push(...getGenericInfo(renderer, node, level + 1))

  if (node.data.example) {
    result.push(...renderDefaultsOrExample(node.dataType, 'Example', node.data.example))
  }

  if (node.definitions) {
    result.push({p: '**Definitions**:' })
    result.push(renderDefinitions(renderer, node, level))
  }

  return result
}
