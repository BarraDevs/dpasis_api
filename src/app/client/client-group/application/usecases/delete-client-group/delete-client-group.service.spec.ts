import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientGroupNotFoundError } from '../../../domain/errors/client-group-not-found.error';
import { ClientGroupDto } from '../../dtos/client-group.dto';
import type { IClientGroupDao } from '../../persistence/dao/client-group-dao.interface';
import { DeleteClientGroup } from './delete-client-group.service';

describe('DeleteClientGroup - Unit tests', () => {
  let sut: DeleteClientGroup;
  let clientGroupDao: IClientGroupDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        DeleteClientGroup,
        {
          provide: TOKENS.ClientGroupDao,
          useValue: createMock<IClientGroupDao>(),
        },
      ],
    }).compile();

    sut = module.get(DeleteClientGroup);
    clientGroupDao = module.get(TOKENS.ClientGroupDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ClientGroupNotFoundError when client group does not exist', async() => {
    // Arrange
    const id = 0;
    jest.spyOn(clientGroupDao, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(ClientGroupNotFoundError);
    await expect(sut.execute(id)).rejects.toThrow('Grupo de clientes não encontrado na base de dados.');
  });

  it('should call clientGroupDao.findById to validate existence', async() => {
    // Arrange
    const id = 1;
    jest.spyOn(clientGroupDao, 'findById').mockResolvedValue(createMock<ClientGroupDto>());
    const findByIdSpy = jest.spyOn(clientGroupDao, 'findById');

    // Act
    await sut.execute(id);

    // Assert
    expect(findByIdSpy).toHaveBeenCalledWith(id);
    expect(findByIdSpy).toHaveBeenCalledTimes(1);
  });

  it('should call clientGroupDao.delete with correct id', async() => {
    // Arrange
    const id = 1;
    jest.spyOn(clientGroupDao, 'findById').mockResolvedValue(createMock<ClientGroupDto>());
    const deleteSpy = jest.spyOn(clientGroupDao, 'delete');

    // Act
    await sut.execute(id);

    // Assert
    expect(deleteSpy).toHaveBeenCalledWith(id);
    expect(deleteSpy).toHaveBeenCalledTimes(1);
  });

  it('should return success message', async() => {
    // Arrange
    const id = 1;
    jest.spyOn(clientGroupDao, 'findById').mockResolvedValue(createMock<ClientGroupDto>());

    // Act
    const result = await sut.execute(id);

    // Assert
    expect(result).toEqual<SuccessMessage>({
      message: 'Grupo de clientes excluído com sucesso',
    });
  });

  it('should not call delete when client group does not exist', async() => {
    // Arrange
    const id = 0;
    jest.spyOn(clientGroupDao, 'findById').mockResolvedValue(null);
    const deleteSpy = jest.spyOn(clientGroupDao, 'delete');

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(ClientGroupNotFoundError);
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});
