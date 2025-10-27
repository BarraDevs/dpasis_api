"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const account_module_1 = require("../../../account.module");
const account_role_enum_1 = require("../../../domain/enums/account-role.enum");
const account_status_enum_1 = require("../../../domain/enums/account-status.enum");
const config_module_1 = require("../../../../../core/config/config.module");
const prisma_service_1 = require("../../../../../infra/database/prisma/prisma.service");
const find_account_by_credential_service_1 = require("./find-account-by-credential.service");
describe('FindAccountByCredential', () => {
    let sut;
    let prisma;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [
                account_module_1.AccountModule,
                config_module_1.ConfigModule,
            ],
        }).compile();
        sut = module.get(find_account_by_credential_service_1.FindAccountByCredential);
        prisma = module.get(prisma_service_1.PrismaService);
        await prisma.account.deleteMany();
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    it('should be defined', () => {
        expect(sut).toBeDefined();
    });
    it('should return null if account is not found', async () => {
        const credential = 'non-existing-credential';
        const result = await sut.execute(credential);
        expect(result).toBeNull();
    });
    it('should return account if found by credential', async () => {
        const createdAccount = await prisma.account.create({
            data: {
                email: 'jhondoe@email.com',
                password: 'securepassword',
                status: account_status_enum_1.AccountStatus.ACTIVE,
                roles: {
                    create: {
                        role: account_role_enum_1.AccountRole.ADMIN,
                    },
                },
            },
        });
        const result = await sut.execute(createdAccount.email);
        expect(result).toEqual({
            id: createdAccount.id,
            email: createdAccount.email,
            password: createdAccount.password,
            passwordResetToken: null,
            roles: [account_role_enum_1.AccountRole.ADMIN],
            status: account_status_enum_1.AccountStatus.ACTIVE,
        });
    });
});
//# sourceMappingURL=find-account-by-credential.service.spec.js.map