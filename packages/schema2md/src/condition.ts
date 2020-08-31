import { SchemaConditionalOf, SchemaConditionalIf } from "@microfleet/schema-tools"

import type { Renderer, RenderedNode } from './index'

export function renderCondOf(renderer: Renderer, node: SchemaConditionalOf): RenderedNode[] {
  const result: RenderedNode[] = []

  result.push(`*Could be ${node.condition}:*`)
  result.push(
    {
      ul: node.possibles.map((condition) => renderer.render(condition) as any)
    }
  )

  return result
}


export function renderCondIf(renderer: Renderer, node: SchemaConditionalIf): RenderedNode[] {
  const result: RenderedNode[] = []
  result.push([
    `*If:*`,
    ...renderer.render(node.if)
  ])

  result.push([
    `*Then:*`,
    ...renderer.render(node.then)
  ])

  if (node.else) result.push([
    `*Else:*`,
    ...renderer.render(node.else)
  ])

  return [{ ul: result as string[] }]
}
