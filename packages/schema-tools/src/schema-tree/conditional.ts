import { omit } from 'lodash'

import { SchemaNode, Params } from './node'
import { IF_CONDITION_KEYS, OF_CONDITION_KEYS, OF_CONDITION } from './constants'
import { ResolvedSchema } from '../reference-parser'

export class SchemaConditionalIf extends SchemaNode {
  public if: SchemaNode
  public then: SchemaNode
  public else?: SchemaNode

  constructor(node: ResolvedSchema, params: Partial<Params>) {
    const rest = omit(node, IF_CONDITION_KEYS)
    super(rest, params)

    this.type = 'x-cond-if'
    this.if = this.parseNode(node.if, { })

    if (!node.then) throw new Error('Should have then condition')
    this.then = this.then = this.parseNode(node.then, { path: this.path.concat('/then') })

    if (node.else) this.else = this.parseNode(node.else, { path: this.path.concat('/else') })
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      if: this.if,
      then: this.then,
      else: this.else,
    }
  }

  static isConditionalIf = (node: ResolvedSchema): boolean => { return node.if }
}

export class SchemaConditionalOf extends SchemaNode {
  public condition: OF_CONDITION
  public possibles: SchemaNode[]

  constructor(node: ResolvedSchema, params: Partial<Params>) {
    const [condition] = Object.keys(node).filter((key: string) => OF_CONDITION_KEYS.includes((key)))
    if (!condition) throw new Error('No condition keywords')

    const rest = omit(node, OF_CONDITION_KEYS)

    super(rest, params)

    this.type = 'x-cond-of'
    this.condition = condition
    this.possibles = node[condition]
      .map((cond: ResolvedSchema, index: number) => {
        const subPath = this.path.concat(`/${condition}/${index}`)
        return this.parseNode(cond, { path: subPath })
      })
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      condition: this.condition,
      possibilities: this.possibles,
    }
  }

  static isConditionalOf = (node: ResolvedSchema): boolean => {
    const found = Object.keys(node).filter((key) => OF_CONDITION_KEYS.includes(key))
    return found.length > 0
  }
}

SchemaNode.addParser(SchemaConditionalIf.isConditionalIf, SchemaConditionalIf)
SchemaNode.addParser(SchemaConditionalOf.isConditionalOf, SchemaConditionalOf)
