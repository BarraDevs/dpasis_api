import { Transform, TransformOptions } from 'class-transformer';

export function Trim(opts?: TransformOptions): PropertyDecorator {
  return Transform(({ value }) => (typeof value === 'string') ? value.trim() : value, opts);
}
