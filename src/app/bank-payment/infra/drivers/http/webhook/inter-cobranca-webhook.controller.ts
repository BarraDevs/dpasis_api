import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ReceiveInterCobrancaWebhookOutputDto } from '../../../../application/usecases/receive-inter-cobranca-webhook/dtos/receive-inter-cobranca-webhook.dto';
import { ReceiveInterCobrancaWebhook } from '../../../../application/usecases/receive-inter-cobranca-webhook/receive-inter-cobranca-webhook.service';
import { Swagger } from 'src/infra/openapi/swagger';

@SkipThrottle()
@Controller('webhooks/inter/cobranca')
export class InterCobrancaWebhookController {
  constructor(
    private readonly receiveInterCobrancaWebhook: ReceiveInterCobrancaWebhook,
  ) {}

  @Post(':token')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    tags: ['Webhooks - Banco Inter'],
    summary: 'Receber callback de cobrança Bolepix (pago, cancelado ou expirado)',
    applyNotFound: true,
    applyServiceUnavailable: true,
    okResponse: ReceiveInterCobrancaWebhookOutputDto,
  })
  public handle(
    @Param('token') token: string,
    @Body() body: unknown,
  ): Promise<ReceiveInterCobrancaWebhookOutputDto> {
    return this.receiveInterCobrancaWebhook.execute(token, body);
  }
}
