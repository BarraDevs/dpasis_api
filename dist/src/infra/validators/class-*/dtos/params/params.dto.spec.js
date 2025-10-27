"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("../../config");
const params_dto_1 = require("./params.dto");
const metadata = {
    type: 'body',
    metatype: params_dto_1.Params,
};
describe('Params', () => {
    let target;
    beforeEach(() => {
        target = new common_1.ValidationPipe(config_1.pipeOptions);
    });
    describe.each([
        'id',
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
            () => { },
            Symbol('test'),
            BigInt(123),
            new Date(),
            [1, 2, 3],
            { key: 'value' },
            new Map(),
            new Set(),
            Buffer.from('test'),
            new ArrayBuffer(8),
            new Int32Array(8),
        ])(`should throw an error if ${field} is not a string (%s)`, async (value) => {
            const data = { [field]: value };
            expect.assertions(1);
            return target.transform(data, metadata).catch((error) => {
                expect(error.getResponse().message).toContain(`${field} deve ser um texto`);
            });
        });
    });
    it('should pass if all fields are valid', async () => {
        const data = {
            id: '  random - - id  ',
        };
        const result = await target.transform(data, metadata);
        expect(result).toBeInstanceOf(params_dto_1.Params);
        expect(result).toEqual({ id: 'random - - id' });
    });
});
//# sourceMappingURL=params.dto.spec.js.map