import { Application, Worker } from 'apidoc'

import { SchemaNode, SchemaInfo, } from '@microfleet/schema-tools'

import { ParseResult } from '../parser/api_schema'

type ReferenceIndex = {
  [key: string] : {
    parsed: SchemaNode,
    schema: SchemaInfo
  }
}

type PreparedSchemas = {
  seenSchemas: Set<string>,
  referencedSchemas: ReferenceIndex,
}

function findRefsDeep(app: Application, schema: SchemaNode, preparedSchemas: PreparedSchemas): void {
  schema
    .findRefs()
    .forEach(
      (reference: any) => {
        if (reference.ref.isLocal) return

        const schema = Object.values(app.mft.refParser.schemas).find(
          (schema) => schema.path === reference.ref.path
        )
        if (!schema) throw new Error(`no reference schema '${reference.ref.originalRef}'`, )

        const schemaId = schema?.schema.$id

        // process referenced schema
        if (!preparedSchemas.referencedSchemas[schemaId]) {
          const resolved = app.mft.refParser.resolveSchema(schema?.schema)
          const parsed = SchemaNode.parse(resolved)
          preparedSchemas.referencedSchemas[schemaId] = { parsed, schema }
        }

        // go deep
        const parsed = preparedSchemas.referencedSchemas[schemaId].parsed
        findRefsDeep(app, parsed, preparedSchemas)
      }
    )
}

/**
 * Prepare Response or Request schemas and index their references
 * @param this ApiDoc application
 * @param parsedFiles Apidoc parsed files
 */
function prepareSchemas(this: Application, parsedFiles: any[], _: string[], __: any): PreparedSchemas {
  const seenSchemas = new Set()
  const result: any = {
    seenSchemas,
    referencedSchemas : {},
    resolvedSchemas: {},
  }

  parsedFiles.forEach((parsedFile: any) => {
    parsedFile.forEach((block: any) => {
      if (block.local.schemas) {
        for (const [ key, apiSchema] of (Object.entries(block.local.schemas) as [string, ParseResult][])) {
          const parsed = SchemaNode.parse(apiSchema.resolved)
          // mark that we have seen this schema in apidoc blocks
          seenSchemas.add(parsed.data.$id)

          if (!block.local.parsedSchemas) {
            block.local.parsedSchemas = {}
            block.local.resolvedSchemas = {}
          }

          block.local.parsedSchemas[key] = parsed
          block.local.resolvedSchemas[key] = apiSchema.resolved

          // build referenced schemas index and prepare them
          findRefsDeep(this, parsed, result)
        }
      }
    })
  })

  return result
}

/**
 * Creates additional ApiDoc blocks with referenced schemas
 * It's the only option to create additional blocks from code
 * @param parsedFiles ApiDoc parsed files
 * @param filenames ApiDoc parsed filenames
 * @param preProcessed Object from `prepareSchemas`
 */
function createReferencedSchemaBlocks(parsedFiles: any[], filenames: string[], preProcessed: PreparedSchemas, _: any) {
  const { referencedSchemas, seenSchemas } = preProcessed
  if (!referencedSchemas) return

  Object.values(referencedSchemas)
    .forEach(
      ({schema, parsed}) => {
        if (seenSchemas.has(parsed.data.$id)) {
          return
        }

        const schemaObj = {
          type: 'SCHEMA',
          url: parsed.data.$id,
          title: parsed.data.title || parsed.data.$id,
          name: parsed.data.$id,
          group: 'zSchemaDefinitions',
          groupTitle: 'Definitions',
          description: parsed.data.description,
          filename: schema.path,
          parsedSchema: parsed,
          resolvedSchema: schema,
        }

        parsedFiles.push([{ global: {}, local: schemaObj, index: 1 }])
        filenames.push(schemaObj.filename)
      }
    )

}

export function refSchemaWorker(app: Application): Worker {
  return {
    preProcess: prepareSchemas.bind(app),
    postProcess: createReferencedSchemaBlocks
  }
}
