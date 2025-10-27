"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const client_persistence_module_1 = require("../../../../application/persistence/client-persistence.module");
const config_module_1 = require("../../../../../../core/config/config.module");
const prisma_service_1 = require("../../../../../../infra/database/prisma/prisma.service");
const client_dao_1 = require("./client.dao");
const client1 = {
    id: 'a55a7872-a039-4813-bd52-788a3218a3f3',
    kind: 'LEGAL',
    cnpj: '11111111111111',
    ie: '111111111111',
    group: 'Group A',
    type: 'Type A',
    generateInvoice: true,
    companyName: 'Company A',
    fantasyName: 'Fantasy A',
    owner: 'Owner A',
    headquarters: 'Headquarters A',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
};
const client2 = {
    id: 'b55a7872-a039-4813-bd52-788a3218a3f4',
    kind: 'LEGAL',
    cnpj: '22222222222222',
    ie: '222222222222',
    group: 'Group B',
    type: 'Type B',
    generateInvoice: false,
    companyName: 'Company B',
    fantasyName: 'Fantasy B',
    owner: 'Owner B',
    headquarters: 'Headquarters B',
    active: false,
    createdAt: new Date(),
    updatedAt: new Date(),
};
describe('ClientDaoAdapterPrisma', () => {
    let sut;
    let prisma;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [
                client_persistence_module_1.ClientPersistenceModule,
                config_module_1.ConfigModule,
            ],
            providers: [
                client_dao_1.ClientDaoAdapterPrisma,
            ],
        }).compile();
        sut = module.get(client_dao_1.ClientDaoAdapterPrisma);
        prisma = module.get(prisma_service_1.PrismaService);
        await prisma.client.deleteMany();
    });
    afterAll(async () => {
        await prisma.client.deleteMany();
    });
    it('should be defined', () => {
        expect(sut).toBeDefined();
    });
    describe('findAll', () => {
        it('should return empty array when no clients exist', async () => {
            const [clients, total] = await sut.findAll({});
            expect(clients).toEqual([]);
            expect(total).toBe(0);
        });
        it('should return clients when they exist', async () => {
            await prisma.client.createMany({ data: [client1, client2] });
            const [clients, total] = await sut.findAll({});
            expect(clients).toHaveLength(2);
            expect(total).toBe(2);
        });
        it('should return paginated clients', async () => {
            await prisma.client.createMany({ data: [client1, client2] });
            const [clients, total] = await sut.findAll({ page: 1, size: 1 });
            expect(clients).toHaveLength(1);
            expect(total).toBe(2);
        });
        it('should return clients filtered by companyName', async () => {
            await prisma.client.createMany({ data: [client1, client2] });
            const [clients, total] = await sut.findAll({ companyName: 'Company A' });
            expect(clients).toHaveLength(1);
            expect(total).toBe(1);
            expect(clients[0].companyName).toBe('Company A');
        });
        it('should return clients filtered by cnpj', async () => {
            await prisma.client.createMany({ data: [client1, client2] });
            const [clients, total] = await sut.findAll({ cnpj: '11111111111111' });
            expect(clients).toHaveLength(1);
            expect(total).toBe(1);
            expect(clients[0].cnpj).toBe('11111111111111');
        });
        it('should return clients ordered by createdAt descending', async () => {
            await prisma.client.create({ data: { ...client1, createdAt: new Date(2023, 0, 1) } });
            await prisma.client.create({ data: { ...client2, createdAt: new Date(2023, 0, 2) } });
            const [clients, total] = await sut.findAll({});
            expect(total).toBe(2);
            expect(clients).toHaveLength(2);
            expect(clients[0].id).toBe(client2.id);
            expect(clients[1].id).toBe(client1.id);
        });
    });
    describe('findById', () => {
        it('should return null when client does not exist', async () => {
            const client = await sut.findById('invalid-id');
            expect(client).toBeNull();
        });
        it('should return a client when it exists', async () => {
            await prisma.client.create({ data: client1 });
            const client = await sut.findById(client1.id);
            expect(client).toBeDefined();
            expect(client.id).toBe(client1.id);
        });
    });
    describe('findByCnpj', () => {
        it('should return null when client does not exist', async () => {
            const client = await sut.findByCnpj('invalid-cnpj');
            expect(client).toBeNull();
        });
        it('should return a client when it exists', async () => {
            await prisma.client.create({ data: client1 });
            const client = await sut.findByCnpj(client1.cnpj);
            expect(client).toBeDefined();
            expect(client.cnpj).toBe(client1.cnpj);
        });
    });
    describe('findByIe', () => {
        it('should return null when client does not exist', async () => {
            const client = await sut.findByIe('invalid-ie');
            expect(client).toBeNull();
        });
        it('should return a client when it exists', async () => {
            await prisma.client.create({ data: client1 });
            const client = await sut.findByIe(client1.ie);
            expect(client).toBeDefined();
            expect(client.ie).toBe(client1.ie);
        });
    });
});
//# sourceMappingURL=client.dao.spec.js.map