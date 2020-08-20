import { DataObject } from "json2md"
import { SchemaNode } from '@microfleet/schema-tools'

import { Renderer } from './util'

export function renderNode(node: SchemaNode, level: number): (DataObject|string)[] {
  const result = []
  // const nodeT
  // result.push(`\`{${node.dataType}}\``)

  let constraints = ''
  if (Object.keys(node.constraints).length > 0) {
    const asStrings = Object.entries(node.constraints).map(([key, value]) => `\`${key}\`: \`${value}\``)
    // result.push({ p: `Constraints: ${asStrings.join(', ')}`})
    // result.push(`Constraints: ${asStrings.join(', ')}`)
    constraints = `Constraints: ${asStrings.join(', ')}`
  }
  const dataType = node.dataType !== undefined ? `\`{${node.dataType}}\`` : ''
  result.push(`${dataType}${constraints}`)
  if (node.data.description) result.push(node.data.description )

  if (node.definitions && Object.values(node.definitions).length > 0) {
    result.push({ p: "**Definitions**:"})
    result.push(
      {
        ul: Object.entries(node.definitions).map(( [,prop] ) => {
          const row = []
          row.push([
            `**${node.data.$id || ''}#${prop.path.toString()}**`,
            ...Renderer.render(prop, level + 2)
          ])

          return row
        })
      }
    )
  }

  return result

}

Renderer.register('x-node', renderNode)
