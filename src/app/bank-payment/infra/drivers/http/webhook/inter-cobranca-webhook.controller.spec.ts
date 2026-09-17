import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ReceiveInterCobrancaWebhook } from '../../../../application/usecases/receive-inter-cobranca-webhook/receive-inter-cobranca-webhook.service';
import { InterCobrancaWebhookController } from './inter-cobranca-webhook.controller';

describe('InterCobrancaWebhookController - Unit tests', () => {
  let sut: InterCobrancaWebhookController;
  let receiveInterCobrancaWebhook: ReceiveInterCobrancaWebhook;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      controllers: [InterCobrancaWebhookController],
      providers: [
        { provide: ReceiveInterCobrancaWebhook, useValue: createMock<ReceiveInterCobrancaWebhook>() },
      ],
    }).compile();

    sut = module.get(InterCobrancaWebhookController);
    receiveInterCobrancaWebhook = module.get(ReceiveInterCobrancaWebhook);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should forward the path token and raw body', async() => {
    // Arrange
    const body = { codigoSolicitacao: 'req-1' };
    const spy = jest.spyOn(receiveInterCobrancaWebhook, 'execute').mockResolvedValue({ processed: 1 });

    // Act
    const result = await sut.handle('the-token', body);

    // Assert
    expect(spy).toHaveBeenCalledWith('the-token', body);
    expect(result).toEqual({ processed: 1 });
  });
});
