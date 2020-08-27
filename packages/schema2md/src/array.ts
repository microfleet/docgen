import { DataObject } from 'json2md'
import { SchemaArray } from '@microfleet/schema-tools'

import { getGenericInfo } from './util'
import type { Renderer } from './index'

export function renderArray(renderer: Renderer, node: SchemaArray, level: number): (string | DataObject)[] {
  return [
    ...getGenericInfo(renderer, node, level),
    'Each item should be:',
    ...renderer.render(node.items, level + 1)
  ]
}
