# Phase 3: Migrate from Legacy Auth

## Prerequisites

Phase 2 must be complete. The CASL system must be in place and the app must compile successfully.

## Critical Rule

**Authentication ≠ Authorization**

This phase removes ONLY authorization artifacts. The following must NEVER be touched:

- JWT strategy and validation (`JwtStrategy`, `JwtAuthGuard`, token verification)
- Passport configuration and strategies
- Login/register/refresh endpoints
- Session management
- Password hashing/validation
- Token generation and signing
- Auth-related environment variables
- Any middleware that extracts user from token and attaches to `request.user`

If in doubt whether something is authentication or authorization, it's safer to keep it.

## Step-by-Step Migration

### Step 1: Create the Removal Checklist

From the Phase 1 analysis, list every authorization artifact marked as "REPLACE":

```
| # | File | Artifact | Type | CASL Replacement | Status |
|---|------|----------|------|-----------------|--------|
| 1 | src/guards/roles.guard.ts | RolesGuard (old) | Guard | casl/roles.guard.ts | Pending |
| 2 | src/decorators/roles.decorator.ts | @Roles() | Decorator | @RequireRole() | Pending |
| 3 | ... | ... | ... | ... | ... |
```

Every row must have a confirmed CASL replacement before proceeding.

### Step 2: Find All Usages

For each artifact in the checklist, find every file that imports or uses it:

```bash
# Example: find all usages of old RolesGuard
grep -rn "RolesGuard\|roles.guard" src/ --include="*.ts"

# Example: find all usages of old @Roles decorator
grep -rn "@Roles\|from.*roles.decorator" src/ --include="*.ts"
```

Document each usage. These are the files that need import updates.

### Step 3: Replace Usages One by One

For each usage found:

1. Replace the import path to point to the new CASL version
2. Replace the decorator/guard name if it changed
3. Add the appropriate `@RequireClaims()` decorator if the endpoint didn't have claim-level protection before
4. Verify the file compiles individually

Example before:
```typescript
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';

@Controller('clients')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class ClientController {
  @Get()
  findAll() { ... }
}
```

Example after:
```typescript
import { RequireRole } from '../casl/decorators/require-role.decorator';
import { RequireClaims } from '../casl/decorators/require-claims.decorator';
import { RolesGuard } from '../casl/roles.guard';
import { ClaimsGuard } from '../casl/claims.guard';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard, ClaimsGuard)
@RequireRole(Role.ADMIN)
export class ClientController {
  @Get()
  @RequireClaims('client:list')
  findAll() { ... }
}
```

### Step 4: Delete Legacy Files

Only after ALL usages have been replaced, delete the old files:

```bash
# Example — only delete what's confirmed replaced
rm src/guards/roles.guard.ts      # replaced by casl/roles.guard.ts
rm src/decorators/roles.decorator.ts  # replaced by casl/decorators/require-role.decorator.ts
```

### Step 5: Clean Up Module Registrations

Check all `.module.ts` files for references to deleted artifacts:

```bash
grep -rn "RolesGuard\|RolesDecorator\|PermissionGuard" src/ --include="*.module.ts"
```

Remove old providers/imports and ensure the `CaslModule` is properly imported where needed (it should be `@Global()` so it only needs to be in `AppModule`).

### Step 6: Clean Dead Code

```bash
# Find unused imports (if using ESLint)
npx eslint src/ --rule '{"no-unused-vars": "error", "@typescript-eslint/no-unused-imports": "error"}' --fix

# Or manually search for orphaned references
grep -rn "import.*from.*auth\|import.*from.*guard\|import.*from.*decorator" src/ --include="*.ts" | grep -v "casl\|jwt\|passport"
```

### Step 7: Verify

1. **Compile check**: `npm run build` — must succeed with zero errors
2. **Start check**: `npm run start:dev` — app must start without runtime errors
3. **Smoke test**: If the project has existing tests, run them: `npm test`
4. **No legacy references**: Run a final grep to ensure nothing references the old auth:

```bash
# This should return empty (adjust patterns to match the old system's naming)
grep -rn "OldRolesGuard\|@OldRoles\|legacy.*guard\|old.*permission" src/ --include="*.ts"
```

## Rollback Plan

If something goes wrong during migration:
- Git: the user can revert to the commit before Phase 3 started
- Recommend the user commits after Phase 2 (CASL working alongside old system) before starting Phase 3

Suggest to the user: "I recommend committing the current state (Phase 2 complete) before we start removing the old auth system, so you have a safe rollback point."

## Deliverable

Present a migration summary:
- Files deleted (with their replacements)
- Files modified (with what changed)
- Confirmation that `npm run build` passes
- Any warnings or notes

Wait for user confirmation before proceeding to Phase 4.
