import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AuthenticationGuardsModule } from 'src/app/authentication/application/guards/guards.module';
import { Params } from 'src/infra/validators/class/dtos/params';
import { NfseDto } from '../../../../application/dtos/nfse.dto';
import { FindNfseById } from '../../../../application/usecases/find-nfse-by-id/find-nfse-by-id.service';
import { IssueNfseInputDto, IssueNfseOutputDto } from '../../../../application/usecases/issue-nfse/dtos/issue-nfse.dto';
import { IssueNfse } from '../../../../application/usecases/issue-nfse/issue-nfse.service';
import { NfseAdminController } from './nfse-admin.controller';

describe('NfseAdminController - Unit tests', () => {
  let sut: NfseAdminController;
  let issueNfse: IssueNfse;
  let findNfseById: FindNfseById;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [AuthenticationGuardsModule],
      controllers: [NfseAdminController],
      providers: [
        { provide: IssueNfse, useValue: createMock<IssueNfse>() },
        { provide: FindNfseById, useValue: createMock<FindNfseById>() },
      ],
    }).compile();

    sut = module.get(NfseAdminController);
    issueNfse = module.get(IssueNfse);
    findNfseById = module.get(FindNfseById);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('issue', () => {
    it('should call issueNfse.execute with body', async() => {
      // Arrange
      const body = createMock<IssueNfseInputDto>();
      const output = createMock<IssueNfseOutputDto>();
      const issueSpy = jest.spyOn(issueNfse, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.issue(body);

      // Assert
      expect(result).toEqual(output);
      expect(issueSpy).toHaveBeenCalledWith(body);
    });
  });

  describe('findOne', () => {
    it('should call findNfseById.execute with params.id', async() => {
      // Arrange
      const params = createMock<Params>({ id: 42 });
      const output = createMock<NfseDto>();
      const findOneSpy = jest.spyOn(findNfseById, 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(result).toEqual(output);
      expect(findOneSpy).toHaveBeenCalledWith(params.id);
    });
  });
});
