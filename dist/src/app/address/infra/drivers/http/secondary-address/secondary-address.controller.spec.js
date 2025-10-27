"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_jest_1 = require("@golevelup/ts-jest");
const testing_1 = require("@nestjs/testing");
const address_module_1 = require("../../../../address.module");
const secondary_address_controller_1 = require("./secondary-address.controller");
describe('AddressSecondaryController', () => {
    let sut;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [
                address_module_1.AddressModule,
            ],
        }).compile();
        sut = module.get(secondary_address_controller_1.AddressSecondaryController);
    });
    it('should be defined', () => {
        expect(sut).toBeDefined();
    });
    describe('create', () => {
        it('should call createAddressService with correct parameters', async () => {
            const input = (0, ts_jest_1.createMock)();
            const output = (0, ts_jest_1.createMock)();
            const createAddressServiceSpy = jest.spyOn(sut['createAddressService'], 'execute').mockResolvedValue(output);
            const result = await sut.create(input);
            expect(createAddressServiceSpy).toHaveBeenCalledWith(input, false);
            expect(result).toBe(output);
        });
    });
    describe('findAll', () => {
        it('should call findAllAddressService with correct parameters', async () => {
            const queries = (0, ts_jest_1.createMock)();
            const output = (0, ts_jest_1.createMock)();
            const findAllAddressServiceSpy = jest.spyOn(sut['findAllAddressService'], 'execute').mockResolvedValue(output);
            const result = await sut.findAll(queries);
            expect(findAllAddressServiceSpy).toHaveBeenCalledWith({ ...queries, isMain: false });
            expect(result).toBe(output);
        });
    });
    describe('findOne', () => {
        it('should call findOneAddressService with correct parameters', async () => {
            const id = 'some-id';
            const output = (0, ts_jest_1.createMock)();
            const findOneAddressServiceSpy = jest.spyOn(sut['findAddressByIdService'], 'execute').mockResolvedValue(output);
            const result = await sut.findOne({ id });
            expect(findOneAddressServiceSpy).toHaveBeenCalledWith(id, false);
            expect(result).toBe(output);
        });
    });
    describe('update', () => {
        it('should call editAddressService with correct parameters', async () => {
            const id = 'some-id';
            const body = (0, ts_jest_1.createMock)();
            const output = (0, ts_jest_1.createMock)();
            const editAddressServiceSpy = jest.spyOn(sut['editAddressService'], 'execute').mockResolvedValue(output);
            const result = await sut.update({ id }, body);
            expect(editAddressServiceSpy).toHaveBeenCalledWith(id, false, body);
            expect(result).toBe(output);
        });
    });
    describe('remove', () => {
        it('should call deleteAddressService with correct parameters', async () => {
            const id = 'some-id';
            const output = (0, ts_jest_1.createMock)();
            const deleteAddressServiceSpy = jest.spyOn(sut['deleteAddressService'], 'execute').mockResolvedValue(output);
            const result = await sut.remove({ id });
            expect(deleteAddressServiceSpy).toHaveBeenCalledWith(id);
            expect(result).toBe(output);
        });
    });
});
//# sourceMappingURL=secondary-address.controller.spec.js.map