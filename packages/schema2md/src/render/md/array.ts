import { DataObject } from "json2md"
import { SchemaArray } from "@microfleet/schema-tools"

import { Renderer, getGenericInfo } from "./util"

export function renderArray(node: SchemaArray, level: number): (string | DataObject)[] {
  const result = []
  result.push(...getGenericInfo(node, level))
  result.push({ p: `Each item should be:`})

  const subs = (Array.isArray(node.items) ? node.items : [ node.items ])
  subs.forEach((sub) => {
    result.push(...Renderer.render(sub, level + 1))
  })

  return result
}

Renderer.register('x-array', renderArray)
