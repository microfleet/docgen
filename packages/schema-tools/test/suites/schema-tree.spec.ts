import * as assert from 'assert'

import {
  SchemaRef, SchemaNode, SchemaObject,
  SchemaArray, SchemaConditionalOf, SchemaConditionalIf,
  ResolvedSchema
} from '@microfleet/schema-tools'

describe('Schema tree', () => {
  const refSchema: ResolvedSchema = {
    $ref: 'someref#',
    $xRef: {
      originalRef: 'common#/definitions/foo',
      hash: '#definitions/foo',
      isLocal: true,
      id: 'common'
    }
  }

  const arraySchema = {
    type: 'array',
    items: {
      type: 'string',
      const: 'foo'
    }
  }

  const objectSchema = {
    type: 'object',
    required: [
      'first', 'second'
    ],
    properties: {
      first: { type: 'string', minLength: 10 },
      second: { type: 'number', maximum: 10 },
      array: arraySchema
    },
  }

  it('parse reference', () => {
    const parsed = SchemaNode.parse(refSchema)
    assert(parsed instanceof SchemaRef)
    assert.deepStrictEqual(parsed.ref, refSchema.$xRef)
    assert(parsed.refData instanceof SchemaNode)
    assert.strictEqual(JSON.stringify(parsed),
      '{"params":{},"type":"x-ref","dataType":"reference","data":{},"constraints":{},'
      + '"path":"","parentPath":"","depth":0,"ref":{"originalRef":"common#/definitions/foo",'
      + '"hash":"#definitions/foo","isLocal":true,"id":"common"},"refData":{"params":{},'
      + '"type":"x-node","data":{},"constraints":{},"path":"","parentPath":"","depth":1}}'
    )
  })

  describe('parse node', () => {
    it('generic', () => {
      const node = {
        description: 'mydesc',
        $id: 'foo',
        title: 'mytitle',
        definitions: {
          foo: { type: 'object' }
        },
      }

      const parsed = SchemaNode.parse(node)
      assert(parsed instanceof SchemaNode)
      assert(parsed.type === 'x-node')
      assert(parsed.dataType === undefined)
      assert.deepStrictEqual(parsed.constraints, {})
      assert.deepStrictEqual(parsed.data, {
        description: node.description,
        $id: node.$id,
        title: node.title,
      })
      assert.deepStrictEqual(parsed.params, { rootId: node.$id })

      assert(parsed.definitions!.foo instanceof SchemaObject)
      assert(parsed.definitions!.foo.dataType === 'object')
    })

    it('contains conditionals', () => {
      const node = {
        type: 'object',
        if: {
          required: ['prop'],
          properties: {
            prop: { type: 'string' }
          }
        },
        then: {
          properties: {
            thenProp: { type: 'string' }
          }
        }
      }

      const parsed = SchemaNode.parse(node)

      assert(parsed instanceof SchemaObject)
      assert(parsed.ifCondition instanceof SchemaConditionalIf)
    })

    it('finds references', () => {
      const node = {
        type: 'object',
        properties: {
          prop: { type: 'string' },
          secondProp: { type: 'string' },
          refProp: refSchema,
        }
      }

      const parsed = SchemaNode.parse(node)

      assert(parsed instanceof SchemaObject)
      assert(parsed.findRefs().length === 1)
    })
  })

  describe('parse conditionals', () => {
    it('anyOf', () => {
      const parsed = SchemaNode.parse({
        anyOf: [
          { type: 'string' },
          { type: 'number' }
        ]
      })

      assert(parsed instanceof SchemaConditionalOf)
      assert(parsed.condition === 'anyOf')
      assert([...parsed.possibles.values()].length === 2)

      assert.strictEqual(JSON.stringify(parsed),
        '{"params":{},"type":"x-cond-of","data":{},"constraints":{},"path":"","parentPath":"","depth":0,'
        + '"condition":"anyOf","possibles":[{"params":{},"type":"x-node","dataType":"string","data":{},'
        + '"constraints":{},"path":"/anyOf/0","parentPath":"","depth":1},{"params":{},"type":"x-node","dataType":"number",'
        + '"data":{},"constraints":{},"path":"/anyOf/1","parentPath":"","depth":1}]}'
      )
    })

    it('allOf', () => {
      const parsed = SchemaNode.parse({
        allOf: [
          {
            properties: {
              foo: { type: 'string' }
            }
          },
          {
            properties: {
              bar: { type: 'number' }
            }
          }
        ]
      })

      assert(parsed instanceof SchemaConditionalOf)
      assert(parsed.condition === 'allOf')
      assert([...parsed.possibles.values()].length === 2)
      assert(parsed.possibles[0].type === 'x-object')
    })

    it('oneOf', () => {
      const parsed = SchemaNode.parse({
        oneOf: [
          { type: 'string' },
          { type: 'number' }
        ]
      })

      assert(parsed instanceof SchemaConditionalOf)
      assert(parsed.condition === 'oneOf')
      assert([...parsed.possibles.values()].length === 2)
    })

    describe('if', () => {
      it('if', () => {
        const parsed = SchemaNode.parse({
          if: {
            required: ['prop'],
            properties: {
              prop: { type: 'string' }
            }
          },
          then: {
            properties: {
              thenProp: { type: 'string' }
            }
          },
          else: {
            properties: {
              elseProp: { type: 'string' }
            }
          }
        })

        assert(parsed instanceof SchemaConditionalIf)
        assert(parsed.if.dataType === 'object')
        assert(parsed.then.dataType === 'object')
        assert(parsed.else!.dataType === 'object')

        assert.deepStrictEqual(JSON.stringify(parsed),
          '{"params":{},"type":"x-cond-if","data":{},"constraints":{},"path":"","parentPath":"","depth":0'
          + ',"if":{"params":{},"type":"x-object","dataType":"object","data":{},"constraints":'
          + '{"required":["prop"]},"path":"","parentPath":"","depth":1,"haveAdditionalProperties":true,'
          + '"properties":{"prop":{"params":{"isProperty":true,"isRequired":false,"isCondition":true},'
          + '"type":"x-node","dataType":"string","data":{},"constraints":{},"path":"/properties/prop",'
          + '"parentPath":"","depth":2}}},"then":{"params":{},"type":"x-object","dataType":"object","data":{},'
          + '"constraints":{},"path":"/then","parentPath":"","depth":1,"haveAdditionalProperties":true,"properties":'
          + '{"thenProp":{"params":{"isProperty":true,"isRequired":false,"isCondition":true},"type":"x-node",'
          + '"dataType":"string","data":{},"constraints":{},"path":"/then/properties/thenProp","parentPath":"/then","depth":2}}},'
          + '"else":{"params":{},"type":"x-object","dataType":"object","data":{},"constraints":{},"path":"/else",'
          + '"parentPath":"","depth":1,"haveAdditionalProperties":true,"properties":{"elseProp":{"params":{"isProperty":true,'
          + '"isRequired":false,"isCondition":true},"type":"x-node","dataType":"string","data":{},"constraints":{},'
          + '"path":"/else/properties/elseProp","parentPath":"/else","depth":2}}}}'
        )
      })

      it('if - then missing', () => {
        const withoutIf = {
          if: {
            required: ['prop'],
            properties: {
              prop: { type: 'string' }
            }
          }
        }
        assert.throws(() => SchemaNode.parse(withoutIf))
      })
    })
  })

  describe('parse array', () => {
    it('generic', () => {
      const parsed = SchemaNode.parse(arraySchema)

      assert(parsed instanceof SchemaArray)
      assert(parsed.items instanceof SchemaNode)
      assert(parsed.items.dataType === 'string')
      assert.deepStrictEqual(parsed.items.constraints, { const: 'foo' })
    })

    it('conditional items', () => {
      const parsed = SchemaNode.parse({
        ...arraySchema,
        items: {
          anyOf: [
            { type: 'string' },
            { type: 'number' }
          ]
        }
      })

      assert(parsed instanceof SchemaArray)
      assert(parsed.items instanceof SchemaConditionalOf)
    })
  })

  describe('parse object', () => {
    it('generic', () => {
      const parsed = SchemaNode.parse(objectSchema)
      assert(parsed instanceof SchemaObject)
      assert(parsed.type === 'x-object')
      assert(parsed.haveAdditionalProperties === true)
      assert.ok(parsed.properties)
      assert.strictEqual(JSON.stringify(parsed),
        '{"params":{},"type":"x-object","dataType":"object","data":{},"constraints":{"required":'
        + '["first","second"]},"path":"","parentPath":"","depth":0,"haveAdditionalProperties":true,"properties":'
        + '{"first":{"params":{"isProperty":true,"isRequired":false,"isCondition":true},"type":"x-node",'
        + '"dataType":"string","data":{},"constraints":{"minLength":10},"path":"/properties/first",'
        + '"parentPath":"","depth":1},"second":{"params":{"isProperty":true,"isRequired":false,"isCondition":true}'
        + ',"type":"x-node","dataType":"number","data":{},"constraints":{"maximum":10},'
        + '"path":"/properties/second","parentPath":"","depth":1},"array":{"params":{"isProperty":true,'
        + '"isRequired":false,"isCondition":true},"type":"x-array","dataType":"array","data":{},'
        + '"constraints":{},"path":"/properties/array","parentPath":"","depth":1,"items":{"params":{"isProperty":true,'
        + '"isRequired":false,"isCondition":true},"type":"x-node","dataType":"string","data":{},"constraints":'
        + '{"const":"foo"},"path":"/properties/array/items","parentPath":"/properties/array","depth":2}}}}'
      )
    })

    it('with additionalProperties boolean', () => {
      const parsed = SchemaNode.parse({
        ...objectSchema,
        additionalProperties: false
      })

      assert(parsed instanceof SchemaObject)
      assert(parsed.haveAdditionalProperties === false)
      assert.ok(parsed.properties)
      assert(parsed.additionalProperties === undefined)
    })

    it('with additionalProperties definition', () => {
      const parsed = SchemaNode.parse({
        ...objectSchema,
        additionalProperties: {
          type: 'string',
          minLength: 100,
        }
      })

      assert(parsed instanceof SchemaObject)
      assert(parsed.haveAdditionalProperties === true)
      assert.ok(parsed.additionalProperties)
      assert(parsed.additionalProperties.type === 'x-node')
    })

    it('with patternProperties definition', () => {
      const parsed = SchemaNode.parse({
        ...objectSchema,
        patternProperties: {
          '^asd.*': {
            properties: {
              smth: { type: 'string' }
            }
          }
        }
      })

      assert(parsed instanceof SchemaObject)
      assert(parsed.haveAdditionalProperties === true)
      assert.ok(parsed.patternProperties)
      assert(parsed.patternProperties['^asd.*'].type === 'x-object')
    })
  })

})
