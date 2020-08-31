# Apidoc Markdown generator

The CLI tool that Generates documentation in Markdown from `apidoc` generated data.

## Install
`yarn add @microfleet/mdoc-markdown`


## Usage

```console
Usage: mdoc-markdown -p <path> -o <output_file> [-t <template_path>] [--multi] [--createPath] [--prepend <file_path>]

Options:
  --version         Show version number                                                                                  [boolean]
  --apiDocPath, -p  Path to generated apiDoc output directory. Where `api_data.json` and `api_project.json` resides.
                                                                                                               [string] [required]
  --output, -o      Output file or directory to write output to.                                               [string] [required]
  --template, -t    Path to EJS template file, if not specified default template will be used.
                                [string] [default: "/Users/pajgo/work/pajgo/microfleet_docgen/packages/mdoc/template/default.ejs"]
  --prepend         Path to file content to add before route groups documentation.                                        [string]
  --multi           Output one file per group to the `output` directory.                                [boolean] [default: false]
  --createPath      Recursively create directory to the `output` directory.                [boolean] [default: false]
  -h, --help        Show help                                                                                            [boolean]

Examples:
  mdoc-markdown -p doc/ -o doc.md                     Generate from `doc/` apiDoc output to `./doc.md`
  mdoc-markdown -p doc -o multi --multi --createPath  Generate from `doc/` apiDoc output to `./multi/<group>.md`
```

## Configuration
Cli arguments are read from: `.mdocrc.js`, `.mdocrc.json`, `.mdocrc` files.

Example:

```javascript
module.exports = {
  createPath: true,
  apiDocPath: './apidoc',
  output: 'docs/API.md',
  multi: false,
}
```

## Example

```console
$@: yarn apidoc -i ./src -o ./.apidoc && yarn mdoc-markdown -p ./.apidoc -o docs/API.md
```
