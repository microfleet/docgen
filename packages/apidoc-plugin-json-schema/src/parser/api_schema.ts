import type { Application, Parser } from 'apidoc'
import { SchemaInfo, ResolvedSchema } from '@microfleet/schema-tools'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ParameterError = require('apidoc-core/lib/errors/parameter_error.js')

export type ParseResult = {
  schema: SchemaInfo
  path?: string | any
  resolved: ResolvedSchema
}

let elementPath = ''

function parse(this: Application, content: string, _: string): ParseResult | undefined {
	if (content.length === 0) return

	// @apiSchema {jsonschema=path_from_schemas} api{Response|Request}
	const parseRegExp = /^.*{jsonschema=(.+?)\}\s*(?:(.+))?/g
  const matches = parseRegExp.exec(content)

  if (!matches) {
    throw new ParameterError('incorrect tag', content)
  }

  const [, schemaPath, type] = matches
  const schema = Object.values(this.mft.refParser.schemas).find(
    (schema) => schema.path === schemaPath
  )

  if (schema) {
    const schemaType = (type || 'apiRequest').replace(/^api/, '').toLowerCase()

    if (!['request', 'response'].includes(schemaType)) {
      throw new ParameterError(`only {apiRequest|apiResponse} allowed`, content)
    }

    elementPath = `local.schemas.${schemaType}`

    let resolved
    try {
      resolved = this.mft.refParser.resolveSchema(schema?.schema)
    } catch(e) {
      throw new ParameterError('schema parse error', content, e.toString(), e.stack)
    }

    if (resolved) {
      return { schema, resolved, path: schemaPath }
    }
  }

  throw new ParameterError(`Schema not found ${content}`)
}

export const parser: Parser = {
  parse,
  preventGlobal: false,
  method: 'insert',
  path: () => elementPath,
  markdownFields: ['description']
}
