# Phase 2: Implement CASL Authorization

## Prerequisites

Phase 1 analysis report must be complete and confirmed by the user.

## Step 1: Install Dependencies

```bash
npm install @casl/ability
```

`@casl/nestjs` is optional — the custom integration below is more flexible for the hybrid static/dynamic claims model. Only install it if the project already uses it or the user specifically requests it.

## Step 2: Determine File Placement

Based on the architecture detected in Phase 1, place CASL files in the appropriate location. Here are the conventions:

**Flat modules pattern:**
```
src/
├── casl/
│   ├── casl.module.ts
│   ├── casl-ability.factory.ts
│   ├── claims.guard.ts
│   ├── roles.guard.ts
│   ├── decorators/
│   │   ├── require-claims.decorator.ts
│   │   └── require-role.decorator.ts
│   ├── enums/
│   │   ├── roles.enum.ts
│   │   └── claims.enum.ts
│   ├── interfaces/
│   │   └── claims-payload.interface.ts
│   └── constants/
│       └── static-claims.ts
```

**Clean architecture pattern:**
```
src/
├── domain/
│   ├── enums/
│   │   ├── roles.enum.ts
│   │   └── claims.enum.ts
│   └── interfaces/
│       └── claims-payload.interface.ts
├── application/
│   └── authorization/
│       ├── casl-ability.factory.ts
│       └── constants/
│           └── static-claims.ts
├── infrastructure/
│   └── authorization/
│       ├── casl.module.ts
│       ├── guards/
│       │   ├── claims.guard.ts
│       │   └── roles.guard.ts
│       └── decorators/
│           ├── require-claims.decorator.ts
│           └── require-role.decorator.ts
```

**DDD pattern:**
```
src/
├── shared/
│   └── authorization/
│       ├── casl.module.ts
│       ├── casl-ability.factory.ts
│       ├── guards/
│       ├── decorators/
│       ├── enums/
│       ├── interfaces/
│       └── constants/
```

Adapt to whatever pattern the project actually uses. The key rule: authorization is a cross-cutting concern and should live in a shared/common area, not inside a specific feature module.

## Step 3: Define Roles Enum

Use the roles discovered in Phase 1. Example:

```typescript
export enum Role {
  ADMIN = 'admin',
  SELLER = 'seller',
  MANAGER = 'manager',
  // ... other roles from Phase 1
}
```

If the project already has a roles enum, reuse it. Don't duplicate.

## Step 4: Define Claims Enum

Claims follow the `module:action` pattern. Build this from the endpoint catalog in Phase 1.

```typescript
export enum Claim {
  // Client module
  CLIENT_CREATE = 'client:create',
  CLIENT_LIST = 'client:list',
  CLIENT_READ = 'client:read',
  CLIENT_UPDATE = 'client:update',
  CLIENT_DELETE = 'client:delete',

  // Seller module
  SELLER_CREATE = 'seller:create',
  SELLER_LIST = 'seller:list',
  // ... all claims derived from endpoint catalog
}
```

Every endpoint that requires authorization must have a corresponding claim.

## Step 5: Define Static Claims Map

This maps non-admin roles to their fixed set of claims. These are loaded into memory at startup and only change with a new deploy.

```typescript
import { Role } from '../enums/roles.enum';
import { Claim } from '../enums/claims.enum';

export const STATIC_CLAIMS: Record<Exclude<Role, Role.ADMIN>, Claim[]> = {
  [Role.SELLER]: [
    Claim.CLIENT_LIST,
    Claim.CLIENT_READ,
    Claim.SELLER_LIST,
    Claim.SELLER_READ,
    // ... claims appropriate for sellers
  ],
  [Role.MANAGER]: [
    Claim.CLIENT_LIST,
    Claim.CLIENT_READ,
    Claim.CLIENT_CREATE,
    Claim.SELLER_LIST,
    Claim.SELLER_READ,
    // ... claims appropriate for managers
  ],
};
```

Present this mapping to the user for validation — only they know the exact business rules.

## Step 6: Create the Ability Factory

This is the core of the CASL integration. It builds abilities differently based on whether the role uses static or dynamic claims.

