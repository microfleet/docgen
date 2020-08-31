import * as assert from 'assert'
import * as path from 'path'

import { RefParser } from '@microfleet/schema-tools'

const schemaDir = path.resolve(__dirname, '../fixtures')

describe('Schema parser', () => {
  describe('init', () => {
    it('able to initialize and find schemas async', async () => {
      const rp = new RefParser({
        schemaDirs: schemaDir
      })
      await rp.findSchemas()
      assert(Object.values(rp.schemas).length === 3)
      assert.ok(rp.schemas['common'])
      assert.ok(rp.schemas['with-reference'])
    })

    it('able to initialize and find schemas sync', () => {
      const rp = new RefParser({
        schemaDirs: schemaDir
      })

      rp.findSchemasSync()
      assert(Object.values(rp.schemas).length === 3)
    })

    it('able to initialize from array of schemadirs', () => {
      const rp = new RefParser({
        schemaDirs: [schemaDir]
      })

      rp.findSchemasSync()
      assert(Object.values(rp.schemas).length === 3)
    })
  })

  describe('resolve', () => {
    it('able to resolve schema deep', async () => {
      const rp = new RefParser({
        schemaDirs:  schemaDir
      })
      await rp.findSchemas()
      const withRef = rp.schemas['with-reference']
      const ref = rp.schemas['common']

      assert(withRef.resolved === false)
      assert(ref.resolved === false)

      const resolved = rp.resolveSchema(withRef.schema)

      assert.ok(resolved.properties.referencedType.$xRef)
      assert.ok(resolved.properties.referencedTypeAsPath.$xRef)
      assert.ok(resolved.properties.referencedTypeAsPathThroughtSub.$xRef)
      assert.ok(resolved.properties.referenceLocal.$xRef)

      const resolvedRef = resolved.properties.referencedTypeAsPath
      assert.ok(resolvedRef.$xRef)
      // it should inherit data from reference
      assert(resolvedRef.title === 'mydeftitle')
      assert(resolvedRef.type === 'string')
      assert(resolvedRef.$id === undefined)
      assert(resolvedRef.$xRef.isLocal === false, 'should mark reference as remote')

      const resolvedLocalRef = resolved.properties.referenceLocal
      assert(resolvedLocalRef.$id === undefined)
      assert(resolvedLocalRef.type === 'object')
      assert(resolvedLocalRef.description === 'object description')

      assert(resolvedLocalRef.$xRef.isLocal, 'should mark reference as local')

      assert(withRef.resolved)
      assert(ref.resolved)
    })

    it('able to resolve nested schemas deep', async () => {
      const rp = new RefParser({
        schemaDirs:  schemaDir
      })
      await rp.findSchemas()
      const topSchema = rp.schemas['top']
      const ref = rp.schemas['common']

      assert(topSchema.resolved === false)
      assert(ref.resolved === false)

      const resolved = rp.resolveSchema(topSchema.schema)
      const subRef = resolved.properties.referenced.properties.referencedType

      assert.deepStrictEqual(subRef, {
        '$ref': 'common#/definitions/mydef',
        '$xRef': {
          isLocal: false,
          base: schemaDir,
          path: 'common.json',
          hash: '#/definitions/mydef',
          full: 'common.json#/definitions/mydef',
          originalRef: 'common#/definitions/mydef',
          id: 'common'
        },
        type: 'string',
        title: 'mydeftitle'
      })
    })

    it('able to resolve schema', async () => {
      const rp = new RefParser({
        schemaDirs:  schemaDir,
        deep: false
      })
      await rp.findSchemas()
      const withRef = rp.schemas['with-reference']
      const ref = rp.schemas['common']

      assert(withRef.resolved === false)
      assert(ref.resolved === false)

      const resolved = rp.resolveSchema(withRef.schema)

      assert.ok(resolved.properties.referencedType.$xRef)
      assert.ok(resolved.properties.referencedTypeAsPathThroughtSub.$xRef)

      const resolvedRef = resolved.properties.referencedTypeAsPath
      assert.deepStrictEqual(Object.keys(resolvedRef), [ '$ref', '$xRef'])
      assert.deepStrictEqual(resolvedRef.$xRef, {
        isLocal: false,
        base: schemaDir,
        path: 'common.json',
        hash: '#/definitions/mydef',
        full: 'common.json#/definitions/mydef',
        originalRef: './common.json#/definitions/mydef',
        id: 'common'
      })

      const resolvedLocalRef = resolved.properties.referenceLocal
      assert.deepStrictEqual(Object.keys(resolvedLocalRef), [ '$ref', '$xRef' ])
      assert.deepStrictEqual(resolvedLocalRef.$xRef, {
        isLocal: true,
        hash: '#/definitions/someObject',
        originalRef: '#/definitions/someObject',
        id: 'with-reference'
      })

      assert(withRef.resolved)
      assert(ref.resolved)
    })

    it('should panic on broken refs', async () => {
      const rp = new RefParser({
        schemaDirs:  schemaDir
      })
      await rp.findSchemas()

      const invalidSchema = {
        type: "object",
        properties: {
          some: {
            $ref: "does-not-exists#/definitions"
          }
        }
      }

      assert.throws(() => rp.resolveSchema(invalidSchema))

      const invalidSchemaLocal = {
        type: "object",
        properties: {
          some: {
            $ref: "#/definitions/x"
          }
        }
      }

      assert.throws(() => rp.resolveSchema(invalidSchemaLocal))
    })
  })
})
