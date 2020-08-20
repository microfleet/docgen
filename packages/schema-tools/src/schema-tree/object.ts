import { SchemaNode, Params } from './node'
import { ResolvedSchema } from '../reference-parser'

export class SchemaObject extends SchemaNode {
  public properties?: { [key: string]: SchemaNode }
  public additionalProperties?: { [key: string]: SchemaNode } | SchemaNode
  public patternProperties?: { [key: string]: SchemaNode }
  public haveAdditionalProperties: boolean

  constructor(node: ResolvedSchema, params: Partial<Params>) {
    const { properties, additionalProperties, patternProperties, ...rest } = node

    super(rest, params)

    // this.properties = {}
    // this.additionalProperties = {}
    // this.patternProperties = {}
    this.type = 'x-object'

    this.properties = this.parseProperties(properties, 'properties', { isProperty: true })
    this.patternProperties = this.parseProperties(patternProperties, 'patternProperties', { isPatternProperty: true })

    if (typeof additionalProperties === 'boolean') {
      this.haveAdditionalProperties = additionalProperties
    } else {
      if (typeof additionalProperties === 'object' && (additionalProperties.type || additionalProperties.$ref)) {
        this.additionalProperties = this.parseNode(additionalProperties, { isAdditionalProperty: true })
      } else {
        this.additionalProperties = this.parseProperties(additionalProperties, 'additionalProperties', { isAdditionalProperty: true })
      }
      this.haveAdditionalProperties = Object.keys(this.additionalProperties).length > 0 && Object.keys(this.patternProperties).length > 0
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

  static isObject = (node: ResolvedSchema): boolean => {
    return SchemaObject.hasKeywords(node) || (node.type === 'object')
  }
}

SchemaNode.addParser(SchemaObject.isObject, SchemaObject)
