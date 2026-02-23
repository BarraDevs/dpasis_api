import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ClientGroupNotFoundError } from 'src/app/client-group/domain/errors/client-group-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { ClientGroupDto } from '../../dtos/client-group.dto';
import type { IClientGroupDao } from '../../persistence/dao/client-group-dao.interface';
import { FindClientGroupById } from './find-client-group-by-id.service';

describe('FindClientGroupById - Unit tests', () => {
  let sut: FindClientGroupById;
  let clientGroupDao: IClientGroupDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindClientGroupById,
        {
          provide: TOKENS.ClientGroupDao,
          useValue: createMock<IClientGroupDao>(),
        },
      ],
    }).compile();

    sut = module.get(FindClientGroupById);
    clientGroupDao = module.get(TOKENS.ClientGroupDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call clientGroupDao.findById with correct id', async() => {
    // Arrange
    const id = 1;
    const mockClientGroup = createMock<ClientGroupDto>();
    jest.spyOn(clientGroupDao, 'findById').mockResolvedValue(mockClientGroup);
    const findByIdSpy = jest.spyOn(clientGroupDao, 'findById');

    // Act
    await sut.execute(id);

    // Assert
    expect(findByIdSpy).toHaveBeenCalledWith(id);
    expect(findByIdSpy).toHaveBeenCalledTimes(1);
  });

  it('should throw ClientGroupNotFoundError when client group does not exist', async() => {
    // Arrange
    const id = 0;
    jest.spyOn(clientGroupDao, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(ClientGroupNotFoundError);
    await expect(sut.execute(id)).rejects.toThrow('Grupo de clientes não encontrado na base de dados.');
  });

  it('should return client group when found', async() => {
    // Arrange
    const id = 1;
    const mockClientGroup = createMock<ClientGroupDto>({
      id,
      name: 'Grupo Premium',
      active: true,
    });
    jest.spyOn(clientGroupDao, 'findById').mockResolvedValue(mockClientGroup);

    // Act
    const result = await sut.execute(id);

    // Assert
    expect(result).toEqual(mockClientGroup);
    expect(result.id).toBe(id);
    expect(result.name).toBe('Grupo Premium');
    expect(result.active).toBe(true);
  });
});
