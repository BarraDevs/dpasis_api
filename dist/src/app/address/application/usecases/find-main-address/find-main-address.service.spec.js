"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const address_module_1 = require("../../../address.module");
const config_module_1 = require("../../../../../core/config/config.module");
const prisma_service_1 = require("../../../../../infra/database/prisma/prisma.service");
const create_address_service_1 = require("../create-address/create-address.service");
const find_main_address_service_1 = require("./find-main-address.service");
describe('FindMainAddress', () => {
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
        sut = module.get(find_main_address_service_1.FindMainAddress);
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
    it('should return null if main address not found', async () => {
        const result = await sut.execute('non-existing-id');
        expect(result).toBeNull();
    });
    it('should return null if user has no main address', async () => {
        const ownerId = 'owner-1';
        await createAddress.execute({
            zipCode: '12345-678',
            street: 'Main St',
            number: '123',
            complement: 'Apt 4',
            neighborhood: 'Downtown',
            city: 'Metropolis',
            state: 'State',
            ownerId,
        }, false);
        const result = await sut.execute(ownerId);
        expect(result).toBeNull();
    });
    it('should return the main address for the given owner ID', async () => {
        const ownerId = 'owner-2';
        const mainAddressData = {
            zipCode: '98765-432',
            street: 'Second St',
            number: '456',
            complement: 'Suite 8',
            neighborhood: 'Uptown',
            city: 'Gotham',
            state: 'State',
            ownerId,
        };
        const mainAddress = await createAddress.execute(mainAddressData, true);
        await createAddress.execute({
            zipCode: '55555-555',
            street: 'Third St',
            number: '789',
            complement: 'Apt 12',
            neighborhood: 'Midtown',
            city: 'Metropolis',
            state: 'State',
            ownerId,
        }, false);
        const result = await sut.execute(ownerId);
        expect(result).toBeDefined();
        expect(result).toEqual({
            id: mainAddress.id,
            nickname: mainAddressData.nickname || null,
            zipCode: mainAddressData.zipCode,
            street: mainAddressData.street,
            number: mainAddressData.number,
            complement: mainAddressData.complement || null,
            reference: mainAddressData.reference || null,
            neighborhood: mainAddressData.neighborhood,
            city: mainAddressData.city,
            state: mainAddressData.state,
            ownerId: mainAddressData.ownerId,
            isMain: true,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
        });
    });
});
//# sourceMappingURL=find-main-address.service.spec.js.map