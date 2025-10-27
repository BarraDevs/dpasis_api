"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const account_role_enum_1 = require("../../../../account/domain/enums/account-role.enum");
const account_status_enum_1 = require("../../../../account/domain/enums/account-status.enum");
const authentication_module_1 = require("../../../authentication.module");
const prisma_service_1 = require("../../../../../infra/database/prisma/prisma.service");
const password_vo_1 = require("../../../../../shared/value-objects/password/password.vo");
const forbidden_account_error_1 = require("../../errors/forbidden-account.error");
const inactive_account_error_1 = require("../../errors/inactive-account.error");
const invalid_credential_error_1 = require("../../errors/invalid-credential.error");
const signin_with_credential_and_password_service_1 = require("./signin-with-credential-and-password.service");
describe('SigninWithCredentialAndPassword', () => {
    let sut;
    let prisma;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [authentication_module_1.AuthenticationModule],
        }).compile();
        sut = module.get(signin_with_credential_and_password_service_1.SignInWithCredentialAndPassword);
        prisma = module.get(prisma_service_1.PrismaService);
        await prisma.account.deleteMany();
    });
    afterAll(async () => {
        await prisma.account.deleteMany();
    });
    it('should be defined', () => {
        expect(sut).toBeDefined();
    });
    it('should throw an error if account is not found', async () => {
        const data = {
            credential: 'credential',
            password: 'password',
        };
        expect.assertions(1);
        return sut.execute(data).catch((error) => {
            expect(error).toBeInstanceOf(invalid_credential_error_1.InvalidCredentialError);
        });
    });
    it('should throw an error if password is invalid', async () => {
        const role = account_role_enum_1.AccountRole.STORE;
        const email = 'jhondoe@email.com';
        const password = '123456';
        const hashedPassword = new password_vo_1.Password(password).value;
        await prisma.account.create({
            data: {
                roles: { create: { role } },
                email,
                password: hashedPassword,
                status: account_status_enum_1.AccountStatus.ACTIVE,
            },
        });
        const data = {
            credential: email,
            password: 'another-password',
        };
        expect.assertions(1);
        return sut.execute(data).catch((error) => {
            expect(error).toBeInstanceOf(invalid_credential_error_1.InvalidCredentialError);
        });
    });
    it('should throw an error if account status is inactive', async () => {
        const role = account_role_enum_1.AccountRole.STORE;
        const email = 'jhondoe@email.com';
        const password = '123456';
        const hashedPassword = new password_vo_1.Password(password).value;
        await prisma.account.create({
            data: {
                roles: { create: { role } },
                email,
                password: hashedPassword,
                status: account_status_enum_1.AccountStatus.INACTIVE,
            },
        });
        const data = {
            credential: email,
            password,
        };
        expect.assertions(1);
        return sut.execute(data).catch((error) => {
            expect(error).toBeInstanceOf(inactive_account_error_1.InactiveAccountError);
        });
    });
    it('should throw an error if account status is not active', async () => {
        const role = account_role_enum_1.AccountRole.STORE;
        const email = 'jhondoe@email.com';
        const password = '123456';
        const hashedPassword = new password_vo_1.Password(password).value;
        await prisma.account.create({
            data: {
                roles: { create: { role } },
                email,
                password: hashedPassword,
                status: account_status_enum_1.AccountStatus.PENDING,
            },
        });
        const data = {
            credential: email,
            password,
        };
        expect.assertions(1);
        return sut.execute(data).catch((error) => {
            expect(error).toBeInstanceOf(forbidden_account_error_1.ForbiddenAccountError);
        });
    });
    it('should return an access token if credentials are valid', async () => {
        const role = account_role_enum_1.AccountRole.STORE;
        const email = 'jhondoe@email.com';
        const password = '123456';
        const hashedPassword = new password_vo_1.Password(password).value;
        await prisma.account.create({
            data: {
                roles: { create: { role } },
                email,
                password: hashedPassword,
                status: account_status_enum_1.AccountStatus.ACTIVE,
            },
        });
        const data = {
            credential: email,
            password,
        };
        const result = await sut.execute(data);
        expect(result.accessToken).not.toBeNull();
    });
});
//# sourceMappingURL=signin-with-credential-and-password.service.service.spec.js.map