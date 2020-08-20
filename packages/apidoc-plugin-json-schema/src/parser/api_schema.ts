import type { Application, Parser } from 'apidoc'

type ParseResult = {
  schema: string
  path?: string | any
  title: string,
  description?: string
  parsed?: any
}

let elementPath = ''
let elementGroup = ''

function parse(this: Application, content: string, source: string): ParseResult | undefined {
	if (content.length === 0) return

	// @apiSchema {jsonschema=path_from_schemas} extra text
	const parseRegExp = /^.*{(.+?)=(.+?)\}\s*(?:(.+))?/g
  const matches = parseRegExp.exec(content)
  // eslint-disable-next-line no-console
  console.debug('matches', { matches, source, content })
  if (!matches) return
  // eslint-disable-next-line no-console
  console.debug('matches', { matches, source, content })

  const schema = Object.values(this.mft.refParser.schemas).find(
    (schema) => schema.path === matches[2]
  )

  if (schema) {
    const resolved = this.mft.refParser.resolveSchema(schema?.schema)

    const schemaType = (matches[3] || 'apiRequest').replace(/^api/, '').toLowerCase()
    elementPath = `local.schemas.${schemaType}`

    const result = {
      schema: matches[2],
      title: matches[4] || '',
      resolved,
    }

    // eslint-disable-next-line no-console
    // console.debug('finished', { result, source, content })
    return result
  }

  // eslint-disable-next-line no-console
  console.error('noSCHEMA', content)
  return
}

export const parser: Parser = {
  parse,
  preventGlobal: false,
  method: 'insert',
  path: () => {
    // eslint-disable-next-line no-console
    console.debug('getPath', { elementPath })
    return elementPath
  },
  group: () => {
    // eslint-disable-next-line no-console
    console.debug('getGroup', { elementGroup })
    return elementGroup
  },
  markdownFields: ['description']
}
