---
name: Delete Relationship Checks
overview: Implementar checagens de relacionamentos nos usecases de delete dos 7 módulos que ainda não possuem validação, seguindo o padrão de ClientGroup/ClientOwner, para evitar erros P2003 do Prisma.
todos: []
isProject: false
---

# Plano: Checagens de Relacionamentos nos Usecases de Delete

## Padrão de referência (ClientGroup / ClientOwner)

1. **Erro de domínio**: `*InUseError` extends `AppException` com status 409
2. **Método de contagem no DAO**: `countXByYId(id: number): Promise<number>`
3. **UseCase**: Após `findById`, chama o count; se > 0, lança o erro antes do `delete`

## Módulos que já possuem validação (não alterar)

- **ClientGroup** – `countClientsByGroupId` + `ClientGroupInUseError`
- **ClientOwner** – `countClientsByOwnerId` + `ClientOwnerInUseError`
- **ClientDepartment** – `countContactsByDepartmentId` + `ClientDepartmentInUseError`

## Módulos a implementar (7 no total)

### 1. ClientAddress

**Relação**: `ClientInvoiceConfig.billingAddressId` → `ClientAddress`

- Criar `ClientAddressInUseError` (usado como endereço de faturamento)
- Adicionar `countInvoiceConfigsByBillingAddressId(billingAddressId: number)` em `IClientAddressRepository` e implementação Prisma
- No `DeleteClientAddress`: injetar repositório, chamar o count antes do delete e lançar o erro se > 0

**Nota**: Já existe `ClientMainAddressCannotBeDeletedError`; a nova checagem é complementar.

---

### 2. ClientAttendanceType

**Relação**: `ClientType.clientAttendanceTypeId` → `ClientAttendanceType`

- Criar `ClientAttendanceTypeInUseError`
- Adicionar `countClientTypesByAttendanceTypeId(attendanceTypeId: number)` em `IClientAttendanceTypeDao` e implementação Prisma
- Atualizar `DeleteClientAttendanceType` com a checagem

---

### 3. ClientMaintenanceTicketType

**Relação**: `ClientType.clientMaintenanceTicketTypeId` → `ClientMaintenanceTicketType`

- Criar `ClientMaintenanceTicketTypeInUseError`
- Adicionar `countClientTypesByMaintenanceTicketTypeId(maintenanceTicketTypeId: number)` em `IClientMaintenanceTicketTypeDao` e implementação Prisma
- Atualizar `DeleteClientMaintenanceTicketType` com a checagem

---

### 4. ClientSystemType

**Relação**: `ClientType.clientSystemTypeId` → `ClientSystemType`

- Criar `ClientSystemTypeInUseError`
- Adicionar `countClientTypesBySystemTypeId(systemTypeId: number)` em `IClientSystemTypeDao` e implementação Prisma
- Atualizar `DeleteClientSystemType` com a checagem

---

### 5. ClientDescriptionType

**Relação**: `ClientType.clientDescriptionTypeId` → `ClientDescriptionType`

- Criar `ClientDescriptionTypeInUseError`
- Adicionar `countClientTypesByDescriptionTypeId(descriptionTypeId: number)` em `IClientDescriptionTypeDao` e implementação Prisma
- Atualizar `DeleteClientDescriptionType` com a checagem

---

### 6. ClientDriveType

**Relação**: `ClientType.clientDriveTypeId` → `ClientDriveType`

- Criar `ClientDriveTypeInUseError`
- Adicionar `countClientTypesByDriveTypeId(driveTypeId: number)` em `IClientDriveTypeDao` e implementação Prisma
- Atualizar `DeleteClientDriveType` com a checagem

---

### 7. CnaeNbsIndop

**Relação**: `ClientItem.cnaeNbsIndopId` → `CnaeNbsIndop`

- Criar `CnaeNbsIndopInUseError`
- Adicionar `countClientItemsByCnaeNbsIndopId(cnaeNbsIndopId: number)` em `ICnaeNbsIndopDao` e implementação Prisma
- Atualizar `DeleteCnaeNbsIndop` com a checagem

---

## Estrutura de cada implementação

**Erro** (ex.: `client-attendance-type-in-use.error.ts`):

```typescript
export class ClientAttendanceTypeInUseError extends AppException {
  constructor() {
    super('Não é possível excluir pois existem tipos de cliente vinculados.', 409);
    this.name = 'ClientAttendanceTypeInUseError';
  }
}
```

**DAO** (interface + implementação Prisma):

```typescript
countClientTypesByAttendanceTypeId(attendanceTypeId: number): Promise<number>;
// Implementação: prisma.clientType.count({ where: { clientAttendanceTypeId } })
```

**UseCase** (após `findById` e antes do `delete`):

```typescript
const count = await this.dao.countClientTypesByAttendanceTypeId(id);
if (count > 0) {
  throw new ClientAttendanceTypeInUseError();
}
```

---

## Testes

Para cada módulo:

1. **Integration (dao.spec.ts ou repository.spec.ts)**: testar o método de count com dados reais
2. **Integration (service integration spec)**: cenário em que a exclusão é bloqueada por registros vinculados

---

## Ordem sugerida de implementação

1. ClientAddress (Repository)
2. CnaeNbsIndop
3. ClientAttendanceType
4. ClientMaintenanceTicketType
5. ClientSystemType
6. ClientDescriptionType
7. ClientDriveType

