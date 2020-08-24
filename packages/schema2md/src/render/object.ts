import { DataObject } from "json2md"
import { SchemaObject, SchemaNode } from "@microfleet/schema-tools"

import { getGenericInfo, renderDefinitions, renderProps } from './util'
import { Renderer } from './renderer'

export function renderObject(node: SchemaObject, level: number): DataObject[] | any {
  const result = []
  const additionalProperties = node.haveAdditionalProperties || true

  result.push(...getGenericInfo(node, level))
  result.push({ p: `Additional properties allowed: \`${additionalProperties}\``})

  if (node.properties) {
    result.push({ p: "Properties:"})
    result.push(renderProps(node.properties, level + 1))
  }

  if (node.additionalProperties) {
    if (node.additionalProperties instanceof SchemaNode) {
      result.push({ p: [
        'Additional properties should be:',
        {
          ul: [...Renderer.render(node.additionalProperties, level + 1)]
        }]
      })
    } else {
      result.push({ p: "Additional properties:"})
      result.push(renderProps(node.additionalProperties, level + 1))
    }
  }

  if (node.patternProperties) {
    result.push({ p: "**Pattern properties**:"})
    result.push(renderProps(node.patternProperties, level + 1))
  }

  if (node.definitions) {
    result.push({ p: "**Definitions**:"})
    result.push(renderDefinitions(node, level))
  }
  // result.push('')
  return result
}

Renderer.register('x-object', renderObject)
