# Phase 4: Create Rigorous Tests

## Prerequisites

Phases 1-3 complete. The CASL system is in place and legacy auth has been removed. The app compiles and starts.

## Testing Strategy

Tests are organized in four layers, from isolated units to full integration. Use whatever test framework the project already uses (Jest is the default for NestJS).

### Layer 1: Unit Tests — CaslAbilityFactory

Test the core logic: given a user with a specific role and claims, does the factory produce the correct abilities?

**File**: Place next to the factory, e.g., `casl-ability.factory.spec.ts`

```typescript
describe('CaslAbilityFactory', () => {
  // --- Static Claims (non-admin roles) ---

  describe('static claims for non-admin roles', () => {
    it('should grant seller all claims defined in STATIC_CLAIMS[seller]', async () => {
      const user = { id: '1', role: Role.SELLER };
      const ability = await factory.createForUser(user);

      // For each claim in STATIC_CLAIMS[Role.SELLER], verify it's allowed
      for (const claim of STATIC_CLAIMS[Role.SELLER]) {
        const [subject, action] = claim.split(':');
        expect(ability.can(action, subject)).toBe(true);
      }
    });

    it('should deny seller claims NOT in STATIC_CLAIMS[seller]', async () => {
      const user = { id: '1', role: Role.SELLER };
      const ability = await factory.createForUser(user);

      // Find a claim that sellers DON'T have
      // e.g., if sellers can't delete clients
      expect(ability.can('delete', 'client')).toBe(false);
    });

    it('should handle every non-admin role without errors', async () => {
      const nonAdminRoles = Object.values(Role).filter(r => r !== Role.ADMIN);
      for (const role of nonAdminRoles) {
        const user = { id: '1', role };
        const ability = await factory.createForUser(user);
        expect(ability).toBeDefined();
      }
    });
  });

  // --- Dynamic Claims (admin) ---

  describe('dynamic claims for admin role', () => {
    it('should grant admin only the claims provided in user.claims', async () => {
      const user = {
        id: '1',
        role: Role.ADMIN,
        claims: ['client:create', 'client:list'],
      };
      const ability = await factory.createForUser(user);

      expect(ability.can('create', 'client')).toBe(true);
      expect(ability.can('list', 'client')).toBe(true);
      expect(ability.can('delete', 'client')).toBe(false);
    });

    it('should grant admin no claims when claims array is empty', async () => {
      const user = { id: '1', role: Role.ADMIN, claims: [] };
      const ability = await factory.createForUser(user);

      expect(ability.can('create', 'client')).toBe(false);
      expect(ability.can('list', 'client')).toBe(false);
    });

    it('should grant admin no claims when claims is undefined', async () => {
      const user = { id: '1', role: Role.ADMIN };
      const ability = await factory.createForUser(user);

      expect(ability.can('create', 'client')).toBe(false);
    });

    it('should handle malformed claims gracefully', async () => {
      const user = {
        id: '1',
        role: Role.ADMIN,
        claims: ['invalidclaim', '', 'client:', ':create', 'client:create'],
      };
      const ability = await factory.createForUser(user);

      // Only the valid claim should work
      expect(ability.can('create', 'client')).toBe(true);
    });
  });

  // --- Edge Cases ---

  describe('edge cases', () => {
    it('should produce independent abilities for different users', async () => {
      const admin = { id: '1', role: Role.ADMIN, claims: ['client:create'] };
      const seller = { id: '2', role: Role.SELLER };

      const adminAbility = await factory.createForUser(admin);
      const sellerAbility = await factory.createForUser(seller);

      // Verify they don't leak into each other
      // (This tests that AbilityBuilder creates fresh instances)
    });

    it('should not grant unknown roles any claims', async () => {
      const user = { id: '1', role: 'nonexistent' as Role };
      const ability = await factory.createForUser(user);

      expect(ability.can('create', 'client')).toBe(false);
    });
  });
});
```

### Layer 2: Unit Tests — Guards

**ClaimsGuard tests** (`claims.guard.spec.ts`):

```typescript
describe('ClaimsGuard', () => {
  it('should allow access when no claims are required', async () => { ... });

  it('should allow access when user has all required claims', async () => { ... });

  it('should deny access when user is missing one required claim', async () => { ... });

  it('should deny access when user is missing all required claims', async () => { ... });

  it('should deny access when no user is present on request', async () => { ... });

  it('should handle multiple required claims (all must be present)', async () => { ... });
});
```

**RolesGuard tests** (`roles.guard.spec.ts`):

```typescript
describe('RolesGuard', () => {
  it('should allow access when no roles are required', () => { ... });

  it('should allow access when user role matches required role', () => { ... });

  it('should allow access when user role matches one of multiple required roles', () => { ... });

  it('should deny access when user role does not match any required role', () => { ... });

  it('should deny access when no user is present on request', () => { ... });
});
```

To test guards, mock the `ExecutionContext` and `Reflector`:

```typescript
const mockExecutionContext = {
  switchToHttp: () => ({
    getRequest: () => ({ user: mockUser }),
  }),
  getHandler: () => ({}),
  getClass: () => ({}),
} as unknown as ExecutionContext;

const mockReflector = {
  getAllAndOverride: jest.fn(),
};
```

