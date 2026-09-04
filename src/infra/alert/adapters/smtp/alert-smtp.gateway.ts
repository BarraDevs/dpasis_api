import { Inject, Injectable } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { IAlertGateway } from '../../alert.gateway';
import { AlertDto } from '../../dtos/alert.dto';

@Injectable()
export class AlertSmtpAdapterGateway implements IAlertGateway {
  private transporter: Transporter | null = null;

  constructor(
    private readonly configService: ConfigService,
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
  ) {}

  public async send(alert: AlertDto): Promise<boolean> {
    const body = alert.lines.join('\n');

    try {
      await this.getTransporter().sendMail({
        from: this.configService.smtpFrom,
        to: this.configService.smtpTo,
        subject: alert.subject,
        text: body,
      });

      this.logger.debug(LogContext.SMTP, {
        adapter: 'smtp',
        action: 'sendAlert',
        body: { type: alert.type, subject: alert.subject, lineCount: alert.lines.length },
      });

      return true;
    }
    catch (error) {
      // Deliberadamente sem rethrow: quem chama é uma varredura periódica, e um SMTP fora do ar não
      // pode transformar um alerta perdido numa exceção que derruba a varredura inteira. Mas o
      // chamador precisa saber que não saiu — senão a janela de digest é queimada por um envio que
      // nunca aconteceu, e o silêncio dura a janela inteira.
      this.logger.error(LogContext.SMTP, {
        adapter: 'smtp',
        action: 'sendAlert',
        body: { type: alert.type, subject: alert.subject },
        error,
      });

      return false;
    }
  }

  /** Criado sob demanda e reusado: o transporter mantém o pool de conexões SMTP. */
  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = createTransport({
        host: this.configService.smtpHost,
        port: Number(this.configService.smtpPort),
        secure: Number(this.configService.smtpPort) === 465,
        auth: {
          user: this.configService.smtpUsername,
          pass: this.configService.smtpPassword,
        },
      });
    }

    return this.transporter;
  }
}
