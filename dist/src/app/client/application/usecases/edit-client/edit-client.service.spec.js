"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const client_module_1 = require("../../../client.module");
const client_not_found_1 = require("../../../domain/errors/client-not-found");
const duplicate_cnpj_error_1 = require("../../../domain/errors/duplicate-cnpj.error");
const duplicate_ie_error_1 = require("../../../domain/errors/duplicate-ie.error");
const config_module_1 = require("../../../../../core/config/config.module");
const prisma_service_1 = require("../../../../../infra/database/prisma/prisma.service");
const create_client_service_1 = require("../create-client/create-client.service");
const find_client_by_id_service_1 = require("../find-client-by-id/find-client-by-id.service");
const edit_client_service_1 = require("./edit-client.service");
describe('EditClient', () => {
    let sut;
    let prisma;
    let createClient;
    let findClientById;
    let data;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [
                client_module_1.ClientModule,
                config_module_1.ConfigModule,
            ],
        }).compile();
        sut = module.get(edit_client_service_1.EditClient);
        prisma = module.get(prisma_service_1.PrismaService);
        createClient = module.get(create_client_service_1.CreateClient);
        findClientById = module.get(find_client_by_id_service_1.FindClientById);
        data = {
            kind: 'individual',
            cnpj: '12345678000199',
            ie: '123456789',
            group: 'default',
            type: 'customer',
            generateInvoice: true,
            companyName: 'John Doe Ltda',
            fantasyName: 'John Doe',
            owner: 'John Doe',
            headquarters: '123 Main St, City, State, ZIP',
        };
        await prisma.client.deleteMany();
    });
    afterAll(async () => {
        await prisma.client.deleteMany();
    });
    it('should be defined', () => {
        expect(sut).toBeDefined();
    });
    it('should throw an error when client does not exist', async () => {
        const clientId = 'non-existing-client-id';
        expect.assertions(1);
        return sut.execute(clientId, {}).catch((error) => {
            expect(error).toBeInstanceOf(client_not_found_1.ClientNotFoundError);
        });
    });
    it('should throw an error when cnpj is already used by another client', async () => {
        await createClient.execute(data);
        const client2 = await createClient.execute({ ...data, cnpj: '98765432000188', ie: '987654321' });
        const editData = {
            cnpj: data.cnpj,
        };
        expect.assertions(1);
        return sut.execute(client2.id, editData).catch((error) => {
            expect(error).toBeInstanceOf(duplicate_cnpj_error_1.ClientDuplicateCnpjError);
        });
    });
    it('should throw an error when ie is already used by another client', async () => {
        await createClient.execute(data);
        const client2 = await createClient.execute({ ...data, cnpj: '98765432000188', ie: '987654321' });
        const editData = {
            ie: data.ie,
        };
        expect.assertions(1);
        return sut.execute(client2.id, editData).catch((error) => {
            expect(error).toBeInstanceOf(duplicate_ie_error_1.ClientDuplicateIeError);
        });
    });
    it('should not throw an error when cnpj and ie are unchanged', async () => {
        const client = await createClient.execute(data);
        const editData = {
            companyName: 'New Company Name',
        };
        await expect(sut.execute(client.id, editData)).resolves.toBeDefined();
    });
    it('should not throw an error when cnpj is "changed" but remains the same', async () => {
        const client = await createClient.execute(data);
        const editData = {
            cnpj: data.cnpj,
        };
        await expect(sut.execute(client.id, editData)).resolves.toBeDefined();
    });
    it('should not throw an error when ie is "changed" but remains the same', async () => {
        const client = await createClient.execute(data);
        const editData = {
            ie: '123456789',
        };
        await expect(sut.execute(client.id, editData)).resolves.toBeDefined();
    });
    it('should not edit anything when no data is provided', async () => {
        const client = await createClient.execute(data);
        await sut.execute(client.id, {});
        const editedClient = await findClientById.execute(client.id);
        expect(editedClient).toEqual({
            id: client.id,
            active: true,
            createdAt: editedClient.createdAt,
            updatedAt: editedClient.updatedAt,
            ...data,
        });
    });
    it('should edit a client successfully', async () => {
        const client = await createClient.execute(data);
        const editData = {
            kind: 'contract',
            group: 'vip',
            companyName: 'John Doe Enterprises',
            cnpj: '11223344556677',
            ie: '9988776655',
        };
        await sut.execute(client.id, editData);
        const editedClient = await findClientById.execute(client.id);
        expect(editedClient).toEqual({
            id: client.id,
            kind: editData.kind ?? data.kind,
            cnpj: editData.cnpj ?? data.cnpj,
            ie: editData.ie ?? data.ie,
            group: editData.group ?? data.group,
            type: editData.type ?? data.type,
            generateInvoice: editData.generateInvoice ?? data.generateInvoice,
            companyName: editData.companyName ?? data.companyName,
            fantasyName: editData.fantasyName ?? data.fantasyName,
            owner: editData.owner ?? data.owner,
            headquarters: editData.headquarters ?? data.headquarters,
            active: true,
            createdAt: editedClient.createdAt,
            updatedAt: editedClient.updatedAt,
        });
    });
    it('should return success message upon successful edit', async () => {
        const client = await createClient.execute(data);
        const editData = {
            companyName: 'New Company Name',
        };
        const result = await sut.execute(client.id, editData);
        expect(result).toEqual({ message: 'Cliente editado com sucesso!' });
    });
});
//# sourceMappingURL=edit-client.service.spec.js.map