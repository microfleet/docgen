import * as path from 'path'
import { promises as fs } from 'fs'
import { generate } from 'apidoc-markdown'
import { compile } from 'ejs'
import * as json2md from 'json2md'

import { Render } from '@microfleet/schema2md'

import { ConfigObj } from './types'

export async function generateFs(args: ConfigObj): Promise<void> {
  const { multi, prepend, output, createPath } = args
  const apiDocApiData = await import(path.join(args.apiDocPath, 'api_data.json'))
  const apiDocProjectData = await import(path.join(args.apiDocPath, 'api_project.json'))

  const rawTemplate = await fs.readFile(args.template, { encoding: 'utf-8' })

  const ejsCompiler = compile(rawTemplate, {
    context: {
      md: {
        render: (_: string, obj: any) => {
          // console.debug('group:', group, obj)
          const rendered = Render.Renderer.render(obj, 0)
          return json2md(rendered)
        }
      },
      render: Render,
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
