import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { ClientOwnerAlreadyExistsError } from '../../../domain/errors/client-owner-already-exists.error';
import { ClientOwnerDto } from '../../dtos/client-owner.dto';
import type { IClientOwnerDao } from '../../persistence/dao/client-owner-dao.interface';
import { CreateClientOwner } from './create-client-owner.service';
import { CreateClientOwnerInputDto, CreateClientOwnerOutputDto } from './dtos/create-client-owner.dto';

function makeValidCreateClientOwnerInput(overrides: Partial<CreateClientOwnerInputDto> = {}): CreateClientOwnerInputDto {
  return {
    name: 'Proprietário Premium',
    ...overrides,
  };
}

describe('CreateClientOwner - Unit tests', () => {
  let sut: CreateClientOwner;
  let clientOwnerDao: IClientOwnerDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        CreateClientOwner,
        {
          provide: TOKENS.ClientOwnerDao,
          useValue: createMock<IClientOwnerDao>(),
        },
      ],
    }).compile();

    sut = module.get(CreateClientOwner);
    clientOwnerDao = module.get(TOKENS.ClientOwnerDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call clientOwnerDao.save with correct data', async() => {
    // Arrange
    const input = makeValidCreateClientOwnerInput();
    const saveSpy = jest.spyOn(clientOwnerDao, 'save').mockResolvedValue(1);
    const findByNameSpy = jest.spyOn(clientOwnerDao, 'findByName').mockResolvedValue(null);

    // Act
    await sut.execute(input);

    // Assert
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith(input);
    expect(findByNameSpy).toHaveBeenCalledTimes(1);
    expect(findByNameSpy).toHaveBeenCalledWith(input.name.trim());
  });

  it('should return id from clientOwnerDao.save', async() => {
    // Arrange
    const input = makeValidCreateClientOwnerInput();
    const id = 1;
    jest.spyOn(clientOwnerDao, 'save').mockResolvedValue(id);
    jest.spyOn(clientOwnerDao, 'findByName').mockResolvedValue(null);

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result).toEqual<CreateClientOwnerOutputDto>({ id });
  });

  it('should call clientOwnerDao.findByName before save', async() => {
    // Arrange
    const input = makeValidCreateClientOwnerInput();
    const findByNameSpy = jest.spyOn(clientOwnerDao, 'findByName').mockResolvedValue(null);
    jest.spyOn(clientOwnerDao, 'save').mockResolvedValue(1);

    // Act
    await sut.execute(input);

    // Assert
    expect(findByNameSpy).toHaveBeenCalledTimes(1);
    expect(findByNameSpy).toHaveBeenCalledWith(input.name.trim());
  });

  it('should throw ClientOwnerAlreadyExistsError when name already exists', async() => {
    // Arrange
    const input = makeValidCreateClientOwnerInput({ name: 'Proprietário Premium' });
    const clientOwner = createMock<ClientOwnerDto>();
    jest.spyOn(clientOwnerDao, 'findByName').mockResolvedValue(clientOwner);
    const saveSpy = jest.spyOn(clientOwnerDao, 'save').mockResolvedValue(1);

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow(ClientOwnerAlreadyExistsError);
    expect(saveSpy).not.toHaveBeenCalled();
  });
});
