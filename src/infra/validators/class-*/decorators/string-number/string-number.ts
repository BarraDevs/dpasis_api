import { Transform, TransformOptions } from 'class-transformer';

export function StringToNumber(opts?: TransformOptions): PropertyDecorator {
  return Transform(({ value }) => (typeof value === 'string') ? Number(value) : value, opts);
}
