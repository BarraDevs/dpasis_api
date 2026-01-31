import { AppException } from 'src/core/filters/app.exception';

export class ShipperNotActiveError extends AppException {
  constructor(shipperName: string) {
    super(`Transportadora "${shipperName}" está inativa`, 400);
    this.name = 'ShipperNotActiveError';
  }
}
