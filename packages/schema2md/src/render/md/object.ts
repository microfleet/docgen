import { DataObject } from "json2md"
import { SchemaObject, SchemaNode } from "@microfleet/schema-tools"

import { Renderer, getGenericInfo } from './util'

export function renderObject(node: SchemaObject, level: number): DataObject[] | any {
  const result = []
  const additionalProperties = node.haveAdditionalProperties || true

  result.push(...getGenericInfo(node, level))
  result.push({ p: `Additional properties allowed: \`${additionalProperties}\``})

  if (node.properties && Object.values(node.properties).length > 0) {
    result.push({ p: "Properties:"})
    result.push({
      ul: [
        ...Object.entries(node.properties).map(( [name, prop] ) => {
          const row = []
          row.push([ `**${name}**: `, ...Renderer.render(prop, level + 1) ])
          return row
        })
      ]
    })
  }

  if (node.additionalProperties && Object.values(node.additionalProperties).length > 0) {
    result.push({ p: "Additional properties:"})
    if (node.additionalProperties instanceof SchemaNode) {
      result.push(Renderer.render(node.additionalProperties, level + 1))
    } else {
      result.push(
        ...Object.entries(node.additionalProperties).map(( [, prop] ) => {
          return Renderer.render(prop, level + 1)
        })
      )
    }
  }

  if (node.patternProperties && Object.values(node.patternProperties).length > 0) {
    result.push({ p: "**Pattern properties**:"})
    result.push({
      ul: [
        ...Object.entries(node.patternProperties).map(( [name, prop] ) => {
          const row = []
          row.push(`${name}: {${prop.dataType}}`)
          row.push(...Renderer.render(prop, level + 1))
          return row
        })
      ]
    })
  }

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

Renderer.register('x-object', renderObject)
