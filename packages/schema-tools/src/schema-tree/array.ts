import { ResolvedSchema } from '../reference-parser'
import { SchemaNode, Params } from './node'

export class SchemaArray extends SchemaNode {
  public items: SchemaNode
  public variable: boolean

  constructor(node: ResolvedSchema, params: Partial<Params>) {
    const { items: _, ...rest } = node
    super(rest, params)
    this.type = 'x-array'
    this.variable = !node.items.type && !node.items.$xRef
    this.items = this.parseNode(node.items, { path: this.path.concat(`/items`) })
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      items: this.items
    }
  }

  static isArray = (node: ResolvedSchema): boolean => { return node.type === 'array' }
}

SchemaNode.addParser(SchemaArray.isArray, SchemaArray)
