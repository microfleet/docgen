# Microfleet schema2md

Converts parsed JsonSchema into `json2md` compatible datastructures.

## Install

`yarn add @microfleet/schema2md`

## Configuration

  * `linkTo?`: (ref: SchemaRef) => string - function used when generating link href to the reference.
  * `linkFrom?`: (node: SchemaNode) => string - function used when generating link name for the reference.

## Usage

For full working example please see tests or [@microfleet/mdoc-markdow](../mdoc-markdown).

Please referer [this page](../schema-tools/README.md) for schemas used in this example.

```javascript
const { SchemaNode } = require('@microfleet/schema-tools')
const { Renderer } = require('@microfleet/schema2md')
const json2md = require('json2md')

const schemaTree = SchemaNode.parse(resolved)

const renderer = new Renderer()
const json2mdSchema = renderer.render(schemaTree)

const markdown = json2md(json2mdSchema)
```
