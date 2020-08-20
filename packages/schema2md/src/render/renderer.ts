import { DataObject } from 'json2md'
import { TREE_NODE_TYPES, SchemaNode } from '@microfleet/schema-tools'

type RenderFn = (node: any, level: number) => (DataObject|string)[]

export class Renderer {
  static renderers: Map<typeof TREE_NODE_TYPES[number], RenderFn> = new Map()
  static register(name: typeof TREE_NODE_TYPES[number], fn: RenderFn): void {
    Renderer.renderers.set(name, fn)
  }
  static render(node: SchemaNode, level: number): (DataObject|string)[] {
    const render = Renderer.renderers.get(node.type)
    if (render) return render(node, level)
    throw new Error(`rederer for '${node.type}' not registered`)
  }
}
