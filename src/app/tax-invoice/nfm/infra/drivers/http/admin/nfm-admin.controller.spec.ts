import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { NfmDto, NfmWithNfseDto } from 'src/app/tax-invoice/nfm/application/dtos/nfm.dto';
import { FindElegibleClients } from 'src/app/tax-invoice/nfm/application/usecases/find-elegible-clients/find-elegible-clients.service';
import { FindGeneratedNfms } from 'src/app/tax-invoice/nfm/application/usecases/find-generated-nfms/find-generated-nfms.service';
import { FindGeneratedNfmsQueryDto } from 'src/app/tax-invoice/nfm/application/usecases/find-generated-nfms/dtos/find-generated-nfms.dto';
import { SaveElegibleNfmsOutputDto } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/dtos/save-elegible-nfms.dto';
import { SaveElegibleNfms } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/save-elegible-nfms.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { NfmAdminController } from './nfm-admin.controller';

describe('NfmAdminController - Unit tests', () => {
  let sut: NfmAdminController;
  let findElegibleClients: FindElegibleClients;
  let findGeneratedNfms: FindGeneratedNfms;
  let saveElegibleNfms: SaveElegibleNfms;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [NfmAdminController],
      providers: [
        { provide: FindElegibleClients, useValue: createMock<FindElegibleClients>() },
        { provide: FindGeneratedNfms, useValue: createMock<FindGeneratedNfms>() },
        { provide: SaveElegibleNfms, useValue: createMock<SaveElegibleNfms>() },
      ],
    }).compile();

    sut = module.get(NfmAdminController);
    findElegibleClients = module.get(FindElegibleClients);
    findGeneratedNfms = module.get(FindGeneratedNfms);
    saveElegibleNfms = module.get(SaveElegibleNfms);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findElegible', () => {
    it('should call findElegibleClients.execute', async() => {
      // Arrange
      const output = [createMock<NfmDto>()];
      const findSpy = jest.spyOn(findElegibleClients, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findElegible();

      // Assert
      expect(result).toEqual(output);
      expect(findSpy).toHaveBeenCalledWith();
    });
  });

  describe('findAll', () => {
    it('should call findGeneratedNfms.execute with queries', async() => {
      // Arrange
      const queries: FindGeneratedNfmsQueryDto = {
        dateStart: '2026-08-01',
        dateEnd: '2026-08-31',
        page: 1,
        size: 10,
      };
      const output = createMock<IPagination<NfmWithNfseDto>>();
      const findSpy = jest.spyOn(findGeneratedNfms, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result).toEqual(output);
      expect(findSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('saveElegibleNfms', () => {
    it('should call saveElegibleNfms.execute', async() => {
      // Arrange
      const output = createMock<SaveElegibleNfmsOutputDto>();
      const saveSpy = jest.spyOn(saveElegibleNfms, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.saveElegibleNfms();

      // Assert
      expect(result).toEqual(output);
      expect(saveSpy).toHaveBeenCalledWith();
    });
  });
});
