"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("../../config");
const queries_dto_1 = require("./queries.dto");
const metadata = {
    type: 'query',
    metatype: queries_dto_1.Queries,
};
describe('Queries DTO', () => {
    let target;
    beforeEach(() => {
        target = new common_1.ValidationPipe(config_1.pipeOptions);
    });
    describe.each([
        'page',
        'size',
    ])('%s field', (field) => {
        it.each([
            undefined,
            null,
        ])(`should not throw an error if ${field} is empty (%s)`, async (value) => {
            const data = { [field]: value };
            const result = await target.transform(data, metadata);
            expect(result).toBeInstanceOf(queries_dto_1.Queries);
        });
        it.each([
            '1',
            '10',
            '100',
        ])('should convert valid string numbers to integers (%s)', async (value) => {
            const data = { [field]: value };
            const result = await target.transform(data, metadata);
            expect(result[field]).toBe(parseInt(value));
        });
        it.each([
            '0',
            '-1',
            '-10',
        ])(`should throw an error if ${field} is not positive (%s)`, async (value) => {
            const data = { [field]: value };
            expect.assertions(1);
            return target.transform(data, metadata).catch((error) => {
                expect(error.getResponse().message).toContain(`${field} deve ser um número positivo`);
            });
        });
        it.each([
            '1.5',
            '2.7',
            'abc',
            'true',
            'false',
        ])(`should throw an error if ${field} is not an integer (%s)`, async (value) => {
            const data = { [field]: value };
            expect.assertions(1);
            return target.transform(data, metadata).catch((error) => {
                expect(error.getResponse().message).toContain(`${field} deve ser um número inteiro`);
            });
        });
    });
    describe('search field', () => {
        it.each([
            undefined,
            null,
            '',
            '  ',
        ])('should not throw an error if search is empty (%s)', async (value) => {
            const data = { search: value };
            const result = await target.transform(data, metadata);
            expect(result).toBeInstanceOf(queries_dto_1.Queries);
        });
        it.each([
            'test',
            '  test  ',
            'search term',
            '123',
        ])('should accept valid string values (%s)', async (value) => {
            const data = { search: value };
            const result = await target.transform(data, metadata);
            expect(result.search).toBe(value.trim());
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
        ])('should throw an error if search is not a string (%s)', async (value) => {
            const data = { search: value };
            expect.assertions(1);
            return target.transform(data, metadata).catch((error) => {
                expect(error.getResponse().message).toContain('search deve ser um texto');
            });
        });
    });
    describe('combined fields validation', () => {
        it('should pass if all fields are valid', async () => {
            const data = {
                page: '1',
                size: '10',
                search: '  test  -- search  ',
            };
            const result = await target.transform(data, metadata);
            expect(result).toBeInstanceOf(queries_dto_1.Queries);
            expect(result).toEqual({
                page: 1,
                size: 10,
                search: 'test  -- search',
            });
        });
        it('should pass if no fields are provided', async () => {
            const data = {};
            const result = await target.transform(data, metadata);
            expect(result).toBeInstanceOf(queries_dto_1.Queries);
            expect(result).toEqual({});
        });
        it('should pass with partial fields', async () => {
            const data = {
                page: '2',
                search: 'partial search',
            };
            const result = await target.transform(data, metadata);
            expect(result).toBeInstanceOf(queries_dto_1.Queries);
            expect(result).toEqual({
                page: 2,
                search: 'partial search',
            });
        });
    });
});
//# sourceMappingURL=queries.dto.spec.js.map