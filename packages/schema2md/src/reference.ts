import { DataObject } from "json2md"
import { SchemaRef } from "@microfleet/schema-tools"

import { linkTo } from './util'
import type { RendererObj } from './index'

export function renderRef(renderer: RendererObj, node: SchemaRef, level: number): (DataObject | string)[] {
  if (level === 0) {
    return renderer.render(node.refData, level)
  }
  const result = []
  const { title, $id } = node.data
  const idText = $id ? `\`${$id}\` ` : ''

  result.push(
    `<a href="${linkTo(renderer, node)}">${title || ''}${idText}(${node.ref.originalRef})</a>`
  )

  return result
}
