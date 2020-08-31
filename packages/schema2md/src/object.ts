import type { SchemaObject, SchemaNode } from "@microfleet/schema-tools"

import { getGenericInfo, renderDefinitions, renderProps, renderDefaultsOrExample } from './util'
import type { Renderer, RenderedNode } from './index'

export function renderObject(renderer: Renderer, node: SchemaObject): RenderedNode[] | any {
  const result = []

  result.push(...getGenericInfo(renderer, node))

  if (node.properties) {
    result.push('Properties:')
    result.push(renderProps(renderer, node.properties))
  }

  if (node.additionalProperties) {
    result.push({p: 'Additional properties should be:'})
    result.push({
      ul: [...renderer.render(node.additionalProperties as SchemaNode)]
    })
  }

  if (node.patternProperties) {
    result.push({p: '**Pattern properties**:'})
    result.push(renderProps(renderer, node.patternProperties))
  }

  if (node.data.example) {
    result.push(...renderDefaultsOrExample(node.dataType, 'Example', node.data.example))
  }

  if (node.definitions) {
    result.push('**Definitions**:')
    result.push(renderDefinitions(renderer, node))
  }

  return result
}
