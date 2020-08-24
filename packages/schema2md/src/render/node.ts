import { DataObject } from "json2md"
import { SchemaNode } from '@microfleet/schema-tools'

import { renderDefinitions } from './util'
import { Renderer } from './renderer'

export function renderNode(node: SchemaNode, level: number): (DataObject|string)[] {
  const result = []
  const dataType = node.dataType !== undefined ? `\`{${node.dataType}}\`` : ''

  let constraints = ''
  if (Object.keys(node.constraints).length > 0) {
    const asStrings = Object.entries(node.constraints).map(([key, value]) => `\`${key}\`: \`${value}\``)
    constraints = `Constraints: ${asStrings.join(', ')}`
  }

  result.push(`${dataType}${constraints}`)

  if (node.data.description) result.push(node.data.description )

  if (node.definitions) {
    result.push({ br: "**Definitions**:"})
    result.push(renderDefinitions(node, level))
  }

  return result
}

Renderer.register('x-node', renderNode)
