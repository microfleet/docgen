import { DataObject } from "json2md"
import type { SchemaObject, SchemaNode } from "@microfleet/schema-tools"

import { getGenericInfo, renderDefinitions, renderProps } from './util'
import type { Renderer } from './index'

export function renderObject(renderer: Renderer, node: SchemaObject, level: number): DataObject[] | any {
  const result = []

  result.push(...getGenericInfo(renderer, node, level))

  if (node.properties) {
    result.push('Properties:')
    result.push(renderProps(renderer, node.properties, level + 1))
  }

  if (node.additionalProperties) {
    result.push({p: 'Additional properties should be:'})
    result.push({
      ul: [...renderer.render(node.additionalProperties as SchemaNode, level + 1)]
    })
  }

  if (node.patternProperties) {
    result.push({p: '**Pattern properties**:'})
    result.push(renderProps(renderer, node.patternProperties, level + 1))
  }

  if (node.definitions) {
    result.push('**Definitions**:')
    result.push(renderDefinitions(renderer, node, level))
  }

  return result
}
