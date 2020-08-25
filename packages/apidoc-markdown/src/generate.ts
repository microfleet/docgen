import * as path from 'path'
import { promises as fs } from 'fs'
import { generate } from 'apidoc-markdown'
import { compile } from 'ejs'
import * as json2md from 'json2md'

import { RendererObj as Renderer } from '@microfleet/schema2md'

import { ConfigObj } from './types'
import { SchemaRef, SchemaNode } from 'schema-tools/lib'

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

export async function generateFs(args: ConfigObj): Promise<void> {
  const { multi, prepend, output, createPath } = args
  const apiDocApiData = await import(path.join(args.apiDocPath, 'api_data.json'))
  const apiDocProjectData = await import(path.join(args.apiDocPath, 'api_project.json'))

  const rawTemplate = await fs.readFile(args.template, { encoding: 'utf-8' })

  const schemaIndex = generateSchemaIndex(apiDocApiData)

  const renderer = new Renderer({
    multi,
    linkTo(schema: SchemaRef): string {
      const { id, hash } = schema.ref
      const base = [...schemaIndex.get(id)!.values()][0] || 'nf'
      const href = `${id || ''}${hash}`.replace(/#/g, '--')
      return `${base}.md#${href}`
    },
  })

  const ejsCompiler = compile(rawTemplate, {
    context: {
      md: {
        renderer,
        render: (_: string, obj: any) => {
          // console.debug('group:', group, obj)
          const rendered = renderer.render(obj, 0)
          return json2md(rendered)
        },
      },
    }
  })

  if (createPath) await fs.mkdir(output, { recursive: true })

  const documentation = generate({
    apiDocApiData,
    apiDocProjectData,
    ejsCompiler,
    multi,
    prepend
  })

  if (!multi) {
    const singleDoc = documentation[0].content
    console.debug('write file', output)
    await fs.writeFile(output, singleDoc)
    return
  }

  await Promise.all(
    documentation.map(async aDoc => {
      const filePath = path.resolve(output, `${aDoc.name}.md`)
      console.debug('write file', filePath)
      await fs.writeFile(filePath, aDoc.content)
      return { outputFile: filePath, content: aDoc.content }
    })
  )
}
