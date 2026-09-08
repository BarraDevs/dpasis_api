import { ApiProperty } from '@nestjs/swagger';

export enum AlertChannelStatus {
  Ok = 'OK',
  /** O servidor recusou a conexão, a autenticação ou o host não resolve. Nenhum alerta sai. */
  Unavailable = 'UNAVAILABLE',
}

export class CheckAlertChannelOutputDto {
  @ApiProperty({ enum: AlertChannelStatus })
  status: AlertChannelStatus;

  @ApiProperty({ example: 'smtp.exemplo.com.br', description: 'Host configurado, sem credenciais.' })
  host: string;

  @ApiProperty({ example: 587 })
  port: number;

  @ApiProperty({ example: 'alertas@dpasis.com.br', description: 'Destinatário dos alertas.' })
  to: string;

  @ApiProperty({
    example: 'Conexão e autenticação SMTP recusadas — nenhum alerta do fluxo será entregue.',
    nullable: true,
  })
  message: string | null;
}
