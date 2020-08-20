export const SCHEMA_DESCRIPTION_KEYS = ['description', 'example', 'title'] as const
export type SCHEMA_DESCRIPTION = typeof SCHEMA_DESCRIPTION_KEYS[number]

export const IF_CONDITION_KEYS = ['if', 'then', 'else']
export type IF_CONDITION = typeof IF_CONDITION_KEYS[number]

export const OF_CONDITION_KEYS = ['allOf', 'oneOf', 'anyOf']
export type OF_CONDITION = typeof OF_CONDITION_KEYS[number]

export const TREE_NODE_TYPES = ['x-node', 'x-object', 'x-array', 'x-ref', 'x-cond-if', 'x-cond-of'] as const

export const SCHEMA_KEYWORDS = [...IF_CONDITION_KEYS, ...OF_CONDITION_KEYS]
