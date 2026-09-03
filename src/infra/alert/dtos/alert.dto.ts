import { AlertType } from '../enums/alert-type.enum';

export class AlertDto {
  type: AlertType;
  subject: string;
  lines: string[];
}
