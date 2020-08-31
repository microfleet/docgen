# Microfleet JSON Schemas documentation generator

This mono repository contains tools and helpers for API documentation generation.

### Packages

* [@microfleet/schema-tools](./packages/schema-tools) - The core of the JsonSchema documentation generator. Resolves JsonSchema references with [@microfleet/validation](https://github.com/microfleet/validation) flavoured automatical id generation.
* [@microfleet/schema2md](./packages/schema2md) - Renders schemas parsed and dereferenced by `@microfleet/schema-tools` into `json2md` compatible format.
* [@microfleet/apidoc-plugin-json-schema](./packages/apidoc-plugin-json-schema) - The `apidoc` plugin that helps to include JsonSchemas into your API documentation.
* [@microfleet/mdoc](./packages/mdoc) - CLI tool that wraps `apidoc-markdown` with own default template and additional helper to build links between JsonSchemas. Generates MD from apidoc data files.

### Development

1. Clone this repository
2. `yarn install`
3. `yarn dev`

### Usage

See [@microfleet/mdoc](./packages/mdoc)
