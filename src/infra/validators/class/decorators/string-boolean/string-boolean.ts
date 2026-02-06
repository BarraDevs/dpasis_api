import { Transform, TransformOptions } from 'class-transformer';

export function StringToBoolean(opts?: TransformOptions): PropertyDecorator {
  return Transform(({ value }) => (typeof value === 'string') ? (value.toLowerCase() === 'true') : value, opts);
}
