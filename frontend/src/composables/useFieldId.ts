let counter = 0;

/** Unique id for linking <label for> with form controls. */
export function useFieldId(prefix = 'field'): string {
  counter += 1;
  return `${prefix}-${counter}`;
}
