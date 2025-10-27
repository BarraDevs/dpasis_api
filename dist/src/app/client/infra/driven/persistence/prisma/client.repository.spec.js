"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_jest_1 = require("@golevelup/ts-jest");
const testing_1 = require("@nestjs/testing");
const client_persistence_module_1 = require("../../../../application/persistence/client-persistence.module");
const client_entity_1 = require("../../../../domain/entities/client.entity");
const config_module_1 = require("../../../../../../core/config/config.module");
const prisma_service_1 = require("../../../../../../infra/database/prisma/prisma.service");
const client_repository_1 = require("./client.repository");
describe('ClientRepositoryAdapterPrisma', () => {
    let sut;
    let prisma;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [
                client_persistence_module_1.ClientPersistenceModule,
                config_module_1.ConfigModule,
            ],
            providers: [
                client_repository_1.ClientRepositoryAdapterPrisma,
            ],
        }).compile();
        sut = module.get(client_repository_1.ClientRepositoryAdapterPrisma);
        prisma = module.get(prisma_service_1.PrismaService);
        await prisma.client.deleteMany();
    });
    afterAll(async () => {
        await prisma.client.deleteMany();
    });
    it('should be defined', () => {
        expect(sut).toBeDefined();
    });
    describe('save', () => {
        it('should save a client and return its id', async () => {
            const data = {
                cnpj: '12345678000199',
                ie: '123456789',
                kind: 'individual',
                group: 'default',
                type: 'customer',
                generateInvoice: true,
                companyName: 'John Doe Ltda',
                fantasyName: 'John Doe',
                owner: 'John Doe',
                headquarters: '123 Main St, City, State, ZIP',
            };
            const client = client_entity_1.Client.create(data);
            const clientId = await sut.save(client);
            const savedClient = await prisma.client.findUnique({
                where: { id: clientId },
            });
            expect(savedClient).toBeDefined();
            expect(savedClient).toEqual({
                id: clientId,
                cnpj: data.cnpj,
                ie: data.ie,
                kind: data.kind,
                group: data.group,
                type: data.type,
                generateInvoice: data.generateInvoice,
                companyName: data.companyName,
                fantasyName: data.fantasyName,
                owner: data.owner,
                headquarters: data.headquarters,
                active: true,
                createdAt: savedClient.createdAt,
                updatedAt: savedClient.updatedAt,
            });
        });
        it('should call prisma.client.create with correct parameters', async () => {
            const client = (0, ts_jest_1.createMock)();
            const prismaCreateSpy = jest.spyOn(prisma.client, 'create').mockResolvedValue({ id: 'client-id' });
            await sut.save(client);
            expect(prismaCreateSpy).toHaveBeenCalledWith({
                data: { ...client.props },
            });
        });
    });
    describe('edit', () => {
        it('should edit a client', async () => {
            const data = {
                cnpj: '12345678000199',
                ie: '123456789',
                kind: 'individual',
                group: 'default',
                type: 'customer',
                generateInvoice: true,
                companyName: 'John Doe Ltda',
                fantasyName: 'John Doe',
                owner: 'John Doe',
                headquarters: '123 Main St, City, State, ZIP',
            };
            const client = client_entity_1.Client.create(data);
            const clientId = await sut.save(client);
            const clientEdited = client_entity_1.Client.load({
                ...client.props,
                ...data,
                companyName: 'Company Edited Ltda',
            });
            await sut.edit(clientEdited);
            const updatedClient = await prisma.client.findUnique({
                where: { id: client.props.id },
            });
            expect(updatedClient).toBeDefined();
            expect(updatedClient.id).toBe(clientId);
            expect(updatedClient.companyName).toBe('Company Edited Ltda');
        });
        it('should call prisma.client.update with correct parameters', async () => {
            const client = (0, ts_jest_1.createMock)();
            const prismaUpdateSpy = jest.spyOn(prisma.client, 'update').mockResolvedValue({});
            await sut.edit(client);
            expect(prismaUpdateSpy).toHaveBeenCalledWith({
                where: { id: client.props.id },
                data: { ...client.props },
            });
        });
    });
});
//# sourceMappingURL=client.repository.spec.js.map