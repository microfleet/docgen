import { DataObject } from 'json2md'
import { SchemaNode, SchemaRef, SchemaObject } from '@microfleet/schema-tools'

import { Renderer } from './renderer'

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
  const href = `${id || ''}${hash}`.replace(/#/g, '--')
  return `#${href}`
}

export function getGenericInfo(node: SchemaNode, _: number): (string|DataObject)[] {
  const result: (DataObject|string)[] = []

  const { description } = node.data
  const { path } = node

  let link = ''
  const dataType = node.dataType ? `\`{${node.dataType}}\`<br>` : ''

  if (node.params.isDefinition || isProperty(node) || node.params.rootId === node.data.$id) {
    const href = `${node.params.rootId || ''}#${path.toString()}`.replace(/#/g, '--')
    link = `<a name="${href}"/>`
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

  return result
}

export function renderProps(props: Record<string, SchemaNode> | undefined, level: number): DataObject {
  const ul = Object.entries(props ?? {}).map(( [name , prop] ) => {
    return [
      `**${name.replace(/\|/gi, '&#123;')}**`,
      ...Renderer.render(prop, level + 1)
    ]
  })
  // @todo consistent types
  return { ul: ul as unknown as string[] } // dirty hack
}

export function renderDefinitions(node: SchemaNode, level: number): DataObject {
  const definitions = node.definitions ?? {}
  const ul = Object.entries(definitions).map(( [,prop] ) =>
    [
      `**${node.data.$id || ''}#${prop.path.toString()}**`,
      ...Renderer.render(prop, level + 2),
      { p: ' ' }
    ]
  )
  return {
    // @todo consistent types
    ul: ul as unknown as string[] // dirty hack
  }
}
