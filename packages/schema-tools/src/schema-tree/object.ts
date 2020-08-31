import { SchemaNode, Params } from './node'
import { ResolvedSchema } from '../reference-parser'
import { OBJECT_KEYWORDS } from './constants'

export class SchemaObject extends SchemaNode {
  public properties?: { [key: string]: SchemaNode }
  public additionalProperties?: SchemaNode
  public patternProperties?: { [key: string]: SchemaNode }
  public haveAdditionalProperties: boolean

  constructor(node: ResolvedSchema, params: Partial<Params>) {
    const { properties, additionalProperties, patternProperties, ...rest } = node

    super(rest, params)

    this.type = 'x-object'
    this.haveAdditionalProperties = true

    if (!this.dataType) this.dataType = 'object'

    this.properties = this.parseProperties(properties, 'properties', { isProperty: true })
    this.patternProperties = this.parseProperties(patternProperties, 'patternProperties', { isPatternProperty: true })
    if (additionalProperties) {
      this.additionalProperties = this.parseNode(additionalProperties, { isAdditionalProperty: true })
    }

    if (this.patternProperties || this.additionalProperties) {
      this.haveAdditionalProperties = true
    }

    if (typeof additionalProperties === 'boolean') {
      this.haveAdditionalProperties = additionalProperties
    }
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      haveAdditionalProperties: this.haveAdditionalProperties,
      properties: this.properties,
      additionalProperties: this.additionalProperties,
      patternProperties: this.patternProperties,
    }
  }

  static hasKeywords(node: ResolvedSchema): boolean {
    const keys = Object.keys(node)
    const existing = OBJECT_KEYWORDS.filter((key) => keys.includes(key as string))
    return existing.length > 0
  }

  static isObject = (node: ResolvedSchema): boolean => {
    return node.type === 'object' || SchemaObject.hasKeywords(node)
  }
}

SchemaNode.addParser(SchemaObject.isObject, SchemaObject)
