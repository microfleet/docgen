import * as fg from 'fast-glob'
import * as path from 'path'
import * as url from 'url'
import { promises as fsPromise } from 'fs'
import { assign, cloneDeep } from 'lodash'
import { JsonPointer } from 'json-ptr'
import * as deasync from 'deasync'

import { walk, SchemaNode, WalkParams } from './walk'

type RefParserOpts = {
  schemaDirs: string[] | string,
  pattern?: string,
  deep?: boolean
}

type SchemaInfo = {
  schema: SchemaNode,
  path: string,
  base: string,
  resolved: boolean,
  parsed: boolean,
}

type ReferenceInfo = {
  self: boolean;
  schema: SchemaInfo;
  ref: SchemaNode;
}

export type ResolvedReference = {
  isLocal: boolean,
  base: string,
  path: string,
  hash: string,
  full: string,
  originalRef: string,
  id: string,
}

export type ResolvedSchema  = SchemaNode & {
  $xRef?: ResolvedReference
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

        // resolve only local refs
        const resolved = this.resolveSchema(parsed, true)
        this.schemas[id] = {
          schema: resolved,
          path: sp,
          base: schemaDir,
          resolved: false,
          parsed: false
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

  private parseRef(schema: SchemaNode, ref: string) {
    const parsed = url.parse(ref)
    const { path: parsedPath, hash } = parsed
    const ptr = !hash || hash.length < 2 ? '' : hash.replace(/^#/, '')

    return { isLocal: schema.$id === parsedPath || parsedPath === null, id: parsedPath, ptr }
  }

  public resolveSchema(schema: SchemaNode, localOnly = false): ResolvedSchema {
    const resultSchema = cloneDeep(schema)

    const cb = (params: WalkParams) => {
      const { node, root } = params
      if (node.$ref) {
        const { isLocal } = this.parseRef(root, node.$ref)
        if (localOnly && !isLocal) return

        if (isLocal) {
          const ref = this.asLocalRef(root, node.$ref)
          const { $id: _, ...rest } = ref
          const $xRef = {
            local: true,
            hash: node.$ref.replace(/(.+)#/, '#') || '#/',
            originalRef: node.$ref
          }

          assign(node, this.deep ? { $xRef, ...rest } : { $xRef })

          return
        }

        let refInfo: ReferenceInfo

        try {
          refInfo = this.findRef(root, node.$ref)
        } catch (e) {
          // consolse.error('noref', node.$ref, { localOnly, root, refSchema }
          if (!localOnly) throw e
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const refSchemaInfo = refInfo!.schema

        if (! refSchemaInfo.parsed) {
          refSchemaInfo.schema = this.resolveSchema(refSchemaInfo.schema, localOnly)
          refSchemaInfo.parsed = true
        }

        const parsedRefSchema = refSchemaInfo.schema
        const { $id: _, ...localRef } = this.asLocalRef(parsedRefSchema, node.$ref)

        const $xRef = {
          local: false,
          base: refSchemaInfo.base,
          path: refSchemaInfo.path,
          hash: node.$ref.replace(/(.+)#/, '#') || '#/',
          full: node.$ref.replace(/(.+)#/, `${refSchemaInfo.path}#`),
          originalRef: node.$ref,
          id: parsedRefSchema.$id,
        }

        // eslint-disable-next-line no-console
        console.debug('this.deep', { deep: this.deep })
        assign(node, this.deep ? { $xRef, ...localRef } : { $xRef })
      }
    }

    walk(resultSchema, { post: cb })

    return resultSchema
  }

  private findRef(schema: SchemaNode, ref: string): ReferenceInfo {
    const parsed = url.parse(ref)
    const { path: parsedPath, hash } = parsed
    const ptr = !hash || hash.length < 2 ? '' : hash.replace(/^#/, '')
    const targetSchema = parsedPath != null ? this.schemas[parsedPath].schema : schema

    if (!parsedPath) throw new Error(`unable to resolve reference ${ref}`)

    const refPointer = JsonPointer.create(ptr)
    return {
      ref: refPointer.get(targetSchema) as SchemaNode,
      schema: this.schemas[parsedPath],
      self: parsedPath == null
    }
  }

  private asLocalRef(schema: SchemaNode, ref: string): SchemaNode {
    const parsed = url.parse(ref)
    const { hash } = parsed
    const ptr = !hash || hash.length < 2 ? '' : hash.replace(/^#/, '')
    const refPointer = JsonPointer.create(ptr)
    return refPointer.get(schema) as SchemaNode
  }
}
