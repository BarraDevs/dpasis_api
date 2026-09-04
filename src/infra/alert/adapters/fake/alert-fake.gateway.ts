import { Injectable } from '@nestjs/common';
import { IAlertGateway } from '../../alert.gateway';
import { AlertDto } from '../../dtos/alert.dto';

@Injectable()
export class AlertFakeAdapterGateway implements IAlertGateway {
  public readonly sentAlerts: AlertDto[] = [];
  /** Permite ao teste simular um canal fora do ar sem mexer no transporte. */
  public deliver = true;

  public async send(alert: AlertDto): Promise<boolean> {
    this.sentAlerts.push(alert);
    return this.deliver;
  }
}
