import { Application, Worker } from 'apidoc'
import { SchemaNode } from '@microfleet/schema-tools'
import { RenderMd } from '@microfleet/schema2md'
const { Renderer } = RenderMd

import * as json2md from 'json2md'

import * as util from 'util'

function includeReferencedSchemas(this: Application, parsedFiles: any[], _: string[], __: any): Record<string, any> {
  const result: any = { referencedSchemas : {} }

  parsedFiles.forEach((parsedFiles: any) => {
    parsedFiles.forEach((block: any) => {
      if (block.local.schemas) {
        for (const [ key, schema] of Object.entries(block.local.schemas)) {
          const parsed = SchemaNode.parse((schema as any).resolved)
          const rendered = Renderer.render(parsed, 0)
          const refs = parsed.findRefs()
          // eslint-disable-next-line no-console
          console.debug(util.inspect(rendered, { colors: true, depth: null }))
          block.local.schemas[key] = json2md(rendered)

          refs.forEach(((reference: any) => {
            const schema = Object.values(this.mft.refParser.schemas).find(
              (schema) => schema.path === reference.ref.path
            )

            const schemaId = schema!.schema.$id

            if (!result.referencedSchemas[schemaId]) {
              const resolved = this.mft.refParser.resolveSchema(schema!.schema)
              const parsed = SchemaNode.parse(resolved)
              const rendered = Renderer.render(parsed, 0)
              result.referencedSchemas[schemaId] = { parsed, rendered, schema }
            }
          }))
        }
      }
    })

  })

  return result
}

function createReferencedSchemaBlocks(parsedFiles: any[], filenames: string[], preProcessed: any, _: any) {
  const { referencedSchemas } = preProcessed
  if (!referencedSchemas) return

  Object.values(referencedSchemas).forEach(
    ({schema, parsed, rendered}: any) => {
      const schemaObj = {
        type: 'SCHEMA',
        url: parsed.data.$id,
        title: parsed.data.title || parsed.data.$id,
        version: '1.0.0',
        name: parsed.data.$id,
        group: 'SchemaDefinitions',
        groupTitle: 'Definitions',
        description: parsed.data.description,
        filename: schema.path,
        schema: json2md(rendered)
      }
      parsedFiles.push([{ global: {}, local: schemaObj, index: 1, version: '3.0.0' }])
      filenames.push(schemaObj.filename)
    }
  )

}

export function refSchemaWorker(app: Application): Worker {
  return {
    preProcess: includeReferencedSchemas.bind(app),
    postProcess: createReferencedSchemaBlocks
  }
}
