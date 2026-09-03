import { Injectable } from '@nestjs/common';
import { IAlertGateway } from '../../alert.gateway';
import { AlertDto } from '../../dtos/alert.dto';

@Injectable()
export class AlertFakeAdapterGateway implements IAlertGateway {
  public readonly sentAlerts: AlertDto[] = [];

  public async send(alert: AlertDto): Promise<void> {
    this.sentAlerts.push(alert);
  }
}
