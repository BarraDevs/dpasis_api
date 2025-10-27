"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const address_module_1 = require("../../../address.module");
const address_not_found_error_1 = require("../../../domain/errors/address-not-found.error");
const config_module_1 = require("../../../../../core/config/config.module");
const prisma_service_1 = require("../../../../../infra/database/prisma/prisma.service");
const create_address_service_1 = require("../create-address/create-address.service");
const find_address_by_id_service_1 = require("./find-address-by-id.service");
describe('FindAddressById', () => {
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
        sut = module.get(find_address_by_id_service_1.FindAddressById);
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
    it.each([
        true,
        false,
    ])('should throw an error if address not found', async (isMain) => {
        return sut.execute('non-existing-id', isMain).catch((error) => {
            expect(error).toBeInstanceOf(address_not_found_error_1.AddressNotFoundError);
        });
    });
    it.each([
        true,
        false,
    ])('should return address if found', async (isMain) => {
        const data = {
            nickname: 'Home',
            street: '123 Main St',
            number: 'Apt 4B',
            complement: 'Near the park',
            reference: 'Blue door',
            neighborhood: 'Downtown',
            city: 'Anytown',
            state: 'CA',
            zipCode: '12345',
            ownerId: 'owner-123',
        };
        const createdAddress = await createAddress.execute(data, isMain);
        const address = await sut.execute(createdAddress.id, isMain);
        expect(address).toBeDefined();
        expect(address).toEqual({
            id: createdAddress.id,
            nickname: data.nickname || null,
            street: data.street,
            number: data.number,
            complement: data.complement || null,
            reference: data.reference || null,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            isMain,
            ownerId: data.ownerId,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
        });
    });
});
//# sourceMappingURL=find-address-by-id.service.spec.js.map