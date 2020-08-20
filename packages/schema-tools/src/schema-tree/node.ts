import { omit, pick } from 'lodash'
import { JsonPointer } from 'json-ptr'
import { ResolvedSchema } from '../reference-parser'
import type { SchemaRef } from './ref'

import {
  TREE_NODE_TYPES,
  SCHEMA_DESCRIPTION_KEYS,
  IF_CONDITION_KEYS,
  OF_CONDITION_KEYS,
  SCHEMA_KEYWORDS
} from './constants'

const emptyPath = JsonPointer.create('')

type Specs = {
  isProperty?: boolean,
  isAdditionalProperty?: boolean,
  isPatternProperty?: boolean,
  isDefinition?: boolean,
  isRequired?: boolean,
  isCondition?: boolean,
  rootId?: string
}

export type Params = Specs & {
  path: JsonPointer,
  parentPath: JsonPointer,
  deep: number,
  parent: SchemaNode,
}

type Constraints = {
  [key: string]: any
}

type Data = {
  '$id': any
} & {
  [key in typeof SCHEMA_DESCRIPTION_KEYS[number]]: any
}

type Properties = {
  [key: string]: SchemaNode
}

export type Parser = {
  fn: (rs: ResolvedSchema) => boolean
  cl: typeof SchemaNode
}

export class SchemaNode {
  nodes: Map<JsonPointer, SchemaNode> = new Map()
  public params: Specs = {}
  public type: typeof TREE_NODE_TYPES[number] = 'x-node'
  public dataType = ''
  public constraints: Constraints
  public data: Data
  public path: JsonPointer
  public parentPath: JsonPointer
  public deep: number
  public parent?: SchemaNode

  public ifCondition: any; // #TODO
  public definitions?: { [key: string]: SchemaNode }

  static parsers = new Set<Parser>()

  constructor(node: ResolvedSchema, params?: Partial<Params>) {
    const defaults = {
      path: emptyPath,
      parentPath: emptyPath,
      deep: 0,
    }

    const { path, parentPath, parent, deep, ...restParams } = { ...defaults , ...params }
    const { type, ...rest } = node

    this.params = restParams
    this.dataType = type
    this.constraints = omit(rest, ['$id', 'definitions', ...SCHEMA_DESCRIPTION_KEYS, ...IF_CONDITION_KEYS])
    this.data = pick(rest, ['$id', ...SCHEMA_DESCRIPTION_KEYS])
    this.path = path
    this.parentPath = parentPath
    this.parent = parent
    this.deep = deep

    const conditionals = pick(rest, IF_CONDITION_KEYS)
    if (Object.keys(conditionals).length > 0) {
      this.ifCondition = this.parseNode(conditionals, {
        isCondition: true,
        path: this.path.concat('/if')
      })
    }

    if (rest.definitions) {
      this.definitions = this.parseProperties(rest.definitions, 'definitions', { isDefinition: true })
    }
  }

  protected parseProperties(props: Record<string, ResolvedSchema>, extraPath: string, params: Partial<Params>): Properties {
    const propsObject: Properties = {}

    if (props) {
      for (const [key, prop] of Object.entries(props)) {
        const { constraints } = this
        const isRequired = constraints.required ? constraints.required.includes(prop) : false
        const path = this.path.concat(`/${extraPath}`).concat(`/${key}`)

        if (OF_CONDITION_KEYS.includes(key)) {
          propsObject[key] = this.parseNode({ [key]: prop }, {...params, isRequired, path })
        } else {
          propsObject[key] = this.parseNode(prop, { ...params, isRequired, path })
        }
      }
    }

    return propsObject
  }

  protected addNode(node: SchemaNode): void {
    const parentPathLength = [...node.parentPath.path].length
    const pathLength = [...node.path.path].length

    const segments = node.path.path.slice(parentPathLength, parentPathLength + pathLength - parentPathLength)
    const nodePath = JsonPointer.create(segments)

    if (this.nodes.has(nodePath)) throw new Error(`node path exists: ${nodePath}`)

    this.nodes.set(nodePath, node)
    if (this.parent) this.parent.addNode(node)
  }

  protected parseNode(node: ResolvedSchema, params?: Partial<Params>): SchemaNode {
    const parser = [...SchemaNode.parsers.values()].find(({ fn }) => fn(node))
    const c = parser ? parser.cl : SchemaNode

    const newNode = new c(node, {
      ...this.params,
      ...params,
      parent: this,
      parentPath: this.path,
      deep: this.deep + 1
    })

    this.addNode(newNode)

    return newNode
  }

  findRefs(): SchemaRef[] {
    return [...this.nodes.values()].filter((node) => node.type === 'x-ref') as SchemaRef[]
  }

  toJSON(): any {
    return {
      ...this.params,
      type: this.type,
      dataType: this.dataType,
      data: this.data,
      constraints: this.constraints,
      definitions: this.definitions,
    }
  }

  static hasKeywords(node: ResolvedSchema): boolean {
    const keys = Object.keys(node)
    const existing = SCHEMA_KEYWORDS.filter((key) => keys.includes(key as string))
    return existing.length > 0
  }

  static addParser = (fn: Parser['fn'], cl: Parser['cl']): void => {
    SchemaNode.parsers.add({ fn, cl})
  }

  static parse = (schema: ResolvedSchema): SchemaNode => {
    return (new SchemaNode({}, {})).parseNode(schema, { rootId: schema.$id, deep: -1 })
  }
}
