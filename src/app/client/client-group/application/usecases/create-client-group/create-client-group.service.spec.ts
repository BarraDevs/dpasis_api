import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { ClientGroupAlreadyExistsError } from '../../../domain/errors/client-group-already-exists.error';
import { ClientGroupDto } from '../../dtos/client-group.dto';
import type { IClientGroupDao } from '../../persistence/dao/client-group-dao.interface';
import { CreateClientGroup } from './create-client-group.service';
import { CreateClientGroupInputDto, CreateClientGroupOutputDto } from './dtos/create-client-group.dto';

function makeValidCreateClientGroupInput(overrides: Partial<CreateClientGroupInputDto> = {}): CreateClientGroupInputDto {
  return {
    name: 'Grupo Premium',
    ...overrides,
  };
}

describe('CreateClientGroup - Unit tests', () => {
  let sut: CreateClientGroup;
  let clientGroupDao: IClientGroupDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        CreateClientGroup,
        {
          provide: TOKENS.ClientGroupDao,
          useValue: createMock<IClientGroupDao>(),
        },
      ],
    }).compile();

    sut = module.get(CreateClientGroup);
    clientGroupDao = module.get(TOKENS.ClientGroupDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call clientGroupDao.save with correct data', async() => {
    // Arrange
    const input = makeValidCreateClientGroupInput();
    const saveSpy = jest.spyOn(clientGroupDao, 'save').mockResolvedValue(1);
    const findByNameSpy = jest.spyOn(clientGroupDao, 'findByName').mockResolvedValue(null);

    // Act
    await sut.execute(input);

    // Assert
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith(input);
    expect(findByNameSpy).toHaveBeenCalledTimes(1);
    expect(findByNameSpy).toHaveBeenCalledWith(input.name.trim());
  });

  it('should return id from clientGroupDao.save', async() => {
    // Arrange
    const input = makeValidCreateClientGroupInput();
    const id = 1;
    jest.spyOn(clientGroupDao, 'save').mockResolvedValue(id);
    jest.spyOn(clientGroupDao, 'findByName').mockResolvedValue(null);

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result).toEqual<CreateClientGroupOutputDto>({ id });
  });

  it('should call clientGroupDao.findByName before save', async() => {
    // Arrange
    const input = makeValidCreateClientGroupInput();
    const findByNameSpy = jest.spyOn(clientGroupDao, 'findByName').mockResolvedValue(null);
    jest.spyOn(clientGroupDao, 'save').mockResolvedValue(1);

    // Act
    await sut.execute(input);

    // Assert
    expect(findByNameSpy).toHaveBeenCalledTimes(1);
    expect(findByNameSpy).toHaveBeenCalledWith(input.name.trim());
  });

  it('should throw ClientGroupAlreadyExistsError when name already exists', async() => {
    // Arrange
    const input = makeValidCreateClientGroupInput({ name: 'Grupo Premium' });
    const clientGroup = createMock<ClientGroupDto>();
    jest.spyOn(clientGroupDao, 'findByName').mockResolvedValue(clientGroup);
    const saveSpy = jest.spyOn(clientGroupDao, 'save').mockResolvedValue(1);

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow(ClientGroupAlreadyExistsError);
    expect(saveSpy).not.toHaveBeenCalled();
  });
});
