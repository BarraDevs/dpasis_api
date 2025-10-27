"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_vo_1 = require("./pagination.vo");
describe('Pagination value object', () => {
    it('should create a pagination object with default values', () => {
        const data = ['foo', 'bar'];
        const pagination = new pagination_vo_1.Pagination(data, data.length);
        expect(pagination.getDto()).toEqual({
            currentPage: 1,
            itemsPerPage: 2,
            totalItems: 2,
            totalPages: 1,
            data,
        });
    });
    it('should create a pagination object with custom values', () => {
        const data = ['foo', 'bar'];
        const page = 2;
        const size = 1;
        const pagination = new pagination_vo_1.Pagination(data, data.length, page, size);
        expect(pagination.getDto()).toEqual({
            currentPage: page,
            itemsPerPage: size,
            totalItems: data.length,
            totalPages: Math.ceil(data.length / size),
            data,
        });
    });
    it('should create a pagination object even though there is no data', () => {
        const data = [];
        const pagination = new pagination_vo_1.Pagination(data, data.length);
        expect(pagination.getDto()).toEqual({
            currentPage: 1,
            itemsPerPage: 0,
            totalItems: 0,
            totalPages: 0,
            data,
        });
    });
});
//# sourceMappingURL=pagination.vo.spec.js.map