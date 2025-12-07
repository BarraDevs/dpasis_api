import { ValidationPipeOptions } from '@nestjs/common';

const pipeOptions: ValidationPipeOptions = {
  whitelist: true,
  transform: true,
};

export { pipeOptions };
