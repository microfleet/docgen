import * as fg from 'fast-glob'
import * as path from 'path'
import * as url from 'url'
import { promises as fsPromise } from 'fs'
import { assign, cloneDeep } from 'lodash'
import { JsonPointer } from 'json-ptr'
import * as deasync from 'deasync'

import { walk, JsonSchema, WalkParams } from './walk'

type RefParserOpts = {
  schemaDirs: string[] | string,
  pattern?: string,
  deep?: boolean
}

export type SchemaInfo = {
  schema: JsonSchema,
  path: string,
  base: string,
  resolved: boolean,
}

type ReferenceInfo = {
  schema: SchemaInfo;
  ref: JsonSchema;
}

export type ResolvedReference = {
  isLocal: boolean,
  base?: string,
  path?: string,
  hash: string,
  full?: string,
  originalRef: string,
  id: string,
}

export type ResolvedSchema  = JsonSchema & {
  $xRef?: ResolvedReference
}

type ParsedRef = {
  ptr: JsonPointer
  parsed: url.UrlWithStringQuery
  isLocal: boolean
  refId: string | null
}

export class RefParser {
  private schemaDirs: string[] = []
  private pattern = '**/*.json'
  private deep = true

  public schemas: { [key: string]: SchemaInfo } = {}

  constructor(opts: RefParserOpts) {
    this.schemaDirs = Array.isArray(opts.schemaDirs) ? opts.schemaDirs : [ opts.schemaDirs ]
    this.pattern = opts.pattern || this.pattern
    this.deep = opts.deep === false ? opts.deep : this.deep
  }

  public async findSchemas(): Promise<void> {
    const dirPromises = this.schemaDirs.map(async (dir) => {
      const schemaDir = path.resolve(dir)
      const schemas = await fg([ this.pattern ], { cwd: schemaDir })

      const schemaPromises = schemas.map(async (sp) => {
        const raw = await fsPromise.readFile(path.join(schemaDir, sp), { encoding: 'utf8' })
        const parsed = JSON.parse(raw)
        const id = parsed.$id || sp.replace(/\.[^.]+$/, '').replace(path.sep, '.')

        // assign id
        parsed.$id = id

        // resolve only local refs
        const resolved = this.resolveSchema(parsed, true)
        this.schemas[id] = {
          schema: resolved,
          path: sp,
          base: schemaDir,
          resolved: false,
        }
      })

      await Promise.all(schemaPromises)
    })

    await Promise.all(dirPromises)
  }

  public findSchemasSync(): void {
    const syncRun = (cb: (...args: any[]) => void) => {
      this.findSchemas()
        .then(() => {
          cb(null, { done: true})
        })
        .catch((e) => {
          cb(e)
        })
    }

    deasync(syncRun)()
  }

  private parseRef(schema: JsonSchema, ref: string): ParsedRef {
    const parsed = url.parse(ref)
    const { path: parsedPath, hash } = parsed
    const ptr = JsonPointer.create(!hash || hash.length < 2 ? '' : hash.replace(/^#/, ''))
    const baseName = parsedPath ? path.basename(parsedPath, '.json') : null

    return {
      ptr, parsed,
      isLocal: schema.$id === baseName || parsedPath === null,
      refId: baseName
    }
  }

  public resolveSchema(schema: JsonSchema, localOnly = false): ResolvedSchema {
    const resultSchema = cloneDeep(schema)

    const cb = (params: WalkParams) => {
      const { node, root } = params
      if (node.$ref) {
        const parsedReference = this.parseRef(root, node.$ref)
        const { isLocal, ptr } = parsedReference

        if (localOnly && !isLocal) return

        if (isLocal) {
          // const ref = this.asLocalRef(root, node.$ref)
          const ref = ptr.get(root) as ResolvedSchema
          const { $id: _, $ref: __, ...rest } = ref
          const $xRef: ResolvedReference = {
            isLocal: true,
            hash: node.$ref.replace(/(.+)#/, '#') || '#/',
            originalRef: node.$ref,
            id: root.$id
          }

          assign(node, this.deep ? { $xRef, ...rest } : { $xRef })

          return
        }

        let refInfo: ReferenceInfo

        try {
          refInfo = this.findRemoteRef(parsedReference)
        } catch (e) {
          if (!localOnly) throw e
        }

        const refSchemaInfo = refInfo!.schema

        if (! refSchemaInfo.resolved) {
          refSchemaInfo.schema = this.resolveSchema(refSchemaInfo.schema, localOnly)
          refSchemaInfo.resolved = true
        }

        const parsedRefSchema = refSchemaInfo.schema
        const { $id: _, $ref: __, ...restRefData } = ptr.get(parsedRefSchema) as ResolvedSchema

        const $xRef: ResolvedReference = {
          isLocal: false,
          base: refSchemaInfo.base,
          path: refSchemaInfo.path,
          hash: node.$ref.replace(/(.+)#/, '#') || '#/',
          full: node.$ref.replace(/(.+)#/, `${refSchemaInfo.path}#`),
          originalRef: node.$ref,
          id: parsedRefSchema.$id,
        }
        assign(node, this.deep ? { $xRef, ...restRefData } : { $xRef })
      }
    }

    walk(resultSchema, { pre: cb })

    // save updated schema if such id exists
    const schemaId = resultSchema.$id
    if (this.schemas[schemaId]) {
      this.schemas[schemaId].resolved = true
      this.schemas[schemaId].schema = resultSchema
    }

    return resultSchema
  }

  private findRemoteRef(ref: ParsedRef): ReferenceInfo {
    const targetSchema = this.schemas[ref.refId!]

    if (!targetSchema) throw new Error(`unable to resolve reference '${ref.refId}#${ref.ptr}'`)

    const referenced = ref.ptr.get(targetSchema.schema) as JsonSchema
    return {
      ref: referenced,
      schema: targetSchema,
    }
  }
}
