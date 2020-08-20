import * as  path from 'path'
import * as json2md from 'json2md'
import * as fs from 'fs'
import * as util from 'util'

import { RefParser, SchemaNode } from '@microfleet/schema-tools'

import { Renderer } from '../render'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const inspect = (obj: any) => util.inspect(obj, { depth: null, colors: true });

(async function run() {
  const schemaDir = path.resolve(process.cwd(), './schemas')
  // eslint-disable-next-line no-console
  console.debug('Read schemas from', schemaDir)
  const outDir = path.resolve(process.cwd(), './mds')

  const refParser = new RefParser({schemaDirs: schemaDir, deep: false })
  await refParser.findSchemas()

  const joinedMd = []

  for (const [id, schemaDef] of Object.entries(refParser.schemas)) {
    //if (id !== 'response.plan.get') continue
    const resolvedSchema = refParser.resolveSchema(schemaDef.schema)
    const schemaTree = SchemaNode.parse(resolvedSchema)

    // eslint-disable-next-line no-console
    // console.debug('tree', inspect(resolvedSchema))

    const rendered = Renderer.render(schemaTree, 0)

    // eslint-disable-next-line no-console
    console.debug('rendered', inspect(rendered))

    const asMd = json2md(rendered)
    joinedMd.push(asMd)
    // eslint-disable-next-line no-console
    console.debug('rendered: ', id )
    const outFile = path.join(outDir, `${id}.md`)
    fs.writeFileSync(outFile, asMd)
  }

  const outFile = path.join(outDir, `schemas.md`)

  // eslint-disable-next-line no-console

  fs.writeFileSync(outFile, joinedMd.join('\n'))
})()
