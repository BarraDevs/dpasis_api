"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("../../../../../../infra/validators/class-*/config");
const create_address_dto_1 = require("./create-address.dto");
const metadata = {
    type: 'body',
    metatype: create_address_dto_1.CreateAddressInputDto,
};
describe('CreateAddressInputDto', () => {
    let target;
    beforeEach(() => {
        target = new common_1.ValidationPipe(config_1.pipeOptions);
    });
    describe.each([
        'zipCode',
        'street',
        'number',
        'neighborhood',
        'city',
        'state',
        'ownerId',
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
    describe.each([
        'nickname',
        'complement',
        'reference',
    ])('%s field', (field) => {
        it.each([
            undefined,
            null,
            '',
            '  ',
        ])(`should not throw an error if ${field} is empty (%s)`, async (value) => {
            const data = { [field]: value };
            expect.assertions(1);
            return target.transform(data, metadata).catch((error) => {
                expect(error).not.toContain(`${field} deve ser uma string`);
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
            nickname: 'Casa',
            zipCode: '12345678',
            street: 'Rua A',
            number: '100',
            complement: 'Apto 101',
            reference: 'Próximo ao mercado',
            neighborhood: 'Bairro B',
            city: 'Cidade C',
            state: 'Estado D',
            ownerId: 'owner-123',
        };
        const result = await target.transform(data, metadata);
        expect(result).toBeInstanceOf(create_address_dto_1.CreateAddressInputDto);
        expect(result).toEqual(data);
    });
    it('should pass if all required fields are valid and optional fields are missing', async () => {
        const data = {
            zipCode: '12345678',
            street: 'Rua A',
            number: '100',
            neighborhood: 'Bairro B',
            city: 'Cidade C',
            state: 'Estado D',
            ownerId: 'owner-123',
        };
        const result = await target.transform(data, metadata);
        expect(result).toBeInstanceOf(create_address_dto_1.CreateAddressInputDto);
        expect(result).toEqual(data);
    });
});
//# sourceMappingURL=create-address-dto.spec.js.map