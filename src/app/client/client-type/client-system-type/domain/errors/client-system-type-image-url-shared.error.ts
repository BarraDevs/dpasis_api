import { AppException } from 'src/core/filters/app.exception';

export class ClientSystemTypeImageUrlSharedError extends AppException {
  constructor() {
    super('Não é possível excluir o tipo de sistema pois a mesma URL de imagem está vinculada a outro registro.', 409);
    this.name = 'ClientSystemTypeImageUrlSharedError';
  }
}
