"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("../../../../../../infra/validators/class-*/config");
const find_all_address_dto_1 = require("./find-all-address.dto");
const metadata = {
    type: 'body',
    metatype: find_all_address_dto_1.FindAllAddressQueryDto,
};
describe('FindAllAddressQueryDto', () => {
    let target;
    beforeEach(() => {
        target = new common_1.ValidationPipe(config_1.pipeOptions);
    });
    describe.each([
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
    });
    describe.each([
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
    it('should pass if all fields are valid', async () => {
        const data = {
            isMain: true,
            ownerId: 'owner-123',
        };
        const result = await target.transform(data, metadata);
        expect(result).toBeInstanceOf(find_all_address_dto_1.FindAllAddressQueryDto);
        expect(result).toEqual({ ownerId: data.ownerId });
    });
});
//# sourceMappingURL=find-all-address-dto.spec.js.map