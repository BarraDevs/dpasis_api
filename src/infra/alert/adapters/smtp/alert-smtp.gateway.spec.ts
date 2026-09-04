import { createMock } from '@golevelup/ts-jest';
import { createTransport } from 'nodemailer';
import { ConfigService } from 'src/core/config/config.service';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { AlertType } from '../../enums/alert-type.enum';
import { AlertSmtpAdapterGateway } from './alert-smtp.gateway';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

const mockedCreateTransport = createTransport as jest.MockedFunction<typeof createTransport>;

describe('AlertSmtpAdapterGateway - Unit tests', () => {
  let sut: AlertSmtpAdapterGateway;
  let configService: ConfigService;
  let logger: ILoggerGateway;
  let sendMail: jest.Mock;

  beforeEach(() => {
    sendMail = jest.fn().mockResolvedValue({ messageId: '1' });
    mockedCreateTransport.mockReset().mockReturnValue({ sendMail } as any);

    configService = createMock<ConfigService>({
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpFrom: 'from@example.com',
      smtpTo: 'to@example.com',
      smtpUsername: 'user',
      smtpPassword: 'pass',
    });
    logger = createMock<ILoggerGateway>();
    sut = new AlertSmtpAdapterGateway(configService, logger);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should send mail with from/to/subject/text and log debug on success', async() => {
    // Arrange
    const alert = {
      type: AlertType.NfseStuck,
      subject: '[NFS-e] 1 nota(s) sem desfecho',
      lines: ['nfseId=1', 'status=SUBMITTED'],
    };

    // Act
    await sut.send(alert);

    // Assert
    expect(mockedCreateTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: { user: 'user', pass: 'pass' },
    });
    expect(sendMail).toHaveBeenCalledWith({
      from: 'from@example.com',
      to: 'to@example.com',
      subject: alert.subject,
      text: 'nfseId=1\nstatus=SUBMITTED',
    });
    expect(logger.debug).toHaveBeenCalledWith(LogContext.SMTP, {
      adapter: 'smtp',
      action: 'sendAlert',
      body: { type: alert.type, subject: alert.subject, lineCount: 2 },
    });
  });

  it('should use secure true when smtp port is 465', async() => {
    // Arrange
    Object.defineProperty(configService, 'smtpPort', { get: () => 465 });

    // Act
    await sut.send({ type: AlertType.NfseStuck, subject: 's', lines: ['l'] });

    // Assert
    expect(mockedCreateTransport).toHaveBeenCalledWith(expect.objectContaining({
      port: 465,
      secure: true,
    }));
  });

  it('should reuse the transporter across sends', async() => {
    // Act
    await sut.send({ type: AlertType.NfseStuck, subject: 'a', lines: ['1'] });
    await sut.send({ type: AlertType.NfseStuck, subject: 'b', lines: ['2'] });

    // Assert
    expect(mockedCreateTransport).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledTimes(2);
  });

  it('should log error, return false and not rethrow when sendMail fails', async() => {
    // Arrange
    const error = new Error('SMTP down');
    sendMail.mockRejectedValue(error);

    // Act
    await expect(sut.send({
      type: AlertType.NfseDailyClosing,
      subject: 'fechamento',
      lines: ['Emitidas: 1'],
    })).resolves.toBe(false);

    // Assert
    expect(logger.error).toHaveBeenCalledWith(LogContext.SMTP, {
      adapter: 'smtp',
      action: 'sendAlert',
      body: { type: AlertType.NfseDailyClosing, subject: 'fechamento' },
      error,
    });
  });
});
