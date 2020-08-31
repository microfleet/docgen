import * as path from 'path'
import { promises as fs } from 'fs'
import { generate } from 'apidoc-markdown'
import { compile } from 'ejs'
import * as json2md from 'json2md'
import * as log from 'log-update'

import { Renderer as Renderer } from '@microfleet/schema2md'
import { SchemaRef } from '@microfleet/schema-tools'

import { Config } from './types'

function generateSchemaIndex(apiData: any): Map<string, Set<string>>{
  const index = new Map()
  apiData.forEach((record: any) => {
    if(record.parsedSchemas) {
      Object.values(record.parsedSchemas).forEach((schema: any) => {
        const id = schema.data.$id
        if (!index.has(id)) { index.set(id, new Set())}
        index.get(id).add(record.group)
      })
    }

    if(record.parsedSchema) {
      const id = record.parsedSchema.data.$id
      if (!index.has(id)) index.set(id, new Set())
      index.get(id).add(record.group)
    }
  })
  return index
}

export async function generateFs(args: Config): Promise<void> {
  const { multi, prepend, output, createPath } = args

  const apiDocApiData = await import(path.join(args.apiDocPath, 'api_data.json'))
  const apiDocProjectData = await import(path.join(args.apiDocPath, 'api_project.json'))
  const rawTemplate = await fs.readFile(args.template, { encoding: 'utf-8' })

  const schemaIndex = generateSchemaIndex(apiDocApiData)

  const renderer = new Renderer({
    multi,
    linkTo(schema: SchemaRef): string {
      const { id, hash } = schema.ref
      const base = [...schemaIndex.get(id)!.values()][0] || ''
      const href = `${id || ''}${hash}`.replace(/#/g, '--')
      return multi ? `${base}.md#${href}` : `#${href}`
    },
  })

  const ejsCompiler = compile(rawTemplate, {
    context: {
      md: {
        renderer,
        render: (_: string, obj: any) => {
          const rendered = renderer.render(obj, 0)
          return json2md(rendered)
        },
      },
    }
  })

  if (createPath) {
    try {
      await fs.stat(output)
    } catch(e) {
      await fs.mkdir(multi ? output : path.dirname(output), { recursive: true })
    }
  }

  const documentation = generate({
    apiDocApiData,
    apiDocProjectData,
    ejsCompiler,
    multi,
    prepend
  })

  if (!multi) {
    const singleDoc = documentation[0].content
    log('Write file', output)
    await fs.writeFile(output, singleDoc)
    return
  }

  await Promise.all(
    documentation.map(async aDoc => {
      const filePath = path.join(output, `${aDoc.name}.md`)
      log('Write file', filePath)
      await fs.writeFile(filePath, aDoc.content)
      return { outputFile: filePath, content: aDoc.content }
    })
  )
  log.done()
  log('Done')
}
