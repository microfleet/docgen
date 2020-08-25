import { SchemaNode, Params } from './node'
import { ResolvedSchema, ResolvedReference } from '../reference-parser'
import { omit } from 'lodash'

export class SchemaRef extends SchemaNode {
  public ref: ResolvedReference
  public refData: SchemaNode

  constructor(node: ResolvedSchema, params: Partial<Params>) {
    super(omit(node, ['$ref', '$xRef']), params)
    this.type = 'x-ref'
    this.dataType = 'reference'

    if (!node.$xRef) throw new Error('no reference set')

    this.ref = node.$xRef
    this.refData = this.parseNode(omit(node, '$xRef', '$ref'))
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      reference: this.ref,
      referenceData: this.refData
    }
  }

  static isRef = (node: ResolvedSchema): boolean => { return node.$xRef ? true : false }
}

SchemaNode.addParser(SchemaRef.isRef, SchemaRef)
