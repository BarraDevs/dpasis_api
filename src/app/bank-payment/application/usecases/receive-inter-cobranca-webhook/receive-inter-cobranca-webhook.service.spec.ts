import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { SettleNfseBankPayment } from 'src/app/tax-invoice/nfse/application/usecases/settle-nfse-bank-payment/settle-nfse-bank-payment.service';
import { ConfigService } from 'src/core/config/config.service';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { InterWebhookNotConfiguredError } from '../../../domain/errors/inter-webhook-not-configured.error';
import { InvalidInterWebhookTokenError } from '../../../domain/errors/invalid-inter-webhook-token.error';
import { ReceiveInterCobrancaWebhook } from './receive-inter-cobranca-webhook.service';

const TOKEN = 'dev-inter-webhook-token';

describe('ReceiveInterCobrancaWebhook - Unit tests', () => {
  let sut: ReceiveInterCobrancaWebhook;
  let settleNfseBankPayment: SettleNfseBankPayment;
  let config: ConfigService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        ReceiveInterCobrancaWebhook,
        { provide: ConfigService, useValue: createMock<ConfigService>({ interWebhookToken: TOKEN }) },
        { provide: SettleNfseBankPayment, useValue: createMock<SettleNfseBankPayment>() },
      ],
    }).compile();

    sut = module.get(ReceiveInterCobrancaWebhook);
    settleNfseBankPayment = module.get(SettleNfseBankPayment);
    config = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should reject an invalid token', async() => {
    await expect(sut.execute('wrong-token-length!!', { codigoSolicitacao: 'req-1' }))
      .rejects.toThrow(InvalidInterWebhookTokenError);
    expect(settleNfseBankPayment.execute).not.toHaveBeenCalled();
  });

  it('should reject an invalid token of the same length', async() => {
    // Arrange — mesmo tamanho para passar do early-return de Buffer.length e cair no timingSafeEqual.
    const sameLengthToken = 'xxx-inter-webhook-token';
    expect(sameLengthToken).toHaveLength(TOKEN.length);

    // Act & Assert
    await expect(sut.execute(sameLengthToken, { codigoSolicitacao: 'req-1' }))
      .rejects.toThrow(InvalidInterWebhookTokenError);
    expect(settleNfseBankPayment.execute).not.toHaveBeenCalled();
  });

  it('should reject when the webhook token is not configured', async() => {
    Object.defineProperty(config, 'interWebhookToken', { get: () => '' });

    await expect(sut.execute(TOKEN, { codigoSolicitacao: 'req-1' }))
      .rejects.toThrow(InterWebhookNotConfiguredError);
  });

  it('should settle each request code from an object body', async() => {
    // Act
    const result = await sut.execute(TOKEN, { codigoSolicitacao: 'req-1' });

    // Assert
    expect(settleNfseBankPayment.execute).toHaveBeenCalledWith({ requestCode: 'req-1' });
    expect(result).toEqual({ processed: 1 });
  });

  it('should settle each request code from an array body', async() => {
    // Act
    const result = await sut.execute(TOKEN, [
      { codigoSolicitacao: 'req-1' },
      { cobranca: { codigoSolicitacao: 'req-2' } },
    ]);

    // Assert
    expect(settleNfseBankPayment.execute).toHaveBeenCalledTimes(2);
    expect(settleNfseBankPayment.execute).toHaveBeenNthCalledWith(1, { requestCode: 'req-1' });
    expect(settleNfseBankPayment.execute).toHaveBeenNthCalledWith(2, { requestCode: 'req-2' });
    expect(result).toEqual({ processed: 2 });
  });

  it('should return processed 0 when the body has no request codes', async() => {
    const result = await sut.execute(TOKEN, { situacao: 'PAGO' });

    expect(result).toEqual({ processed: 0 });
    expect(settleNfseBankPayment.execute).not.toHaveBeenCalled();
  });

  it('should propagate ExternalApiError from the GET', async() => {
    jest.spyOn(settleNfseBankPayment, 'execute').mockRejectedValue(new ExternalApiError('Banco Inter indisponível.'));

    await expect(sut.execute(TOKEN, { codigoSolicitacao: 'req-1' })).rejects.toThrow(ExternalApiError);
  });
});
