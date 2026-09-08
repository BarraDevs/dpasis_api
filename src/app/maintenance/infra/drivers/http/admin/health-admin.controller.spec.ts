import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { CheckAlertChannel } from '../../../../application/usecases/check-alert-channel/check-alert-channel.service';
import { AlertChannelStatus } from '../../../../application/usecases/check-alert-channel/dtos/check-alert-channel.dto';
import { CheckCertificates } from '../../../../application/usecases/check-certificates/check-certificates.service';
import { CertificateHealthStatus } from '../../../../application/usecases/check-certificates/dtos/check-certificates.dto';
import { HealthAdminController } from './health-admin.controller';

describe('HealthAdminController - Unit tests', () => {
  let sut: HealthAdminController;
  let checkCertificates: CheckCertificates;
  let checkAlertChannel: CheckAlertChannel;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [HealthAdminController],
      providers: [
        { provide: CheckCertificates, useValue: createMock<CheckCertificates>() },
        { provide: CheckAlertChannel, useValue: createMock<CheckAlertChannel>() },
      ],
    }).compile();

    sut = module.get(HealthAdminController);
    checkCertificates = module.get(CheckCertificates);
    checkAlertChannel = module.get(CheckAlertChannel);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return the certificate health report', async() => {
    // Arrange
    const report = {
      status: CertificateHealthStatus.Ok,
      certificates: [{
        provider: 'GISS',
        owner: 'companyId=1',
        path: '/certs/a1.pfx',
        notAfter: '2027-06-30T00:00:00.000Z',
        daysToExpire: 299,
        status: CertificateHealthStatus.Ok,
        message: null,
      }],
    };
    jest.spyOn(checkCertificates, 'execute').mockResolvedValue(report);

    // Act
    const result = await sut.certificates();

    // Assert
    expect(result).toBe(report);
  });

  it('should return the alert channel report', async() => {
    // Arrange — o canal de alerta é a única coisa que faz a operação enxergar o fluxo assíncrono;
    // esta rota responde se ele entrega, sem mandar e-mail nenhum.
    const report = {
      status: AlertChannelStatus.Unavailable,
      host: 'smtp.exemplo.com.br',
      port: 587,
      to: 'alertas@dpasis.local',
      message: 'Conexão ou autenticação SMTP recusada.',
    };
    jest.spyOn(checkAlertChannel, 'execute').mockResolvedValue(report);

    // Act
    const result = await sut.smtp();

    // Assert
    expect(result).toBe(report);
  });
});
