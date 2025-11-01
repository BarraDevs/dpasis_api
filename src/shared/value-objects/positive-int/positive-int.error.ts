export class NumberMustBePositiveAndInt extends Error {
  constructor(resource: string) {
    super(`${resource} deve ser um inteiro positivo`);
    this.name = 'NumberMustBePositiveAndInt';
  }
}
