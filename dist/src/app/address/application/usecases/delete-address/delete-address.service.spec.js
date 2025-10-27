"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_jest_1 = require("@golevelup/ts-jest");
const testing_1 = require("@nestjs/testing");
const address_module_1 = require("../../../address.module");
const address_main_cannot_be_deleted_error_1 = require("../../../domain/errors/address-main-cannot-be-deleted.error");
const address_not_found_error_1 = require("../../../domain/errors/address-not-found.error");
const config_module_1 = require("../../../../../core/config/config.module");
const prisma_service_1 = require("../../../../../infra/database/prisma/prisma.service");
const create_address_service_1 = require("../create-address/create-address.service");
const delete_address_service_1 = require("./delete-address.service");
describe('DeleteAddress', () => {
    let sut;
    let prisma;
    let createAddress;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [
                address_module_1.AddressModule,
                config_module_1.ConfigModule,
            ],
        }).compile();
        sut = module.get(delete_address_service_1.DeleteAddress);
        prisma = module.get(prisma_service_1.PrismaService);
        createAddress = module.get(create_address_service_1.CreateAddress);
        await prisma.address.deleteMany();
    });
    afterAll(async () => {
        await prisma.address.deleteMany();
    });
    it('should be defined', () => {
        expect(sut).toBeDefined();
    });
    it('should throw an error if address does not exist', async () => {
        expect.assertions(1);
        return sut.execute('non-existing-id').catch((error) => {
            expect(error).toBeInstanceOf(address_not_found_error_1.AddressNotFoundError);
        });
    });
    it('should throw an error if address is main', async () => {
        const mainAddress = (0, ts_jest_1.createMock)({ isMain: true });
        jest.spyOn(sut['addressDao'], 'findById').mockResolvedValueOnce(mainAddress);
        expect.assertions(1);
        return sut.execute('main-address-id').catch((error) => {
            expect(error).toBeInstanceOf(address_main_cannot_be_deleted_error_1.AddressMainCannotBeDeletedError);
        });
    });
    it('should delete address successfully', async () => {
        const address = await createAddress.execute({
            zipCode: '12345-678',
            street: 'Rua A',
            number: '100',
            neighborhood: 'Bairro B',
            city: 'Cidade B',
            state: 'Estado C',
            ownerId: 'owner-123',
        }, false);
        const result = await sut.execute(address.id);
        expect(result).toEqual({ message: 'Endereço deletado com sucesso!' });
        const deletedAddress = await prisma.address.findUnique({ where: { id: address.id } });
        expect(deletedAddress).toBeNull();
    });
});
//# sourceMappingURL=delete-address.service.spec.js.map