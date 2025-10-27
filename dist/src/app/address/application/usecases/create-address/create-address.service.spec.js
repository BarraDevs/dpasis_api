"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const address_module_1 = require("../../../address.module");
const address_main_must_be_one_error_1 = require("../../../domain/errors/address-main-must-be-one.error");
const config_module_1 = require("../../../../../core/config/config.module");
const prisma_service_1 = require("../../../../../infra/database/prisma/prisma.service");
const find_address_by_id_service_1 = require("../find-address-by-id/find-address-by-id.service");
const create_address_service_1 = require("./create-address.service");
describe('CreateAddress', () => {
    let sut;
    let prisma;
    let findAddressById;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [
                address_module_1.AddressModule,
                config_module_1.ConfigModule,
            ],
        }).compile();
        sut = module.get(create_address_service_1.CreateAddress);
        prisma = module.get(prisma_service_1.PrismaService);
        findAddressById = module.get(find_address_by_id_service_1.FindAddressById);
        await prisma.address.deleteMany();
    });
    afterAll(async () => {
        await prisma.address.deleteMany();
    });
    it('should be defined', () => {
        expect(sut).toBeDefined();
    });
    it('should create a main address', async () => {
        const data = {
            zipCode: '12345-678',
            street: 'Main St',
            number: '123',
            complement: 'Apt 4',
            neighborhood: 'Downtown',
            city: 'Metropolis',
            state: 'State',
            ownerId: 'owner-1',
        };
        const result = await sut.execute(data, true);
        expect(result).toEqual({ id: result.id });
        const createdAddress = await findAddressById.execute(result.id, true);
        expect(createdAddress).toBeDefined();
        expect(createdAddress).toEqual({
            id: result.id,
            nickname: data.nickname || null,
            zipCode: data.zipCode,
            street: data.street,
            number: data.number,
            complement: data.complement || null,
            reference: data.reference || null,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            ownerId: data.ownerId,
            isMain: true,
            createdAt: createdAddress.createdAt,
            updatedAt: createdAddress.updatedAt,
        });
    });
    it('should not create a second main address for the same owner', async () => {
        const data = {
            zipCode: '12345-678',
            street: 'Main St',
            number: '123',
            neighborhood: 'Downtown',
            city: 'Metropolis',
            state: 'State',
            ownerId: 'owner-1',
        };
        await sut.execute(data, true);
        expect.assertions(1);
        return sut.execute(data, true).catch((error) => {
            expect(error).toBeInstanceOf(address_main_must_be_one_error_1.AddressMainMustBeOneError);
        });
    });
    it('should create a non-main address', async () => {
        const data = {
            zipCode: '98765-432',
            street: 'Second St',
            number: '456',
            neighborhood: 'Uptown',
            city: 'Gotham',
            state: 'State',
            ownerId: 'owner-2',
        };
        const result = await sut.execute(data, false);
        expect(result).toEqual({ id: result.id });
        const createdAddress = await findAddressById.execute(result.id, false);
        expect(createdAddress).toBeDefined();
        expect(createdAddress).toEqual({
            id: result.id,
            nickname: data.nickname || null,
            zipCode: data.zipCode,
            street: data.street,
            number: data.number,
            complement: data.complement || null,
            reference: data.reference || null,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            ownerId: data.ownerId,
            isMain: false,
            createdAt: createdAddress.createdAt,
            updatedAt: createdAddress.updatedAt,
        });
    });
});
//# sourceMappingURL=create-address.service.spec.js.map