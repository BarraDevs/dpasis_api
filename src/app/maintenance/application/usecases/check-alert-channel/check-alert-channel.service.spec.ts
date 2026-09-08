import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import type { IAlertGateway } from 'src/infra/alert/alert.gateway';
import { CheckAlertChannel } from './check-alert-channel.service';
import { AlertChannelStatus } from './dtos/check-alert-channel.dto';

describe('CheckAlertChannel - Unit tests', () => {
  let sut: CheckAlertChannel;
  let alertGateway: IAlertGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        CheckAlertChannel,
        { provide: TOKENS.AlertGateway, useValue: createMock<IAlertGateway>() },
        {
          provide: ConfigService,
          useValue: createMock<ConfigService>({
            smtpHost: 'smtp.example.com',
            smtpPort: 587,
            smtpTo: 'alertas@example.com',
          }),
        },
      ],
    }).compile();

    sut = module.get(CheckAlertChannel);
    alertGateway = module.get(TOKENS.AlertGateway);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should report the channel as OK and echo the configured destination', async() => {
    // Arrange — host, porta e destinatário voltam para o operador conferir que são os que ele
    // espera; credencial nenhuma sai daqui.
    jest.spyOn(alertGateway, 'verify').mockResolvedValue(true);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual({
      status: AlertChannelStatus.Ok,
      host: 'smtp.example.com',
      port: 587,
      to: 'alertas@example.com',
      message: null,
    });
  });

  it('should report the channel as unavailable with a reason the operator can act on', async() => {
    // Arrange — SMTP mal configurado não quebra nada visivelmente: `send()` devolve false e o
    // incidente passa em silêncio. É esta rota que transforma isso em resposta.
    jest.spyOn(alertGateway, 'verify').mockResolvedValue(false);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.status).toBe(AlertChannelStatus.Unavailable);
    expect(result.message).toContain('nenhum alerta do fluxo de NFS-e será entregue');
  });

  it('should never send an alert to answer the question', async() => {
    // Arrange
    jest.spyOn(alertGateway, 'verify').mockResolvedValue(true);

    // Act
    await sut.execute();

    // Assert — chamar o healthcheck não pode encher a caixa de quem recebe os alertas.
    expect(alertGateway.send).not.toHaveBeenCalled();
  });
});
