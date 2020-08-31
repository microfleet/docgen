import { SchemaRef } from "@microfleet/schema-tools"

import { linkTo } from './util'
import type { Renderer, RenderedNode } from './index'

export function renderRef(renderer: Renderer, node: SchemaRef): RenderedNode[] {
  if (node.depth === 0) {
    return renderer.render(node.refData)
  }
  const result = []
  const { title, $id } = node.data
  const idText = $id ? `\`${$id}\` ` : ''

  result.push(
    `[${title || ''}${idText}(${node.ref.originalRef})](${linkTo(renderer, node)})`
  )

  return result
}
