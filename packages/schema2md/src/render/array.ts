import { DataObject } from 'json2md'
import { SchemaArray } from '@microfleet/schema-tools'

import { getGenericInfo } from './util'
import { Renderer } from './renderer'

export function renderArray(node: SchemaArray, level: number): (string | DataObject)[] | string[] | DataObject[] {
  const result: (string | DataObject)[] = []
  const ul: (string | DataObject)[] = []

  // @todo consistent types
  result.push(
    [...getGenericInfo(node, level), '<br>Each item should be:', Renderer.render(node.items, level + 1)],
    { ul: ul as string[] }
  )

  return result
}

Renderer.register('x-array', renderArray)
