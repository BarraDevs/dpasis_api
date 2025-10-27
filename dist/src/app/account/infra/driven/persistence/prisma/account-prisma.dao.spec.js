"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const account_persistence_module_1 = require("../../../../application/persistence/account-persistence.module");
const account_role_enum_1 = require("../../../../domain/enums/account-role.enum");
const account_status_enum_1 = require("../../../../domain/enums/account-status.enum");
const config_module_1 = require("../../../../../../core/config/config.module");
const prisma_service_1 = require("../../../../../../infra/database/prisma/prisma.service");
const account_prisma_dao_1 = require("./account-prisma.dao");
describe('AccountPrismaDao', () => {
    let sut;
    let prisma;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [
                account_persistence_module_1.AccountPersistenceModule,
                config_module_1.ConfigModule,
            ],
            providers: [account_prisma_dao_1.AccountPrismaAdapterDao],
        }).compile();
        sut = module.get(account_prisma_dao_1.AccountPrismaAdapterDao);
        prisma = module.get(prisma_service_1.PrismaService);
        await prisma.account.deleteMany();
    });
    afterAll(async () => {
        await prisma.account.deleteMany();
        await prisma.$disconnect();
    });
    it('should be defined', () => {
        expect(sut).toBeDefined();
    });
    describe('findByCredential', () => {
        it('should return null if account not found', async () => {
            const result = await sut.findByCredential('email@email.com');
            expect(result).toBeNull();
        });
        it('should return account if found', async () => {
            const account = await prisma.account.create({
                data: {
                    email: 'account@email.com',
                    password: 'hashed_password',
                    status: account_status_enum_1.AccountStatus.ACTIVE,
                    roles: {
                        create: [
                            { role: account_role_enum_1.AccountRole.USER },
                            { role: account_role_enum_1.AccountRole.ADMIN },
                        ],
                    },
                },
            });
            const result = await sut.findByCredential(account.email);
            expect(result).toBeDefined();
            expect(result).toEqual({
                id: account.id,
                email: account.email,
                password: account.password,
                passwordResetToken: null,
                roles: expect.arrayContaining([account_role_enum_1.AccountRole.USER, account_role_enum_1.AccountRole.ADMIN]),
                status: account_status_enum_1.AccountStatus.ACTIVE,
            });
        });
    });
    describe('findByEmail', () => {
        it('should return null if account not found', async () => {
            const result = await sut.findByEmail('email@email.com');
            expect(result).toBeNull();
        });
        it('should return account if found', async () => {
            const account = await prisma.account.create({
                data: {
                    email: 'account@email.com',
                    password: 'hashed_password',
                    status: account_status_enum_1.AccountStatus.ACTIVE,
                    roles: {
                        create: [
                            { role: account_role_enum_1.AccountRole.USER },
                            { role: account_role_enum_1.AccountRole.ADMIN },
                        ],
                    },
                },
            });
            const result = await sut.findByEmail(account.email);
            expect(result).toBeDefined();
            expect(result).toEqual({
                id: account.id,
                email: account.email,
                password: account.password,
                passwordResetToken: null,
                roles: expect.arrayContaining([account_role_enum_1.AccountRole.USER, account_role_enum_1.AccountRole.ADMIN]),
                status: account_status_enum_1.AccountStatus.ACTIVE,
            });
        });
    });
    describe('findById', () => {
        it('should return null if account not found', async () => {
            const result = await sut.findById('non-existing-id');
            expect(result).toBeNull();
        });
        it('should return account if found', async () => {
            const account = await prisma.account.create({
                data: {
                    email: 'account@email.com',
                    password: 'hashed_password',
                    status: account_status_enum_1.AccountStatus.ACTIVE,
                    roles: {
                        create: [
                            { role: account_role_enum_1.AccountRole.USER },
                        ],
                    },
                },
            });
            const result = await sut.findById(account.id);
            expect(result).toBeDefined();
            expect(result).toEqual({
                id: account.id,
                email: account.email,
                roles: [account_role_enum_1.AccountRole.USER],
                status: account_status_enum_1.AccountStatus.ACTIVE,
            });
        });
    });
    describe('forgotPassword', () => {
        it('should update passwordResetToken', async () => {
            const account = await prisma.account.create({
                data: {
                    email: 'account@email.com',
                    password: 'hashed_password',
                    status: account_status_enum_1.AccountStatus.ACTIVE,
                },
            });
            const passwordResetToken = 'reset-token';
            await sut.forgotPassword(account.id, passwordResetToken);
            const updatedAccount = await prisma.account.findUnique({
                where: { id: account.id },
            });
            expect(updatedAccount?.passwordResetToken).toBe(passwordResetToken);
        });
    });
    describe('resetPassword', () => {
        it('should update password and clear passwordResetToken', async () => {
            const account = await prisma.account.create({
                data: {
                    email: 'account@email.com',
                    password: 'old_hashed_password',
                    passwordResetToken: 'reset-token',
                    status: account_status_enum_1.AccountStatus.ACTIVE,
                },
            });
            const newPassword = 'new_hashed_password';
            await sut.resetPassword(account.id, newPassword);
            const updatedAccount = await prisma.account.findUnique({
                where: { id: account.id },
            });
            expect(updatedAccount?.password).toBe(newPassword);
            expect(updatedAccount?.passwordResetToken).toBeNull();
        });
    });
});
//# sourceMappingURL=account-prisma.dao.spec.js.map