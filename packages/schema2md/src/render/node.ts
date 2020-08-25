import { DataObject } from "json2md"
import { SchemaNode } from '@microfleet/schema-tools'

import { renderDefinitions, getGenericInfo } from './util'
import { Renderer } from './renderer'

export function renderNode(node: SchemaNode, level: number): (DataObject|string)[] {
  const result = []
  result.push(...getGenericInfo(node, level + 1))

  if (node.definitions) {
    result.push({p: '**Definitions**:' })
    result.push(renderDefinitions(node, level))
  }

  return result
}

Renderer.register('x-node', renderNode)
