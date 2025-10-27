"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const address_module_1 = require("../../../address.module");
const config_module_1 = require("../../../../../core/config/config.module");
const prisma_service_1 = require("../../../../../infra/database/prisma/prisma.service");
const create_address_service_1 = require("../create-address/create-address.service");
const find_all_address_service_1 = require("./find-all-address.service");
describe('FindAllAddress', () => {
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
        sut = module.get(find_all_address_service_1.FindAllAddress);
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
    it('should find all addresses by owner id and is main', async () => {
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
        await createAddress.execute({ ...data }, true);
        await createAddress.execute({ ...data }, false);
        await createAddress.execute({ ...data, ownerId: 'owner-2' }, true);
        const addressesMain = await sut.execute({ ownerId: 'owner-1', isMain: true });
        expect(addressesMain.data).toHaveLength(1);
        expect(addressesMain.data[0].isMain).toBe(true);
        expect(addressesMain.data[0].ownerId).toBe('owner-1');
    });
});
//# sourceMappingURL=find-all-address.service.spec.js.map