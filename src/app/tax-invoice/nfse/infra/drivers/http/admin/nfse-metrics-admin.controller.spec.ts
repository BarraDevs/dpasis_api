import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { GetNfseMetricsOutputDto } from '../../../../application/usecases/get-nfse-metrics/dtos/get-nfse-metrics.dto';
import { GetNfseMetrics } from '../../../../application/usecases/get-nfse-metrics/get-nfse-metrics.service';
import { NfseMetricsAdminController } from './nfse-metrics-admin.controller';

describe('NfseMetricsAdminController - Unit tests', () => {
  let sut: NfseMetricsAdminController;
  let getNfseMetrics: GetNfseMetrics;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [NfseMetricsAdminController],
      providers: [{ provide: GetNfseMetrics, useValue: createMock<GetNfseMetrics>() }],
    }).compile();

    sut = module.get(NfseMetricsAdminController);
    getNfseMetrics = module.get(GetNfseMetrics);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return the metrics report', async() => {
    // Arrange
    const metrics = createMock<GetNfseMetricsOutputDto>({ stuck: 2 });
    jest.spyOn(getNfseMetrics, 'execute').mockResolvedValue(metrics);

    // Act
    const result = await sut.nfse();

    // Assert
    expect(result).toBe(metrics);
  });
});
