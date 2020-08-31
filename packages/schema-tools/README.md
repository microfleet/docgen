# Microfleet Json Schema Tools

This package resolves JSON Schemas that `@microfleet/plugin-validator` and `@microfleet/core` uses for Response and Request validation. Additionally, this package parse resolved JSON Schema into specific data structures for additional schema structure processing or documentation generation.

## Install
`yarn add @microfleet/schema-tools`

## Usage

### Resolve references

Example schemas:
```json
// schemas/common.json
{
  "$id": "common",
  "definitions": {
    "myDefinition": {
      "type": "string",
      "minLength": 10,
    }
  }
}
```

```json
// schemas/validation.json
{
  "type": "object",
  "properties": {
    "myProperty": {
      "$ref": "common#/definitions/myDefinition"
    }
  }
}
```

Resolve references:

```javascript
const { RefParser } = require('@microfleet/schema-tools');
const schema = require('schemas/validation.json');

const rp = new RefParser({
  schemaDirs: [ './schemas' ],
})

// Find schemas in provided paths and resolve their local references
await rp.findSchemas()

// Resolve reference and assign `$xRef` property with resolved reference information
const resolved = rp.resolve(schema)
// or
const resolved = rp.resolve(rp.schemas['validation'])
```

Build a Schema tree that will repeat the schema structure but will contain corresponding class instances for each schema type:

```javascript
const { SchemaNode } = require('@microfleet/schema-tools')
const schemaTree = SchemaNode.parse(resolved)
```

For advanced schema tree usage examples, please read project tests or [@microfleet/schema2md](../../schema2md/) sources.
