import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsUnsigned32HexStringConstraint } from './is-unsigned-32-hex-string.constraint';

export function IsUnsigned32HexString(validationOptions?: ValidationOptions): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isUnsigned32HexString',
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints: [],
      validator: IsUnsigned32HexStringConstraint,
    });
  };
}
