import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ClientDto } from 'src/app/client/application/dtos/client.dto';
import { CreateClientInputDto, CreateClientOutputDto } from 'src/app/client/application/usecases/create-client/dtos/create-client.dto';
import { ClientModule } from 'src/app/client/client.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class-*/dtos/params/params.dto';
import { Queries } from 'src/infra/validators/class-*/dtos/queries/queries.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientController } from './client.controller';

describe('ClientController', () => {
  let sut: ClientController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ClientModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(ClientController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createClientService with correct parameters', async() => {
      const input = createMock<CreateClientInputDto>();
      const output = createMock<CreateClientOutputDto>();
      const createClientSpy = jest.spyOn(sut['createClientService'], 'execute').mockResolvedValue(output);

      const result = await sut.create(input);

      expect(createClientSpy).toHaveBeenCalledWith(input);
      expect(result).toEqual(output);
    });
  });

  describe('findAll', () => {
    it('should call findAllClientService with correct parameters', async() => {
      const queries = createMock<Queries>();
      const output = createMock<IPagination<ClientDto>>();
      const findAllClientSpy = jest.spyOn(sut['findAllClientService'], 'execute').mockResolvedValue(output);

      const result = await sut.findAll(queries);

      expect(findAllClientSpy).toHaveBeenCalledWith(queries);
      expect(result).toEqual(output);
    });
  });

  describe('findById', () => {
    it('should call findClientByIdService with correct parameters', async() => {
      const params = createMock<Params>();
      const output = createMock<ClientDto>();
      const findClientByIdSpy = jest.spyOn(sut['findClientByIdService'], 'execute').mockResolvedValue(output);

      const result = await sut.findOne(params);

      expect(findClientByIdSpy).toHaveBeenCalledWith(params.id);
      expect(result).toEqual(output);
    });
  });

  describe('update', () => {
    it('should call editClientService with correct parameters', async() => {
      const params = createMock<Params>();
      const body = createMock<CreateClientInputDto>();
      const output = createMock<SuccessMessage>();
      const editClientSpy = jest.spyOn(sut['editClientService'], 'execute').mockResolvedValue(output);

      const result = await sut.update(params, body);

      expect(editClientSpy).toHaveBeenCalledWith(params.id, body);
      expect(result).toEqual(output);
    });
  });
});
