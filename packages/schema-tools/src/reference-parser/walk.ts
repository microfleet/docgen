import { JsonPointer } from 'json-ptr'

export type SchemaNode = {
  [key: string]: any
}

type ExtraParams = {
  [key: string]: any
}

export type WalkParams = {
  node: SchemaNode,
  ptr: JsonPointer,
  root: SchemaNode,
  extra?: ExtraParams,
  key?: string | number,
  parent?: SchemaNode,
}

type WalkCb = {
  pre?: (params: WalkParams) => void
  post?: (params: WalkParams) => void
}

function walkObject(args: WalkParams, cb: WalkCb) {
  const { node, ptr, root, extra } = args
  const params = { parent: node, parentPtr: ptr, root, extra }

  if (typeof node === 'object' && !Array.isArray(node)) {
    for (const [childKey, child] of Object.entries(node)) {
      // skip internally created fields
      if (childKey.startsWith('$x')) continue

      const myPtr = ptr.concat(`/${childKey}`)
      const extendedParams = { ...params, node: child, parent: node, key: childKey, ptr: myPtr }
      if (Array.isArray(child) || typeof child === 'object') {
        if (cb.pre) cb.pre(extendedParams)
        walkObject(extendedParams, cb)
        if (cb.post) cb.post(extendedParams)
      }
    }
    return
  }

  for (let index = 0; index < node.length; index += 1) {
    const myPtr = ptr.concat(`/${index}`)
    if (Array.isArray(node[index]) || typeof node[index] === 'object') {
      const extendedParams = { ...params, node: node[index], key: index, ptr: myPtr }
      if (cb.pre) cb.pre(extendedParams)
      walkObject(extendedParams, cb)
      if (cb.post) cb.post(extendedParams)
    }
  }
}

export function walk(obj: SchemaNode, cb?: WalkCb, extra?: ExtraParams, ptr = ''): void {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const callbacks = { ...{ pre: () => {}, post: () => {} }, ...cb }
  const params = {
    root: obj,
    node: obj,
    parent: undefined,
    ptr: JsonPointer.create(ptr),
    extra
  }
  callbacks.pre(params)
  walkObject(params, callbacks)
  callbacks.post(params)
}