### Layer 3: Unit Tests — Decorators

Verify that decorators set the correct metadata:

```typescript
describe('RequireClaims decorator', () => {
  it('should set claims metadata on handler', () => {
    @Controller()
    class TestController {
      @RequireClaims('client:create', 'client:list')
      @Get()
      test() {}
    }

    const metadata = Reflect.getMetadata(CLAIMS_KEY, TestController.prototype.test);
    expect(metadata).toEqual(['client:create', 'client:list']);
  });
});

describe('RequireRole decorator', () => {
  it('should set role metadata on handler', () => {
    @Controller()
    class TestController {
      @RequireRole(Role.ADMIN, Role.SELLER)
      @Get()
      test() {}
    }

    const metadata = Reflect.getMetadata(ROLES_KEY, TestController.prototype.test);
    expect(metadata).toEqual([Role.ADMIN, Role.SELLER]);
  });
});
```

### Layer 4: Integration Tests (e2e)

These test the full request pipeline. Place in the project's e2e test directory (usually `test/`).

**Setup**: Create a helper that generates JWT tokens for different roles:

```typescript
function createTestToken(role: Role, claims?: string[]): string {
  return jwtService.sign({
    sub: 'test-user-id',
    role,
    claims: claims ?? [],
  });
}
```

**Test scenarios per controller** — for each controller in the system, create a test file:

```typescript
describe('ClientController (e2e)', () => {
  // --- Access Control by Role ---

  it('should allow admin to access /clients', () => {
    return request(app.getHttpServer())
      .get('/clients')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200); // or 403 if admin lacks client:list claim
  });

  it('should deny unauthenticated access to /clients', () => {
    return request(app.getHttpServer())
      .get('/clients')
      .expect(401);
  });

  it('should deny seller access to admin-only controller', () => {
    return request(app.getHttpServer())
      .get('/admin-panel/settings') // example admin-only route
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(403);
  });

  // --- Access Control by Claims ---

  it('should allow admin WITH client:create claim to POST /clients', () => {
    const token = createTestToken(Role.ADMIN, ['client:create']);
    return request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send(validClientDto)
      .expect(201);
  });

  it('should deny admin WITHOUT client:create claim from POST /clients', () => {
    const token = createTestToken(Role.ADMIN, ['client:list']); // has list, not create
    return request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send(validClientDto)
      .expect(403);
  });

  // --- Security Edge Cases ---

  it('should deny access with expired token', () => { ... });

  it('should deny access with tampered token', () => { ... });

  it('should deny access with valid token but nonexistent role', () => { ... });

  it('should handle concurrent requests with different claim sets', async () => {
    const [res1, res2] = await Promise.all([
      request(app.getHttpServer())
        .get('/clients')
        .set('Authorization', `Bearer ${adminWithListToken}`),
      request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${adminWithCreateToken}`)
        .send(validClientDto),
    ]);
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(201);
  });
});
```

### Security-Focused Test Scenarios

These must always be included regardless of the specific project:

```typescript
describe('Authorization Security', () => {
  it('should not allow role escalation via JWT manipulation', () => { ... });

  it('should not allow claim injection via request headers', () => { ... });

  it('should not leak authorization error details to unauthorized users', () => {
    // Error message should be generic, not reveal which specific claim was missing
  });

  it('should enforce claims even when role check passes', () => {
    // Role = ADMIN but no claims → should be denied at endpoint level
  });

  it('should deny all access for unknown roles', () => { ... });

  it('should handle empty string claims gracefully', () => { ... });

  it('should handle claims with extra colons gracefully', () => {
    // e.g., "client:create:extra" should not grant access
  });
});
```

### Dynamic Claims Tests (Admin-specific)

If the project uses Strategy B (claims from DB):

```typescript
describe('Dynamic Admin Claims', () => {
  it('should reflect newly added claims without server restart', async () => {
    // 1. Create admin with no claims
    // 2. Verify access denied
    // 3. Add claim to database
    // 4. Verify access granted on next request
  });

  it('should reflect removed claims without server restart', async () => {
    // 1. Create admin with client:create claim
    // 2. Verify access granted
    // 3. Remove claim from database
    // 4. Verify access denied on next request
  });

  it('should handle database unavailability gracefully', async () => {
    // Simulate DB failure → admin should be denied (fail-closed)
  });
});
```

## Test Naming Convention

Every test must read like a specification. Use this pattern:

```
should [expected behavior] when [condition]
```

Examples:
- `should deny access when seller tries to access admin controller`
- `should allow admin with client:create claim to create a client`
- `should deny admin without client:create claim even though role is admin`
- `should reflect dynamic claim changes without server restart`
- `should fail closed when database is unavailable for admin claims`

## Running Tests

```bash
# Unit tests
npm test -- --testPathPattern="casl"

# e2e tests
npm run test:e2e -- --testPathPattern="authorization"

# Coverage
npm test -- --coverage --testPathPattern="casl"
```

Aim for 100% coverage on the CASL module (factory, guards, decorators). For e2e, aim for at least one test per endpoint × role combination.

## Deliverable

Present:
- Total tests created
- Coverage percentage for the CASL module
- All tests passing confirmation
- Any tests that were intentionally skipped and why
