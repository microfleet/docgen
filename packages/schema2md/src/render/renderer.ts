import * as json2md from 'json2md'

import { TREE_NODE_TYPES, SchemaNode } from '@microfleet/schema-tools'

type RenderFn = (node: any, level: number) => (json2md.DataObject|string)[]

json2md.converters.text = (input, json2md) => {
  const result: string[] = []

  if (typeof input === 'string') return input

  Object.values(input).map((v: any) => {
    result.push(json2md(v, ''))
  })

  return result.join('!')
}

export class Renderer {
  static renderers: Map<typeof TREE_NODE_TYPES[number], RenderFn> = new Map()
  static register(name: typeof TREE_NODE_TYPES[number], fn: RenderFn): void {
    Renderer.renderers.set(name, fn)
  }
  static render(node: SchemaNode, level: number): (json2md.DataObject|string)[] {
    const render = Renderer.renderers.get(node.type)
    if (render) return render(node, level)
    throw new Error(`rederer for '${node.type}' not registered`)
  }
}
