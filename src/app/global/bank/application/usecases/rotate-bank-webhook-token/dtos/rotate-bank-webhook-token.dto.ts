import { ApiProperty } from '@nestjs/swagger';

export class RotateBankWebhookTokenOutputDto {
  @ApiProperty({ description: 'Novo token. Devolvido somente nesta resposta.' })
  webhookToken: string;
}
