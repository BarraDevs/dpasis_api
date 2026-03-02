import { AppException } from 'src/core/filters/app.exception';
import { ClientAddressType } from '../enums/client-address-type.enum';

export class ClientAddressAlreadyExistsError extends AppException {
  constructor(clientId: number, type: ClientAddressType) {
    super(`Endereço do tipo ${type} já existe para o cliente ${clientId}.`, 409);
    this.name = 'ClientAddressAlreadyExistsError';
  }
}
