import { DataObject } from 'json2md'
import { SchemaNode, SchemaRef, SchemaObject } from '@microfleet/schema-tools'

import type { Renderer } from './index'

export function isProperty(node: SchemaNode): boolean {
  const { params } = node
  return params.isProperty || params.isAdditionalProperty || params.isPatternProperty ? true : false
}

export function linkTo(r: Renderer, referenceNode: SchemaRef): string {
  if (r.config.linkTo) return `${r.config.linkTo(referenceNode)}`
  const { id, hash } = referenceNode.ref
  const href = `${id || ''}${hash}`.replace(/#/g, '--')
  return `#${href}`
}

export function linkFrom(r: Renderer, node: SchemaNode): string {
  if (r.config.linkFrom) return `${r.config.linkFrom(node)}`
  return `${node.params.rootId || ''}#${node.path.toString()}`.replace(/#/g, '--')
}

export function getGenericInfo(renderer: Renderer, node: SchemaNode, level: number): (string|DataObject)[] {
  const result: (DataObject|string)[] = []

  const { description } = node.data

  let link = ''
  const dataType = node.dataType ? `\`{${node.dataType}}\`<br>` : ''

  if (node.params.isDefinition || isProperty(node) || node.params.rootId === node.data.$id) {
    link = `<a name="${linkFrom(renderer, node)}"/>`
  }

  result.push(`${link}${dataType}`)

  if (node.type === 'x-object' ) {
    result.push(`Additional properties allowed: \`${(node as SchemaObject).haveAdditionalProperties}\`<br>`)
  }

  if (Object.keys(node.constraints).length > 0) {
    const asStrings = Object.entries(node.constraints).map(([key, value]) => `\`${key}\`: \`${JSON.stringify(value)}\``)
    result.push(`Constraints: ${asStrings.join(', ')}<br>`)
  }

  if (description) {
    result.push({ p: `${description}` })
  }

  if (node.ifCondition) {
    result.push(renderer.render(node.ifCondition, level + 1))
  }

  return result
}

export function renderProps(renderer: Renderer, props: Record<string, SchemaNode> | undefined, level: number): DataObject {
  const ul = Object.entries(props ?? {}).map(( [name , prop] ) => {
    return [
      `**${name.replace(/\|/gi, '&#123;')}**`,
      ...renderer.render(prop, level + 1)
    ]
  })
  // @todo consistent types
  return { ul: ul as unknown as string[] } // dirty hack
}

export function renderDefinitions(renderer: Renderer, node: SchemaNode, level: number): DataObject {
  const definitions = node.definitions ?? {}
  const ul = Object.entries(definitions).map(( [,prop] ) =>
    [
      `**${node.data.$id || ''}#${prop.path.toString()}**`,
      ...renderer.render(prop, level + 2),
      '<br>'
    ]
  )
  return {
    // @todo consistent types
    ul: ul as unknown as string[] // dirty hack
  }
}
