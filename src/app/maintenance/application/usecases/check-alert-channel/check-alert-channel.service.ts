import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import type { IAlertGateway } from 'src/infra/alert/alert.gateway';
import { AlertChannelStatus, CheckAlertChannelOutputDto } from './dtos/check-alert-channel.dto';

@Injectable()
export class CheckAlertChannel {
  constructor(
    @Inject(TOKENS.AlertGateway) private readonly alertGateway: IAlertGateway,
    private readonly configService: ConfigService,
  ) {}

  /**
   * O canal de alerta é a única coisa que faz a operação enxergar o fluxo assíncrono: nota presa,
   * nota emitida sem cobrança, cobrança recusada pelo banco, ressalva do fisco, certificado a
   * vencer, fila represada. Um SMTP mal configurado não quebra nada visivelmente — `send()` devolve
   * `false`, a janela de digest é devolvida e o incidente passa em silêncio.
   *
   * Esta rota fecha isso: pergunta ao servidor **antes**, sem mandar e-mail, e devolve o host e a
   * porta configurados para o operador conferir que são os que ele espera. Credenciais ficam de
   * fora — quem responde a pergunta é o `verify()`, não a leitura da senha.
   */
  public async execute(): Promise<CheckAlertChannelOutputDto> {
    const reachable = await this.alertGateway.verify();

    return {
      status: reachable ? AlertChannelStatus.Ok : AlertChannelStatus.Unavailable,
      host: this.configService.smtpHost,
      port: this.configService.smtpPort,
      to: this.configService.smtpTo,
      message: reachable
        ? null
        : 'Conexão ou autenticação SMTP recusada — nenhum alerta do fluxo de NFS-e será entregue. '
          + 'Conferir SMTP_HOST, SMTP_PORT, SMTP_USERNAME e SMTP_PASSWORD; o motivo exato está no log.',
    };
  }
}
