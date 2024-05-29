import { ValueTransformer } from 'typeorm';

/** Postgres returns NUMERIC as string — convert it to a JS number for money fields. */
export const numericTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value === null || value === undefined ? value : parseFloat(value)),
};
