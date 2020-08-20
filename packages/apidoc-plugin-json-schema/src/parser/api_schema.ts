import type { Application, Parser } from 'apidoc'

import { SchemaInfo, ResolvedSchema } from '@microfleet/schema-tools'

export type ParseResult = {
  schema: SchemaInfo
  path?: string | any
  resolved: ResolvedSchema
}

let elementPath = ''

function parse(this: Application, content: string, _: string): ParseResult | undefined {
	if (content.length === 0) return

	// @apiSchema {jsonschema=path_from_schemas} api{Response|Request}
	const parseRegExp = /^.*{(.+?)=(.+?)\}\s*(?:(.+))?/g
  const matches = parseRegExp.exec(content)

  if (!matches) return

  const [,, schemaPath, type] = matches
  const schema = Object.values(this.mft.refParser.schemas).find(
    (schema) => schema.path === schemaPath
  )

  if (schema) {
    const resolved = this.mft.refParser.resolveSchema(schema?.schema)
    const schemaType = (type || 'apiRequest').replace(/^api/, '').toLowerCase()

    elementPath = `local.schemas.${schemaType}`

    const result = {
      schema,
      schemaPath,
      resolved,
    }

    return result
  }

  throw new Error(`No schema found in ${content}`)
}

export const parser: Parser = {
  parse,
  preventGlobal: false,
  method: 'insert',
  path: () => elementPath,
  markdownFields: ['description']
}
