import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { CompanyNfsConfigNotFoundError } from 'src/app/company/company-nfs-config/domain/errors/company-nfs-config-not-found.error';
import { TOKENS } from 'src/core/di/token';
import type { ICompanyNfsConfigDao } from '../../persistence/dao/company-nfs-config-dao.interface';
import { EditCompanyNfsConfig } from './edit-company-nfs-config.service';

describe('EditCompanyNfsConfig - Unit tests', () => {
  let sut: EditCompanyNfsConfig;
  let companyNfsConfigDao: ICompanyNfsConfigDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        EditCompanyNfsConfig,
        { provide: TOKENS.CompanyNfsConfigDao, useValue: createMock<ICompanyNfsConfigDao>() },
      ],
    }).compile();

    sut = module.get(EditCompanyNfsConfig);
    companyNfsConfigDao = module.get(TOKENS.CompanyNfsConfigDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw CompanyNfsConfigNotFoundError when config does not exist', async() => {
    // Arrange
    jest.spyOn(companyNfsConfigDao, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(1, { serieRps: 'NFSE2' })).rejects.toThrow(CompanyNfsConfigNotFoundError);
    expect(companyNfsConfigDao.edit).not.toHaveBeenCalled();
  });

  it('should edit and return success message', async() => {
    // Arrange
    jest.spyOn(companyNfsConfigDao, 'findById').mockResolvedValue(createMock<CompanyNfsConfigDto>({ id: 1 }));
    const editSpy = jest.spyOn(companyNfsConfigDao, 'edit').mockResolvedValue();

    // Act
    const result = await sut.execute(1, { serieRps: 'NFSE2' });

    // Assert
    expect(editSpy).toHaveBeenCalledWith(1, { serieRps: 'NFSE2' });
    expect(result.message).toBe('Configuração de NFS-e atualizada com sucesso');
  });
});
