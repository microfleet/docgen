import { RefParser } from '@microfleet/schema-tools'
import type { Application } from 'apidoc'

import { parser } from './parser/api_schema'
import { refSchemaWorker } from './worker/api_schema'

module.exports = {
	init: function(app: Application) {
		const defaults = {
			path: 'schemas/',
    }

    const config = { ...defaults, ...app.packageInfos.schemas}
    const refParser = new RefParser({
      schemaDirs: config.path,
      deep: true,
    })

    refParser.findSchemasSync()

    // extend app
    app.mft = {
      refParser,
      config,
    }

    parser.parse = parser.parse.bind(app)

    app.parsers.apischema = parser
    app.workers.apischema = refSchemaWorker(app)
	}
}
