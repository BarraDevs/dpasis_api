import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { ClientOwnerNotFoundError } from '../../../domain/errors/client-owner-not-found.error';
import { ClientOwnerDto } from '../../dtos/client-owner.dto';
import type { IClientOwnerDao } from '../../persistence/dao/client-owner-dao.interface';
import { FindClientOwnerById } from './find-client-owner-by-id.service';

describe('FindClientOwnerById - Unit tests', () => {
  let sut: FindClientOwnerById;
  let clientOwnerDao: IClientOwnerDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindClientOwnerById,
        {
          provide: TOKENS.ClientOwnerDao,
          useValue: createMock<IClientOwnerDao>(),
        },
      ],
    }).compile();

    sut = module.get(FindClientOwnerById);
    clientOwnerDao = module.get(TOKENS.ClientOwnerDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call clientOwnerDao.findById with correct id', async() => {
    // Arrange
    const id = 1;
    const mockClientOwner = createMock<ClientOwnerDto>();
    jest.spyOn(clientOwnerDao, 'findById').mockResolvedValue(mockClientOwner);
    const findByIdSpy = jest.spyOn(clientOwnerDao, 'findById');

    // Act
    await sut.execute(id);

    // Assert
    expect(findByIdSpy).toHaveBeenCalledWith(id);
    expect(findByIdSpy).toHaveBeenCalledTimes(1);
  });

  it('should throw ClientOwnerNotFoundError when client owner does not exist', async() => {
    // Arrange
    const id = 0;
    jest.spyOn(clientOwnerDao, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(ClientOwnerNotFoundError);
    await expect(sut.execute(id)).rejects.toThrow('Proprietário de clientes não encontrado na base de dados.');
  });

  it('should return client owner when found', async() => {
    // Arrange
    const id = 1;
    const mockClientOwner = createMock<ClientOwnerDto>({
      id,
      name: 'Proprietário Premium',
      active: true,
    });
    jest.spyOn(clientOwnerDao, 'findById').mockResolvedValue(mockClientOwner);

    // Act
    const result = await sut.execute(id);

    // Assert
    expect(result).toEqual(mockClientOwner);
    expect(result.id).toBe(id);
    expect(result.name).toBe('Proprietário Premium');
    expect(result.active).toBe(true);
  });
});
