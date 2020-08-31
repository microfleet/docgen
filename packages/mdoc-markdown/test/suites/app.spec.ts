import * as path from 'path'
import * as assert from 'assert'
import { promises as fs } from 'fs'

import { exec } from '../helpers/exec'

const cwd = path.resolve(__dirname, '../fixtures')
const appPath = path.resolve(__dirname, '../../lib/cli.js')

const readFile = (file: string) => fs.readFile(path.join(cwd, file), { encoding: 'utf-8'})

describe('markdown-generator', () => {
  let spSnapshot = ''
  let mpSnapshotSchema = ''
  let mpSnapshotReferenced = ''

  before(async () => {
    spSnapshot = await readFile('snapshot/singlepage.md')
    mpSnapshotSchema = await readFile('snapshot/multipage-schema.md')
    mpSnapshotReferenced = await readFile('snapshot/multipage-references.md')
  })

  afterEach(async () => {
    await fs.rmdir(path.join(cwd, 'docs'), { recursive: true })
  })

  it('should generate docs', async () => {
    const result = await exec('node', [appPath], { cwd })
    assert(result.stdout.includes('fixtures/docs/API.md\n'))
    assert(result.stderr.length === 0, 'should be no error')

    const singleFile = await readFile('docs/API.md')
    assert.strictEqual(spSnapshot, singleFile)
  })

  it('should generate multi docs', async () => {
    const result = await exec('node', [appPath, '-o', 'docs', '--multi'], { cwd })
    assert(result.stderr.length === 0, 'should be no error')

    const singleFile = await readFile('docs/withReference.md')
    const defsFile = await readFile('docs/zSchemaDefinitions.md')

    assert(result.stdout.includes('fixtures/docs/withReference.md\n'))
    assert.strictEqual(mpSnapshotSchema, singleFile)
    assert.strictEqual(mpSnapshotReferenced, defsFile)
  })
})