```typescript
import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
  InferSubjects,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';

// The actions correspond to the part after ":" in claims
type Action = 'create' | 'list' | 'read' | 'update' | 'delete' | 'manage';

// The subjects correspond to the part before ":" in claims
type Subject = 'client' | 'seller' | 'product' | 'all'; // ... derived from modules

export type AppAbility = MongoAbility<[Action, Subject]>;

@Injectable()
export class CaslAbilityFactory {
  constructor(
    // Inject the service/repository that fetches dynamic claims from DB
    // Only needed if admin claims come from database
    // private readonly permissionService: PermissionService,
  ) {}

  async createForUser(user: { id: string; role: Role; claims?: string[] }): Promise<AppAbility> {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user.role === Role.ADMIN) {
      // Dynamic claims: loaded from user object (which got them from DB)
      // The claims array comes from the JWT payload or a DB lookup
      const claims = user.claims ?? [];
      this.applyClaims(can, claims);
    } else {
      // Static claims: loaded from in-memory constants
      const claims = STATIC_CLAIMS[user.role] ?? [];
      this.applyClaims(can, claims);
    }

    return build();
  }

  private applyClaims(
    can: AbilityBuilder<AppAbility>['can'],
    claims: string[],
  ): void {
    for (const claim of claims) {
      const [subject, action] = claim.split(':');
      if (subject && action) {
        can(action as Action, subject as Subject);
      }
    }
  }
}
```

### Important decision: Where do admin claims come from?

There are two strategies. Discuss with the user which fits better:

**Strategy A — Claims in JWT**: Admin claims are stored in the JWT payload at login time. Faster (no DB query per request) but requires token refresh to pick up claim changes.

**Strategy B — Claims from DB per request**: Admin claims are fetched from the database on every request. Always up-to-date but adds a DB query to every request. Can be mitigated with short-lived caching (e.g., 30-60 seconds).

If the user wants real-time claim updates (a frontend toggle that takes effect immediately), Strategy B with caching is the way to go.

## Step 7: Create the Claims Guard

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from './casl-ability.factory';
import { CLAIMS_KEY } from './decorators/require-claims.decorator';

@Injectable()
export class ClaimsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredClaims = this.reflector.getAllAndOverride<string[]>(CLAIMS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no claims are required, allow access (public or role-only endpoint)
    if (!requiredClaims || requiredClaims.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No authenticated user found');
    }

    const ability = await this.caslAbilityFactory.createForUser(user);

    const hasAllClaims = requiredClaims.every((claim) => {
      const [subject, action] = claim.split(':');
      return ability.can(action, subject);
    });

    if (!hasAllClaims) {
      throw new ForbiddenException(
        `Missing required claims: ${requiredClaims.join(', ')}`,
      );
    }

    return true;
  }
}
```

## Step 8: Create the Roles Guard

This guard operates at the controller level and checks if the user's role matches.

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './decorators/require-role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }

  constructor(private readonly reflector: Reflector) {}
}
```

## Step 9: Create Decorators

**RequireClaims decorator:**
```typescript
import { SetMetadata } from '@nestjs/common';

export const CLAIMS_KEY = 'required_claims';
export const RequireClaims = (...claims: string[]) =>
  SetMetadata(CLAIMS_KEY, claims);
```

**RequireRole decorator:**
```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/roles.enum';

export const ROLES_KEY = 'required_roles';
export const RequireRole = (...roles: Role[]) =>
  SetMetadata(ROLES_KEY, roles);
```

**Public decorator** (skip auth entirely):
```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

## Step 10: Create the CASL Module

```typescript
import { Module, Global } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory';
import { ClaimsGuard } from './claims.guard';
import { RolesGuard } from './roles.guard';

@Global()
@Module({
  providers: [CaslAbilityFactory, ClaimsGuard, RolesGuard],
  exports: [CaslAbilityFactory, ClaimsGuard, RolesGuard],
})
export class CaslModule {}
```

Register it in the root AppModule.

## Step 11: Apply to Controllers

For each controller identified in Phase 1, apply the guards and decorators:

```typescript
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard, ClaimsGuard) // JWT first, then role, then claims
@RequireRole(Role.ADMIN, Role.SELLER) // Roles that can access this controller
export class ClientController {

  @Get()
  @RequireClaims('client:list')
  findAll() { /* ... */ }

  @Post()
  @RequireClaims('client:create')
  create(@Body() dto: CreateClientDto) { /* ... */ }

  @Get(':id')
  @RequireClaims('client:read')
  findOne(@Param('id') id: string) { /* ... */ }

  @Patch(':id')
  @RequireClaims('client:update')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) { /* ... */ }

  @Delete(':id')
  @RequireClaims('client:delete')
  remove(@Param('id') id: string) { /* ... */ }
}
```

Guard execution order matters: `JwtAuthGuard → RolesGuard → ClaimsGuard`. JWT authenticates, role checks controller access, claims check endpoint access.

## Step 12: Database Migration (if needed)

If admin dynamic claims need a new table, create the migration. Example schema:

```
admin_permissions
├── id (PK)
├── user_id (FK → users)
├── claim (string, e.g., "client:create")
├── created_at
└── updated_at
```

Use whatever ORM the project already uses (TypeORM, Prisma, Sequelize, etc.).

## Deliverable

Present a summary of all files created/modified, with their locations. Verify the application compiles with `npm run build`. Then wait for user confirmation before Phase 3.
