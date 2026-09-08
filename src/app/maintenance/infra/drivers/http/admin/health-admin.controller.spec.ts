import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { CheckCertificates } from '../../../../application/usecases/check-certificates/check-certificates.service';
import { CertificateHealthStatus } from '../../../../application/usecases/check-certificates/dtos/check-certificates.dto';
import { HealthAdminController } from './health-admin.controller';

describe('HealthAdminController - Unit tests', () => {
  let sut: HealthAdminController;
  let checkCertificates: CheckCertificates;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [HealthAdminController],
      providers: [{ provide: CheckCertificates, useValue: createMock<CheckCertificates>() }],
    }).compile();

    sut = module.get(HealthAdminController);
    checkCertificates = module.get(CheckCertificates);
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
});
