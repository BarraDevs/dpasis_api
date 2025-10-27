"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("../../../../../../infra/validators/class-*/config");
const find_all_client_dto_1 = require("./find-all-client.dto");
const metadata = {
    type: 'body',
    metatype: find_all_client_dto_1.FindAllClientQueryDto,
};
describe('FindAllClientQueryDto', () => {
    let target;
    beforeEach(() => {
        target = new common_1.ValidationPipe(config_1.pipeOptions);
    });
    describe.each([
        'companyName',
        'cnpj',
    ])('%s field', (field) => {
        it.each([
            undefined,
            null,
            '',
            '  ',
        ])(`should not throw an error if ${field} is empty (%s)`, async (value) => {
            const data = { [field]: value };
            const result = await target.transform(data, metadata);
            expect(result).toBeInstanceOf(find_all_client_dto_1.FindAllClientQueryDto);
        });
        it.each([
            123,
            true,
            false,
            {},
            [],
        ])('should throw an error if %s is not a string (%s)', async (value) => {
            const data = { [field]: value };
            expect.assertions(1);
            return target.transform(data, metadata).catch((error) => {
                expect(error.getResponse().message).toContain(`${field} deve ser um texto`);
            });
        });
    });
    it('should pass if all fields are valid', async () => {
        const data = {
            companyName: 'Empresa XYZ',
        };
        const result = await target.transform(data, metadata);
        expect(result).toBeInstanceOf(find_all_client_dto_1.FindAllClientQueryDto);
        expect(result).toEqual(data);
    });
});
//# sourceMappingURL=find-all-client-dto.spec.js.map