import { DataObject } from "json2md"
import { SchemaRef } from "@microfleet/schema-tools"

import { linkTo } from './util'
import type { Renderer } from './index'

export function renderRef(renderer: Renderer, node: SchemaRef, level: number): (DataObject | string)[] {
  if (node.depth === 0) {
    return renderer.render(node.refData, level)
  }
  const result = []
  const { title, $id } = node.data
  const idText = $id ? `\`${$id}\` ` : ''

  result.push(
    `[${title || ''}${idText}(${node.ref.originalRef})](${linkTo(renderer, node)})`
  )

  return result
}
