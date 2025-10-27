"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("../../../../../../infra/validators/class-*/config");
const edit_client_dto_1 = require("./edit-client.dto");
const metadata = {
    type: 'body',
    metatype: edit_client_dto_1.EditClientInputDto,
};
describe('EditClientInputDto', () => {
    let target;
    beforeEach(() => {
        target = new common_1.ValidationPipe(config_1.pipeOptions);
    });
    describe.each([
        'kind',
        'cnpj',
        'ie',
        'group',
        'type',
        'companyName',
        'fantasyName',
        'owner',
        'headquarters',
    ])('%s field', (field) => {
        it.each([
            undefined,
            null,
        ])(`should pass if ${field} is not provided (%s)`, async (value) => {
            const data = { [field]: value };
            const result = await target.transform(data, metadata);
            expect(result).toBeInstanceOf(edit_client_dto_1.EditClientInputDto);
            expect(result).toEqual(data);
        });
        it.each([
            '',
            '  ',
        ])(`should throw an error if ${field} is an empty string (%s)`, async (value) => {
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
        ])('should throw an error if %s is not a string (%s)', async (value) => {
            const data = { [field]: value };
            expect.assertions(1);
            return target.transform(data, metadata).catch((error) => {
                expect(error.getResponse().message).toContain(`${field} deve ser uma string`);
            });
        });
    });
    describe.each([
        'generateInvoice',
    ])('%s field', (field) => {
        it.each([
            undefined,
            null,
        ])(`should pass if ${field} is not provided (%s)`, async (value) => {
            const data = { [field]: value };
            const result = await target.transform(data, metadata);
            expect(result).toBeInstanceOf(edit_client_dto_1.EditClientInputDto);
            expect(result).toEqual(data);
        });
    });
    it('should pass if all fields are valid', async () => {
        const data = {
            kind: 'kind',
            cnpj: 'cnpj',
            ie: 'ie',
            group: 'group',
            type: 'type',
            generateInvoice: true,
            companyName: 'companyName',
            fantasyName: 'fantasyName',
            owner: 'owner',
            headquarters: 'headquarters',
        };
        const result = await target.transform(data, metadata);
        expect(result).toBeInstanceOf(edit_client_dto_1.EditClientInputDto);
        expect(result).toEqual(data);
    });
    it('should pass if no fields are provided', async () => {
        const data = {};
        const result = await target.transform(data, metadata);
        expect(result).toBeInstanceOf(edit_client_dto_1.EditClientInputDto);
        expect(result).toEqual(data);
    });
    it('should pass if only some fields are provided', async () => {
        const data = {
            kind: 'kind',
            cnpj: 'cnpj',
            generateInvoice: false,
            owner: 'owner',
        };
        const result = await target.transform(data, metadata);
        expect(result).toBeInstanceOf(edit_client_dto_1.EditClientInputDto);
        expect(result).toEqual(data);
    });
});
//# sourceMappingURL=edit-client-dto.spec.js.map