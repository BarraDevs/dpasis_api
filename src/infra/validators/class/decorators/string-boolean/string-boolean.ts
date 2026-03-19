import { Transform, TransformOptions } from 'class-transformer';

export function StringToBoolean(opts?: TransformOptions): PropertyDecorator {
  return Transform(({ value }) => {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value !== 'string') {
      return value;
    }
    if (value.toLowerCase() === 'true') {
      return true;
    }
    if (value.toLowerCase() === 'false') {
      return false;
    }
    return value;
  }, opts);
}
