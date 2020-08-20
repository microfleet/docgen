import { DataObject } from 'json2md'
import { SchemaArray } from '@microfleet/schema-tools'

import { getGenericInfo } from './util'
import { Renderer } from './renderer'

export function renderArray(node: SchemaArray, level: number): (string | DataObject)[] | string[] | DataObject[] {
  const result: (string | DataObject)[] = []
  const ul: (string | DataObject)[] = []

  result.push(...getGenericInfo(node, level))

  const subs = (Array.isArray(node.items) ? node.items : [ node.items ])
  subs.forEach((sub) => {
    ul.push(...Renderer.render(sub, level + 1))
  })

  // @todo consistent types
  result.push({ p: `Each item should be:` }, { ul: ul as string[] })

  return result
}

Renderer.register('x-array', renderArray)
