"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("../../../../../../infra/validators/class-*/config");
const signin_with_credential_and_password_dto_1 = require("./signin-with-credential-and-password.dto");
const metadata = {
    type: 'body',
    metatype: signin_with_credential_and_password_dto_1.SigninWithCredentialAndPasswordInputDto,
};
describe('SigninWithCredentialAndPasswordInputDto', () => {
    let target;
    beforeEach(() => {
        target = new common_1.ValidationPipe(config_1.pipeOptions);
    });
    describe.each([
        'credential',
        'password',
    ])('%s field', (field) => {
        it.each([
            undefined,
            null,
            '',
            '  ',
        ])(`should throw an error if ${field} is empty (%s)`, async (value) => {
            const data = { [field]: value };
            expect.assertions(1);
            return target.transform(data, metadata).catch((error) => {
                expect(error.getResponse().message).toContain(`${field} é obrigatório`);
            });
        });
        it.each([
            123,
            true,
            false,
            {},
            [],
        ])(`should throw an error if ${field} is not a string (%s)`, async (value) => {
            const data = { [field]: value };
            expect.assertions(1);
            return target.transform(data, metadata).catch((error) => {
                expect(error.getResponse().message).toContain(`${field} deve ser uma string`);
            });
        });
    });
    it('should pass if all fields are valid', async () => {
        const data = {
            credential: 'credential',
            password: 'password',
        };
        const result = await target.transform(data, metadata);
        expect(result).toBeInstanceOf(signin_with_credential_and_password_dto_1.SigninWithCredentialAndPasswordInputDto);
        expect(result).toEqual(data);
    });
});
//# sourceMappingURL=signin-with-credential-and-password.dto.spec.js.map