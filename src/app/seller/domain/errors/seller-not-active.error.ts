import { AppException } from 'src/core/filters/app.exception';

export class SellerNotActiveError extends AppException {
  constructor(sellerName: string) {
    super(`Vendedor "${sellerName}" está inativo`, 400);
    this.name = 'SellerNotActiveError';
  }
}
