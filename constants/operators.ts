/**
 * Condition-rule operators for the trigger builder.
 *
 * Each operator specifies its display label and the input type it expects,
 * so the condition-builder UI can render the right widget.
 */

/** The kind of input widget an operator needs. */
export type OperatorInputType = 'text' | 'number' | 'boolean' | 'none'

/** Descriptor for a single comparison operator. */
export interface OperatorDescriptor {
  readonly value: string
  readonly label: string
  readonly inputType: OperatorInputType
}

/**
 * Canonical operator list — the single source of truth.
 */
export const OPERATORS = [
  { value: 'eq', label: 'Equals', inputType: 'text' },
  { value: 'neq', label: 'Not Equals', inputType: 'text' },
  { value: 'gt', label: 'Greater Than', inputType: 'number' },
  { value: 'gte', label: 'Greater Than or Equal', inputType: 'number' },
  { value: 'lt', label: 'Less Than', inputType: 'number' },
  { value: 'lte', label: 'Less Than or Equal', inputType: 'number' },
  { value: 'contains', label: 'Contains', inputType: 'text' },
  { value: 'not_within_days', label: 'Not Within Days', inputType: 'number' },
  { value: 'is_true', label: 'Is True', inputType: 'none' },
  { value: 'is_false', label: 'Is False', inputType: 'none' },
] as const satisfies readonly OperatorDescriptor[]

/** Union of all valid operator string values. */
export type OperatorValue = (typeof OPERATORS)[number]['value']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Look up an operator descriptor by its value.
 * Returns `undefined` when the value doesn't match any known operator.
 */
export function getOperatorByValue(
  value: string,
): OperatorDescriptor | undefined {
  return OPERATORS.find((op) => op.value === value)
}

/**
 * Operators grouped by the input type they require.
 * Keyed by `OperatorInputType`, each value is the subset of OPERATORS
 * matching that input type.
 */
export const OPERATORS_BY_INPUT_TYPE: Record<
  OperatorInputType,
  readonly OperatorDescriptor[]
> = {
  text: (OPERATORS as readonly OperatorDescriptor[]).filter((op) => op.inputType === 'text'),
  number: (OPERATORS as readonly OperatorDescriptor[]).filter((op) => op.inputType === 'number'),
  boolean: (OPERATORS as readonly OperatorDescriptor[]).filter((op) => op.inputType === 'boolean'),
  none: (OPERATORS as readonly OperatorDescriptor[]).filter((op) => op.inputType === 'none'),
} as const
