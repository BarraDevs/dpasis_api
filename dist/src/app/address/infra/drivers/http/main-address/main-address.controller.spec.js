"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_jest_1 = require("@golevelup/ts-jest");
const testing_1 = require("@nestjs/testing");
const address_module_1 = require("../../../../address.module");
const main_address_controller_1 = require("./main-address.controller");
describe('AddressMainController', () => {
    let sut;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [
                address_module_1.AddressModule,
            ],
        }).compile();
        sut = module.get(main_address_controller_1.AddressMainController);
    });
    it('should be defined', () => {
        expect(sut).toBeDefined();
    });
    describe('create', () => {
        it('should call createAddressService.execute with correct params', async () => {
            const input = (0, ts_jest_1.createMock)({});
            const output = (0, ts_jest_1.createMock)({});
            const createAddressService = jest.spyOn(sut['createAddressService'], 'execute').mockResolvedValue(output);
            const result = await sut.create(input);
            expect(createAddressService).toHaveBeenCalledWith(input, true);
            expect(result).toBe(output);
        });
    });
    describe('findOne', () => {
        it('should call findMainAddressService.execute with correct params', async () => {
            const ownerId = 'any_owner_id';
            const findMainAddressService = jest.spyOn(sut['findMainAddressService'], 'execute').mockResolvedValue(null);
            const result = await sut.findOne({ id: ownerId });
            expect(findMainAddressService).toHaveBeenCalledWith(ownerId);
            expect(result).toBeNull();
        });
    });
    describe('update', () => {
        it('should call editAddressService.execute with correct params', async () => {
            const addressId = 'any_address_id';
            const body = {};
            const successMessage = { message: 'Endereço atualizado com sucesso' };
            const editAddressService = jest.spyOn(sut['editAddressService'], 'execute').mockResolvedValue(successMessage);
            const result = await sut.update({ id: addressId }, body);
            expect(editAddressService).toHaveBeenCalledWith(addressId, true, body);
            expect(result).toBe(successMessage);
        });
    });
});
//# sourceMappingURL=main-address.controller.spec.js.map