import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { NfmDto } from 'src/app/tax-invoice/nfm/application/dtos/nfm.dto';
import { FindElegibleClients } from 'src/app/tax-invoice/nfm/application/usecases/find-elegible-clients/find-elegible-clients.service';
import { SaveElegibleNfmsOutputDto } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/dtos/save-elegible-nfms.dto';
import { SaveElegibleNfms } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/save-elegible-nfms.service';
import { NfmAdminController } from './nfm-admin.controller';

describe('NfmAdminController - Unit tests', () => {
  let sut: NfmAdminController;
  let findElegibleClients: FindElegibleClients;
  let saveElegibleNfms: SaveElegibleNfms;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [NfmAdminController],
      providers: [
        { provide: FindElegibleClients, useValue: createMock<FindElegibleClients>() },
        { provide: SaveElegibleNfms, useValue: createMock<SaveElegibleNfms>() },
      ],
    }).compile();

    sut = module.get(NfmAdminController);
    findElegibleClients = module.get(FindElegibleClients);
    saveElegibleNfms = module.get(SaveElegibleNfms);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
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
