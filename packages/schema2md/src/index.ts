import { renderRef } from './reference'
import { renderObject } from './object'
import { renderArray } from './array'
import { renderNode } from './node'
import { renderCondIf, renderCondOf} from './condition'

import type { DataObject } from 'json2md'

import { TREE_NODE_TYPES, SchemaNode, SchemaRef } from '@microfleet/schema-tools'

export type RenderedNode = (DataObject|string)

type RenderFn = (renderer: Renderer, node: any) => RenderedNode[]

type Config = {
  multi: boolean
  linkTo?: (ref: SchemaRef) => string
  linkFrom?: (node: SchemaNode) => string
  [key: string]: any
}

type RendererMap = Map<typeof TREE_NODE_TYPES[number], RenderFn>

export class Renderer {
  public config: Config
  private renderers: RendererMap = new Map()

  constructor(config: Partial<Config>) {
    this.config = {
      multi: false,
      linkBase: '',
      ...config
    }

    this.renderers.set('x-ref', renderRef)
    this.renderers.set('x-object', renderObject)
    this.renderers.set('x-array', renderArray)
    this.renderers.set('x-node', renderNode)
    this.renderers.set('x-cond-if', renderCondIf)
    this.renderers.set('x-cond-of', renderCondOf)

  }

  public render(node: SchemaNode): (DataObject|string)[] {
    const renderer = this.renderers.get(node.type)
    if (renderer) return renderer(this, node)
    throw new Error(`rederer for '${node.type}' not registered`)
  }

}
