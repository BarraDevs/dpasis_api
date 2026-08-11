import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { CompanyNfsConfigNotFoundError } from 'src/app/company/company-nfs-config/domain/errors/company-nfs-config-not-found.error';
import { TOKENS } from 'src/core/di/token';
import type { ICompanyNfsConfigDao } from '../../persistence/dao/company-nfs-config-dao.interface';
import { FindCompanyNfsConfigByCompanyId } from './find-company-nfs-config-by-company-id.service';

describe('FindCompanyNfsConfigByCompanyId - Unit tests', () => {
  let sut: FindCompanyNfsConfigByCompanyId;
  let companyNfsConfigDao: ICompanyNfsConfigDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindCompanyNfsConfigByCompanyId,
        { provide: TOKENS.CompanyNfsConfigDao, useValue: createMock<ICompanyNfsConfigDao>() },
      ],
    }).compile();

    sut = module.get(FindCompanyNfsConfigByCompanyId);
    companyNfsConfigDao = module.get(TOKENS.CompanyNfsConfigDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw CompanyNfsConfigNotFoundError when config does not exist', async() => {
    // Arrange
    jest.spyOn(companyNfsConfigDao, 'findByCompanyId').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(1)).rejects.toThrow(CompanyNfsConfigNotFoundError);
  });

  it('should return config dto when found', async() => {
    // Arrange
    const config = createMock<CompanyNfsConfigDto>({ companyId: 1 });
    jest.spyOn(companyNfsConfigDao, 'findByCompanyId').mockResolvedValue(config);

    // Act
    const result = await sut.execute(1);

    // Assert
    expect(result).toEqual(config);
    expect(companyNfsConfigDao.findByCompanyId).toHaveBeenCalledWith(1);
  });
});
