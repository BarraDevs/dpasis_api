import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ClientGroupNotFoundError } from 'src/app/client-group/domain/errors/client-group-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientGroupDto } from '../../dtos/client-group.dto';
import type { IClientGroupDao } from '../../persistence/dao/client-group-dao.interface';
import { UpdateClientGroupStatus } from './update-client-group-status.service';

describe('UpdateClientGroupStatus - Unit tests', () => {
  let sut: UpdateClientGroupStatus;
  let clientGroupDao: IClientGroupDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        UpdateClientGroupStatus,
        {
          provide: TOKENS.ClientGroupDao,
          useValue: createMock<IClientGroupDao>(),
        },
      ],
    }).compile();

    sut = module.get(UpdateClientGroupStatus);
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
  });

  it('should call clientGroupDao.findById to get current status', async() => {
    // Arrange
    const id = 1;
    const clientGroup = createMock<ClientGroupDto>({ id, active: true });
    jest.spyOn(clientGroupDao, 'findById').mockResolvedValue(clientGroup);
    const findByIdSpy = jest.spyOn(clientGroupDao, 'findById');

    // Act
    await sut.execute(id);

    // Assert
    expect(findByIdSpy).toHaveBeenCalledWith(id);
    expect(findByIdSpy).toHaveBeenCalledTimes(1);
  });

  it('should call clientGroupDao.edit with inverted active when current is true', async() => {
    // Arrange
    const id = 1;
    const clientGroup = createMock<ClientGroupDto>({ id, active: true });
    jest.spyOn(clientGroupDao, 'findById').mockResolvedValue(clientGroup);
    const updateStatusSpy = jest.spyOn(clientGroupDao, 'updateStatus');

    // Act
    await sut.execute(id);

    // Assert
    expect(updateStatusSpy).toHaveBeenCalledWith(id, false);
    expect(updateStatusSpy).toHaveBeenCalledTimes(1);
  });

  it('should call clientGroupDao.edit with inverted active when current is false', async() => {
    // Arrange
    const id = 1;
    const clientGroup = createMock<ClientGroupDto>({ id, active: false });
    jest.spyOn(clientGroupDao, 'findById').mockResolvedValue(clientGroup);
    const updateStatusSpy = jest.spyOn(clientGroupDao, 'updateStatus');

    // Act
    await sut.execute(id);

    // Assert
    expect(updateStatusSpy).toHaveBeenCalledWith(id, true);
    expect(updateStatusSpy).toHaveBeenCalledTimes(1);
  });

  it('should return success message', async() => {
    // Arrange
    const id = 1;
    jest.spyOn(clientGroupDao, 'findById').mockResolvedValue(createMock<ClientGroupDto>({ active: true }));

    // Act
    const result = await sut.execute(id);

    // Assert
    expect(result).toEqual<SuccessMessage>({
      message: 'Status do grupo de clientes atualizado com sucesso',
    });
  });

  it('should not call updateStatus when client group does not exist', async() => {
    // Arrange
    const id = 0;
    jest.spyOn(clientGroupDao, 'findById').mockResolvedValue(null);
    const updateStatusSpy = jest.spyOn(clientGroupDao, 'updateStatus');

    // Act & Assert
    await expect(sut.execute(id)).rejects.toThrow(ClientGroupNotFoundError);
    expect(updateStatusSpy).not.toHaveBeenCalled();
  });
});
