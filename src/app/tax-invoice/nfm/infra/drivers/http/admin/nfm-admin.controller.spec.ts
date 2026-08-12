import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { NfmDto } from 'src/app/tax-invoice/nfm/application/dtos/nfm.dto';
import { FindAllNfms } from 'src/app/tax-invoice/nfm/application/usecases/find-all-nfms/find-all-nfms.service';
import { FindAllNfmsQueryDto } from 'src/app/tax-invoice/nfm/application/usecases/find-all-nfms/dtos/find-all-nfms.dto';
import { FindElegibleClients } from 'src/app/tax-invoice/nfm/application/usecases/find-elegible-clients/find-elegible-clients.service';
import { SaveElegibleNfmsOutputDto } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/dtos/save-elegible-nfms.dto';
import { SaveElegibleNfms } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/save-elegible-nfms.service';
import { NfsNoteDto } from 'src/infra/nfs-generation/dtos/find-nfs-servico-prestado.dto';
import { NfmAdminController } from './nfm-admin.controller';

describe('NfmAdminController - Unit tests', () => {
  let sut: NfmAdminController;
  let findAllNfms: FindAllNfms;
  let findElegibleClients: FindElegibleClients;
  let saveElegibleNfms: SaveElegibleNfms;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [NfmAdminController],
      providers: [
        { provide: FindAllNfms, useValue: createMock<FindAllNfms>() },
        { provide: FindElegibleClients, useValue: createMock<FindElegibleClients>() },
        { provide: SaveElegibleNfms, useValue: createMock<SaveElegibleNfms>() },
      ],
    }).compile();

    sut = module.get(NfmAdminController);
    findAllNfms = module.get(FindAllNfms);
    findElegibleClients = module.get(FindElegibleClients);
    saveElegibleNfms = module.get(SaveElegibleNfms);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findAllInvoices', () => {
    it('should call findAllNfms.execute with queries', async() => {
      // Arrange
      const queries = createMock<FindAllNfmsQueryDto>({
        companyId: 1,
        dateFrom: '2026-08-01',
        dateTo: '2026-08-31',
      });
      const output = [createMock<NfsNoteDto>()];
      const findAllSpy = jest.spyOn(findAllNfms, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAllInvoices(queries);

      // Assert
      expect(result).toEqual(output);
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });
  });

  describe('findNfms', () => {
    it('should call findElegibleClients.execute', async() => {
      // Arrange
      const output = [createMock<NfmDto>()];
      const findSpy = jest.spyOn(findElegibleClients, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findNfms();

      // Assert
      expect(result).toEqual(output);
      expect(findSpy).toHaveBeenCalledWith();
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
