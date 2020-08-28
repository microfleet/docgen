import * as path from 'path'
import { createDoc as apiDocCreateDoc } from 'apidoc'
import { promises as fs } from 'fs'
import * as assert from 'assert'
import * as winston from 'winston'
import * as sinon from 'sinon'

import { RefParser, SchemaNode, ResolvedSchema } from '@microfleet/schema-tools'
import { LogStream } from '../helpers/log-stream'

const fixturePath = path.resolve(__dirname, '../fixtures/sample')
const schemaPath = path.join(fixturePath, 'schemas')
const src = path.join(fixturePath, 'src')
const dest = path.join(fixturePath, 'docs')

describe('apidoc-plugin', () => {
  const refParser = new RefParser({
    schemaDirs: schemaPath,
    deep: true,
  })

  let loggerStub: sinon.SinonStub
  let loggerOutput: LogStream

  before(async () => {
    await refParser.findSchemas()
  })

  afterEach(async () => {
    await fs.rmdir(dest, { recursive: true })
  })

  beforeEach('replace winston transports',() => {
    loggerStub = sinon.stub(winston, 'createLogger')

    loggerStub.callsFake((opts: any): any => {
      loggerOutput = new LogStream({})
      opts.transports = [
        new winston.transports.Stream({
          stream: loggerOutput
        })
      ]
      return loggerStub.wrappedMethod(opts)
    })
  })

  afterEach('restore', () => {
    if (loggerStub) loggerStub.restore()
  })

  const readAndParse = (schema: string): {resolved: ResolvedSchema, parsed: SchemaNode} => {
    const resolved = refParser.schemas[schema].resolved
      ? refParser.schemas[schema]
      : refParser.resolveSchema(refParser.schemas[schema].schema)

    const parsed = SchemaNode.parse(resolved)
    return { resolved, parsed }
  }
  const createDoc = (params: Record<string, any>) => {
    return apiDocCreateDoc({
      src, dest, config: fixturePath,
      ...params
    })
  }
  const stringify = (obj: any) => JSON.stringify(obj)
  const check = (result: any, expected: any) => assert.deepStrictEqual(stringify(result), stringify(expected))

  it('able to process apidoc blocks', () => {
    const requestSchema = readAndParse('request')
    const responseSchema = readAndParse('response')
    const doc = createDoc({ includeFilters: ['simple.js$'] })

    assert(typeof doc !== 'boolean')

    const [firstGroup, secondGroup] = JSON.parse((doc as Record<string, any>).data)

    const { response: fgResponseParsed, request: fgRequestParsed } = firstGroup.parsedSchemas
    check(fgResponseParsed, responseSchema.parsed)
    check(fgRequestParsed, requestSchema.parsed)

    assert.ok(firstGroup.schemas.response)
    assert.ok(firstGroup.schemas.request)

    const { request: sgRequest } = secondGroup.parsedSchemas
    check(sgRequest, requestSchema.parsed)
  })

  it('missing schema', () => {
    const doc = createDoc({ includeFilters: ['missing-schema.js$'] })
    assert(typeof doc === 'boolean', 'should not generate docs')

    const { logs } = loggerOutput
    assert(logs.length === 1)
    assert.strictEqual(logs[0].message, 'Schema not found {jsonschema=response-missing.json} apiResponse')
  })

  it('tag does not match regexp', () => {
    const doc = createDoc({ includeFilters: ['incorrect-tag.js$'] })
    assert(typeof doc === 'boolean', 'should not generate docs')

    const { logs } = loggerOutput
    assert(logs.length === 1)
    assert.strictEqual(logs[0].message, 'incorrect tag')
  })

  it('schema group other than {Request|Response}', () => {
    const doc = createDoc({ includeFilters: ['incorrect-schema-group.js$'] })
    assert(typeof doc === 'boolean', 'should not generate docs')

    const { logs } = loggerOutput
    assert(logs.length === 1)
    assert.strictEqual(logs[0].message, 'only {apiRequest|apiResponse} allowed')
  })

  it('panic on parse error', () => {
    const doc = createDoc({ includeFilters: ['broken-schema.js$'] })
    assert(typeof doc === 'boolean', 'should not generate docs')

    const { logs } = loggerOutput
    assert(logs.length === 1)
    assert.strictEqual(logs[0].message, 'schema parse error')
  })

  it('panic on empty content', () => {
    const doc = createDoc({ includeFilters: ['empty.js$'] })
    assert(typeof doc === 'boolean', 'should not generate docs')

    const { logs } = loggerOutput
    assert(logs.length === 1)
    assert.strictEqual(logs[0].message, 'Empty parser result.')
  })

  it('includes referenced schema', () => {
    const doc = createDoc({ includeFilters: ['with-reference.js$'] })
    assert(typeof doc !== 'boolean', 'should generate docs')

    const data = JSON.parse((doc as Record<string, any>).data)
    assert.strictEqual(data.length, 3)

    const included = data.pop()
    assert.strictEqual(included.type, 'SCHEMA')
    assert.strictEqual(included.title, 'common')
    assert.strictEqual(included.filename, 'common.json')
  })
})
