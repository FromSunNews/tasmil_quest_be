import { ColumnOptions, ColumnType } from 'typeorm';

export const TIMESTAMP_COLUMN_TYPE: ColumnType = 'timestamptz';

export const JSON_COLUMN_TYPE: ColumnType = 'jsonb';

export const enumColumn = <T extends Record<string, unknown> | (string | number)[]>(
  enumType: T,
  options: ColumnOptions = {},
): ColumnOptions => ({
  ...options,
  type: 'enum',
  enum: enumType,
});

