import { Test } from '@nestjs/testing';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { EmailAlreadyTakenError } from 'src/shared/errors/email-already-taken';
import { AdminModule } from '../../../admin.module';
import { CreateAdmin } from './create-admin.service';
import { CreateAdminInputDto } from './dtos/create-admin.dto';

describe('CreateAdmin - Integration tests', () => {
  let sut: CreateAdmin;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [AdminModule],
    }).compile();

    sut = module.get(CreateAdmin);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  function makeValidInput(overrides: Partial<CreateAdminInputDto> = {}): CreateAdminInputDto {
    return {
      name: 'Admin Test',
      email: 'admin@test.com',
      password: 'SenhaForte123',
      document: '529.982.247-25',
      profilePicture: null,
      claims: [
        { subject: Claim.BANK_READ.subject, action: Claim.BANK_READ.action },
      ],
      ...overrides,
    };
  }

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should create admin with account, admin row and claims', async() => {
    const input = makeValidInput();

    const result = await sut.execute(input);

    expect(result.id).toBeGreaterThan(0);

    const admin = await prisma.admin.findUnique({
      where: { accountId: result.id },
      include: { account: { include: { claims: true } } },
    });

    expect(admin).not.toBeNull();
    expect(admin?.document).toBe('52998224725');
    expect(admin?.account.email).toBe('admin@test.com');
    expect(admin?.account.claims).toHaveLength(1);
    expect(admin?.account.claims[0].subject).toBe(Claim.BANK_READ.subject);
    expect(admin?.account.claims[0].action).toBe(Claim.BANK_READ.action);
  });

  it('should throw EmailAlreadyTakenError when email exists', async() => {
    await sut.execute(makeValidInput({ email: 'dup@test.com', document: '529.982.247-25' }));

    await expect(
      sut.execute(
        makeValidInput({
          email: 'dup@test.com',
          document: '390.533.447-05',
        }),
      ),
    ).rejects.toThrow(EmailAlreadyTakenError);
  });

  it('should throw DocumentAlreadyTakenError when document exists', async() => {
    await sut.execute(makeValidInput({ email: 'a@test.com', document: '529.982.247-25' }));

    await expect(
      sut.execute(
        makeValidInput({
          email: 'b@test.com',
          document: '529.982.247-25',
        }),
      ),
    ).rejects.toThrow(DocumentAlreadyTakenError);
  });
});
