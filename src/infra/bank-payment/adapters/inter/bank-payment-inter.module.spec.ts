import { HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { LoggerModule } from 'src/infra/logger/logger.module';
import { BankPaymentInterModule } from './bank-payment-inter.module';

describe('BankPaymentInterModule - Unit tests', () => {
  it('should configure an HTTP timeout so a hung Inter connection cannot hold the worker', async() => {
    // Arrange & Act
    const module = await Test.createTestingModule({
      // LoggerModule é @Global() na aplicação; compilando o módulo isolado ele precisa ser explícito.
      imports: [LoggerModule, BankPaymentInterModule],
    }).compile();

    // Assert
    expect(module.get(HttpService).axiosRef.defaults.timeout).toBe(30_000);
  });
});
