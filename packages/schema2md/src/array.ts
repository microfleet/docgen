import { DataObject } from 'json2md'
import { SchemaArray } from '@microfleet/schema-tools'

import { getGenericInfo } from './util'
import type { RendererObj } from './index'

export function renderArray(renderer: RendererObj, node: SchemaArray, level: number): (string | DataObject)[] {
  const result: (string | DataObject)[] = []
  const ul: (string | DataObject)[] = []

  result.push(
    [...getGenericInfo(renderer, node, level), 'Each item should be:', renderer.render(node.items, level + 1)],
    { ul: ul as string[] } // dirty hack
  )

  return result
}
