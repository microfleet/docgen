import * as assert from 'assert'

import { ResolvedSchema, SchemaNode } from '@microfleet/schema-tools'
import { Renderer } from '@microfleet/schema2md'

const parseSchema = (schema: ResolvedSchema) => SchemaNode.parse(schema)

describe('Schema2md', () => {
  let renderer: Renderer

  beforeEach(() => {
    renderer = new Renderer({})
  })

  it('panics on unknown node type', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore yes typechecking does not allow to use invalid value, but nevertheless
    assert.throws(() => renderer.render({ type: 'unknown' }, 0))
  })

  it('renders node', () => {
    const schema = parseSchema({
      $id: 'schemaId',
      title: 'schemaTitle',
      description: 'schemaDescription',
      type: 'string',
      definitions: {
        someDefiniton: {
          type: 'string',
          maxLength: 100,
        }
      },
      example: 'I\'m a string'
    })

    const renderedSchema = [
      '<a name="schemaId--"/>`{string}`<br>',
      { p: 'schemaDescription' },
      'Example: `"I\'m a string"`',
      { p: '**Definitions**:' },
      {
        ul: [
          [
            '**schemaId#/definitions/someDefiniton**',
            '<a name="schemaId--/definitions/someDefiniton"/>`{string}`<br>',
            'Constraints: `maxLength`: `100`<br>',
            '<br>'
          ]
        ]
      }
    ]

    const rendered = renderer.render(schema, 0)
    assert.deepStrictEqual(rendered, renderedSchema)
  })

  describe('renders condition', () => {
    it('renders *Of', () => {
      const schema = parseSchema({
        allOf: [
          {
            type: 'object',
            required: ['first', 'second'],
            properties: {
              first: { type: 'number' },
              second: { type: 'number' }
            }
          }, {
            type: 'boolean',
            default: true
          }
        ]
      })

      const renderedSchema = [
        '*Could be allOf:*',
        {
          ul: [
            [
              '<a name="--/allOf/0"/>`{object}`<br>',
              'Additional properties allowed: `true`<br>',
              'Constraints: `required`: `["first","second"]`<br>',
              'Properties:',
              {
                ul: [
                  [
                    '**first**',
                    '<a name="--/allOf/0/properties/first"/>`{number}`<br>'
                  ],
                  [
                    '**second**',
                    '<a name="--/allOf/0/properties/second"/>`{number}`<br>'
                  ]
                ]
              }
            ],
            [
              '<a name="--/allOf/1"/>`{boolean}`<br>',
              'Default: `true`'
            ]
          ]
        }
      ]

      const rendered = renderer.render(schema, 0)
      assert.deepStrictEqual(rendered, renderedSchema)
    })

    it('renders if', () => {
      const schema = parseSchema({
        $id: 'some.id',
        description: 'some property with descrition',
        if: {
          required: ['requiredProperty'],
          properties: {
            requiredProperty: {
              const: 'someValue'
            }
          }
        },
        then: {
          properties: {
            dependentProperty: { type: 'number' }
          }
        },
        else: {
          properties: {
            dependentElseProperty: { type: 'string' }
          }
        }
      })

      const renderedSchema = [
        {
          ul: [
            [
              '*If:*',
              '`{object}`<br>',
              'Additional properties allowed: `true`<br>',
              'Constraints: `required`: `["requiredProperty"]`<br>',
              'Properties:',
              {
                ul: [
                  [
                    '**requiredProperty**',
                    '<a name="some.id--/properties/requiredProperty"/>',
                    'Constraints: `const`: `"someValue"`<br>'
                  ]
                ]
              }
            ],
            [
              '*Then:*',
              '`{object}`<br>',
              'Additional properties allowed: `true`<br>',
              'Properties:',
              {
                ul: [
                  [
                    '**dependentProperty**',
                    '<a name="some.id--/then/properties/dependentProperty"/>`{number}`<br>'
                  ]
                ]
              }
            ],
            [
              '*Else:*',
              '`{object}`<br>',
              'Additional properties allowed: `true`<br>',
              'Properties:',
              {
                ul: [
                  [
                    '**dependentElseProperty**',
                    '<a name="some.id--/else/properties/dependentElseProperty"/>`{string}`<br>'
                  ]
                ]
              }
            ]
          ]
        }
      ]

      const rendered = renderer.render(schema, 0)
      assert.deepStrictEqual(rendered, renderedSchema)
    })
  })

  describe('renders array', () => {
    it('with simple item', () => {
      const schema = parseSchema({
        $id: 'schema.array',
        title: 'Some array',
        description: 'descrition of the array',
        type: 'array',
        items: {
          type: 'string',
          maxLength: 256,
        }
      })

      const renderedSchema = [
        '<a name="schema.array--"/>`{array}`<br>',
        { p: 'descrition of the array' },
        'Each item should be:',
        '`{string}`<br>', 'Constraints: `maxLength`: `256`<br>'
      ]

      const rendered = renderer.render(schema, 0)
      assert.deepStrictEqual(rendered, renderedSchema)
    })

    it('with conditional item', () => {
      const schema = parseSchema({
        $id: 'schema.array.conditional',
        title: 'Some array',
        description: 'descrition of the array',
        type: 'array',
        items: {
          anyOf: [
            {
              type: 'string',
              maxLength: 256,
            },
            {
              type: 'boolean'
            }
          ]
        }
      })

      const renderedSchema = [
        '<a name="schema.array.conditional--"/>`{array}`<br>',
        { p: 'descrition of the array' },
        'Each item should be:',
        '*Could be anyOf:*',
        {
          ul: [
            [ '`{string}`<br>', 'Constraints: `maxLength`: `256`<br>' ],
            [ '`{boolean}`<br>' ]
          ]
        }
      ]

      const rendered = renderer.render(schema, 0)
      assert.deepStrictEqual(rendered, renderedSchema)
    })
  })

  describe('renders reference', () => {
    const defaultSchema = {
      $id: 'schema.array',
      title: 'Some array',
      description: 'descrition of the array',
      type: 'array',
    }

    const defaultLocalRef = {
      $ref: 'common#/definitions/data',
      $xRef: {
        originalRef: 'common#/definitions/data',
        hash: '#definitions/data',
        isLocal: true
      },
    }

    it('resolved', () => {
      const schema = parseSchema({
        ...defaultSchema,
        items: {
          $ref: 'common#/definitions/data',
          $xRef: {
            originalRef: 'common#/definitions/foo',
            hash: '#definitions/foo',
            isLocal: false,
            id: 'common'
          }
        }
      })

      const renderedSchema = [
        '<a name="schema.array--"/>`{array}`<br>',
        { p: 'descrition of the array' },
        'Each item should be:',
        '[(common#/definitions/foo)](#common--definitions/foo)'
      ]

      const rendered = renderer.render(schema, 0)
      assert.deepStrictEqual(rendered, renderedSchema)
    })

    it('resolved deep', () => {
      const schema = parseSchema({
        ...defaultSchema,
        items: {
          ...defaultLocalRef,
          title: 'resolved title',
          description: 'resolved description'
        }
      })

      const renderedSchema = [
        '<a name="schema.array--"/>`{array}`<br>',
        { p: 'descrition of the array' },
        'Each item should be:',
        '[resolved title(common#/definitions/data)](#--definitions/data)'
      ]

      const rendered = renderer.render(schema, 0)
      assert.deepStrictEqual(rendered, renderedSchema)
    })

    it('resolved firstLevel', () => {
      const schema = parseSchema({
        $id: 'firstlevel.id',
        $xRef: {
          originalRef: 'common#/definitions/foo',
          hash: '#definitions/foo',
          isLocal: false,
          id: 'common'
        },
        title: 'resolved title',
        description: 'resolved description',
        type: 'string',
        enum: ['1', '2', '3']
      })

      const renderedSchema = [
        '<a name="firstlevel.id--"/>`{string}`<br>',
        'Constraints: `enum`: `["1","2","3"]`<br>',
        { p: 'resolved description' }
      ]

      const rendered = renderer.render(schema, 0)
      assert.deepStrictEqual(rendered, renderedSchema)
    })

    it('uses custom link generator', () => {
      renderer = new Renderer({
        linkFrom: () => 'customlinkfrom',
        linkTo: () => 'customlinkto',
      })

      const schema = parseSchema({
        ...defaultSchema,
        items: {
          ...defaultLocalRef,
          title: 'resolved title',
          description: 'resolved description'
        }
      })

      const renderedSchema = [
        '<a name="customlinkfrom"/>`{array}`<br>',
        { p: 'descrition of the array' },
        'Each item should be:',
        '[resolved title(common#/definitions/data)](customlinkto)'
      ]

      const rendered = renderer.render(schema, 0)
      assert.deepStrictEqual(rendered, renderedSchema)
    })
  })

  describe('renders object', () => {
    const object = {
      $id: 'schema.object',
      title: 'Some object',
      description: 'descrition of the object',
      type: 'object',
      required: ['first', 'second'],
      properties: {
        first: { type: 'number', description: 'first property' },
        second: { type: 'number', description: 'second property' }
      },
      default: {
        first: 42,
        second: 777,
      },
      example: {
        first: 24,
        second: 666,
      }
    }

    it('with properties', () => {
      const schema = parseSchema(object)

      const renderedSchema = [
        '<a name="schema.object--"/>`{object}`<br>',
        'Additional properties allowed: `true`<br>',
        'Constraints: `required`: `["first","second"]`<br>',
        'Default:',
        {
          code: {
            language: 'json',
            content: '{\n  "first": 42,\n  "second": 777\n}'
          }
        },
        { p: 'descrition of the object' },
        'Properties:',
        {
          ul: [
            [
              '**first**',
              '<a name="schema.object--/properties/first"/>`{number}`<br>',
              { p: 'first property' }
            ],
            [
              '**second**',
              '<a name="schema.object--/properties/second"/>`{number}`<br>',
              { p: 'second property' }
            ]
          ]
        },
        'Example:',
        {
          code: {
            language: 'json',
            content: '{\n  "first": 24,\n  "second": 666\n}'
          }
        }
      ]

      const rendered = renderer.render(schema, 0)
      assert.deepStrictEqual(rendered, renderedSchema)
    })

    it('with additionalProperties false', () => {
      const schema = parseSchema({
        ...object,
        additionalProperties: false
      })

      const renderedSchema = [
        '<a name="schema.object--"/>`{object}`<br>',
        'Additional properties allowed: `false`<br>',
        'Constraints: `required`: `["first","second"]`<br>',
        'Default:',
        {
          code: {
            language: 'json',
            content: '{\n  "first": 42,\n  "second": 777\n}'
          }
        },
        { p: 'descrition of the object' },
        'Properties:',
        {
          ul: [
            [
              '**first**',
              '<a name="schema.object--/properties/first"/>`{number}`<br>',
              { p: 'first property' }
            ],
            [
              '**second**',
              '<a name="schema.object--/properties/second"/>`{number}`<br>',
              { p: 'second property' }
            ]
          ]
        },
        'Example:',
        {
          code: {
            language: 'json',
            content: '{\n  "first": 24,\n  "second": 666\n}'
          }
        }
      ]

      const rendered = renderer.render(schema, 0)
      assert.deepStrictEqual(rendered, renderedSchema)
    })

    it('with additionalProperties schema', () => {
      const schema = parseSchema({
        ...object,
        additionalProperties: {
          type: 'string',
          maxLength: 256,
          default: '123',
        }
      })

      const renderedSchema = [
        '<a name="schema.object--"/>`{object}`<br>',
        'Additional properties allowed: `true`<br>',
        'Constraints: `required`: `["first","second"]`<br>',
        'Default:',
        {
          code: {
            language: 'json',
            content: '{\n  "first": 42,\n  "second": 777\n}'
          }
        },
        { p: 'descrition of the object' },
        'Properties:',
        {
          ul: [
            [
              '**first**',
              '<a name="schema.object--/properties/first"/>`{number}`<br>',
              { p: 'first property' }
            ],
            [
              '**second**',
              '<a name="schema.object--/properties/second"/>`{number}`<br>',
              { p: 'second property' }
            ]
          ]
        },
        { p: 'Additional properties should be:' },
        {
          ul: [
            '<a name="schema.object--"/>`{string}`<br>',
            'Constraints: `maxLength`: `256`<br>',
            'Default: `"123"`'
          ]
        },
        'Example:',
        {
          code: {
            language: 'json',
            content: '{\n  "first": 24,\n  "second": 666\n}'
          }
        }
      ]

      const rendered = renderer.render(schema, 0)
      assert.deepStrictEqual(rendered, renderedSchema)
    })

    it('with patternProperties', () => {
      const schema = parseSchema({
        ...object,
        patternProperties: {
          '^foo.*': {
            type: 'string',
            maxLength: 256,
            default: '777',
          }
        }
      })

      const renderedSchema = [
        '<a name="schema.object--"/>`{object}`<br>',
        'Additional properties allowed: `true`<br>',
        'Constraints: `required`: `["first","second"]`<br>',
        'Default:',
        {
          code: {
            language: 'json',
            content: '{\n  "first": 42,\n  "second": 777\n}'
          }
        },
        { p: 'descrition of the object' },
        'Properties:',
        {
          ul: [
            [
              '**first**',
              '<a name="schema.object--/properties/first"/>`{number}`<br>',
              { p: 'first property' }
            ],
            [
              '**second**',
              '<a name="schema.object--/properties/second"/>`{number}`<br>',
              { p: 'second property' }
            ]
          ]
        },
        { p: '**Pattern properties**:' },
        {
          ul: [
            [
              '**^foo.***',
              '<a name="schema.object--/patternProperties/^foo.*"/>`{string}`<br>',
              'Constraints: `maxLength`: `256`<br>',
              'Default: `"777"`'
            ]
          ]
        },
        'Example:',
        {
          code: {
            language: 'json',
            content: '{\n  "first": 24,\n  "second": 666\n}'
          }
        }
      ]

      const rendered = renderer.render(schema, 0)
      assert.deepStrictEqual(rendered, renderedSchema)
    })

    it('with definitons', () => {
      const schema = parseSchema({
        ...object,
        definitions: {
          'someDef': {
            title: 'someDef title',
            description: 'someDef description',
            type: 'string',
            maxLength: 256,
            default: '777',
          }
        }
      })

      const renderedSchema = [
        '<a name="schema.object--"/>`{object}`<br>',
        'Additional properties allowed: `true`<br>',
        'Constraints: `required`: `["first","second"]`<br>',
        'Default:',
        {
          code: {
            language: 'json',
            content: '{\n  "first": 42,\n  "second": 777\n}'
          }
        },
        { p: 'descrition of the object' },
        'Properties:',
        {
          ul: [
            [
              '**first**',
              '<a name="schema.object--/properties/first"/>`{number}`<br>',
              { p: 'first property' }
            ],
            [
              '**second**',
              '<a name="schema.object--/properties/second"/>`{number}`<br>',
              { p: 'second property' }
            ]
          ]
        },
        'Example:',
        {
          code: {
            language: 'json',
            content: '{\n  "first": 24,\n  "second": 666\n}'
          }
        },
        '**Definitions**:',
        {
          ul: [
            [
              '**schema.object#/definitions/someDef**',
              '<a name="schema.object--/definitions/someDef"/>`{string}`<br>',
              'Constraints: `maxLength`: `256`<br>',
              'Default: `"777"`',
              { p: 'someDef description' },
              '<br>'
            ]
          ]
        }
      ]

      const rendered = renderer.render(schema, 0)
      assert.deepStrictEqual(rendered, renderedSchema)
    })

    it('with if condition', () => {
      const schema = parseSchema({
        ...object,
        if: {
          required: ['requiredProperty'],
          properties: {
            requiredProperty: {
              const: 'someValue'
            }
          }
        },
        then: {
          properties: {
            dependentProperty: { type: 'number' }
          }
        },
        else: {
          properties: {
            dependentElseProperty: { type: 'string' }
          }
        }
      })

      const renderedSchema = [
        '<a name="schema.object--"/>`{object}`<br>',
        'Additional properties allowed: `true`<br>',
        'Constraints: `required`: `["first","second"]`<br>',
        'Default:',
        {
          code: {
            language: 'json',
            content: '{\n  "first": 42,\n  "second": 777\n}'
          }
        },
        { p: 'descrition of the object' },
        [
          {
            ul: [
              [
                '*If:*',
                '`{object}`<br>',
                'Additional properties allowed: `true`<br>',
                'Constraints: `required`: `["requiredProperty"]`<br>',
                'Properties:',
                {
                  ul: [
                    [
                      '**requiredProperty**',
                      '<a name="schema.object--/properties/requiredProperty"/>',
                      'Constraints: `const`: `"someValue"`<br>'
                    ]
                  ]
                }
              ],
              [
                '*Then:*',
                '`{object}`<br>',
                'Additional properties allowed: `true`<br>',
                'Properties:',
                {
                  ul: [
                    [
                      '**dependentProperty**',
                      '<a name="schema.object--/if/then/properties/dependentProperty"/>`{number}`<br>'
                    ]
                  ]
                }
              ],
              [
                '*Else:*',
                '`{object}`<br>',
                'Additional properties allowed: `true`<br>',
                'Properties:',
                {
                  ul: [
                    [
                      '**dependentElseProperty**',
                      '<a name="schema.object--/if/else/properties/dependentElseProperty"/>`{string}`<br>'
                    ]
                  ]
                }
              ]
            ]
          }
        ],
        'Properties:',
        {
          ul: [
            [
              '**first**',
              '<a name="schema.object--/properties/first"/>`{number}`<br>',
              { p: 'first property' }
            ],
            [
              '**second**',
              '<a name="schema.object--/properties/second"/>`{number}`<br>',
              { p: 'second property' }
            ]
          ]
        },
        'Example:',
        {
          code: {
            language: 'json',
            content: '{\n  "first": 24,\n  "second": 666\n}'
          }
        }
      ]

      const rendered = renderer.render(schema, 0)
      assert.deepStrictEqual(rendered, renderedSchema)
    })
  })
})
