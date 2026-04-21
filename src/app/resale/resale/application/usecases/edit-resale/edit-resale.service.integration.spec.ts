import { Test } from '@nestjs/testing';
import { ResaleModule } from 'src/app/resale/resale/resale.module';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ResaleNotFoundError } from '../../../domain/errors/resale-not-found.error';
import { makeCreateResaleInput, resetResaleIntegrationState } from '../resale-integration-test.helper';
import { CreateResale } from '../create-resale/create-resale.service';
import { EditResale } from './edit-resale.service';
import { EditResaleInputDto } from './dtos/edit-resale.dto';

describe('EditResale - Integration tests', () => {
  let sut: EditResale;
  let createResale: CreateResale;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ResaleModule],
    }).compile();

    sut = module.get(EditResale);
    createResale = module.get(CreateResale);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await resetResaleIntegrationState(prisma, 1);
  });

  afterAll(async() => {
    await resetResaleIntegrationState(prisma, 1);
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should update only provided fields and return success message', async() => {
    const { id } = await createResale.execute(makeCreateResaleInput());

    const patch: EditResaleInputDto = { name: 'Revenda Renomeada' };
    const result = await sut.execute(id, patch);

    expect(result.message).toBe('Edição realizada com sucesso');

    const row = await prisma.resale.findUniqueOrThrow({ where: { id } });
    expect(row.name).toBe('Revenda Renomeada');
    expect(row.document).toBe('09748165000110');
  });

  it('should update document when not taken by another resale', async() => {
    const { id } = await createResale.execute(makeCreateResaleInput());

    await sut.execute(id, { document: '28.695.096/0001-79' });

    const row = await prisma.resale.findUniqueOrThrow({ where: { id } });
    expect(row.document).toBe('28695096000179');
  });

  it('should allow keeping the same document value', async() => {
    const { id } = await createResale.execute(makeCreateResaleInput());

    await expect(
      sut.execute(id, { document: '09.748.165/0001-10' }),
    ).resolves.toMatchObject({ message: 'Edição realizada com sucesso' });
  });

  it('should set identifier to null when explicitly passed as null', async() => {
    const { id } = await createResale.execute(
      makeCreateResaleInput({ identifier: 'EXT-1' }),
    );

    await sut.execute(id, { identifier: null });

    const row = await prisma.resale.findUniqueOrThrow({ where: { id } });
    expect(row.identifier).toBeNull();
  });

  it('should throw ResaleNotFoundError when id does not exist', async() => {
    await expect(sut.execute(99_999, { name: 'X' })).rejects.toThrow(ResaleNotFoundError);
    await expect(sut.execute(99_999, { name: 'X' })).rejects.toThrow('Revenda não encontrada na base de dados.');
  });

  it('should throw DocumentAlreadyTakenError when document belongs to another resale', async() => {
    const { id: idA } = await createResale.execute(
      makeCreateResaleInput({ name: 'A', document: '09.748.165/0001-10' }),
    );
    const { id: idB } = await createResale.execute(
      makeCreateResaleInput({
        name: 'B',
        document: '28.695.096/0001-79',
      }),
    );

    await expect(
      sut.execute(idB, { document: '09.748.165/0001-10' }),
    ).rejects.toThrow(DocumentAlreadyTakenError);

    const unchanged = await prisma.resale.findUniqueOrThrow({ where: { id: idB } });
    expect(unchanged.document).toBe('28695096000179');

    const a = await prisma.resale.findUniqueOrThrow({ where: { id: idA } });
    expect(a.document).toBe('09748165000110');
  });

  it('should not validate document collision when document field is omitted', async() => {
    const { id: idA } = await createResale.execute(
      makeCreateResaleInput({ name: 'A', document: '09.748.165/0001-10' }),
    );
    const { id: idB } = await createResale.execute(
      makeCreateResaleInput({
        name: 'B',
        document: '28.695.096/0001-79',
      }),
    );

    await expect(sut.execute(idB, { name: 'B atualizado' })).resolves.toBeDefined();
    expect(idA).not.toBe(idB);
  });
});
