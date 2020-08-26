import * as path from 'path'
import * as yargs from 'yargs'
import * as findUp from 'find-up'
import * as readPkg from 'read-pkg'
import * as assert from 'assert'
import * as fs from 'fs'

import { ConfigObj } from './types'

const parentProject = readPkg.sync()
assert(parentProject && parentProject.version, 'Must contain package.json in the current dir')

const configPath = findUp.sync(['.apidoc-md.rc', '.apidoc-md.js', '.apidoc-md.json'])

const config = configPath
  ? configPath.endsWith('.js')
    ? require(configPath)
    : JSON.parse(fs.readFileSync(configPath, { encoding: 'utf-8' }))
  : { default: 1 }

const cli = yargs
  .usage('Generate Markdown documentation from apiDoc data.')
  .usage(
    'Usage: apidoc-markdown -p <path> -o <output_file> [-t <template_path>] [--multi] [--createPath] [--prepend <file_path>]'
  )
  .example('apidoc-markdown -p doc/ -o doc.md', 'Generate from `doc/` apiDoc output to `./doc.md`')
  .example(
    'apidoc-markdown -p doc -o multi --multi --createPath',
    'Generate from `doc/` apiDoc output to `./multi/<group>.md`'
  )
  .option('apiDocPath', {
    alias: 'p',
    demandOption: true,
    describe: 'Path to generated apiDoc output directory. Where `api_data.json` and `api_project.json` resides.',
    type: 'string'
  })
  .option('output', {
    alias: 'o',
    demandOption: true,
    describe: 'Output file or directory to write output to.',
    type: 'string'
  })
  .option('template', {
    alias: 't',
    describe: 'Path to EJS template file, if not specified default template will be used.',
    default: path.resolve(__dirname, '..', 'template', 'default.ejs'),
    type: 'string'
  })
  .coerce(['template', 'apiDocPath', 'output'], (arg) => {
    return path.isAbsolute(arg) ? arg : path.resolve(arg)
  })
  .option('prepend', {
    describe: 'Path to file content to add before route groups documentation.',
    type: 'string'
  })
  .option('multi', {
    describe: 'Output one file per group to the `output` directory.',
    default: false,
    type: 'boolean'
  })
  .option('createPath', {
    describe: 'Recursively create directory arborescence to the `output` directory.',
    default: false,
    type: 'boolean'
  })
  .config(config)
  .help('h')
  .alias('h', 'help')
  .wrap(yargs.terminalWidth())

export default <ConfigObj>cli.argv
