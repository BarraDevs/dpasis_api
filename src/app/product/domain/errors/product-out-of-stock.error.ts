import { AppException } from 'src/core/filters/app.exception';

export class ProductOutOfStockError extends AppException {
  constructor(productName: string) {
    super(`Produto "${productName}" sem estoque suficiente`, 400);
    this.name = 'ProductOutOfStockError';
  }
}
