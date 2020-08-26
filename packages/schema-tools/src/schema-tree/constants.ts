export const SCHEMA_DESCRIPTION_KEYS = ['description', 'example', 'title'] as const
export const IF_CONDITION_KEYS = ['if', 'then', 'else']
export const OF_CONDITION_KEYS = ['allOf', 'oneOf', 'anyOf']
export const TREE_NODE_TYPES = ['x-node', 'x-object', 'x-array', 'x-ref', 'x-cond-if', 'x-cond-of'] as const
export const OBJECT_KEYWORDS = ['properties', 'additionalProperties', 'patternProperties']

export type OF_CONDITION = typeof OF_CONDITION_KEYS[number]
export type IF_CONDITION = typeof IF_CONDITION_KEYS[number]
export type SCHEMA_DESCRIPTION = typeof SCHEMA_DESCRIPTION_KEYS[number]
