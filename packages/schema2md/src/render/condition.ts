import { DataObject } from "json2md"
import { SchemaConditionalOf, SchemaConditionalIf } from "@microfleet/schema-tools"

import { Renderer } from './renderer'

export function renderCondOf(node: SchemaConditionalOf, level: number): (DataObject| string)[] {
  const result: DataObject[] = []

  result.push({ p: `*Could be ${node.condition}:*`})

  // @todo consistent types
  result.push({
    ul: node.possibles.map((condition) => Renderer.render(condition, level + 1)) as unknown as string[]
  })

  return result
}

Renderer.register('x-cond-of', renderCondOf)

export function renderCondIf(node: SchemaConditionalIf, level: number): DataObject[] {
  const result: (DataObject | string)[] = []
  result.push({ p: [
    `*If:*`,
    ...Renderer.render(node.if, level + 1) as string[]
  ] })

  result.push({ p: [
    `*Then:*`,
    ...Renderer.render(node.then, level + 1) as string[]
  ] })

  // @todo consistent types
  if (node.else) result.push({ p: [`*Else:*`, ...Renderer.render(node.else, level + 1) as string[]] })

  return [{ ul: result as string[] }]
}

Renderer.register('x-cond-if', renderCondIf)
