import { DataObject } from 'json2md'
import { SchemaNode, SchemaRef, TREE_NODE_TYPES } from '@microfleet/schema-tools'

export function getHeaderLevel(current: number, level: number, node: SchemaNode): string {
  const finalLevel = current + node.deep + level
  return `h${finalLevel > 6 ? 6 : finalLevel }`
}

export function isProperty(node: SchemaNode): boolean {
  const { params } = node
  return params.isProperty || params.isAdditionalProperty || params.isPatternProperty ? true : false
}

export function getLink(referenceNode: SchemaRef): string {
  const { id, hash } = referenceNode.ref
  return `${id}${hash}`
}

export function getGenericInfo(node: SchemaNode, _: number): (DataObject | string)[] {
  const result: (DataObject|string)[] = []

  const { description } = node.data
  const { path } = node

  let link = ''

  if (node.params.isDefinition || isProperty(node)) {
    link = `<a name="${node.params.rootId || ''}#${path.toString()}"/>`
  }

  result.push(`\`{${node.dataType}}\` ${link}`)

  if (Object.keys(node.constraints).length > 0) {
    const asStrings = Object.entries(node.constraints).map(([key, value]) => `\`${key}\`: \`${value}\``)
    result.push(`Constraints: ${asStrings.join(', ')}`)
  }

  if (description) result.push({ p: description })

  return result
}

type RenderFn = (node: any, level: number) => DataObject[] | string[] | (DataObject|string)[]

export class Renderer {
  static renderers: Map<typeof TREE_NODE_TYPES[number], RenderFn> = new Map()
  static register(name: typeof TREE_NODE_TYPES[number], fn: RenderFn): void {
    Renderer.renderers.set(name, fn)
  }
  static render(node: SchemaNode, level: number): DataObject[] | string[] | (DataObject|string)[] {
    const render = Renderer.renderers.get(node.type)
    if (render) return render(node, level)
    throw new Error(`rederer for '${node.type}' not registered`)
  }
}
