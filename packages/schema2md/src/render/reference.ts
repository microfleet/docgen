import { DataObject } from "json2md"
import { SchemaRef } from "@microfleet/schema-tools"

import { getLink } from './util'
import { Renderer } from './renderer'

export function renderRef(node: SchemaRef, _: number): DataObject[] | string[] {
  const result = []
  const { title, $id } = node.data
  const idText = $id ? `\`${$id}\` ` : ''

  result.push(
    `<a href="${getLink(node)}">${title || ''}${idText}(${node.ref.originalRef})</a>`
  )

  return result
}

Renderer.register('x-ref', renderRef)