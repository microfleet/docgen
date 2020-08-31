import type { RefParser } from '@microfleet/schema-tools'

declare module 'apidoc' {
  type GetPathFn = () => string

  interface Parser {
    parse: (content: string, source?: any ) => any
    path?: string | GetPathFn
    group?: string | GetPathFn
    method: string,
    markdownFields?: string[],
    preventGlobal?: boolean,
  }

  interface Worker {
    preProcess?: (parsedFiles: any[], filenames: string[], packageInfos: any, ...args: any[]) => Record<string,any>
    postProcess?: (parsedFiles: any[], filenames: string[], preprocessed: any ,packageInfos: any) => void
  }

  interface Application {
    packageInfos: any
    log: any,
    parsers: {
      [key: string]: Parser
    }
    workers: {
      [key: string]: Worker
    }
    mft: {
      refParser: RefParser
      config: {
        [key: string]: any
      }
    },
    addHook: (hook: string, fn: (elements: any[], element: any, block: any, filename: string) => any[], ...args: any[]) => any[]
  }
}
