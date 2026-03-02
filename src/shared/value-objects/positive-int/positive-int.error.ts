import { AppException } from 'src/core/filters/app.exception';

export class NumberMustBePositiveAndInt extends AppException {
  constructor(resource: string) {
    super(`O campo ${resource} deve ser um número inteiro positivo`, 400);
    this.name = 'NumberMustBePositiveAndInt';
  }
}
