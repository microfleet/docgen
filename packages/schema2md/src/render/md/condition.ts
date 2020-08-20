import { DataObject } from "json2md"
import { SchemaConditionalOf, SchemaConditionalIf } from "@microfleet/schema-tools"

import { Renderer } from './util'

export function renderCondOf(node: SchemaConditionalOf, level: number): DataObject[] {
  const result: DataObject[] = []
  result.push({ p: `*Could be ${node.condition}:*` })
  result.push({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore It works!
    ul: node.possibles.map((condition) => Renderer.render(condition, level + 1))
  })
  return result
}

Renderer.register('x-cond-of', renderCondOf)

export function renderCondIf(node: SchemaConditionalIf, level: number): DataObject[] {
  const result: DataObject[] = []
  result.push({ p: `*If:*` })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  result.push({ p: Renderer.render(node.if, level + 1)})

  result.push({ p: `*Then:*` })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  result.push({ p: Renderer.render(node.then, level + 1)})

  if (node.else) {
    result.push({ p: `*Else:*` })
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    result.push({ p: Renderer.render(node.else, level + 1)})
  }
  return result
}

Renderer.register('x-cond-if', renderCondIf)

