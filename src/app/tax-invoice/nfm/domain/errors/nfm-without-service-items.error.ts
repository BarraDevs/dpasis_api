import { AppException } from 'src/core/filters/app.exception';

export class NfmWithoutServiceItemsError extends AppException {
  constructor() {
    super('Grupo NFM sem itens de serviço.');
    this.name = 'NfmWithoutServiceItemsError';
  }
}
