import { AlertDto } from './dtos/alert.dto';

export interface IAlertGateway {
  send(alert: AlertDto): Promise<void>;
}
