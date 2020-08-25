import { DataObject } from "json2md"
import { SchemaConditionalOf, SchemaConditionalIf } from "@microfleet/schema-tools"

import type { RendererObj } from './index'

export function renderCondOf(renderer: RendererObj, node: SchemaConditionalOf, level: number): (DataObject| string)[] {
  const result: (DataObject | string)[] = []

  result.push(`*Could be ${node.condition}:*`)
  result.push(
    {
      ul: node.possibles.map((condition) => renderer.render(condition, level + 1)) as unknown as string[]
    }
  )

  return result
}


export function renderCondIf(renderer: RendererObj, node: SchemaConditionalIf, level: number): DataObject[] {
  const result: (DataObject | string)[] = []
  result.push([
    `*If:*`,
    ...renderer.render(node.if, level + 1)
  ])

  result.push([
    `*Then:*`,
    ...renderer.render(node.then, level + 1)
  ])

  if (node.else) result.push([
    `*Else:*`,
    ...renderer.render(node.else, level + 1)
  ])

  return [{ ul: result as string[] }]
}
