# Phase 1: Analyze the Existing Codebase

## Step-by-Step Analysis Checklist

### 1. Map the Project Structure

Run a tree of the `src/` directory to understand the architecture:

```bash
find src/ -type f -name "*.ts" | head -100
```

Identify which pattern the project follows:
- **Flat modules**: `src/users/`, `src/auth/`, `src/products/`
- **Clean architecture**: `src/domain/`, `src/application/`, `src/infrastructure/`
- **DDD**: `src/modules/users/domain/`, `src/modules/users/application/`
- **Hexagonal**: `src/core/`, `src/adapters/`, `src/ports/`
- **Other**: document whatever pattern you find

This determines where CASL files will be placed in Phase 2.

### 2. Inventory the Existing Auth System

Search for all auth-related code:

```bash
# Guards
grep -rn "CanActivate\|@UseGuards\|implements CanActivate" src/ --include="*.ts"

# Decorators
grep -rn "@SetMetadata\|createParamDecorator\|Roles\|Permissions\|Public" src/ --include="*.ts"

# Strategies (Passport)
grep -rn "PassportStrategy\|@Injectable" src/ --include="*.strategy.ts"

# Middleware
grep -rn "NestMiddleware\|implements NestMiddleware" src/ --include="*.ts"

# Auth-related modules
grep -rn "AuthModule\|AuthGuard\|JwtGuard\|RolesGuard" src/ --include="*.ts"
```

For each artifact found, classify it:
- **Authentication** (keep): JWT validation, Passport strategies, login/register endpoints, token refresh
- **Authorization** (replace): role checks, permission guards, access control decorators, role-based route protection

### 3. Catalog All Roles

```bash
# Find role definitions
grep -rn "enum.*Role\|role.*enum\|ADMIN\|SELLER\|VENDEDOR\|MANAGER\|USER" src/ --include="*.ts" -i

# Check database seeds or migrations for roles
grep -rn "role" src/ --include="*.seed.ts" --include="*.migration.ts" -i
```

Build a table:

| Role | Type | Claims Source | Description |
|------|------|--------------|-------------|
| admin | dynamic | database | Full access, configurable per user |
| seller | static | memory | Fixed set of sales-related claims |
| ... | ... | ... | ... |

### 4. Catalog All Endpoints

```bash
# Find all controllers and their routes
grep -rn "@Controller\|@Get\|@Post\|@Put\|@Patch\|@Delete" src/ --include="*.controller.ts"
```

Build a table for each controller:

| Controller | Route | Method | Current Protection | Required Claim |
|-----------|-------|--------|-------------------|----------------|
| ClientController | /clients | GET | @Roles('admin') | client:list |
| ClientController | /clients | POST | @Roles('admin') | client:create |
| ... | ... | ... | ... | ... |

The "Required Claim" column should be proposed based on the route's purpose following the `module:action` pattern. Present this to the user for validation.

### 5. Database Schema

```bash
# Check for ORM entities/models related to auth
grep -rn "class.*Entity\|@Entity\|@Table\|model " src/ --include="*.ts" --include="*.prisma" | grep -i "user\|role\|permission\|auth"

# If Prisma, check schema
find . -name "schema.prisma" -exec cat {} \;

# If TypeORM, find entities
find src/ -name "*.entity.ts" | xargs grep -l "role\|permission" -i
```

Document:
- User entity/model (fields relevant to auth)
- Role entity/model (if exists)
- Permission entity/model (if exists)
- Relations between them
- Whether dynamic admin claims storage already exists or needs to be created

### 6. Dependencies Audit

```bash
cat package.json | grep -E "passport|jwt|casl|auth|guard|role|permission|bcrypt|argon"
```

Note what's already installed — particularly if `@casl/ability` or `@casl/nestjs` are already present (partial integration attempt).

### 7. Risk Assessment

Evaluate and document:
- **Breaking changes**: Will existing API consumers be affected?
- **Database migrations needed**: New tables/columns for dynamic claims?
- **Environment variables**: Any new config needed?
- **Complexity**: How tangled is the current auth with business logic?

Rate overall migration complexity: **Low** / **Medium** / **High**

## Deliverable Format

Present the analysis as a structured report. Example:

```
## Analysis Report

### Architecture: Clean Architecture (3-layer)
src/
├── domain/        (entities, value objects)
├── application/   (use cases, DTOs)
├── infrastructure/ (controllers, ORM, guards)

### Auth Inventory
- Authentication (KEEP): JwtStrategy, JwtAuthGuard, AuthService
- Authorization (REPLACE): RolesGuard, @Roles() decorator, role check in middleware

### Roles Found: admin (dynamic), seller (static), manager (static)

### Endpoints: 23 total, 18 protected, 5 public

### Database: TypeORM, User entity has `role` column (string enum)
  - No permissions table exists → migration needed for admin dynamic claims

### Risk: MEDIUM — auth is cleanly separated but no permissions table exists
```

Wait for user confirmation before proceeding to Phase 2.
