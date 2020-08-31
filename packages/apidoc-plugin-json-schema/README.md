# Microfleet JSON Schema apidoc plugin

The `apidoc` plugin that provides `@jsonSchema` keyword.

## Install
`yarn add @microfleet/apidoc-plugin-json-schema`

## Additional apidoc configuration

```javascript
// apidoc.config.js
const { resolve } = require('path')

module.exports = {
  schemas: {
    path: resolve(__dirname, './schemas') // path to the schemas folder
  }
}

```

## Usage
`@apiSchema {jsonschema={relative path to schemas folder}} api{Request|Response}`

Example:

```javascript
/**
 * @apiSchema {jsonschema=path/to/schema.json} apiRequest
 * @apiSchema {jsonschema=path/to/response/schema.json} apiResponse
 */
export function DoWork() {}
```
