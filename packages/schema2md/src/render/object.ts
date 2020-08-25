import { DataObject } from "json2md"
import type { SchemaObject, SchemaNode } from "@microfleet/schema-tools"

import { getGenericInfo, renderDefinitions, renderProps } from './util'
import { Renderer } from './renderer'

export function renderObject(node: SchemaObject, level: number): DataObject[] | any {
  const result = []

  result.push(...getGenericInfo(node, level))

  if (node.properties) {
    result.push('Properties:')
    result.push(renderProps(node.properties, level + 1))
  }

  if (node.additionalProperties) {
    // in case we are processing serialized version it's not possible to use instance of
    if (node.additionalProperties.type) {
      result.push({p: 'Additional properties should be:'})
      result.push({
        ul: [...Renderer.render(node.additionalProperties as SchemaNode, level + 1)]
      })
    } else {
      result.push({p:'Additional properties:'})
      result.push(renderProps(node.additionalProperties as {[key: string]: SchemaNode}, level + 1))
    }
  }

  if (node.patternProperties) {
    result.push({p: '**Pattern properties**:'})
    result.push(renderProps(node.patternProperties, level + 1))
  }

  if (node.definitions) {
    result.push('**Definitions**:')
    result.push(renderDefinitions(node, level))
  }
  // result.push('')
  return result
}

Renderer.register('x-object', renderObject)
